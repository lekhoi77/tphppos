const Order = require('../models/Order');
const TelegramBot = require('node-telegram-bot-api');

// Log environment variables
console.log('Environment variables:');
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN);
console.log('TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID);

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
    console.error('❌ ERROR: Missing Telegram configuration!');
    console.error('Token:', token);
    console.error('ChatID:', chatId);
}

const bot = new TelegramBot(token, { polling: false });

// Test bot connection
(async () => {
    try {
        console.log('🤖 Đang test kết nối Telegram bot...');
        console.log('- Token được sử dụng:', token);
        console.log('- ChatID được sử dụng:', chatId);
        await bot.sendMessage(chatId, '🔄 Bot đang hoạt động - Test message');
        console.log('✅ Test bot thành công!');
    } catch (error) {
        console.error('❌ Lỗi kết nối bot:', error.message);
        console.error('Chi tiết lỗi:', JSON.stringify(error, null, 2));
    }
})();

const sendOrderNotification = async (orderData) => {
    console.log('Bắt đầu gửi thông báo Telegram cho đơn hàng:', orderData.orderID);
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
        console.log('Đang kết nối với Telegram bot...');
        console.log('- Token được sử dụng:', token);
        console.log('- ChatID được sử dụng:', chatId);
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        console.log('✅ Đã gửi thông báo Telegram thành công');
        return true;
    } catch (error) {
        console.error('❌ Lỗi khi gửi thông báo Telegram:', error.message);
        console.error('Chi tiết lỗi:', error);
        return false;
    }
};

// Get all orders with pagination
exports.getOrders = async (req, res) => {
    try {
        console.log('Đang lấy danh sách đơn hàng...');
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
        console.error('❌ Lỗi khi lấy danh sách đơn hàng:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get single order
exports.getOrder = async (req, res) => {
    try {
        console.log('Đang lấy thông tin đơn hàng...');
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        res.json(order);
    } catch (error) {
        console.error('❌ Lỗi khi lấy thông tin đơn hàng:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Create new order
exports.createOrder = async (req, res) => {
    try {
        console.log('Đang tạo đơn hàng mới...');
        const order = new Order(req.body);
        const savedOrder = await order.save();
        
        console.log('Đơn hàng đã được lưu, bắt đầu gửi thông báo...');
        // Send Telegram notification
        const notificationSent = await sendOrderNotification({
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

        res.status(201).json({
            ...savedOrder.toJSON(),
            telegramNotification: notificationSent ? 'Đã gửi' : 'Thất bại'
        });
    } catch (error) {
        console.error('❌ Lỗi khi tạo đơn hàng:', error.message);
        res.status(400).json({ message: error.message });
    }
};

// Update order
exports.updateOrder = async (req, res) => {
    try {
        console.log('Đang cập nhật thông tin đơn hàng...');
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
        console.error('❌ Lỗi khi cập nhật thông tin đơn hàng:', error.message);
        res.status(400).json({ message: error.message });
    }
};

// Delete order
exports.deleteOrder = async (req, res) => {
    try {
        console.log('Đang xóa đơn hàng...');
        const order = await Order.findOneAndDelete({ orderId: req.params.orderId });
        
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        
        res.json({ message: 'Đã xóa đơn hàng thành công' });
    } catch (error) {
        console.error('❌ Lỗi khi xóa đơn hàng:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get orders by status
exports.getOrdersByStatus = async (req, res) => {
    try {
        console.log('Đang lấy danh sách đơn hàng theo trạng thái...');
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
        console.error('❌ Lỗi khi lấy danh sách đơn hàng theo trạng thái:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Get orders by date range
exports.getOrdersByDateRange = async (req, res) => {
    try {
        console.log('Đang lấy danh sách đơn hàng theo khoảng thời gian...');
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
        console.error('❌ Lỗi khi lấy danh sách đơn hàng theo khoảng thời gian:', error.message);
        res.status(500).json({ message: error.message });
    }
};

// Thêm route test bot
exports.testTelegramBot = async (req, res) => {
    try {
        console.log('🤖 Đang test kết nối Telegram bot...');
        console.log('Token:', token);
        console.log('ChatID:', chatId);
        await bot.sendMessage(chatId, '🔄 Bot đang hoạt động - Test message');
        console.log('✅ Test bot thành công!');
        res.json({ success: true, message: 'Đã gửi tin nhắn test thành công!' });
    } catch (error) {
        console.error('❌ Lỗi kết nối bot:', error.message);
        console.error('Chi tiết lỗi:', JSON.stringify(error, null, 2));
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: JSON.stringify(error, null, 2)
        });
    }
};