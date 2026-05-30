const mongoose = require('mongoose');

const locationHazardSchema = new mongoose.Schema({
  sectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sector', required: true },
  sectorName: { type: String },
  area: { type: String, required: true },
  subArea: { type: String },
  coordinates: { lat: Number, lng: Number },
  hazards: [{
    name: { type: String },
    level: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'] },
    description: { type: String }
  }],
  riskScore: { type: Number, min: 0, max: 100, default: 0 },
  lastInspection: { type: Date },
  nextInspection: { type: Date },
  status: { type: String, enum: ['Safe', 'Caution', 'Warning', 'Danger'], default: 'Safe' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LocationHazard', locationHazardSchema);