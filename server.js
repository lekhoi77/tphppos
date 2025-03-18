const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const orderRoutes = require('./server/routes/orderRoutes');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

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

// API Routes
app.use('/api/orders', orderRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});