const mongoose = require('mongoose');

const aiSafetyTipSchema = new mongoose.Schema({
  tip: { type: String, required: true },
  category: { type: String },
  context: { type: String },
  isUsed: { type: Boolean, default: false },
  generatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AISafetyTip', aiSafetyTipSchema);