const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  tipe: { type: String, enum: ['FIRST-AID', 'MEDICAL-TREATMENT'], default: 'FIRST-AID' },
  nama: { type: String, required: true },
  lokasi: { type: String, required: true },
  tanggal: { type: String, default: () => new Date().toISOString().split('T')[0] },
  kronologi: { type: String, default: '' },
  tindakan: { type: String, default: '' },
  status: { type: String, enum: ['Open', 'In Progress', 'Closed'], default: 'Open' },
  prioritas: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  fileFoto1: { type: String, default: '' },
  createdBy: { type: String, default: 'anonymous' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Incident', incidentSchema);