const API_URL = 'https://tphppos-production.up.railway.app/api';

// Hàm helper để xử lý response
const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Có lỗi xảy ra');
    }
    return response.json();
};

// API calls cho đơn hàng
const orderAPI = {
    // Lấy danh sách đơn hàng có phân trang
    getOrders: async (page = 1, limit = 10) => {
        try {
            const response = await fetch(`${API_URL}/orders?page=${page}&limit=${limit}`);
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }
    },

    // Lấy đơn hàng theo ID
    getOrder: async (orderId) => {
        try {
            const response = await fetch(`${API_URL}/orders/${orderId}`);
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching order:', error);
            throw error;
        }
    },

    // Tạo đơn hàng mới
    createOrder: async (orderData) => {
        try {
            const response = await fetch(`${API_URL}/orders`, {
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

    // Cập nhật đơn hàng
    updateOrder: async (orderId, orderData) => {
        try {
            const response = await fetch(`${API_URL}/orders/${orderId}`, {
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

    // Xóa đơn hàng
    deleteOrder: async (orderId) => {
        try {
            const response = await fetch(`${API_URL}/orders/${orderId}`, {
                method: 'DELETE',
            });
            return handleResponse(response);
        } catch (error) {
            console.error('Error deleting order:', error);
            throw error;
        }
    },

    // Lấy đơn hàng theo trạng thái
    getOrdersByStatus: async (status, page = 1, limit = 10) => {
        try {
            const response = await fetch(`${API_URL}/orders/status/${status}?page=${page}&limit=${limit}`);
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
                `${API_URL}/orders/date-range?startDate=${startDate}&endDate=${endDate}&page=${page}&limit=${limit}`
            );
            return handleResponse(response);
        } catch (error) {
            console.error('Error fetching orders by date range:', error);
            throw error;
        }
    },
};

export default orderAPI; 