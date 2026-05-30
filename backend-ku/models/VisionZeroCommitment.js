const mongoose = require('mongoose');

const commitmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  target: { type: String },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VisionCommitment', commitmentSchema);