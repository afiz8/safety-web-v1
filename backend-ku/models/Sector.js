const mongoose = require('mongoose');

const hazardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
  description: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  icon: { type: String, default: '⚠️' }
});

const controlSchema = new mongoose.Schema({
  name: { type: String, required: true },
  steps: [{ type: String }],
  apdRequired: [{ type: String }],
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' }
});

const sectorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  icon: { type: String, default: '🏭' },
  iconType: { type: String, default: 'industry' },
  riskLevel: { type: String, enum: ['Very High', 'High', 'Medium', 'Low'], default: 'Medium' },
  color: { type: String, default: 'from-red-500 to-red-600' },
  stats: {
    fatalities: { type: String, default: '0%' },
    injuries: { type: String, default: '0%' },
    workers: { type: String, default: '0' },
    ltiRate: { type: Number, default: 0 },
    fatalityRate: { type: Number, default: 0 }
  },
  hazards: [hazardSchema],
  controls: [controlSchema],
  locations: [{
    name: { type: String },
    coordinates: { lat: Number, lng: Number },
    hazardLevel: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'] },
    hazards: [{ type: String }]
  }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sector', sectorSchema);