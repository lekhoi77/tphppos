import orderAPI from './api.js';

// Make necessary functions available globally
window.editOrder = editOrder;
window.deleteOrder = deleteOrder;

let orders = [];
let currentPage = 1;
const ordersPerPage = 10;
let orderToDelete = null;

// Get DOM elements
const addOrderBtn = document.getElementById('addOrderBtn');
const orderModal = document.getElementById('orderModal');
const orderForm = document.getElementById('orderForm');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.querySelector('.cancel');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const notificationYes = document.getElementById('notification-yes');
const notificationNo = document.getElementById('notification-no');
const paginationContainer = document.getElementById('pagination');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Add a sample order for testing
        const sampleOrder = {
            _id: 'sample123',
            orderId: 'TEST-001',
            cakeType: 'Bánh Kem thường',
            customerName: 'Khách Hàng Test',
            orderSource: 'Facebook',
            orderNotes: 'Đơn hàng test',
            orderPrice: 350000,
            deposit: 100000,
            orderStatus: 'Đã đặt',
            deliveryAddress: '123 Đường Test',
            deliveryTime: new Date().toISOString()
        };
        
        orders = [sampleOrder];
        displayOrders(orders);

        // Add event listeners
        if (addOrderBtn) {
            addOrderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showModalAtPosition(e);
            });
        } else {
            console.error('Add Order button not found');
        }

        // Close modal when clicking close or cancel button
        if (closeBtn) closeBtn.addEventListener('click', hideModal);
        if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === orderModal) {
                hideModal();
            }
        });

        // Handle form submission
        if (orderForm) {
            orderForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = {
                    orderId: generateOrderId(),
        cakeType: document.getElementById('cakeType').value,
        customerName: document.getElementById('customerName').value,
        orderSource: document.getElementById('orderSource').value,
        orderNotes: document.getElementById('orderNotes').value,
                    orderPrice: parseFloat(document.getElementById('orderPrice').value.replace(/[,.]/g, '')),
                    deposit: parseFloat(document.getElementById('deposit').value.replace(/[,.]/g, '')) || 0,
        orderStatus: document.getElementById('orderStatus').value,
        deliveryAddress: document.getElementById('deliveryAddress').value,
        deliveryTime: document.getElementById('deliveryTime').value
    };

                try {
                    await addOrder(formData);
                } catch (error) {
                    showError('Không thể thêm đơn hàng');
                }
            });
        }

        // Format price inputs
        const priceInputs = ['orderPrice', 'deposit'];
        priceInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', function() {
                    let value = this.value.replace(/[^0-9]/g, '');
                    if (value) {
                        value = parseInt(value, 10).toLocaleString('vi-VN');
                        this.value = value;
                    }
                });
            }
        });
    } catch (error) {
        console.error('Error during initialization:', error);
        showError('Không thể khởi tạo ứng dụng');
    }
});

// Function to display orders
function displayOrders(orders) {
    const tableBody = document.getElementById('orderTableBody');
    tableBody.innerHTML = '';

    if (window.innerWidth <= 1023) {
        // Card view for tablet and mobile
        orders.forEach(order => {
            const card = document.createElement('tr');
            card.innerHTML = `
                <div class="order-card">
                    <div class="order-card-header">
                        <span class="order-id">#${order.orderId || ''}</span>
                        <div class="order-status ${getStatusClass(order.orderStatus)}">${order.orderStatus || ''}</div>
                    </div>
                    <div class="order-card-main">
                        <div class="info-group">
                            <span class="info-label">Loại bánh</span>
                            <span class="info-value">${order.cakeType || ''}</span>
                        </div>
                        <div class="info-group">
                            <span class="info-label">Tên khách hàng</span>
                            <span class="info-value">${order.customerName || ''}</span>
                        </div>
                        <div class="info-group">
                            <span class="info-label">Kênh</span>
                            <span class="info-value">${order.orderSource || ''}</span>
                        </div>
                        <div class="info-group">
                            <span class="info-label">Tiền</span>
                            <span class="info-value">${formatPrice(order.orderPrice)}</span>
                        </div>
                        <div class="info-group">
                            <span class="info-label">Cọc</span>
                            <span class="info-value">${formatPrice(order.deposit)}</span>
                        </div>
                        <div class="info-group">
                            <span class="info-label">Địa chỉ</span>
                            <span class="info-value">${order.deliveryAddress || ''}</span>
                        </div>
                        <div class="info-group">
                            <span class="info-label">Thời gian giao</span>
                            <span class="info-value">${formatDateTime(order.deliveryTime)}</span>
                        </div>
                        <div class="order-card-notes">
                            <span class="info-label">Nội dung</span>
                            <span class="info-value">${order.orderNotes || ''}</span>
                        </div>
                    </div>
                    <div class="order-card-footer">
                        <button onclick="editOrder('${order._id}')" class="edit-btn">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button onclick="deleteOrder('${order._id}')" class="delete-btn">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </div>
                </div>
            `;
            tableBody.appendChild(card);
        });
    } else {
        // Table view for desktop
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.orderId || ''}</td>
                <td>${order.cakeType || ''}</td>
                <td>${order.customerName || ''}</td>
                <td>${order.orderNotes || ''}</td>
                <td>${order.orderSource || ''}</td>
                <td>${formatPrice(order.orderPrice)}</td>
                <td>${formatPrice(order.deposit)}</td>
                <td class="${getStatusClass(order.orderStatus)}">${order.orderStatus || ''}</td>
                <td>${order.deliveryAddress || ''}</td>
                <td>${formatDateTime(order.deliveryTime)}</td>
                <td>
                    <button onclick="editOrder('${order._id}')" class="edit-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteOrder('${order._id}')" class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

// Helper function to get status class
function getStatusClass(status) {
    switch(status) {
        case 'Đã giao':
            return 'status-delivered';
        case 'Đã đặt':
            return 'status-ordered';
        case 'Hủy':
            return 'status-cancelled';
        default:
            return '';
    }
}

// Add resize listener to handle responsive changes
window.addEventListener('resize', () => {
    displayOrders(orders);
});

// Function to show modal at clicked position
function showModalAtPosition(clickEvent) {
    orderModal.style.display = 'block';
    
    // Reset form and prepare for new order
    orderForm.reset();
    
    // Set default delivery time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById('deliveryTime').value = defaultDateTime;
    
    // Show modal with animation
    requestAnimationFrame(() => {
        orderModal.classList.add('show');
    });
}

// Function to hide modal
function hideModal() {
    orderModal.classList.remove('show');
    setTimeout(() => {
        orderModal.style.display = 'none';
        orderForm.reset();
    }, 300);
}

// Helper functions
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

function formatPrice(price) {
    return price ? price.toLocaleString('vi-VN') + ' đ' : '0 đ';
}

function formatDateTime(dateTime) {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleString('vi-VN');
}

function generateOrderId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
}

