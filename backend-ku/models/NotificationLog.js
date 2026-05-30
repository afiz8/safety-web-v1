// models/NotificationLog.js
const mongoose = require('mongoose');

// Notification Log Schema (untuk tracking pengiriman)
const notificationLogSchema = new mongoose.Schema({
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'NotificationMessage' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  channel: { type: String, enum: ['whatsapp', 'email', 'push', 'sound', 'sms'] },
  status: { type: String, enum: ['pending', 'sent', 'failed', 'delivered', 'read'], default: 'pending' },
  response: { type: String },
  error: { type: String },
  attempts: { type: Number, default: 0 },
  sentAt: { type: Date },
  deliveredAt: { type: Date },
  readAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now }
});

notificationLogSchema.index({ notificationId: 1 });
notificationLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);