require('dotenv').config();
const mongoose = require('mongoose');
const Menu = require('./models/Menu');

const initialMenus = [
  { name: 'Dashboard HSSE', icon: 'FaChartBar', path: '/dashboard', roles: ['Admin','Supervisor','Karyawan'], order: 1 },
  { name: 'Jam Kerja Selamat', icon: 'FaClock', path: '/jam-kerja-selamat', roles: ['Admin','Supervisor','Karyawan'], order: 2 },
  { name: 'Incidental Treatment', icon: 'FaMedkit', path: '/medical-case', roles: ['Admin','Supervisor','Karyawan'], order: 3 },
  { name: 'Fit to Work', icon: 'FaCheckCircle', path: '/fit-to-work', roles: ['Admin','Supervisor','Karyawan'], order: 4 },
  { name: 'Izin Kerja (PTW)', icon: 'FaFileAlt', path: '/izin-kerja', roles: ['Admin','Supervisor','Karyawan'], order: 5 },
  { name: 'Laporan Insiden', icon: 'FaExclamationTriangle', path: '/insiden', roles: ['Admin','Supervisor','Karyawan'], order: 6 },
  { name: 'Safety Observasi', icon: 'FaEye', path: '/observasi', roles: ['Admin','Supervisor','Karyawan'], order: 7 },
  { name: 'Near Miss Reporting', icon: 'FaExclamationTriangle', path: '/near-miss', roles: ['Admin','Supervisor','Karyawan'], order: 8 },
  { name: 'Safety Leaderboard', icon: 'FaTrophy', path: '/leaderboard', roles: ['Admin','Supervisor','Karyawan'], order: 9 },
  { name: 'Safety Moments', icon: 'FaLightbulb', path: '/safety-moments', roles: ['Admin','Supervisor','Karyawan'], order: 10 },
  { name: 'Job Safety Analysis (JSA)', icon: 'FaClipboardList', path: '/jsa', roles: ['Admin','Supervisor','Karyawan'], order: 11 },
  { name: 'Manajemen APD', icon: 'FaShieldAlt', path: '/manajemen-apd', roles: ['Admin','Supervisor'], order: 12 },
  { name: 'Manajemen Kontraktor', icon: 'FaUsers', path: '/kontraktor', roles: ['Admin','Supervisor'], order: 13 },
  { name: 'Reports & Export', icon: 'FaChartBar', path: '/reports', roles: ['Admin','Supervisor'], order: 14 },
  { name: 'User Management', icon: 'FaUserCog', path: '/users', roles: ['Admin'], order: 15 },
  { name: 'Audit Logs', icon: 'FaClipboardList', path: '/audit-logs', roles: ['Admin'], order: 16 },
  { name: 'Workflows', icon: 'FaSitemap', path: '/workflows', roles: ['Admin','Supervisor'], order: 17 },
  { name: 'Safety Reels', icon: 'FaVideo', path: '/reels', roles: ['Admin','Supervisor','Karyawan'], order: 18 },
  { name: 'Pengaturan Notifikasi', icon: 'FaPhone', path: '/pengaturan-notifikasi', roles: ['Admin'], order: 19 },
  { name: 'Notifications', icon: 'FaBell', path: '/notifications', roles: ['Admin','Supervisor','Karyawan'], order: 20 },
  { name: 'Logout', icon: 'FaSignOutAlt', path: '/login', roles: ['Admin','Supervisor','Karyawan'], order: 21 }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Terhubung ke MongoDB');

    // Hapus semua data menu yang ada
    await Menu.deleteMany({});
    console.log('🗑️ Data menu lama dihapus');

    // Insert data menu baru
    await Menu.insertMany(initialMenus);
    console.log(`✅ ${initialMenus.length} menu berhasil ditambahkan`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal seeding menu:', err);
    process.exit(1);
  }
}

seed();