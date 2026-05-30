const mongoose = require('mongoose');

const apdSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  stok: { type: Number, default: 0 },
  tanggalKadaluarsa: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('APD', apdSchema);