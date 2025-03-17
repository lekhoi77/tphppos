// API base URL
const API_BASE_URL = 'https://tphppos-production.up.railway.app/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format. Expected JSON.');
    }

    if (!response.ok) {
        try {
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        } catch (e) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    }

    const data = await response.json();
    console.log('API Response:', {
        url: response.url,
        status: response.status,
        data: data
    });
    return data;
};

// API functions for orders
const orderAPI = {
    // Get all orders with pagination
    async getOrders(page = 1, limit = 10) {
        try {
            console.log(`Fetching orders - page: ${page}, limit: ${limit}`);
            const response = await fetch(`${API_BASE_URL}/orders?page=${page}&limit=${limit}`);
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    },

    // Create a new order
    async createOrder(orderData) {
        try {
            console.log('Creating order with data:', orderData);
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },

    // Update an existing order
    async updateOrder(orderId, orderData) {
        try {
            console.log(`Updating order ${orderId} with data:`, orderData);
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error updating order:', error);
            throw error;
        }
    },

    // Delete an order
    async deleteOrder(orderId) {
        try {
            console.log(`Deleting order ${orderId}`);
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                method: 'DELETE',
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error deleting order:', error);
            throw error;
        }
    },

    // Lấy đơn hàng theo ID
    async getOrder(orderId) {
        try {
            console.log(`Fetching order ${orderId}`);
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
            const data = await handleResponse(response);
            console.log('Get order response:', data);
            return data;
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    },

    // Lấy đơn hàng theo trạng thái
    async getOrdersByStatus(status, page = 1, limit = 10) {
        try {
            console.log(`Fetching orders by status: ${status}`);
            const response = await fetch(`${API_BASE_URL}/orders/status/${status}?page=${page}&limit=${limit}`);
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching orders by status:', error);
            throw error;
        }
    },

    // Lấy đơn hàng theo khoảng thời gian
    async getOrdersByDateRange(startDate, endDate, page = 1, limit = 10) {
        try {
            console.log(`Fetching orders by date range: ${startDate} - ${endDate}`);
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