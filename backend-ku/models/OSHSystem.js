const mongoose = require('mongoose');

// ==================== SCHEMA UNTUK OSH SYSTEMS ====================

// Statistik Dashboard
const dashboardStatsSchema = new mongoose.Schema({
  incidents: {
    total: { type: Number, default: 0 },
    highRisk: { type: Number, default: 0 },
    lowRisk: { type: Number, default: 0 },
    trend: { type: String, default: '0' }
  },
  nearMiss: {
    total: { type: Number, default: 0 },
    highRisk: { type: Number, default: 0 },
    trend: { type: String, default: '0' }
  },
  observations: {
    total: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    positive: { type: Number, default: 0 },
    trend: { type: String, default: '0' }
  },
  medical: {
    total: { type: Number, default: 0 },
    critical: { type: Number, default: 0 },
    minor: { type: Number, default: 0 },
    trend: { type: String, default: '0' }
  },
  apdCompliance: { type: Number, default: 85 },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Implementasi Sistem K3 (untuk OSHManagementSystems)
const oshImplementationSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  systemType: { type: String, enum: ['iso45001', 'iloosh', 'smk3'], default: 'iso45001' },
  status: { type: String, enum: ['Not Started', 'Planning', 'Implementation', 'Audit', 'Certified'], default: 'Not Started' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  startDate: { type: Date },
  targetDate: { type: Date },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Audit K3
const oshAuditSchema = new mongoose.Schema({
  auditType: { type: String, enum: ['Internal', 'External', 'Certification'], default: 'Internal' },
  systemType: { type: String, enum: ['iso45001', 'iloosh', 'smk3'], default: 'iso45001' },
  auditDate: { type: Date, required: true },
  auditor: { type: String },
  scope: { type: String },
  findings: [{ type: String }],
  recommendations: [{ type: String }],
  status: { type: String, enum: ['Scheduled', 'In Progress', 'Completed', 'Closed'], default: 'Scheduled' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Pelatihan K3
const oshTrainingSchema = new mongoose.Schema({
  trainingName: { type: String, required: true },
  systemType: { type: String, enum: ['iso45001', 'iloosh', 'smk3'], default: 'iso45001' },
  trainingDate: { type: Date, required: true },
  duration: { type: String },
  trainer: { type: String },
  participants: [{ type: String }],
  certificateId: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Risk Assessment
const oshRiskAssessmentSchema = new mongoose.Schema({
  activity: { type: String, required: true },
  location: { type: String },
  department: { type: String },
  assessedBy: { type: String },
  assessmentDate: { type: Date, default: Date.now },
  hazards: [{
    description: String,
    likelihood: { type: String, enum: ['Low', 'Medium', 'High'] },
    severity: { type: String, enum: ['Low', 'Medium', 'High'] },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Extreme'] },
    controlMeasure: String
  }],
  overallRiskScore: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Recent Activities
const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  action: { type: String, required: true },
  module: { type: String },
  details: { type: String },
  ipAddress: { type: String }
}, { timestamps: true });

// AI Recommendations
const aiRecommendationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  action: { type: String },
  isRead: { type: Boolean, default: false },
  expiresAt: { type: Date }
}, { timestamps: true });

// ==================== EXPORT MODELS ====================
module.exports = {
  DashboardStats: mongoose.model('DashboardStats', dashboardStatsSchema),
  OSHImplementation: mongoose.model('OSHImplementation', oshImplementationSchema),
  OSHAudit: mongoose.model('OSHAudit', oshAuditSchema),
  OSHTraining: mongoose.model('OSHTraining', oshTrainingSchema),
  OSHRiskAssessment: mongoose.model('OSHRiskAssessment', oshRiskAssessmentSchema),
  Activity: mongoose.model('Activity', activitySchema),
  AIRecommendation: mongoose.model('AIRecommendation', aiRecommendationSchema)
};