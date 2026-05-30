const mongoose = require('mongoose');

const medicalCaseSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  patientId: String,
  age: Number,
  gender: { type: String, enum: ['Laki-laki', 'Perempuan', 'Lainnya'] },
  incidentDate: { type: Date, default: Date.now },
  incidentLocation: String,
  locationGps: { lat: Number, lng: Number },
  caseType: { type: String, enum: ['First Aid', 'Medical Treatment', 'Emergency', 'Referral'], default: 'First Aid' },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  description: String,
  injuries: [String],
  treatment: String,
  status: { type: String, enum: ['Open', 'In Progress', 'Closed', 'Referred'], default: 'Open' },
  assignedTo: String, // dokter/paramedis ID
  assignedName: String,
  photos: [String],
  reportedBy: String,
  reportedByName: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MedicalCase', medicalCaseSchema);