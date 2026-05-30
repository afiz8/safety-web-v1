import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaStethoscope, FaLungs, FaBrain, FaBone, FaEye, FaEarListen,
  FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaChartLine,
  FaMoon, FaSun, FaTimes, FaFileUpload, FaUserMd, FaHospital,
  FaExclamationTriangle, FaCheckCircle, FaSpinner, FaUser
} from 'react-icons/fa';
import { UserContext } from '../App';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const OccupationalDiseases = () => {
  const { session, darkMode, toggleDarkMode, notifications, setNotifications } = useContext(UserContext);
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, byCategory: {}, bySeverity: {}, active: 0 });
  const [riskPrediction, setRiskPrediction] = useState(null);
  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    age: '',
    gender: 'Laki-laki',
    diagnosis: '',
    category: 'respiratory',
    severity: 'Medium',
    riskFactors: [],
    exposureSource: '',
    exposureDuration: '',
    symptoms: [],
    diagnosisDate: new Date().toISOString().split('T')[0],
    labResults: [],
    medicalCheckupId: '',
    status: 'Active',
    assignedDoctor: '',
    assignedDoctorId: '',
    notes: '',
    company: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [riskFactorInput, setRiskFactorInput] = useState('');
  const [symptomInput, setSymptomInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [users, setUsers] = useState([]);

  const API_BASE = 'http://localhost:5000';
  const role = session?.role;
  const canEdit = role === 'Admin' || role === 'Doctor' || role === 'Supervisor';
  const canDelete = role === 'Admin';

  const categories = [
    { id: 'respiratory', name: 'Pernapasan', icon: FaLungs, color: '#ef4444' },
    { id: 'musculoskeletal', name: 'Muskuloskeletal', icon: FaBone, color: '#f59e0b' },
    { id: 'dermatological', name: 'Kulit', icon: FaStethoscope, color: '#10b981' },
    { id: 'neurological', name: 'Neurologis', icon: FaBrain, color: '#8b5cf6' },
    { id: 'sensory', name: 'Indra', icon: FaEye, color: '#06b6d4' },
    { id: 'cancer', name: 'Kanker', icon: FaStethoscope, color: '#ec4899' }
  ];

  const fetchDiseases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/occupational-diseases`);
      if (res.ok) {
        const data = await res.json();
        setDiseases(data);
      }
    } catch (err) {
      console.error('Gagal fetch diseases:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/occupational-diseases/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Gagal fetch stats:', err);
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
    fetchDiseases();
    fetchStats();
    fetchUsers();
  }, []);

  const sendNotification = async (message, link = '/occupational-diseases') => {
    try {
      await fetch(`${API_BASE}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          type: 'warning',
          category: 'Insiden',
          link,
          role: 'Doctor',
          read: false
        })
      });
      setNotifications?.(prev => [{ id: Date.now(), message, date: new Date().toISOString(), read: false }, ...prev]);
    } catch (err) {
      console.error('Gagal kirim notifikasi:', err);
    }
  };

  const predictRisk = async () => {
    // Simulasi AI prediction berdasarkan faktor risiko
    const riskFactors = formData.riskFactors;
    const category = formData.category;
    let score = 0;
    
    if (category === 'respiratory') score += 30;
    if (riskFactors.includes('Debu')) score += 20;
    if (riskFactors.includes('Kimia')) score += 25;
    if (riskFactors.includes('Kebisingan')) score += 15;
    if (formData.exposureDuration) {
      const duration = parseInt(formData.exposureDuration);
      if (duration > 10) score += 20;
      else if (duration > 5) score += 10;
    }
    
    let riskLevel = 'Rendah';
    let color = 'green';
    if (score >= 70) { riskLevel = 'Tinggi'; color = 'red'; }
    else if (score >= 40) { riskLevel = 'Sedang'; color = 'orange'; }
    
    setRiskPrediction({ score, riskLevel, color });
  };

  const uploadFile = async (file) => {
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('files', file);
    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formDataUpload
      });
      if (res.ok) {
        const data = await res.json();
        return data.files[0]?.url || '';
      }
      return '';
    } catch (err) {
      console.error('Upload gagal:', err);
      return '';
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patientName.trim() || !formData.diagnosis.trim()) {
      alert('Nama pasien dan diagnosis wajib diisi!');
      return;
    }
    try {
      let url = `${API_BASE}/api/occupational-diseases`;
      let method = 'POST';
      if (editingId) {
        url = `${API_BASE}/api/occupational-diseases/${editingId}`;
        method = 'PUT';
      }
      const dataToSend = {
        ...formData,
        diagnosisDate: new Date(formData.diagnosisDate)
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      if (res.ok) {
        await fetchDiseases();
        await fetchStats();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          patientName: '', patientId: '', age: '', gender: 'Laki-laki',
          diagnosis: '', category: 'respiratory', severity: 'Medium',
          riskFactors: [], exposureSource: '', exposureDuration: '',
          symptoms: [], diagnosisDate: new Date().toISOString().split('T')[0],
          labResults: [], medicalCheckupId: '', status: 'Active',
          assignedDoctor: '', assignedDoctorId: '', notes: '', company: ''
        });
        setRiskPrediction(null);
        if (!editingId && formData.severity === 'High') {
          sendNotification(`⚠️ Kasus penyakit akibat kerja baru: ${formData.diagnosis} - ${formData.patientName} (Severity: High)`);
        }
      }
    } catch (err) {
      console.error('Gagal simpan:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus data penyakit ini?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/occupational-diseases/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDiseases();
        await fetchStats();
        setShowDetail(false);
      }
    } catch (err) {
      console.error('Gagal hapus:', err);
    }
  };

  const openDetail = (disease) => {
    setSelectedDisease(disease);
    setShowDetail(true);
  };

  const openEdit = (disease) => {
    setEditingId(disease._id);
    setFormData({
      patientName: disease.patientName,
      patientId: disease.patientId || '',
      age: disease.age || '',
      gender: disease.gender || 'Laki-laki',
      diagnosis: disease.diagnosis,
      category: disease.category,
      severity: disease.severity,
      riskFactors: disease.riskFactors || [],
      exposureSource: disease.exposureSource || '',
      exposureDuration: disease.exposureDuration || '',
      symptoms: disease.symptoms || [],
      diagnosisDate: disease.diagnosisDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      labResults: disease.labResults || [],
      medicalCheckupId: disease.medicalCheckupId || '',
      status: disease.status || 'Active',
      assignedDoctor: disease.assignedDoctor || '',
      assignedDoctorId: disease.assignedDoctorId || '',
      notes: disease.notes || '',
      company: disease.company || ''
    });
    setShowForm(true);
    setShowDetail(false);
  };

  const addRiskFactor = () => {
    if (riskFactorInput.trim() && !formData.riskFactors.includes(riskFactorInput.trim())) {
      setFormData(prev => ({ ...prev, riskFactors: [...prev.riskFactors, riskFactorInput.trim()] }));
      setRiskFactorInput('');
    }
  };

  const removeRiskFactor = (factor) => {
    setFormData(prev => ({ ...prev, riskFactors: prev.riskFactors.filter(f => f !== factor) }));
  };

  const addSymptom = () => {
    if (symptomInput.trim() && !formData.symptoms.includes(symptomInput.trim())) {
      setFormData(prev => ({ ...prev, symptoms: [...prev.symptoms, symptomInput.trim()] }));
      setSymptomInput('');
    }
  };

  const removeSymptom = (symptom) => {
    setFormData(prev => ({ ...prev, symptoms: prev.symptoms.filter(s => s !== symptom) }));
  };

  // Filter data
  const filteredDiseases = diseases.filter(d => {
    const matchSearch = d.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        d.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'all' || d.category === categoryFilter;
    const matchSeverity = severityFilter === 'all' || d.severity === severityFilter;
    return matchSearch && matchCategory && matchSeverity;
  });

  // Chart data
  const categoryChartData = categories.map(cat => ({
    name: cat.name,
    value: stats.byCategory?.[cat.id] || 0,
    color: cat.color
  })).filter(c => c.value > 0);

  const severityChartData = [
    { name: 'Low', value: stats.bySeverity?.Low || 0, color: '#10b981' },
    { name: 'Medium', value: stats.bySeverity?.Medium || 0, color: '#f59e0b' },
    { name: 'High', value: stats.bySeverity?.High || 0, color: '#ef4444' },
    { name: 'Critical', value: stats.bySeverity?.Critical || 0, color: '#dc2626' }
  ].filter(s => s.value > 0);

  // Trend data (7 hari terakhir)
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
    count: diseases.filter(d => d.createdAt?.split('T')[0] === day).length
  }));

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'Critical': return 'bg-red-600 text-white';
      case 'High': return 'bg-red-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-red-100 text-red-700';
      case 'In Treatment': return 'bg-yellow-100 text-yellow-700';
      case 'Recovered': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-6 px-4 transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-slate-50 via-rose-50/30 to-pink-50/30'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FaStethoscope className="text-4xl text-rose-500" />
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Penyakit Akibat Kerja
              </h1>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Pusat monitoring kesehatan pekerja
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            {canEdit && (
              <button onClick={() => { setEditingId(null); setFormData({ patientName: '', patientId: '', age: '', gender: 'Laki-laki', diagnosis: '', category: 'respiratory', severity: 'Medium', riskFactors: [], exposureSource: '', exposureDuration: '', symptoms: [], diagnosisDate: new Date().toISOString().split('T')[0], labResults: [], medicalCheckupId: '', status: 'Active', assignedDoctor: '', assignedDoctorId: '', notes: '', company: '' }); setRiskPrediction(null); setShowForm(true); }} className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg transition flex items-center gap-2">
                <FaPlus /> Tambah Kasus
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.total}</p>
            <p className="text-xs text-gray-500">Total Kasus</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className="text-2xl font-bold text-red-600">{stats.active || 0}</p>
            <p className="text-xs text-gray-500">Aktif</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className="text-2xl font-bold text-yellow-600">{stats.bySeverity?.High || 0}</p>
            <p className="text-xs text-gray-500">High Risk</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className="text-2xl font-bold text-green-600">{stats.bySeverity?.Low || 0}</p>
            <p className="text-xs text-gray-500">Low Risk</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaChartLine className="text-rose-500" /> Trend Kasus (7 Hari)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Distribusi per Kategori</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryChartData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name}) => name}>
                  {categoryChartData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`} />
            <input type="text" placeholder="Cari pasien atau diagnosis..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-300 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            <option value="all">Semua Kategori</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            <option value="all">Semua Severity</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        {/* Card Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDiseases.map((disease, idx) => (
            <motion.div
              key={disease._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className={`rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white/80 backdrop-blur border border-white/40'}`}
              onClick={() => openDetail(disease)}
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{disease.patientName}</h3>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{disease.diagnosis}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(disease.severity)}`}>
                      {disease.severity}
                    </span>
                  </div>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <FaUser className="text-gray-400 text-xs" />
                    <span>Umur: {disease.age} tahun</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(disease.status)}`}>
                      {disease.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(disease.diagnosisDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filteredDiseases.length === 0 && (
            <div className={`col-span-full text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <FaStethoscope className="mx-auto text-6xl text-rose-300 mb-4" />
              <p>Belum ada data penyakit akibat kerja. {canEdit && 'Klik "Tambah Kasus" untuk menambahkan.'}</p>
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
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Nama Pasien *" value={formData.patientName} onChange={e => setFormData({...formData, patientName: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} required />
                  <input type="text" placeholder="ID Pasien" value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Umur" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                    <option>Laki-laki</option><option>Perempuan</option><option>Lainnya</option>
                  </select>
                </div>
                <input type="text" placeholder="Diagnosis *" value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} required />
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <select value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                </select>
                <input type="date" value={formData.diagnosisDate} onChange={e => setFormData({...formData, diagnosisDate: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <input type="text" placeholder="Perusahaan" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Faktor Risiko</label>
                  <div className="flex gap-2 mt-1">
                    <input type="text" value={riskFactorInput} onChange={e => setRiskFactorInput(e.target.value)} placeholder="Tambah faktor" className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    <button type="button" onClick={addRiskFactor} className="px-3 py-2 bg-green-500 text-white rounded-lg">+</button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.riskFactors.map(f => <span key={f} className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs flex items-center gap-1">{f}<button type="button" onClick={() => removeRiskFactor(f)} className="text-red-500">×</button></span>)}
                  </div>
                </div>
                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Gejala</label>
                  <div className="flex gap-2 mt-1">
                    <input type="text" value={symptomInput} onChange={e => setSymptomInput(e.target.value)} placeholder="Tambah gejala" className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    <button type="button" onClick={addSymptom} className="px-3 py-2 bg-green-500 text-white rounded-lg">+</button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {formData.symptoms.map(s => <span key={s} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">{s}<button type="button" onClick={() => removeSymptom(s)} className="text-red-500">×</button></span>)}
                  </div>
                </div>
                <input type="text" placeholder="Sumber Paparan" value={formData.exposureSource} onChange={e => setFormData({...formData, exposureSource: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <input type="text" placeholder="Durasi Paparan (tahun)" value={formData.exposureDuration} onChange={e => setFormData({...formData, exposureDuration: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option>Active</option><option>In Treatment</option><option>Recovered</option><option>Deceased</option>
                </select>
                <select value={formData.assignedDoctorId} onChange={e => {
                  const doctor = users.find(u => u._id === e.target.value);
                  setFormData({...formData, assignedDoctorId: e.target.value, assignedDoctor: doctor?.name || ''});
                }} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option value="">Assign Dokter...</option>
                  {users.filter(u => u.role === 'Admin' || u.role === 'Supervisor' || u.role === 'Doctor').map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
                <textarea placeholder="Catatan Medis" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="2" />
                <div>
                  <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Upload Hasil Lab</label>
                  <input type="file" accept="image/*,application/pdf" onChange={async (e) => {
                    const url = await uploadFile(e.target.files[0]);
                    if (url) setFormData(prev => ({ ...prev, labResults: [...prev.labResults, url] }));
                  }} className={`w-full p-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                  {formData.labResults.length > 0 && <div className="mt-1 text-xs text-green-500">{formData.labResults.length} file terupload</div>}
                </div>
                <button type="button" onClick={predictRisk} className="w-full py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition">🧠 Analisis Risiko (AI)</button>
                {riskPrediction && (
                  <div className={`p-3 rounded-lg text-center ${riskPrediction.color === 'red' ? 'bg-red-100 text-red-700' : riskPrediction.color === 'orange' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    <p className="font-semibold">Skor Risiko: {riskPrediction.score}</p>
                    <p>Tingkat Risiko: {riskPrediction.riskLevel}</p>
                  </div>
                )}
                <button type="submit" disabled={uploading} className="w-full py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-semibold hover:from-rose-600 hover:to-pink-600 transition">
                  {uploading ? 'Uploading...' : (editingId ? 'Update' : 'Simpan')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Detail */}
      <AnimatePresence>
        {showDetail && selectedDisease && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowDetail(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className={`relative w-full max-w-lg rounded-t-3xl shadow-2xl p-6 pb-8 max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{selectedDisease.patientName}</h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedDisease.diagnosis}</p>
                </div>
                <button onClick={() => setShowDetail(false)} className="text-gray-400"><FaTimes /></button>
              </div>
              <div className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p><span className="font-semibold">ID Pasien:</span> {selectedDisease.patientId || '-'}</p>
                <p><span className="font-semibold">Umur:</span> {selectedDisease.age} tahun</p>
                <p><span className="font-semibold">Jenis Kelamin:</span> {selectedDisease.gender}</p>
                <p><span className="font-semibold">Kategori:</span> {categories.find(c => c.id === selectedDisease.category)?.name}</p>
                <p><span className="font-semibold">Severity:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${getSeverityColor(selectedDisease.severity)}`}>{selectedDisease.severity}</span></p>
                <p><span className="font-semibold">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedDisease.status)}`}>{selectedDisease.status}</span></p>
                <p><span className="font-semibold">Tanggal Diagnosis:</span> {new Date(selectedDisease.diagnosisDate).toLocaleDateString()}</p>
                <p><span className="font-semibold">Perusahaan:</span> {selectedDisease.company || '-'}</p>
                <p><span className="font-semibold">Dokter:</span> {selectedDisease.assignedDoctor || '-'}</p>
                <p><span className="font-semibold">Sumber Paparan:</span> {selectedDisease.exposureSource || '-'}</p>
                <p><span className="font-semibold">Durasi Paparan:</span> {selectedDisease.exposureDuration || '-'} tahun</p>
                <p><span className="font-semibold">Faktor Risiko:</span> {selectedDisease.riskFactors?.join(', ') || '-'}</p>
                <p><span className="font-semibold">Gejala:</span> {selectedDisease.symptoms?.join(', ') || '-'}</p>
                <p><span className="font-semibold">Catatan Medis:</span> {selectedDisease.notes || '-'}</p>
                {selectedDisease.labResults?.length > 0 && <p><span className="font-semibold">Hasil Lab:</span> {selectedDisease.labResults.length} file</p>}
              </div>
              {canEdit && (
                <div className="flex gap-3 mt-6">
                  <button onClick={() => openEdit(selectedDisease)} className="flex-1 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition">✏️ Edit</button>
                  {canDelete && <button onClick={() => handleDelete(selectedDisease._id)} className="flex-1 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">🗑️ Hapus</button>}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OccupationalDiseases;