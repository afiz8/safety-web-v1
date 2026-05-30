const mongoose = require('mongoose');

const hazardReportSchema = new mongoose.Schema({
  sectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sector', required: true },
  sectorName: { type: String },
  location: { type: String, required: true },
  coordinates: { lat: Number, lng: Number },
  hazardType: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
  imageUrl: { type: String, default: '' },
  reporter: { type: String, required: true },
  reporterId: { type: String, required: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  aiAnalysis: {
    detectedHazards: [{ type: String }],
    recommendedApd: [{ type: String }],
    confidence: { type: Number, default: 0 },
    analyzedAt: { type: Date }
  },
  assignedTo: { type: String },
  resolvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HazardReport', hazardReportSchema);