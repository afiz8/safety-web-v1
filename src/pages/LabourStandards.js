import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, FaCalendarAlt, FaFileExport, FaCheckCircle, FaTimesCircle, 
  FaBell, FaChartLine, FaFileContract, FaGlobe, FaBook, FaDownload, FaFilter 
} from 'react-icons/fa';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LabourStandards = () => {
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStandard, setSelectedStandard] = useState(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showComplianceForm, setShowComplianceForm] = useState(false);
  const [complianceData, setComplianceData] = useState({ status: 'non-compliant', evidence: '', notes: '' });
  const [userCompliance, setUserCompliance] = useState({});
  const [session] = useState({ userId: 'user123', name: 'Pengguna Demo' }); // ganti dengan session dari context

  // Fetch data
  useEffect(() => {
    fetchStandards();
    fetchComplianceRecords();
  }, []);

  const fetchStandards = async () => {
    try {
      let url = 'http://localhost:5000/api/labour-standards?';
      if (searchTerm) url += `search=${searchTerm}&`;
      if (yearMin) url += `yearMin=${yearMin}&`;
      if (yearMax) url += `yearMax=${yearMax}&`;
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal fetch');
      const data = await res.json();
      setStandards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceRecords = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/compliance-records?userId=${session.userId}`);
      const data = await res.json();
      const map = {};
      data.forEach(rec => { map[rec.standardId?._id || rec.standardId] = rec; });
      setUserCompliance(map);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitCompliance = async (standardId) => {
    try {
      const res = await fetch('http://localhost:5000/api/compliance-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          standardId,
          userId: session.userId,
          companyName: session.name,
          status: complianceData.status,
          evidence: complianceData.evidence,
          notes: complianceData.notes,
          assessedAt: new Date()
        })
      });
      if (!res.ok) throw new Error('Gagal simpan');
      const newRecord = await res.json();
      setUserCompliance(prev => ({ ...prev, [standardId]: newRecord }));
      setShowComplianceForm(false);
      setComplianceData({ status: 'non-compliant', evidence: '', notes: '' });
      alert('Laporan kepatuhan berhasil disimpan');
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message);
    }
  };

  // Filter & Progress
  const filteredStandards = standards; // sudah difilter di backend
  const total = standards.length;
  const ratifiedCount = standards.filter(s => s.status === 'ratified').length;
  const compliancePercent = total ? Math.round((ratifiedCount / total) * 100) : 0;

  // Notifikasi: standar belum diratifikasi
  const notRatified = standards.filter(s => s.status === 'not-ratified');

  // Export
  const csvData = filteredStandards.map(s => ({
    Nomor: s.number,
    Tahun: s.year,
    Judul: s.title,
    Status: s.status === 'ratified' ? 'Diratifikasi' : 'Belum',
    'Tanggal Ratifikasi': s.ratifiedDate || '-'
  }));

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Standar Ketenagakerjaan ILO', 14, 10);
    autoTable(doc, {
      head: [['Nomor', 'Tahun', 'Judul', 'Status']],
      body: filteredStandards.map(s => [s.number, s.year, s.title, s.status === 'ratified' ? 'Diratifikasi' : 'Belum']),
      startY: 20,
    });
    doc.save('labour-standards.pdf');
  };

  const openDetail = (standard) => {
    setSelectedStandard(standard);
    setShowBottomSheet(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/3"></div>
          <div className="h-6 bg-gray-200 rounded w-2/3"></div>
          <div className="grid md:grid-cols-3 gap-6">{/* skeletons */}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">
            <FaGlobe /> Standar Internasional
          </div>
          <h1 className="text-4xl lg:text-6xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
            Standar Ketenagakerjaan ILO
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Konvensi dan rekomendasi ILO yang menjadi acuan keselamatan dan kesehatan kerja di dunia.
          </p>
        </div>

        {/* Progress Bar Compliance */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-700 flex items-center gap-2"><FaChartLine className="text-amber-500"/> Tingkat Ratifikasi</span>
            <span className="text-2xl font-bold text-amber-600">{compliancePercent}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${compliancePercent}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">{ratifiedCount} dari {total} konvensi telah diratifikasi.</p>
        </div>

        {/* Notifikasi Pelanggaran */}
        {notRatified.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <FaBell className="text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700">Perhatian! {notRatified.length} konvensi belum diratifikasi:</p>
                <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                  {notRatified.slice(0, 3).map(s => <li key={s._id}>{s.number} - {s.title}</li>)}
                  {notRatified.length > 3 && <li>+{notRatified.length - 3} lainnya</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md p-5 border border-white/40 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gray-500 block mb-1"><FaSearch className="inline mr-1"/> Cari</label>
              <input 
                type="text" 
                placeholder="Nomor / Judul..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setTimeout(fetchStandards, 300); }}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div className="flex gap-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tahun dari</label>
                <input type="number" placeholder="Min" value={yearMin} onChange={(e) => setYearMin(e.target.value)} className="w-24 px-2 py-2 border rounded-xl" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">ke</label>
                <input type="number" placeholder="Max" value={yearMax} onChange={(e) => setYearMax(e.target.value)} className="w-24 px-2 py-2 border rounded-xl" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-xl bg-white">
                <option value="all">Semua</option>
                <option value="ratified">Diratifikasi</option>
                <option value="not-ratified">Belum</option>
              </select>
            </div>
            <button onClick={fetchStandards} className="px-4 py-2 bg-amber-500 text-white rounded-xl shadow-md hover:bg-amber-600 transition">Terapkan Filter</button>
            <div className="flex gap-2 ml-auto">
              <CSVLink data={csvData} filename="labour-standards.csv" className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition text-sm">
                <FaDownload /> CSV
              </CSVLink>
              <button onClick={exportPDF} className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition text-sm">
                <FaFileExport /> PDF
              </button>
            </div>
          </div>
        </div>

        {/* Grid Card */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStandards.map(standard => (
            <motion.div
              key={standard._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden border border-white/40 hover:shadow-xl transition-all cursor-pointer"
              onClick={() => openDetail(standard)}
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <FaFileContract className="text-white text-xl" />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${standard.status === 'ratified' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {standard.status === 'ratified' ? <FaCheckCircle /> : <FaTimesCircle />}
                    {standard.status === 'ratified' ? 'Diratifikasi' : 'Belum'}
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-amber-600">{standard.number}</span>
                  <span className="text-sm text-gray-400 ml-2">({standard.year})</span>
                </div>
                <h3 className="text-lg font-bold mt-1 text-gray-800">{standard.title}</h3>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{standard.description}</p>
                {standard.status === 'ratified' && <p className="text-xs text-green-600 mt-2">Diratifikasi: {standard.ratifiedDate}</p>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Rekomendasi */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-white/50">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><FaBook className="text-amber-500"/> Rekomendasi ILO</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { number: 'R164', title: 'Keselamatan dan Kesehatan Kerja', year: 1981 },
              { number: 'R194', title: 'Daftar Penyakit Akibat Kerja', year: 2002 },
              { number: 'R197', title: 'Kerangka Promosi K3', year: 2006 },
              { number: 'R192', title: 'Pencegahan Kecelakaan Major', year: 1993 }
            ].map(rec => (
              <div key={rec.number} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">{rec.number}</div>
                <div>
                  <p className="font-semibold">{rec.title}</p>
                  <p className="text-xs text-gray-500">Tahun {rec.year}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Sheet Detail */}
      <AnimatePresence>
        {showBottomSheet && selectedStandard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            onClick={() => setShowBottomSheet(false)}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-6 pb-8 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-3xl font-black text-amber-600">{selectedStandard.number}</span>
                  <span className="text-gray-400 ml-2">({selectedStandard.year})</span>
                </div>
                <button onClick={() => setShowBottomSheet(false)} className="text-gray-400 text-2xl">&times;</button>
              </div>
              <h2 className="text-xl font-bold mt-2">{selectedStandard.title}</h2>
              <p className="text-gray-600 mt-3">{selectedStandard.description}</p>
              {selectedStandard.status === 'ratified' && (
                <p className="text-green-600 text-sm mt-2">Diratifikasi: {selectedStandard.ratifiedDate}</p>
              )}
              <div className="mt-4">
                <p className="font-semibold">Poin penting:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-1">
                  {selectedStandard.keyPoints.map((point, i) => <li key={i}>{point}</li>)}
                </ul>
              </div>

              {/* Tombol lapor kepatuhan */}
              {!userCompliance[selectedStandard._id] && (
                <button
                  onClick={() => setShowComplianceForm(true)}
                  className="mt-6 w-full py-2 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition"
                >
                  Laporkan Kepatuhan
                </button>
              )}
              {userCompliance[selectedStandard._id] && (
                <div className="mt-6 p-3 bg-green-50 rounded-xl text-green-700 text-sm">
                  Status kepatuhan: {userCompliance[selectedStandard._id].status === 'compliant' ? 'Patuh' : userCompliance[selectedStandard._id].status === 'partial' ? 'Sebagian' : 'Tidak patuh'}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Form Compliance */}
      <AnimatePresence>
        {showComplianceForm && selectedStandard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            onClick={() => setShowComplianceForm(false)}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl p-6 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <h3 className="text-xl font-bold text-center">Lapor Kepatuhan</h3>
              <p className="text-center text-gray-500 text-sm">{selectedStandard.title}</p>
              <div className="mt-4 space-y-4">
                <select
                  value={complianceData.status}
                  onChange={(e) => setComplianceData({ ...complianceData, status: e.target.value })}
                  className="w-full p-3 border rounded-xl"
                >
                  <option value="compliant">Patuh</option>
                  <option value="partial">Sebagian Patuh</option>
                  <option value="non-compliant">Tidak Patuh</option>
                </select>
                <textarea
                  placeholder="Bukti / dokumentasi (opsional)"
                  value={complianceData.evidence}
                  onChange={(e) => setComplianceData({ ...complianceData, evidence: e.target.value })}
                  className="w-full p-3 border rounded-xl"
                  rows="2"
                />
                <textarea
                  placeholder="Catatan tambahan"
                  value={complianceData.notes}
                  onChange={(e) => setComplianceData({ ...complianceData, notes: e.target.value })}
                  className="w-full p-3 border rounded-xl"
                  rows="2"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowComplianceForm(false)} className="flex-1 py-2 border rounded-xl">Batal</button>
                <button onClick={() => handleSubmitCompliance(selectedStandard._id)} className="flex-1 py-2 bg-amber-500 text-white rounded-xl">Simpan</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LabourStandards;