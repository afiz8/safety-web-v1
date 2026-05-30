const mongoose = require('mongoose');

const siteContentSchema = new mongoose.Schema({
  pageId: { type: String, required: true },      // halaman (misal: 'dashboard', 'profil')
  sectionId: { type: String, required: true },   // id unik dalam halaman
  data: { type: mongoose.Schema.Types.Mixed, required: true }, // data JSON apapun
  updatedBy: { type: String, default: 'admin' },
  updatedAt: { type: Date, default: Date.now }
});

// Compound unique index agar kombinasi pageId+sectionId unik
siteContentSchema.index({ pageId: 1, sectionId: 1 }, { unique: true });

module.exports = mongoose.model('SiteContent', siteContentSchema);