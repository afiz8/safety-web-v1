const mongoose = require('mongoose');

const alatPelindungDiriSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  stok: { type: Number, default: 0 },
  tanggalKadaluarsa: Date,
  lokasi: String,
  assignedTo: String,
  kategori: { 
    type: String, 
    enum: ['Helm', 'Sarung Tangan', 'Kacamata', 'Rompi', 'Sepatu', 'Lainnya'], 
    default: 'Lainnya' 
  },
  qrCode: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AlatPelindungDiri', alatPelindungDiriSchema);