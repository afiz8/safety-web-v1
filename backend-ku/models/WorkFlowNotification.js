const mongoose = require('mongoose');

const workflowNotificationSchema = new mongoose.Schema({
  workflowId: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String },
  type: { type: String, enum: ['assignment', 'approval', 'comment', 'status_change', 'due_date'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  actionUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

workflowNotificationSchema.index({ userId: 1, isRead: 1 });
workflowNotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('WorkflowNotification', workflowNotificationSchema);