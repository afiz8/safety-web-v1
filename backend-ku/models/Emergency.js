// models/Emergency.js
const mongoose = require('mongoose');

// Emergency Log Schema
const emergencyLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  action: { type: String, enum: ['EMERGENCY_ACTIVATED', 'EVACUATION_COMPLETED', 'ALERT_RESOLVED'] },
  level: { type: String, enum: ['green', 'yellow', 'red'], default: 'red' },
  location: {
    lat: Number,
    lng: Number
  },
  timestamp: { type: Date, default: Date.now },
  details: { type: String }
});

// Fire Sensor Schema
const fireSensorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String },
  coordinates: {
    lat: Number,
    lng: Number
  },
  status: { type: String, enum: ['normal', 'warning', 'alert'], default: 'normal' },
  temperature: { type: Number, default: 25 },
  smokeLevel: { type: Number, default: 0, min: 0, max: 100 },
  batteryLevel: { type: Number, default: 100 },
  lastSeen: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// Evacuation Point Schema
const evacuationPointSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String },
  coordinates: {
    lat: Number,
    lng: Number
  },
  capacity: { type: Number, default: 100 },
  currentOccupancy: { type: Number, default: 0 },
  type: { type: String, enum: ['exit', 'assembly_point', 'shelter'], default: 'exit' },
  isActive: { type: Boolean, default: true }
});

// Emergency Broadcast Schema
const emergencyBroadcastSchema = new mongoose.Schema({
  message: { type: String, required: true },
  level: { type: String, enum: ['green', 'yellow', 'red'], default: 'red' },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentTo: [{ type: String }], // user IDs or 'all'
  timestamp: { type: Date, default: Date.now },
  isAcknowledged: { type: Boolean, default: false },
  acknowledgedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

// Export models
module.exports = {
  EmergencyLog: mongoose.model('EmergencyLog', emergencyLogSchema),
  FireSensor: mongoose.model('FireSensor', fireSensorSchema),
  EvacuationPoint: mongoose.model('EvacuationPoint', evacuationPointSchema),
  EmergencyBroadcast: mongoose.model('EmergencyBroadcast', emergencyBroadcastSchema)
};