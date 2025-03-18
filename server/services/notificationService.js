require('dotenv').config();
const axios = require('axios');

const sendTelegramMessage = async (message) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=-100266332405&text=Your message`;


    try {
        await axios.post(url, { chat_id: chatId, text: message });
        console.log('Thông báo đã gửi thành công!');
    } catch (error) {
        console.error('Lỗi gửi thông báo:', error);
    }
};

module.exports = { sendTelegramMessage };
