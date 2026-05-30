import React, { useState, useEffect, useContext } from 'react';
import { FaGlobe, FaBullseye, FaRocket, FaCalendarAlt, FaUsers, FaHandshake, FaChartLine, FaEdit, FaSave, FaTimes, FaCrown, FaGem, FaStar, FaCheckCircle, FaArrowRight, FaQuoteLeft, FaTrophy, FaAward } from 'react-icons/fa';
import { UserContext } from '../App';

const GlobalStrategy = () => {
  const { session } = useContext(UserContext);
  const isAdmin = session?.role === 'Admin';
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Default data
  const defaultPillars = [
    { icon: 'FaBullseye', title: 'Akses Universal', desc: 'Pastikan semua pekerja memiliki akses ke sistem perlindungan K3 yang efektif, termasuk pekerja informal dan migran.', color: 'from-blue-500 to-blue-600' },
    { icon: 'FaHandshake', title: 'Kemitraan Global', desc: 'Bangun kemitraan internasional yang kuat antara pemerintah, organisasi pekerja, pengusaha, dan masyarakat sipil.', color: 'from-green-500 to-green-600' },
    { icon: 'FaChartLine', title: 'Pencegahan Berkelanjutan', desc: 'Terapkan pendekatan berbasis risiko dan pencegahan primer untuk mengurangi beban kecelakaan dan penyakit akibat kerja.', color: 'from-purple-500 to-purple-600' },
    { icon: 'FaUsers', title: 'Partisipasi & Dialog', desc: 'Dorong partisipasi aktif pekerja dan perwakilan mereka dalam pengambilan keputusan terkait K3.', color: 'from-orange-500 to-orange-600' }
  ];

  const defaultGoals = [
    { target: '2025', title: 'Pengurangan Kematian', desc: 'Mengurangi jumlah kematian akibat kecelakaan kerja sebesar 20%', progress: 65 },
    { target: '2025', title: 'Pengurangan Penyakit', desc: 'Mengurangi beban penyakit akibat kerja sebesar 15%', progress: 55 },
    { target: '2030', title: 'Akses Universal K3', desc: 'Semua pekerja terlindungi oleh sistem K3 yang memadai', progress: 40 },
    { target: '2030', title: 'Kultur Pencegahan', desc: 'Budaya pencegahan K3 menjadi norma di semua tempat kerja', progress: 45 }
  ];

  const defaultActions = [
    { phase: 'Jangka Pendek (2024-2025)', items: ['Ratifikasi konvensi ILO tambahan', 'Penguatan inspeksi kerja', 'Peningkatan data K3', 'Pelatihan manajer K3 massal'] },
    { phase: 'Jangka Menengah (2025-2028)', items: ['Integrasi K3 dalam pendidikan', 'Pengembangan teknologi K3', 'Kerja sama regional', 'Sertifikasi SMK3 universal'] },
    { phase: 'Jangka Panjang (2028-2030)', items: ['Mencapai Vision Zero', 'Sistem K3 berkelanjutan', 'Pembagian best practices global', 'Monitoring evaluasi berkala'] }
  ];

  const defaultSdg = [
    { sdg: '3.8', title: 'SDG 3.8', desc: 'Cakupan kesehatan universal termasuk perlindungan risiko keuangan', color: 'red' },
    { sdg: '8.8', title: 'SDG 8.8', desc: 'Melindungi hak pekerja dan keselamatan di tempat kerja', color: 'blue' },
    { sdg: '12.8', title: 'SDG 12.8', desc: 'Pola konsumsi dan produksi yang berkelanjutan', color: 'green' }
  ];

  const [pillars, setPillars] = useState(defaultPillars);
  const [goals, setGoals] = useState(defaultGoals);
  const [actions, setActions] = useState(defaultActions);
  const [sdg, setSdg] = useState(defaultSdg);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [editData, setEditData] = useState(null);
  const [saved, setSaved] = useState(false);

  const loadContent = async () => {
    setLoading(true);
    try {
      const sections = ['global_pillars', 'global_goals', 'global_actions', 'global_sdg'];
      for (const section of sections) {
        const res = await fetch(`${API_BASE}/api/site-content/global/${section}`);
        if (res.ok) {
          const result = await res.json();
          if (result.data) {
            if (section === 'global_pillars') setPillars(result.data);
            if (section === 'global_goals') setGoals(result.data);
            if (section === 'global_actions') setActions(result.data);
            if (section === 'global_sdg') setSdg(result.data);
          }
        }
      }
    } catch (err) {
      console.error('Gagal load konten:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContent(); }, []);

  const saveContent = async (sectionId, data) => {
    try {
      const res = await fetch(`${API_BASE}/api/site-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: 'global', sectionId: sectionId, data: data, updatedBy: session?.username || 'admin' })
      });
      return res.ok;
    } catch (err) { return false; }
  };

  const handleEdit = (section, data) => {
    setEditSection(section);
    setEditData(JSON.parse(JSON.stringify(data)));
    setEditMode(true);
  };

  const handleSave = async () => {
    let success = false;
    if (editSection === 'pillars') { success = await saveContent('global_pillars', editData); if (success) setPillars(editData); }
    else if (editSection === 'goals') { success = await saveContent('global_goals', editData); if (success) setGoals(editData); }
    else if (editSection === 'actions') { success = await saveContent('global_actions', editData); if (success) setActions(editData); }
    else if (editSection === 'sdg') { success = await saveContent('global_sdg', editData); if (success) setSdg(editData); }
    if (success) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setEditMode(false); setEditSection(null); setEditData(null);
  };

  const handleCancel = () => { setEditMode(false); setEditSection(null); setEditData(null); };

  const getIcon = (iconName) => {
    const icons = { FaBullseye, FaHandshake, FaChartLine, FaUsers };
    return icons[iconName] || FaGlobe;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-500 animate-spin animation-delay-150"></div>
            <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-purple-500 animate-spin animation-delay-300"></div>
            <FaGem className="absolute inset-0 m-auto text-4xl text-white" />
          </div>
          <p className="text-white text-xl mt-8 font-light tracking-wider">LOADING PREMIUM STRATEGY...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
      </div>

      {isAdmin && (
        <div className="sticky top-0 z-30 bg-black/50 backdrop-blur-xl border-b border-white/10 p-3 flex justify-end gap-3">
          {saved && <span className="text-emerald-400 text-sm flex items-center gap-1"><FaCheckCircle /> Tersimpan</span>}
        </div>
      )}

      <div className="relative z-10 max-w-5xl mx-auto p-6 lg:p-10 space-y-12">
        
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-white/20 p-10 lg:p-16 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-transparent to-purple-500/20"></div>
          <div className="relative">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/10 backdrop-blur rounded-full text-emerald-300 text-sm font-semibold tracking-wider mb-6">
              <FaCrown className="text-yellow-400" /> PREMIUM STRATEGY
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white mb-6">
              Strategi Global <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">K3 ILO</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Kerangka aksi global untuk mencapai tempat kerja yang aman dan sehat bagi semua 
              melalui kolaborasi internasional dan komitmen nasional.
            </p>
            {isAdmin && (
              <button onClick={() => handleEdit('hero', {})} className="mt-6 text-sm text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 mx-auto">
                <FaEdit size={14} /> Edit Hero
              </button>
            )}
          </div>
        </div>

        {/* SDG Connection */}
        <div className="relative group">
          {isAdmin && (
            <button onClick={() => handleEdit('sdg', sdg)} className="absolute -top-2 right-0 z-10 text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1">
              <FaEdit size={14} /> Edit SDG
            </button>
          )}
          <h2 className="text-3xl lg:text-4xl font-bold text-white text-center mb-10 flex items-center justify-center gap-3">
            <FaStar className="text-yellow-400" /> K3 dalam SDGs
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {sdg.map((item, idx) => (
              <div key={idx} className={`group-card bg-gradient-to-br from-${item.color}-500/20 to-${item.color}-600/10 backdrop-blur rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105 cursor-pointer`}>
                <div className={`w-20 h-20 bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl`}>
                  <span className="text-3xl font-black text-white">{item.sdg}</span>
                </div>
                <h3 className="text-xl font-bold text-white text-center mb-3">{item.title}</h3>
                <p className="text-gray-300 text-sm text-center">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Pillars */}
        <div className="relative group">
          {isAdmin && (
            <button onClick={() => handleEdit('pillars', pillars)} className="absolute -top-2 right-0 z-10 text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1">
              <FaEdit size={14} /> Edit Pillars
            </button>
          )}
          <h2 className="text-3xl lg:text-4xl font-bold text-white text-center mb-10 flex items-center justify-center gap-3">
            <FaGem className="text-emerald-400" /> Empat Pilar Strategi Global
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {pillars.map((pillar, idx) => {
              const IconComponent = getIcon(pillar.icon);
              return (
                <div key={idx} className="group-card bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 cursor-pointer">
                  <div className={`w-16 h-16 bg-gradient-to-r ${pillar.color} rounded-xl flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform`}>
                    <IconComponent className="text-2xl text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{pillar.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Goals & Progress */}
        <div className="relative group">
          {isAdmin && (
            <button onClick={() => handleEdit('goals', goals)} className="absolute -top-2 right-0 z-10 text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1">
              <FaEdit size={14} /> Edit Goals
            </button>
          )}
          <h2 className="text-3xl lg:text-4xl font-bold text-white text-center mb-10 flex items-center justify-center gap-3">
            <FaTrophy className="text-blue-400" /> Tujuan & Kemajuan Strategis
          </h2>
          <div className="space-y-5">
            {goals.map((goal, idx) => (
              <div key={idx} className="bg-white/5 backdrop-blur rounded-2xl p-7 border border-white/10 hover:border-white/20 transition-all duration-300">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <span className="px-4 py-2 bg-emerald-500/30 text-emerald-300 rounded-full text-xs font-bold tracking-wider">
                      TARGET {goal.target}
                    </span>
                    <h3 className="text-xl font-bold text-white">{goal.title}</h3>
                  </div>
                  <span className="text-3xl font-black text-emerald-400">{goal.progress}%</span>
                </div>
                <p className="text-gray-300 mb-4">{goal.desc}</p>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${goal.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Plan */}
        <div className="relative group">
          {isAdmin && (
            <button onClick={() => handleEdit('actions', actions)} className="absolute -top-2 right-0 z-10 text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1">
              <FaEdit size={14} /> Edit Actions
            </button>
          )}
          <h2 className="text-3xl lg:text-4xl font-bold text-white text-center mb-10 flex items-center justify-center gap-3">
            <FaRocket className="text-purple-400" /> Rencana Aksi
          </h2>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-blue-500 to-purple-500 hidden md:block"></div>
            {actions.map((action, idx) => (
              <div key={idx} className="relative pl-0 md:pl-20 mb-8 group-card">
                <div className="bg-white/5 backdrop-blur rounded-2xl p-7 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-[1.02]">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center shadow-xl">
                      <FaCalendarAlt className="text-white text-2xl" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{action.phase}</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {action.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-gray-300 group/item">
                        <FaArrowRight className="text-emerald-400 text-sm group-hover/item:translate-x-1 transition-transform" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 p-10 lg:p-14 text-center">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative">
            <FaQuoteLeft className="text-white/20 text-7xl absolute -top-8 -left-4 opacity-50" />
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-5">Bergabung dalam Gerakan Global</h2>
            <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
              Setiap organisasi dapat berkontribusi pada strategi global K3 dengan mengimplementasikan 
              sistem manajemen K3 yang efektif dan berbagi best practices.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300 cursor-pointer">
                <FaRocket className="text-4xl mx-auto mb-4 text-yellow-300" />
                <h3 className="text-xl font-bold text-white mb-2">Mulai Implementasi</h3>
                <p className="text-white/80 text-sm">Terapkan SMK3 atau ISO 45001 di organisasi Anda</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300 cursor-pointer">
                <FaUsers className="text-4xl mx-auto mb-4 text-yellow-300" />
                <h3 className="text-xl font-bold text-white mb-2">Libatkan Pekerja</h3>
                <p className="text-white/80 text-sm">Dorong partisipasi aktif semua pekerja dalam K3</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300 cursor-pointer">
                <FaGlobe className="text-4xl mx-auto mb-4 text-yellow-300" />
                <h3 className="text-xl font-bold text-white mb-2">Bagikan Pengalaman</h3>
                <p className="text-white/80 text-sm">Ceritakan keberhasilan K3 Anda untuk menginspirasi yang lain</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">© 2024 JSMS HSSE - Enterprise Safety Management Platform</p>
          <p className="text-gray-600 text-xs mt-2">Powered by ILO Global Strategy | Premium Edition</p>
        </div>
      </div>

      {/* Edit Modal */}
      {editMode && editData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-auto border border-white/20 shadow-2xl">
            <div className="sticky top-0 bg-gray-900/90 p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-white">Edit {editSection}</h3>
              <button onClick={handleCancel} className="text-gray-400 hover:text-white transition p-2 rounded-full hover:bg-white/10">
                <FaTimes size={24} />
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={JSON.stringify(editData, null, 2)}
                onChange={(e) => { try { setEditData(JSON.parse(e.target.value)); } catch(err) {} }}
                className="w-full h-[50vh] p-5 bg-gray-800 border border-gray-700 rounded-xl text-gray-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex gap-4 mt-6">
                <button onClick={handleSave} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-emerald-700 transition shadow-lg flex items-center gap-2">
                  <FaSave /> Simpan Perubahan
                </button>
                <button onClick={handleCancel} className="px-8 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalStrategy;