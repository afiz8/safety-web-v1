const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Supervisor', 'Karyawan', 'Manager', 'HSE Officer'], 
    default: 'Karyawan' 
  },
  avatar: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' },
  lastLogin: { type: Date },
  lastLoginIp: { type: String },
  phoneNumber: { type: String },
  department: { type: String },
  position: { type: String },
  joinDate: { type: Date, default: Date.now },
  createdBy: { type: String },
  updatedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index untuk performance
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

module.exports = mongoose.model('User', userSchema);