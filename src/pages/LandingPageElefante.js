import React from 'react';
import { useContext } from 'react';
import { UserContext } from '../App';
import { 
  FaArrowRight, FaRocket, FaLaptopCode, FaNetworkWired, FaUsers,
  FaCreditCard, FaPlug, FaBuilding, FaMicrochip, FaChartLine
} from 'react-icons/fa';

const LandingPageElefante = () => {
  const { setCurrentPage } = useContext(UserContext);

  const goToLogin = () => setCurrentPage('/login');
  const goToDashboard = () => setCurrentPage('/dashboard');
  const goToIoTPlatform = () => setCurrentPage('/iot-platform'); // TAMBAHAN IOT

  const services = [
    { icon: <FaLaptopCode />, title: "Smart Pertashop", description: "Platform monitoring transaksi dan stok BBM berbasis IoT real‑time untuk SPBU.", path: "https://elefante.co.id/smart-pertashop" },
    { icon: <FaNetworkWired />, title: "IoT Platform", description: "Platform IoT serbaguna untuk pemantauan jarak jauh dan integrasi semua aset.", path: "/iot-platform" }, // DIUBAH ke internal route
    { icon: <FaUsers />, title: "Linxcoop", description: "Solusi digital untuk koperasi: manajemen anggota, transaksi, dan pelaporan terintegrasi.", path: "https://elefante.co.id/linxcoop" },
    { icon: <FaCreditCard />, title: "Edulinx", description: "Platform pengelolaan beasiswa: pendaftaran, seleksi, keuangan, dan alumni.", path: "https://elefante.co.id/edulinx" },
    { icon: <FaPlug />, title: "Energy Management", description: "Manajemen tenaga listrik terintegrasi untuk gardu distribusi, meteran, dan genset dengan IoT.", path: "https://elefante.co.id/energy-management" },
    { icon: <FaBuilding />, title: "Digital Infrastructure", description: "Infrastruktur digital untuk bisnis swalayan dan nirtunai, mendukung Industry 4.0.", path: "https://elefante.co.id/digital-infrastructure" }
  ];

  const portfolios = [
    { title: "PERTASHOP", description: "Layanan platform manajemen stok, penjualan, dan laporan keuangan real‑time." },
    { title: "PATLOG DIGITAL", description: "Sistem monitoring stok dan transaksi untuk logistik digital dengan visibilitas penuh." },
    { title: "Incinerator Control Board", description: "Panel kontrol dan HMI dashboard untuk insenerator, meningkatkan efisiensi dan keamanan." }
  ];

  const scrollToPortfolio = () => {
    const portfolioSection = document.getElementById('portfolio');
    if (portfolioSection) portfolioSection.scrollIntoView({ behavior: 'smooth' });
  };

  const handleServiceClick = (service) => {
    if (service.path === '/iot-platform') {
      goToIoTPlatform();
    } else if (service.path.startsWith('http')) {
      window.open(service.path, '_blank');
    } else {
      window.open(service.path, '_blank');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Header Navigasi */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">elefante</div>
          <div className="flex gap-4">
            <button onClick={goToLogin} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 font-medium">Login</button>
            <button onClick={goToDashboard} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Dashboard JSMS</button>
            <button onClick={goToIoTPlatform} className="border border-blue-600 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-50 transition">IoT Platform</button> {/* TAMBAHAN IOT */}
          </div>
        </div>
      </header>

      {/* Hero Section dengan background image */}
      <section 
        className="relative overflow-hidden bg-cover bg-center pt-20"
        style={{ backgroundImage: "url('/images/elefante-hero.jpeg')" }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center text-white">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-blue-500/80 rounded-full px-4 py-1.5 text-white text-sm font-medium">
                <FaRocket className="w-4 h-4" />
                Solusi IoT & Digital Infrastructure
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Pengelolaan Jarak Jauh untuk
              <span className="bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent block mt-2">
                Aset dan Fasilitas Anda
              </span>
            </h1>
            <p className="text-xl max-w-2xl mx-auto mb-10">
              Platform IoT serbaguna untuk pemantauan jarak jauh, mengintegrasikan semua aset dan fasilitas Anda dalam satu dasbor.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={goToLogin} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg transition hover:scale-105">
                Mulai Sekarang
              </button>
              <button onClick={scrollToPortfolio} className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-full font-semibold transition">
                Lihat Portofolio
              </button>
              <button onClick={goToIoTPlatform} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg transition hover:scale-105">
                <FaMicrochip className="inline mr-2" /> Coba IoT Platform
              </button> {/* TAMBAHAN IOT */}
            </div>
          </div>
        </div>
      </section>

      {/* Tagline "MEMPERKUAT SINERGI" */}
      <div className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-800 dark:text-white">MEMPERKUAT SINERGI</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mt-4 max-w-2xl mx-auto">Mengoptimalkan Strategi Digital & Infrastruktur IoT</p>
        </div>
      </div>

      {/* Services Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Solusi Unggulan Kami</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Perangkat untuk memantau, remote, dan mengintegrasikan aset & fasilitas Anda.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-md hover:shadow-xl transition group cursor-pointer" onClick={() => handleServiceClick(service)}>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl mb-4 group-hover:scale-110 transition">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{service.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{service.description}</p>
                {service.title === "IoT Platform" && (
                  <div className="mt-3 flex items-center text-blue-600 text-sm font-medium">
                    Lihat Demo <FaArrowRight className="ml-1 w-3 h-3" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview IoT Platform Section (TAMBAHAN IOT) */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
                <FaMicrochip /> IoT Smart Monitoring
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Pantau Aset & Fasilitas Anda{' '}
                <span className="text-blue-600">Jarak Jauh</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Dashboard terintegrasi untuk memantau sensor, peringatan dini, dan performa aset secara real-time.
                Cocok untuk manajemen energi, keamanan, dan operasional industri.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><FaChartLine className="text-green-500" /> Grafik tren sensor & peringatan otomatis</li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><FaNetworkWired className="text-green-500" /> Integrasi berbagai perangkat IoT (ESP32, PLC, dll)</li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><FaMicrochip className="text-green-500" /> Notifikasi WhatsApp/Email jika ada anomali</li>
              </ul>
              <button onClick={goToIoTPlatform} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg transition flex items-center gap-2">
                Coba IoT Platform Sekarang <FaArrowRight />
              </button>
            </div>
            <div className="relative">
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur rounded-2xl p-5 shadow-xl border border-blue-200 dark:border-blue-800">
                <img 
                  src="/api/placeholder/500/350" 
                  alt="IoT Platform Dashboard Preview" 
                  className="rounded-xl shadow-md w-full"
                  onError={(e) => e.target.src = 'https://placehold.co/600x400/0891b2/white?text=IoT+Platform+Dashboard'}
                />
                <div className="absolute -bottom-3 -right-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">Real-time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div><div className="text-4xl font-bold mb-2">50+</div><div>Proyek Selesai</div></div>
            <div><div className="text-4xl font-bold mb-2">25+</div><div>Klien Aktif</div></div>
            <div><div className="text-4xl font-bold mb-2">5+</div><div>Tahun Pengalaman</div></div>
            <div><div className="text-4xl font-bold mb-2">100%</div><div>Kepuasan Klien</div></div>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">Portofolio Proyek Sukses</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Kami telah membantu berbagai klien mencapai efisiensi dan keandalan.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {portfolios.map((item, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition group cursor-pointer" onClick={() => window.open(`https://elefante.co.id/proyek/${item.title.toLowerCase().replace(/ /g, '-')}`, '_blank')}>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{item.description}</p>
                  <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                    Pelajari Selengkapnya <FaArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 dark:bg-blue-800 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Siap Meningkatkan Efisiensi Operasional?</h2>
          <p className="text-xl mb-8">Hubungi tim kami untuk konsultasi gratis tentang solusi IoT yang tepat untuk bisnis Anda.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="mailto:info@elefante.co.id" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold shadow-lg transition">
              Hubungi Kami
            </a>
            <a href="/company-profile.pdf" className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-full font-semibold transition">
              Download Company Profile
            </a>
            <button onClick={goToIoTPlatform} className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-full font-semibold shadow-lg transition flex items-center gap-2">
              <FaMicrochip /> Coba IoT Platform
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-red-400 bg-clip-text text-transparent">PT. Elefante Infradigi Solusi</h3>
              <p className="text-gray-400 text-sm">Menyediakan infrastruktur digital untuk bisnis swalayan dan nirtunai, mendukung Industry 4.0 dan Logistics 4.0.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Layanan</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => goToIoTPlatform()} className="hover:text-blue-400">IoT Platform</button></li>
                <li><a href="https://elefante.co.id/smart-pertashop" className="hover:text-blue-400">Smart Pertashop</a></li>
                <li><a href="https://elefante.co.id/edulinx" className="hover:text-blue-400">Edulinx</a></li>
                <li><a href="https://elefante.co.id/energy-management" className="hover:text-blue-400">Energy Management</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Perusahaan</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="https://elefante.co.id/about" className="hover:text-blue-400">Tentang Kami</a></li>
                <li><button onClick={scrollToPortfolio} className="hover:text-blue-400">Portofolio</button></li>
                <li><a href="https://elefante.co.id/career" className="hover:text-blue-400">Karir</a></li>
                <li><a href="mailto:info@elefante.co.id" className="hover:text-blue-400">Hubungi Kami</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontak</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>📧 <a href="mailto:info@elefante.co.id" className="hover:text-blue-400">info@elefante.co.id</a></li>
                <li>📍 Jakarta Barat, DKI Jakarta</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">&copy; 2025 PT. Elefante Infradigi Solusi. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageElefante;