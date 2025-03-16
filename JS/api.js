// API base URL
const API_BASE_URL = 'https://tphppos-production.up.railway.app/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
    }
    return response.json();
};

// API functions for orders
const orderAPI = {
    // Get all orders with pagination
    async getOrders(page = 1, limit = 10) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders?page=${page}&limit=${limit}`);
            return handleResponse(response);
        } catch (error) {
            throw error;
        }
    },

    // Create a new order
    async createOrder(orderData) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });
            return handleResponse(response);
        } catch (error) {
            throw error;
        }
    },

    // Update an existing order
    async updateOrder(orderId, orderData) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });
            return handleResponse(response);
        } catch (error) {
            throw error;
        }
    },

    // Delete an order
    async deleteOrder(orderId) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                method: 'DELETE',
            });
            return handleResponse(response);
        } catch (error) {
            throw error;
        }
    },

    // Lấy đơn hàng theo ID
    getOrder: async (orderId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    },

    // Lấy đơn hàng theo trạng thái
    getOrdersByStatus: async (status, page = 1, limit = 10) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/status/${status}?page=${page}&limit=${limit}`);
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching orders by status:', error);
            throw error;
        }
    },

    // Lấy đơn hàng theo khoảng thời gian
    getOrdersByDateRange: async (startDate, endDate, page = 1, limit = 10) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/orders/date-range?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}`
            );
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching orders by date range:', error);
            throw error;
        }
    },
};

export default orderAPI; 