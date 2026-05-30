const mongoose = require('mongoose');
const JamKerjaSelamatSchema = new mongoose.Schema({
  site: { type: String, required: true, enum: ['Site A', 'Site B', 'Site C', 'Site D'] },
  date: { type: String, required: true },
  hours: { type: Number, required: true, min: 0 },
  status: { type: String, default: 'Safe' }
}, { timestamps: true });
module.exports = mongoose.model('JamKerjaSelamat', JamKerjaSelamatSchema);