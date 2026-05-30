require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

console.log('📡 MONGODB_URI:', process.env.MONGODB_URI ? 'ADA ✅' : 'TIDAK ADA ❌');

const dummyUsers = [
  { name: 'Admin User', username: 'admin', password: 'admin', role: 'Admin' },
  { name: 'Supervisor User', username: 'sup', password: 'sup', role: 'Supervisor' },
  { name: 'Karyawan User', username: 'kary', password: 'kary', role: 'Karyawan' }
];

async function seed() {
  try {
    console.log('📡 Menghubungkan ke MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Terhubung ke MongoDB');
    
    await User.deleteMany({});
    console.log('🗑️ Users lama dihapus');
    
    const result = await User.insertMany(dummyUsers);
    console.log(`✅ ${result.length} user berhasil ditambahkan`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();