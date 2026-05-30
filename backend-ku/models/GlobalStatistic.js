const mongoose = require('mongoose');

const globalStatisticSchema = new mongoose.Schema({
  source: { type: String, enum: ['ILO', 'WHO', 'Kemenaker', 'Internal'], required: true },
  year: Number,
  category: { type: String, enum: ['fatality', 'injury', 'disease', 'economic'], required: true },
  region: String,
  value: Number,
  unit: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GlobalStatistic', globalStatisticSchema);