import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaServer, FaChartLine, FaShieldAlt } from 'react-icons/fa';
import { UserContext } from '../App';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [serverStatus, setServerStatus] = useState('checking');
  const [loginStats, setLoginStats] = useState({ totalLogins: 0, todayLogins: 0 });
  const { login, setCurrentPage } = useContext(UserContext);

  useEffect(() => {
    checkServerStatus();
    fetchLoginStats();
  }, []);

  const checkServerStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/');
      if (res.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (err) {
      setServerStatus('offline');
    }
  };

  const fetchLoginStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/login-stats');
      if (res.ok) {
        const data = await res.json();
        setLoginStats(data);
      }
    } catch (err) {
      console.error('Gagal fetch stats');
      // Set default jika endpoint belum ada
      setLoginStats({ totalLogins: 0, todayLogins: 0 });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      setError('');
    } else {
      setError('Username atau password salah!');
    }
  };

  const quickLogin = (roleUsername, rolePassword) => {
    setUsername(roleUsername);
    setPassword(rolePassword);
    // Submit otomatis setelah set state
    setTimeout(async () => {
      const success = await login(roleUsername, rolePassword);
      if (success) {
        setError('');
      } else {
        setError('Username atau password salah!');
      }
    }, 50);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 flex items-center justify-center p-6"
    >
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg mb-4">
            <FaShieldAlt className="text-white text-3xl" />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
            JSMS HSSE
          </h1>
          <p className="text-white/70 text-sm mt-1">Job Safety Management System</p>
        </div>

        {/* Server Status */}
        <div className="flex justify-between items-center mb-6 px-2">
          <div className="flex items-center gap-2">
            <FaServer className={`text-xs ${serverStatus === 'online' ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-xs text-white/60">
              Server: {serverStatus === 'online' ? 'Online' : serverStatus === 'checking' ? 'Checking...' : 'Offline'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FaChartLine className="text-xs text-white/60" />
            <span className="text-xs text-white/60">
              {loginStats.totalLogins} login • {loginStats.todayLogins} hari ini
            </span>
          </div>
        </div>

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all outline-none"
              placeholder="Username"
              required
            />
          </div>
          
          <div className="relative">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all outline-none"
              placeholder="Password"
              required
            />
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm text-center"
            >
              {error}
            </motion.div>
          )}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
          >
            Masuk ke Sistem
          </motion.button>
        </form>

        {/* Quick Login Buttons */}
        <div className="mt-6">
          <p className="text-xs text-white/50 text-center mb-3">Login Cepat (Demo)</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => quickLogin('admin', 'admin')}
              className="px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white/80 text-xs hover:bg-white/10 transition cursor-pointer"
            >
              👑 Admin
            </button>
            <button
              onClick={() => quickLogin('sup', 'sup')}
              className="px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white/80 text-xs hover:bg-white/10 transition cursor-pointer"
            >
              👔 Supervisor
            </button>
            <button
              onClick={() => quickLogin('kary', 'kary')}
              className="px-3 py-2 bg-white/5 border border-white/20 rounded-xl text-white/80 text-xs hover:bg-white/10 transition cursor-pointer"
            >
              👷 Karyawan
            </button>
          </div>
        </div>

        {/* Informasi Akun Demo (alternatif) */}
        <div className="mt-6 p-3 bg-white/5 border border-white/10 rounded-xl text-center">
          <p className="text-xs text-white/40 mb-1">Akun Demo:</p>
          <div className="flex justify-center gap-3 text-[10px] text-white/30">
            <span>admin / admin</span>
            <span>sup / sup</span>
            <span>kary / kary</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/10 text-center">
          <p className="text-white/30 text-xs">© 2025 PT. Elefante Infradigi Solusi</p>
          <p className="text-white/20 text-[10px] mt-1">Versi 2.0.0 | Build 2025.05</p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginPage;