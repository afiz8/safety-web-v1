const mongoose = require('mongoose');

const sessionLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: String,
  action: { type: String, enum: ['login', 'logout', 'auto_logout', 'force_logout', 'session_expired'], required: true },
  deviceInfo: {
    userAgent: String,
    ip: String,
    platform: String,
    browser: String
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SessionLog', sessionLogSchema);