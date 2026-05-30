const mongoose = require('mongoose');

const oshTrainingSchema = new mongoose.Schema({
  trainingName: { type: String, required: true },
  systemType: { type: String, enum: ['iso45001', 'iloosh', 'smk3'], required: true },
  trainingDate: Date,
  duration: String,
  participants: [
    {
      userId: String,
      userName: String,
      department: String,
      attendance: { type: Boolean, default: false },
      certificate: String
    }
  ],
  trainer: String,
  material: [String],
  evaluation: {
    averageScore: Number,
    feedback: String
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OSHTraining', oshTrainingSchema);