import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaCamera, FaMapMarkerAlt,
  FaMoon, FaSun, FaTimes, FaCheckCircle, FaExclamationTriangle, FaEye,
  FaChartLine, FaBell, FaLink, FaSpinner, FaLocationArrow
} from 'react-icons/fa';
import { UserContext } from '../App';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Observasi = () => {
  const { session, darkMode, toggleDarkMode, notifications, setNotifications } = useContext(UserContext);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedObs, setSelectedObs] = useState(null);
  const [formData, setFormData] = useState({
    type: 'Positive',
    description: '',
    location: '',
    locationGps: null,
    observedBy: '',
    date: new Date().toISOString().split('T')[0],
    photo: null,
    status: 'Open',
    followUp: '',
    relatedModule: 'None',
    relatedId: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, positive: 0, negative: 0, opportunity: 0, open: 0 });
  const [gettingLocation, setGettingLocation] = useState(false);
  const [nearMisses, setNearMisses] = useState([]);
  const [apdList, setApdList] = useState([]);

  const API_BASE = 'http://localhost:5000';
  const canEdit = session?.role === 'Admin' || session?.role === 'Supervisor';

  const fetchObservations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/observasi`);
      if (res.ok) {
        const data = await res.json();
        setObservations(data);
      }
    } catch (err) {
      console.error('Gagal fetch observasi:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/observasi/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Gagal fetch stats:', err);
    }
  };

  const fetchNearMisses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/near-miss`);
      if (res.ok) {
        const data = await res.json();
        setNearMisses(data);
      }
    } catch (err) {
      console.error('Gagal fetch near miss:', err);
    }
  };

  const fetchAPD = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/apd`);
      if (res.ok) {
        const data = await res.json();
        setApdList(data);
      }
    } catch (err) {
      console.error('Gagal fetch APD:', err);
    }
  };

  useEffect(() => {
    fetchObservations();
    fetchStats();
    fetchNearMisses();
    fetchAPD();
  }, []);

  const sendNotification = async (message, link = '/observasi') => {
    try {
      await fetch(`${API_BASE}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          type: 'violation',
          category: 'Insiden',
          link,
          role: 'Supervisor',
          read: false
        })
      });
      setNotifications?.(prev => [{ id: Date.now(), message, date: new Date().toISOString(), read: false, type: 'violation', link }, ...prev]);
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
          alert('Gagal mengambil lokasi: ' + error.message);
          setGettingLocation(false);
        }
      );
    } else {
      alert('Browser tidak support GPS');
      setGettingLocation(false);
    }
  };

  const captureLivePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      await new Promise(r => video.onloadedmetadata = r);
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      setFormData(prev => ({ ...prev, photo: photoData }));
      
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      alert('Gagal akses kamera: ' + err.message);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setFormData(prev => ({ ...prev, photo: ev.target.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert('Deskripsi wajib diisi!');
      return;
    }
    try {
      const dataToSend = {
        ...formData,
        observedBy: session?.name || 'Anonymous',
        observedById: session?.userId,
        date: new Date(formData.date)
      };
      let url = `${API_BASE}/api/observasi`;
      let method = 'POST';
      if (editingId) {
        url = `${API_BASE}/api/observasi/${editingId}`;
        method = 'PUT';
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      if (res.ok) {
        await fetchObservations();
        await fetchStats();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          type: 'Positive', description: '', location: '', locationGps: null,
          observedBy: '', date: new Date().toISOString().split('T')[0],
          photo: null, status: 'Open', followUp: '', relatedModule: 'None', relatedId: ''
        });
        if (formData.type === 'Negative' && !editingId) {
          sendNotification(`⚠️ Observasi Negative: ${formData.description.substring(0, 100)} di ${formData.location || 'lokasi tidak diketahui'}`, '/observasi');
        }
      }
    } catch (err) {
      console.error('Gagal simpan:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus observasi ini?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/observasi/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchObservations();
        await fetchStats();
        setShowDetail(false);
      }
    } catch (err) {
      console.error('Gagal hapus:', err);
    }
  };

  const openDetail = (obs) => {
    setSelectedObs(obs);
    setShowDetail(true);
  };

  const openEdit = (obs) => {
    setEditingId(obs._id);
    setFormData({
      type: obs.type,
      description: obs.description,
      location: obs.location || '',
      locationGps: obs.locationGps,
      observedBy: obs.observedBy || '',
      date: obs.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      photo: obs.photo || null,
      status: obs.status || 'Open',
      followUp: obs.followUp || '',
      relatedModule: obs.relatedModule || 'None',
      relatedId: obs.relatedId || ''
    });
    setShowForm(true);
    setShowDetail(false);
  };

  const convertToNearMiss = async (obs) => {
    try {
      const newNearMiss = {
        title: `[Dari Observasi] ${obs.description.substring(0, 100)}`,
        type: 'Near Miss',
        severity: 'Medium',
        description: obs.description,
        location: obs.location,
        locationGps: obs.locationGps,
        reporter: obs.observedBy,
        reporterId: obs.observedById,
        date: new Date(),
        status: 'Open'
      };
      const res = await fetch(`${API_BASE}/api/near-miss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNearMiss)
      });
      if (res.ok) {
        alert('Berhasil dikonversi ke Near Miss');
        sendNotification(`Observasi "${obs.description.substring(0, 50)}" telah dikonversi ke Near Miss`, '/near-miss');
      }
    } catch (err) {
      console.error('Gagal konversi:', err);
    }
  };

  const filteredObservations = observations.filter(obs => {
    const matchSearch = obs.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        obs.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'all' || obs.type === typeFilter;
    const matchStatus = statusFilter === 'all' || obs.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const trendData = getLast7Days().map(day => ({
    date: day.slice(5),
    count: observations.filter(o => o.date?.split('T')[0] === day).length
  }));

  const pieData = [
    { name: 'Positive', value: stats.positive, color: '#10b981' },
    { name: 'Negative', value: stats.negative, color: '#ef4444' },
    { name: 'Opportunity', value: stats.opportunity, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-6 px-4 transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-slate-50 via-green-50/30 to-blue-50/30'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent'}`}>
              🧑‍🔬 Safety Observations
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Kelola observasi keselamatan kerja
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button onClick={() => { setEditingId(null); setFormData({ type: 'Positive', description: '', location: '', locationGps: null, observedBy: '', date: new Date().toISOString().split('T')[0], photo: null, status: 'Open', followUp: '', relatedModule: 'None', relatedId: '' }); setShowForm(true); }} className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg transition flex items-center gap-2">
              <FaPlus /> Tambah Observasi
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className="text-2xl font-bold text-green-600">{stats.positive}</p>
            <p className="text-xs text-gray-500">Positive</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className="text-2xl font-bold text-red-600">{stats.negative}</p>
            <p className="text-xs text-gray-500">Negative</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className="text-2xl font-bold text-yellow-600">{stats.opportunity}</p>
            <p className="text-xs text-gray-500">Opportunity</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className="text-2xl font-bold text-orange-600">{stats.open}</p>
            <p className="text-xs text-gray-500">Open</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaChartLine className="text-green-500" /> Trend Observasi (7 Hari)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {pieData.length > 0 && (
            <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Distribusi Tipe</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name}) => name}>
                    {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`} />
            <input type="text" placeholder="Cari observasi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-300 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            <option value="all">Semua Tipe</option>
            <option value="Positive">Positive</option>
            <option value="Negative">Negative</option>
            <option value="Opportunity">Opportunity</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            <option value="all">Semua Status</option>
            <option value="Open">Open</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredObservations.map((obs, idx) => (
            <motion.div
              key={obs._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className={`rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white/80 backdrop-blur border border-white/40'}`}
              onClick={() => openDetail(obs)}
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${obs.type === 'Positive' ? 'bg-green-100 text-green-700' : obs.type === 'Negative' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {obs.type}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${obs.status === 'Open' ? 'bg-orange-100 text-orange-700' : obs.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {obs.status}
                  </span>
                </div>
                <p className={`mt-3 text-sm line-clamp-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{obs.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span><FaMapMarkerAlt className="inline mr-1" /> {obs.location || '-'}</span>
                  <span>{new Date(obs.date).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 text-xs text-gray-400">Oleh: {obs.observedBy || '-'}</div>
              </div>
            </motion.div>
          ))}
          {filteredObservations.length === 0 && (
            <div className={`col-span-full text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="text-6xl mb-4">👀</div>
              <p>Belum ada observasi. Mulai dengan menambahkan observasi pertama!</p>
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
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{editingId ? 'Edit Observasi' : 'Tambah Observasi'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option>Positive</option><option>Negative</option><option>Opportunity</option>
                </select>
                <textarea placeholder="Deskripsi *" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="3" required />
                <div className="flex gap-2">
                  <input type="text" placeholder="Lokasi" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                  <button type="button" onClick={getCurrentLocation} className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-1">
                    {gettingLocation ? <FaSpinner className="animate-spin" /> : <FaLocationArrow />} GPS
                  </button>
                </div>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <input type="text" placeholder="Diobservasi oleh" value={formData.observedBy} onChange={e => setFormData({...formData, observedBy: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option>Open</option><option>Reviewed</option><option>Closed</option>
                </select>
                <select value={formData.relatedModule} onChange={e => setFormData({...formData, relatedModule: e.target.value, relatedId: ''})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option value="None">Tidak terkait</option>
                  <option value="NearMiss">Near Miss</option>
                  <option value="APD">APD</option>
                  <option value="Insiden">Insiden</option>
                </select>
                {formData.relatedModule === 'NearMiss' && nearMisses.length > 0 && (
                  <select value={formData.relatedId} onChange={e => setFormData({...formData, relatedId: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                    <option value="">Pilih Near Miss</option>
                    {nearMisses.map(nm => <option key={nm._id} value={nm._id}>{nm.title}</option>)}
                  </select>
                )}
                {formData.relatedModule === 'APD' && apdList.length > 0 && (
                  <select value={formData.relatedId} onChange={e => setFormData({...formData, relatedId: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                    <option value="">Pilih APD</option>
                    {apdList.map(apd => <option key={apd._id} value={apd._id}>{apd.nama}</option>)}
                  </select>
                )}
                <textarea placeholder="Tindak lanjut" value={formData.followUp} onChange={e => setFormData({...formData, followUp: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="2" />
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer bg-gray-100 dark:bg-gray-700 text-center py-2 rounded-lg">📁 Upload Foto<input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" /></label>
                  <button type="button" onClick={captureLivePhoto} className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition">📷 Camera</button>
                </div>
                {formData.photo && <img src={formData.photo} alt="Preview" className="w-full h-32 object-cover rounded-lg" />}
                <button type="submit" className="w-full py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-700 transition">
                  {editingId ? 'Update' : 'Simpan'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Detail */}
      <AnimatePresence>
        {showDetail && selectedObs && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowDetail(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className={`relative w-full max-w-lg rounded-t-3xl shadow-2xl p-6 pb-8 max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedObs.type === 'Positive' ? 'bg-green-100 text-green-700' : selectedObs.type === 'Negative' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{selectedObs.type}</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${selectedObs.status === 'Open' ? 'bg-orange-100 text-orange-700' : selectedObs.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{selectedObs.status}</span>
                </div>
                <button onClick={() => setShowDetail(false)} className="text-gray-400"><FaTimes /></button>
              </div>
              <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{selectedObs.description}</p>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold">Lokasi:</span> {selectedObs.location || '-'}</p>
                <p><span className="font-semibold">Tanggal:</span> {new Date(selectedObs.date).toLocaleDateString()}</p>
                <p><span className="font-semibold">Diobservasi oleh:</span> {selectedObs.observedBy || '-'}</p>
                <p><span className="font-semibold">Tindak lanjut:</span> {selectedObs.followUp || '-'}</p>
                {selectedObs.relatedModule !== 'None' && (
                  <p><span className="font-semibold">Terkait:</span> {selectedObs.relatedModule} - {selectedObs.relatedId}</p>
                )}
                {selectedObs.photo && <img src={selectedObs.photo} alt="Observasi" className="w-full h-48 object-cover rounded-lg mt-2" />}
              </div>
              {canEdit && (
                <div className="flex gap-3 mt-6">
                  <button onClick={() => openEdit(selectedObs)} className="flex-1 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition">✏️ Edit</button>
                  {selectedObs.type === 'Negative' && selectedObs.relatedModule === 'None' && (
                    <button onClick={() => convertToNearMiss(selectedObs)} className="flex-1 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition">🔄 Konversi ke Near Miss</button>
                  )}
                  <button onClick={() => handleDelete(selectedObs._id)} className="flex-1 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">🗑️ Hapus</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Observasi;