const mongoose = require('mongoose');

const videoWatchHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  watchedAt: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false },
  watchDuration: Number,
  quizScore: Number,
  quizPassed: { type: Boolean, default: false }
});

module.exports = mongoose.model('VideoWatchHistory', videoWatchHistorySchema);