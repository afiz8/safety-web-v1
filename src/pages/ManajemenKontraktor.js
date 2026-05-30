import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBuilding, FaUser, FaPhone, FaCalendarAlt, FaStar, FaStarHalfAlt,
  FaFileUpload, FaPlus, FaEdit, FaTrash, FaEye, FaQrcode, FaChartLine,
  FaSearch, FaFilter, FaTimes, FaCheckCircle, FaExclamationTriangle,
  FaMoon, FaSun, FaDownload, FaFilePdf, FaFileImage, FaClipboardList
} from 'react-icons/fa';
import { UserContext } from '../App';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const ManajemenKontraktor = () => {
  const { session, notifications, setNotifications, darkMode, toggleDarkMode } = useContext(UserContext);
  const [mitraList, setMitraList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedMitra, setSelectedMitra] = useState(null);
  const [showInduksi, setShowInduksi] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [formData, setFormData] = useState({
    namaPerusahaan: '',
    bidangUsaha: '',
    pic: '',
    nomorKontak: '',
    tanggalMulai: '',
    tanggalAkhir: '',
    statusKualifikasi: 'Terdaftar',
    dokumen: [],
    ratingK3: 5,
    komentarK3: '',
    blacklist: false
  });
  const [editingId, setEditingId] = useState(null);
  const [induksiChecklist, setInduksiChecklist] = useState([]);
  const [uploading, setUploading] = useState(false);

  const API_BASE = 'http://localhost:5000';

  const checklistItems = [
    'Pengenalan Site & Prosedur Umum',
    'K3 Pertamina & JSMS',
    'Identifikasi Bahaya & Pengendalian',
    'APD & Work Permit',
    'Emergency Response & Evakuasi',
    'Penggunaan Alat Berat',
    'Laporan Insiden & Near Miss'
  ];

  // Fetch mitra kerja dari backend
  const fetchMitra = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/mitra-kerja`);
      if (res.ok) {
        const data = await res.json();
        setMitraList(data);
      }
    } catch (err) {
      console.error('Gagal fetch mitra kerja:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMitra();
  }, []);

  // Auto notifikasi kontrak habis
  useEffect(() => {
    mitraList.forEach(mitra => {
      const endDate = new Date(mitra.tanggalAkhir);
      const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft === 7 && !mitra.blacklist) {
        const msg = `📅 Kontrak ${mitra.namaPerusahaan} berakhir H-7!`;
        if (!notifications?.some(n => n.message === msg)) {
          sendNotification(msg);
        }
      } else if (daysLeft === 3 && !mitra.blacklist) {
        const msg = `⚠️ Kontrak ${mitra.namaPerusahaan} berakhir H-3!`;
        if (!notifications?.some(n => n.message === msg)) {
          sendNotification(msg);
        }
      } else if (daysLeft === 1 && !mitra.blacklist) {
        const msg = `🔴 Kontrak ${mitra.namaPerusahaan} berakhir BESOK!`;
        if (!notifications?.some(n => n.message === msg)) {
          sendNotification(msg);
        }
      }
      
      if (mitra.blacklist) {
        const msg = `🚫 ${mitra.namaPerusahaan} masuk daftar hitam!`;
        if (!notifications?.some(n => n.message === msg)) {
          sendNotification(msg);
        }
      }
    });
  }, [mitraList]);

  const sendNotification = async (message) => {
    try {
      await fetch(`${API_BASE}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, read: false, date: new Date().toISOString() })
      });
      setNotifications?.(prev => [{ id: Date.now(), message, date: new Date().toISOString(), read: false }, ...prev]);
    } catch (err) {
      console.error('Gagal kirim notifikasi:', err);
    }
  };

  const uploadFiles = async (files) => {
    setUploading(true);
    const formDataUpload = new FormData();
    for (let i = 0; i < files.length; i++) {
      formDataUpload.append('files', files[i]);
    }
    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formDataUpload
      });
      if (res.ok) {
        const data = await res.json();
        return data.files.map(f => f.url);
      }
      return [];
    } catch (err) {
      console.error('Upload gagal:', err);
      return [];
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let url = `${API_BASE}/api/mitra-kerja`;
      let method = 'POST';
      if (editingId) {
        url = `${API_BASE}/api/mitra-kerja/${editingId}`;
        method = 'PUT';
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await fetchMitra();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          namaPerusahaan: '', bidangUsaha: '', pic: '', nomorKontak: '',
          tanggalMulai: '', tanggalAkhir: '', statusKualifikasi: 'Terdaftar',
          dokumen: [], ratingK3: 5, komentarK3: '', blacklist: false
        });
      }
    } catch (err) {
      console.error('Gagal simpan:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus mitra kerja ini?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/mitra-kerja/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchMitra();
        setShowDetail(false);
      }
    } catch (err) {
      console.error('Gagal hapus:', err);
    }
  };

  const openDetail = (mitra) => {
    setSelectedMitra(mitra);
    setShowDetail(true);
  };

  const openEdit = (mitra) => {
    setEditingId(mitra._id);
    setFormData({
      namaPerusahaan: mitra.namaPerusahaan,
      bidangUsaha: mitra.bidangUsaha || '',
      pic: mitra.pic || '',
      nomorKontak: mitra.nomorKontak || '',
      tanggalMulai: mitra.tanggalMulai?.split('T')[0] || '',
      tanggalAkhir: mitra.tanggalAkhir?.split('T')[0] || '',
      statusKualifikasi: mitra.blacklist ? 'Diblacklist' : (mitra.statusKualifikasi || 'Terdaftar'),
      dokumen: mitra.dokumen || [],
      ratingK3: mitra.ratingK3 || 5,
      komentarK3: mitra.komentarK3 || '',
      blacklist: mitra.blacklist || false
    });
    setShowForm(true);
    setShowDetail(false);
  };

  const toggleInduksi = (mitraId) => {
    if (showInduksi === mitraId) {
      setShowInduksi(null);
    } else {
      setShowInduksi(mitraId);
      const existing = induksiChecklist.find(ic => ic.mitraId === mitraId);
      if (!existing) {
        setInduksiChecklist([...induksiChecklist, { 
          mitraId, 
          items: checklistItems.map(item => ({ name: item, checked: false })) 
        }]);
      }
    }
  };

  const updateChecklistItem = (mitraId, index, checked) => {
    setInduksiChecklist(induksiChecklist.map(ic =>
      ic.mitraId === mitraId
        ? { ...ic, items: ic.items.map((item, i) => i === index ? { ...item, checked } : item) }
        : ic
    ));
  };

  const getStatusColor = (status, blacklist) => {
    if (blacklist) return 'bg-red-100 text-red-700';
    if (status === 'Disetujui') return 'bg-green-100 text-green-700';
    if (status === 'Terdaftar') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Filter data
  const filteredMitra = mitraList.filter(m => {
    const matchSearch = m.namaPerusahaan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        m.pic?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || 
                        (statusFilter === 'blacklist' ? m.blacklist : 
                         (statusFilter === 'approved' ? m.statusKualifikasi === 'Disetujui' :
                          m.statusKualifikasi === statusFilter));
    const matchRating = ratingFilter === 0 || m.ratingK3 >= ratingFilter;
    return matchSearch && matchStatus && matchRating;
  });

  // Chart data
  const chartData = [
    { name: 'Rating 5', value: mitraList.filter(m => m.ratingK3 === 5).length },
    { name: 'Rating 4', value: mitraList.filter(m => m.ratingK3 === 4).length },
    { name: 'Rating 3', value: mitraList.filter(m => m.ratingK3 === 3).length },
    { name: 'Rating 1-2', value: mitraList.filter(m => m.ratingK3 <= 2).length },
  ].filter(c => c.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  const stats = {
    total: mitraList.length,
    aktif: mitraList.filter(m => !m.blacklist && m.statusKualifikasi === 'Disetujui').length,
    blacklist: mitraList.filter(m => m.blacklist).length,
    kontrakHabis: mitraList.filter(m => {
      const daysLeft = Math.ceil((new Date(m.tanggalAkhir) - new Date()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7 && daysLeft > 0 && !m.blacklist;
    }).length,
    rataRating: mitraList.length ? (mitraList.reduce((sum, m) => sum + m.ratingK3, 0) / mitraList.length).toFixed(1) : 0
  };

  const canEdit = session?.role === 'Admin' || session?.role === 'Supervisor';
  const canDelete = session?.role === 'Admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-6 px-4 transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50/20'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent'}`}>
              Manajemen Mitra Kerja
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Kelola kontraktor dan mitra kerja
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}
            >
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            {canEdit && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormData({ namaPerusahaan: '', bidangUsaha: '', pic: '', nomorKontak: '', tanggalMulai: '', tanggalAkhir: '', statusKualifikasi: 'Terdaftar', dokumen: [], ratingK3: 5, komentarK3: '', blacklist: false });
                  setShowForm(true);
                }}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                <FaPlus /> Tambah Mitra
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaBuilding className="text-orange-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.total}</p>
            <p className="text-xs text-gray-500">Total Mitra</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaCheckCircle className="text-green-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.aktif}</p>
            <p className="text-xs text-gray-500">Aktif</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaExclamationTriangle className="text-red-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.blacklist}</p>
            <p className="text-xs text-gray-500">Blacklist</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaCalendarAlt className="text-yellow-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.kontrakHabis}</p>
            <p className="text-xs text-gray-500">Kontrak H-7</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaStar className="text-yellow-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.rataRating}</p>
            <p className="text-xs text-gray-500">Rata Rating</p>
          </div>
        </div>

        {/* Chart Section */}
        {chartData.length > 0 && (
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaChartLine className="text-orange-500" /> Distribusi Rating K3
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name}) => name}>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filter & Search */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`} />
            <input
              type="text"
              placeholder="Cari nama perusahaan atau PIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-300 outline-none transition ${
                darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'
              }`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
          >
            <option value="all">Semua Status</option>
            <option value="Terdaftar">Terdaftar</option>
            <option value="Disetujui">Disetujui</option>
            <option value="blacklist">Blacklist</option>
          </select>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(parseInt(e.target.value))}
            className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
          >
            <option value={0}>Semua Rating</option>
            <option value={5}>Rating 5</option>
            <option value={4}>Rating 4+</option>
            <option value={3}>Rating 3+</option>
          </select>
        </div>

        {/* Card Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMitra.map((mitra, idx) => {
            const daysLeft = Math.ceil((new Date(mitra.tanggalAkhir) - new Date()) / (1000 * 60 * 60 * 24));
            const isExpiring = daysLeft <= 7 && daysLeft > 0 && !mitra.blacklist;
            return (
              <motion.div
                key={mitra._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                className={`rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer ${
                  darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white/80 backdrop-blur border border-white/40'
                } ${mitra.blacklist ? 'border-l-4 border-l-red-500' : isExpiring ? 'border-l-4 border-l-yellow-500' : ''}`}
                onClick={() => openDetail(mitra)}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <FaBuilding className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{mitra.namaPerusahaan}</h3>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{mitra.bidangUsaha || '-'}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(mitra.statusKualifikasi, mitra.blacklist)}`}>
                      {mitra.blacklist ? 'BLACKLIST' : mitra.statusKualifikasi}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <FaUser className="text-gray-400 text-xs" />
                      <span>PIC: {mitra.pic || '-'}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <FaPhone className="text-gray-400 text-xs" />
                      <span>{mitra.nomorKontak || '-'}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <FaCalendarAlt className="text-gray-400 text-xs" />
                      <span>Akhir: {new Date(mitra.tanggalAkhir).toLocaleDateString()}</span>
                      {isExpiring && <span className="text-xs text-red-500 ml-auto">H-{daysLeft}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={`text-xs ${i < mitra.ratingK3 ? 'text-yellow-500' : 'text-gray-300'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filteredMitra.length === 0 && (
            <div className={`col-span-full text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Belum ada data mitra kerja. {canEdit && 'Klik "Tambah Mitra" untuk menambahkan.'}
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {editingId ? 'Edit Mitra' : 'Tambah Mitra Baru'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" placeholder="Nama Perusahaan *" value={formData.namaPerusahaan} onChange={(e) => setFormData({...formData, namaPerusahaan: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} required />
                <input type="text" placeholder="Bidang Usaha" value={formData.bidangUsaha} onChange={(e) => setFormData({...formData, bidangUsaha: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <input type="text" placeholder="PIC" value={formData.pic} onChange={(e) => setFormData({...formData, pic: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <input type="tel" placeholder="Nomor Kontak" value={formData.nomorKontak} onChange={(e) => setFormData({...formData, nomorKontak: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <input type="date" value={formData.tanggalMulai} onChange={(e) => setFormData({...formData, tanggalMulai: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} required />
                <input type="date" value={formData.tanggalAkhir} onChange={(e) => setFormData({...formData, tanggalAkhir: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} required />
                <select value={formData.statusKualifikasi} onChange={(e) => setFormData({...formData, statusKualifikasi: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option value="Terdaftar">Terdaftar</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Diblacklist">Diblacklist</option>
                </select>
                <div>
                  <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Rating K3 (1-5)</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button" onClick={() => setFormData({...formData, ratingK3: n})}
                        className={`p-2 rounded-lg transition ${formData.ratingK3 >= n ? 'text-yellow-500' : 'text-gray-300'}`}>
                        <FaStar />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea placeholder="Komentar K3" value={formData.komentarK3} onChange={(e) => setFormData({...formData, komentarK3: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="2" />
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.blacklist} onChange={(e) => setFormData({...formData, blacklist: e.target.checked})} />
                  <span>Daftar Hitam (Blacklist)</span>
                </label>
                <div>
                  <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Dokumen Pendukung</label>
                  <input type="file" multiple onChange={async (e) => {
                    const urls = await uploadFiles(Array.from(e.target.files));
                    setFormData({...formData, dokumen: [...formData.dokumen, ...urls]});
                  }} className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} />
                  {formData.dokumen.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">{formData.dokumen.length} file terupload</div>
                  )}
                </div>
                <button type="submit" disabled={uploading} className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition">
                  {uploading ? 'Uploading...' : (editingId ? 'Update' : 'Simpan')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Detail */}
      <AnimatePresence>
        {showDetail && selectedMitra && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
            onClick={() => setShowDetail(false)}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className={`relative w-full max-w-lg rounded-t-3xl shadow-2xl p-6 pb-8 max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{selectedMitra.namaPerusahaan}</h2>
                <button onClick={() => setShowDetail(false)} className="text-gray-400"><FaTimes /></button>
              </div>
              <div className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p><span className="font-semibold">Bidang Usaha:</span> {selectedMitra.bidangUsaha || '-'}</p>
                <p><span className="font-semibold">PIC:</span> {selectedMitra.pic || '-'}</p>
                <p><span className="font-semibold">Kontak:</span> {selectedMitra.nomorKontak || '-'}</p>
                <p><span className="font-semibold">Periode:</span> {new Date(selectedMitra.tanggalMulai).toLocaleDateString()} - {new Date(selectedMitra.tanggalAkhir).toLocaleDateString()}</p>
                <p><span className="font-semibold">Rating K3:</span> {'★'.repeat(selectedMitra.ratingK3)}{'☆'.repeat(5-selectedMitra.ratingK3)}</p>
                <p><span className="font-semibold">Komentar K3:</span> {selectedMitra.komentarK3 || '-'}</p>
                <p><span className="font-semibold">Dokumen:</span> {selectedMitra.dokumen?.length || 0} file</p>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => toggleInduksi(selectedMitra._id)} className="flex-1 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition flex items-center justify-center gap-2">
                  <FaClipboardList /> Induksi
                </button>
                {canEdit && (
                  <button onClick={() => openEdit(selectedMitra)} className="flex-1 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition">✏️ Edit</button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(selectedMitra._id)} className="flex-1 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">🗑️ Hapus</button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Induksi */}
      <AnimatePresence>
        {showInduksi && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowInduksi(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`rounded-2xl p-6 w-full max-w-md shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                📋 Induksi Digital
              </h3>
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {mitraList.find(m => m._id === showInduksi)?.namaPerusahaan}
              </p>
              <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                {induksiChecklist.find(ic => ic.mitraId === showInduksi)?.items.map((item, index) => (
                  <label key={index} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                    <input type="checkbox" checked={item.checked} onChange={e => updateChecklistItem(showInduksi, index, e.target.checked)} className="w-4 h-4" />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.name}</span>
                  </label>
                ))}
              </div>
              <button onClick={() => setShowInduksi(null)} className="w-full py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition">
                Simpan & Selesai
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManajemenKontraktor;