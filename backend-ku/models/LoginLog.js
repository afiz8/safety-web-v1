const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  username: String,
  role: String,
  ip: String,
  userAgent: String,
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  loginAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LoginLog', loginLogSchema);