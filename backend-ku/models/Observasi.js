const mongoose = require('mongoose');

const observasiSchema = new mongoose.Schema({
  type: { type: String, enum: ['Positive', 'Negative', 'Opportunity'], default: 'Positive' },
  description: { type: String, required: true },
  location: String,
  locationGps: { lat: Number, lng: Number },
  observedBy: String,
  observedById: String,
  date: Date,
  photo: String,
  status: { type: String, enum: ['Open', 'Reviewed', 'Closed'], default: 'Open' },
  followUp: String,
  relatedModule: { type: String, enum: ['NearMiss', 'APD', 'Insiden', 'None'], default: 'None' },
  relatedId: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Observasi', observasiSchema);