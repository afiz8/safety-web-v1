const mongoose = require('mongoose');

const ruleActionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  icon: { type: String, default: '✅' },
  steps: [{ type: String }],
  resources: [{ type: String }]
});

const visionRuleSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  title: { type: String, required: true },
  icon: { type: String, required: true },
  iconType: { type: String, default: 'FaBullseye' },
  shortDesc: { type: String },
  longDesc: { type: String, required: true },
  actions: [ruleActionSchema],
  videoUrl: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  color: { type: String, default: 'from-green-500 to-emerald-500' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VisionRule', visionRuleSchema);