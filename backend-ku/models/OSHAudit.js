const mongoose = require('mongoose');

const oshAuditSchema = new mongoose.Schema({
  auditType: { type: String, enum: ['Internal', 'External', 'Certification'], required: true },
  systemType: { type: String, enum: ['iso45001', 'iloosh', 'smk3'], required: true },
  auditDate: Date,
  auditor: String,
  auditorId: String,
  scope: String,
  findings: [
    {
      clause: String,
      description: String,
      severity: { type: String, enum: ['Major', 'Minor', 'Observation'], default: 'Minor' },
      correctiveAction: String,
      status: { type: String, enum: ['Open', 'In Progress', 'Closed'], default: 'Open' },
      dueDate: Date,
      closedDate: Date
    }
  ],
  conclusion: String,
  recommendation: String,
  nextAuditDate: Date,
  documents: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OSHAudit', oshAuditSchema);