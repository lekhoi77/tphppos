const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    cakeType: {
        type: String,
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    orderSource: {
        type: String,
        required: true
    },
    orderNotes: String,
    orderPrice: {
        type: Number,
        required: true
    },
    deposit: {
        type: Number,
        default: 0
    },
    orderStatus: {
        type: String,
        enum: ['Đã đặt', 'Đã giao', 'Hủy'],
        default: 'Đã đặt'
    },
    deliveryAddress: String,
    deliveryTime: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Tạo index cho các trường thường được tìm kiếm
orderSchema.index({ orderId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ deliveryTime: 1 });
orderSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Order', orderSchema); 