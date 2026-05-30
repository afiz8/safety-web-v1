const mongoose = require('mongoose');

const statisticLogSchema = new mongoose.Schema({
  period: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], default: 'monthly' },
  year: Number,
  month: Number,
  data: {
    totalIncidents: Number,
    highRiskIncidents: Number,
    totalNearMiss: Number,
    highRiskNearMiss: Number,
    totalObservations: Number,
    negativeObservations: Number,
    totalMedical: Number,
    criticalMedical: Number,
    safetyScore: Number
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StatisticLog', statisticLogSchema);