const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  date: { type: String, required: true }, // format YYYY-MM-DD
  checkIn: { type: String },
  checkOut: { type: String },
  status: { type: String, default: 'Hadir' },
  note: { type: String },
  method: { type: String, default: 'face-recognition' },
  location: {
    lat: Number,
    lng: Number,
    accuracy: Number
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attendance', attendanceSchema);