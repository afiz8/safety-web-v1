const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  path: { type: String, required: true },
  url: { type: String, required: true },
  uploadedBy: { type: String, default: 'unknown' },
  uploadedAt: { type: Date, default: Date.now },
  relatedId: { type: String, default: '' } // opsional: untuk kaitkan ke kontrak/insiden/dll
});

module.exports = mongoose.model('File', fileSchema);