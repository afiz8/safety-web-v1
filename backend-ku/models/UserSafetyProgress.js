const mongoose = require('mongoose');

const userSafetyProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String },
  readMoments: [{ 
    momentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SafetyMoment' },
    readAt: { type: Date, default: Date.now },
    completed: { type: Boolean, default: true },
    timeSpent: { type: Number, default: 0 }
  }],
  totalReadCount: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastReadDate: { type: Date },
  dailyGoal: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserSafetyProgress', userSafetyProgressSchema);