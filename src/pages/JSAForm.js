import React, { useState, useContext } from 'react';
import { UserContext } from '../App';

// Data statis
const JOB_TITLES = [
  "Pengelasan", "Pemasangan Scaffolding", "Pengecatan", "Penggalian Tanah",
  "Pemasangan Listrik", "Pengangkatan Beban", "Pekerjaan Ketinggian", "Lainnya"
];
const LOCATIONS = ["Area Produksi", "Gudang", "Workshop", "Lapangan Depan", "Atap", "Basement"];
const TEAM_MEMBERS_LIST = ["Budi S.", "Ani W.", "Joko P.", "Siti R.", "Agus H.", "Dewi K."];

const JSAForm = () => {
  const { saveAssessment, session } = useContext(UserContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    jobTitle: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    teamMembers: [],
    hazards: [{ id: Date.now(), description: '', likelihood: 'Low', severity: 'Low', initialRisk: 'Low', controls: '', residualRisk: 'Low' }],
    overallRisk: 'Low',
    supervisorApproval: '',
    additionalNotes: '',
  });
  const [submittedData, setSubmittedData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTeamPicker, setShowTeamPicker] = useState(false);

  const updateHazard = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      hazards: prev.hazards.map(h => {
        if (h.id !== id) return h;
        const updated = { ...h, [field]: value };
        if (field === 'likelihood' || field === 'severity') {
          const riskMap = { Low: 1, Medium: 3, High: 5 };
          const score = riskMap[updated.likelihood] * riskMap[updated.severity];
          updated.initialRisk = score <= 4 ? 'Low' : score <= 12 ? 'Medium' : 'High';
          updated.residualRisk = updated.initialRisk === 'High' ? 'Medium' : updated.initialRisk === 'Medium' ? 'Low' : 'Low';
        }
        return updated;
      })
    }));
  };

  const addHazard = () => {
    setFormData(prev => ({
      ...prev,
      hazards: [...prev.hazards, { id: Date.now(), description: '', likelihood: 'Low', severity: 'Low', initialRisk: 'Low', controls: '', residualRisk: 'Low' }]
    }));
  };

  const deleteHazard = (id) => {
    if (formData.hazards.length === 1) return;
    setFormData(prev => ({ ...prev, hazards: prev.hazards.filter(h => h.id !== id) }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const dataToSend = {
      ...formData,
      teamMembers: formData.teamMembers.join(', '),
      // HAPUS atau ubah baris berikut:
      // status: formData.overallRisk,   // <-- HAPUS INI
      // Atau bisa diganti dengan:
      status: 'Pending',                 // <-- TAMBAHKAN (opsional)
      userId: session?.userId || 'anonymous',
      submittedAt: new Date()
    };
    try {
      await saveAssessment(dataToSend);
      setSubmittedData(dataToSend);
      localStorage.setItem('jsms_jsa_latest', JSON.stringify(dataToSend));
    } catch (error) {
      alert('Gagal menyimpan JSA. Periksa koneksi ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const RiskBadge = ({ level }) => {
    const color = {
      Low: 'bg-emerald-100 text-emerald-700',
      Medium: 'bg-amber-100 text-amber-700',
      High: 'bg-rose-100 text-rose-700'
    }[level];
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{level === 'Low' ? 'Rendah' : level === 'Medium' ? 'Sedang' : 'Tinggi'}</span>;
  };

  const stepLabels = ["Lokasi & Tim", "Identifikasi Bahaya", "Matriks Risiko", "Persetujuan"];

  if (submittedData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md">
          <div className="text-7xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800">JSA Berhasil Disubmit!</h2>
          <p className="text-gray-600 mt-2">{submittedData.jobTitle} - {submittedData.location}</p>
          <div className="my-4"><RiskBadge level={submittedData.overallRisk} /></div>
          <button onClick={() => window.location.reload()} className="mt-4 bg-indigo-500 text-white px-6 py-2 rounded-full shadow-md active:scale-95 transition">📝 Buat JSA Baru</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header + Stepper */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">🔍 Job Safety Analysis</h1>
          <div className="flex justify-between mt-4">
            {stepLabels.map((label, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${currentStep > idx+1 ? 'bg-emerald-500 text-white' : currentStep === idx+1 ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
                  {currentStep > idx+1 ? '✓' : idx+1}
                </div>
                <span className="text-[11px] mt-1 text-gray-500 hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${(currentStep/4)*100}%` }}></div>
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-5 border border-white/50">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📋 Judul Pekerjaan</label>
                <select value={formData.jobTitle} onChange={(e) => setFormData(p => ({ ...p, jobTitle: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-indigo-300">
                  <option value="">Pilih pekerjaan...</option>
                  {JOB_TITLES.map(job => <option key={job}>{job}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📍 Lokasi</label>
                <select value={formData.location} onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl bg-white shadow-sm">
                  <option value="">Pilih lokasi...</option>
                  {LOCATIONS.map(loc => <option key={loc}>{loc}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📅 Tanggal</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-xl shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">👥 Anggota Tim</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.teamMembers.map(m => (
                    <span key={m} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">{m} <button onClick={() => setFormData(p => ({ ...p, teamMembers: p.teamMembers.filter(t => t !== m) }))} className="text-red-400 hover:text-red-600">×</button></span>
                  ))}
                </div>
                <button onClick={() => setShowTeamPicker(!showTeamPicker)} className="text-indigo-600 text-sm font-medium">+ Tambah anggota</button>
                {showTeamPicker && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl grid grid-cols-2 gap-2">
                    {TEAM_MEMBERS_LIST.filter(m => !formData.teamMembers.includes(m)).map(m => (
                      <button key={m} onClick={() => setFormData(p => ({ ...p, teamMembers: [...p.teamMembers, m] }))} className="text-left px-3 py-2 bg-white rounded-lg shadow-sm text-sm hover:bg-indigo-50 transition">{m}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">⚠️ Daftar Bahaya</h3>
                <button onClick={addHazard} className="bg-emerald-500 text-white px-3 py-2 rounded-xl text-sm shadow-md active:scale-95 transition">+ Tambah</button>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {formData.hazards.map((h, idx) => (
                  <div key={h.id} className="bg-white rounded-2xl shadow-md border p-4 space-y-3">
                    <div className="flex justify-between"><span className="font-semibold">Bahaya #{idx+1}</span>{formData.hazards.length > 1 && <button onClick={() => deleteHazard(h.id)} className="text-gray-400 hover:text-red-500">🗑️</button>}</div>
                    <input type="text" placeholder="Deskripsi bahaya (contoh: Ketinggian, Listrik)" value={h.description} onChange={(e) => updateHazard(h.id, 'description', e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={h.likelihood} onChange={(e) => updateHazard(h.id, 'likelihood', e.target.value)} className="p-2 bg-yellow-50 rounded-lg text-sm">
                        <option value="Low">Kemungkinan: Rendah</option><option value="Medium">Sedang</option><option value="High">Tinggi</option>
                      </select>
                      <select value={h.severity} onChange={(e) => updateHazard(h.id, 'severity', e.target.value)} className="p-2 bg-red-50 rounded-lg text-sm">
                        <option value="Low">Keparahan: Ringan</option><option value="Medium">Sedang</option><option value="High">Kritis</option>
                      </select>
                    </div>
                    <div className="flex justify-between text-sm bg-gray-50 p-2 rounded-xl"><span>Risiko awal: <RiskBadge level={h.initialRisk} /></span><span>Setelah kontrol: <RiskBadge level={h.residualRisk} /></span></div>
                    <input type="text" placeholder="Kontrol (PPE, prosedur)" value={h.controls} onChange={(e) => updateHazard(h.id, 'controls', e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-blue-50 p-4 rounded-2xl">
                <h3 className="font-bold mb-2">📊 Matriks Risiko</h3>
                <div className="grid grid-cols-4 text-center text-xs font-bold mb-1"><div></div><div>Low</div><div>Medium</div><div>High</div></div>
                {['Low','Medium','High'].map(lik => (
                  <div key={lik} className="grid grid-cols-4 text-center text-xs mb-1">
                    <div className="font-medium">{lik}</div>
                    {['Low','Medium','High'].map(sev => {
                      const score = {Low:1,Medium:3,High:5}[lik] * {Low:1,Medium:3,High:5}[sev];
                      const color = score<=4 ? 'bg-emerald-200' : score<=12 ? 'bg-amber-200' : 'bg-rose-200';
                      return <div key={sev} className={`${color} p-1 rounded`}>{score}</div>;
                    })}
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl shadow p-5">
                <label className="block font-semibold mb-2">Risiko Keseluruhan</label>
                <div className="flex gap-2">
                  {['Low','Medium','High'].map(r => (
                    <button key={r} onClick={() => setFormData(p => ({ ...p, overallRisk: r }))} className={`flex-1 py-2 rounded-full font-bold transition-all active:scale-95 ${formData.overallRisk === r ? (r==='Low'?'bg-emerald-500 text-white shadow':r==='Medium'?'bg-amber-500 text-white':'bg-rose-500 text-white') : 'bg-gray-100 text-gray-500'}`}>
                      {r==='Low'?'🟢 Rendah':r==='Medium'?'🟡 Sedang':'🔴 Tinggi'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  {formData.overallRisk === 'Low' && '✅ Pekerjaan dapat dilanjutkan.'}
                  {formData.overallRisk === 'Medium' && '⚠️ Perlu review tambahan.'}
                  {formData.overallRisk === 'High' && '🛑 STOP! Mitigasi lebih lanjut.'}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow p-5">
                <label className="block font-semibold mb-2">📝 Catatan Tambahan</label>
                <textarea rows="2" value={formData.additionalNotes} onChange={(e) => setFormData(p => ({ ...p, additionalNotes: e.target.value }))} className="w-full p-3 border rounded-xl" placeholder="Opsional..."></textarea>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {currentStep === 4 && (
            <div className="text-center space-y-5 animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="text-5xl mb-3">🛡️</div>
                <h3 className="text-xl font-bold">Persetujuan Supervisor</h3>
                <input type="text" placeholder="Nama Supervisor" value={formData.supervisorApproval} onChange={(e) => setFormData(p => ({ ...p, supervisorApproval: e.target.value }))} className="w-full mt-4 p-3 border border-dashed rounded-xl text-center" />
                <div className="flex justify-center gap-6 mt-6 text-sm text-gray-600"><span>✅ Team</span><span>✅ Supervisor</span><span>✅ HSE</span></div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-4 border-t">
            <button onClick={() => setCurrentStep(s => s-1)} disabled={currentStep === 1} className="px-5 py-2 rounded-full bg-gray-100 text-gray-600 disabled:opacity-40 transition-all active:scale-95">← Sebelumnya</button>
            {currentStep < 4 ? (
              <button onClick={() => setCurrentStep(s => s+1)} className="px-5 py-2 rounded-full bg-indigo-500 text-white shadow-md active:scale-95 transition-all">Selanjutnya →</button>
            ) : (
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 rounded-full bg-emerald-500 text-white font-semibold shadow-md disabled:opacity-50 transition-all active:scale-95">{isSubmitting ? 'Menyimpan...' : '✅ Submit JSA'}</button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default JSAForm;