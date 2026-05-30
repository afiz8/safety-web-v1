import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSignOutAlt, FaExclamationTriangle, FaSpinner, FaShieldAlt, FaMobileAlt } from 'react-icons/fa';
import { UserContext } from '../App';

const Logout = ({ onClose, onLogoutComplete }) => {
  const { session, setCurrentPage, logout: contextLogout } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({});

  const API_BASE = 'http://localhost:5000';

  useEffect(() => {
    // Get device info
    const getDeviceInfo = () => {
      const userAgent = navigator.userAgent;
      let platform = 'Unknown';
      let browser = 'Unknown';
      
      if (userAgent.includes('Windows')) platform = 'Windows';
      else if (userAgent.includes('Mac')) platform = 'Mac';
      else if (userAgent.includes('Android')) platform = 'Android';
      else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) platform = 'iOS';
      else if (userAgent.includes('Linux')) platform = 'Linux';
      
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      
      setDeviceInfo({
        userAgent,
        platform,
        browser,
        deviceId: localStorage.getItem('deviceId') || `device_${Date.now()}_${Math.random()}`
      });
    };
    
    getDeviceInfo();
  }, []);

  const handleLogout = async (allDevices = false) => {
    setLoading(true);
    
    const url = allDevices ? `${API_BASE}/api/logout-all` : `${API_BASE}/api/logout`;
    
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.userId,
          sessionToken: localStorage.getItem('sessionToken'),
          deviceInfo
        })
      });
      
      // Clear local storage
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('jsms_session');
      localStorage.removeItem('jsms_darkMode');
      
      // Call context logout
      contextLogout();
      
      // Small delay for animation
      setTimeout(() => {
        setLoading(false);
        if (onLogoutComplete) onLogoutComplete();
        else setCurrentPage('/');
      }, 500);
    } catch (err) {
      console.error('Logout error:', err);
      setLoading(false);
      alert('Gagal logout, coba lagi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaSignOutAlt className="text-red-500 text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Keluar dari Akun
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Apakah Anda yakin ingin keluar?
          </p>
        </div>

        {/* Informasi session aktif */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
            <FaMobileAlt className="text-blue-500" />
            <span>{deviceInfo.platform} · {deviceInfo.browser}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <FaShieldAlt className="text-green-500" />
            <span>Session aktif: 1 device</span>
          </div>
        </div>

        {/* Opsi logout dari semua device */}
        <button
          onClick={() => setShowAllDevices(!showAllDevices)}
          className="text-sm text-blue-600 dark:text-blue-400 mb-4 hover:underline flex items-center gap-1 mx-auto"
        >
          <FaShieldAlt size={12} />
          {showAllDevices ? 'Sembunyikan' : 'Logout dari semua device?'}
        </button>

        <AnimatePresence>
          {showAllDevices && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border-l-4 border-yellow-500">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ Logout dari semua device akan mengakhiri sesi Anda di perangkat lain (termasuk HP, tablet, komputer lain).
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tombol aksi */}
        <div className="flex gap-3">
          <button
            onClick={() => onClose ? onClose() : null}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={() => handleLogout(false)}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaSignOutAlt />}
            Keluar
          </button>
        </div>

        {showAllDevices && (
          <button
            onClick={() => handleLogout(true)}
            disabled={loading}
            className="w-full mt-3 py-2 px-4 bg-red-600/80 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
          >
            Logout dari SEMUA device
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default Logout;