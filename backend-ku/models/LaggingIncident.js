const mongoose = require('mongoose');

const laggingIncidentSchema = new mongoose.Schema({
  incidentId: { type: String, unique: true },
  type: { 
    type: String, 
    enum: ['Near Miss', 'Lost Time Injury', 'Medical Treatment', 'First Aid', 'Property Damage', 'Fatality'],
    default: 'Near Miss'
  },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  project: { type: String, default: 'General' },
  status: { type: String, enum: ['Closed', 'Investigating', 'Open'], default: 'Open' },
  description: String,
  reportedBy: String,
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LaggingIncident', laggingIncidentSchema);