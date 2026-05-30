const mongoose = require('mongoose');

const hazardSchema = new mongoose.Schema({
  id: Number,
  description: String,
  likelihood: { type: String, enum: ['Low', 'Medium', 'High'] },
  severity: { type: String, enum: ['Low', 'Medium', 'High'] },
  initialRisk: { type: String, enum: ['Low', 'Medium', 'High'] },
  controls: String,
  residualRisk: { type: String, enum: ['Low', 'Medium', 'High'] }
});

const jsaSchema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  location: String,
  date: String,
  teamMembers: String,
  hazards: [hazardSchema],
  overallRisk: { type: String, enum: ['Low', 'Medium', 'High'] },
  supervisorApproval: String,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  userId: String,
  additionalNotes: String,
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JSA', jsaSchema);