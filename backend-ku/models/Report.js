const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['Incident', 'Near Miss', 'Observation', 'Hazard', 'Inspection'], required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  description: String,
  location: String,
  locationGps: { lat: Number, lng: Number },
  photo: String,
  voiceNote: String,
  checklistId: { type: mongoose.Schema.Types.ObjectId, ref: 'SafetyChecklist' },
  observationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Observasi' },
  nearMissId: { type: mongoose.Schema.Types.ObjectId, ref: 'NearMiss' },
  reporter: String,
  reporterId: String,
  assignedTo: String,
  assignedToId: String,
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  autoDetectedHazards: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);