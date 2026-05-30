const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  namaProduk: { type: String, required: true },
  deskripsi: { type: String, default: '' },
  harga: { type: Number, required: true },
  stok: { type: Number, default: 0 },
  warnaOptions: [{ type: String }],
  gambar: { type: String, default: '' },
  tokoId: { type: String, required: true },
  tokoNama: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);