const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema({
  name: String,
  checked: Boolean,
  photo: String,
  note: String
});

const safetyChecklistSchema = new mongoose.Schema({
  template: { type: String, required: true },
  location: String,
  latitude: Number,
  longitude: Number,
  items: [checklistItemSchema],
  reporter: String,
  reporterId: String,
  date: Date,
  passRate: Number,
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  status: { type: String, enum: ['Completed', 'Failed', 'NeedsReview'], default: 'Completed' },
  relatedObservationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Observasi' },
  relatedNearMissId: { type: mongoose.Schema.Types.ObjectId, ref: 'NearMiss' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SafetyChecklist', safetyChecklistSchema);