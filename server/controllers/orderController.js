const Order = require('../models/Order');
const TelegramBot = require('node-telegram-bot-api');

// Log environment variables
console.log('Environment variables in orderController:');
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN);
console.log('TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID);

// Lấy token và chatId từ biến môi trường
const token = '7255950953:AAGWrNHB4uyOmJHK2UTNVBGgr7GzMl0MNZQ'; // Sử dụng token trực tiếp thay vì lấy từ biến môi trường
const chatId = '-1002606332405'; // Sử dụng chatId trực tiếp thay vì lấy từ biến môi trường

// Kiểm tra token và chatId
if (!token || !chatId) {
    console.error('❌ ERROR: Missing Telegram configuration!');
    console.error('Token:', token);
    console.error('ChatID:', chatId);
} else {
    console.log('✅ Telegram configuration loaded successfully');
    console.log('Token (trực tiếp):', token);
    console.log('ChatID (trực tiếp):', chatId);
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
    console.log('=== BẮT ĐẦU GỬI THÔNG BÁO TELEGRAM ===');
    console.log('Dữ liệu đơn hàng nhận được:', typeof orderData, orderData ? 'Có dữ liệu' : 'Không có dữ liệu');
    
    if (!orderData) {
        console.error('❌ Lỗi: Không có dữ liệu đơn hàng để gửi thông báo');
        return false;
    }
    
    try {
        // Kiểm tra lại token và chatId
        if (!token || !chatId) {
            console.error('❌ Không thể gửi thông báo: Token hoặc ChatID không hợp lệ');
            console.error('Token:', token);
            console.error('ChatID:', chatId);
            return false;
        }
        
        // Kiểm tra dữ liệu đơn hàng
        console.log('OrderID:', orderData.orderId);
        console.log('_id:', orderData._id);
        console.log('Các trường của đơn hàng:', Object.keys(orderData));
        
        // Xử lý dữ liệu đơn hàng - đảm bảo có tất cả các trường cần thiết
        let orderDataObj;
        try {
            orderDataObj = orderData.toObject ? orderData.toObject() : orderData;
            console.log('Chuyển đổi dữ liệu đơn hàng thành công');
        } catch (conversionError) {
            console.error('Lỗi khi chuyển đổi dữ liệu đơn hàng:', conversionError);
            orderDataObj = orderData; // Sử dụng dữ liệu gốc nếu không thể chuyển đổi
        }
        
        // Chuẩn bị nội dung tin nhắn
        const message = `
*MÃ ĐƠN HÀNG:* ${orderDataObj.orderId || 'Không có mã'}
━━━━━━━━━━━━━━━

${orderDataObj.status === 'Hủy' ? '🔴' : orderDataObj.status === 'Đang giao' ? '🟡' : '🟢'} *Trạng thái:* ${orderDataObj.status ? orderDataObj.status : 'Đã đặt'}

🍰 *Loại bánh:* ${orderDataObj.cakeType || 'Không xác định'}

👤 *Khách hàng:* ${orderDataObj.customerName || 'Không xác định'}

📱 *Nguồn:* ${orderDataObj.orderSource || 'Không xác định'}

📝 *Nội dung:* ${orderDataObj.orderNotes || 'Không có'}

💰 *Tổng tiền:* _${(orderDataObj.orderPrice || 0).toLocaleString('vi-VN')} VNĐ_

💵 *Tiền cọc:* _${(orderDataObj.deposit || 0).toLocaleString('vi-VN')} VNĐ_


📍 *Địa chỉ:* ${orderDataObj.deliveryAddress || 'Không có'}

🕒 *Thời gian giao:* ${orderDataObj.deliveryTime ? new Date(orderDataObj.deliveryTime).toLocaleString('vi-VN') : 'Không xác định'}
`;

        // Gửi thông báo
        console.log('Đang gửi thông báo Telegram...');
        console.log('ChatID:', chatId);
        console.log('Nội dung tin nhắn:', message);
        
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
        console.log('=== TẠO ĐƠN HÀNG MỚI ===');
        console.log('Đang tạo đơn hàng mới với dữ liệu:', JSON.stringify(req.body));
        const order = new Order(req.body);
        const savedOrder = await order.save();
        console.log('Đã lưu đơn hàng thành công, ID:', savedOrder._id);
        console.log('Đơn hàng đã lưu:', JSON.stringify(savedOrder));
        
        // Gửi thông báo Telegram ngay lập tức thay vì sử dụng setTimeout
        try {
            console.log('Bắt đầu gửi thông báo cho đơn hàng mới');
            const notificationSent = await sendOrderNotification(savedOrder);
            console.log('Kết quả gửi thông báo:', notificationSent ? 'Thành công ✅' : 'Thất bại ❌');
        } catch (notificationError) {
            console.error('❌ Lỗi khi gửi thông báo Telegram:', notificationError);
        }

        res.status(201).json(savedOrder);
    } catch (error) {
        console.error('❌ Lỗi khi tạo đơn hàng:', error);
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
        console.log('Attempting to delete order with ID:', req.params.orderId);
        
        // Validate orderId
        if (!req.params.orderId) {
            console.error('No orderId provided');
            return res.status(400).json({ message: 'ID đơn hàng không được cung cấp' });
        }

        // First try to find the order
        const orderExists = await Order.findOne({ orderId: req.params.orderId });
        if (!orderExists) {
            console.error('Order not found:', req.params.orderId);
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        // Delete the order
        const order = await Order.findOneAndDelete({ orderId: req.params.orderId });
        console.log('Successfully deleted order:', order);
        
        res.status(200).json({ 
            success: true,
            message: 'Đã xóa đơn hàng thành công',
            deletedOrder: order
        });
    } catch (error) {
        console.error('Error in deleteOrder:', error);
        res.status(500).json({ 
            success: false,
            message: 'Lỗi khi xóa đơn hàng: ' + error.message 
        });
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
