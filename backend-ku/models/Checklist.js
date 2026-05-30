const mongoose = require('mongoose');

const checklistSchema = new mongoose.Schema({
  name: { type: String, required: true },
  passRate: { type: Number, default: 0 },
  status: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Checklist', checklistSchema);