const Order = require('../models/Order');
const TelegramBot = require('node-telegram-bot-api');

// Log environment variables
console.log('Environment variables in orderController:');
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN);
console.log('TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID);

// Lấy token và chatId từ biến môi trường
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

// Kiểm tra token và chatId
if (!token || !chatId) {
    console.error('❌ ERROR: Missing Telegram configuration!');
    console.error('Token:', token);
    console.error('ChatID:', chatId);
} else {
    console.log('✅ Telegram configuration loaded successfully');
}

// Khởi tạo bot với token
const bot = new TelegramBot(token, { polling: false });

// Test bot connection
(async () => {
    try {
        if (!token || !chatId) {
            console.error('❌ Không thể test bot: Token hoặc ChatID không hợp lệ');
            return;
        }
        
        console.log('🤖 Đang test kết nối Telegram bot...');
        await bot.sendMessage(chatId, '🔄 Bot đang hoạt động - Test message');
        console.log('✅ Test bot thành công!');
    } catch (error) {
        console.error('❌ Lỗi kết nối bot:', error.message);
        console.error('Chi tiết lỗi:', error);
    }
})();

const sendOrderNotification = async (orderData) => {
    console.log('Bắt đầu gửi thông báo Telegram cho đơn hàng:', orderData.orderId || orderData._id);
    
    try {
        // Kiểm tra lại token và chatId
        if (!token || !chatId) {
            console.error('❌ Không thể gửi thông báo: Token hoặc ChatID không hợp lệ');
            console.error('Token:', token);
            console.error('ChatID:', chatId);
            return false;
        }
        
        // Kiểm tra dữ liệu đơn hàng
        console.log('Dữ liệu đơn hàng:', JSON.stringify(orderData));
        
        // Xử lý dữ liệu đơn hàng - đảm bảo có tất cả các trường cần thiết
        const orderDataObj = orderData.toObject ? orderData.toObject() : orderData;
        
        // Chuẩn bị nội dung tin nhắn
        const message = `
🎂 *ĐƠN HÀNG MỚI*

📝 *Mã đơn:* ${orderDataObj.orderId || 'Không có mã'}
🍰 *Loại bánh:* ${orderDataObj.cakeType || 'Không xác định'}
👤 *Khách hàng:* ${orderDataObj.customerName || 'Không xác định'}
📱 *Nguồn:* ${orderDataObj.orderSource || 'Không xác định'}
📝 *Nội dung:* ${orderDataObj.orderNotes || 'Không có'}
💰 *Tổng tiền:* ${orderDataObj.orderPrice || 0}
💵 *Tiền cọc:* ${orderDataObj.deposit || 0}
📍 *Địa chỉ:* ${orderDataObj.deliveryAddress || 'Không có'}
🕒 *Thời gian giao:* ${orderDataObj.deliveryTime ? new Date(orderDataObj.deliveryTime).toLocaleString('vi-VN') : 'Không xác định'}
`;

        // Gửi thông báo
        console.log('Đang gửi thông báo với nội dung:', message);
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        console.log('✅ Đã gửi thông báo Telegram thành công');
        return true;
    } catch (error) {
        console.error('❌ Lỗi khi gửi thông báo Telegram:', error.message);
        console.error('Chi tiết lỗi:', error);
        return false;
    }
};

// CRUD operations
exports.getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const orders = await Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await Order.countDocuments();

        res.json({ orders, currentPage: page, totalPages: Math.ceil(total / limit), totalOrders: total });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOrder = async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createOrder = async (req, res) => {
    try {
        console.log('Đang tạo đơn hàng mới với dữ liệu:', JSON.stringify(req.body));
        const order = new Order(req.body);
        const savedOrder = await order.save();
        console.log('Đã lưu đơn hàng, bắt đầu gửi thông báo');
        
        // Gửi thông báo Telegram
        setTimeout(async () => {
            try {
                const notificationSent = await sendOrderNotification(savedOrder);
                console.log('Kết quả gửi thông báo:', notificationSent ? 'Thành công' : 'Thất bại');
            } catch (error) {
                console.error('Lỗi khi gửi thông báo Telegram (timeout):', error);
            }
        }, 500); // Đợi 500ms để đảm bảo đơn hàng đã được lưu hoàn toàn

        res.status(201).json(savedOrder);
    } catch (error) {
        console.error('Lỗi khi tạo đơn hàng:', error);
        res.status(400).json({ message: error.message });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            { orderId: req.params.orderId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findOneAndDelete({ orderId: req.params.orderId });
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        res.json({ message: 'Đã xóa đơn hàng' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Filters
exports.getOrdersByStatus = async (req, res) => {
    try {
        const status = req.params.status;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const orders = await Order.find({ orderStatus: status })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments({ orderStatus: status });

        res.json({ orders, currentPage: page, totalPages: Math.ceil(total / limit), totalOrders: total });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOrdersByDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Order.countDocuments(query);

        res.json({ orders, currentPage: page, totalPages: Math.ceil(total / limit), totalOrders: total });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Test Telegram bot
exports.testTelegramBot = async (req, res) => {
    try {
        if (!token || !chatId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu cấu hình Telegram Bot. Vui lòng kiểm tra biến môi trường.'
            });
        }

        await bot.sendMessage(chatId, '🧪 *TEST BOT* - Tin nhắn test từ API', { parse_mode: 'Markdown' });

        res.json({
            success: true,
            message: 'Đã gửi tin nhắn test thành công!',
            config: {
                botToken: `${token.substring(0, 5)}...${token.substring(token.length - 5)}`,
                chatId
            }
        });
    } catch (error) {
        console.error('Lỗi khi test bot:', error);
        res.status(500).json({
            success: false,
            message: `Lỗi khi gửi tin nhắn test: ${error.message}`,
            error: error.stack
        });
    }
};
