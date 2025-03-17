// API base URL
const API_BASE_URL = 'https://tphppos-production.up.railway.app/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
    try {
        // Log response details for debugging
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        // Try to parse response as text first
        const text = await response.text();
        console.log('Raw response text:', text);

        // Check if response is empty
        if (!text) {
            throw new Error('Empty response from server');
        }

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(text);
            console.log('Parsed JSON data:', data);
        } catch (e) {
            console.error('JSON parse error:', e);
            throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
        }

        // Check if response has error status
        if (!response.ok) {
            const errorMessage = data.message || `HTTP error! status: ${response.status}`;
            console.error('API Error:', errorMessage);
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        console.error('Error in handleResponse:', error);
        throw error;
    }
};

// API functions for orders
const orderAPI = {
    // Get all orders with pagination
    async getOrders(page = 1, limit = 10) {
        try {
            console.log(`Fetching orders - page: ${page}, limit: ${limit}`);
            const response = await fetch(`${API_BASE_URL}/orders?page=${page}&limit=${limit}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            const data = await handleResponse(response);
            console.log('Fetched orders:', data);
            return data;
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
                    'Accept': 'application/json'
                },
                body: JSON.stringify(orderData),
            });
            const data = await handleResponse(response);
            console.log('Created order:', data);
            return data;
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
                    'Accept': 'application/json'
                },
                body: JSON.stringify(orderData),
            });
            const data = await handleResponse(response);
            console.log('Updated order:', data);
            return data;
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
                headers: {
                    'Accept': 'application/json'
                }
            });
            const data = await handleResponse(response);
            console.log('Deleted order:', data);
            return data;
        } catch (error) {
            console.error('Error deleting order:', error);
            throw error;
        }
    },

    // Lấy đơn hàng theo ID
    async getOrder(orderId) {
        try {
            console.log(`Fetching order ${orderId}`);
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    },

    // Lấy đơn hàng theo trạng thái
    async getOrdersByStatus(status, page = 1, limit = 10) {
        try {
            console.log(`Fetching orders by status: ${status}`);
            const response = await fetch(`${API_BASE_URL}/orders/status/${status}?page=${page}&limit=${limit}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
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
                `${API_BASE_URL}/orders/date-range?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}`,
                {
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching orders by date range:', error);
            throw error;
        }
    },
};

export default orderAPI; 