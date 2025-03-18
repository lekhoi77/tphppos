// Load environment variables FIRST before importing any other modules
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
// Thay đổi đường dẫn import để sử dụng file route có chức năng gửi Telegram
const orderRoutes = require('./server/routes/orderRoutes');

// Log biến môi trường để kiểm tra
console.log('=== KIỂM TRA BIẾN MÔI TRƯỜNG ===');
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN);
console.log('TELEGRAM_CHAT_ID:', process.env.TELEGRAM_CHAT_ID);
console.log('MONGODB_URI:', process.env.MONGODB_URI);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Chuỗi kết nối MongoDB - sử dụng public URL để kết nối từ bên ngoài Railway
const mongoURI = 'mongodb://mongo:rKpOfYSAoyagVXMMWIncdgzdZnWJMYzv@ballast.proxy.rlwy.net:55251';
console.log('Connecting to MongoDB with URI:', mongoURI);

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to MongoDB successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    console.error('Connection string used:', mongoURI);
  });

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Test Telegram endpoint
app.get('/test-telegram', async (req, res) => {
  try {
    const TelegramBot = require('node-telegram-bot-api');
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    console.log('Test Telegram endpoint');
    console.log('Token:', token);
    console.log('ChatID:', chatId);
    
    const bot = new TelegramBot(token, { polling: false });
    await bot.sendMessage(chatId, '🔄 Test từ website - ' + new Date().toLocaleString());
    res.send('Đã gửi tin nhắn test thành công!');
  } catch (error) {
    console.error('Lỗi khi gửi tin nhắn test:', error);
    res.status(500).send('Lỗi: ' + error.message);
  }
});

// API routes
app.use('/api/orders', orderRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));