const mongoose = require('mongoose');

const userActivityLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String },
  action: { type: String, enum: ['login', 'logout', 'create', 'update', 'delete', 'view', 'export'], required: true },
  module: { type: String, enum: ['User', 'Report', 'Safety', 'Training', 'APD', 'Attendance'], required: true },
  description: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['success', 'failed'], default: 'success' }
});

userActivityLogSchema.index({ userId: 1 });
userActivityLogSchema.index({ timestamp: -1 });
userActivityLogSchema.index({ action: 1 });

module.exports = mongoose.model('UserActivityLog', userActivityLogSchema);