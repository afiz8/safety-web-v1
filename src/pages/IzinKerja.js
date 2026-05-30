// src/pages/IzinKerja.js
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';
import ShareButton from '../components/ShareButton';

const API_URL = 'http://localhost:5000/api/izin'; // Sesuaikan dengan endpoint Anda

const IzinKerja = () => {
  const { session, notifications, setNotifications } = useContext(UserContext);
  const [permits, setPermits] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('semua');
  const [stats, setStats] = useState({ pending: 0, approved: 0, highRisk: 0 });
  
  // Form state
  const [form, setForm] = useState({
    jenis: '',
    lokasi: '',
    deskripsi: '',
    riskLevel: 'Low',
    status: 'Menunggu',
    approver: '',
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalSelesai: '',
    expiry: '',
    namaPekerja: ''
  });

  // Daftar pilihan
  const jenisOptions = ['Hot Work', 'Cold Work', 'Confined Space', 'Electrical', 'Lifting', 'Ketinggian', 'Ruang Terbatas', 'Pengelasan', 'Listrik', 'Pengeboran', 'Lainnya'];
  const riskOptions = ['Low', 'Medium', 'High'];

  // Step definisi
  const steps = [
    { title: 'Informasi Dasar', fields: ['jenis', 'lokasi', 'namaPekerja'] },
    { title: 'Waktu & Risiko', fields: ['tanggalMulai', 'tanggalSelesai', 'riskLevel', 'expiry'] },
    { title: 'Detail Pekerjaan', fields: ['deskripsi', 'approver'] }
  ];

  // Validasi per step
  const validateStep = (step) => {
    switch(step) {
      case 0:
        if (!form.jenis) { alert('Pilih jenis pekerjaan'); return false; }
        if (!form.lokasi) { alert('Isi lokasi pekerjaan'); return false; }
        return true;
      case 1:
        if (!form.tanggalMulai) { alert('Pilih tanggal mulai'); return false; }
        if (!form.tanggalSelesai) { alert('Pilih tanggal selesai'); return false; }
        if (new Date(form.tanggalMulai) > new Date(form.tanggalSelesai)) {
          alert('Tanggal selesai harus setelah tanggal mulai');
          return false;
        }
        return true;
      case 2:
        if (!form.deskripsi) { alert('Deskripsi pekerjaan wajib diisi'); return false; }
        return true;
      default: return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  const prevStep = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

  // Fetch data
  const fetchIzin = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Gagal memuat data');
      const data = await res.json();
      setPermits(data);
      updateStats(data);
    } catch (error) {
      console.error(error);
      alert('Gagal memuat data izin kerja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIzin(); }, []);

  const updateStats = (data) => {
    const pending = data.filter(p => p.status === 'Menunggu' || p.status === 'Draft').length;
    const approved = data.filter(p => p.status === 'Disetujui').length;
    const highRisk = data.filter(p => p.riskLevel === 'High').length;
    setStats({ pending, approved, highRisk });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      jenis: '',
      lokasi: '',
      deskripsi: '',
      riskLevel: 'Low',
      status: 'Menunggu',
      approver: '',
      tanggalMulai: new Date().toISOString().split('T')[0],
      tanggalSelesai: '',
      expiry: '',
      namaPekerja: ''
    });
    setEditingId(null);
    setCurrentStep(0);
  };

  const submitIzin = async (e) => {
    e.preventDefault();
    if (!validateStep(2)) return;
    setSubmitting(true);
    const newPermit = {
      id: editingId || Date.now(),
      ...form,
      status: editingId ? form.status : 'Menunggu',
      pengaju: session.userId,
      tanggalPengajuan: new Date().toISOString()
    };
    try {
      if (editingId) {
        const res = await fetch(`${API_URL}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPermit)
        });
        if (!res.ok) throw new Error('Gagal update');
        const updated = await res.json();
        setPermits(permits.map(p => p.id === editingId ? updated : p));
        setNotifications([{ id: Date.now(), message: `Izin ${newPermit.jenis} status diubah ke ${newPermit.status}`, date: new Date().toISOString(), read: false }, ...notifications]);
        setEditingId(null);
      } else {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPermit)
        });
        if (!res.ok) throw new Error('Gagal simpan');
        const saved = await res.json();
        setPermits([saved, ...permits]);
        setNotifications([{ id: Date.now(), message: `Pengajuan izin baru: ${newPermit.jenis} di ${newPermit.lokasi}`, date: new Date().toISOString(), read: false }, ...notifications]);
      }
      resetForm();
      updateStats(permits);
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan, coba lagi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (permit) => {
    setForm(permit);
    setEditingId(permit.id);
    setCurrentStep(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus izin kerja ini?')) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setPermits(permits.filter(p => p.id !== id));
    } catch (error) {
      alert('Gagal hapus data');
    }
  };

  const handleApproval = async (id, statusBaru) => {
    const permit = permits.find(p => p.id === id);
    if (!permit) return;
    const updatedPermit = { ...permit, status: statusBaru, approver: session.role === 'Admin' ? 'Admin' : session.role };
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPermit)
      });
      if (!res.ok) throw new Error('Gagal update status');
      const updated = await res.json();
      setPermits(permits.map(p => p.id === id ? updated : p));
      setNotifications([{ id: Date.now(), message: `Izin ${permit.jenis} di ${permit.lokasi} ${statusBaru === 'Disetujui' ? 'disetujui' : 'ditolak'}`, date: new Date().toISOString(), read: false }, ...notifications]);
    } catch (error) {
      alert('Gagal mengubah status');
    }
  };

  const filteredPermits = filterStatus === 'semua' ? permits : permits.filter(p => p.status === filterStatus);
  const isAdminOrSupervisor = session.role === 'Admin' || session.role === 'Supervisor';
  const shareMessage = `Izin Kerja JSMS\nTotal: ${permits.length}\nMenunggu: ${stats.pending}\nDisetujui: ${stats.approved}\nHigh Risk: ${stats.highRisk}`;

  if (loading) return <div className="flex justify-center items-center h-64 text-gray-500">Memuat data izin kerja...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header iOS Style */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              📜 Izin Kerja (PTW)
            </h1>
            <p className="text-gray-500 text-sm mt-1">Permohonan & persetujuan pekerjaan berisiko</p>
          </div>
          <ShareButton title="Izin Kerja JSMS" text={shareMessage} buttonText="Bagikan Izin" />
        </div>

        {/* Kartu Statistik dengan Glass Effect */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-md border border-white/30">
            <div className="flex items-center justify-between">
              <span className="text-yellow-600 text-sm font-semibold">Menunggu</span>
              <span className="text-3xl font-bold text-yellow-700">{stats.pending}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Perlu persetujuan</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-md border border-white/30">
            <div className="flex items-center justify-between">
              <span className="text-green-600 text-sm font-semibold">Disetujui</span>
              <span className="text-3xl font-bold text-green-700">{stats.approved}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Aktif</div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 shadow-md border border-white/30">
            <div className="flex items-center justify-between">
              <span className="text-red-600 text-sm font-semibold">High Risk</span>
              <span className="text-3xl font-bold text-red-700">{stats.highRisk}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Perlu perhatian khusus</div>
          </div>
        </div>

        {/* Form Card dengan Stepper */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 md:p-8">
            {/* Stepper Indicator */}
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, idx) => (
                <div key={idx} className="flex-1 relative">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                      idx === currentStep ? 'bg-blue-500 text-white shadow-md' :
                      idx < currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {idx < currentStep ? '✓' : idx + 1}
                    </div>
                    <span className="text-xs font-medium mt-2 text-gray-600 hidden sm:block">{step.title}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2 ${
                      idx < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={submitIzin}>
              {/* Step 0 */}
              {currentStep === 0 && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Pekerjaan <span className="text-red-500">*</span></label>
                    <select name="jenis" value={form.jenis} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition" required>
                      <option value="">Pilih jenis</option>
                      {jenisOptions.map(j => <option key={j}>{j}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Lokasi <span className="text-red-500">*</span></label>
                    <input type="text" name="lokasi" value={form.lokasi} onChange={handleChange} placeholder="Area / gedung / lantai" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Pekerja / Kontraktor</label>
                    <input type="text" name="namaPekerja" value={form.namaPekerja} onChange={handleChange} placeholder="Opsional" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" />
                  </div>
                </div>
              )}

              {/* Step 1 */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Mulai <span className="text-red-500">*</span></label>
                      <input type="date" name="tanggalMulai" value={form.tanggalMulai} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Selesai <span className="text-red-500">*</span></label>
                      <input type="date" name="tanggalSelesai" value={form.tanggalSelesai} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Tingkat Risiko</label>
                      <div className="flex gap-3">
                        {riskOptions.map(risk => (
                          <label key={risk} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="riskLevel" value={risk} checked={form.riskLevel === risk} onChange={handleChange} className="w-4 h-4 text-blue-500" />
                            <span className={`text-sm font-medium ${risk === 'High' ? 'text-red-600' : risk === 'Medium' ? 'text-yellow-600' : 'text-green-600'}`}>{risk}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Kadaluarsa (opsional)</label>
                      <input type="date" name="expiry" value={form.expiry} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Pekerjaan & Kontrol Risiko <span className="text-red-500">*</span></label>
                    <textarea name="deskripsi" value={form.deskripsi} onChange={handleChange} rows="4" placeholder="Jelaskan pekerjaan, potensi bahaya, dan tindakan pengendalian..." className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Approver (opsional)</label>
                    <input type="text" name="approver" value={form.approver} onChange={handleChange} placeholder="Nama yang memberikan persetujuan" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" />
                  </div>
                  {editingId && isAdminOrSupervisor && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Status (Admin/Supervisor)</label>
                      <select name="status" value={form.status} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl">
                        <option>Menunggu</option>
                        <option>Disetujui</option>
                        <option>Ditolak</option>
                        <option>Selesai</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-10 pt-4 border-t border-gray-100">
                <button type="button" onClick={prevStep} disabled={currentStep === 0} className={`px-6 py-2 rounded-full font-medium transition ${currentStep === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  Kembali
                </button>
                {currentStep < steps.length - 1 ? (
                  <button type="button" onClick={nextStep} className="px-6 py-2 rounded-full bg-blue-500 text-white font-medium shadow-sm hover:bg-blue-600 transition">
                    Lanjut
                  </button>
                ) : (
                  <button type="submit" disabled={submitting} className="px-8 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50">
                    {submitting ? 'Menyimpan...' : (editingId ? 'Update Izin' : 'Ajukan Izin')}
                  </button>
                )}
              </div>
            </form>

            {editingId && (
              <div className="mt-4 text-center">
                <button type="button" onClick={resetForm} className="text-sm text-gray-500 underline hover:text-gray-700">Batal Edit</button>
              </div>
            )}
          </div>
        </div>

        {/* Filter & Tabel / Card List (iOS Style) */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {['semua', 'Menunggu', 'Disetujui', 'Ditolak', 'Selesai', 'Draft'].map(st => (
              <button key={st} onClick={() => setFilterStatus(st)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                filterStatus === st ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-gray-600 shadow-sm hover:bg-gray-100'
              }`}>
                {st === 'semua' ? 'Semua' : st}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-500 bg-white/60 px-3 py-1 rounded-full">Total: {permits.length} izin</div>
        </div>

        {/* Daftar Izin - Card View (Modern) */}
        <div className="space-y-4">
          {permits.length === 0 ? (
            <div className="text-center py-20 bg-white/40 backdrop-blur-sm rounded-3xl">
              <span className="text-6xl block mb-4">📄</span>
              <h3 className="text-xl font-semibold text-gray-600">Belum ada Izin Kerja</h3>
              <p className="text-gray-400 text-sm">Ajukan izin melalui formulir di atas</p>
            </div>
          ) : (
            filteredPermits.map(permit => (
              <div key={permit.id} className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-5 border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg text-gray-800">{permit.jenis}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        permit.riskLevel === 'High' ? 'bg-red-100 text-red-700' :
                        permit.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>{permit.riskLevel}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        permit.status === 'Disetujui' ? 'bg-green-100 text-green-700' :
                        permit.status === 'Ditolak' ? 'bg-red-100 text-red-700' :
                        permit.status === 'Selesai' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{permit.status}</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div><span className="font-medium">Lokasi:</span> {permit.lokasi}</div>
                      <div><span className="font-medium">Tanggal:</span> {permit.tanggalMulai} s/d {permit.tanggalSelesai}</div>
                      {permit.namaPekerja && <div><span className="font-medium">Pekerja:</span> {permit.namaPekerja}</div>}
                      <div className="mt-1 text-gray-500 text-xs line-clamp-2">{permit.deskripsi}</div>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col justify-end gap-2 items-center">
                    <button onClick={() => handleEdit(permit)} className="text-sm text-blue-500 font-medium px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100">Edit</button>
                    {isAdminOrSupervisor && (permit.status === 'Menunggu' || permit.status === 'Draft') && (
                      <>
                        <button onClick={() => handleApproval(permit.id, 'Disetujui')} className="text-sm text-green-600 font-medium px-3 py-1 rounded-full bg-green-50 hover:bg-green-100">Setujui</button>
                        <button onClick={() => handleApproval(permit.id, 'Ditolak')} className="text-sm text-red-600 font-medium px-3 py-1 rounded-full bg-red-50 hover:bg-red-100">Tolak</button>
                      </>
                    )}
                    <button onClick={() => handleDelete(permit.id)} className="text-sm text-gray-500 font-medium px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200">Hapus</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default IzinKerja;