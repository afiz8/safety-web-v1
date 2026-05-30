const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  company: String,
  interest: { type: String, enum: ['demo', 'info', 'support'], default: 'info' },
  message: String,
  ip: String,
  visitedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Visitor', visitorSchema);