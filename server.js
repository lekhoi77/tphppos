require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));

// Middleware
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi máy chủ' });
});

// GET all orders
app.get('/api/orders', (req, res) => {
    const query = 'SELECT * FROM don_hang ORDER BY id DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            res.status(500).json({ status: 'error', message: 'Không thể lấy danh sách đơn hàng' });
            return;
        }
        res.json({ status: 'success', data: results });
    });
});

// POST new order
app.post('/api/orders', (req, res) => {
    console.log('Received order data:', req.body);
    
    const { cakeType, customerName, orderSource, orderNotes, orderPrice, deposit, orderStatus, deliveryAddress, deliveryTime } = req.body;
    
    const orderData = {
        cakeType,
        customerName,
        orderSource,
        orderNotes,
        orderPrice: parseFloat(orderPrice) || 0,
        deposit: parseFloat(deposit) || 0,
        orderStatus: orderStatus || 'Đã đặt',
        deliveryAddress,
        deliveryTime
    };

    const query = 'INSERT INTO don_hang SET ?';
    db.query(query, orderData, (err, result) => {
        if (err) {
            console.error('Error creating order:', err);
            res.status(500).json({ status: 'error', message: 'Không thể tạo đơn hàng: ' + err.message });
            return;
        }
        res.json({ status: 'success', message: 'Đơn hàng đã được tạo', id: result.insertId });
    });
});

// DELETE order
app.delete('/api/orders/:id', (req, res) => {
    const orderId = req.params.id;
    const query = 'DELETE FROM don_hang WHERE id = ?';
    
    db.query(query, [orderId], (err, result) => {
        if (err) {
            console.error('Error deleting order:', err);
            res.status(500).json({ status: 'error', message: 'Không thể xóa đơn hàng' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ status: 'error', message: 'Không tìm thấy đơn hàng' });
            return;
        }
        res.json({ status: 'success', message: 'Đơn hàng đã được xóa' });
    });
});

// PUT update order
app.put('/api/orders/:id', (req, res) => {
    const { cakeType, customerName, orderSource, orderNotes, orderPrice, deposit, orderStatus, deliveryAddress, deliveryTime } = req.body;
    const orderId = req.params.id;

    const query = `
        UPDATE don_hang 
        SET 
            cakeType = ?,
            customerName = ?,
            orderSource = ?,
            orderNotes = ?,
            orderPrice = ?,
            deposit = ?,
            orderStatus = ?,
            deliveryAddress = ?,
            deliveryTime = ?
        WHERE id = ?
    `;

    const values = [
        cakeType,
        customerName,
        orderSource,
        orderNotes,
        parseFloat(orderPrice) || 0,
        parseFloat(deposit) || 0,
        orderStatus,
        deliveryAddress,
        deliveryTime,
        orderId
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating order:', err);
            res.status(500).json({ status: 'error', message: 'Không thể cập nhật đơn hàng: ' + err.message });
            return;
        }
        res.json({ status: 'success', message: 'Đơn hàng đã được cập nhật' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 