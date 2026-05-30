const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ['expiry', 'violation', 'info', 'warning', 'success'], default: 'info' },
  category: { type: String, enum: ['APD', 'Kontrak', 'Kontraktor', 'Insiden', 'NearMiss', 'JSA', 'Umum'], default: 'Umum' },
  read: { type: Boolean, default: false },
  pinned: { type: Boolean, default: false },
  link: { type: String, default: '' },
  userId: String,
  role: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);