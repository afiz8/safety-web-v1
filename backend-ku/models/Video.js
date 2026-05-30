const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  url: { type: String, required: true },
  thumbnail: String,
  duration: Number,
  category: { type: String, enum: ['Safety', 'Training', 'Incident', 'Toolbox', 'Emergency'], default: 'Safety' },
  tags: [String],
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  quiz: {
    question: String,
    options: [String],
    correctAnswer: Number,
    explanation: String
  },
  uploadedBy: String,
  uploadedById: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', videoSchema);