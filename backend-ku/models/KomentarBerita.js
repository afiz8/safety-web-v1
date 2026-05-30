const mongoose = require('mongoose');

const komentarBeritaSchema = new mongoose.Schema({
  newsId: { type: mongoose.Schema.Types.ObjectId, ref: 'News', required: true },
  userId: String,
  userName: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('KomentarBerita', komentarBeritaSchema);