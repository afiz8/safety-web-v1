import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCogs, FaCheckCircle, FaClipboardList, FaUsers, FaChartLine, FaShieldAlt,
  FaExclamationTriangle, FaEye, FaFileExport, FaMoon, FaSun, FaBell,
  FaRobot, FaArrowUp, FaArrowDown, FaDownload,
  FaPlus, FaEdit, FaTrash, FaSearch, FaCalendarAlt, FaUser, FaBuilding,
  FaFileAlt, FaClock, FaTimes, FaSpinner
} from 'react-icons/fa';
import { UserContext } from '../App';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const OSHManagementSystems = () => {
  const { session, darkMode, toggleDarkMode, notifications } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSystem, setActiveSystem] = useState('iso45001');
  const [dashboardStats, setDashboardStats] = useState({
    incidents: { total: 0, highRisk: 0, trend: '0' },
    nearMiss: { total: 0, highRisk: 0, trend: '0' },
    observations: { negative: 0, trend: '0' },
    medical: { critical: 0, trend: '0' }
  });
  const [loading, setLoading] = useState(true);
  const [insightMessage, setInsightMessage] = useState(null);
  const [riskScore, setRiskScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState('Rendah');
  
  const [implementations, setImplementations] = useState([]);
  const [audits, setAudits] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [riskAssessments, setRiskAssessments] = useState([]);
  
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('');
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);

  const API_BASE = 'http://localhost:5000';
  const role = session?.role;
  const canEdit = role === 'Admin' || role === 'Manager' || role === 'Director';
  const canDelete = role === 'Admin';

  const systems = [
    {
      id: 'iso45001',
      name: 'ISO 45001:2018',
      icon: '📋',
      color: 'from-blue-500 to-blue-600',
      description: 'Standar internasional untuk sistem manajemen K3 yang menggantikan OHSAS 18001. Berbasis High Level Structure (HLS) yang sama dengan ISO 9001 dan ISO 14001.',
      clauses: [
        { num: '4', title: 'Konteks Organisasi', desc: 'Memahami organisasi dan konteksnya, kebutuhan pihak terkait, ruang lingkup sistem' },
        { num: '5', title: 'Kepemimpinan', desc: 'Komitenmen kepemimpinan, kebijakan K3, peran, tanggung jawab, dan wewenang' },
        { num: '6', title: 'Perencanaan', desc: 'Tindakan untuk mengatasi risiko dan peluang, tujuan K3, perencanaan perubahan' },
        { num: '7', title: 'Dukungan', desc: 'Sumber daya, kompetensi, kesadaran, komunikasi, informasi terdokumentasi' },
        { num: '8', title: 'Operasi', desc: 'Perencanaan dan pengendalian operasi, persiapan darurat, eliminasi bahaya' },
        { num: '9', title: 'Evaluasi Kinerja', desc: 'Monitoring, pengukuran, analisis, evaluasi, audit internal, tinjauan manajemen' },
        { num: '10', title: 'Peningkatan', desc: 'Ketidaksesuaian, tindakan korektif, peningkatan berkelanjutan' }
      ],
      benefits: ['Mengurangi kecelakaan & penyakit', 'Meningkatkan kepatuhan hukum', 'Meningkatkan reputasi', 'Mengurangi biaya asuransi', 'Meningkatkan produktivitas']
    },
    {
      id: 'iloosh',
      name: 'ILO-OSH 2001',
      icon: '🏛️',
      color: 'from-emerald-500 to-emerald-600',
      description: 'Pedoman ILO untuk sistem manajemen K3 yang dirancang untuk membantu negara-negara anggota dalam mengembangkan sistem nasional dan perusahaan.',
      clauses: [
        { num: '3.1', title: 'Kebijakan Nasional', desc: 'Kerangka kerja kebijakan, program nasional, sistem inspeksi' },
        { num: '3.2', title: 'Sistem Perusahaan', desc: 'Kebijakan K3, organisasi, perencanaan & implementasi, evaluasi' },
        { num: '3.3', title: 'Partisipasi Pekerja', desc: 'Hak dan kewajiban pekerja, konsultasi, komite K3' },
        { num: '3.4', title: 'Kompetensi & Pelatihan', desc: 'Persyaratan kompetensi, program pelatihan, informasi' },
        { num: '3.5', title: 'Dokumentasi', desc: 'Sistem dokumentasi, catatan, manajemen dokumen' },
        { num: '3.6', title: 'Audit & Review', desc: 'Audit internal, tinjauan manajemen, tindak lanjut' }
      ],
      benefits: ['Sesuai dengan konvensi ILO', 'Fleksibel untuk semua ukuran', 'Mendorong partisipasi pekerja', 'Mendukung tripartit', 'Gratis untuk digunakan']
    },
    {
      id: 'smk3',
      name: 'SMK3 Indonesia',
      icon: '🇮🇩',
      color: 'from-red-500 to-red-600',
      description: 'Sistem Manajemen Keselamatan dan Kesehatan Kerja berdasarkan PP No. 50/2012 dan Permenaker No. 5/2018. Wajib untuk perusahaan dengan risiko tinggi.',
      clauses: [
        { num: '1', title: 'Kebijakan & Komitmen', desc: 'Kebijakan K3 ditandatangani direksi, komitmen sumber daya' },
        { num: '2', title: 'Perencanaan', desc: 'Identifikasi bahaya, penilaian risiko, program K3, rencana darurat' },
        { num: '3', title: 'Implementasi', desc: 'Struktur organisasi, pelatihan, komunikasi, dokumentasi, pengendalian operasional' },
        { num: '4', title: 'Pengukuran & Evaluasi', desc: 'Monitoring, investigasi insiden, audit internal, tinjauan manajemen' },
        { num: '5', title: 'Peningkatan', desc: 'Tindakan korektif, tindakan pencegahan, review berkala' }
      ],
      benefits: ['Kepatuhan regulasi Indonesia', 'Sertifikasi resmi Kemenaker', 'Mengurangi sanksi', 'Meningkatkan citra perusahaan', 'Akses ke proyek pemerintah']
    }
  ];

  const implementationSteps = [
    { step: '1', title: 'Komitenmen Kepemimpinan', desc: 'Dukungan penuh dari manajemen puncak' },
    { step: '2', title: 'Tim Pembentuk', desc: 'Bentuk tim lintas fungsi untuk implementasi' },
    { step: '3', title: 'Gap Analysis', desc: 'Evaluasi kondisi saat ini vs standar' },
    { step: '4', title: 'Perencanaan', desc: 'Rencana implementasi dengan timeline' },
    { step: '5', title: 'Dokumentasi', desc: 'Buat kebijakan, prosedur, dan instruksi' },
    { step: '6', title: 'Implementasi', desc: 'Jalankan sistem di seluruh organisasi' },
    { step: '7', title: 'Audit Internal', desc: 'Verifikasi efektivitas sistem' },
    { step: '8', title: 'Sertifikasi', desc: 'Audit eksternal oleh lembaga sertifikasi' }
  ];

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/stats`);
      if (res.ok) {
        const data = await res.json();
        setDashboardStats(data);
        
        // AMAN: gunakan optional chaining dan default values
        const incidentsHighRisk = data?.incidents?.highRisk || 0;
        const nearMissHighRisk = data?.nearMiss?.highRisk || 0;
        const observationsNegative = data?.observations?.negative || 0;
        const medicalCritical = data?.medical?.critical || 0;
        
        const riskScoreCalc = (incidentsHighRisk * 30) + (nearMissHighRisk * 15) + (observationsNegative * 5) + (medicalCritical * 40);
        setRiskScore(riskScoreCalc);
        if (riskScoreCalc > 70) setRiskLevel('Tinggi');
        else if (riskScoreCalc > 40) setRiskLevel('Sedang');
        else setRiskLevel('Rendah');
        
        const incidentTrend = parseFloat(data?.incidents?.trend) || 0;
        const nearMissTrend = parseFloat(data?.nearMiss?.trend) || 0;
        
        if (incidentTrend > 10) {
          setInsightMessage(`⚠️ Insiden meningkat ${incidentTrend}% dibanding bulan lalu. Perlu perhatian khusus pada area dengan risiko tinggi.`);
        } else if (nearMissTrend > 15) {
          setInsightMessage(`📊 Near Miss meningkat ${nearMissTrend}% - indikasi awal potensi bahaya yang perlu diantisipasi.`);
        } else {
          setInsightMessage(`✅ Kinerja K3 stabil. Insiden turun atau stagnan dibanding periode sebelumnya.`);
        }
      }
    } catch (err) {
      console.error('Gagal fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchImplementations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/osh-implementation`);
      if (res.ok) {
        const data = await res.json();
        setImplementations(data);
      }
    } catch (err) {
      console.error('Gagal fetch implementations:', err);
    }
  };

  const fetchAudits = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/osh-audit`);
      if (res.ok) {
        const data = await res.json();
        setAudits(data);
      }
    } catch (err) {
      console.error('Gagal fetch audits:', err);
    }
  };

  const fetchTrainings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/osh-training`);
      if (res.ok) {
        const data = await res.json();
        setTrainings(data);
      }
    } catch (err) {
      console.error('Gagal fetch trainings:', err);
    }
  };

  const fetchRiskAssessments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/osh-risk-assessment`);
      if (res.ok) {
        const data = await res.json();
        setRiskAssessments(data);
      }
    } catch (err) {
      console.error('Gagal fetch risk assessments:', err);
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
    fetchDashboardStats();
    fetchImplementations();
    fetchAudits();
    fetchTrainings();
    fetchRiskAssessments();
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let url = '';
    let method = 'POST';
    
    switch(formType) {
      case 'implementation':
        url = `${API_BASE}/api/osh-implementation`;
        if (editingId) { url = `${API_BASE}/api/osh-implementation/${editingId}`; method = 'PUT'; }
        break;
      case 'audit':
        url = `${API_BASE}/api/osh-audit`;
        if (editingId) { url = `${API_BASE}/api/osh-audit/${editingId}`; method = 'PUT'; }
        break;
      case 'training':
        url = `${API_BASE}/api/osh-training`;
        if (editingId) { url = `${API_BASE}/api/osh-training/${editingId}`; method = 'PUT'; }
        break;
      case 'risk':
        url = `${API_BASE}/api/osh-risk-assessment`;
        if (editingId) { url = `${API_BASE}/api/osh-risk-assessment/${editingId}`; method = 'PUT'; }
        break;
      default: return;
    }
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        if (formType === 'implementation') fetchImplementations();
        else if (formType === 'audit') fetchAudits();
        else if (formType === 'training') fetchTrainings();
        else if (formType === 'risk') fetchRiskAssessments();
        setShowForm(false);
        setEditingId(null);
        setFormData({});
      }
    } catch (err) {
      console.error('Gagal simpan:', err);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Hapus data ini?')) return;
    let url = '';
    switch(type) {
      case 'implementation': url = `${API_BASE}/api/osh-implementation/${id}`; break;
      case 'audit': url = `${API_BASE}/api/osh-audit/${id}`; break;
      case 'training': url = `${API_BASE}/api/osh-training/${id}`; break;
      case 'risk': url = `${API_BASE}/api/osh-risk-assessment/${id}`; break;
      default: return;
    }
    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        if (type === 'implementation') fetchImplementations();
        else if (type === 'audit') fetchAudits();
        else if (type === 'training') fetchTrainings();
        else if (type === 'risk') fetchRiskAssessments();
      }
    } catch (err) {
      console.error('Gagal hapus:', err);
    }
  };

  const openForm = (type, item = null) => {
    setFormType(type);
    setEditingId(item?._id || null);
    if (item) {
      setFormData(item);
    } else {
      switch(type) {
        case 'implementation':
          setFormData({ companyName: '', systemType: 'iso45001', status: 'Not Started', progress: 0, startDate: '', targetDate: '', notes: '' });
          break;
        case 'audit':
          setFormData({ auditType: 'Internal', systemType: 'iso45001', auditDate: new Date().toISOString().split('T')[0], auditor: '', scope: '', findings: [] });
          break;
        case 'training':
          setFormData({ trainingName: '', systemType: 'iso45001', trainingDate: new Date().toISOString().split('T')[0], duration: '', trainer: '', participants: [] });
          break;
        case 'risk':
          setFormData({ activity: '', location: '', department: '', assessedBy: '', assessmentDate: new Date().toISOString().split('T')[0], hazards: [] });
          break;
        default: break;
      }
    }
    setShowForm(true);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Laporan Dashboard Sistem Manajemen K3', 14, 10);
    doc.text(`Tanggal: ${new Date().toLocaleString()}`, 14, 18);
    if (dashboardStats) {
      autoTable(doc, {
        head: [['Metrik', 'Nilai']],
        body: [
          ['Total Insiden', dashboardStats?.incidents?.total || 0],
          ['Insiden High Risk', dashboardStats?.incidents?.highRisk || 0],
          ['Total Near Miss', dashboardStats?.nearMiss?.total || 0],
          ['Near Miss High Risk', dashboardStats?.nearMiss?.highRisk || 0],
          ['Observasi Negative', dashboardStats?.observations?.negative || 0],
          ['Kasus Medis Kritis', dashboardStats?.medical?.critical || 0],
          ['Skor Risiko', riskScore],
          ['Tingkat Risiko', riskLevel]
        ],
        startY: 30,
      });
    }
    doc.save('osh-dashboard-report.pdf');
  };

  const currentSystem = systems.find(s => s.id === activeSystem);
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  // AMAN: buat chartData dengan default values
  const chartData = [
    { name: 'Insiden', value: dashboardStats?.incidents?.total || 0, color: '#ef4444' },
    { name: 'Near Miss', value: dashboardStats?.nearMiss?.total || 0, color: '#f59e0b' },
    { name: 'Observasi Neg', value: dashboardStats?.observations?.negative || 0, color: '#8b5cf6' },
    { name: 'Medis Kritis', value: dashboardStats?.medical?.critical || 0, color: '#ec4899' }
  ];

  const filteredImplementations = implementations.filter(i => 
    i.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredAudits = audits.filter(a => 
    a.auditor?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredTrainings = trainings.filter(t => 
    t.trainingName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredRiskAssessments = riskAssessments.filter(r => 
    r.activity?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !dashboardStats?.incidents) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-6 px-4 transition-colors duration-300 ${
      darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/30'
    }`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FaCogs className="text-4xl text-indigo-500" />
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Sistem Manajemen K3
              </h1>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Otak utama aplikasi HSSE - Monitoring & Manajemen Risiko
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <FaBell className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>}
            </div>
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            {canEdit && (
              <button onClick={exportToPDF} className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-4 py-2 rounded-full shadow-md hover:shadow-lg transition flex items-center gap-2 text-sm">
                <FaDownload /> Export PDF
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: FaChartLine },
            { id: 'implementation', name: 'Implementasi', icon: FaBuilding },
            { id: 'audit', name: 'Audit', icon: FaClipboardList },
            { id: 'training', name: 'Pelatihan', icon: FaUsers },
            { id: 'risk', name: 'Risk Assessment', icon: FaShieldAlt },
            { id: 'standards', name: 'Standar', icon: FaCogs }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-500 text-white shadow-md'
                  : `${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:bg-gray-100'}`
              }`}
            >
              <tab.icon size={16} /> {tab.name}
            </button>
          ))}
        </div>

        {/* ==================== DASHBOARD TAB ==================== */}
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
                <div className="flex items-center justify-between">
                  <FaExclamationTriangle className="text-red-500 text-2xl" />
                  <span className={`text-xs flex items-center gap-1 ${parseFloat(dashboardStats?.incidents?.trend || 0) > 5 ? 'text-red-500' : 'text-green-500'}`}>
                    {parseFloat(dashboardStats?.incidents?.trend || 0) > 5 ? <FaArrowUp /> : <FaArrowDown />}
                    {Math.abs(parseFloat(dashboardStats?.incidents?.trend || 0))}%
                  </span>
                </div>
                <p className="text-2xl font-bold mt-2">{dashboardStats?.incidents?.total || 0}</p>
                <p className="text-xs text-gray-500">Total Insiden</p>
              </div>
              <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
                <FaEye className="text-yellow-500 text-2xl" />
                <p className="text-2xl font-bold mt-2">{dashboardStats?.nearMiss?.total || 0}</p>
                <p className="text-xs text-gray-500">Near Miss</p>
              </div>
              <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
                <FaClipboardList className="text-purple-500 text-2xl" />
                <p className="text-2xl font-bold mt-2">{dashboardStats?.observations?.negative || 0}</p>
                <p className="text-xs text-gray-500">Observasi Negatif</p>
              </div>
              <div className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
                <FaShieldAlt className="text-pink-500 text-2xl" />
                <p className="text-2xl font-bold mt-2">{dashboardStats?.medical?.critical || 0}</p>
                <p className="text-xs text-gray-500">Medis Kritis</p>
              </div>
            </div>

            <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <FaRobot className="text-2xl text-purple-500" />
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>AI Risk Prediction</h3>
                    <p className="text-sm text-gray-500">Skor risiko berdasarkan data historis</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{riskScore}</p>
                    <p className="text-xs text-gray-500">Skor Risiko</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-white font-semibold ${
                    riskLevel === 'Tinggi' ? 'bg-red-500' : riskLevel === 'Sedang' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {riskLevel === 'Tinggi' ? '⚠️ High Risk' : riskLevel === 'Sedang' ? '⚠️ Medium Risk' : '✅ Low Risk'}
                  </div>
                </div>
              </div>
              {insightMessage && (
                <div className="mt-4 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                    {insightMessage.includes('⚠️') ? <FaExclamationTriangle /> : insightMessage.includes('📊') ? <FaChartLine /> : <FaCheckCircle />}
                    {insightMessage}
                  </p>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
                <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <FaChartLine className="text-indigo-500" /> Distribusi Data K3
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
                <h3 className={`font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  <FaArrowUp className="text-green-500" /> Trend Kinerja
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Insiden</span>
                      <span className={parseFloat(dashboardStats?.incidents?.trend || 0) > 5 ? 'text-red-500' : 'text-green-500'}>
                        {dashboardStats?.incidents?.trend || 0}% {parseFloat(dashboardStats?.incidents?.trend || 0) > 5 ? '▲' : '▼'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${parseFloat(dashboardStats?.incidents?.trend || 0) > 5 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(Math.abs(parseFloat(dashboardStats?.incidents?.trend || 0)), 100)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Near Miss</span>
                      <span className={parseFloat(dashboardStats?.nearMiss?.trend || 0) > 5 ? 'text-red-500' : 'text-green-500'}>
                        {dashboardStats?.nearMiss?.trend || 0}% {parseFloat(dashboardStats?.nearMiss?.trend || 0) > 5 ? '▲' : '▼'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${parseFloat(dashboardStats?.nearMiss?.trend || 0) > 5 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(Math.abs(parseFloat(dashboardStats?.nearMiss?.trend || 0)), 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ==================== IMPLEMENTASI TAB ==================== */}
        {activeTab === 'implementation' && (
          <>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <input type="text" placeholder="Cari perusahaan..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} />
              </div>
              {canEdit && (
                <button onClick={() => openForm('implementation')} className="bg-indigo-500 text-white px-4 py-2 rounded-full shadow-md hover:bg-indigo-600 transition flex items-center gap-2">
                  <FaPlus /> Tambah Implementasi
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredImplementations.map(imp => (
                <div key={imp._id} className={`rounded-2xl shadow-md p-5 ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white/80 backdrop-blur border border-white/40'}`}>
                  <div className="flex justify-between items-start">
                    <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{imp.companyName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      imp.status === 'Certified' ? 'bg-green-100 text-green-700' :
                      imp.status === 'Implementation' ? 'bg-blue-100 text-blue-700' :
                      imp.status === 'Planning' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{imp.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{imp.systemType?.toUpperCase()}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{imp.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${imp.progress}%` }}></div>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button onClick={() => openForm('implementation', imp)} className="flex-1 py-1.5 bg-blue-500 text-white rounded-lg text-sm">Edit</button>
                      {canDelete && <button onClick={() => handleDelete('implementation', imp._id)} className="flex-1 py-1.5 bg-red-500 text-white rounded-lg text-sm">Hapus</button>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ==================== AUDIT TAB ==================== */}
        {activeTab === 'audit' && (
          <>
            <div className="flex justify-end">
              {canEdit && (
                <button onClick={() => openForm('audit')} className="bg-indigo-500 text-white px-4 py-2 rounded-full shadow-md hover:bg-indigo-600 transition flex items-center gap-2">
                  <FaPlus /> Tambah Audit
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {filteredAudits.map(audit => (
                <div key={audit._id} className={`rounded-2xl shadow-md p-5 ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white/80 backdrop-blur border border-white/40'}`}>
                  <div className="flex justify-between items-start">
                    <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{audit.auditType} - {audit.systemType?.toUpperCase()}</h3>
                    <span className="text-xs text-gray-400">{new Date(audit.auditDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm mt-1">Auditor: {audit.auditor || '-'}</p>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{audit.scope}</p>
                  {canEdit && (
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <button onClick={() => openForm('audit', audit)} className="flex-1 py-1.5 bg-blue-500 text-white rounded-lg text-sm">Edit</button>
                      {canDelete && <button onClick={() => handleDelete('audit', audit._id)} className="flex-1 py-1.5 bg-red-500 text-white rounded-lg text-sm">Hapus</button>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ==================== TRAINING TAB ==================== */}
        {activeTab === 'training' && (
          <>
            <div className="flex justify-end">
              {canEdit && (
                <button onClick={() => openForm('training')} className="bg-indigo-500 text-white px-4 py-2 rounded-full shadow-md hover:bg-indigo-600 transition flex items-center gap-2">
                  <FaPlus /> Tambah Pelatihan
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {filteredTrainings.map(training => (
                <div key={training._id} className={`rounded-2xl shadow-md p-5 ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white/80 backdrop-blur border border-white/40'}`}>
                  <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{training.trainingName}</h3>
                  <p className="text-sm text-gray-500 mt-1">{training.systemType?.toUpperCase()} • {training.duration}</p>
                  <p className="text-sm mt-2">Trainer: {training.trainer || '-'}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(training.trainingDate).toLocaleDateString()}</p>
                  {canEdit && (
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <button onClick={() => openForm('training', training)} className="flex-1 py-1.5 bg-blue-500 text-white rounded-lg text-sm">Edit</button>
                      {canDelete && <button onClick={() => handleDelete('training', training._id)} className="flex-1 py-1.5 bg-red-500 text-white rounded-lg text-sm">Hapus</button>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ==================== RISK ASSESSMENT TAB ==================== */}
        {activeTab === 'risk' && (
          <>
            <div className="flex justify-end">
              {canEdit && (
                <button onClick={() => openForm('risk')} className="bg-indigo-500 text-white px-4 py-2 rounded-full shadow-md hover:bg-indigo-600 transition flex items-center gap-2">
                  <FaPlus /> Tambah Risk Assessment
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {filteredRiskAssessments.map(risk => (
                <div key={risk._id} className={`rounded-2xl shadow-md p-5 ${darkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white/80 backdrop-blur border border-white/40'}`}>
                  <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{risk.activity}</h3>
                  <p className="text-sm text-gray-500 mt-1">{risk.location} • {risk.department}</p>
                  <p className="text-sm mt-2">Assessed by: {risk.assessedBy || '-'}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(risk.assessmentDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500 mt-2">{risk.hazards?.length || 0} hazard(s) identified</p>
                  {canEdit && (
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <button onClick={() => openForm('risk', risk)} className="flex-1 py-1.5 bg-blue-500 text-white rounded-lg text-sm">Edit</button>
                      {canDelete && <button onClick={() => handleDelete('risk', risk._id)} className="flex-1 py-1.5 bg-red-500 text-white rounded-lg text-sm">Hapus</button>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ==================== STANDARDS TAB ==================== */}
        {activeTab === 'standards' && (
          <>
            <div className="flex flex-wrap justify-center gap-3">
              {systems.map(sys => (
                <button
                  key={sys.id}
                  onClick={() => setActiveSystem(sys.id)}
                  className={`flex items-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all ${
                    activeSystem === sys.id
                      ? `bg-gradient-to-r ${sys.color} text-white shadow-lg scale-105`
                      : `bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50`
                  }`}
                >
                  <span className="text-2xl">{sys.icon}</span>
                  {sys.name}
                </button>
              ))}
            </div>

            {currentSystem && (
              <div className={`rounded-3xl shadow-xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className={`bg-gradient-to-r ${currentSystem.color} p-8 text-white`}>
                  <div className="flex items-center gap-4">
                    <span className="text-5xl">{currentSystem.icon}</span>
                    <div>
                      <h2 className="text-3xl font-bold">{currentSystem.name}</h2>
                      <p className="opacity-90 mt-2">{currentSystem.description}</p>
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Klausul/Komponen Utama</h3>
                  <div className="space-y-4 mb-8">
                    {currentSystem.clauses.map((clause, idx) => (
                      <div key={idx} className={`flex gap-4 rounded-xl p-5 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <div className={`w-12 h-12 bg-gradient-to-r ${currentSystem.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-bold">{clause.num}</span>
                        </div>
                        <div>
                          <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{clause.title}</h4>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{clause.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Manfaat Implementasi</h3>
                  <div className="grid md:grid-cols-5 gap-3">
                    {currentSystem.benefits.map((benefit, idx) => (
                      <div key={idx} className={`rounded-xl p-4 text-center border ${darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'}`}>
                        <FaCheckCircle className="text-green-500 mx-auto mb-2" />
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <h2 className={`text-3xl font-bold text-center mb-10 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Langkah Implementasi Sistem Manajemen K3
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {implementationSteps.map((item, idx) => (
                  <div key={idx} className={`rounded-2xl p-6 shadow-lg border relative ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                      <span className="text-white font-bold">{item.step}</span>
                    </div>
                    <h3 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-8 lg:p-12 text-white`}>
              <h2 className="text-3xl font-bold mb-8 text-center">Perbandingan Sistem Manajemen K3</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left p-4">Aspek</th>
                      <th className="text-left p-4">ISO 45001</th>
                      <th className="text-left p-4">ILO-OSH 2001</th>
                      <th className="text-left p-4">SMK3 Indonesia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Fokus', 'Risiko & peluang', 'Pencegahan & partisipasi', 'Kepatuhan regulasi RI'],
                      ['Cakupan', 'Global', 'Global (ILO)', 'Indonesia'],
                      ['Sertifikasi', 'Ya (akreditasi)', 'Tidak wajib', 'Wajib (risiko tinggi)'],
                      ['Biaya', 'Berbayar', 'Gratis', 'Biaya audit Kemenaker'],
                      ['Struktur', 'HLS (10 klausul)', '5 komponen', '5 elemen'],
                      ['Partisipasi pekerja', 'Wajib', 'Sangat ditekankan', 'Wajib']
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b border-white/10">
                        {row.map((cell, i) => <td key={i} className="p-4">{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className={`rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {formType === 'implementation' && (editingId ? 'Edit Implementasi' : 'Tambah Implementasi')}
                  {formType === 'audit' && (editingId ? 'Edit Audit' : 'Tambah Audit')}
                  {formType === 'training' && (editingId ? 'Edit Pelatihan' : 'Tambah Pelatihan')}
                  {formType === 'risk' && (editingId ? 'Edit Risk Assessment' : 'Tambah Risk Assessment')}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                {formType === 'implementation' && (
                  <>
                    <input type="text" placeholder="Nama Perusahaan" value={formData.companyName || ''} onChange={e => setFormData({...formData, companyName: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} required />
                    <select value={formData.systemType || 'iso45001'} onChange={e => setFormData({...formData, systemType: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                      <option value="iso45001">ISO 45001</option><option value="iloosh">ILO-OSH 2001</option><option value="smk3">SMK3 Indonesia</option>
                    </select>
                    <select value={formData.status || 'Not Started'} onChange={e => setFormData({...formData, status: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                      <option value="Not Started">Not Started</option><option value="Planning">Planning</option>
                      <option value="Implementation">Implementation</option><option value="Audit">Audit</option><option value="Certified">Certified</option>
                    </select>
                    <input type="number" placeholder="Progress (%)" value={formData.progress || 0} onChange={e => setFormData({...formData, progress: parseInt(e.target.value)})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    <input type="date" value={formData.startDate?.split('T')[0] || ''} onChange={e => setFormData({...formData, startDate: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    <input type="date" value={formData.targetDate?.split('T')[0] || ''} onChange={e => setFormData({...formData, targetDate: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    <textarea placeholder="Catatan" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="2" />
                  </>
                )}
                {formType === 'audit' && (
                  <>
                    <select value={formData.auditType || 'Internal'} onChange={e => setFormData({...formData, auditType: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                      <option value="Internal">Internal</option><option value="External">External</option><option value="Certification">Certification</option>
                    </select>
                    <select value={formData.systemType || 'iso45001'} onChange={e => setFormData({...formData, systemType: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                      <option value="iso45001">ISO 45001</option><option value="iloosh">ILO-OSH 2001</option><option value="smk3">SMK3 Indonesia</option>
                    </select>
                    <input type="date" value={formData.auditDate?.split('T')[0] || ''} onChange={e => setFormData({...formData, auditDate: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    <input type="text" placeholder="Auditor" value={formData.auditor || ''} onChange={e => setFormData({...formData, auditor: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    <textarea placeholder="Scope" value={formData.scope || ''} onChange={e => setFormData({...formData, scope: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} rows="2" />
                  </>
                )}
                {formType === 'training' && (
                  <>
                    <input type="text" placeholder="Nama Pelatihan" value={formData.trainingName || ''} onChange={e => setFormData({...formData, trainingName: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} required />
                    <select value={formData.systemType || 'iso45001'} onChange={e => setFormData({...formData, systemType: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
                      <option value="iso45001">ISO 45001</option><option value="iloosh">ILO-OSH 2001</option><option value="smk3">SMK3 Indonesia</option>
                    </select>
                    <input type="date" value={formData.trainingDate?.split('T')[0] || ''} onChange={e => setFormData({...formData, trainingDate: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    <input type="text" placeholder="Durasi (contoh: 2 hari)" value={formData.duration || ''} onChange={e => setFormData({...formData, duration: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    <input type="text" placeholder="Trainer" value={formData.trainer || ''} onChange={e => setFormData({...formData, trainer: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                  </>
                )}
                {formType === 'risk' && (
                  <>
                    <input type="text" placeholder="Aktivitas / Pekerjaan" value={formData.activity || ''} onChange={e => setFormData({...formData, activity: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} required />
                    <input type="text" placeholder="Lokasi" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    <input type="text" placeholder="Departemen" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    <input type="text" placeholder="Dinilai oleh" value={formData.assessedBy || ''} onChange={e => setFormData({...formData, assessedBy: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                    <input type="date" value={formData.assessmentDate?.split('T')[0] || ''} onChange={e => setFormData({...formData, assessmentDate: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-300 outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                  </>
                )}
                <button type="submit" className="w-full py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg font-semibold hover:from-indigo-600 hover:to-blue-600 transition">
                  {editingId ? 'Update' : 'Simpan'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OSHManagementSystems;