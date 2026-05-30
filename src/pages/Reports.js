import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaFileAlt, FaExclamationTriangle, FaEye, FaClipboardList,
  FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaMapMarkerAlt,
  FaCamera, FaMicrophone, FaRobot, FaChartLine, FaBell,
  FaMoon, FaSun, FaTimes, FaSpinner, FaLocationArrow, FaCheckCircle
} from 'react-icons/fa';
import { UserContext } from '../App';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationPicker = ({ onLocationSelect }) => {
  const [position, setPosition] = useState(null);
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    }
  });
  return position ? <Marker position={position} /> : null;
};

const Reports = () => {
  const { session, darkMode, toggleDarkMode, notifications, setNotifications } = useContext(UserContext);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, byType: {}, bySeverity: {} });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    type: 'Incident',
    severity: 'Medium',
    description: '',
    location: '',
    locationGps: null,
    photo: null,
    voiceNote: '',
    reporter: '',
    assignedTo: '',
    assignedToId: '',
    status: 'Open'
  });
  const [editingId, setEditingId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [detectedHazards, setDetectedHazards] = useState([]);
  const [users, setUsers] = useState([]);
  const recognitionRef = useRef(null);
  const photoInputRef = useRef(null);

  const API_BASE = 'http://localhost:5000';
  const userId = session?.userId || 'anonymous';
  const canEdit = session?.role === 'Admin' || session?.role === 'Supervisor';
  const canDelete = session?.role === 'Admin';

  const reportTypes = ['Incident', 'Near Miss', 'Observation', 'Hazard', 'Inspection'];
  const severities = ['Low', 'Medium', 'High', 'Critical'];
  const statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/reports?`;
      if (typeFilter !== 'all') url += `type=${typeFilter}&`;
      if (severityFilter !== 'all') url += `severity=${severityFilter}&`;
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Gagal fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports/stats`);
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
    fetchReports();
    fetchStats();
    fetchUsers();
  }, [typeFilter, severityFilter, statusFilter]);

  const analyzeDescription = (text) => {
    const hazardKeywords = {
      'Fire': ['kebakaran', 'api', 'terbakar', 'asap', 'ledakan'],
      'Fall': ['jatuh', 'terjatuh', 'terpeleset', 'ketinggian'],
      'Chemical': ['kimia', 'racun', 'b3', 'toksik'],
      'Electrical': ['listrik', 'konsleting', 'tersengat'],
      'Machinery': ['mesin', 'alat berat', 'forklift', 'crane']
    };
    const detected = [];
    const lowerText = text.toLowerCase();
    for (const [hazard, keywords] of Object.entries(hazardKeywords)) {
      if (keywords.some(kw => lowerText.includes(kw))) {
        detected.push(hazard);
      }
    }
    setDetectedHazards(detected);
    if (detected.includes('Fire') || detected.includes('Chemical')) {
      setFormData(prev => ({ ...prev, severity: 'High' }));
    } else if (detected.includes('Fall') || detected.includes('Machinery')) {
      setFormData(prev => ({ ...prev, severity: 'Medium' }));
    }
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Browser tidak mendukung voice input');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setFormData(prev => ({ ...prev, voiceNote: transcript, description: prev.description + ' ' + transcript }));
      analyzeDescription(transcript);
    };
    recognition.start();
    recognitionRef.current = recognition;
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

  const capturePhoto = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setFormData(prev => ({ ...prev, photo: ev.target.result }));
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (file) => {
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
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Judul dan deskripsi wajib diisi!');
      return;
    }
    try {
      let url = `${API_BASE}/api/reports`;
      let method = 'POST';
      if (editingId) {
        url = `${API_BASE}/api/reports/${editingId}`;
        method = 'PUT';
      }
      const dataToSend = {
        ...formData,
        reporter: session?.name || 'Anonymous',
        reporterId: userId,
        autoDetectedHazards: detectedHazards
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      if (res.ok) {
        await fetchReports();
        await fetchStats();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          title: '', type: 'Incident', severity: 'Medium', description: '', location: '', locationGps: null,
          photo: null, voiceNote: '', reporter: '', assignedTo: '', assignedToId: '', status: 'Open'
        });
        setDetectedHazards([]);
      }
    } catch (err) {
      console.error('Gagal simpan:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus laporan ini?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchReports();
        await fetchStats();
        setShowDetail(false);
      }
    } catch (err) {
      console.error('Gagal hapus:', err);
    }
  };

  const openDetail = (report) => {
    setSelectedReport(report);
    setShowDetail(true);
  };

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
      case 'Open': return 'bg-red-100 text-red-700';
      case 'In Progress': return 'bg-yellow-100 text-yellow-700';
      case 'Resolved': return 'bg-blue-100 text-blue-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const filteredReports = reports.filter(r => {
    const matchSearch = r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  // Map Modal Component
  const MapModal = () => {
    if (!showMap) return null;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowMap(false)}>
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`rounded-2xl p-4 w-full max-w-2xl h-96 ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-2">
            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Pilih Lokasi di Peta</h3>
            <button onClick={() => setShowMap(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
          </div>
          <MapContainer center={[-6.200000, 106.816666]} zoom={13} style={{ height: 'calc(100% - 40px)', borderRadius: '12px' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' />
            <LocationPicker onLocationSelect={(latlng) => {
              setFormData(prev => ({
                ...prev,
                locationGps: latlng,
                location: `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`
              }));
              setShowMap(false);
            }} />
          </MapContainer>
        </motion.div>
      </motion.div>
    );
  };

  // Detail Modal Component
  const DetailModal = () => {
    if (!showDetail || !selectedReport) return null;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetail(false)}>
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Detail Laporan</h2>
            <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
          </div>
          <div className="space-y-3">
            <div><strong>Judul:</strong> {selectedReport.title}</div>
            <div><strong>Tipe:</strong> {selectedReport.type}</div>
            <div><strong>Severity:</strong> <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(selectedReport.severity)}`}>{selectedReport.severity}</span></div>
            <div><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedReport.status)}`}>{selectedReport.status}</span></div>
            <div><strong>Deskripsi:</strong> <p className="mt-1 text-gray-600 dark:text-gray-300">{selectedReport.description}</p></div>
            <div><strong>Lokasi:</strong> {selectedReport.location || '-'}</div>
            <div><strong>Pelapor:</strong> {selectedReport.reporter}</div>
            <div><strong>Ditugaskan ke:</strong> {selectedReport.assignedTo || '-'}</div>
            <div><strong>Tanggal:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</div>
            {selectedReport.autoDetectedHazards?.length > 0 && (
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <FaRobot className="inline mr-2" /> Hazard terdeteksi: {selectedReport.autoDetectedHazards.join(', ')}
              </div>
            )}
            {selectedReport.photo && <img src={selectedReport.photo} alt="Bukti" className="w-full rounded-lg" />}
          </div>
          <div className="flex gap-2 mt-6">
            {canEdit && <button onClick={() => { setEditingId(selectedReport._id); setFormData(selectedReport); setDetectedHazards(selectedReport.autoDetectedHazards || []); setShowForm(true); setShowDetail(false); }} className="flex-1 py-2 bg-blue-500 text-white rounded-lg">Edit</button>}
            {canDelete && <button onClick={() => handleDelete(selectedReport._id)} className="flex-1 py-2 bg-red-500 text-white rounded-lg">Hapus</button>}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-6 px-4 transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-slate-50 via-orange-50/30 to-red-50/30'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FaFileAlt className="text-4xl text-orange-500" />
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Laporan & Export
              </h1>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Kelola laporan insiden, near miss, dan observasi
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button onClick={() => { setEditingId(null); setFormData({ title: '', type: 'Incident', severity: 'Medium', description: '', location: '', locationGps: null, photo: null, voiceNote: '', reporter: '', assignedTo: '', assignedToId: '', status: 'Open' }); setDetectedHazards([]); setShowForm(true); }} className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg transition flex items-center gap-2">
              <FaPlus /> Buat Laporan
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.total}</p>
            <p className="text-xs text-gray-500">Total Laporan</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className="text-2xl font-bold text-red-600">{stats.open}</p>
            <p className="text-xs text-gray-500">Open</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            <p className="text-xs text-gray-500">In Progress</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            <p className="text-xs text-gray-500">Resolved</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className="text-2xl font-bold text-blue-600">{stats.closed}</p>
            <p className="text-xs text-gray-500">Closed</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`} />
            <input type="text" placeholder="Cari laporan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-300 outline-none transition ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            <option value="all">Semua Tipe</option>
            {reportTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            <option value="all">Semua Severity</option>
            {severities.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`px-4 py-2 border rounded-xl outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`}>
            <option value="all">Semua Status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Reports Table */}
        <div className={`rounded-2xl shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Judul</th>
                  <th className="p-3 text-left">Tipe</th>
                  <th className="p-3 text-left">Severity</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Lokasi</th>
                  <th className="p-3 text-left">Tanggal</th>
                  <th className="p-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(report => (
                  <tr key={report._id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer`} onClick={() => openDetail(report)}>
                    <td className="p-3 font-mono text-xs">{report._id.slice(-6)}</td>
                    <td className="p-3 font-medium">{report.title}</td>
                    <td className="p-3">{report.type}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(report.severity)}`}>
                        {report.severity}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs truncate">{report.location || '-'}</td>
                    <td className="p-3">{new Date(report.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(report._id); setFormData(report); setDetectedHazards(report.autoDetectedHazards || []); setShowForm(true); setShowDetail(false); }} className="text-blue-500 mr-2 hover:text-blue-700">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(report._id); }} className="text-red-500 hover:text-red-700">Hapus</button>
                    </td>
                  </tr>
                ))}
                {filteredReports.length === 0 && (
                  <tr><td colSpan="8" className="text-center py-8 text-gray-400">Belum ada laporan. Klik "Buat Laporan" untuk memulai.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <MapModal />
      <DetailModal />

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{editingId ? 'Edit Laporan' : 'Buat Laporan Baru'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <input type="text" placeholder="Judul Laporan *" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} required />
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  {reportTypes.map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  {severities.map(s => <option key={s}>{s}</option>)}
                </select>
                <div className="flex gap-2">
                  <textarea placeholder="Deskripsi kejadian *" value={formData.description} onChange={e => { setFormData({...formData, description: e.target.value}); analyzeDescription(e.target.value); }} className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="3" required />
                  <button type="button" onClick={startVoiceInput} className={`px-3 py-2 rounded-lg transition ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-purple-500 text-white hover:bg-purple-600'}`}>
                    <FaMicrophone />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Lokasi" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                  <button type="button" onClick={getCurrentLocation} className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                    {gettingLocation ? <FaSpinner className="animate-spin" /> : <FaLocationArrow />}
                  </button>
                  <button type="button" onClick={() => setShowMap(true)} className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">🗺️</button>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={capturePhoto} className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">📷 Upload Foto</button>
                  <input type="file" ref={photoInputRef} accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </div>
                {formData.photo && <img src={formData.photo} alt="Preview" className="w-full h-32 object-cover rounded-lg" />}
                <select value={formData.assignedToId} onChange={e => {
                  const user = users.find(u => u._id === e.target.value);
                  setFormData({...formData, assignedToId: e.target.value, assignedTo: user?.name || ''});
                }} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  <option value="">Assign ke...</option>
                  {users.filter(u => u.role === 'Supervisor' || u.role === 'Admin').map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                </select>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
                {detectedHazards.length > 0 && (
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <FaRobot className="inline mr-2" /> AI mendeteksi potensi bahaya: {detectedHazards.join(', ')}
                  </div>
                )}
                <button type="submit" disabled={uploading} className="w-full py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition">
                  {uploading ? <FaSpinner className="animate-spin inline" /> : (editingId ? 'Update' : 'Simpan Laporan')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;