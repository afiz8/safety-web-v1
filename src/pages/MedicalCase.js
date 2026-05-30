import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, FaEdit, FaTrash, FaEye, FaTimes, FaSearch, FaFilter,
  FaUser, FaCalendarAlt, FaMapMarkerAlt, FaPhone, FaFileImage,
  FaUserMd, FaAmbulance, FaChartLine, FaMoon, FaSun,
  FaCheckCircle, FaExclamationTriangle, FaSpinner, FaLocationArrow
} from 'react-icons/fa';
import { UserContext } from '../App';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const MedicalCase = () => {
  const { session, notifications, setNotifications, darkMode, toggleDarkMode } = useContext(UserContext);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    age: '',
    gender: 'Laki-laki',
    incidentDate: new Date().toISOString().split('T')[0],
    incidentLocation: '',
    locationGps: null,
    caseType: 'First Aid',
    severity: 'Medium',
    description: '',
    injuries: [],
    treatment: '',
    status: 'Open',
    assignedTo: '',
    assignedName: '',
    photos: []
  });
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [users, setUsers] = useState([]);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [injuryInput, setInjuryInput] = useState('');

  const API_BASE = 'http://localhost:5000';

  // Fetch cases
  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/medical-cases`);
      if (res.ok) {
        const data = await res.json();
        // Sort by severity (Critical first) and date
        const sorted = data.sort((a, b) => {
          const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          if (severityOrder[b.severity] !== severityOrder[a.severity]) {
            return severityOrder[b.severity] - severityOrder[a.severity];
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setCases(sorted);
      }
    } catch (err) {
      console.error('Gagal fetch cases:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for assign
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
    fetchCases();
    fetchUsers();
  }, []);

  // Auto notification for critical cases
  useEffect(() => {
    cases.forEach(c => {
      if (c.severity === 'Critical' && c.status === 'Open') {
        const msg = `🚨 KASUS DARURAT! ${c.patientName} - ${c.caseType} di ${c.incidentLocation}`;
        if (!notifications?.some(n => n.message === msg)) {
          sendNotification(msg);
        }
      }
    });
  }, [cases]);

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
            incidentLocation: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
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
      let url = `${API_BASE}/api/medical-cases`;
      let method = 'POST';
      if (editingId) {
        url = `${API_BASE}/api/medical-cases/${editingId}`;
        method = 'PUT';
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, injuries: formData.injuries.filter(i => i) })
      });
      if (res.ok) {
        await fetchCases();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          patientName: '', patientId: '', age: '', gender: 'Laki-laki',
          incidentDate: new Date().toISOString().split('T')[0], incidentLocation: '', locationGps: null,
          caseType: 'First Aid', severity: 'Medium', description: '', injuries: [], treatment: '',
          status: 'Open', assignedTo: '', assignedName: '', photos: []
        });
      }
    } catch (err) {
      console.error('Gagal simpan:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin hapus kasus ini?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/medical-cases/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCases();
        setShowDetail(false);
      }
    } catch (err) {
      console.error('Gagal hapus:', err);
    }
  };

  const addInjury = () => {
    if (injuryInput.trim()) {
      setFormData(prev => ({ ...prev, injuries: [...prev.injuries, injuryInput.trim()] }));
      setInjuryInput('');
    }
  };

  const removeInjury = (index) => {
    setFormData(prev => ({ ...prev, injuries: prev.injuries.filter((_, i) => i !== index) }));
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'Critical': return 'bg-red-600 text-white';
      case 'High': return 'bg-red-500 text-white';
      case 'Medium': return 'bg-orange-500 text-white';
      case 'Low': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return 'bg-red-100 text-red-700';
      case 'In Progress': return 'bg-yellow-100 text-yellow-700';
      case 'Closed': return 'bg-green-100 text-green-700';
      case 'Referred': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Filter cases
  const filteredCases = cases.filter(c => {
    const matchSearch = c.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.incidentLocation?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSeverity = severityFilter === 'all' || c.severity === severityFilter;
    return matchSearch && matchStatus && matchSeverity;
  });

  // Stats
  const stats = {
    total: cases.length,
    open: cases.filter(c => c.status === 'Open').length,
    critical: cases.filter(c => c.severity === 'Critical' && c.status !== 'Closed').length,
    treated: cases.filter(c => c.status === 'Closed').length
  };

  // Chart data
  const severityData = [
    { name: 'Critical', value: cases.filter(c => c.severity === 'Critical').length },
    { name: 'High', value: cases.filter(c => c.severity === 'High').length },
    { name: 'Medium', value: cases.filter(c => c.severity === 'Medium').length },
    { name: 'Low', value: cases.filter(c => c.severity === 'Low').length },
  ].filter(d => d.value > 0);

  const COLORS = ['#dc2626', '#ef4444', '#f97316', '#eab308'];

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
              Medical Case
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Manajemen kasus medical treatment dan first aid
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            {canEdit && (
              <button onClick={() => { setEditingId(null); setFormData({ patientName: '', patientId: '', age: '', gender: 'Laki-laki', incidentDate: new Date().toISOString().split('T')[0], incidentLocation: '', locationGps: null, caseType: 'First Aid', severity: 'Medium', description: '', injuries: [], treatment: '', status: 'Open', assignedTo: '', assignedName: '', photos: [] }); setShowForm(true); }} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg transition flex items-center gap-2">
                <FaPlus /> Tambah Kasus
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaAmbulance className="text-orange-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.total}</p>
            <p className="text-xs text-gray-500">Total Kasus</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaExclamationTriangle className="text-red-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.open}</p>
            <p className="text-xs text-gray-500">Aktif</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaExclamationTriangle className="text-red-600 text-2xl mb-2 animate-pulse" />
            <p className={`text-2xl font-bold text-red-600`}>{stats.critical}</p>
            <p className="text-xs text-gray-500">Darurat</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-1 ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <FaCheckCircle className="text-green-500 text-2xl mb-2" />
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.treated}</p>
            <p className="text-xs text-gray-500">Selesai</p>
          </div>
        </div>

        {/* Chart Section */}
        {severityData.length > 0 && (
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaChartLine className="text-orange-500" /> Distribusi Tingkat Keparahan
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

        {/* Filter & Search */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`} />
            <input type="text" placeholder="Cari pasien atau lokasi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-300 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            <option value="all">Semua Status</option>
            <option value="Open">Open</option><option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option><option value="Referred">Referred</option>
          </select>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            <option value="all">Semua Severity</option>
            <option value="Critical">Critical (Darurat)</option><option value="High">High</option>
            <option value="Medium">Medium</option><option value="Low">Low</option>
          </select>
        </div>

        {/* Card Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCases.map((c, idx) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className={`rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer ${c.severity === 'Critical' ? 'border-l-8 border-l-red-600' : ''} ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white/80 backdrop-blur border border-white/40'}`}
              onClick={() => { setSelectedCase(c); setShowDetail(true); }}
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{c.patientName}</h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{new Date(c.incidentDate).toLocaleDateString()} • {c.caseType}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(c.severity)}`}>
                    {c.severity === 'Critical' ? '🚨 DARURAT' : c.severity}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <FaMapMarkerAlt className="text-gray-400 text-xs" />
                    <span className="truncate">{c.incidentLocation || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                    {c.assignedName && <span className="text-xs text-gray-400"><FaUserMd className="inline mr-1" />{c.assignedName}</span>}
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">{c.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredCases.length === 0 && (
            <div className={`col-span-full text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Belum ada data kasus. {canEdit && 'Klik "Tambah Kasus" untuk menambahkan.'}
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
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{editingId ? 'Edit Kasus' : 'Tambah Kasus Baru'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" placeholder="Nama Pasien *" value={formData.patientName} onChange={(e) => setFormData({...formData, patientName: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} required />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="ID Pasien" value={formData.patientId} onChange={(e) => setFormData({...formData, patientId: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                  <input type="number" placeholder="Umur" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                </div>
                <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option>Laki-laki</option><option>Perempuan</option><option>Lainnya</option>
                </select>
                <div className="flex gap-2">
                  <input type="date" value={formData.incidentDate} onChange={(e) => setFormData({...formData, incidentDate: e.target.value})} className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                  <button type="button" onClick={getCurrentLocation} className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-1">
                    {gettingLocation ? <FaSpinner className="animate-spin" /> : <FaLocationArrow />} GPS
                  </button>
                </div>
                <input type="text" placeholder="Lokasi Kejadian" value={formData.incidentLocation} onChange={(e) => setFormData({...formData, incidentLocation: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <select value={formData.caseType} onChange={(e) => setFormData({...formData, caseType: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option>First Aid</option><option>Medical Treatment</option><option>Emergency</option><option>Referral</option>
                </select>
                <select value={formData.severity} onChange={(e) => setFormData({...formData, severity: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical (Darurat)</option>
                </select>
                <textarea placeholder="Deskripsi" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="2" />
                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Cedera yang dialami</label>
                  <div className="flex gap-2 mt-1">
                    <input type="text" value={injuryInput} onChange={(e) => setInjuryInput(e.target.value)} className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} placeholder="Contoh: Luka bakar" />
                    <button type="button" onClick={addInjury} className="px-3 py-2 bg-green-500 text-white rounded-lg">Tambah</button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.injuries.map((inj, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs flex items-center gap-1">{inj}<button type="button" onClick={() => removeInjury(idx)} className="text-red-500">×</button></span>
                    ))}
                  </div>
                </div>
                <textarea placeholder="Penanganan / Treatment" value={formData.treatment} onChange={(e) => setFormData({...formData, treatment: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="2" />
                <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option>Open</option><option>In Progress</option><option>Closed</option><option>Referred</option>
                </select>
                <select value={formData.assignedTo} onChange={(e) => {
                  const user = users.find(u => u._id === e.target.value);
                  setFormData({...formData, assignedTo: e.target.value, assignedName: user?.name || ''});
                }} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option value="">Assign ke...</option>
                  {users.filter(u => u.role === 'Admin' || u.role === 'Supervisor').map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                </select>
                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Upload Foto Luka</label>
                  <input type="file" multiple accept="image/*" onChange={async (e) => {
                    const urls = await uploadPhotos(Array.from(e.target.files));
                    setFormData(prev => ({ ...prev, photos: [...prev.photos, ...urls] }));
                  }} className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} />
                  {formData.photos.length > 0 && <div className="mt-1 text-xs text-gray-500">{formData.photos.length} foto terupload</div>}
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
        {showDetail && selectedCase && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowDetail(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className={`relative w-full max-w-lg rounded-t-3xl shadow-2xl p-6 pb-8 max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{selectedCase.patientName}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${getSeverityColor(selectedCase.severity)}`}>
                    {selectedCase.severity === 'Critical' ? '🚨 DARURAT' : selectedCase.severity}
                  </span>
                </div>
                <button onClick={() => setShowDetail(false)} className="text-gray-400"><FaTimes /></button>
              </div>
              <div className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p><span className="font-semibold">ID Pasien:</span> {selectedCase.patientId || '-'}</p>
                <p><span className="font-semibold">Umur:</span> {selectedCase.age} tahun</p>
                <p><span className="font-semibold">Jenis Kelamin:</span> {selectedCase.gender}</p>
                <p><span className="font-semibold">Tanggal Kejadian:</span> {new Date(selectedCase.incidentDate).toLocaleDateString()}</p>
                <p><span className="font-semibold">Lokasi:</span> {selectedCase.incidentLocation || '-'}</p>
                {selectedCase.locationGps && <p><span className="font-semibold">GPS:</span> {selectedCase.locationGps.lat}, {selectedCase.locationGps.lng}</p>}
                <p><span className="font-semibold">Tipe Kasus:</span> {selectedCase.caseType}</p>
                <p><span className="font-semibold">Deskripsi:</span> {selectedCase.description || '-'}</p>
                <p><span className="font-semibold">Cedera:</span> {selectedCase.injuries?.join(', ') || '-'}</p>
                <p><span className="font-semibold">Penanganan:</span> {selectedCase.treatment || '-'}</p>
                <p><span className="font-semibold">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedCase.status)}`}>{selectedCase.status}</span></p>
                <p><span className="font-semibold">Ditangani oleh:</span> {selectedCase.assignedName || '-'}</p>
                {selectedCase.photos?.length > 0 && <p><span className="font-semibold">Foto:</span> {selectedCase.photos.length} file</p>}
                <p className="text-xs text-gray-400">Dibuat: {new Date(selectedCase.createdAt).toLocaleString()}</p>
              </div>
              {canEdit && (
                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setEditingId(selectedCase._id); setFormData({ ...selectedCase, incidentDate: selectedCase.incidentDate?.split('T')[0] || '' }); setShowForm(true); setShowDetail(false); }} className="flex-1 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition">✏️ Edit</button>
                  {canDelete && <button onClick={() => handleDelete(selectedCase._id)} className="flex-1 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">🗑️ Hapus</button>}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicalCase;