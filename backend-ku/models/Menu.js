const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: 'FaChartBar' },
  path: { type: String, required: true, unique: true },
  roles: [{ type: String, enum: ['Admin', 'Supervisor', 'Karyawan'] }],
  parent: { type: String, default: null },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Menu', menuSchema);