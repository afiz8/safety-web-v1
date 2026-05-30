// models/NotificationMessage.js
const mongoose = require('mongoose');

// Notification Message Schema
const notificationMessageSchema = new mongoose.Schema({
  // Target User
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Notification Content
  title: { type: String, required: true },
  message: { type: String, required: true },
  shortMessage: { type: String, default: '' },
  
  // Category & Priority
  category: { 
    type: String, 
    enum: ['apd', 'observasi', 'nearmiss', 'medical', 'emergency', 'training', 'safety', 'system', 'general'],
    default: 'system' 
  },
  priority: { 
    type: String, 
    enum: ['critical', 'high', 'medium', 'low'], 
    default: 'medium' 
  },
  type: { 
    type: String, 
    enum: ['info', 'warning', 'alert', 'success', 'emergency'], 
    default: 'info' 
  },
  
  // Status
  isRead: { type: Boolean, default: false },
  isSent: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  
  // Delivery Channels
  sentVia: [{ 
    type: String, 
    enum: ['whatsapp', 'email', 'push', 'sound', 'sms'] 
  }],
  
  // Related Data
  relatedId: { type: String, default: '' }, // ID dari module terkait (APD, Insiden, dll)
  relatedModule: { type: String, default: '' }, // Nama module terkait
  actionUrl: { type: String, default: '' }, // URL untuk tindakan
  
  // Metadata
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  // Expiry & Schedule
  expiresAt: { type: Date },
  scheduledAt: { type: Date },
  
  // Timestamps
  readAt: { type: Date },
  sentAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for faster queries
notificationMessageSchema.index({ userId: 1, createdAt: -1 });
notificationMessageSchema.index({ userId: 1, isRead: 1 });
notificationMessageSchema.index({ userId: 1, priority: 1 });
notificationMessageSchema.index({ category: 1, createdAt: -1 });
notificationMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired

// Virtual for age
notificationMessageSchema.virtual('age').get(function() {
  const minutes = Math.floor((Date.now() - this.createdAt) / (1000 * 60));
  if (minutes < 60) return `${minutes} menit lalu`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} jam lalu`;
  return `${Math.floor(minutes / 1440)} hari lalu`;
});

// Method to mark as read
notificationMessageSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
  return this;
};

// Static method to get unread count
notificationMessageSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ userId, isRead: false });
};

module.exports = mongoose.model('NotificationMessage', notificationMessageSchema);