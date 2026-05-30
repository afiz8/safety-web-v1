const mongoose = require('mongoose');

const SafeWorkHourSchema = new mongoose.Schema({
  bulanTahun: { type: String, required: true },   // contoh: "jan 2024"
  totalJam: { type: Number, required: true },     // contoh: 1
  catatan: { type: String, default: '' }          // opsional
}, { timestamps: true });

module.exports = mongoose.model('SafeWorkHour', SafeWorkHourSchema);