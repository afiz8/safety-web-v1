// src/pages/JamKerjaSelamatForm.js
import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaChartLine, FaClock, FaShieldAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const JamKerjaSelamatForm = () => {
  const { session } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    bulanTahun: '',
    totalJam: '',
    catatan: ''
  });
  const [errors, setErrors] = useState({});
  const [warning, setWarning] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  const canEdit = session?.role === 'Admin' || session?.role === 'Supervisor';

  // Load data
  const loadData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/safe-work-hours`);
      if (!res.ok) {
        const text = await res.text();
        console.error('Server response error:', text);
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Gagal load data:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Validasi real-time
  useEffect(() => {
    validateForm();
  }, [form]);

  const validateForm = () => {
    const newErrors = {};
    if (!form.bulanTahun.trim()) {
      newErrors.bulanTahun = 'Bulan/Tahun wajib diisi';
    } else {
      const regex = /^(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)\s\d{4}$/i;
      const regexAlt = /^\d{4}-\d{2}$/;
      if (!regex.test(form.bulanTahun) && !regexAlt.test(form.bulanTahun)) {
        newErrors.bulanTahun = 'Format: Bulan Tahun (contoh: Jan 2024 atau 2024-01)';
      }
    }
    if (!form.totalJam) {
      newErrors.totalJam = 'Total jam wajib diisi';
    } else {
      const num = Number(form.totalJam);
      if (isNaN(num) || num < 0) newErrors.totalJam = 'Jam harus angka positif';
      else if (num > 1000000) newErrors.totalJam = 'Jam terlalu besar, periksa kembali';
    }
    setErrors(newErrors);

    if (data.length > 0 && form.totalJam && !newErrors.totalJam) {
      const lastJam = data[0]?.totalJam || 0;
      const currentJam = Number(form.totalJam);
      if (lastJam > 0 && currentJam < lastJam * 0.7) {
        setWarning(`⚠️ Penurunan tajam dari bulan lalu (${lastJam.toLocaleString()} jam). Pastikan data benar.`);
      } else {
        setWarning('');
      }
    } else {
      setWarning('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (successMessage) setSuccessMessage('');
  };

  const resetForm = () => {
    setForm({ bulanTahun: '', totalJam: '', catatan: '' });
    setEditingId(null);
    setErrors({});
    setWarning('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      alert('Isian masih ada yang salah. Perbaiki dulu.');
      return;
    }
    if (!form.bulanTahun || !form.totalJam) {
      alert('Bulan/Tahun dan Total Jam wajib diisi');
      return;
    }

    const payload = {
      bulanTahun: form.bulanTahun,
      totalJam: Number(form.totalJam),
      catatan: form.catatan,
      createdBy: session?.username || 'anonymous'
    };

    try {
      let url = `${API_BASE}/api/safe-work-hours`;
      let method = 'POST';
      if (editingId) {
        url = `${API_BASE}/api/safe-work-hours/${editingId}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Coba baca response sebagai teks dulu
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        // Jika bukan JSON, tampilkan error mentah
        throw new Error(`Server error: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan data');
      }

      await loadData();
      resetForm();
      setShowForm(false);
      setSuccessMessage(editingId ? 'Data berhasil diperbarui!' : 'Data berhasil disimpan!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Gagal menyimpan: ' + err.message);
    }
  };

  const handleEdit = (item) => {
    setForm({
      bulanTahun: item.bulanTahun,
      totalJam: item.totalJam,
      catatan: item.catatan || ''
    });
    setEditingId(item._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin hapus data ini?')) {
      try {
        const res = await fetch(`${API_BASE}/api/safe-work-hours/${id}`, { method: 'DELETE' });
        if (res.ok) {
          await loadData();
          setSuccessMessage('Data berhasil dihapus!');
          setTimeout(() => setSuccessMessage(''), 3000);
        } else {
          alert('Gagal menghapus data');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal terhubung ke server');
      }
    }
  };

  const chartData = [...data].reverse().map(item => ({
    bulan: item.bulanTahun,
    jam: item.totalJam
  }));

  const totalJam = data.reduce((sum, item) => sum + item.totalJam, 0);
  const avgJam = data.length ? Math.round(totalJam / data.length) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-md p-5 mb-6 border border-white/50">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
                <FaShieldAlt className="text-blue-500" /> Jam Kerja Selamat
              </h1>
              <p className="text-gray-500 text-sm mt-1">Pantau dan catat jam kerja tanpa kecelakaan</p>
            </div>
            {canEdit && (
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-md transition-all active:scale-95 text-sm"
              >
                <FaPlus size={14} /> Tambah Data
              </button>
            )}
          </div>
        </div>

        {/* Notifikasi sukses */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2"
            >
              <FaCheckCircle /> {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Total Jam Terkumpul</p>
                <p className="text-2xl font-bold text-gray-800">{totalJam.toLocaleString()} <span className="text-xs font-normal">jam</span></p>
              </div>
              <FaClock className="text-blue-400 text-2xl opacity-70" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Rata-rata per Bulan</p>
                <p className="text-2xl font-bold text-gray-800">{avgJam.toLocaleString()} <span className="text-xs font-normal">jam</span></p>
              </div>
              <FaChartLine className="text-green-400 text-2xl opacity-70" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs">Periode Terakhir</p>
                <p className="text-base font-semibold text-gray-800">{data[0]?.bulanTahun || '-'}</p>
              </div>
              <FaShieldAlt className="text-emerald-400 text-2xl opacity-70" />
            </div>
          </div>
        </div>

        {/* Grafik */}
        {chartData.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2"><FaChartLine /> Tren Jam Kerja Selamat</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="bulan" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                <Line type="monotone" dataKey="jam" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tabel Data */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr className="text-left text-gray-600">
                  <th className="p-3">Bulan/Tahun</th>
                  <th className="p-3">Total Jam</th>
                  <th className="p-3">Catatan</th>
                  <th className="p-3">Diinput oleh</th>
                  {canEdit && <th className="p-3 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr key={item._id} className="border-t border-gray-100 hover:bg-gray-50/50 transition">
                    <td className="p-3 font-medium">{item.bulanTahun}</td>
                    <td className="p-3">{item.totalJam.toLocaleString()} jam</td>
                    <td className="p-3 text-gray-500 max-w-xs truncate">{item.catatan || '-'}</td>
                    <td className="p-3 text-gray-500 text-xs">{item.createdBy}</td>
                    {canEdit && (
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => handleEdit(item)} className="text-blue-500 hover:text-blue-700 transition"><FaEdit size={16} /></button>
                          <button onClick={() => handleDelete(item._id)} className="text-red-400 hover:text-red-600 transition"><FaTrash size={16} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td colSpan={canEdit ? 5 : 4} className="p-6 text-center text-gray-400 text-sm">Belum ada data. {canEdit && 'Klik "Tambah Data" untuk mulai.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Form */}
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
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                  <h2 className="text-lg font-semibold text-gray-800">{editingId ? 'Edit Data' : 'Tambah Data JKS'}</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-gray-100 transition"><FaTimes size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bulan/Tahun <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="bulanTahun"
                      value={form.bulanTahun}
                      onChange={handleChange}
                      placeholder="contoh: Jan 2024 atau 2024-01"
                      className={`w-full p-3 text-base border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition ${errors.bulanTahun ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                      autoFocus
                    />
                    {errors.bulanTahun && <p className="text-xs text-red-500 mt-1">{errors.bulanTahun}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Jam <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      name="totalJam"
                      value={form.totalJam}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      step="1"
                      className={`w-full p-3 text-base border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition ${errors.totalJam ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                    />
                    {errors.totalJam && <p className="text-xs text-red-500 mt-1">{errors.totalJam}</p>}
                    {warning && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-2 text-xs text-yellow-800">
                        <FaExclamationTriangle className="text-yellow-500 mt-0.5 flex-shrink-0" size={14} />
                        <span>{warning}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
                    <textarea
                      name="catatan"
                      value={form.catatan}
                      onChange={handleChange}
                      rows="2"
                      className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none transition"
                      placeholder="Tambahkan keterangan..."
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition text-sm">Batal</button>
                    <button type="submit" disabled={Object.keys(errors).length > 0} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                      <FaSave size={14} /> {editingId ? 'Update' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default JamKerjaSelamatForm;