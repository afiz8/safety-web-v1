const mongoose = require('mongoose');

const laggingStatSchema = new mongoose.Schema({
  metric: { type: String, required: true, unique: true }, // 'totalIncidents', 'nearMiss', 'ltisr', 'safeHours'
  value: Number,
  trend: String,
  trendUp: Boolean,
  unit: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LaggingStat', laggingStatSchema);