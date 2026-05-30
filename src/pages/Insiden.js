import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes, FaLocationArrow, FaCalendarAlt, FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Insiden = () => {
  const { session, setNotifications, notifications } = useContext(UserContext);
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const [form, setForm] = useState({
    title: '',
    jenis: 'Near Miss',
    severity: 'Low',
    deskripsi: '',
    lokasi: '',
    injured: '',
    rootCause: '',
    tindakLanjut: '',
    tanggal: new Date().toISOString().split('T')[0],
    reporter: ''
  });

  // Load data dari backend
  const loadReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/incident-reports`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Gagal load:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      title: '',
      jenis: 'Near Miss',
      severity: 'Low',
      deskripsi: '',
      lokasi: '',
      injured: '',
      rootCause: '',
      tindakLanjut: '',
      tanggal: new Date().toISOString().split('T')[0],
      reporter: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.lokasi || !form.deskripsi) {
      alert('Judul, lokasi, dan deskripsi wajib diisi!');
      return;
    }

    const payload = {
      ...form,
      reporter: form.reporter || session?.username || '',
      pelapor: session?.userId || '',
      createdBy: session?.username || 'anonymous'
    };

    try {
      let response;
      if (editingId) {
        response = await fetch(`${API_BASE}/api/incident-reports/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${API_BASE}/api/incident-reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        await loadReports();
        resetForm();
        setShowForm(false);
        setNotifications([
          {
            _id: Date.now(),
            message: editingId ? `Insiden "${form.title}" diperbarui` : `Laporan insiden baru: ${form.title}`,
            date: new Date().toISOString(),
            read: false
          },
          ...notifications
        ]);
      } else {
        const err = await response.json();
        alert('Gagal menyimpan: ' + (err.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      console.error(err);
      alert('Gagal terhubung ke server');
    }
  };

  const handleEdit = (report) => {
    setForm({
      title: report.title || '',
      jenis: report.jenis || 'Near Miss',
      severity: report.severity || 'Low',
      deskripsi: report.deskripsi || '',
      lokasi: report.lokasi || '',
      injured: report.injured || '',
      rootCause: report.rootCause || '',
      tindakLanjut: report.tindakLanjut || '',
      tanggal: report.tanggal || new Date().toISOString().split('T')[0],
      reporter: report.reporter || ''
    });
    setEditingId(report._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin hapus laporan ini?')) {
      try {
        await fetch(`${API_BASE}/api/incident-reports/${id}`, { method: 'DELETE' });
        loadReports();
      } catch (err) {
        alert('Gagal menghapus');
      }
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setForm({ ...form, lokasi: `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}` }),
        () => alert('Gagal dapat lokasi')
      );
    } else {
      alert('GPS tidak didukung');
    }
  };

  const filteredReports = reports.filter(r => {
    const matchSearch = r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.lokasi?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSeverity = filterSeverity === 'all' || r.severity === filterSeverity;
    return matchSearch && matchSeverity;
  });

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'Low': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'High': return 'bg-orange-100 text-orange-700';
      case 'Fatal': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Memuat data insiden...</p>
        </div>
      </div>
    );
  }

  // Statistik
  const stats = {
    total: reports.length,
    low: reports.filter(r => r.severity === 'Low').length,
    medium: reports.filter(r => r.severity === 'Medium').length,
    high: reports.filter(r => r.severity === 'High').length,
    fatal: reports.filter(r => r.severity === 'Fatal').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950/30">
      {/* Floating Action Button */}
      <button
        onClick={() => { resetForm(); setShowForm(true); }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 group"
      >
        <FaPlus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
            🚨 Laporan Insiden
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Kelola dan pantau semua insiden keselamatan kerja</p>
        </div>

        {/* Stat Cards - iOS Style Glassmorphism */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'from-blue-500 to-blue-600', icon: FaExclamationTriangle },
            { label: 'Low', value: stats.low, color: 'from-green-500 to-green-600', icon: FaShieldAlt },
            { label: 'Medium', value: stats.medium, color: 'from-yellow-500 to-yellow-600', icon: FaShieldAlt },
            { label: 'High + Fatal', value: stats.high + stats.fatal, color: 'from-red-500 to-red-600', icon: FaShieldAlt }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-white/20 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                </div>
                <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-full text-white shadow-md`}>
                  <stat.icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter Bar - Glassmorphism */}
        <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 mb-6 border border-white/30 dark:border-gray-700/30 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari insiden..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/60 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition"
              />
            </div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-2 bg-white/60 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="all">Semua Severity</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Fatal">Fatal</option>
            </select>
          </div>
        </div>

        {/* Card-based List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredReports.map((report) => (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/30 dark:border-gray-700/30 overflow-hidden transition-all duration-200"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex-1">{report.title}</h3>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(report.severity)}`}>
                      {report.severity}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <p className="flex items-center gap-2"><FaLocationArrow className="text-blue-400" /> {report.lokasi}</p>
                    <p className="flex items-center gap-2"><FaCalendarAlt className="text-gray-400" /> {report.tanggal}</p>
                    <p className="line-clamp-2"><span className="font-semibold">Kejadian:</span> {report.deskripsi}</p>
                    {report.tindakLanjut && <p className="line-clamp-1"><span className="font-semibold">Tindakan:</span> {report.tindakLanjut}</p>}
                  </div>
                  <div className="mt-4 flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => handleEdit(report)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(report._id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl mt-6">
            <FaExclamationTriangle className="text-5xl text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada laporan insiden</p>
          </div>
        )}
      </div>

      {/* Modal Form - iOS Style Sheet */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold">{editingId ? 'Edit Insiden' : 'Laporan Baru'}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Judul Insiden *</label>
                  <input type="text" name="title" value={form.title} onChange={handleChange} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Jenis</label>
                    <select name="jenis" value={form.jenis} onChange={handleChange} className="w-full p-3 border rounded-xl">
                      <option>Near Miss</option><option>Minor Injury</option><option>Serious Injury</option><option>Property Damage</option><option>Kebakaran</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Severity</label>
                    <select name="severity" value={form.severity} onChange={handleChange} className="w-full p-3 border rounded-xl">
                      <option>Low</option><option>Medium</option><option>High</option><option>Fatal</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lokasi *</label>
                  <div className="flex gap-2">
                    <input type="text" name="lokasi" value={form.lokasi} onChange={handleChange} className="flex-1 p-3 border rounded-xl" required />
                    <button type="button" onClick={getLocation} className="px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600">📍 GPS</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal</label>
                  <input type="date" name="tanggal" value={form.tanggal} onChange={handleChange} className="w-full p-3 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Deskripsi Kejadian *</label>
                  <textarea name="deskripsi" rows="3" value={form.deskripsi} onChange={handleChange} className="w-full p-3 border rounded-xl" required></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Korban (jika ada)</label>
                  <input type="text" name="injured" value={form.injured} onChange={handleChange} className="w-full p-3 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Root Cause</label>
                  <textarea name="rootCause" rows="2" value={form.rootCause} onChange={handleChange} className="w-full p-3 border rounded-xl"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tindak Lanjut</label>
                  <textarea name="tindakLanjut" rows="2" value={form.tindakLanjut} onChange={handleChange} className="w-full p-3 border rounded-xl"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pelapor</label>
                  <input type="text" name="reporter" value={form.reporter} onChange={handleChange} className="w-full p-3 border rounded-xl" placeholder="Nama pelapor" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border rounded-xl font-semibold">Batal</button>
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition">{editingId ? 'Update' : 'Simpan'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Insiden;