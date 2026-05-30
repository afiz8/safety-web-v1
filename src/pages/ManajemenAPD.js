import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHardHat, FaGloves, FaCalendarAlt, FaMapMarkerAlt, FaUser, 
  FaPlus, FaEdit, FaTrash, FaEye, FaChartLine, FaTimes,
  FaExclamationTriangle, FaBoxes, FaMoon, FaSun, FaSearch
} from 'react-icons/fa';
import { UserContext } from '../App';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const ManajemenAPD = () => {
  const { session, notifications, setNotifications, darkMode, toggleDarkMode } = useContext(UserContext);
  const [alatList, setAlatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAlat, setSelectedAlat] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('all');
  const [formData, setFormData] = useState({
    nama: '',
    stok: 0,
    tanggalKadaluarsa: '',
    lokasi: '',
    assignedTo: '',
    kategori: 'Lainnya'
  });
  const [editingId, setEditingId] = useState(null);
  const [users, setUsers] = useState([]);

  const API_BASE = 'http://localhost:5000';

  const fetchAlat = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/alat-pelindung-diri`);
      if (res.ok) {
        const data = await res.json();
        setAlatList(data);
      }
    } catch (err) {
      console.error('Gagal fetch alat pelindung diri:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Gagal fetch users:', err);
    }
  };

  useEffect(() => {
    fetchAlat();
    fetchUsers();
  }, []);

  const sendNotification = async (message) => {
    try {
      await fetch(`${API_BASE}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, read: false, date: new Date().toISOString() })
      });
    } catch (err) {
      console.error('Gagal kirim notifikasi:', err);
    }
  };

  useEffect(() => {
    alatList.forEach(alat => {
      const expiryDate = new Date(alat.tanggalKadaluarsa);
      const daysToExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      
      if (alat.stok === 0) {
        const msg = `⚠️ Stok ${alat.nama} habis!`;
        if (!notifications?.some(n => n.message === msg)) {
          sendNotification(msg);
          setNotifications?.(prev => [{ id: Date.now(), message: msg, date: new Date().toISOString(), read: false }, ...prev]);
        }
      } else if (daysToExpiry <= 7 && daysToExpiry > 0) {
        const msg = `📅 ${alat.nama} mendekati kadaluarsa (H-${daysToExpiry})`;
        if (!notifications?.some(n => n.message === msg)) {
          sendNotification(msg);
          setNotifications?.(prev => [{ id: Date.now(), message: msg, date: new Date().toISOString(), read: false }, ...prev]);
        }
      }
    });
  }, [alatList]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let url = `${API_BASE}/api/alat-pelindung-diri`;
      let method = 'POST';
      if (editingId) {
        url = `${API_BASE}/api/alat-pelindung-diri/${editingId}`;
        method = 'PUT';
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await fetchAlat();
        setShowForm(false);
        setEditingId(null);
        setFormData({ nama: '', stok: 0, tanggalKadaluarsa: '', lokasi: '', assignedTo: '', kategori: 'Lainnya' });
      }
    } catch (err) {
      console.error('Gagal simpan:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus data ini?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/alat-pelindung-diri/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAlat();
        setShowDetail(false);
      }
    } catch (err) {
      console.error('Gagal hapus:', err);
    }
  };

  const openDetail = (alat) => {
    setSelectedAlat(alat);
    setShowDetail(true);
  };

  const openEdit = (alat) => {
    setEditingId(alat._id);
    setFormData({
      nama: alat.nama,
      stok: alat.stok,
      tanggalKadaluarsa: alat.tanggalKadaluarsa?.split('T')[0] || '',
      lokasi: alat.lokasi || '',
      assignedTo: alat.assignedTo || '',
      kategori: alat.kategori || 'Lainnya'
    });
    setShowForm(true);
    setShowDetail(false);
  };

  const getStockColor = (stok) => {
    if (stok > 10) return 'bg-green-100 text-green-700';
    if (stok >= 1) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getExpiryStatus = (date) => {
    const expiry = new Date(date);
    const today = new Date();
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: 'Kadaluarsa', color: 'bg-red-500' };
    if (daysLeft <= 7) return { label: `H-${daysLeft}`, color: 'bg-yellow-500' };
    return { label: 'Aman', color: 'bg-green-500' };
  };

  const filteredAlat = alatList.filter(alat => {
    const matchSearch = alat.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        alat.lokasi?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKategori = kategoriFilter === 'all' || alat.kategori === kategoriFilter;
    return matchSearch && matchKategori;
  });

  const chartData = [
    { name: 'Helm', value: alatList.filter(a => a.kategori === 'Helm').length },
    { name: 'Sarung Tangan', value: alatList.filter(a => a.kategori === 'Sarung Tangan').length },
    { name: 'Kacamata', value: alatList.filter(a => a.kategori === 'Kacamata').length },
    { name: 'Rompi', value: alatList.filter(a => a.kategori === 'Rompi').length },
    { name: 'Sepatu', value: alatList.filter(a => a.kategori === 'Sepatu').length },
  ].filter(c => c.value > 0);

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

  const stats = {
    total: alatList.length,
    totalStok: alatList.reduce((sum, a) => sum + a.stok, 0),
    habis: alatList.filter(a => a.stok === 0).length,
    almostExpired: alatList.filter(a => {
      const daysLeft = Math.ceil((new Date(a.tanggalKadaluarsa) - new Date()) / (1000 * 60 * 60 * 24));
      return daysLeft <= 7 && daysLeft > 0;
    }).length
  };

  const role = session?.role;
  const canEdit = role === 'Admin' || role === 'Supervisor';
  const canDelete = role === 'Admin';

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
              Alat Pelindung Diri (APD)
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Kelola Alat Pelindung Diri dan aset keselamatan
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
                  setFormData({ nama: '', stok: 0, tanggalKadaluarsa: '', lokasi: '', assignedTo: '', kategori: 'Lainnya' });
                  setShowForm(true);
                }}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                <FaPlus /> Tambah
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaHardHat className="text-orange-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.total}</p>
            <p className="text-xs text-gray-500">Total Jenis</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaBoxes className="text-blue-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.totalStok}</p>
            <p className="text-xs text-gray-500">Total Stok</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaExclamationTriangle className="text-red-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.habis}</p>
            <p className="text-xs text-gray-500">Stok Habis</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaCalendarAlt className="text-yellow-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.almostExpired}</p>
            <p className="text-xs text-gray-500">Mendekati Kadaluarsa</p>
          </div>
        </div>

        {/* Chart Section */}
        {chartData.length > 0 && (
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaChartLine className="text-orange-500" /> Distribusi per Kategori
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
              placeholder="Cari nama atau lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-300 outline-none transition ${
                darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'
              }`}
            />
          </div>
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}
          >
            <option value="all">Semua Kategori</option>
            <option value="Helm">Helm</option>
            <option value="Sarung Tangan">Sarung Tangan</option>
            <option value="Kacamata">Kacamata</option>
            <option value="Rompi">Rompi</option>
            <option value="Sepatu">Sepatu</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        {/* Card Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAlat.map((alat, idx) => {
            const expiryStatus = getExpiryStatus(alat.tanggalKadaluarsa);
            return (
              <motion.div
                key={alat._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                className={`rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer ${
                  darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white/80 backdrop-blur border border-white/40'
                }`}
                onClick={() => openDetail(alat)}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                        <FaHardHat className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{alat.nama}</h3>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{alat.kategori}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStockColor(alat.stok)}`}>
                      Stok: {alat.stok}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <FaMapMarkerAlt className="text-gray-400 text-xs" />
                      <span>{alat.lokasi || '-'}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <FaUser className="text-gray-400 text-xs" />
                      <span>{alat.assignedTo || 'Belum ditugaskan'}</span>
                    </div>
                    <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <FaCalendarAlt className="text-gray-400 text-xs" />
                      <span>{new Date(alat.tanggalKadaluarsa).toLocaleDateString()}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full text-white ${expiryStatus.color}`}>
                        {expiryStatus.label}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filteredAlat.length === 0 && (
            <div className={`col-span-full text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Belum ada data. {canEdit && 'Klik "Tambah" untuk menambahkan.'}
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
              className={`rounded-2xl p-6 w-full max-w-md shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {editingId ? 'Edit APD' : 'Tambah APD Baru'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nama APD *</label>
                  <input type="text" required value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Kategori</label>
                  <select value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                    <option value="Helm">Helm</option><option value="Sarung Tangan">Sarung Tangan</option>
                    <option value="Kacamata">Kacamata</option><option value="Rompi">Rompi</option>
                    <option value="Sepatu">Sepatu</option><option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Stok</label>
                  <input type="number" min="0" value={formData.stok} onChange={(e) => setFormData({...formData, stok: parseInt(e.target.value)})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tanggal Kadaluarsa</label>
                  <input type="date" value={formData.tanggalKadaluarsa} onChange={(e) => setFormData({...formData, tanggalKadaluarsa: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Lokasi</label>
                  <input type="text" value={formData.lokasi} onChange={(e) => setFormData({...formData, lokasi: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Ditugaskan ke</label>
                  <select value={formData.assignedTo} onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                    <option value="">Belum ditugaskan</option>
                    {users.map(user => <option key={user._id} value={user.name}>{user.name}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition">
                  {editingId ? 'Update' : 'Simpan'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Detail */}
      <AnimatePresence>
        {showDetail && selectedAlat && (
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
              className={`relative w-full max-w-lg rounded-t-3xl shadow-2xl p-6 pb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{selectedAlat.nama}</h2>
                <button onClick={() => setShowDetail(false)} className="text-gray-400"><FaTimes /></button>
              </div>
              <div className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p><span className="font-semibold">Kategori:</span> {selectedAlat.kategori}</p>
                <p><span className="font-semibold">Stok:</span> {selectedAlat.stok}</p>
                <p><span className="font-semibold">Lokasi:</span> {selectedAlat.lokasi || '-'}</p>
                <p><span className="font-semibold">Ditugaskan ke:</span> {selectedAlat.assignedTo || '-'}</p>
                <p><span className="font-semibold">Kadaluarsa:</span> {new Date(selectedAlat.tanggalKadaluarsa).toLocaleDateString()}</p>
              </div>
              {canEdit && (
                <div className="flex gap-3 mt-6">
                  <button onClick={() => openEdit(selectedAlat)} className="flex-1 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition">✏️ Edit</button>
                  {canDelete && <button onClick={() => handleDelete(selectedAlat._id)} className="flex-1 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">🗑️ Hapus</button>}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManajemenAPD;