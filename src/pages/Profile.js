// src/pages/Profile.js
import React, { useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaEnvelope, FaCalendarAlt, FaBuilding, FaMapMarkerAlt, 
  FaPhone, FaGlobe, FaEdit, FaCheck, FaCamera, FaChartLine,
  FaHistory, FaRobot, FaGraduationCap, FaEye, FaBell, FaShieldAlt,
  FaMoon, FaSun, FaSignOutAlt, FaLock, FaDesktop, FaMobileAlt,
  FaArrowRight, FaTrophy, FaMedal, FaStar, FaClock, FaCheckCircle,
  FaExclamationTriangle, FaCertificate
} from 'react-icons/fa';
import { UserContext } from '../App';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const Profile = () => {
  const { session, users, updateUser, logout, darkMode, toggleDarkMode } = useContext(UserContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [profilePic, setProfilePic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');

  // Data user yang login
  const currentUser = users.find(u => u._id === session.userId);
  const userRole = session.role || (currentUser?.role || 'Karyawan');

  // Company info
  const companyInfo = {
    name: 'PT Elefante Infradigi Solution',
    description: 'Perusahaan yang bergerak di bidang penyedia infrastruktur digital untuk layanan mandiri dan bisnis nirtunai, mendukung Industri 4.0 dan Logistik 4.0.',
    address: 'Jl. Daan Mogot KM 19.6, Poris Jaya, Batuceper, Kota Tangerang, Banten 15122',
    phone: '+62 21 5522366',
    email: 'info@elefante.co.id',
    website: 'https://elefante.co.id',
    industry: 'Teknologi Informasi & IoT',
    founded: '2020',
  };

  // Load profile picture from localStorage or backend
  useEffect(() => {
    const savedPic = localStorage.getItem(`jsms_profile_pic_${session.userId}`);
    if (savedPic) {
      setProfilePic(savedPic);
    }
    fetchUserStats();
    fetchLoginHistory();
    fetchAiRecommendations();
    fetchActivityData();
  }, [session.userId]);

  const fetchUserStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user-stats/${session.userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserStats(data);
      } else {
        // Fallback data
        setUserStats({
          totalObservations: 24,
          totalNearMiss: 5,
          totalTrainings: 8,
          completedTrainings: 6,
          certificates: 4,
          contributionScore: 85,
          streakDays: 12,
          rank: 'Silver'
        });
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/login-history/${session.userId}`);
      if (res.ok) {
        const data = await res.json();
        setLoginHistory(data);
      } else {
        // Fallback
        setLoginHistory([
          { device: 'Chrome on Windows', location: 'Jakarta, Indonesia', time: new Date().toISOString(), ip: '192.168.1.1' },
          { device: 'Safari on iPhone', location: 'Tangerang, Indonesia', time: new Date(Date.now() - 86400000).toISOString(), ip: '192.168.1.2' }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch login history:', err);
    }
  };

  const fetchAiRecommendations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user-recommendations/${session.userId}`);
      if (res.ok) {
        const data = await res.json();
        setAiRecommendations(data);
      } else {
        setAiRecommendations([
          { title: 'Advanced Fire Safety', reason: 'Based on your role as Supervisor', priority: 'high', action: '/pelatihan-pemadam' },
          { title: 'First Aid Refresher', reason: 'Certificate expiring in 30 days', priority: 'medium', action: '/pelatihan' },
          { title: 'APD Inspection', reason: 'New APD standards released', priority: 'low', action: '/manajemen-apd' }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  const fetchActivityData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user-activity/${session.userId}`);
      if (res.ok) {
        const data = await res.json();
        setActivityData(data);
      } else {
        // Fallback chart data
        setActivityData([
          { day: 'Sen', observations: 4, trainings: 1 },
          { day: 'Sel', observations: 6, trainings: 0 },
          { day: 'Rab', observations: 3, trainings: 2 },
          { day: 'Kam', observations: 7, trainings: 1 },
          { day: 'Jum', observations: 5, trainings: 0 },
          { day: 'Sab', observations: 2, trainings: 1 },
          { day: 'Min', observations: 1, trainings: 0 }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      // Save changes
      if (editedName && currentUser) {
        updateUser(session.userId, { 
          ...currentUser, 
          name: editedName,
          email: editedEmail,
          phone: editedPhone
        });
      }
      setIsEditing(false);
    } else {
      setEditedName(currentUser?.name || '');
      setEditedEmail(currentUser?.email || '');
      setEditedPhone(currentUser?.phone || '');
      setIsEditing(true);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfilePic(base64String);
        localStorage.setItem(`jsms_profile_pic_${session.userId}`, base64String);
        
        // Save to backend
        fetch(`${API_BASE}/api/user-profile/${session.userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profilePicture: base64String })
        }).catch(err => console.error('Failed to save profile picture:', err));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      handlePhotoUpload(e);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Password baru tidak cocok!');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password minimal 6 karakter!');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.userId,
          oldPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      if (res.ok) {
        alert('✅ Password berhasil diubah!');
        setShowPasswordModal(false);
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const error = await res.json();
        setPasswordError(error.error || 'Gagal mengubah password');
      }
    } catch (err) {
      setPasswordError('Terjadi kesalahan, coba lagi nanti');
    }
  };

  // Get rank badge
  const getRankBadge = () => {
    const rank = userStats?.rank || 'Bronze';
    const colors = {
      Bronze: 'bg-amber-600',
      Silver: 'bg-gray-400',
      Gold: 'bg-yellow-500',
      Platinum: 'bg-cyan-500'
    };
    return colors[rank] || 'bg-amber-600';
  };

  if (!currentUser && !session.userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Profil Saya</h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kelola informasi akun dan aktivitas Anda</p>
          </div>
          <button onClick={toggleDarkMode} className={`p-2.5 rounded-xl ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600'} shadow`}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN - Profile Card */}
          <div className="lg:col-span-1">
            <div className={`rounded-2xl shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {/* Cover Photo */}
              <div className={`h-28 bg-gradient-to-r from-blue-500 to-purple-600 relative`}>
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white object-cover" />
                    ) : (
                      <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <FaUser className="text-gray-500 dark:text-gray-400 text-4xl" />
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full hover:bg-blue-600 transition shadow-lg"
                      title="Upload foto"
                    >
                      <FaCamera size={12} />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                    <input type="file" ref={cameraInputRef} onChange={handleCameraCapture} accept="image/*" capture="environment" className="hidden" />
                  </div>
                </div>
              </div>

              <div className="pt-16 pb-6 px-6 text-center">
                {isEditing ? (
                  <div className="space-y-2">
                    <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="Nama lengkap" />
                    <input type="email" value={editedEmail} onChange={(e) => setEditedEmail(e.target.value)} className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="Email" />
                    <input type="tel" value={editedPhone} onChange={(e) => setEditedPhone(e.target.value)} className={`w-full p-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} placeholder="No. Telepon" />
                  </div>
                ) : (
                  <>
                    <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{currentUser?.name || 'Pengguna'}</h2>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{userRole}</p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-center gap-2 text-gray-500"><FaEnvelope /> {currentUser?.username || session.userId}</div>
                      <div className="flex items-center justify-center gap-2 text-gray-500"><FaCalendarAlt /> Bergabung: {new Date(currentUser?.createdAt || Date.now()).toLocaleDateString('id-ID')}</div>
                    </div>
                  </>
                )}
                
                <div className="mt-6 flex gap-3 justify-center">
                  <button onClick={handleEdit} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${isEditing ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'} hover:opacity-90`}>
                    {isEditing ? <FaCheck /> : <FaEdit />} {isEditing ? 'Simpan' : 'Edit Profil'}
                  </button>
                  <button onClick={() => setShowPasswordModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition">
                    <FaLock /> Ganti Password
                  </button>
                  <button onClick={logout} className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition">
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Stats & Activity */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <FaEye className="text-blue-500 text-xl mb-2" />
                <p className="text-2xl font-bold">{userStats?.totalObservations || 0}</p>
                <p className="text-xs text-gray-500">Observasi</p>
              </div>
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <FaExclamationTriangle className="text-yellow-500 text-xl mb-2" />
                <p className="text-2xl font-bold">{userStats?.totalNearMiss || 0}</p>
                <p className="text-xs text-gray-500">Near Miss</p>
              </div>
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <FaGraduationCap className="text-green-500 text-xl mb-2" />
                <p className="text-2xl font-bold">{userStats?.completedTrainings || 0}/{userStats?.totalTrainings || 0}</p>
                <p className="text-xs text-gray-500">Pelatihan</p>
              </div>
              <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <FaCertificate className="text-purple-500 text-xl mb-2" />
                <p className="text-2xl font-bold">{userStats?.certificates || 0}</p>
                <p className="text-xs text-gray-500">Sertifikat</p>
              </div>
            </div>

            {/* Rank & Streak */}
            <div className={`rounded-xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow flex justify-between items-center`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${getRankBadge()} rounded-full flex items-center justify-center`}>
                  <FaTrophy className="text-white text-xl" />
                </div>
                <div>
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Rank {userStats?.rank || 'Bronze'}</p>
                  <p className="text-xs text-gray-500">Contribution Score: {userStats?.contributionScore || 0}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{userStats?.streakDays || 0} hari</p>
                <p className="text-xs text-gray-500">Aktif berturut-turut 🔥</p>
              </div>
            </div>

            {/* Activity Chart */}
            <div className={`rounded-xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Aktivitas Mingguan</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="day" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                  <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                  <Tooltip />
                  <Area type="monotone" dataKey="observations" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="trainings" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded"></div> Observasi</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded"></div> Pelatihan</div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className={`rounded-xl p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <div className="flex items-center gap-2 mb-4">
                <FaRobot className="text-purple-500 text-xl" />
                <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>AI Rekomendasi untuk Anda</h3>
              </div>
              <div className="space-y-3">
                {aiRecommendations.map((rec, idx) => (
                  <div key={idx} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} flex justify-between items-center`}>
                    <div>
                      <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{rec.title}</p>
                      <p className="text-xs text-gray-500">{rec.reason}</p>
                    </div>
                    <a href={rec.action} className="text-blue-500 hover:text-blue-600">
                      <FaArrowRight />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className={`rounded-2xl shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaBuilding className="text-blue-500 text-2xl" />
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Informasi Perusahaan</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{companyInfo.name}</h3>
                <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{companyInfo.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3"><FaMapMarkerAlt className="text-gray-400 mt-0.5" /><span className="text-sm">{companyInfo.address}</span></div>
                <div className="flex items-center gap-3"><FaPhone className="text-gray-400" /><span className="text-sm">{companyInfo.phone}</span></div>
                <div className="flex items-center gap-3"><FaEnvelope className="text-gray-400" /><span className="text-sm">{companyInfo.email}</span></div>
                <div className="flex items-center gap-3"><FaGlobe className="text-gray-400" /><a href={companyInfo.website} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline">{companyInfo.website}</a></div>
              </div>
            </div>
          </div>
        </div>

        {/* Login History */}
        <div className={`rounded-2xl shadow-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FaHistory className="text-blue-500 text-2xl" />
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Riwayat Login</h2>
            </div>
            <div className="space-y-3">
              {loginHistory.map((login, idx) => (
                <div key={idx} className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} flex justify-between items-center`}>
                  <div className="flex items-center gap-3">
                    <FaDesktop className="text-gray-400" />
                    <div>
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{login.device || 'Unknown Device'}</p>
                      <p className="text-xs text-gray-500">{login.location} • {login.ip}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{new Date(login.time).toLocaleString('id-ID')}</p>
                </div>
              ))}
              {loginHistory.length === 0 && <p className="text-center text-gray-500">Belum ada riwayat login</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className={`rounded-2xl p-6 w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Ganti Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <input type="password" placeholder="Password Lama" value={passwordData.oldPassword} onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})} className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} required />
                <input type="password" placeholder="Password Baru (min 6 karakter)" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} required />
                <input type="password" placeholder="Konfirmasi Password Baru" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} required />
                {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 rounded-xl">Batal</button>
                  <button type="submit" className="flex-1 py-2 bg-blue-500 text-white rounded-xl">Simpan</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;