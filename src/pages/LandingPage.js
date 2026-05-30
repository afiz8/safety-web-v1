import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaArrowRight, FaCheckCircle, FaShieldAlt, FaChartLine, 
  FaBell, FaMobileAlt, FaEnvelope, FaUser, FaBuilding, 
  FaPhone, FaTimes, FaSpinner, FaGlobe 
} from 'react-icons/fa';
import { UserContext } from '../App';

const LandingPage = () => {
  const { setCurrentPage } = useContext(UserContext);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: '', interest: 'demo', message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [stats, setStats] = useState({ totalVisitors: 0, totalNewsletter: 0 });
  const [emailSubscribe, setEmailSubscribe] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/landing-stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Gagal fetch stats:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', company: '', interest: 'demo', message: '' });
        setTimeout(() => {
          setShowModal(false);
          setSubmitStatus(null);
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (err) {
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!emailSubscribe) return;
    try {
      const res = await fetch('http://localhost:5000/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailSubscribe })
      });
      if (res.ok) {
        setSubscribeStatus('success');
        setEmailSubscribe('');
        setTimeout(() => setSubscribeStatus(null), 3000);
      } else {
        setSubscribeStatus('error');
      }
    } catch (err) {
      setSubscribeStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-orange-50/20 font-['Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif]">
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-lg font-bold text-white">E</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Elefante HSSE
              </h1>
              <p className="text-xs text-gray-500">PT. Elefante Infradigi Solusi</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentPage('/login')}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-2.5 px-6 rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm"
          >
            Masuk <FaArrowRight size={12} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
              <FaShieldAlt size={12} /> Solusi HSSE Terintegrasi
            </div>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
              Kelola Keselamatan Kerja{' '}
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Lebih Mudah
              </span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Sistem manajemen HSSE digital untuk perusahaan modern. Pantau KPI, kelola insiden, 
              dan pastikan kepatuhan standar keselamatan kerja dengan satu platform terintegrasi.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setShowModal(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                Demo Gratis <FaArrowRight size={14} />
              </button>
              <button
                onClick={() => setCurrentPage('/login')}
                className="border-2 border-gray-200 hover:border-orange-400 text-gray-700 font-semibold py-3 px-8 rounded-full hover:bg-orange-50 transition-all duration-300"
              >
                Lihat Fitur
              </button>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500" />
                <span className="text-sm text-gray-600">14+ Modul</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500" />
                <span className="text-sm text-gray-600">Real-time Dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500" />
                <span className="text-sm text-gray-600">98% Compliance</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/50">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: '📊', title: 'Dashboard Real-time', desc: 'Pantau KPI 24/7', color: 'from-emerald-500 to-emerald-600' },
                  { icon: '🚨', title: 'Peringatan Dini', desc: 'Notifikasi otomatis', color: 'from-red-500 to-red-600' },
                  { icon: '✅', title: 'Compliance', desc: 'Audit lengkap', color: 'from-blue-500 to-blue-600' },
                  { icon: '🛡️', title: 'Manajemen APD', desc: 'Tracking stok', color: 'from-purple-500 to-purple-600' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                    <div className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center mb-3`}>
                      <span className="text-xl">{item.icon}</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm">{item.title}</h4>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-6 bg-white/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">500+</p>
              <p className="text-sm text-gray-500">Perusahaan</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">50K+</p>
              <p className="text-sm text-gray-500">Pekerja Terdaftar</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalVisitors || 0}+</p>
              <p className="text-sm text-gray-500">Pengunjung</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalNewsletter || 0}+</p>
              <p className="text-sm text-gray-500">Subscriber</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Fitur Unggulan</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Solusi lengkap manajemen HSSE untuk perusahaan modern
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <FaChartLine className="text-2xl text-orange-500" />, title: 'Dashboard Dinamis', desc: 'Pantau KPI utama dengan grafik real-time, filter per site & project' },
            { icon: <FaBell className="text-2xl text-orange-500" />, title: 'Peringatan Dini', desc: 'Notifikasi APD kadaluarsa, insiden, dan compliance otomatis via WhatsApp & Email' },
            { icon: <FaMobileAlt className="text-2xl text-orange-500" />, title: 'Mobile Friendly', desc: 'Akses penuh dari HP, tablet, dan desktop dengan dark mode' }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100"
            >
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h4 className="text-lg font-bold text-gray-800 mb-2">{feature.title}</h4>
              <p className="text-gray-500 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-6 bg-gradient-to-r from-orange-500/5 to-orange-600/5">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Dapatkan Update Fitur Terbaru</h3>
          <p className="text-gray-600 mb-6">Berlangganan newsletter untuk informasi update dan tips keselamatan kerja</p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Email perusahaan"
              value={emailSubscribe}
              onChange={(e) => setEmailSubscribe(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none"
              required
            />
            <button type="submit" className="px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition shadow-md">
              Subscribe
            </button>
          </form>
          {subscribeStatus === 'success' && <p className="text-green-600 text-sm mt-2">✅ Berhasil subscribe!</p>}
          {subscribeStatus === 'error' && <p className="text-red-600 text-sm mt-2">❌ Gagal atau email sudah terdaftar</p>}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold">E</span>
                </div>
                <span className="font-bold">Elefante HSSE</span>
              </div>
              <p className="text-gray-400 text-sm">PT. Elefante Infradigi Solusi</p>
              <p className="text-gray-500 text-xs mt-2">© 2025. All rights reserved.</p>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Tentang</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Perusahaan</li>
                <li>Karir</li>
                <li>Kontak</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Layanan</h5>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Konsultasi HSSE</li>
                <li>Implementasi Sistem</li>
                <li>Pelatihan</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-3">Hubungi Kami</h5>
              <p className="text-sm text-gray-400">info@elefante.co.id</p>
              <p className="text-sm text-gray-400">(021) 1234 5678</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal Request Demo */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Request Demo</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300"
                      placeholder="Nama Anda"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300"
                      placeholder="email@perusahaan.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300"
                      placeholder="0812-3456-7890"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Perusahaan</label>
                  <div className="relative">
                    <FaBuilding className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300"
                      placeholder="Nama Perusahaan"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <FaSpinner className="animate-spin" /> : 'Kirim Request Demo'}
                </button>
                {submitStatus === 'success' && <p className="text-green-600 text-sm text-center">✅ Terima kasih! Kami akan segera menghubungi.</p>}
                {submitStatus === 'error' && <p className="text-red-600 text-sm text-center">❌ Gagal mengirim. Coba lagi.</p>}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;