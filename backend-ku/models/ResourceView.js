const mongoose = require('mongoose');

const resourceViewSchema = new mongoose.Schema({
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  userId: String,
  action: { type: String, enum: ['view', 'download'], default: 'view' },
  createdAt: { type: Date, default: Date.now }
});

// ✅ CEK APAKAH MODEL SUDAH ADA SEBELUM MEMBUAT BARU
module.exports = mongoose.models.ResourceView || mongoose.model('ResourceView', resourceViewSchema);