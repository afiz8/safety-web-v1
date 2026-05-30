const mongoose = require('mongoose');

const workflowStepSchema = new mongoose.Schema({
  stepId: { type: String, required: true },
  name: { type: String, required: true },
  order: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'rejected'], default: 'pending' },
  assignedTo: { type: String },
  assignedToName: { type: String },
  completedAt: { type: Date },
  notes: { type: String },
  attachments: [{ name: String, url: String, uploadedAt: Date }],
  startedAt: { type: Date },
  duration: { type: Number, default: 0 }
});

const workflowSchema = new mongoose.Schema({
  workflowId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['PTW', 'Incident', 'Compliance', 'Training', 'APD', 'Inspection'], required: true },
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Draft', 'Pending', 'In Review', 'Approved', 'Rejected', 'Completed', 'Cancelled'], default: 'Draft' },
  currentStep: { type: Number, default: 0 },
  steps: [workflowStepSchema],
  createdBy: { type: String, required: true },
  createdByName: { type: String },
  assignedTo: { type: String },
  assignedToName: { type: String },
  department: { type: String },
  location: { type: String },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
  attachments: [{ name: String, url: String, uploadedAt: Date }],
  comments: [{
    userId: String,
    userName: String,
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  approvals: [{
    userId: String,
    userName: String,
    role: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comment: String,
    approvedAt: Date
  }],
  metadata: { type: Map, of: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  dueDate: { type: Date }
});

// Index untuk performance
workflowSchema.index({ workflowId: 1 });
workflowSchema.index({ status: 1 });
workflowSchema.index({ type: 1 });
workflowSchema.index({ assignedTo: 1 });
workflowSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Workflow', workflowSchema);