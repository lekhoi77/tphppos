const Order = require('../models/Order');
const TelegramBot = require('node-telegram-bot-api');

const token = '7255950953:AAEqjvhAPS7TTHDu0OgkrDih5Vx8hJ5Mcn0';
const chatId = '1002606332405';
const bot = new TelegramBot(token, { polling: false });

const sendOrderNotification = async (orderData) => {
    const message = `
🎂 *ĐƠN HÀNG MỚI*

📝 *Mã đơn:* ${orderData.orderID}
🍰 *Loại bánh:* ${orderData.cakeType}
👤 *Khách hàng:* ${orderData.customerName}
📱 *Nguồn:* ${orderData.orderSource}
📝 *Nội dung:* ${orderData.orderNotes}
💰 *Tổng tiền:* ${orderData.orderPrice}
💵 *Tiền cọc:* ${orderData.deposit}
📍 *Địa chỉ:* ${orderData.deliveryAddress}
🕒 *Thời gian giao:* ${orderData.deliveryTime}
`;

    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        console.log('Telegram notification sent successfully');
    } catch (error) {
        console.error('Error sending Telegram notification:', error);
    }
};

// Get all orders with pagination
exports.getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments();

        res.json({
            orders,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalOrders: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single order
exports.getOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new order
exports.createOrder = async (req, res) => {
    try {
        const order = new Order(req.body);
        const savedOrder = await order.save();
        
        // Send Telegram notification
        await sendOrderNotification({
            orderID: savedOrder.orderId,
            cakeType: savedOrder.cakeType,
            customerName: savedOrder.customerName,
            orderSource: savedOrder.orderSource,
            orderNotes: savedOrder.orderNotes,
            orderPrice: savedOrder.orderPrice,
            deposit: savedOrder.deposit,
            deliveryAddress: savedOrder.deliveryAddress,
            deliveryTime: savedOrder.deliveryTime
        });

        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update order
exports.updateOrder = async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            { orderId: req.params.orderId },
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete order
exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findOneAndDelete({ orderId: req.params.orderId });
        
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        
        res.json({ message: 'Đã xóa đơn hàng thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get orders by status
exports.getOrdersByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const orders = await Order.find({ orderStatus: status })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments({ orderStatus: status });

        res.json({
            orders,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalOrders: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get orders by date range
exports.getOrdersByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments(query);

        res.json({
            orders,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalOrders: total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 