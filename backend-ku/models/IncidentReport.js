const mongoose = require('mongoose');

const incidentReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  jenis: { type: String, default: 'Near Miss' },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Fatal'], default: 'Low' },
  deskripsi: { type: String, default: '' },
  lokasi: { type: String, required: true },
  injured: { type: String, default: '' },
  rootCause: { type: String, default: '' },
  tindakLanjut: { type: String, default: '' },
  tanggal: { type: String, default: () => new Date().toISOString().split('T')[0] },
  reporter: { type: String, default: '' },
  pelapor: { type: String, default: '' },
  createdBy: { type: String, default: 'anonymous' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IncidentReport', incidentReportSchema);