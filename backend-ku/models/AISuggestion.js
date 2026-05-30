// models/AISuggestion.js
const mongoose = require('mongoose');

const aiSuggestionSchema = new mongoose.Schema({
  module: { type: String, required: true },
  type: { type: String, enum: ['empty', 'loading', 'error', 'offline', 'maintenance'] },
  suggestion: { type: String, required: true },
  context: { type: mongoose.Schema.Types.Mixed },
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AISuggestion', aiSuggestionSchema);