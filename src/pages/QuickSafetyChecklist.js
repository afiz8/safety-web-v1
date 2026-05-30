import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaClipboardList, FaMapMarkerAlt, FaCamera, FaMicrophone, FaRobot,
  FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaChartLine,
  FaMoon, FaSun, FaBell, FaPlus, FaEdit, FaTrash, FaSpinner,
  FaArrowUp, FaArrowDown, FaTimes, FaDownload
} from 'react-icons/fa';
import { UserContext } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const QuickSafetyChecklist = () => {
  const { session, darkMode, toggleDarkMode, notifications } = useContext(UserContext);
  const [checklists, setChecklists] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, failed: 0, needsReview: 0, highRisk: 0, avgPassRate: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    template: 'Daily Patrol',
    location: '',
    latitude: '',
    longitude: '',
    items: [],
    reporter: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [aiRiskLevel, setAiRiskLevel] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const API_BASE = 'http://localhost:5000';
  const userId = session?.userId || 'anonymous';
  const canEdit = session?.role === 'Admin' || session?.role === 'Supervisor';

  const templates = {
    'Daily Patrol': [
      'Peralatan APD lengkap & serviceable',
      'Peralatan kerja inspected & tagged',
      'Hazard controls in place (barricade/signage)',
      'Emergency equipment accessible',
      'Work area housekeeping OK',
      'JSA/Toolbox conducted'
    ],
    'Equipment Check': [
      'Oil level OK',
      'Fuel level sufficient',
      'Tires/Tracks condition good',
      'Brakes & controls functional',
      'Safety guards installed',
      'Hour meter reading'
    ],
    'PPE Inspection': [
      'Helmet condition OK',
      'Safety glasses clean',
      'Hearing protection serviceable',
      'Gloves appropriate for task',
      'Safety boots good condition',
      'Harness & lanyard inspected'
    ],
    'JSA Toolbox': [
      'Job steps identified',
      'Hazards per step listed',
      'Controls specified',
      'Team briefed & signed',
      'Emergency plan reviewed',
      'Permit verified'
    ]
  };

  const fetchChecklists = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/safety-checklists?reporterId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setChecklists(data);
      }
    } catch (err) {
      console.error('Gagal fetch checklists:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/safety-checklists/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Gagal fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchChecklists();
    fetchStats();
  }, []);

  const handleTemplateChange = (template) => {
    setFormData(prev => ({
      ...prev,
      template,
      items: templates[template].map(name => ({ name, checked: false, photo: null, note: '' }))
    }));
  };

  const toggleItem = (index, checked) => {
    const newItems = [...formData.items];
    newItems[index].checked = checked;
    setFormData(prev => ({ ...prev, items: newItems }));
    
    // AI Risk Detection based on answers
    const passCount = newItems.filter(i => i.checked).length;
    const passRate = (passCount / newItems.length) * 100;
    if (passRate >= 80) setAiRiskLevel('Low');
    else if (passRate >= 60) setAiRiskLevel('Medium');
    else setAiRiskLevel('High');
  };

  const capturePhoto = async (itemIndex) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoRef.current.srcObject = stream;
      await new Promise(r => videoRef.current.onloadedmetadata = r);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      stream.getTracks().forEach(track => track.stop());
      const newItems = [...formData.items];
      newItems[itemIndex].photo = photoData;
      setFormData(prev => ({ ...prev, items: newItems }));
    } catch (err) {
      alert('Camera access denied: ' + err.message);
    }
  };

  const getGPS = () => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        setFormData(prev => ({
          ...prev,
          location: `GPS: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }));
      },
      err => alert('GPS access denied: ' + err.message),
      { enableHighAccuracy: true }
    );
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
      setVoiceText(transcript);
      // Auto fill note for first unchecked item
      const firstUncheckedIndex = formData.items.findIndex(i => !i.checked);
      if (firstUncheckedIndex !== -1) {
        const newItems = [...formData.items];
        newItems[firstUncheckedIndex].note = transcript;
        setFormData(prev => ({ ...prev, items: newItems }));
      }
    };
    recognition.start();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const passCount = formData.items.filter(i => i.checked).length;
    const passRate = (passCount / formData.items.length) * 100;
    if (passRate < 70) {
      if (!window.confirm(`Pass rate hanya ${Math.round(passRate)}% (minimal 70%). Tetap simpan?`)) return;
    }
    const riskLevel = passRate >= 80 ? 'Low' : passRate >= 60 ? 'Medium' : 'High';
    const status = passRate >= 80 ? 'Completed' : passRate >= 60 ? 'NeedsReview' : 'Failed';
    
    const dataToSend = {
      ...formData,
      passRate: Math.round(passRate),
      riskLevel,
      status,
      reporter: session?.name || 'Anonymous',
      reporterId: userId,
      date: new Date(formData.date)
    };
    try {
      let url = `${API_BASE}/api/safety-checklists`;
      let method = 'POST';
      if (editingId) {
        url = `${API_BASE}/api/safety-checklists/${editingId}`;
        method = 'PUT';
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });
      if (res.ok) {
        await fetchChecklists();
        await fetchStats();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          template: 'Daily Patrol', location: '', latitude: '', longitude: '',
          items: [], reporter: '', date: new Date().toISOString().split('T')[0]
        });
        setAiRiskLevel(null);
      }
    } catch (err) {
      console.error('Gagal simpan:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus checklist ini?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/safety-checklists/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchChecklists();
        await fetchStats();
        setShowDetail(false);
      }
    } catch (err) {
      console.error('Gagal hapus:', err);
    }
  };

  const openDetail = (checklist) => {
    setSelectedChecklist(checklist);
    setShowDetail(true);
  };

  // Chart data
  const trendData = checklists.slice(0, 10).reverse().map((c, idx) => ({
    name: idx + 1,
    passRate: c.passRate
  }));

  const pieData = [
    { name: 'Completed', value: stats.completed, color: '#10b981' },
    { name: 'Needs Review', value: stats.needsReview, color: '#f59e0b' },
    { name: 'Failed', value: stats.failed, color: '#ef4444' }
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
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FaClipboardList className="text-4xl text-green-500" />
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Quick Safety Checklist
              </h1>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Inspeksi lapangan cepat dengan GPS & kamera
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button onClick={() => { setEditingId(null); setFormData({ template: 'Daily Patrol', location: '', latitude: '', longitude: '', items: [], reporter: '', date: new Date().toISOString().split('T')[0] }); handleTemplateChange('Daily Patrol'); setShowForm(true); }} className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg transition flex items-center gap-2">
              <FaPlus /> Checklist Baru
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{stats.total}</p>
            <p className="text-xs text-gray-500">Total Checklist</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-gray-500">Completed</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className="text-2xl font-bold text-yellow-600">{stats.needsReview}</p>
            <p className="text-xs text-gray-500">Needs Review</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-xs text-gray-500">Failed</p>
          </div>
          <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <p className="text-2xl font-bold text-red-600">{stats.highRisk}</p>
            <p className="text-xs text-gray-500">High Risk</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
            <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaChartLine className="text-green-500" /> Trend Pass Rate
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="passRate" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {pieData.length > 0 && (
            <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Distribusi Status</h3>
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

        {/* Recent Checklists */}
        <div className={`rounded-2xl shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur overflow-hidden`}>
          <h3 className={`p-5 font-semibold border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>Riwayat Checklist</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                <tr>
                  <th className="p-3 text-left">Template</th>
                  <th className="p-3 text-left">Lokasi</th>
                  <th className="p-3 text-left">Pass Rate</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Tanggal</th>
                  <th className="p-3 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {checklists.slice(0, 10).map(cl => (
                  <tr key={cl._id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer`} onClick={() => openDetail(cl)}>
                    <td className="p-3 font-medium">{cl.template}</td>
                    <td className="p-3">{cl.location?.substring(0, 30) || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        cl.passRate >= 80 ? 'bg-green-100 text-green-700' :
                        cl.passRate >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>{cl.passRate}%</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        cl.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        cl.status === 'NeedsReview' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>{cl.status}</span>
                    </td>
                    <td className="p-3">{new Date(cl.date).toLocaleDateString()}</td>
                    <td className="p-3">
                      <button onClick={(e) => { e.stopPropagation(); setEditingId(cl._id); setFormData(cl); handleTemplateChange(cl.template); setShowForm(true); }} className="text-blue-500 mr-2">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(cl._id); }} className="text-red-500">Hapus</button>
                    </td>
                  </tr>
                ))}
                {checklists.length === 0 && (
                  <tr><td colSpan="6" className="text-center py-8 text-gray-400">Belum ada checklist. Klik "Checklist Baru" untuk memulai.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{editingId ? 'Edit Checklist' : 'Checklist Baru'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <select value={formData.template} onChange={e => handleTemplateChange(e.target.value)} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                    {Object.keys(templates).map(t => <option key={t}>{t}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Lokasi" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    <button type="button" onClick={getGPS} className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">GPS</button>
                    <button type="button" onClick={startVoiceInput} className={`px-3 py-2 rounded-lg transition flex items-center gap-1 ${isRecording ? 'bg-red-500 text-white' : 'bg-purple-500 text-white'}`}>
                      <FaMicrophone /> {isRecording ? '🎤' : '🎙️'}
                    </button>
                  </div>
                </div>
                <input type="text" placeholder="Nama Petugas" value={formData.reporter} onChange={e => setFormData({...formData, reporter: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={item.checked} onChange={e => toggleItem(idx, e.target.checked)} className="w-5 h-5" />
                        <span className={`flex-1 font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{item.name}</span>
                        <button type="button" onClick={() => capturePhoto(idx)} className="p-2 bg-purple-500 text-white rounded-lg text-sm">📷</button>
                      </div>
                      {item.photo && <img src={item.photo} alt="Evidence" className="w-20 h-20 object-cover rounded-lg mt-2" />}
                      <textarea placeholder="Catatan (atau gunakan voice input)" value={item.note} onChange={e => {
                        const newItems = [...formData.items];
                        newItems[idx].note = e.target.value;
                        setFormData({...formData, items: newItems});
                      }} className={`w-full mt-2 p-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="1" />
                    </div>
                  ))}
                </div>
                
                {aiRiskLevel && (
                  <div className={`p-3 rounded-lg text-center ${aiRiskLevel === 'High' ? 'bg-red-100 text-red-700' : aiRiskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    <FaRobot className="inline mr-2" /> AI Risk Level: {aiRiskLevel}
                  </div>
                )}
                
                <button type="submit" className="w-full py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition">
                  Simpan Checklist
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Detail */}
      <AnimatePresence>
        {showDetail && selectedChecklist && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowDetail(false)}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className={`relative w-full max-w-lg rounded-t-3xl shadow-2xl p-6 pb-8 max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{selectedChecklist.template}</h2>
                <button onClick={() => setShowDetail(false)} className="text-gray-400"><FaTimes /></button>
              </div>
              <div className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                <p><span className="font-semibold">Lokasi:</span> {selectedChecklist.location || '-'}</p>
                <p><span className="font-semibold">Petugas:</span> {selectedChecklist.reporter || '-'}</p>
                <p><span className="font-semibold">Tanggal:</span> {new Date(selectedChecklist.date).toLocaleDateString()}</p>
                <p><span className="font-semibold">Pass Rate:</span> {selectedChecklist.passRate}%</p>
                <p><span className="font-semibold">Risk Level:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${selectedChecklist.riskLevel === 'High' ? 'bg-red-100 text-red-700' : selectedChecklist.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{selectedChecklist.riskLevel}</span></p>
                <div className="mt-3">
                  <p className="font-semibold">Item Checklist:</p>
                  <div className="mt-2 space-y-2">
                    {selectedChecklist.items?.map((item, idx) => (
                      <div key={idx} className={`p-2 rounded-lg ${item.checked ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        <div className="flex items-center gap-2">
                          {item.checked ? <FaCheckCircle className="text-green-500" /> : <FaTimesCircle className="text-red-500" />}
                          <span>{item.name}</span>
                        </div>
                        {item.note && <p className="text-sm text-gray-500 mt-1 ml-6">Catatan: {item.note}</p>}
                        {item.photo && <img src={item.photo} alt="Evidence" className="w-16 h-16 object-cover rounded-lg mt-1 ml-6" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setEditingId(selectedChecklist._id); setFormData(selectedChecklist); handleTemplateChange(selectedChecklist.template); setShowForm(true); setShowDetail(false); }} className="flex-1 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition">✏️ Edit</button>
                  <button onClick={() => handleDelete(selectedChecklist._id)} className="flex-1 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">🗑️ Hapus</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera hidden elements */}
      <div style={{ display: 'none' }}>
        <video ref={videoRef} autoPlay muted playsInline />
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default QuickSafetyChecklist;