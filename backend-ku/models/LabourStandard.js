const mongoose = require('mongoose');

const labourStandardSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  year: Number,
  title: String,
  description: String,
  status: { type: String, enum: ['ratified', 'not-ratified'], default: 'not-ratified' },
  ratifiedDate: String,
  keyPoints: [String],
  category: { type: String, enum: ['K3', 'Hak Pekerja', 'Kesetaraan', 'Lainnya'], default: 'K3' },
  sourceUrl: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LabourStandard', labourStandardSchema);