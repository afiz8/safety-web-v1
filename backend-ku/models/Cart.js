const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  namaProduk: { type: String, required: true },
  harga: { type: Number, required: true },
  qty: { type: Number, default: 1, min: 1 },
  warna: { type: String, default: '' },
  gambar: { type: String, default: '' }
});

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [cartItemSchema],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', cartSchema);