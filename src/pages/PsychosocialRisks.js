// src/pages/PsychosocialRisks.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBrain, FaHeart, FaUsers, FaExclamationTriangle, FaShieldAlt,
  FaSmile, FaMeh, FaFrown, FaAngry, FaChartLine, FaCalendarAlt,
  FaBell, FaMusic, FaHeadphones, FaRobot, FaChartBar, FaClipboardList,
  FaCheckCircle, FaMoon, FaSun, FaClock, FaRegSmile, FaRegFrown,
  FaRegMeh, FaRegAngry, FaRegHeart, FaRegComments, FaFileAlt,
  FaDownload, FaShare, FaPlus, FaEdit, FaTrash
} from 'react-icons/fa';
import { UserContext } from '../App';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const PsychosocialRisks = () => {
  const { session, darkMode, toggleDarkMode, notifications, setShowNotifPanel } = useContext(UserContext);
  
  // ==================== STATE ====================
  const [activeTab, setActiveTab] = useState('mood');
  const [moodCheck, setMoodCheck] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [moodReport, setMoodReport] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [burnoutScore, setBurnoutScore] = useState(null);
  const [burnoutRisk, setBurnoutRisk] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [stressHeatmap, setStressHeatmap] = useState([]);
  const [relaxationPlaying, setRelaxationPlaying] = useState(false);
  const [audioTrack, setAudioTrack] = useState(null);
  const [wellbeingReminders, setWellbeingReminders] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkInReminder, setCheckInReminder] = useState(null);
  const audioRef = useRef(null);

  const role = session?.role;
  const isAdmin = role === 'Admin';
  const isSupervisor = role === 'Supervisor' || role === 'Admin';

  // Mood options
  const moodOptions = [
    { value: 'great', label: 'Sangat Baik', icon: FaRegSmile, color: 'bg-green-500', emoji: '😊', score: 5 },
    { value: 'good', label: 'Baik', icon: FaSmile, color: 'bg-emerald-500', emoji: '🙂', score: 4 },
    { value: 'neutral', label: 'Biasa Saja', icon: FaRegMeh, color: 'bg-yellow-500', emoji: '😐', score: 3 },
    { value: 'stressed', label: 'Stres', icon: FaFrown, color: 'bg-orange-500', emoji: '😟', score: 2 },
    { value: 'exhausted', label: 'Burnout', icon: FaRegAngry, color: 'bg-red-500', emoji: '😫', score: 1 }
  ];

  // Relaxation audio tracks
  const relaxationTracks = [
    { id: 1, name: 'Nature Sounds - Forest', url: '/audio/forest.mp3', duration: '10:00', type: 'nature' },
    { id: 2, name: 'Calm Piano', url: '/audio/piano.mp3', duration: '15:00', type: 'instrumental' },
    { id: 3, name: 'Ocean Waves', url: '/audio/ocean.mp3', duration: '12:00', type: 'nature' },
    { id: 4, name: 'Guided Breathing', url: '/audio/breathing.mp3', duration: '5:00', type: 'guided' }
  ];

  // Tabs
  const tabs = [
    { id: 'mood', label: 'Cek Mood', icon: FaRegHeart },
    { id: 'stress', label: 'Stres Kerja', icon: FaExclamationTriangle },
    { id: 'harassment', label: 'Pelecehan', icon: FaUsers },
    { id: 'violence', label: 'Kekerasan', icon: FaShieldAlt },
    { id: 'mental', label: 'Kesehatan Mental', icon: FaBrain },
    { id: 'dashboard', label: 'Analytics', icon: FaChartLine }
  ];

  // Content data
  const content = {
    stress: {
      title: 'Stres Kerja',
      description: 'Stres kerja adalah respons fisik dan emosional yang merusak ketika persyaratan pekerjaan tidak sesuai dengan kemampuan, sumber daya, atau kebutuhan pekerja.',
      causes: ['Beban kerja berlebihan', 'Tuntutan waktu ketat', 'Kurangnya kontrol', 'Konflik peran', 'Ketidakpastian pekerjaan', 'Kurangnya dukungan'],
      effects: ['Gangguan tidur', 'Kelelahan kronis', 'Gangguan pencernaan', 'Penyakit jantung', 'Depresi & kecemasan', 'Penurunan produktivitas'],
      prevention: ['Job redesign', 'Pelatihan stres', 'Fleksibilitas kerja', 'EAP program', 'Komunikasi terbuka', 'Work-life balance']
    },
    harassment: {
      title: 'Pelecehan di Tempat Kerja',
      description: 'Perilaku tidak diinginkan yang melukai martabat seseorang dan menciptakan lingkungan kerja yang mengintimidasi.',
      types: [
        { name: 'Pelecehan Seksual', desc: 'Perilaku seksual tidak diinginkan, komentar, atau sentuhan' },
        { name: 'Pelecehan Verbal', desc: 'Penghinaan, ejekan, atau komentar merendahkan' },
        { name: 'Pelecehan Non-Verbal', desc: 'Gerakan, ekspresi, atau tindakan mengintimidasi' },
        { name: 'Pelecehan Online', desc: 'Cyberbullying, pesan tidak diinginkan di media digital' }
      ],
      prevention: ['Kebijakan zero tolerance', 'Pelatihan kesadaran', 'Mekanisme pelaporan', 'Investigasi cepat', 'Sanksi konsisten']
    },
    violence: {
      title: 'Kekerasan di Tempat Kerja',
      description: 'Insiden di mana seseorang diserang, diancam, atau mengalami kekerasan dalam pekerjaannya.',
      highRisk: ['Kesehatan', 'Keamanan', 'Transportasi', 'Perhotelan', 'Pendidikan'],
      prevention: ['Penilaian risiko', 'Protokol keamanan', 'Pelatihan konflik', 'Tombol darurat', 'Dukungan pasca-kejadian']
    },
    mental: {
      title: 'Kesehatan Mental di Tempat Kerja',
      description: 'Kondisi di mana pekerja dapat menyadari potensinya, mengatasi tekanan normal, dan bekerja produktif.',
      issues: [
        { name: 'Burnout', desc: 'Kelelahan emosional, depersonalisasi, berkurangnya pencapaian' },
        { name: 'Depresi', desc: 'Sedih berkepanjangan, kehilangan minat, gangguan fungsi' },
        { name: 'Kecemasan', desc: 'Kekhawatiran berlebihan mengganggu aktivitas' },
        { name: 'PTSD', desc: 'Gangguan stres pasca trauma akibat kejadian traumatis' }
      ],
      strategies: ['Destigmatisasi', 'Akses konseling', 'Mindfulness program', 'Work-life balance', 'Peer support']
    }
  };

  // ==================== FETCH FUNCTIONS ====================
  const fetchMoodHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/mood-history/${session?.userId}`);
      if (res.ok) {
        const data = await res.json();
        setMoodHistory(data);
        analyzeBurnoutRisk(data);
      }
    } catch (err) {
      console.error('Failed to fetch mood history:', err);
    }
  };

  const fetchStressHeatmap = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stress-heatmap`);
      if (res.ok) {
        const data = await res.json();
        setStressHeatmap(data);
      } else {
        // Fallback data
        setStressHeatmap([
          { department: 'Produksi', score: 75, employees: 120 },
          { department: 'Logistik', score: 68, employees: 45 },
          { department: 'Teknik', score: 62, employees: 30 },
          { department: 'HRD', score: 45, employees: 15 },
          { department: 'Keuangan', score: 52, employees: 20 },
          { department: 'IT', score: 58, employees: 25 }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch heatmap:', err);
    }
  };

  const fetchWellbeingReminders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/wellbeing-reminders/${session?.userId}`);
      if (res.ok) {
        const data = await res.json();
        setWellbeingReminders(data);
      }
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/departments`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  // AI Burnout Detection
  const analyzeBurnoutRisk = (history) => {
    if (history.length < 3) return;
    
    const recentMoods = history.slice(0, 7);
    const negativeMoods = recentMoods.filter(m => m.score <= 2).length;
    const decliningTrend = recentMoods[0]?.score > recentMoods[recentMoods.length - 1]?.score;
    
    let risk = 'Low';
    let score = 0;
    let insight = '';
    
    if (negativeMoods >= 5 || (negativeMoods >= 3 && decliningTrend)) {
      risk = 'High';
      score = 85;
      insight = '⚠️ Anda menunjukkan tanda-tanda burnout yang signifikan. Segera istirahat dan bicarakan dengan atasan atau HRD.';
    } else if (negativeMoods >= 3 || decliningTrend) {
      risk = 'Medium';
      score = 55;
      insight = '📊 Ada penurunan mood dalam beberapa hari terakhir. Coba lakukan aktivitas relaksasi atau curhat dengan teman.';
    } else {
      risk = 'Low';
      score = 20;
      insight = '✅ Mood Anda stabil. Terus jaga keseimbangan kerja dan hidup ya!';
    }
    
    setBurnoutScore(score);
    setBurnoutRisk(risk);
    setAiInsight(insight);
    
    // Save AI insight to backend
    fetch(`${API_BASE}/api/burnout-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session?.userId, risk, score, insight, date: new Date() })
    }).catch(err => console.error('Failed to save analysis:', err));
  };

  // Check-in reminder
  const checkCheckInReminder = () => {
    const lastCheckIn = localStorage.getItem(`last_mood_check_${session?.userId}`);
    const now = new Date();
    const lastDate = lastCheckIn ? new Date(lastCheckIn) : null;
    
    if (!lastDate || (now - lastDate) > 3 * 24 * 60 * 60 * 1000) {
      setCheckInReminder('Sudah 3 hari belum check-in mood! Yuk luangkan waktu sebentar.');
    } else {
      setCheckInReminder(null);
    }
  };

  // ==================== HANDLERS ====================
  const submitMood = async (mood) => {
    setLoading(true);
    const moodData = {
      userId: session?.userId,
      mood: mood.value,
      score: mood.score,
      emoji: mood.emoji,
      report: moodReport,
      date: new Date().toISOString()
    };
    
    try {
      const res = await fetch(`${API_BASE}/api/mood-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moodData)
      });
      
      if (res.ok) {
        setMoodCheck(mood);
        localStorage.setItem(`last_mood_check_${session?.userId}`, new Date().toISOString());
        await fetchMoodHistory();
        
        // Send notification to supervisor if mood is bad
        if (mood.score <= 2 && isSupervisor) {
          await fetch(`${API_BASE}/api/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: session?.userId,
              title: '⚠️ Mood Check Alert',
              message: `${session?.name || 'Employee'} melaporkan mood: ${mood.label}`,
              category: 'medical',
              priority: 'high'
            })
          });
        }
        
        setMoodReport('');
        setShowReportModal(false);
        alert('Terima kasih sudah check-in! 💚');
      }
    } catch (err) {
      console.error('Failed to submit mood:', err);
    } finally {
      setLoading(false);
    }
  };

  const playRelaxation = (track) => {
    setAudioTrack(track);
    setRelaxationPlaying(true);
  };

  const stopRelaxation = () => {
    setRelaxationPlaying(false);
    setAudioTrack(null);
  };

  // Chart data for mood history
  const chartData = moodHistory.slice(0, 14).reverse().map(m => ({
    date: new Date(m.date).toLocaleDateString('id-ID', { weekday: 'short' }),
    score: m.score,
    mood: m.mood
  }));

  // Pie chart data for mood distribution
  const moodDistribution = moodOptions.map(opt => ({
    name: opt.label,
    value: moodHistory.filter(m => m.mood === opt.value).length,
    color: opt.color
  })).filter(d => d.value > 0);

  // Radar chart data for stress factors
  const radarData = [
    { subject: 'Beban Kerja', value: 75 },
    { subject: 'Waktu', value: 68 },
    { subject: 'Dukungan', value: 55 },
    { subject: 'Kontrol', value: 60 },
    { subject: 'Lingkungan', value: 45 },
    { subject: 'Komunikasi', value: 50 }
  ];

  // Effects
  useEffect(() => {
    fetchMoodHistory();
    fetchStressHeatmap();
    fetchWellbeingReminders();
    fetchDepartments();
    checkCheckInReminder();
  }, [session?.userId]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50'}`}>
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <FaHeart className="text-white text-2xl" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Wellbeing & Psikososial
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Jaga kesehatan mental dan kesejahteraan di tempat kerja
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className={`p-2.5 rounded-xl ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600'} shadow`}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            {checkInReminder && (
              <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-4 py-2 rounded-xl">
                <FaBell /> {checkInReminder}
              </div>
            )}
          </div>
        </div>

        {/* AI BURNOUT DETECTION CARD */}
        {burnoutScore && (
          <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg border-l-8 ${burnoutRisk === 'High' ? 'border-red-500' : burnoutRisk === 'Medium' ? 'border-yellow-500' : 'border-green-500'}`}>
            <div className="flex items-start gap-4 flex-wrap">
              <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center">
                <FaRobot className="text-white text-3xl" />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>🤖 AI Burnout Detection</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{aiInsight}</p>
                <div className="mt-3 flex items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Risk Score</p>
                    <p className={`text-2xl font-bold ${burnoutRisk === 'High' ? 'text-red-500' : burnoutRisk === 'Medium' ? 'text-yellow-500' : 'text-green-500'}`}>{burnoutScore}%</p>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${burnoutRisk === 'High' ? 'bg-red-500 w-[85%]' : burnoutRisk === 'Medium' ? 'bg-yellow-500 w-[55%]' : 'bg-green-500 w-[20%]'}`}></div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${burnoutRisk === 'High' ? 'bg-red-100 text-red-700' : burnoutRisk === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    Risk: {burnoutRisk}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MOOD CHECK-IN SECTION */}
        {activeTab === 'mood' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Bagaimana perasaan Anda hari ini?</h2>
              <p className="text-gray-500">Check-in mood Anda untuk kesehatan mental yang lebih baik</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              {moodOptions.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => setShowReportModal(true)}
                  className={`flex flex-col items-center p-6 rounded-2xl transition-all hover:scale-105 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg min-w-[100px]`}
                >
                  <span className="text-5xl mb-2">{mood.emoji}</span>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{mood.label}</p>
                </button>
              ))}
            </div>
            
            {/* Mood History Chart */}
            {chartData.length > 0 && (
              <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg mt-6`}>
                <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📊 Mood Tracker (14 hari terakhir)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <YAxis domain={[0, 6]} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {/* Relaxation Audio */}
            <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-violet-50 to-purple-50'} shadow-lg`}>
              <div className="flex items-center gap-3 mb-4">
                <FaHeadphones className="text-violet-500 text-2xl" />
                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>🎵 Relaksasi & Mindfulness</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {relaxationTracks.map(track => (
                  <button
                    key={track.id}
                    onClick={() => playRelaxation(track)}
                    className={`p-3 rounded-xl text-center transition ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} shadow`}
                  >
                    <FaMusic className="mx-auto text-violet-500 text-xl mb-2" />
                    <p className="text-sm font-medium">{track.name}</p>
                    <p className="text-xs text-gray-500">{track.duration}</p>
                  </button>
                ))}
              </div>
              {relaxationPlaying && audioTrack && (
                <div className="mt-4 p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="font-semibold">🎵 Playing: {audioTrack.name}</p>
                    <audio controls autoPlay className="mt-2 w-full" onEnded={stopRelaxation}>
                      <source src={audioTrack.url} type="audio/mpeg" />
                    </audio>
                  </div>
                  <button onClick={stopRelaxation} className="text-red-500">Stop</button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                  : `${darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}`
              }`}
            >
              <tab.icon /> {tab.label}
            </button>
          ))}
        </div>

        {/* Stress Tab Content */}
        {(activeTab === 'stress' || activeTab === 'harassment' || activeTab === 'violence' || activeTab === 'mental') && (
          <div className={`rounded-3xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl p-8`}>
            <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{content[activeTab]?.title}</h2>
            <p className={`mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{content[activeTab]?.description}</p>
            
            {activeTab === 'stress' && (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5">
                  <h3 className="font-bold text-red-700 dark:text-red-300 mb-3">Penyebab</h3>
                  <ul className="space-y-2">{content.stress.causes.map((c, i) => <li key={i} className="text-sm flex items-center gap-2">⚠️ {c}</li>)}</ul>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-5">
                  <h3 className="font-bold text-orange-700 dark:text-orange-300 mb-3">Dampak</h3>
                  <ul className="space-y-2">{content.stress.effects.map((e, i) => <li key={i} className="text-sm flex items-center gap-2">📉 {e}</li>)}</ul>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-5">
                  <h3 className="font-bold text-green-700 dark:text-green-300 mb-3">Pencegahan</h3>
                  <ul className="space-y-2">{content.stress.prevention.map((p, i) => <li key={i} className="text-sm flex items-center gap-2">✅ {p}</li>)}</ul>
                </div>
              </div>
            )}
            
            {activeTab === 'harassment' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div><h3 className="font-bold mb-3">Jenis Pelecehan</h3>{content.harassment.types.map((t, i) => <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-2"><p className="font-semibold">{t.name}</p><p className="text-sm">{t.desc}</p></div>)}</div>
                <div><h3 className="font-bold mb-3">Pencegahan</h3>{content.harassment.prevention.map((p, i) => <div key={i} className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 mb-2">✅ {p}</div>)}</div>
              </div>
            )}
            
            {activeTab === 'violence' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div><h3 className="font-bold mb-3">Sektor Berisiko Tinggi</h3><div className="flex flex-wrap gap-2">{content.violence.highRisk.map((s, i) => <span key={i} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-full text-sm">⚠️ {s}</span>)}</div></div>
                <div><h3 className="font-bold mb-3">Pencegahan</h3>{content.violence.prevention.map((p, i) => <div key={i} className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 rounded-xl p-3 mb-2">✅ {p}</div>)}</div>
              </div>
            )}
            
            {activeTab === 'mental' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div><h3 className="font-bold mb-3">Isu Kesehatan Mental</h3>{content.mental.issues.map((issue, i) => <div key={i} className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 mb-2"><p className="font-semibold">{issue.name}</p><p className="text-sm">{issue.desc}</p></div>)}</div>
                <div><h3 className="font-bold mb-3">Strategi Intervensi</h3>{content.mental.strategies.map((s, i) => <div key={i} className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 mb-2">✅ {s}</div>)}</div>
              </div>
            )}
          </div>
        )}

        {/* Analytics Dashboard (Admin/Supervisor only) */}
        {activeTab === 'dashboard' && (isAdmin || isSupervisor) && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Stress Heatmap */}
              <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🔥 Stress Heatmap per Divisi</h3>
                <div className="space-y-3">
                  {stressHeatmap.map((dept, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{dept.department}</span>
                        <span className={dept.score > 70 ? 'text-red-500' : dept.score > 50 ? 'text-yellow-500' : 'text-green-500'}>{dept.score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${dept.score > 70 ? 'bg-red-500' : dept.score > 50 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${dept.score}%` }}></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{dept.employees} karyawan</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Mood Distribution Pie */}
              {moodDistribution.length > 0 && (
                <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                  <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📊 Distribusi Mood</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={moodDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {moodDistribution.map((entry, idx) => <Cell key={idx} fill={entry.color === 'bg-green-500' ? '#22c55e' : entry.color === 'bg-emerald-500' ? '#10b981' : entry.color === 'bg-yellow-500' ? '#eab308' : entry.color === 'bg-orange-500' ? '#f97316' : '#ef4444'} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            
            {/* Stress Factors Radar */}
            <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🎯 Faktor Stres (Radar Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <PolarAngleAxis dataKey="subject" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                  <PolarRadiusAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                  <Radar name="Stress Level" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* No access message for non-admin */}
        {activeTab === 'dashboard' && !isAdmin && !isSupervisor && (
          <div className={`rounded-2xl p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <FaChartLine className="text-4xl text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Halaman analytics hanya untuk Admin dan Supervisor</p>
          </div>
        )}

        {/* ILO Framework */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-3xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">Kerangka Kerja ILO untuk Kesehatan Mental</h2>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 text-center"><h3 className="text-xl font-bold mb-2">🛡️ Perlindungan</h3><p className="text-sm">Melindungi pekerja dari faktor risiko psikososial</p></div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 text-center"><h3 className="text-xl font-bold mb-2">📢 Promosi</h3><p className="text-sm">Mempromosikan kesehatan mental positif</p></div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-5 text-center"><h3 className="text-xl font-bold mb-2">🤝 Dukungan</h3><p className="text-sm">Dukungan bagi pekerja dengan masalah kesehatan mental</p></div>
          </div>
        </div>
      </div>

      {/* Mood Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className={`rounded-2xl p-6 w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Check-in Mood</h2>
              <p className="text-sm text-gray-500 mb-4">Pilih mood Anda dan tuliskan apa yang Anda rasakan (opsional)</p>
              <div className="flex justify-around mb-4">
                {moodOptions.map(mood => (
                  <button key={mood.value} onClick={() => setMoodCheck(mood)} className={`flex flex-col items-center p-3 rounded-xl transition ${moodCheck?.value === mood.value ? 'ring-2 ring-violet-500 scale-105' : ''}`}>
                    <span className="text-3xl">{mood.emoji}</span>
                    <span className="text-xs">{mood.label}</span>
                  </button>
                ))}
              </div>
              <textarea placeholder="Ceritakan apa yang Anda rasakan (opsional)..." value={moodReport} onChange={e => setMoodReport(e.target.value)} className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} rows="3" />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowReportModal(false)} className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl">Batal</button>
                <button onClick={() => moodCheck && submitMood(moodCheck)} disabled={!moodCheck} className="flex-1 py-2 bg-violet-500 text-white rounded-xl disabled:opacity-50">Kirim</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PsychosocialRisks;