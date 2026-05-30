// models/Psychosocial.js
const mongoose = require('mongoose');

// Mood Check Schema
const moodCheckSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mood: { type: String, enum: ['great', 'good', 'neutral', 'stressed', 'exhausted'], required: true },
  score: { type: Number, min: 1, max: 5, required: true },
  emoji: { type: String },
  report: { type: String },
  date: { type: Date, default: Date.now }
});

// Burnout Analysis Schema
const burnoutAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  risk: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  score: { type: Number, min: 0, max: 100 },
  insight: { type: String },
  date: { type: Date, default: Date.now },
  isResolved: { type: Boolean, default: false }
});

// Wellbeing Reminder Schema
const wellbeingReminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String },
  frequency: { type: String, enum: ['daily', 'weekly', 'custom'], default: 'daily' },
  time: { type: String, default: '14:00' },
  isActive: { type: Boolean, default: true },
  lastSent: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Stress Report Schema (for department heatmap)
const stressReportSchema = new mongoose.Schema({
  department: { type: String, required: true },
  score: { type: Number, min: 0, max: 100 },
  employeeCount: { type: Number, default: 0 },
  period: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
  date: { type: Date, default: Date.now }
});

// Indexes
moodCheckSchema.index({ userId: 1, date: -1 });
burnoutAnalysisSchema.index({ userId: 1, date: -1 });

module.exports = {
  MoodCheck: mongoose.model('MoodCheck', moodCheckSchema),
  BurnoutAnalysis: mongoose.model('BurnoutAnalysis', burnoutAnalysisSchema),
  WellbeingReminder: mongoose.model('WellbeingReminder', wellbeingReminderSchema),
  StressReport: mongoose.model('StressReport', stressReportSchema)
};