// CRUD functions
async function addOrder(orderData) {
    try {
        const savedOrder = await orderAPI.createOrder(orderData);
        orders.unshift(savedOrder);
        displayOrders(orders);
        hideModal();
        showSuccess('Đã thêm đơn hàng thành công!');
    } catch (error) {
        showError('Không thể thêm đơn hàng');
    }
}

async function editOrder(orderId) {
    try {
        const order = orders.find(o => o._id === orderId);
        if (!order) {
            showError('Không tìm thấy đơn hàng');
            return;
        }

        // Fill form with order data
        document.getElementById('cakeType').value = order.cakeType;
        document.getElementById('customerName').value = order.customerName;
        document.getElementById('orderSource').value = order.orderSource;
        document.getElementById('orderNotes').value = order.orderNotes;
        document.getElementById('orderPrice').value = order.orderPrice.toLocaleString('vi-VN');
        document.getElementById('deposit').value = order.deposit ? order.deposit.toLocaleString('vi-VN') : '';
        document.getElementById('orderStatus').value = order.orderStatus;
        document.getElementById('deliveryAddress').value = order.deliveryAddress;
        document.getElementById('deliveryTime').value = order.deliveryTime ? new Date(order.deliveryTime).toISOString().slice(0, 16) : '';

        // Update modal title and button
        document.querySelector('.popup-title').textContent = 'SỬA ĐƠN HÀNG';
        const submitButton = orderForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Cập nhật';

        // Show modal
        showModalAtPosition({ clientY: window.innerHeight / 2 });

        // Update form submit handler
        orderForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = {
                cakeType: document.getElementById('cakeType').value,
                customerName: document.getElementById('customerName').value,
                orderSource: document.getElementById('orderSource').value,
                orderNotes: document.getElementById('orderNotes').value,
                orderPrice: parseFloat(document.getElementById('orderPrice').value.replace(/[,.]/g, '')),
                deposit: parseFloat(document.getElementById('deposit').value.replace(/[,.]/g, '')) || 0,
                orderStatus: document.getElementById('orderStatus').value,
                deliveryAddress: document.getElementById('deliveryAddress').value,
                deliveryTime: document.getElementById('deliveryTime').value
            };

            try {
                const updatedOrder = await orderAPI.updateOrder(orderId, formData);
                const index = orders.findIndex(o => o._id === orderId);
                if (index !== -1) {
                    orders[index] = updatedOrder;
                    displayOrders(orders);
                }
                hideModal();
                showSuccess('Đã cập nhật đơn hàng thành công!');
            } catch (error) {
                showError('Không thể cập nhật đơn hàng');
            }
        };
    } catch (error) {
        showError('Không thể tải thông tin đơn hàng');
    }
}

async function deleteOrder(orderId) {
    try {
        if (confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) {
            await orderAPI.deleteOrder(orderId);
            orders = orders.filter(o => o._id !== orderId);
            displayOrders(orders);
            showSuccess('Đã xóa đơn hàng thành công!');
        }
    } catch (error) {
        showError('Không thể xóa đơn hàng');
    }
}