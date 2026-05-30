const mongoose = require('mongoose');

const hazardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: 'Keselamatan' },
  location: { type: String, required: true },
  department: { type: String, default: '' },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'In Progress', 'Mitigated', 'Closed'], default: 'Open' },
  description: { type: String, default: '' },
  mitigation: { type: String, default: '' },
  reportedDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  reportedBy: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hazard', hazardSchema);