const mongoose = require('mongoose');

const nearMissSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, default: 'Near Miss' },
  severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  description: String,
  location: String,
  locationGps: { lat: Number, lng: Number },
  reporter: String,
  reporterId: String,
  assignedTo: String,
  assignedName: String,
  photos: [String],
  status: { type: String, enum: ['Open', 'Investigating', 'Closed'], default: 'Open' },
  actionTaken: String,
  date: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NearMiss', nearMissSchema);