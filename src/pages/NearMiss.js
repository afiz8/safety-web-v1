import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, FaEdit, FaTrash, FaExclamationTriangle, FaSearch, FaFilter,
  FaCamera, FaMapMarkerAlt, FaUserCheck, FaUser, FaEye, FaTimes,
  FaMoon, FaSun, FaCheckCircle, FaSpinner, FaLocationArrow, FaChartBar
} from 'react-icons/fa';
import { UserContext } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const NearMiss = () => {
  const { session, notifications, setNotifications, darkMode, toggleDarkMode } = useContext(UserContext);
  const [nearMisses, setNearMisses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedNearMiss, setSelectedNearMiss] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    type: 'Near Miss',
    severity: 'Low',
    description: '',
    location: '',
    locationGps: null,
    reporter: '',
    assignedTo: '',
    assignedName: '',
    photos: [],
    status: 'Open',
    actionTaken: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [users, setUsers] = useState([]);

  const API_BASE = 'http://localhost:5000';

  // Fetch near misses
  const fetchNearMisses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/near-miss`);
      if (res.ok) {
        const data = await res.json();
        setNearMisses(data);
      }
    } catch (err) {
      console.error('Gagal fetch near miss:', err);
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
    fetchNearMisses();
    fetchUsers();
  }, []);

  // Auto notification for new near miss
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

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            locationGps: { lat: position.coords.latitude, lng: position.coords.longitude },
            location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          }));
          setGettingLocation(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Gagal mengambil lokasi. Pastikan GPS aktif.');
          setGettingLocation(false);
        }
      );
    } else {
      alert('Browser tidak support GPS');
      setGettingLocation(false);
    }
  };

  const uploadPhotos = async (files) => {
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
      let url = `${API_BASE}/api/near-miss`;
      let method = 'POST';
      if (editingId) {
        url = `${API_BASE}/api/near-miss/${editingId}`;
        method = 'PUT';
      }
      const dataToSend = {
        ...formData,
        reporter: session?.name || 'Anonymous',
        reporterId: session?.userId,
        date: new Date(formData.date)
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      if (res.ok) {
        await fetchNearMisses();
        if (!editingId && formData.severity === 'High') {
          sendNotification(`⚠️ NEAR MISS HIGH RISK: ${formData.title} di ${formData.location}`);
        }
        setShowForm(false);
        setEditingId(null);
        setFormData({
          title: '', type: 'Near Miss', severity: 'Low', description: '', location: '', locationGps: null,
          reporter: '', assignedTo: '', assignedName: '', photos: [], status: 'Open', actionTaken: '', date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (err) {
      console.error('Gagal simpan:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus laporan Near Miss ini?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/near-miss/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchNearMisses();
        setShowDetail(false);
      }
    } catch (err) {
      console.error('Gagal hapus:', err);
    }
  };

  const openDetail = (nearMiss) => {
    setSelectedNearMiss(nearMiss);
    setShowDetail(true);
  };

  const openEdit = (nearMiss) => {
    setEditingId(nearMiss._id);
    setFormData({
      title: nearMiss.title,
      type: nearMiss.type,
      severity: nearMiss.severity,
      description: nearMiss.description || '',
      location: nearMiss.location || '',
      locationGps: nearMiss.locationGps,
      reporter: nearMiss.reporter || '',
      assignedTo: nearMiss.assignedTo || '',
      assignedName: nearMiss.assignedName || '',
      photos: nearMiss.photos || [],
      status: nearMiss.status || 'Open',
      actionTaken: nearMiss.actionTaken || '',
      date: nearMiss.date?.split('T')[0] || new Date().toISOString().split('T')[0]
    });
    setShowForm(true);
    setShowDetail(false);
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return 'bg-red-100 text-red-700';
      case 'Investigating': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  // Filter data
  const filteredNearMisses = nearMisses.filter(nm => {
    const matchSearch = nm.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        nm.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSeverity = severityFilter === 'all' || nm.severity === severityFilter;
    return matchSearch && matchSeverity;
  });

  // Stats
  const stats = {
    total: nearMisses.length,
    highRisk: nearMisses.filter(nm => nm.severity === 'High').length,
    mediumRisk: nearMisses.filter(nm => nm.severity === 'Medium').length,
    lowRisk: nearMisses.filter(nm => nm.severity === 'Low').length,
    open: nearMisses.filter(nm => nm.status === 'Open').length
  };

  // Chart data
  const severityData = [
    { name: 'High', value: stats.highRisk },
    { name: 'Medium', value: stats.mediumRisk },
    { name: 'Low', value: stats.lowRisk },
  ].filter(d => d.value > 0);

  // Heatmap data (top locations)
  const locationCount = {};
  nearMisses.forEach(nm => {
    if (nm.location) {
      const loc = nm.location.split(',')[0];
      locationCount[loc] = (locationCount[loc] || 0) + 1;
    }
  });
  const heatmapData = Object.entries(locationCount).map(([name, value]) => ({ name: name.substring(0, 20), value })).sort((a, b) => b.value - a.value).slice(0, 5);

  const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

  const canEdit = session?.role === 'Admin' || session?.role === 'Supervisor';
  const canDelete = session?.role === 'Admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-6 px-4 transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-yellow-50/30 to-orange-50/20'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-4xl text-yellow-500" />
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Near Miss Reporting
              </h1>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Laporkan dan pantau kejadian near miss
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            {canEdit && (
              <button onClick={() => { setEditingId(null); setFormData({ title: '', type: 'Near Miss', severity: 'Low', description: '', location: '', locationGps: null, reporter: '', assignedTo: '', assignedName: '', photos: [], status: 'Open', actionTaken: '', date: new Date().toISOString().split('T')[0] }); setShowForm(true); }} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg transition flex items-center gap-2">
                <FaPlus /> Laporkan Near Miss
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards - Fokus High Risk */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaExclamationTriangle className="text-yellow-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.total}</p>
            <p className="text-xs text-gray-500">Total Laporan</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur ring-2 ring-red-500 ring-opacity-50`}>
            <FaExclamationTriangle className="text-red-500 text-2xl mb-2 animate-pulse" />
            <p className="text-2xl font-bold text-red-600">{stats.highRisk}</p>
            <p className="text-xs text-gray-500">High Risk ⚠️</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaExclamationTriangle className="text-yellow-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.mediumRisk}</p>
            <p className="text-xs text-gray-500">Medium Risk</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaCheckCircle className="text-green-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.lowRisk}</p>
            <p className="text-xs text-gray-500">Low Risk</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaUserCheck className="text-blue-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.open}</p>
            <p className="text-xs text-gray-500">Open</p>
          </div>
        </div>

        {/* Severity Chart & Heatmap */}
        <div className="grid md:grid-cols-2 gap-6">
          {severityData.length > 0 && (
            <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                <FaChartBar className="text-yellow-500" /> Distribusi Severity
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={severityData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name}) => name}>
                    {severityData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {heatmapData.length > 0 && (
            <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                <FaMapMarkerAlt className="text-red-500" /> Area Berbahaya (Top 5)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={heatmapData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`} />
            <input type="text" placeholder="Cari laporan (judul, lokasi)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-yellow-300 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} />
          </div>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            <option value="all">Semua Severity</option>
            <option value="High">High Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="Low">Low Risk</option>
          </select>
        </div>

        {/* Card Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNearMisses.map((nm, idx) => (
            <motion.div
              key={nm._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className={`rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer border-l-8 ${
                nm.severity === 'High' ? 'border-l-red-500' : nm.severity === 'Medium' ? 'border-l-yellow-500' : 'border-l-green-500'
              } ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white/80 backdrop-blur border border-white/40'}`}
              onClick={() => openDetail(nm)}
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{nm.title}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getSeverityColor(nm.severity)}`}>
                        {nm.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(nm.status)}`}>
                        {nm.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <FaMapMarkerAlt className="text-gray-400 text-xs" />
                    <span className="truncate">{nm.location || '-'}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <FaUser className="text-gray-400 text-xs" />
                    <span>{nm.reporter || '-'}</span>
                  </div>
                  {nm.assignedName && (
                    <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <FaUserCheck className="text-gray-400 text-xs" />
                      <span>PIC: {nm.assignedName}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 line-clamp-2">{nm.description}</p>
                  <div className="text-xs text-gray-400">📅 {new Date(nm.date).toLocaleDateString()}</div>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredNearMisses.length === 0 && (
            <div className={`col-span-full text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <FaExclamationTriangle className="mx-auto text-6xl text-yellow-300 mb-4" />
              <p>Belum ada laporan Near Miss. Laporkan yang pertama!</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{editingId ? 'Edit Near Miss' : 'Laporkan Near Miss'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" placeholder="Judul Kejadian *" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} required />
                <div className="flex gap-2">
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                  <button type="button" onClick={getCurrentLocation} className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-1">
                    {gettingLocation ? <FaSpinner className="animate-spin" /> : <FaLocationArrow />} GPS
                  </button>
                </div>
                <input type="text" placeholder="Lokasi" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <select value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                </select>
                <textarea placeholder="Deskripsi lengkap kejadian..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="2" />
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option value="Open">Open</option>
                  <option value="Investigating">Investigating</option>
                  <option value="Closed">Closed</option>
                </select>
                <select value={formData.assignedTo} onChange={e => {
                  const user = users.find(u => u._id === e.target.value);
                  setFormData({...formData, assignedTo: e.target.value, assignedName: user?.name || ''});
                }} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option value="">Assign PIC...</option>
                  {users.filter(u => u.role === 'Admin' || u.role === 'Supervisor').map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                </select>
                <textarea placeholder="Tindakan yang diambil" value={formData.actionTaken} onChange={e => setFormData({...formData, actionTaken: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="2" />
                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Upload Foto</label>
                  <input type="file" multiple accept="image/*" onChange={async (e) => {
                    const urls = await uploadPhotos(Array.from(e.target.files));
                    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...urls] }));
                  }} className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                  {formData.photos.length > 0 && <div className="mt-1 text-xs text-gray-500">{formData.photos.length} foto terupload</div>}
                </div>
                <button type="submit" disabled={uploading} className="w-full py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition">
                  {uploading ? 'Uploading...' : (editingId ? 'Update' : 'Simpan')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Detail */}
      <AnimatePresence>
        {showDetail && selectedNearMiss && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowDetail(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className={`relative w-full max-w-lg rounded-t-3xl shadow-2xl p-6 pb-8 max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{selectedNearMiss.title}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getSeverityColor(selectedNearMiss.severity)}`}>{selectedNearMiss.severity}</span>
                </div>
                <button onClick={() => setShowDetail(false)} className="text-gray-400"><FaTimes /></button>
              </div>
              <div className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p><span className="font-semibold">Tanggal:</span> {new Date(selectedNearMiss.date).toLocaleDateString()}</p>
                <p><span className="font-semibold">Lokasi:</span> {selectedNearMiss.location || '-'}</p>
                {selectedNearMiss.locationGps && <p><span className="font-semibold">GPS:</span> {selectedNearMiss.locationGps.lat}, {selectedNearMiss.locationGps.lng}</p>}
                <p><span className="font-semibold">Deskripsi:</span> {selectedNearMiss.description || '-'}</p>
                <p><span className="font-semibold">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedNearMiss.status)}`}>{selectedNearMiss.status}</span></p>
                <p><span className="font-semibold">PIC:</span> {selectedNearMiss.assignedName || '-'}</p>
                <p><span className="font-semibold">Tindakan:</span> {selectedNearMiss.actionTaken || '-'}</p>
                <p><span className="font-semibold">Pelapor:</span> {selectedNearMiss.reporter || '-'}</p>
                {selectedNearMiss.photos?.length > 0 && <p><span className="font-semibold">Foto:</span> {selectedNearMiss.photos.length} file</p>}
              </div>
              {canEdit && (
                <div className="flex gap-3 mt-6">
                  <button onClick={() => openEdit(selectedNearMiss)} className="flex-1 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition">✏️ Edit</button>
                  {canDelete && <button onClick={() => handleDelete(selectedNearMiss._id)} className="flex-1 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">🗑️ Hapus</button>}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NearMiss;