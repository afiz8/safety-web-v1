// models/NotificationSetting.js
const mongoose = require('mongoose');

// Notification Settings Schema
const notificationSettingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Channel Settings
  waNumber: { type: String, default: '' },
  emailAddress: { type: String, default: '' },
  
  channels: {
    whatsapp: { 
      enabled: { type: Boolean, default: true }, 
      primaryNumber: { type: String, default: '' }
    },
    email: { 
      enabled: { type: Boolean, default: false }, 
      address: { type: String, default: '' }
    },
    push: { 
      enabled: { type: Boolean, default: true }, 
      desktop: { type: Boolean, default: true }, 
      mobile: { type: Boolean, default: true }
    },
    sound: { 
      enabled: { type: Boolean, default: true }, 
      volume: { type: Number, default: 70, min: 0, max: 100 }, 
      customSound: { type: Boolean, default: false },
      soundFile: { type: String, default: '' }
    }
  },
  
  // Category Settings
  categories: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, default: 'FaBell' },
    color: { type: String, default: 'blue' },
    enabled: { type: Boolean, default: true },
    priority: { 
      type: String, 
      enum: ['critical', 'high', 'medium', 'low'], 
      default: 'medium' 
    },
    sound: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false },
    email: { type: Boolean, default: false }
  }],
  
  // AI Filter Settings
  aiSettings: {
    enabled: { type: Boolean, default: true },
    filterSpam: { type: Boolean, default: true },
    smartGrouping: { type: Boolean, default: true },
    priorityDetection: { type: Boolean, default: true },
    autoMute: { type: Boolean, default: false },
    autoMuteStart: { type: String, default: '20:00' },
    autoMuteEnd: { type: String, default: '06:00' },
    muteWeekends: { type: Boolean, default: false }
  },
  
  // Schedule Settings (Do Not Disturb)
  schedule: {
    enabled: { type: Boolean, default: false },
    startTime: { type: String, default: '22:00' },
    endTime: { type: String, default: '07:00' },
    daysOff: [{ type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }],
    timezone: { type: String, default: 'Asia/Jakarta' }
  },
  
  // Advanced Settings
  advanced: {
    maxPerHour: { type: Number, default: 10 },
    cooldownMinutes: { type: Number, default: 5 },
    digestEnabled: { type: Boolean, default: false },
    digestHour: { type: Number, default: 8 },
    criticalAlwaysSend: { type: Boolean, default: true }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
notificationSettingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('NotificationSetting', notificationSettingSchema);