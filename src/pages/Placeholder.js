// src/components/Placeholder.js
import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaInbox, FaExclamationTriangle, FaSync, FaRobot, FaLightbulb,
  FaPlus, FaSearch, FaFilter, FaClock, FaChartLine, FaBell,
  FaHardHat, FaEye, FaHeartbeat, FaFire, FaGraduationCap,
  FaArrowRight, FaCheckCircle, FaSpinner, FaWifi, FaDatabase
} from 'react-icons/fa';
import { UserContext } from '../App';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const Placeholder = ({ 
  title = 'Coming Soon',
  type = 'empty', // empty, loading, error, offline, maintenance
  icon = null,
  message = null,
  suggestion = null,
  actionLabel = null,
  onAction = null,
  retryFn = null,
  module = 'general'
}) => {
  const { darkMode, session } = useContext(UserContext);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showAnimation, setShowAnimation] = useState(true);

  // Module-specific icons and suggestions
  const moduleConfig = {
    apd: { icon: FaHardHat, color: 'from-blue-500 to-cyan-500', suggestion: 'Belum ada data APD. Mulai dengan menambahkan alat pelindung diri.' },
    observasi: { icon: FaEye, color: 'from-cyan-500 to-teal-500', suggestion: 'Belum ada observasi. Lakukan observasi keselamatan hari ini!' },
    nearmiss: { icon: FaExclamationTriangle, color: 'from-yellow-500 to-orange-500', suggestion: 'Laporkan near miss untuk mencegah kecelakaan.' },
    medical: { icon: FaHeartbeat, color: 'from-red-500 to-pink-500', suggestion: 'Belum ada kasus medis. Tetap jaga kesehatan!' },
    emergency: { icon: FaFire, color: 'from-red-600 to-orange-600', suggestion: 'Sistem darurat siap. Tekan tombol merah jika terjadi keadaan darurat.' },
    training: { icon: FaGraduationCap, color: 'from-purple-500 to-indigo-500', suggestion: 'Belum ada pelatihan terdaftar. Daftar sekarang!' },
    dashboard: { icon: FaChartLine, color: 'from-green-500 to-emerald-500', suggestion: 'Data dashboard sedang dimuat. Silakan tunggu sebentar.' },
    notification: { icon: FaBell, color: 'from-pink-500 to-rose-500', suggestion: 'Tidak ada notifikasi baru. Semua aman!' },
    general: { icon: FaInbox, color: 'from-gray-500 to-gray-600', suggestion: 'Data belum tersedia. Silakan coba lagi nanti.' }
  };

  const config = moduleConfig[module] || moduleConfig.general;
  const IconComponent = icon ? () => icon : config.icon;
  const displayIcon = icon || <config.icon />;

  // Generate AI suggestion based on module and user data
  const generateAISuggestion = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/ai/suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          module, 
          userId: session?.userId,
          type,
          retryCount
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data.suggestion);
      } else {
        // Fallback suggestions
        const fallbackSuggestions = {
          empty: `💡 ${suggestion || config.suggestion} ${actionLabel ? `Klik "${actionLabel}" untuk memulai.` : ''}`,
          loading: '⏳ Data sedang dimuat. Ini biasanya memakan waktu beberapa detik.',
          error: '⚠️ Terjadi kesalahan. Periksa koneksi internet atau coba lagi nanti.',
          offline: '📡 Anda sedang offline. Data akan muncul saat koneksi kembali.',
          maintenance: '🔧 Sistem sedang dalam pemeliharaan. Kami akan kembali segera.'
        };
        setAiSuggestion(fallbackSuggestions[type] || fallbackSuggestions.empty);
      }
    } catch (err) {
      console.error('AI suggestion failed:', err);
      setAiSuggestion(message || config.suggestion);
    }
  };

  // Auto retry logic
  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    if (retryFn) {
      try {
        await retryFn();
      } catch (err) {
        console.error('Retry failed:', err);
      }
    }
    
    // Simulate retry delay for animation
    setTimeout(() => {
      setIsRetrying(false);
    }, 1500);
  };

  // Simulate shimmer animation on loading
  useEffect(() => {
    if (type === 'loading') {
      const timer = setInterval(() => {
        setShowAnimation(prev => !prev);
      }, 800);
      return () => clearInterval(timer);
    }
  }, [type]);

  useEffect(() => {
    generateAISuggestion();
  }, [module, type]);

  // Shimmer skeleton for loading state
  if (type === 'loading') {
    return (
      <div className={`min-h-[400px] rounded-3xl p-8 ${darkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur`}>
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-1/3 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (type === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`min-h-[400px] rounded-3xl p-8 text-center ${darkMode ? 'bg-gray-800/80' : 'bg-white/90'} backdrop-blur shadow-xl border ${darkMode ? 'border-red-900/30' : 'border-red-100'}`}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-6">
          <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <FaExclamationTriangle className="text-white text-4xl" />
          </div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {title || 'Terjadi Kesalahan'}
          </h2>
          <p className={`text-gray-600 dark:text-gray-400 max-w-md`}>
            {message || 'Gagal memuat data. Periksa koneksi internet Anda.'}
          </p>
          
          {/* AI Suggestion */}
          {aiSuggestion && (
            <div className={`max-w-md p-4 rounded-xl ${darkMode ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}>
              <div className="flex items-start gap-3">
                <FaRobot className="text-purple-500 text-xl mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">AI Suggestion</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{aiSuggestion}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-4 flex-wrap justify-center">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className={`px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 ${isRetrying ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isRetrying ? <FaSpinner className="animate-spin" /> : <FaSync />}
              {isRetrying ? 'Mencoba...' : 'Coba Lagi'}
            </button>
            {onAction && (
              <button
                onClick={onAction}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                {actionLabel || 'Kembali'}
              </button>
            )}
          </div>
          
          {retryCount > 0 && (
            <p className="text-xs text-gray-400">Percobaan ke-{retryCount}. Hubungi admin jika terus gagal.</p>
          )}
        </div>
      </motion.div>
    );
  }

  // Offline state
  if (type === 'offline') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`min-h-[400px] rounded-3xl p-8 text-center ${darkMode ? 'bg-gray-800/80' : 'bg-white/90'} backdrop-blur shadow-xl`}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-6">
          <div className="w-24 h-24 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center">
            <FaWifi className="text-white text-4xl" />
          </div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Anda Offline
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Periksa koneksi internet Anda. Data akan muncul saat online.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold flex items-center gap-2"
          >
            <FaSync /> Coba Lagi
          </button>
        </div>
      </motion.div>
    );
  }

  // Maintenance state
  if (type === 'maintenance') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`min-h-[400px] rounded-3xl p-8 text-center ${darkMode ? 'bg-gray-800/80' : 'bg-white/90'} backdrop-blur shadow-xl`}
      >
        <div className="flex flex-col items-center justify-center h-full space-y-6">
          <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center animate-bounce">
            <FaDatabase className="text-white text-4xl" />
          </div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Sedang Dalam Pemeliharaan
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            {message || 'Kami sedang meningkatkan sistem. Akan kembali dalam beberapa menit.'}
          </p>
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse delay-150"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse delay-300"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Empty state (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-3xl p-8 lg:p-12 text-center ${darkMode ? 'bg-gray-800/80' : 'bg-white/90'} backdrop-blur shadow-xl border ${darkMode ? 'border-gray-700' : 'border-white/50'}`}
    >
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Animated Icon */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2
          }}
          className={`w-28 h-28 bg-gradient-to-r ${config.color} rounded-3xl flex items-center justify-center shadow-2xl`}
        >
          <span className="text-white text-5xl">{displayIcon}</span>
        </motion.div>

        {/* Title */}
        <h1 className={`text-3xl lg:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {title}
        </h1>

        {/* Message */}
        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-md`}>
          {message || config.suggestion}
        </p>

        {/* AI Smart Suggestion */}
        {aiSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`max-w-md p-4 rounded-xl ${darkMode ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'}`}
          >
            <div className="flex items-start gap-3">
              <FaRobot className="text-purple-500 text-xl mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">🤖 AI Smart Assistant</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{aiSuggestion}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-4 flex-wrap justify-center pt-4">
          {actionLabel && onAction && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAction}
              className={`px-8 py-3 bg-gradient-to-r ${config.color} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2`}
            >
              {actionLabel}
              <FaArrowRight />
            </motion.button>
          )}
          
          {retryFn && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 transition flex items-center gap-2"
            >
              {isRetrying ? <FaSpinner className="animate-spin" /> : <FaSync />}
              Refresh
            </motion.button>
          )}
        </div>

        {/* Module-specific tips */}
        <div className="pt-6 mt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <FaLightbulb className="text-yellow-500" />
            {module === 'apd' && 'Tips: Pastikan APD selalu tersedia dan dalam kondisi baik'}
            {module === 'observasi' && 'Tips: Lakukan observasi minimal 1x per shift'}
            {module === 'nearmiss' && 'Tips: Setiap near miss adalah kesempatan untuk mencegah kecelakaan'}
            {module === 'medical' && 'Tips: Selalu siapkan P3K di area kerja'}
            {module === 'training' && 'Tips: Ikuti training refresher setiap 6 bulan'}
            {module === 'emergency' && 'Tips: Hafalkan rute evakuasi terdekat'}
            {!module && 'Tips: Hubungi admin jika membutuhkan bantuan'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// Shimmer Skeleton Component (untuk digunakan terpisah)
export const ShimmerSkeleton = ({ rows = 4, cards = 3 }) => {
  const { darkMode } = useContext(UserContext);
  
  return (
    <div className="animate-pulse">
      <div className={`h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/4 mb-6`}></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(cards)].map((_, i) => (
          <div key={i} className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className={`h-12 w-12 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-xl mb-4`}></div>
            <div className={`h-5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4 mb-3`}></div>
            {[...Array(rows)].map((_, j) => (
              <div key={j} className={`h-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-full mb-2`}></div>
            ))}
            <div className={`h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2 mt-4`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Error Boundary Fallback
export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const { darkMode } = useContext(UserContext);
  
  return (
    <div className={`min-h-[400px] rounded-3xl p-8 text-center ${darkMode ? 'bg-gray-800/80' : 'bg-white/90'} backdrop-blur`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="w-20 h-20 bg-red-500 rounded-2xl flex items-center justify-center">
          <FaExclamationTriangle className="text-white text-3xl" />
        </div>
        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Terjadi Kesalahan</h2>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error?.message || 'Something went wrong'}</p>
        <button onClick={resetErrorBoundary} className="px-5 py-2 bg-orange-500 text-white rounded-lg font-semibold">
          Coba Lagi
        </button>
      </div>
    </div>
  );
};

export default Placeholder;