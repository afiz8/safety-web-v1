const mongoose = require('mongoose');

const kontraktorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pic: String,
  phone: String,
  project: String,
  startDate: Date,
  endDate: Date,
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Kontraktor', kontraktorSchema);