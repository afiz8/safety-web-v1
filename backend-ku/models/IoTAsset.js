const mongoose = require('mongoose');

const ioTAssetSchema = new mongoose.Schema({
  assetId: { type: String, required: true, unique: true },
  name: String,
  type: { type: String, enum: ['APD', 'Alat Pemadam', 'Sensor Gas', 'Lokasi Pekerja'], default: 'Sensor' },
  location: { lat: Number, lng: Number, name: String },
  status: { type: String, enum: ['normal', 'warning', 'danger'], default: 'normal' },
  lastSeen: Date,
  battery: Number,
  value: Number, // misal kadar gas, suhu
  unit: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IoTAsset', ioTAssetSchema);