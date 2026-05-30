import React, { useState, useEffect, useContext, createContext } from 'react';
import 'leaflet/dist/leaflet.css';

// ==================== IMPOR SEMUA KOMPONEN ====================
import LoginPage from './pages/LoginPage';
import LandingPageElefante from './pages/LandingPageElefante';
import Dashboard from './pages/Dashboard';
import DashboardHSSE from './pages/DashboardHSSE';
import JamKerjaSelamat from './pages/JamKerjaSelamat';
import JamKerjaSelamatForm from './pages/JamKerjaSelamatForm';
import IncidentalTreatmentForm from './pages/IncidentalTreatmentForm';
import FitToWorkForm from './pages/FitToWorkForm';
import UserManagement from './pages/UserManagement';
import NotificationsPage from './pages/NotificationsPage';
import ManajemenAPD from './pages/ManajemenAPD';
import PengaturanNotifikasi from './pages/PengaturanNotifikasi';
import ManajemenKontraktor from './pages/ManajemenKontraktor';
import IzinKerja from './pages/IzinKerja';
import Insiden from './pages/Insiden';
import LaggingIndicator from './pages/LaggingIndicator';
import MedicalCase from './pages/MedicalCase';
import Pelatihan from './pages/Pelatihan';
import Placeholder from './pages/Placeholder';

// ========== KOMPONEN LAINNYA ==========
import AuditLogs from './pages/AuditLogs';
import JSAForm from './pages/JSAForm';
import JSAHistory from './pages/JSAHistory';
import Leaderboard from './pages/Leaderboard';
import NearMiss from './pages/NearMiss';
import Observasi from './pages/Observasi';
import QuickSafetyChecklist from './pages/QuickSafetyChecklist';
import Reports from './pages/Reports';
import SafetyMoments from './pages/SafetyReels';
import Workflows from './pages/Workflows';
import ReelsPage from './pages/ReelsPage';
import Attendance from './pages/Attendance';
import HazardHub from './pages/HazardHub';
import IoTPlatform from './pages/IoTPlatform';

// ========== KOMPONEN YANG DIMINTA ==========
import Profile from './pages/Profile';
import PemadamEvakuasi from './pages/PemadamEvakuasi';
import Galeri from './pages/Galeri';
import NewsPage from './pages/NewsPage';
import CartPage from './pages/CartPage';
import TestBackend from './pages/TestBackend';
import MenuManagement from './pages/MenuManagement';
import PublicationsResources from './pages/PublicationsResources';
import PsychosocialRisks from './pages/PsychosocialRisks';

// ========== HALAMAN ILO K3 ==========
import OSHOverview from './pages/OSHOverview';
import OSHSystems from './pages/OSHSystems';
import LabourStandards from './pages/LabourStandards';
import SectorsHazards from './pages/SectorsHazardsComplete';
import OccupationalDiseases from './pages/OccupationalDiseases';
import OSHStatistics from './pages/OSHStatistics';
import OSHManagementSystems from './pages/OSHManagementSystems';
import VisionZero from './pages/VisionZero';
import GlobalStrategy from './pages/GlobalStrategy';

// ========== FITUR BARU ==========
import SafetyReels from './pages/SafetyReels';
import SectorsHazardsComplete from './pages/SectorsHazardsComplete';
import UserManagementComplete from './pages/UserManagement';
import NotificationsModal from './components/NotificationsModal';

// ========== IMPORT UNTUK BACKEND ==========
import { checkBackendConnection } from './services/api';

const UserContext = createContext();

const ROLES = {
  ADMIN: 'Admin',
  SUPERVISOR: 'Supervisor',
  KARYAWAN: 'Karyawan',
  MANAGER: 'Manager',
  HSE_OFFICER: 'HSE Officer'
};

export { ROLES };

