require('dotenv').config();
const mongoose = require('mongoose');
const GalleryItem = require('./models/GalleryItem');

const initialItems = [
  { title: 'Kegiatan Keselamatan Kerja 2', filename: 'kegiatankeselamatankerja2.jpg', type: 'image', category: 'Kegiatan', path: '/images/kegiatankeselamatankerja2.jpg', order: 1, isActive: true },
  { title: 'Kegiatan Keselamatan Kerja 3', filename: 'kegiatankeselamatankerja3.jpg', type: 'image', category: 'Kegiatan', path: '/images/kegiatankeselamatankerja3.jpg', order: 2, isActive: true },
  { title: 'Kegiatan Keselamatan Kerja 4', filename: 'kegiatankeselamatankerja4.jpg', type: 'image', category: 'Kegiatan', path: '/images/kegiatankeselamatankerja4.jpg', order: 3, isActive: true },
  { title: 'Kegiatan Keselamatan Kerja 6', filename: 'kegiatankeselamatankerja6.jpg', type: 'image', category: 'Kegiatan', path: '/images/kegiatankeselamatankerja6.jpg', order: 4, isActive: true },
  { title: 'Kegiatan Keselamatan Kerja 7', filename: 'kegiatankeselamatankerja7.jpg', type: 'image', category: 'Kegiatan', path: '/images/kegiatankeselamatankerja7.jpg', order: 5, isActive: true },
  { title: 'Kegiatan Keselamatan Kerja 8', filename: 'kegiatankeselamatankerja8.jpg', type: 'image', category: 'Kegiatan', path: '/images/kegiatankeselamatankerja8.jpg', order: 6, isActive: true },
  { title: 'Mobil Kebakaran 1', filename: 'mobilkebakaran.jpg', type: 'image', category: 'Pemadam', path: '/images/mobilkebakaran.jpg', order: 7, isActive: true },
  { title: 'Mobil Kebakaran 2', filename: 'mobilkebakaran2.jpg', type: 'image', category: 'Pemadam', path: '/images/mobilkebakaran2.jpg', order: 8, isActive: true },
  { title: 'Mobil Kebakaran 3', filename: 'mobilkebakaran3.jpg', type: 'image', category: 'Pemadam', path: '/images/mobilkebakaran3.jpg', order: 9, isActive: true },
  { title: 'Mobil Kebakaran 4', filename: 'mobilkebakaran4.jpg', type: 'image', category: 'Pemadam', path: '/images/mobilkebakaran4.jpg', order: 10, isActive: true },
  { title: 'Mobil Kebakaran 5', filename: 'mobilkebakaran5.jpg', type: 'image', category: 'Pemadam', path: '/images/mobilkebakaran5.jpg', order: 11, isActive: true }
];

async function seed() {
  try {
    console.log('📡 Menghubungkan ke MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Terhubung ke MongoDB');
    await GalleryItem.deleteMany({});
    console.log('🗑️ Data lama dihapus');
    await GalleryItem.insertMany(initialItems);
    console.log(`✅ ${initialItems.length} item gallery berhasil ditambahkan`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();