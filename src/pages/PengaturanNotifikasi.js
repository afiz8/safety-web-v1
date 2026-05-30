// src/pages/PengaturanNotifikasi.js
import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBell, FaWhatsapp, FaEnvelope, FaDesktop, FaMobileAlt,
  FaToggleOn, FaToggleOff, FaSlidersH, FaRobot, FaFilter,
  FaClock, FaMoon, FaSun, FaSave, FaSync, FaTrash,
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle,
  FaChartLine, FaHardHat, FaEye, FaHeartbeat, FaFire,
  FaUser, FaBuilding, FaCog, FaShieldAlt
} from 'react-icons/fa';
import { UserContext } from '../App';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const PengaturanNotifikasi = () => {
  const { session, darkMode, toggleDarkMode, notifications, setNotifications } = useContext(UserContext);
  
  // ==================== STATE ====================
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [waNumber, setWaNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  
  // Channel settings
  const [channels, setChannels] = useState({
    whatsapp: { enabled: true, primaryNumber: '' },
    email: { enabled: false, address: '' },
    push: { enabled: true, desktop: true, mobile: true },
    sound: { enabled: true, volume: 70, customSound: false }
  });
  
  // Category settings
  const [categories, setCategories] = useState([
    { id: 'apd', name: 'APD', icon: 'FaHardHat', color: 'blue', enabled: true, priority: 'high', sound: true, whatsapp: false, email: false },
    { id: 'observasi', name: 'Observasi', icon: 'FaEye', color: 'cyan', enabled: true, priority: 'medium', sound: true, whatsapp: false, email: false },
    { id: 'nearmiss', name: 'Near Miss', icon: 'FaExclamationTriangle', color: 'yellow', enabled: true, priority: 'high', sound: true, whatsapp: true, email: false },
    { id: 'medical', name: 'Medical', icon: 'FaHeartbeat', color: 'red', enabled: true, priority: 'high', sound: true, whatsapp: true, email: true },
    { id: 'emergency', name: 'Emergency', icon: 'FaFire', color: 'red', enabled: true, priority: 'critical', sound: true, whatsapp: true, email: true },
    { id: 'training', name: 'Pelatihan', icon: 'FaUser', color: 'green', enabled: true, priority: 'medium', sound: false, whatsapp: false, email: false },
    { id: 'safety', name: 'Safety Moment', icon: 'FaShieldAlt', color: 'teal', enabled: true, priority: 'low', sound: false, whatsapp: false, email: false },
    { id: 'system', name: 'Sistem', icon: 'FaCog', color: 'gray', enabled: true, priority: 'low', sound: false, whatsapp: false, email: false }
  ]);
  
  // AI Filter settings
  const [aiSettings, setAiSettings] = useState({
    enabled: true,
    filterSpam: true,
    smartGrouping: true,
    priorityDetection: true,
    autoMute: false,
    autoMuteStart: '20:00',
    autoMuteEnd: '06:00'
  });
  
  // Schedule settings
  const [schedule, setSchedule] = useState({
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
    daysOff: ['saturday', 'sunday']
  });
  
  // Notification history
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    unread: 0,
    byCategory: {}
  });

  const role = session?.role;
  const isAdmin = role === 'Admin';

  // ==================== LOAD DATA ====================
  useEffect(() => {
    loadSettings();
    loadNotificationHistory();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/notification-settings/${session?.userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.waNumber) setWaNumber(data.waNumber);
        if (data.emailAddress) setEmailAddress(data.emailAddress);
        if (data.channels) setChannels(data.channels);
        if (data.categories) setCategories(data.categories);
        if (data.aiSettings) setAiSettings(data.aiSettings);
        if (data.schedule) setSchedule(data.schedule);
      }
    } catch (err) {
      console.error('Gagal load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/history/${session?.userId}?limit=20`);
      if (res.ok) {
        const data = await res.json();
        const historyData = data.data || data;
        setNotificationHistory(historyData);
        
        const today = new Date().toDateString();
        const todayNotifs = historyData.filter(n => new Date(n.createdAt).toDateString() === today);
        setStats({
          totalToday: todayNotifs.length,
          unread: historyData.filter(n => !n.isRead).length,
          byCategory: historyData.reduce((acc, n) => {
            acc[n.category] = (acc[n.category] || 0) + 1;
            return acc;
          }, {})
        });
      }
    } catch (err) {
      console.error('Gagal load history:', err);
    }
  };

  // ==================== SAVE SETTINGS ====================
  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/notification-settings/${session?.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waNumber,
          emailAddress,
          channels,
          categories,
          aiSettings,
          schedule
        })
      });
      if (res.ok) {
        alert('✅ Pengaturan berhasil disimpan!');
      }
    } catch (err) {
      console.error('Gagal simpan:', err);
      alert('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const testNotification = async (channel) => {
    try {
      await fetch(`${API_BASE}/api/notifications/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.userId,
          channel,
          waNumber,
          email: emailAddress
        })
      });
      alert(`📨 Test notifikasi dikirim via ${channel.toUpperCase()}`);
    } catch (err) {
      console.error('Test failed:', err);
    }
  };

  const updateCategory = (id, field, value) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, [field]: value } : cat
    ));
  };

  const clearHistory = async () => {
    if (window.confirm('Hapus semua riwayat notifikasi?')) {
      try {
        await fetch(`${API_BASE}/api/notifications/history/${session?.userId}`, { method: 'DELETE' });
        setNotificationHistory([]);
        alert('Riwayat berhasil dihapus');
      } catch (err) {
        console.error('Gagal hapus:', err);
      }
    }
  };

  // Priority badge component
  const PriorityBadge = ({ priority }) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-black',
      low: 'bg-gray-400 text-white'
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[priority] || colors.medium}`}>
        {priority?.toUpperCase() || 'MEDIUM'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto p-6 lg:p-8">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <FaBell className="text-white text-2xl" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Pengaturan Notifikasi
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Kelola semua notifikasi dari seluruh modul
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleDarkMode} className={`p-2.5 rounded-xl ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600'} shadow`}>
              {darkMode ? <FaSun /> : <FaMoon />}
            </button>
            <button onClick={saveSettings} disabled={saving} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow hover:shadow-lg transition">
              {saving ? <FaSync className="animate-spin" /> : <FaSave />}
              Simpan
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className={`rounded-2xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <FaBell className="text-blue-500 text-2xl mb-2" />
            <p className="text-2xl font-bold">{stats.totalToday}</p>
            <p className="text-xs text-gray-500">Hari Ini</p>
          </div>
          <div className={`rounded-2xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <FaEnvelope className="text-red-500 text-2xl mb-2" />
            <p className="text-2xl font-bold">{stats.unread}</p>
            <p className="text-xs text-gray-500">Belum Dibaca</p>
          </div>
          <div className={`rounded-2xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <FaRobot className="text-purple-500 text-2xl mb-2" />
            <p className="text-2xl font-bold">{aiSettings.enabled ? 'ON' : 'OFF'}</p>
            <p className="text-xs text-gray-500">AI Filter</p>
          </div>
          <div className={`rounded-2xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <FaWhatsapp className="text-green-500 text-2xl mb-2" />
            <p className="text-sm font-bold truncate">{waNumber || 'Belum diset'}</p>
            <p className="text-xs text-gray-500">WhatsApp</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* KIRI: Channel Settings */}
          <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
              <FaCog /> Channel Notifikasi
            </h2>
            
            {/* WhatsApp */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <FaWhatsapp className="text-green-500 text-xl" />
                  <span className="font-semibold">WhatsApp</span>
                </div>
                <button onClick={() => setChannels({...channels, whatsapp: {...channels.whatsapp, enabled: !channels.whatsapp.enabled}})}>
                  {channels.whatsapp.enabled ? <FaToggleOn className="text-green-500 text-3xl" /> : <FaToggleOff className="text-gray-400 text-3xl" />}
                </button>
              </div>
              {channels.whatsapp.enabled && (
                <div className="space-y-2">
                  <input type="tel" value={waNumber} onChange={e => setWaNumber(e.target.value)} placeholder="Contoh: 6281389296287" className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                  <button onClick={() => testNotification('whatsapp')} className="text-sm text-blue-500">Test Kirim →</button>
                </div>
              )}
            </div>
            
            {/* Email */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2"><FaEnvelope className="text-blue-500 text-xl" /><span className="font-semibold">Email</span></div>
                <button onClick={() => setChannels({...channels, email: {...channels.email, enabled: !channels.email.enabled}})}>
                  {channels.email.enabled ? <FaToggleOn className="text-green-500 text-3xl" /> : <FaToggleOff className="text-gray-400 text-3xl" />}
                </button>
              </div>
              {channels.email.enabled && (
                <div className="space-y-2">
                  <input type="email" value={emailAddress} onChange={e => setEmailAddress(e.target.value)} placeholder="admin@perusahaan.com" className={`w-full p-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                  <button onClick={() => testNotification('email')} className="text-sm text-blue-500">Test Kirim →</button>
                </div>
              )}
            </div>
            
            {/* Sound */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2"><FaDesktop className="text-purple-500 text-xl" /><span className="font-semibold">Suara</span></div>
                <button onClick={() => setChannels({...channels, sound: {...channels.sound, enabled: !channels.sound.enabled}})}>
                  {channels.sound.enabled ? <FaToggleOn className="text-green-500 text-3xl" /> : <FaToggleOff className="text-gray-400 text-3xl" />}
                </button>
              </div>
              {channels.sound.enabled && (
                <div>
                  <input type="range" min="0" max="100" value={channels.sound.volume} onChange={e => setChannels({...channels, sound: {...channels.sound, volume: parseInt(e.target.value)}})} className="w-full" />
                  <p className="text-xs text-gray-500 text-center">Volume: {channels.sound.volume}%</p>
                </div>
              )}
            </div>
          </div>

          {/* TENGAH: Category Settings */}
          <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow lg:col-span-2`}>
            <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
              <FaFilter /> Kategori & Prioritas
            </h2>
            <div className="space-y-4">
              {categories.map(cat => (
                <div key={cat.id} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 bg-${cat.color}-100 rounded-lg flex items-center justify-center`}>
                        {cat.id === 'apd' && <FaHardHat className={`text-${cat.color}-600`} />}
                        {cat.id === 'observasi' && <FaEye className={`text-${cat.color}-600`} />}
                        {cat.id === 'nearmiss' && <FaExclamationTriangle className={`text-${cat.color}-600`} />}
                        {cat.id === 'medical' && <FaHeartbeat className={`text-${cat.color}-600`} />}
                        {cat.id === 'emergency' && <FaFire className={`text-${cat.color}-600`} />}
                        {cat.id === 'training' && <FaUser className={`text-${cat.color}-600`} />}
                        {cat.id === 'safety' && <FaShieldAlt className={`text-${cat.color}-600`} />}
                        {cat.id === 'system' && <FaCog className={`text-${cat.color}-600`} />}
                      </div>
                      <div>
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{cat.name}</p>
                        <PriorityBadge priority={cat.priority} />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button onClick={() => updateCategory(cat.id, 'enabled', !cat.enabled)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${cat.enabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'}`}>
                        {cat.enabled ? 'ON' : 'OFF'}
                      </button>
                      <select value={cat.priority} onChange={e => updateCategory(cat.id, 'priority', e.target.value)} className={`px-2 py-1.5 rounded-lg text-sm border ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <button onClick={() => updateCategory(cat.id, 'whatsapp', !cat.whatsapp)} className={`px-2 py-1.5 rounded-lg text-xs ${cat.whatsapp ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>WA</button>
                      <button onClick={() => updateCategory(cat.id, 'email', !cat.email)} className={`px-2 py-1.5 rounded-lg text-xs ${cat.email ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>Email</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM: AI Settings + Schedule + History */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          
          {/* AI Settings */}
          <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <FaRobot className="text-purple-500" /> AI Smart Filter
            </h2>
            <div className="space-y-3">
              {[
                { key: 'enabled', label: 'Aktifkan AI Filter', icon: FaRobot },
                { key: 'filterSpam', label: 'Filter Notifikasi Spam', icon: FaFilter },
                { key: 'smartGrouping', label: 'Smart Grouping (Gabung notif serupa)', icon: FaSlidersH },
                { key: 'priorityDetection', label: 'Deteksi Prioritas Otomatis', icon: FaExclamationTriangle },
                { key: 'autoMute', label: 'Auto Mute (Jadwal)', icon: FaMoon }
              ].map(setting => (
                <div key={setting.key} className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-2"><setting.icon /> <span>{setting.label}</span></div>
                  <button onClick={() => setAiSettings({...aiSettings, [setting.key]: !aiSettings[setting.key]})}>
                    {aiSettings[setting.key] ? <FaToggleOn className="text-green-500 text-2xl" /> : <FaToggleOff className="text-gray-400 text-2xl" />}
                  </button>
                </div>
              ))}
            </div>
            {aiSettings.autoMute && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl flex gap-3">
                <input type="time" value={aiSettings.autoMuteStart} onChange={e => setAiSettings({...aiSettings, autoMuteStart: e.target.value})} className="px-3 py-2 rounded-lg border" />
                <span>sd</span>
                <input type="time" value={aiSettings.autoMuteEnd} onChange={e => setAiSettings({...aiSettings, autoMuteEnd: e.target.value})} className="px-3 py-2 rounded-lg border" />
              </div>
            )}
          </div>
          
          {/* Jadwal & History */}
          <div className={`rounded-2xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📅 Jadwal & Riwayat</h2>
            
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Mode Do Not Disturb</span>
              <button onClick={() => setSchedule({...schedule, enabled: !schedule.enabled})}>
                {schedule.enabled ? <FaToggleOn className="text-green-500 text-2xl" /> : <FaToggleOff className="text-gray-400 text-2xl" />}
              </button>
            </div>
            
            {schedule.enabled && (
              <div className="space-y-2 mb-4">
                <div className="flex gap-2">
                  <input type="time" value={schedule.startTime} onChange={e => setSchedule({...schedule, startTime: e.target.value})} className="px-3 py-2 rounded-lg border flex-1" />
                  <span>sd</span>
                  <input type="time" value={schedule.endTime} onChange={e => setSchedule({...schedule, endTime: e.target.value})} className="px-3 py-2 rounded-lg border flex-1" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-sm">Hari libur notif:</span>
                  {['senin','selasa','rabu','kamis','jumat','sabtu','minggu'].map(day => (
                    <button key={day} onClick={() => setSchedule({...schedule, daysOff: schedule.daysOff.includes(day) ? schedule.daysOff.filter(d => d !== day) : [...schedule.daysOff, day]})} className={`px-2 py-1 rounded text-xs ${schedule.daysOff.includes(day) ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>
                      {day.slice(0,3)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="border-t pt-4 mt-2">
              <div className="flex justify-between items-center mb-3">
                <span className="font-semibold">Riwayat Notifikasi ({notificationHistory.length})</span>
                <button onClick={clearHistory} className="text-red-500 text-sm flex items-center gap-1"><FaTrash /> Hapus</button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notificationHistory.slice(0,5).map(notif => (
                  <div key={notif._id} className={`p-2 rounded-lg text-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex justify-between">
                      <span className="font-medium">{notif.title}</span>
                      <span className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{notif.message}</p>
                  </div>
                ))}
                {notificationHistory.length === 0 && <p className="text-center text-gray-500 text-sm">Belum ada riwayat</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PengaturanNotifikasi;