// Data default untuk fallback jika database kosong
const dummyUsers = [
  { name: 'Admin User', username: 'admin', password: 'admin', role: ROLES.ADMIN },
  { name: 'Supervisor User', username: 'sup', password: 'sup', role: ROLES.SUPERVISOR },
  { name: 'Karyawan User', username: 'kary', password: 'kary', role: ROLES.KARYAWAN },
  { name: 'Manager User', username: 'manager', password: 'manager', role: ROLES.MANAGER },
  { name: 'HSE Officer', username: 'hse', password: 'hse', role: ROLES.HSE_OFFICER }
];

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const App = () => {
  const [currentPage, setCurrentPage] = useState('/');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [kontraktorList, setKontraktorList] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [session, setSession] = useState({ loggedIn: false, role: null, userId: null });
  const [darkMode, setDarkMode] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [jsaSubmissions, setJsaSubmissions] = useState([]);

  // ==================== FUNGSI API LENGKAP ====================
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      if (res.ok) {
        const data = await res.json();
        if (data.length === 0) {
          for (const user of dummyUsers) {
            await fetch(`${API_BASE}/api/users`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(user)
            });
          }
          const res2 = await fetch(`${API_BASE}/api/users`);
          const seeded = await res2.json();
          setUsers(seeded);
        } else {
          setUsers(data);
        }
      } else {
        console.error('Gagal fetch users, status:', res.status);
        setUsers([]);
      }
    } catch (err) {
      console.error('Gagal fetch users:', err);
      setUsers([]);
    }
  };

  const fetchAssessments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/assessments`);
      if (res.ok) {
        const data = await res.json();
        setAssessments(data);
      }
    } catch (err) {
      console.error('Gagal fetch assessments:', err);
    }
  };

  const fetchKontraktor = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/kontraktor`);
      if (res.ok) {
        const data = await res.json();
        setKontraktorList(data);
      }
    } catch (err) {
      console.error('Gagal fetch kontraktor:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Gagal fetch notifikasi:', err);
    }
  };

  const addNotification = async (message) => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, read: false, date: new Date().toISOString() })
      });
      if (res.ok) {
        const newNotif = await res.json();
        setNotifications(prev => [newNotif, ...prev]);
      }
    } catch (err) {
      console.error('Gagal simpan notifikasi:', err);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        fetchUsers(),
        fetchAssessments(),
        fetchKontraktor(),
        fetchNotifications()
      ]);
      setIsDataLoaded(true);
    };
    loadAllData();
  }, []);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('jsms_darkMode');
    if (savedDarkMode !== null) setDarkMode(JSON.parse(savedDarkMode));
  }, []);

  useEffect(() => {
    if (isDataLoaded) localStorage.setItem('jsms_darkMode', JSON.stringify(darkMode));
  }, [darkMode, isDataLoaded]);

  useEffect(() => {
    const cekBackend = async () => {
      const connected = await checkBackendConnection();
      setBackendStatus(connected ? 'connected' : 'disconnected');
    };
    cekBackend();
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    const checkNotifications = async () => {
      const newMessages = [];
      assessments.forEach(ass => {
        if (ass.date) {
          const daysDiff = Math.floor((new Date() - new Date(ass.date)) / (1000*60*60*24));
          if (daysDiff >= 14) newMessages.push(`Assessment ${ass.name || 'seseorang'} akan kadaluarsa`);
        }
        if (ass.status === 'Unfit') newMessages.push(`Assessment ${ass.name || 'seseorang'} dinyatakan Unfit`);
      });
      for (const msg of newMessages) {
        const alreadyExists = notifications.some(n => n.message === msg);
        if (!alreadyExists) {
          await addNotification(msg);
        }
      }
    };
    checkNotifications();
  }, [assessments, isDataLoaded]);

  const login = async (username, password) => {
    setLoginError('');
    if (!users.length) {
      setLoginError('Data pengguna belum tersedia. Periksa koneksi backend atau muat ulang halaman.');
      return false;
    }
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setSession({ loggedIn: true, role: user.role, userId: user._id });
      setCurrentPage('/dashboard');
      return true;
    } else {
      setLoginError('Username atau password salah');
      return false;
    }
  };

  const logout = () => {
    setSession({ loggedIn: false, role: null, userId: null });
    setCurrentPage('/');
    setLoginError('');
    setSidebarOpen(false);
  };

  const addUser = async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers(prev => [...prev, newUser]);
      } else {
        const err = await res.json();
        console.error('Gagal tambah user:', err);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateUser = async (id, updated) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(prev => prev.map(u => u._id === id ? updatedUser : u));
        if (session.userId === id) {
          setSession(prev => ({ ...prev, role: updatedUser.role }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u._id !== id));
        if (session.userId === id) logout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculateStatus = (data) => {
    const isSehatFisik = data.healthPhysical === 'Yes';
    const isMentalStabil = data.healthMental === 'Yes';
    const allChecks = data.apdComplete && data.toolsOk && data.certValid;
    const noJantung = !data.hasJantungDisease;
    const noMenular = !data.hasMenularDisease;
    if (isSehatFisik && isMentalStabil && allChecks && noJantung && noMenular) return 'Fit';
    if (data.riskScale === 'Low' && (isSehatFisik || isMentalStabil) && allChecks) return 'Fit with Note';
    return 'Unfit';
  };

  const saveAssessment = async (assData) => {
    if (assData.hazards) {
      try {
        const res = await fetch(`${API_BASE}/backend-kuzu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assData)
        });
        if (!res.ok) throw new Error('Gagal simpan JSA');
        const saved = await res.json();
        console.log('JSA tersimpan:', saved);
        setJsaSubmissions(prev => [saved.data, ...prev]);
        return saved;
      } catch (err) {
        console.error('Error save JSA:', err);
        alert('Gagal menyimpan JSA. Periksa koneksi backend.');
        throw err;
      }
    } else {
      const newAss = { ...assData, status: calculateStatus(assData) };
      try {
        const res = await fetch(`${API_BASE}/api/assessments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAss)
        });
        if (res.ok) {
          const saved = await res.json();
          setAssessments(prev => [saved, ...prev.slice(0, 49)]);
          return saved;
        } else {
          throw new Error('Gagal simpan assessment');
        }
      } catch (err) {
        console.error('Gagal simpan assessment:', err);
        throw err;
      }
    }
  };

  const canAccess = (page) => {
    if (!session.loggedIn) return page === '/login' || page === '/';
    const role = session.role;

    const iloPages = [
      '/osh-overview', '/osh-systems', '/labour-standards',
      '/sectors-hazards', '/sectors-hazards-complete', '/occupational-diseases', '/psychosocial-risks',
      '/osh-statistics', '/osh-management-systems', '/publications-resources',
      '/vision-zero', '/global-strategy'
    ];

    const adminOnlyPages = [
      '/users', '/users-complete', '/audit-logs', '/pengaturan-notifikasi', 
      '/menu-management', '/cart'
    ];
    
    const supervisorOnlyPages = [
      '/jam-kerja-selamat', '/jam-kerja-selamat-form', '/izin-kerja',
      '/insiden', '/near-miss', '/observasi-page', '/manajemen-apd', '/kontraktor',
      '/lagging-indicator', '/pelatihan', '/pelatihan-pemadam', '/pelatihan-swP',
      '/pelatihan-refresh-stk', '/pelatihan-fleet-safety'
    ];

    const basePages = [
      '/dashboard', '/medical-case', '/fit-to-work', '/notifications',
      '/quick-safety-checklist', '/reports', '/safety-moments',
      '/workflows', '/reels', '/safety-reels',
      '/attendance', '/hazard-hub', '/iot-platform',
      '/asset', '/verifikasi-volume', '/dist-bbm-vhs', '/dist-bbm-franco',
      '/observasi', '/emergency-readiness', '/meeting-komunikasi',
      '/jsa-form', '/jsa-history', '/leaderboard',
      '/profile', '/galeri', '/news', '/test-backend', '/incidental-treatment',
      ...iloPages
    ];

    if (role === ROLES.KARYAWAN) return basePages.includes(page);
    if (role === ROLES.SUPERVISOR || role === ROLES.HSE_OFFICER) return [...basePages, ...supervisorOnlyPages].includes(page);
    if (role === ROLES.MANAGER || role === ROLES.ADMIN) return [...basePages, ...supervisorOnlyPages, ...adminOnlyPages].includes(page);
    return false;
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const contextValue = {
    session, login, logout, users, addUser, updateUser, deleteUser,
    assessments, saveAssessment, calculateStatus, notifications, setNotifications,
    kontraktorList, setKontraktorList, showNotifPanel, setShowNotifPanel,
    canAccess, currentPage, setCurrentPage, sidebarOpen, setSidebarOpen,
    isDataLoaded, darkMode, toggleDarkMode, backendStatus,
    loginError, jsaSubmissions, API_BASE
  };

  const Sidebar = () => {
    const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, session, logout, notifications, setShowNotifPanel, backendStatus } = useContext(UserContext);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [openMenus, setOpenMenus] = useState({});

    const toggleSubmenu = (name) => {
      setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const menuStructure = [
      { name: '🏠 Beranda', path: '/' },
      {
        name: '💰 Transaksi',
        submenu: [
          { name: 'Verifikasi Volume', path: '/verifikasi-volume' },
          { name: 'Dist. BBM (VHS)', path: '/dist-bbm-vhs' },
          { name: 'Dist. BBM (Franco)', path: '/dist-bbm-franco' },
          { name: 'Asset', path: '/asset' },
          { name: 'Cart / Keranjang', path: '/cart' }
        ]
      },
      {
        name: '🛡️ HSSE',
        submenu: [
          { name: 'Dashboard HSSE', path: '/dashboard' },
          ...(session.role !== ROLES.KARYAWAN ? [
            { 
              name: '📊 Lagging Indicator', 
              submenu: [
                { name: 'Jam Kerja Selamat', path: '/jam-kerja-selamat' },
                { name: 'Form Jam Kerja Selamat', path: '/jam-kerja-selamat-form' }
              ] 
            },
            { name: '📄 Izin Kerja (PTW)', path: '/izin-kerja' },
            { name: '⚠️ Laporan Insiden', path: '/insiden' },
            { name: '👀 Near Miss', path: '/near-miss' },
            { name: '🔍 Observasi', path: '/observasi-page' }
          ] : []),
          { name: '🏥 Medical Case', path: '/medical-case' },
          {
            name: '📚 Pelatihan',
            submenu: [
              { name: 'Pemadam / Evakuasi', path: '/pelatihan-pemadam' },
              { name: 'Safe Work Practice', path: '/pelatihan-swP' },
              { name: 'Refresh STK', path: '/pelatihan-refresh-stk' },
              { name: 'Fleet Safety', path: '/pelatihan-fleet-safety' }
            ]
          },
          { name: '✅ Fit to Work', path: '/fit-to-work' },
          { name: '🩺 Incidental Treatment', path: '/incidental-treatment' },
          ...(session.role !== ROLES.KARYAWAN ? [
            { name: '🥽 Manajemen APD', path: '/manajemen-apd' },
            { name: '🏗️ Manajemen Kontraktor', path: '/kontraktor' }
          ] : []),
          ...(session.role === ROLES.ADMIN || session.role === ROLES.MANAGER ? [
            { name: '👥 User Management', path: '/users' },
            { name: '👥 User Management Pro', path: '/users-complete' },
            { name: '🔔 Pengaturan Notifikasi', path: '/pengaturan-notifikasi' },
            { name: '📜 Audit Logs', path: '/audit-logs' }
          ] : []),
          { name: '📝 JSA Form', path: '/jsa-form' },
          { name: '📜 Riwayat JSA', path: '/jsa-history' },
          { name: '🏆 Leaderboard', path: '/leaderboard' },
          { name: '✅ Quick Safety Checklist', path: '/quick-safety-checklist' },
          { name: '📊 Reports', path: '/reports' },
          { name: '📽️ Safety Moments', path: '/safety-moments' },
          { name: '⚙️ Workflows', path: '/workflows' },
          { name: '🎥 Safety Reels', path: '/reels' },
          { name: '🎬 Safety Reels Pro', path: '/safety-reels' },
          { name: '📋 Absensi', path: '/attendance' },
          { name: '⚠️ Hazard Hub', path: '/hazard-hub' },
          { name: '🌐 IoT Platform', path: '/iot-platform' },
          { name: '🚨 Emergency Readiness', path: '/emergency-readiness' },
          { name: '💬 Meeting/Komunikasi', path: '/meeting-komunikasi' }
        ]
      },
      {
        name: '📚 Topik K3 (ILO)',
        submenu: [
          { name: 'OSH Overview', path: '/osh-overview' },
          { name: 'Sistem K3 Nasional', path: '/osh-systems' },
          { name: 'Standar Internasional', path: '/labour-standards' },
          { name: 'Sektor & Bahaya', path: '/sectors-hazards' },
          { name: 'Sektor & Bahaya Pro', path: '/sectors-hazards-complete' },
          { name: 'Penyakit Akibat Kerja', path: '/occupational-diseases' },
          { name: 'Risiko Psikososial', path: '/psychosocial-risks' },
          { name: 'Statistik K3', path: '/osh-statistics' },
          { name: 'Sistem Manajemen K3', path: '/osh-management-systems' },
          { name: 'Publikasi & Sumber Daya', path: '/publications-resources' },
          { name: 'Vision Zero', path: '/vision-zero' },
          { name: 'Strategi Global', path: '/global-strategy' }
        ]
      },
      { name: '👤 Profil', path: '/profile' },
      { name: '🖼️ Galeri', path: '/galeri' },
      { name: '📰 Berita', path: '/news' },
      { name: '🚪 Logout', onClick: () => { logout(); setSidebarOpen(false); } },  // <-- LOGOUT SEBAGAI MENU
      { name: '🧪 Test Backend', path: '/test-backend' },
      ...(session.role === ROLES.ADMIN ? [{ name: '📋 Menu Management (Admin)', path: '/menu-management' }] : []),
    ];

    const renderMenu = (items, level = 0) => {
      return items.map((item, idx) => {
        const hasSubmenu = item.submenu && item.submenu.length > 0;
        const paddingLeft = level === 0 ? 'pl-4' : `pl-${8 + level * 4}`;
        
        if (hasSubmenu) {
          const isOpen = openMenus[item.name] || false;
          return (
            <div key={idx}>
              <div 
                onClick={() => toggleSubmenu(item.name)} 
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors ${paddingLeft}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-sm">{isOpen ? '▼' : '►'}</span>
              </div>
              {isOpen && <div className="ml-4">{renderMenu(item.submenu, level + 1)}</div>}
            </div>
          );
        }
        
        // Jika item punya onClick, gunakan itu (untuk logout)
        if (item.onClick) {
          return (
            <button
              key={idx}
              onClick={() => {
                item.onClick();
                setSidebarOpen(false);
              }}
              className={`flex items-center w-full p-3 rounded-xl transition-all hover:bg-gray-700 ${paddingLeft}`}
            >
              <span className="font-medium">{item.name}</span>
            </button>
          );
        }
        
        return (
          <button
            key={idx}
            onClick={() => {
              if (item.path) setCurrentPage(item.path);
              setSidebarOpen(false);
            }}
            className={`flex items-center w-full p-3 rounded-xl transition-all hover:bg-gray-700 ${paddingLeft} ${
              currentPage === item.path ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg' : ''
            }`}
          >
            <span className="font-medium">{item.name}</span>
          </button>
        );
      });
    };

    return (
      <div className={`bg-gradient-to-b from-gray-900 to-gray-800 text-white min-h-screen transition-all duration-300 fixed left-0 top-0 z-40 flex flex-col ${isCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Header Sidebar */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-white p-2 rounded-lg hover:bg-gray-700 transition">
            {isCollapsed ? '☰' : '←'}
          </button>
          {!isCollapsed && (
            <button onClick={() => setShowNotifPanel(true)} className="relative p-2 hover:bg-gray-700 rounded-lg transition">
              🔔
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Brand */}
        {!isCollapsed && (
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              JSMS HSSE
            </h1>
            <p className="text-gray-400 text-xs">Job Safety System</p>
            <p className="text-orange-400 font-semibold text-sm mt-1">{session.role}</p>
          </div>
        )}

        {/* Backend Status */}
        {!isCollapsed && (
          <div className="px-3 py-1 mb-2">
            <div className={`text-xs rounded-lg p-1.5 text-center ${backendStatus === 'connected' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {backendStatus === 'connected' ? '🟢 Online' : '🔴 Offline'}
            </div>
          </div>
        )}

        {/* Menu Navigasi */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {renderMenu(menuStructure)}
        </nav>

        {/* Tombol logout di footer DIHAPUS karena sudah ada di menu */}

        {/* Version */}
        {!isCollapsed && (
          <div className="text-center text-xs text-gray-500 pb-3">
            v2.0
          </div>
        )}

        <NotificationsModal />
      </div>
    );
  };

  const Routes = () => {
    const { currentPage, session, canAccess } = useContext(UserContext);
    
    if (!session.loggedIn && currentPage === '/') return <LandingPageElefante />;
    if (!canAccess(currentPage)) return <LoginPage />;

    const pageMap = {
      '/': <LandingPageElefante />,
      '/login': <LoginPage />,
      '/dashboard': <DashboardHSSE />,
      '/jam-kerja-selamat': <JamKerjaSelamat />,
      '/jam-kerja-selamat-form': <JamKerjaSelamatForm />,
      '/medical-case': <MedicalCase />,
      '/fit-to-work': <FitToWorkForm />,
      '/cart': <CartPage />,
      '/users': <UserManagement />,
      '/users-complete': <UserManagementComplete />,
      '/notifications': <NotificationsPage />,
      '/manajemen-apd': <ManajemenAPD />,
      '/pengaturan-notifikasi': <PengaturanNotifikasi />,
      '/kontraktor': <ManajemenKontraktor />,
      '/izin-kerja': <IzinKerja />,
      '/insiden': <Insiden />,
      '/lagging-indicator': <LaggingIndicator />,
      '/pelatihan': <Pelatihan />,
      '/pelatihan-pemadam': <PemadamEvakuasi />,
      '/pelatihan-swP': <Placeholder title="Safe Work Practice" />,
      '/pelatihan-refresh-stk': <Placeholder title="Refresh STK" />,
      '/pelatihan-fleet-safety': <Placeholder title="Fleet Safety" />,
      '/verifikasi-volume': <Placeholder title="Verifikasi Volume" />,
      '/dist-bbm-vhs': <Placeholder title="Dist. BBM (VHS)" />,
      '/dist-bbm-franco': <Placeholder title="Dist. BBM (Franco)" />,
      '/asset': <Placeholder title="Asset" />,
      '/observasi': <Placeholder title="Observasi (Lama)" />,
      '/observasi-page': <Observasi />,
      '/emergency-readiness': <Placeholder title="Emergency Readiness" />,
      '/meeting-komunikasi': <Placeholder title="Meeting/Komunikasi" />,
      '/quick-safety-checklist': <QuickSafetyChecklist />,
      '/reports': <Reports />,
      '/safety-moments': <SafetyMoments />,
      '/workflows': <Workflows />,
      '/audit-logs': <AuditLogs />,
      '/jsa-form': <JSAForm />,
      '/jsa-history': <JSAHistory />,
      '/leaderboard': <Leaderboard />,
      '/near-miss': <NearMiss />,
      '/reels': <ReelsPage />,
      '/safety-reels': <SafetyReels />,
      '/attendance': <Attendance />,
      '/hazard-hub': <HazardHub />,
      '/iot-platform': <IoTPlatform />,
      '/incidental-treatment': <IncidentalTreatmentForm />,
      '/osh-overview': <OSHOverview />,
      '/osh-systems': <OSHSystems />,
      '/labour-standards': <LabourStandards />,
      '/sectors-hazards': <SectorsHazards />,
      '/sectors-hazards-complete': <SectorsHazardsComplete />,
      '/occupational-diseases': <OccupationalDiseases />,
      '/psychosocial-risks': <PsychosocialRisks />,
      '/osh-statistics': <OSHStatistics />,
      '/osh-management-systems': <OSHManagementSystems />,
      '/publications-resources': <PublicationsResources />,
      '/vision-zero': <VisionZero />,
      '/global-strategy': <GlobalStrategy />,
      '/profile': <Profile />,
      '/galeri': <Galeri />,
      '/news': <NewsPage />,
      '/test-backend': <TestBackend />,
      '/menu-management': <MenuManagement />,
    };
    return pageMap[currentPage] || (session.loggedIn ? <DashboardHSSE /> : <LandingPageElefante />);
  };

  return (
    <UserContext.Provider value={contextValue}>
      <div className={darkMode ? 'dark' : ''}>
        <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-900 to-slate-950' : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50'} flex`}>
          {session.loggedIn && <Sidebar />}
          {sidebarOpen && session.loggedIn && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}
          <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full pt-24 md:pt-6 overflow-y-auto">
            <Routes />
          </main>
        </div>
      </div>
    </UserContext.Provider>
  );
};

export { UserContext };
export default App;