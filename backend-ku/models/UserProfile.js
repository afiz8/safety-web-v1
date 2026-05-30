// models/UserProfile.js
const mongoose = require('mongoose');

// User Profile Schema (extended)
const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  profilePicture: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  department: { type: String, default: '' },
  position: { type: String, default: '' },
  joinDate: { type: Date, default: Date.now },
  
  // Statistics
  stats: {
    totalObservations: { type: Number, default: 0 },
    totalNearMiss: { type: Number, default: 0 },
    totalTrainings: { type: Number, default: 0 },
    completedTrainings: { type: Number, default: 0 },
    certificates: { type: Number, default: 0 },
    contributionScore: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    rank: { type: String, enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], default: 'Bronze' }
  },
  
  updatedAt: { type: Date, default: Date.now }
});

// Login History Schema
const loginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  device: { type: String, default: '' },
  browser: { type: String, default: '' },
  os: { type: String, default: '' },
  ip: { type: String, default: '' },
  location: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

// User Activity Schema
const userActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['observation', 'nearmiss', 'training', 'certificate', 'login'], default: 'login' },
  module: { type: String, default: '' },
  details: { type: String, default: '' },
  score: { type: Number, default: 0 }
});

// Indexes
loginHistorySchema.index({ userId: 1, timestamp: -1 });
userActivitySchema.index({ userId: 1, date: -1 });

// Export models
const UserProfile = mongoose.model('UserProfile', userProfileSchema);
const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);
const UserActivity = mongoose.model('UserActivity', userActivitySchema);

module.exports = {
  UserProfile,
  LoginHistory,
  UserActivity
};