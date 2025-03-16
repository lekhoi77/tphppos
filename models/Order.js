const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: String,
  cakeType: String,
  customerName: String,
  orderSource: String,
  orderNotes: String,
  orderPrice: Number,
  deposit: Number,
  orderStatus: String,
  deliveryAddress: String,
  deliveryTime: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema); 