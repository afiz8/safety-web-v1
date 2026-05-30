import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle,
  FaTrash, FaCheckDouble, FaThumbtack, FaFilter,
  FaMoon, FaSun, FaTimes, FaEye, FaEyeSlash, FaExternalLinkAlt
} from 'react-icons/fa';
import { UserContext } from '../App';

const NotificationsPage = () => {
  const { session, darkMode, toggleDarkMode } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [mutedCategories, setMutedCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const API_BASE = 'http://localhost:5000';
  const userId = session?.userId || 'anonymous';
  const role = session?.role || 'Karyawan';

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications?userId=${userId}&role=${role}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Gagal fetch notifikasi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const savedMuted = localStorage.getItem('jsms_muted_categories');
    if (savedMuted) setMutedCategories(JSON.parse(savedMuted));
  }, []);

  // Simulasi real-time (polling setiap 10 detik)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const updateNotification = async (id, updates) => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        await fetchNotifications();
      }
    } catch (err) {
      console.error('Gagal update:', err);
    }
  };

  const markRead = (id) => {
    updateNotification(id, { read: true });
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      await fetchNotifications();
    } catch (err) {
      console.error('Gagal mark all read:', err);
    }
  };

  const togglePin = (id, currentPinned) => {
    updateNotification(id, { pinned: !currentPinned });
  };

  const deleteNotification = async (id) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${id}`, { method: 'DELETE' });
      await fetchNotifications();
    } catch (err) {
      console.error('Gagal hapus:', err);
    }
  };

  const deleteAll = async () => {
    if (window.confirm('Hapus semua notifikasi?')) {
      try {
        await fetch(`${API_BASE}/api/notifications?userId=${userId}`, { method: 'DELETE' });
        await fetchNotifications();
      } catch (err) {
        console.error('Gagal hapus semua:', err);
      }
    }
  };

  const toggleMuteCategory = (category) => {
    let newMuted;
    if (mutedCategories.includes(category)) {
      newMuted = mutedCategories.filter(c => c !== category);
    } else {
      newMuted = [...mutedCategories, category];
    }
    setMutedCategories(newMuted);
    localStorage.setItem('jsms_muted_categories', JSON.stringify(newMuted));
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) markRead(notif._id);
    if (notif.link) {
      window.location.href = notif.link;
    }
  };

  const getIconByType = (type) => {
    switch(type) {
      case 'expiry': return <FaExclamationTriangle className="text-yellow-500" />;
      case 'violation': return <FaExclamationTriangle className="text-red-500" />;
      case 'success': return <FaCheckCircle className="text-green-500" />;
      default: return <FaInfoCircle className="text-blue-500" />;
    }
  };

  // Filter notifikasi
  let filteredNotifs = notifications;
  if (filter === 'unread') {
    filteredNotifs = filteredNotifs.filter(n => !n.read);
  } else if (filter === 'pinned') {
    filteredNotifs = filteredNotifs.filter(n => n.pinned);
  }
  // Mute categories
  filteredNotifs = filteredNotifs.filter(n => !mutedCategories.includes(n.category));

  // Urutkan: pinned di atas, lalu berdasarkan tanggal
  filteredNotifs.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const pinnedCount = notifications.filter(n => n.pinned).length;
  const categories = ['APD', 'Kontrak', 'Kontraktor', 'Insiden', 'NearMiss', 'JSA', 'Umum'];

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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FaBell className="text-4xl text-orange-500" />
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Notifikasi
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {unreadCount} belum dibaca • {pinnedCount} disematkan
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className={`p-2 rounded-full transition ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-full transition ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <FaFilter />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`rounded-2xl p-4 shadow-sm ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}
            >
              <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Mute Kategori</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => toggleMuteCategory(cat)}
                    className={`px-3 py-1 rounded-full text-sm transition ${mutedCategories.includes(cat) ? 'bg-red-500 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`}
                  >
                    {mutedCategories.includes(cat) ? <FaEyeSlash className="inline mr-1" /> : <FaEye className="inline mr-1" />}
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full transition ${filter === 'all' ? 'bg-orange-500 text-white shadow-md' : (darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600')}`}>
            Semua ({notifications.length})
          </button>
          <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-full transition ${filter === 'unread' ? 'bg-orange-500 text-white shadow-md' : (darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600')}`}>
            Belum Dibaca ({unreadCount})
          </button>
          <button onClick={() => setFilter('pinned')} className={`px-4 py-2 rounded-full transition ${filter === 'pinned' ? 'bg-orange-500 text-white shadow-md' : (darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600')}`}>
            Disematkan ({pinnedCount})
          </button>
          <button onClick={markAllRead} className="px-4 py-2 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition flex items-center gap-2">
            <FaCheckDouble /> Tandai Semua Dibaca
          </button>
          <button onClick={deleteAll} className="px-4 py-2 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition flex items-center gap-2">
            <FaTrash /> Hapus Semua
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifs.length === 0 ? (
            <div className={`text-center py-16 rounded-2xl ${darkMode ? 'bg-gray-800/60' : 'bg-white/60'} backdrop-blur`}>
              <div className="text-6xl mb-4">📭</div>
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tidak ada notifikasi</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Semua notifikasi sudah dibaca</p>
            </div>
          ) : (
            filteredNotifs.map((notif, idx) => (
              <motion.div
                key={notif._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer ${
                  notif.read 
                    ? (darkMode ? 'bg-gray-800/60 border border-gray-700' : 'bg-white/60 backdrop-blur')
                    : (darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-l-4 border-l-orange-500' : 'bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-l-orange-500')
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">{getIconByType(notif.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            notif.category === 'APD' ? 'bg-blue-100 text-blue-700' :
                            notif.category === 'Kontrak' ? 'bg-purple-100 text-purple-700' :
                            notif.category === 'Insiden' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {notif.category}
                          </span>
                          {notif.pinned && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">📌 Disematkan</span>}
                          {!notif.read && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full animate-pulse">Baru</span>}
                        </div>
                        <p className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} text-sm`}>{notif.message}</p>
                        <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(notif.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePin(notif._id, notif.pinned); }}
                        className={`p-2 rounded-lg transition ${notif.pinned ? 'text-yellow-500' : (darkMode ? 'text-gray-500 hover:text-yellow-500' : 'text-gray-400 hover:text-yellow-500')}`}
                      >
                        <FaThumbtack />
                      </button>
                      {!notif.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markRead(notif._id); }}
                          className={`p-2 rounded-lg transition ${darkMode ? 'text-gray-500 hover:text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                        >
                          <FaCheckCircle />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                        className={`p-2 rounded-lg transition ${darkMode ? 'text-gray-500 hover:text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                  {notif.link && (
                    <div className="mt-3 text-right">
                      <span className="text-xs text-blue-500 flex items-center justify-end gap-1">
                        <FaExternalLinkAlt size={10} /> Klik untuk lihat detail
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;