const mongoose = require('mongoose');

const aiAnalysisLogSchema = new mongoose.Schema({
  analysisType: { type: String, enum: ['insight', 'prediction', 'recommendation'], default: 'insight' },
  inputData: Object,
  result: {
    insight: String,
    riskLevel: String,
    riskScore: Number,
    predictions: Array,
    recommendations: Array
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AIAnalysisLog', aiAnalysisLogSchema);