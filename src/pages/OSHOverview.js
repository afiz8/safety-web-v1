import React from 'react';
import { FaHardHat, FaHeartbeat, FaShieldAlt, FaUsers, FaGlobe, FaChartLine } from 'react-icons/fa';

const OSHOverview = () => {
  const stats = [
    { icon: FaGlobe, label: 'Pekerja Terlindungi', value: '4 Miliar+', color: 'from-blue-500 to-blue-600' },
    { icon: FaHeartbeat, label: 'Kematian per Tahun', value: '2.78 Juta', color: 'from-red-500 to-red-600' },
    { icon: FaHardHat, label: 'Kecelakaan Kerja', value: '374 Juta+', color: 'from-orange-500 to-orange-600' },
    { icon: FaChartLine, label: 'Biaya Ekonomi', value: '$3.9 Triliun', color: 'from-green-500 to-green-600' },
  ];

  const principles = [
    {
      title: 'Hak Fundamental',
      desc: 'Setiap pekerja berhak atas lingkungan kerja yang aman dan sehat. Ini adalah hak dasar manusia yang diakui secara universal.',
      icon: '🛡️'
    },
    {
      title: 'Pencegahan Utama',
      desc: 'Fokus utama adalah pencegahan kecelakaan dan penyakit akibat kerja melalui identifikasi bahaya dan pengendalian risiko.',
      icon: '🔍'
    },
    {
      title: 'Partisipasi Pekerja',
      desc: 'Pekerja dan perwakilan mereka harus dilibatkan aktif dalam proses pengambilan keputusan terkait K3.',
      icon: '🤝'
    },
    {
      title: 'Tanggung Jawab Bersama',
      desc: 'Pemerintah, pengusaha, dan pekerja memiliki tanggung jawab bersama untuk menciptakan tempat kerja yang aman.',
      icon: '⚖️'
    },
    {
      title: 'Pendekatan Sistematis',
      desc: 'Manajemen K3 harus terintegrasi dalam sistem manajemen organisasi secara keseluruhan.',
      icon: '⚙️'
    },
    {
      title: 'Peningkatan Berkelanjutan',
      desc: 'Kinerja K3 harus terus dipantau, dievaluasi, dan ditingkatkan secara berkelanjutan.',
      icon: '📈'
    }
  ];

  const scopeItems = [
    { title: 'Keselamatan Kerja', items: ['Kecelakaan kerja', 'Cedera fisik', 'Kerusakan properti', 'Kebakaran & ledakan'] },
    { title: 'Kesehatan Kerja', items: ['Penyakit akibat kerja', 'Gangguan muskuloskeletal', 'Gangguan pernapasan', 'Keracunan kimia'] },
    { title: 'Kesejahteraan', items: ['Kesehatan mental', 'Work-life balance', 'Lingkungan kerja ergonomis', 'Pencegahan kekerasan'] },
    { title: 'Lingkungan', items: ['Pencemaran udara', 'Pengelolaan limbah', 'Konservasi energi', 'Dampak lingkungan'] }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-orange-50 dark:from-slate-900 dark:via-slate-900 dark:to-orange-950/30">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-semibold">
            <FaShieldAlt /> Topik K3 - ILO
          </div>
          <h1 className="text-4xl lg:text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600 bg-clip-text text-transparent">
            Keselamatan & Kesehatan Kerja
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Keselamatan dan kesehatan kerja (K3) adalah disiplin ilmu yang berkaitan dengan pencegahan kecelakaan kerja 
            dan penyakit akibat kerja, serta perlindungan dan peningkatan kesejahteraan pekerja.
          </p>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="group bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl hover:shadow-2xl border border-gray-100 dark:border-gray-700 transition-all hover:-translate-y-1">
              <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                <stat.icon className="text-2xl text-white" />
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">{stat.value}</p>
              <p className="text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Definition Section */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Apa itu K3?</h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                <p>
                  <strong className="text-blue-600 dark:text-blue-400">Keselamatan dan Kesehatan Kerja (K3)</strong> merujuk pada 
                  kondisi dan faktor-faktor yang mempengaruhi kesehatan dan keselamatan pekerja di tempat kerja, 
                  termasuk lingkungan kerja yang aman, peralatan yang aman, prosedur kerja yang aman, 
                  dan pelatihan yang memadai.
                </p>
                <p>
                  Menurut ILO, K3 mencakup semua aspek kesehatan dan keselamatan di tempat kerja, 
                  dengan fokus khusus pada pencegahan bahaya sebagai hasil dari aktivitas kerja.
                </p>
                <p>
                  Tujuan utama K3 adalah <strong className="text-orange-600 dark:text-orange-400">mencegah kecelakaan kerja dan penyakit akibat kerja</strong> 
                  dengan mengelola risiko di tempat kerja melalui identifikasi bahaya, penilaian risiko, 
                  dan implementasi kontrol yang efektif.
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Ruang Lingkup K3</h3>
              <div className="space-y-4">
                {scopeItems.map((scope, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm">
                    <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2">{scope.title}</h4>
                    <div className="flex flex-wrap gap-2">
                      {scope.items.map((item, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Core Principles */}
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">
            Prinsip-prinsip Dasar K3
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {principles.map((p, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all hover:-translate-y-1">
                <div className="text-4xl mb-4">{p.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{p.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 lg:p-12 text-white">
          <h2 className="text-3xl font-bold mb-8 text-center">Manfaat Implementasi K3</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Bagi Pekerja', items: ['Perlindungan kesehatan', 'Lingkungan kerja aman', 'Peningkatan produktivitas', 'Kesejahteraan meningkat'] },
              { title: 'Bagi Perusahaan', items: ['Biaya kecelakaan turun', 'Reputasi meningkat', 'Produktivitas optimal', 'Kepatuhan regulasi'] },
              { title: 'Bagi Masyarakat', items: ['Beban kesehatan turun', 'Lingkungan bersih', 'Perekonomian stabil', 'Kualitas hidup naik'] },
              { title: 'Bagi Negara', items: ['PDB lebih efisien', 'Pengeluaran kesehatan turun', 'Tenaga kerja sehat', 'Dayasaing meningkat'] }
            ].map((benefit, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                <ul className="space-y-2">
                  {benefit.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ILO Framework */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-100 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Kerangka Kerja ILO untuk K3
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Standar Internasional</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Konvensi dan rekomendasi ILO yang menetapkan standar minimum untuk K3 di seluruh dunia.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Sistem Nasional</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Kebijakan, program, dan mekanisme tripartit untuk implementasi K3 di tingkat nasional.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Tingkat Perusahaan</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sistem manajemen K3, pelatihan, dan partisipasi pekerja di tingkat tempat kerja.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OSHOverview;

