const mongoose = require('mongoose');

const mitraKerjaSchema = new mongoose.Schema({
  namaPerusahaan: { type: String, required: true },
  bidangUsaha: String,
  pic: String,
  nomorKontak: String,
  tanggalMulai: Date,
  tanggalAkhir: Date,
  statusKualifikasi: { type: String, enum: ['Terdaftar', 'Disetujui', 'Diblacklist'], default: 'Terdaftar' },
  dokumen: [String],
  ratingK3: { type: Number, min: 1, max: 5, default: 5 },
  komentarK3: String,
  blacklist: { type: Boolean, default: false },
  qrCode: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MitraKerja', mitraKerjaSchema);