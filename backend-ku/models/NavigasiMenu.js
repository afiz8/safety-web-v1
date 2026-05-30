const mongoose = require('mongoose');

const navigasiMenuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: 'FaChartBar' },
  path: { type: String, required: true },
  roles: [{ type: String, enum: ['Admin', 'Supervisor', 'Karyawan'] }],
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isFavorite: { type: Boolean, default: false },
  category: { type: String, default: 'Umum' },
  description: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NavigasiMenu', navigasiMenuSchema);