const mongoose = require('mongoose');

const safetyMomentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String, enum: ['Fire Safety', 'Electrical', 'Chemical', 'Fall Protection', 'Machine Safety', 'General', 'Emergency', 'Health'], default: 'General' },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  imageUrl: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  audioUrl: { type: String, default: '' },
  duration: { type: Number, default: 30 },
  tags: [{ type: String }],
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SafetyMoment', safetyMomentSchema);