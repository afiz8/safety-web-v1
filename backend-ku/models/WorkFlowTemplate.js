const mongoose = require('mongoose');

const templateStepSchema = new mongoose.Schema({
  name: { type: String, required: true },
  order: { type: Number, required: true },
  requiredRole: { type: String },
  estimatedDuration: { type: Number, default: 0 },
  requiredDocuments: [{ type: String }],
  instructions: { type: String }
});

const workflowTemplateSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  steps: [templateStepSchema],
  defaultApprovers: [{ role: String, order: Number }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WorkflowTemplate', workflowTemplateSchema);