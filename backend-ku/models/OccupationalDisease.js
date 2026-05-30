const mongoose = require('mongoose');

const occupationalDiseaseSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  patientId: String,
  age: Number,
  gender: { type: String, enum: ['Laki-laki', 'Perempuan', 'Lainnya'] },
  diagnosis: { type: String, required: true },
  category: { type: String, enum: ['respiratory', 'musculoskeletal', 'dermatological', 'neurological', 'sensory', 'cancer'], required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  riskFactors: [{ type: String }],
  exposureSource: String,
  exposureDuration: String,
  symptoms: [String],
  diagnosisDate: Date,
  labResults: [String],
  medicalCheckupId: String,
  status: { type: String, enum: ['Active', 'In Treatment', 'Recovered', 'Deceased'], default: 'Active' },
  assignedDoctor: String,
  assignedDoctorId: String,
  notes: String,
  company: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OccupationalDisease', occupationalDiseaseSchema);