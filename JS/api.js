// API base URL
const API_BASE_URL = 'https://tphppos-production.up.railway.app/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
    try {
        // Log response details for debugging
        console.log('Response:', {
            url: response.url,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        // Try to parse response as text first
        const text = await response.text();
        console.log('Raw response:', text);

        // Check if response is empty
        if (!text) {
            throw new Error('Empty response from server');
        }

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(text);
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

        // Handle different response formats
        if (data.data) {
            // If response is wrapped in a data property
            return data.data;
        } else if (Array.isArray(data)) {
            // If response is an array
            return data;
        } else if (typeof data === 'object') {
            // If response is a single object
            return data;
        } else {
            console.error('Unexpected response format:', data);
            throw new Error('Unexpected response format from server');
        }
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
                    'Accept': 'application/json'
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
                    'Accept': 'application/json'
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
                headers: {
                    'Accept': 'application/json'
                }
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

export default orderAPI;// API base URL
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