import orderAPI from './api.js';

// Make necessary functions available globally
window.editOrder = editOrder;
window.deleteOrder = deleteOrder;

let orders = [];
let currentPage = 1;
const ordersPerPage = 10;
let orderToDelete = null;
let lastOrderNumber = 0; // Biến để theo dõi số thứ tự đơn hàng

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
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch real orders from API
        const response = await orderAPI.getOrders();
        // Sắp xếp đơn hàng theo thời gian tạo, mới nhất lên đầu
        orders = response.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Tìm số thứ tự lớn nhất hiện tại
        lastOrderNumber = findLastOrderNumber(orders);
        
        displayOrders(orders);

        // Add event listeners
        if (addOrderBtn) {
            addOrderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showModalAtPosition();
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
                    hideModal();
                    // Refresh orders list
                    const updatedOrders = await orderAPI.getOrders();
                    orders = updatedOrders;
                    displayOrders(orders);
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
        showError('Không thể tải danh sách đơn hàng');
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
function showModalAtPosition() {
    const modal = document.querySelector('.modal-content');
    const modalContainer = document.getElementById('orderModal');
    
    // Tính toán vị trí cuộn hiện tại của trang
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Tính toán vị trí giữa viewport
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Đặt modal ở giữa viewport tại vị trí scroll hiện tại
    const top = scrollTop + (viewportHeight / 2);
    const left = scrollLeft + (viewportWidth / 2);
    
    // Áp dụng vị trí cho modal
    modal.style.top = `${top}px`;
    modal.style.left = `${left}px`;
    
    // Reset form và chuẩn bị cho đơn hàng mới
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
    
    // Hiển thị modal và reset scroll position
    modalContainer.style.display = 'block';
    
    // Reset scroll position sau khi modal được hiển thị
    requestAnimationFrame(() => {
        modal.scrollTop = 0;
        modalContainer.classList.add('show');
    });
}

// Function to hide modal
function hideModal() {
    const modalContainer = document.getElementById('orderModal');
    const modal = document.querySelector('.modal-content');
    
    modalContainer.classList.remove('show');
    setTimeout(() => {
        modalContainer.style.display = 'none';
        orderForm.reset();
        // Reset position when hiding modal
        modal.style.top = '';
        modal.style.left = '';
        modal.scrollTop = 0;
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
    if (!price) return '0 đ';
    return price.toLocaleString('vi-VN') + ' đ';
}

function formatDateTime(dateTime) {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function generateOrderId() {
    lastOrderNumber++;
    return `#${String(lastOrderNumber).padStart(4, '0')}`;
}

// Helper function to find the last order number
function findLastOrderNumber(orders) {
    let maxNumber = 0;
    orders.forEach(order => {
        if (order.orderId) {
            const match = order.orderId.match(/#(\d+)/);
            if (match) {
                const number = parseInt(match[1]);
                maxNumber = Math.max(maxNumber, number);
            }
        }
    });
    return maxNumber;
}

// CRUD functions
async function addOrder(orderData) {
    try {
        const savedOrder = await orderAPI.createOrder(orderData);
        // Thêm đơn hàng mới vào đầu danh sách
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
        showModalAtPosition();

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