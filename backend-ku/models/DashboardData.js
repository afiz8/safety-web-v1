const mongoose = require('mongoose');

const dashboardDataSchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'safetyHours', 'stats', dll
  month: { type: String }, // untuk data bulanan
  value: { type: Number }, // nilai numerik
  data: { type: mongoose.Schema.Types.Mixed }, // untuk data kompleks
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DashboardData', dashboardDataSchema);