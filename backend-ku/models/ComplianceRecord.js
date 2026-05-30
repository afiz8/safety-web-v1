const mongoose = require('mongoose');

const complianceRecordSchema = new mongoose.Schema({
  standardId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabourStandard', required: true },
  userId: { type: String, required: true }, // bisa dari session user
  companyName: String,
  status: { type: String, enum: ['compliant', 'non-compliant', 'partial'], default: 'non-compliant' },
  evidence: String, // bukti kepatuhan
  assessedAt: { type: Date, default: Date.now },
  dueDate: Date,
  notes: String,
  attachments: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ComplianceRecord', complianceRecordSchema);