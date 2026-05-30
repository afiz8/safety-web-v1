import React, { useState } from 'react';

const Pelatihan = () => {
  // Data training yang sudah ada
  const trainings = [
    { name: 'Fire Safety & Evacuation', completion: '98%', attendees: '245', date: '2024-10-04', status: 'Completed' },
    { name: 'Heavy Equipment Operation', completion: '95%', attendees: '189', date: '2024-10-03', status: 'Completed' },
    { name: 'First Aid Training', completion: '100%', attendees: '156', date: '2024-10-02', status: 'Completed' },
    { name: 'Confined Space Entry', completion: '92%', attendees: '134', date: '2024-10-01', status: 'Completed' },
    { name: 'H2S Awareness', completion: '89%', attendees: '167', date: '2024-09-30', status: 'Completed' },
  ];

  const stats = [
    { label: 'Total Sessions', value: '245', trend: '+15' },
    { label: 'Avg Completion', value: '95%', trend: '+3%' },
    { label: 'Certified Workers', value: '1,234', trend: '+28' },
    { label: 'Upcoming', value: '5', trend: 'Next week' }
  ];

  // ========== MATERI PELATIHAN PEMADAM KEBAKARAN (FIRE MARSHAL) ==========
  const materiPemadam = [
    {
      id: 1,
      judul: 'Pengertian & Peran Fire Marshal',
      deskripsi: 'Fire Marshal (Petugas Kebakaran Internal) adalah individu yang ditunjuk sebagai penanggung jawab keselamatan kebakaran di suatu lokasi. Tugasnya meliputi mengawasi prosedur keselamatan, memimpin evakuasi, dan menjadi penghubung dengan pemadam kebakaran profesional.',
      sumber: 'AMAN MULTI INDONESIA',
      link: 'http://amanmultiindonesia.com/perbedaan-fire-drill-fire-safety-training-dan-fire-marshal-training/'
    },
    {
      id: 2,
      judul: 'Sebab & Punca Kebakaran',
      deskripsi: 'Peserta didedahkan mengenai pentingnya keselamatan kebakaran secara teori dan praktikal mengenai sebab serta punca berlakunya kebakaran. Kebakaran dapat disebabkan oleh kelalaian manusia, korsleting listrik, bahan mudah terbakar, atau faktor alam.',
      sumber: 'Kursus Fire Marshal - CSPS Brunei',
      link: 'http://www.csps.org.bn/2021/04/08/kursus-fire-marshal/'
    },
    {
      id: 3,
      judul: 'Latihan Pengosongan Bangunan (Evakuasi)',
      deskripsi: 'Latihan praktikal untuk mengetahui tindakan yang tepat saat menghadapi insiden kebakaran di tempat kerja, termasuk membuat latihan pengosongan bangunan secara bersistematik, koordinasi pasukan, dan penyelamatan korban.',
      sumber: 'Kursus Fire Marshal - CSPS Brunei',
      link: 'http://www.csps.org.bn/2021/04/08/kursus-fire-marshal/'
    },
    {
      id: 4,
      judul: 'Penggunaan Alat Pemadam Api (APAR) & Selimut Api',
      deskripsi: 'Tatacara penggunaan alat-alat pemadam api (APAR) dan selimut api dengan cara yang betul. Pelajari metode PASS (Pull, Aim, Squeeze, Sweep) dalam menggunakan APAR.',
      sumber: 'Kursus Fire Marshal - CSPS Brunei',
      link: 'http://www.csps.org.bn/2021/04/08/kursus-fire-marshal/'
    },
    {
      id: 5,
      judul: 'Penanganan Korban & Pertolongan Pertama',
      deskripsi: 'Pelatihan untuk menyelamatkan diri dari terperangkap di dalam bangunan saat kebakaran, termasuk teknik evakuasi korban, rawatan asas kecemasan (P3K), dan komunikasi efektif dengan tim penyelamat.',
      sumber: 'Latihan Fire Marshal - USMS Sdn Bhd',
      link: 'https://www.usms.com.bn/web/news/latihan-fire-marshal/'
    },
    {
      id: 6,
      judul: 'Simulasi & Latihan Praktikal',
      deskripsi: 'Latihan praktikal yang meliputi: latihan di dalam ruangan gelap dan berasap, fire drill, latihan pengetahuan jenis-jenis pemadam api, praktik memadam api, serta simulasi penanganan korban.',
      sumber: 'Latihan Fire Marshal - USMS Sdn Bhd',
      link: 'https://www.usms.com.bn/web/news/latihan-fire-marshal/'
    },
    {
      id: 7,
      judul: 'Klasifikasi Kebakaran (Kelas A, B, C, D, K)',
      deskripsi: 'Memahami 5 kelas kebakaran berdasarkan jenis material yang terbakar, serta media pemadam yang paling efektif untuk masing-masing kelas.',
      sumber: 'Basic Fire Fighting Training',
      link: 'https://www.niti.edu.sa/?p=1574'
    },
    {
      id: 8,
      judul: 'Fire Drill vs Fire Safety Training vs Fire Marshal Training',
      deskripsi: 'Fire Drill fokus pada latihan evakuasi semua orang; Fire Safety Training membekali keterampilan dasar pencegahan dan pemadaman awal; Fire Marshal Training mempersiapkan individu tertentu untuk memimpin evakuasi dan manajemen kebakaran.',
      sumber: 'AMAN MULTI INDONESIA',
      link: 'http://amanmultiindonesia.com/perbedaan-fire-drill-fire-safety-training-dan-fire-marshal-training/'
    }
  ];

  const [modalMateri, setModalMateri] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = (materi) => {
    setModalMateri(materi);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMateri(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
        {/* Header existing */}
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-900 to-indigo-800 bg-clip-text text-transparent mb-2">
              Pelatihan Keselamatan
            </h1>
            <p className="text-xl text-gray-700">Manajemen training dan sertifikasi K3</p>
          </div>
          <div className="bg-purple-500/10 rounded-2xl p-6 border border-purple-200">
            <p className="text-2xl font-bold text-purple-800">95% Average Completion</p>
            <p className="text-purple-600 font-semibold">245 sessions total</p>
          </div>
        </div>

        {/* Stats existing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="group bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl hover:shadow-3xl border border-white/60 hover:border-purple-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-6">{stat.label}</h3>
              <p className="text-3xl font-black text-gray-900 mb-2">{stat.value}</p>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-bold">
                {stat.trend}
              </span>
            </div>
          ))}
        </div>

        {/* Recent Trainings Table (existing) */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Recent Training Sessions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                <tr>
                  <th className="p-4 text-left font-semibold">Training</th>
                  <th className="p-4 text-left font-semibold">Completion</th>
                  <th className="p-4 text-right font-semibold">Attendees</th>
                  <th className="p-4 text-right font-semibold">Date</th>
                  <th className="p-4 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {trainings.map((training, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-purple-50">
                    <td className="p-4 font-semibold">{training.name}</td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                          <div className="bg-purple-500 h-2 rounded-full" style={{width: training.completion}}></div>
                        </div>
                        <span>{training.completion}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-medium">{training.attendees}</td>
                    <td className="p-4">{training.date}</td>
                    <td className="p-4 text-right">
                      <span className="px-4 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
                        {training.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Existing Grid (Calendar + Cert) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-6">Training Calendar</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <p className="text-sm text-gray-500">Oct 7</p>
                <p className="font-bold text-purple-600">Crane Safety</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <p className="text-sm text-gray-500">Oct 10</p>
                <p className="font-bold text-indigo-600">Permit to Work</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <p className="text-sm text-gray-500">Oct 15</p>
                <p className="font-bold text-purple-600">Fire Drill</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border">
                <p className="text-sm text-gray-500">Oct 20</p>
                <p className="font-bold text-indigo-600">H2S Refresher</p>
              </div>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Certification Status</h3>
            <p className="text-3xl font-black text-purple-600 mb-4">1,234 certified</p>
            <p className="text-lg text-gray-600">87% workforce certified for current roles</p>
          </div>
        </div>

        {/* ========== BAGIAN BARU: MATERI PELATIHAN PEMADAM KEBAKARAN ========== */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                🔥 Materi Fire Marshal (Pemadam Kebakaran)
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Pelatihan untuk petugas kebakaran internal & keselamatan kebakaran</p>
            </div>
            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-semibold">
              {materiPemadam.length} Topik
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materiPemadam.map((materi) => (
              <div 
                key={materi.id} 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-200 dark:border-gray-700 overflow-hidden group"
                onClick={() => openModal(materi)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-red-600 transition">
                      {materi.judul}
                    </h3>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-500">
                      #{materi.id}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
                    {materi.deskripsi}
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-400">📖 {materi.sumber}</span>
                    <span className="text-red-500 text-sm group-hover:translate-x-1 transition">Lihat Detail →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Referensi Sumber */}
          <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">📌 Sumber Referensi</h3>
            <ul className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
              <li>• <a href="http://amanmultiindonesia.com/perbedaan-fire-drill-fire-safety-training-dan-fire-marshal-training/" target="_blank" rel="noopener noreferrer" className="hover:underline">Perbedaan Fire Drill, Fire Safety Training, dan Fire Marshal Training - AMAN MULTI INDONESIA</a></li>
              <li>• <a href="http://www.csps.org.bn/2021/04/08/kursus-fire-marshal/" target="_blank" rel="noopener noreferrer" className="hover:underline">Kursus Fire Marshal - Centre for Strategic and Policy Studies (CSPS)</a></li>
              <li>• <a href="https://www.usms.com.bn/web/news/latihan-fire-marshal/" target="_blank" rel="noopener noreferrer" className="hover:underline">Latihan Fire Marshal - USMS Sdn Bhd</a></li>
              <li>• <a href="https://www.niti.edu.sa/?p=1574" target="_blank" rel="noopener noreferrer" className="hover:underline">Basic Fire Fighting Training - National Institute of Technology</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal Detail Materi Pemadam */}
      {modalOpen && modalMateri && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">{modalMateri.judul}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed whitespace-pre-line">
                {modalMateri.deskripsi}
              </p>
              <div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">📖 Detail Lebih Lanjut</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Materi ini diambil dari pelatihan fire marshal yang diselenggarakan oleh berbagai lembaga, mencakup aspek teori dan praktikal.
                </p>
                <a 
                  href={modalMateri.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Baca sumber lengkap →
                </a>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl hover:bg-gray-300 transition"
                >
                  Tutup
                </button>
                <a
                  href={modalMateri.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-center"
                >
                  Kunjungi Sumber
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pelatihan;