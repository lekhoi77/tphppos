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
            
            // Kiểm tra cấu trúc dữ liệu trả về
            if (data.orders && Array.isArray(data.orders)) {
                console.log('Detected paginated response structure');
                return data.orders; // Trả về mảng orders nếu dữ liệu có cấu trúc phân trang
            } else if (Array.isArray(data)) {
                console.log('Detected array response structure');
                return data; // Trả về trực tiếp nếu dữ liệu là mảng
            } else {
                console.warn('Unexpected data structure:', data);
                return Array.isArray(data) ? data : (data.orders || []);
            }
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
            // Validate order status
            const validStatuses = ['Đã đặt', 'Đã giao', 'Hủy'];
            if (!validStatuses.includes(orderData.orderStatus)) {
                throw new Error('Trạng thái đơn hàng không hợp lệ');
            }

            console.log(`Updating order ${orderId} with data:`, orderData);
            
            // Lọc và định dạng dữ liệu để gửi đi
            const formattedData = {
                // Chỉ bao gồm các trường cần thiết
                cakeType: orderData.cakeType,
                customerName: orderData.customerName,
                orderSource: orderData.orderSource,
                orderNotes: orderData.orderNotes,
                orderPrice: Number(orderData.orderPrice),
                deposit: Number(orderData.deposit || 0),
                orderStatus: orderData.orderStatus,
                deliveryAddress: orderData.deliveryAddress,
                deliveryTime: orderData.deliveryTime
            };

            // Sử dụng XMLHttpRequest thay vì fetch
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', `${API_BASE_URL}/orders/${orderId}`);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Accept', 'application/json');
                
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            // Kiểm tra nội dung phản hồi là HTML thay vì JSON
                            const text = xhr.responseText;
                            if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html>')) {
                                console.error('Received HTML instead of JSON');
                                reject(new Error(`Lỗi máy chủ: ${xhr.status}`));
                                return;
                            }
                            
                            const data = JSON.parse(text);
                            console.log('Updated order:', data);
                            resolve(data);
                        } catch (e) {
                            console.error('Error parsing response:', e);
                            reject(new Error('Lỗi khi xử lý phản hồi từ máy chủ'));
                        }
                    } else {
                        console.error('Server error:', xhr.status, xhr.responseText);
                        reject(new Error(`Lỗi máy chủ: ${xhr.status}`));
                    }
                };
                
                xhr.onerror = function() {
                    console.error('Network error');
                    reject(new Error('Lỗi kết nối mạng'));
                };
                
                // In dữ liệu gửi đi để debug
                console.log('Sending data:', JSON.stringify(formattedData));
                xhr.send(JSON.stringify(formattedData));
            });
        } catch (error) {
            console.error('Error updating order:', error);
            throw error;
        }
    },

    // Delete an order
    async deleteOrder(orderId) {
        try {
            if (!orderId) {
                throw new Error('orderId is required');
            }
            
            console.log(`Deleting order ${orderId}`);
            // Ensure orderId is properly included in URL
            const url = `${API_BASE_URL}/orders/${encodeURIComponent(orderId)}`;
            console.log('Delete URL:', url);
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            // Check if response is ok before trying to parse JSON
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                throw new Error(`Server error: ${response.status}`);
            }
            
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
            if (!orderId) {
                throw new Error('Cần cung cấp mã đơn hàng');
            }
            
            console.log(`Fetching order ${orderId}`);
            
            // Sử dụng XMLHttpRequest thay vì fetch để xử lý lỗi tốt hơn
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', `${API_BASE_URL}/orders/${orderId}`);
                xhr.setRequestHeader('Accept', 'application/json');
                
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const text = xhr.responseText;
                            
                            // Kiểm tra nội dung phản hồi là HTML thay vì JSON
                            if (text.trim().startsWith('<!DOCTYPE html>') || text.trim().startsWith('<html>')) {
                                console.error('Received HTML instead of JSON');
                                reject(new Error(`Lỗi máy chủ: ${xhr.status}`));
                                return;
                            }
                            
                            const data = JSON.parse(text);
                            console.log('Fetched order:', data);
                            
                            // Đảm bảo trạng thái đơn hàng hợp lệ
                            if (data && data.orderStatus) {
                                const validStatuses = ['Đã đặt', 'Đã giao', 'Hủy'];
                                if (!validStatuses.includes(data.orderStatus)) {
                                    console.warn('Invalid order status:', data.orderStatus);
                                    data.orderStatus = 'Đã đặt'; // Mặc định là Đã đặt (xanh lá)
                                }
                            }
                            
                            resolve(data);
                        } catch (e) {
                            console.error('Error parsing response:', e);
                            reject(new Error('Lỗi khi xử lý phản hồi từ máy chủ'));
                        }
                    } else {
                        console.error('Server error:', xhr.status, xhr.responseText);
                        reject(new Error(`Lỗi máy chủ: ${xhr.status}`));
                    }
                };
                
                xhr.onerror = function() {
                    console.error('Network error');
                    reject(new Error('Lỗi kết nối mạng'));
                };
                
                xhr.send();
            });
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
            const data = await handleResponse(response);
            // Xử lý cấu trúc dữ liệu trả về
            return data.orders || data;
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
            const data = await handleResponse(response);
            // Xử lý cấu trúc dữ liệu trả về
            return data.orders || data;
        } catch (error) {
            console.error('Error fetching orders by date range:', error);
            throw error;
        }
    },
};

export default orderAPI;