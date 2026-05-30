const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  name: { type: String, required: true },
  workers: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  risk: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  createdBy: { type: String, default: 'anonymous' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);