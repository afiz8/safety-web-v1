const mongoose = require('mongoose');

const izinKerjaSchema = new mongoose.Schema({
  jenis: { type: String },
  lokasi: { type: String },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  status: { type: String, default: 'Menunggu' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IzinKerja', izinKerjaSchema);