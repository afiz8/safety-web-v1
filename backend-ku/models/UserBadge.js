const mongoose = require('mongoose');

const userBadgeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  badgeType: { type: String, enum: ['SafetyMaster', 'QuizChampion', 'ConsistentViewer', 'TopLearner'], required: true },
  earnedAt: { type: Date, default: Date.now },
  points: { type: Number, default: 0 }
});

module.exports = mongoose.model('UserBadge', userBadgeSchema);