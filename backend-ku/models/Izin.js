// models/Izin.js
const mongoose = require('mongoose');

const IzinSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true }, // custom ID (Date.now())
  jenis: { type: String, required: true },
  lokasi: { type: String, required: true },
  deskripsi: { type: String, required: true },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  status: { type: String, enum: ['Draft', 'Menunggu', 'Disetujui', 'Ditolak', 'Selesai'], default: 'Menunggu' },
  approver: { type: String, default: '' },
  tanggalMulai: { type: String, required: true },
  tanggalSelesai: { type: String, required: true },
  expiry: { type: String, default: '' },
  namaPekerja: { type: String, default: '' },
  pengaju: { type: String, required: true },
  tanggalPengajuan: { type: String, default: () => new Date().toISOString() }
}, { timestamps: true }); // tambahkan createdAt & updatedAt otomatis

module.exports = mongoose.model('Izin', IzinSchema);