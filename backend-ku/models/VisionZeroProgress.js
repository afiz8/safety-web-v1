const mongoose = require('mongoose');

const userQuizAttemptSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'VisionQuiz' },
  score: { type: Number },
  passed: { type: Boolean, default: false },
  answers: [{ questionIndex: Number, selectedAnswer: Number, isCorrect: Boolean }],
  timeSpent: { type: Number },
  completedAt: { type: Date, default: Date.now }
});

const userBadgeSchema = new mongoose.Schema({
  badgeId: { type: String, required: true },
  name: { type: String, required: true },
  icon: { type: String },
  earnedAt: { type: Date, default: Date.now },
  description: { type: String }
});

const visionProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String },
  viewedRules: [{ ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'VisionRule' }, viewedAt: Date }],
  completedQuizzes: [userQuizAttemptSchema],
  earnedBadges: [userBadgeSchema],
  safetyScore: { type: Number, default: 0 },
  dailyStreak: { type: Number, default: 0 },
  lastActivityDate: { type: Date },
  shareCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VisionProgress', visionProgressSchema);