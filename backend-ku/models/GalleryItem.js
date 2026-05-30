const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  filename: { type: String, required: true },
  type: { type: String, enum: ['image', 'video'], required: true },
  category: { type: String, default: 'Kegiatan' },
  description: { type: String, default: '' },
  path: { type: String, required: true },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GalleryItem', galleryItemSchema);