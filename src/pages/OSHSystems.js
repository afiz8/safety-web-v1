import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBuilding, FaGavel, FaUsers, FaClipboardCheck, FaBalanceScale, FaHandshake,
  FaShieldAlt, FaHardHat, FaEye, FaExclamationTriangle, FaHeartbeat,
  FaChartLine, FaCogs, FaBell, FaRobot, FaSearch, FaArrowRight,
  FaMoon, FaSun, FaTachometerAlt, FaFileAlt, FaCalendarCheck, FaUserShield,
  FaPlus, FaEdit, FaTrash, FaDatabase, FaCloudUploadAlt, FaSyncAlt
} from 'react-icons/fa';
import { UserContext } from '../App';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const OSHSystems = () => {
  const { session, darkMode, toggleDarkMode, notifications, setShowNotifPanel } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [widgetLayout, setWidgetLayout] = useState(['stats', 'recommendations', 'modules', 'regulations']);
  const [recentActivities, setRecentActivities] = useState([]);
  const [syncStatus, setSyncStatus] = useState('synced');

  const role = session?.role;
  const isAdmin = role === 'Admin';
  const isSupervisor = role === 'Supervisor' || role === 'Admin';

  // Data module hubungan
  const modules = [
    { id: 'apd', name: 'APD', icon: FaHardHat, color: 'from-blue-500 to-blue-600', link: '/manajemen-apd', description: 'Kelola alat pelindung diri', related: ['observasi', 'medical'] },
    { id: 'observasi', name: 'Observasi', icon: FaEye, color: 'from-cyan-500 to-cyan-600', link: '/observasi-page', description: 'Pantau perilaku kerja aman', related: ['apd', 'near-miss'] },
    { id: 'near-miss', name: 'Near Miss', icon: FaExclamationTriangle, color: 'from-yellow-500 to-orange-500', link: '/near-miss', description: 'Laporan potensi bahaya', related: ['observasi', 'insiden'] },
    { id: 'medical', name: 'Medical', icon: FaHeartbeat, color: 'from-red-500 to-red-600', link: '/medical-case', description: 'Manajemen kasus medis', related: ['apd', 'statistik'] },
    { id: 'statistik', name: 'Statistik', icon: FaChartLine, color: 'from-purple-500 to-purple-600', link: '/osh-statistics', description: 'Analisis data K3', related: ['all'] },
    { id: 'management', name: 'Management', icon: FaCogs, color: 'from-indigo-500 to-indigo-600', link: '/osh-management-systems', description: 'Sistem manajemen K3', related: ['all'] },
  ];

  const regulations = [
    { level: 'Konstitusi', doc: 'UUD 1945 Pasal 27 & 28', desc: 'Hak setiap warga untuk bekerja dan mendapatkan perlakuan yang adil.' },
    { level: 'Undang-Undang', doc: 'UU No. 1/1970', desc: 'Keselamatan Kerja - dasar hukum utama K3 di Indonesia.' },
    { level: 'Peraturan Pemerintah', doc: 'PP No. 50/2012', desc: 'Sistem Manajemen Keselamatan dan Kesehatan Kerja (SMK3).' },
    { level: 'Peraturan Menteri', doc: 'Permenaker No. 5/2018', desc: 'Pengembangan SMK3 dan sertifikasi.' },
    { level: 'Standar Nasional', doc: 'SNI ISO 45001:2018', desc: 'Standar sistem manajemen K3 internasional yang diadopsi.' }
  ];

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { id: 'policy', label: 'Kebijakan', icon: FaGavel },
    { id: 'program', label: 'Program', icon: FaClipboardCheck },
    { id: 'tripartite', label: 'Tripartit', icon: FaHandshake },
    { id: 'inspection', label: 'Inspeksi', icon: FaBuilding },
    { id: 'modules', label: 'Module Hub', icon: FaCogs },
  ];

  const policyContent = {
    title: 'Kebijakan Nasional K3',
    description: 'Setiap negara harus memiliki kebijakan nasional yang jelas mengenai K3 untuk melindungi pekerja dan masyarakat.',
    items: [
      { title: 'Undang-Undang Dasar', desc: 'Kerangka hukum yang menetapkan hak dan kewajiban terkait K3.' },
      { title: 'Regulasi Sektor', desc: 'Peraturan khusus untuk sektor-sektor berisiko tinggi.' },
      { title: 'Standar Nasional', desc: 'Standar teknis dan prosedur yang harus dipatuhi.' },
      { title: 'Penegakan Hukum', desc: 'Mekanisme sanksi dan penegakan untuk memastikan kepatuhan.' }
    ]
  };

  // Fetch data dari MongoDB
  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/stats`),
        fetch(`${API_BASE}/api/activities?limit=5`)
      ]);
      
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setRecentActivities(data);
      }
      
      // AI Rekomendasi berdasarkan data
      generateAIRecommendations();
    } catch (err) {
      console.error('Gagal fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAIRecommendations = () => {
    setAiRecommendations([
      { id: 1, title: 'APD Compliance', message: 'APD usage turun 15% di area produksi. Perlu inspeksi tambahan.', priority: 'high', action: '/manajemen-apd' },
      { id: 2, title: 'Near Miss Trend', message: 'Near miss meningkat 20% di shift malam. Evaluasi prosedur.', priority: 'medium', action: '/near-miss' },
      { id: 3, title: 'Training Due', message: '5 pekerja perlu sertifikasi APAR bulan ini.', priority: 'low', action: '/pelatihan' },
    ]);
  };

  const syncToBackend = async () => {
    setSyncStatus('syncing');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSyncStatus('synced');
    setTimeout(() => setSyncStatus('synced'), 2000);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const chartData = stats ? [
    { name: 'Insiden', value: stats.incidents?.total || 0, color: '#ef4444' },
    { name: 'Near Miss', value: stats.nearMiss?.total || 0, color: '#f59e0b' },
    { name: 'Observasi', value: stats.observations?.total || 0, color: '#10b981' },
  ] : [];

  const renderWidget = (widgetId) => {
    switch(widgetId) {
      case 'stats':
        return (
          <div className="col-span-1 md:col-span-2 lg:col-span-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="flex items-center justify-between">
                  <FaExclamationTriangle className="text-red-500 text-2xl" />
                  <span className="text-xs text-gray-500">Total</span>
                </div>
                <p className="text-3xl font-bold mt-3">{stats?.incidents?.total || 0}</p>
                <p className="text-sm text-gray-500">Insiden</p>
              </div>
              <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <FaEye className="text-yellow-500 text-2xl" />
                <p className="text-3xl font-bold mt-3">{stats?.nearMiss?.total || 0}</p>
                <p className="text-sm text-gray-500">Near Miss</p>
              </div>
              <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <FaHardHat className="text-blue-500 text-2xl" />
                <p className="text-3xl font-bold mt-3">{stats?.apdCompliance || 87}%</p>
                <p className="text-sm text-gray-500">Kepatuhan APD</p>
              </div>
              <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <FaHeartbeat className="text-green-500 text-2xl" />
                <p className="text-3xl font-bold mt-3">{stats?.medical?.critical || 0}</p>
                <p className="text-sm text-gray-500">Medis Kritis</p>
              </div>
            </div>
          </div>
        );
      case 'recommendations':
        return (
          <div className="col-span-1 lg:col-span-2">
            <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <div className="flex items-center gap-2 mb-4">
                <FaRobot className="text-purple-500 text-xl" />
                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>AI Recommendations</h3>
              </div>
              <div className="space-y-3">
                {aiRecommendations.map(rec => (
                  <div key={rec.id} className={`p-3 rounded-xl ${rec.priority === 'high' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className={`font-semibold ${rec.priority === 'high' ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>{rec.title}</p>
                        <p className="text-sm text-gray-500">{rec.message}</p>
                      </div>
                      <button className="text-indigo-500 text-sm">Lihat →</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'modules':
        return (
          <div className="col-span-1 lg:col-span-2">
            <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Module Hub</h3>
              <div className="grid grid-cols-2 gap-3">
                {modules.filter(m => isSupervisor || m.id !== 'management').map(module => (
                  <button key={module.id} onClick={() => window.location.href = module.link} className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${module.color} text-white hover:shadow-lg transition-all`}>
                    <module.icon /> <span className="text-sm font-medium">{module.name}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500">💡 Hubungan antar module: APD → Observasi → Near Miss → Medical → Statistik</p>
              </div>
            </div>
          </div>
        );
      case 'regulations':
        return (
          <div className="col-span-1 lg:col-span-4">
            <div className={`rounded-2xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Recent Regulations</h3>
              <div className="space-y-3">
                {regulations.slice(0, 3).map((reg, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center"><FaFileAlt className="text-emerald-600" /></div>
                    <div><p className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>{reg.doc}</p><p className="text-xs text-gray-500">{reg.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30'}`}>
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        
        {/* Header with Dark Mode & Sync */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center"><FaBalanceScale className="text-white text-2xl" /></div>
            <div><h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Sistem K3 Nasional</h1><p className="text-sm text-gray-500">Framework Kebijakan & Modul Terintegrasi</p></div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button onClick={() => setShowNotifPanel(true)} className={`p-2.5 rounded-xl ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'} shadow-md`}>
                <FaBell />
                {notifications?.filter(n => !n.read).length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>}
              </button>
            </div>
            <button onClick={toggleDarkMode} className={`p-2.5 rounded-xl ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600'} shadow-md`}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button onClick={syncToBackend} className={`p-2.5 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}>
              {syncStatus === 'synced' ? <FaCloudUploadAlt className="text-green-500" /> : <FaSyncAlt />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <FaSearch className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input type="text" placeholder="Cari kebijakan, module, atau regulasi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-12 pr-4 py-4 rounded-2xl border focus:ring-2 focus:ring-emerald-300 outline-none transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}`} />
        </div>

        {/* Drag & Drop Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {widgetLayout.map(widget => (
              <div key={widget} className="drag-handle cursor-move">{renderWidget(widget)}</div>
            ))}
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${activeTab === tab.id ? 'bg-emerald-500 text-white shadow-lg' : `${darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-white'}`}`}>
              <tab.icon /> {tab.label}
            </button>
          ))}
        </div>

        {/* Policy Tab Content */}
        {activeTab !== 'dashboard' && activeTab !== 'modules' && (
          <div className={`rounded-3xl ${darkMode ? 'bg-gray-800/80' : 'bg-white'} shadow-xl p-8`}>
            <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{policyContent.title}</h2>
            <p className={`mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{policyContent.description}</p>
            <div className="grid md:grid-cols-2 gap-6">
              {policyContent.items.map((item, idx) => (
                <div key={idx} className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-700/50' : 'bg-gradient-to-br from-emerald-50 to-teal-50'}`}>
                  <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>{item.title}</h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Module Hub Tab */}
        {activeTab === 'modules' && (
          <div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.filter(m => isSupervisor || m.id !== 'management').map(module => (
                <motion.div key={module.id} whileHover={{ scale: 1.02 }} className={`rounded-2xl overflow-hidden shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className={`bg-gradient-to-r ${module.color} p-5 text-white`}>
                    <div className="flex justify-between items-start"><module.icon className="text-3xl" /><span className="text-xs opacity-80">{module.related.includes('all') ? 'Core Module' : `Terhubung ke: ${module.related.join(', ')}`}</span></div>
                    <h3 className="text-xl font-bold mt-4">{module.name}</h3>
                    <p className="text-sm opacity-90 mt-1">{module.description}</p>
                  </div>
                  <div className="p-5"><button onClick={() => window.location.href = module.link} className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2">Buka Module <FaArrowRight /></button></div>
                </motion.div>
              ))}
            </div>
            <div className={`mt-8 rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-emerald-50'}`}>
              <h3 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🔗 Hubungan Antar Module</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">APD</span>
                <span className="text-gray-400">→</span>
                <span className="px-3 py-1.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-sm">Observasi</span>
                <span className="text-gray-400">→</span>
                <span className="px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm">Near Miss</span>
                <span className="text-gray-400">→</span>
                <span className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm">Medical</span>
                <span className="text-gray-400">→</span>
                <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">Statistik</span>
              </div>
            </div>
          </div>
        )}

        {/* Regulations Table */}
        <div className={`rounded-3xl ${darkMode ? 'bg-gray-800/80' : 'bg-white'} shadow-xl overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}><tr><th className="p-4 text-left">Tingkat</th><th className="p-4 text-left">Dokumen</th><th className="p-4 text-left">Deskripsi</th></tr></thead>
              <tbody>{regulations.map((reg, idx) => (<tr key={idx} className="border-t border-gray-200 dark:border-gray-700"><td className="p-4"><span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs">{reg.level}</span></td><td className="p-4 font-medium">{reg.doc}</td><td className="p-4 text-gray-500 text-sm">{reg.desc}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OSHSystems;