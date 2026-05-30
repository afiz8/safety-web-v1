const mongoose = require('mongoose');

const userBookmarkSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  createdAt: { type: Date, default: Date.now }
});

// ✅ CEK APAKAH MODEL SUDAH ADA SEBELUM MEMBUAT BARU
module.exports = mongoose.models.UserBookmark || mongoose.model('UserBookmark', userBookmarkSchema);