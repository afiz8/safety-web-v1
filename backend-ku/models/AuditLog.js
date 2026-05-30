const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: String, required: true },
  userId: { type: String, required: true },
  role: { type: String, required: true },
  module: { type: String, required: true },
  type: { type: String, enum: ['create', 'update', 'delete', 'login', 'approval'], required: true },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);