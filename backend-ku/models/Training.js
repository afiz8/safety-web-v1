// models/Training.js
const mongoose = require('mongoose');

// ==================== SCHEMA TRAINING ====================
const trainingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['fire_safety', 'first_aid', 'apd', 'hse', 'general'],
    default: 'general'
  },
  description: { type: String },
  instructor: { type: String, required: true },
  duration: { type: String }, // contoh: "2 hari", "4 jam"
  durationHours: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  timeSlot: { type: String }, // "09:00 - 17:00"
  location: { type: String },
  maxParticipants: { type: Number, default: 30 },
  currentParticipants: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  completionRate: { type: Number, default: 0 },
  syllabus: [{
    title: String,
    duration: String,
    description: String
  }],
  materials: [{
    title: String,
    type: { type: String, enum: ['video', 'pdf', 'quiz', 'simulation'] },
    url: String,
    duration: String
  }],
  certificateTemplate: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ==================== SCHEMA ENROLLMENT ====================
const enrollmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trainingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Training', required: true },
  enrollmentDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['Enrolled', 'In Progress', 'Completed', 'Dropped', 'Certified'],
    default: 'Enrolled'
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  quizScores: [{
    quizId: String,
    score: Number,
    maxScore: Number,
    completedAt: Date
  }],
  attendance: [{
    date: Date,
    present: { type: Boolean, default: false }
  }],
  certificateIssued: { type: Boolean, default: false },
  certificateNumber: { type: String },
  completedAt: { type: Date },
  notes: { type: String }
}, { timestamps: true });

// Compound index untuk mencegah duplikasi enrollment
enrollmentSchema.index({ userId: 1, trainingId: 1 }, { unique: true });

// ==================== SCHEMA CERTIFICATE ====================
const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trainingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Training', required: true },
  enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' },
  certificateNumber: { type: String, unique: true, required: true },
  issueDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  pdfUrl: { type: String },
  verified: { type: Boolean, default: true },
  issuedBy: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

// ==================== SCHEMA TRAINING CATEGORY ====================
const trainingCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String },
  color: { type: String },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
});

// ==================== SCHEMA AI RECOMMENDATION ====================
const trainingRecommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trainingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Training' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  reason: { type: String },
  isRead: { type: Boolean, default: false },
  isActioned: { type: Boolean, default: false },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// ==================== EXPORT MODELS ====================
module.exports = {
  Training: mongoose.model('Training', trainingSchema),
  Enrollment: mongoose.model('Enrollment', enrollmentSchema),
  Certificate: mongoose.model('Certificate', certificateSchema),
  TrainingCategory: mongoose.model('TrainingCategory', trainingCategorySchema),
  TrainingRecommendation: mongoose.model('TrainingRecommendation', trainingRecommendationSchema)
};