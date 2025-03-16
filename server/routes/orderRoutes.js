const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Get all orders with pagination
router.get('/', orderController.getOrders);

// Get orders by status
router.get('/status/:status', orderController.getOrdersByStatus);

// Get orders by date range
router.get('/date-range', orderController.getOrdersByDateRange);

// Get single order
router.get('/:orderId', orderController.getOrder);

// Create new order
router.post('/', orderController.createOrder);

// Update order
router.put('/:orderId', orderController.updateOrder);

// Delete order
router.delete('/:orderId', orderController.deleteOrder);

module.exports = router; 