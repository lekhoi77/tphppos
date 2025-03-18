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
                // Reset form và chuẩn bị cho đơn hàng mới
                orderForm.reset();
                document.querySelector('.popup-title').textContent = 'THÊM ĐƠN HÀNG MỚI';
                const submitButton = orderForm.querySelector('button[type="submit"]');
                submitButton.textContent = 'Thêm';

                // Set default delivery time
                const now = new Date();
                document.getElementById('deliveryTime').value = now.toISOString().slice(0, 16);

                // Reset form submit handler
                orderForm.onsubmit = handleAddOrder;
                
                showModalAtPosition();
            });
        }

        // Close modal when clicking close or cancel button
        if (closeBtn) closeBtn.addEventListener('click', hideModal);
        if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === orderModal && window.innerWidth > 1024) {
                hideModal();
            }
        });

        // Format price inputs
        const priceInputs = ['orderPrice', 'deposit'];
        priceInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', function(e) {
                    // Lấy vị trí con trỏ hiện tại
                    const cursorPos = this.selectionStart;
                    
                    // Chỉ giữ lại số
                    let value = this.value.replace(/[^\d]/g, '');
                    
                    // Nếu là chuỗi rỗng thì gán 0
                    if (!value) {
                        value = '0';
                    }
                    
                    // Format số với dấu phẩy
                    const formattedValue = parseInt(value, 10).toLocaleString('vi-VN');
                    
                    // Cập nhật giá trị
                    this.value = formattedValue;
                    
                    // Tính toán vị trí con trỏ mới
                    const addedSeparators = formattedValue.length - value.length;
                    const newPosition = cursorPos + addedSeparators;
                    
                    // Đặt lại vị trí con trỏ
                    this.setSelectionRange(newPosition, newPosition);
                });

                // Ngăn chặn các ký tự không phải số
                input.addEventListener('keypress', function(e) {
                    if (!/[\d]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
                        e.preventDefault();
                    }
                });

                // Xử lý khi paste
                input.addEventListener('paste', function(e) {
                    e.preventDefault();
                    const pastedData = (e.clipboardData || window.clipboardData).getData('text');
                    const numericValue = pastedData.replace(/[^\d]/g, '');
                    
                    if (numericValue) {
                        const formattedValue = parseInt(numericValue, 10).toLocaleString('vi-VN');
                        this.value = formattedValue;
                    }
                });
            }
        });
        
        // Thêm event listener để xử lý sự kiện cuộn
        const modalContent = document.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('wheel', function(e) {
                const scrollTop = this.scrollTop;
                const scrollHeight = this.scrollHeight;
                const height = this.clientHeight;
                
                // Kiểm tra xem đã cuộn đến đầu hoặc cuối chưa
                if ((scrollTop === 0 && e.deltaY < 0) || 
                    (scrollTop + height >= scrollHeight && e.deltaY > 0)) {
                    e.preventDefault();
                }
            });
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        showError('Không thể tải danh sách đơn hàng');
    }
});

// Handle add order form submission
async function handleAddOrder(e) {
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
        console.log('Creating new order with data:', formData);
        const savedOrder = await orderAPI.createOrder(formData);
        orders.unshift(savedOrder);
        displayOrders(orders);
                    hideModal();
        showSuccess('Đã thêm đơn hàng thành công!');
    } catch (error) {
        console.error('Error creating order:', error);
        showError('Không thể thêm đơn hàng');
    }
}

// Function to display orders
function displayOrders(orders) {
    const tableBody = document.getElementById('orderTableBody');
    if (!tableBody) {
        console.error('Table body element not found');
        return;
    }
    
    tableBody.innerHTML = '';
    console.log('Displaying orders:', orders);

    if (window.innerWidth <= 1023) {
        // Card view for tablet and mobile
        orders.forEach(order => {
            const card = document.createElement('tr');
            card.innerHTML = `
                <div class="order-card">
                    <div class="order-card-header">
                        <span class="order-id">${order.orderId || ''}</span>
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
                        <div class="order-card-notes">
                            <span class="info-label">Nội dung</span>
                            <span class="info-value">${order.orderNotes || ''}</span>
                        </div>
                    </div>
                    <div class="order-card-footer">
                        <button onclick="editOrder('${order._id}')" class="edit-btn">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button onclick="deleteOrder('${order.orderId}')" class="delete-btn" data-orderid="${order.orderId}">
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
                <td>${formatPrice(order.orderPrice) || ''}</td>
                <td>${formatPrice(order.deposit) || ''}</td>
                <td><div class="status ${getStatusClass(order.orderStatus)}">${order.orderStatus || ''}</div></td>
                <td>${order.deliveryAddress || ''}</td>
                <td>${order.deliveryTime ? formatDateTime(order.deliveryTime) : ''}</td>
                <td class="actions">
                    <button onclick="editOrder('${order._id}')" class="edit-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteOrder('${order.orderId}')" class="delete-btn" data-orderid="${order.orderId}">
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
    document.body.classList.remove('modal-open');
    document.body.style.position = '';
    document.body.style.width = '';
    
    setTimeout(() => {
        modalContainer.style.display = 'none';
        orderForm.reset();
    }, 300);
}

function showModal() {
    const modalContainer = document.getElementById('orderModal');
    modalContainer.classList.add('show');
    modalContainer.style.display = 'block';
    document.body.classList.add('modal-open');
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
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
async function editOrder(mongoId) {
    try {
        console.log('Editing order with MongoDB ID:', mongoId);
        
        // Tìm đơn hàng trong danh sách orders hiện tại
        const orderData = orders.find(order => order._id === mongoId);
        console.log('Order data found:', orderData);

        if (!orderData) {
            console.error('Order not found with MongoDB ID:', mongoId);
            throw new Error('Không tìm thấy thông tin đơn hàng');
        }

        // Update modal title and button first
        document.querySelector('.popup-title').textContent = 'SỬA ĐƠN HÀNG';
        const submitButton = orderForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Cập nhật';

        // Show modal first
        showModalAtPosition();

        // Wait a brief moment for the modal to be visible
        await new Promise(resolve => setTimeout(resolve, 100));

        // Reset form before filling with new data
        orderForm.reset();

        // Fill form with order data with error checking
        const formFields = {
            'cakeType': orderData.cakeType || '',
            'customerName': orderData.customerName || '',
            'orderSource': orderData.orderSource || '',
            'orderNotes': orderData.orderNotes || '',
            'orderPrice': orderData.orderPrice ? orderData.orderPrice.toLocaleString('vi-VN') : '0',
            'deposit': orderData.deposit ? orderData.deposit.toLocaleString('vi-VN') : '0',
            'orderStatus': orderData.orderStatus || 'Đã đặt',
            'deliveryAddress': orderData.deliveryAddress || '',
            'deliveryTime': orderData.deliveryTime ? new Date(orderData.deliveryTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
        };

        // Populate each field with error checking
        for (const [fieldId, value] of Object.entries(formFields)) {
            const element = document.getElementById(fieldId);
            if (element) {
                element.value = value;
                console.log(`Set ${fieldId} to:`, value);
            } else {
                console.error(`Element not found: ${fieldId}`);
            }
        }

        // Update form submit handler
        orderForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = {
                orderId: orderData.orderId,
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
                console.log('Updating order with MongoDB ID:', mongoId);
                console.log('Update data:', formData);
                
                await orderAPI.updateOrder(mongoId, formData);
                
                const updatedOrders = await orderAPI.getOrders();
                orders = updatedOrders;
                    displayOrders(orders);
                hideModal();
                showSuccess('Đã cập nhật đơn hàng thành công!');
            } catch (error) {
                console.error('Error updating order:', error);
                showError('Không thể cập nhật đơn hàng');
            }
        };
    } catch (error) {
        console.error('Error in editOrder:', error);
        showError('Không thể tải thông tin đơn hàng');
    }
}

async function deleteOrder(orderId) {
    try {
        if (!orderId) {
            showError('Không tìm thấy ID đơn hàng');
            return;
        }

        // Show confirmation dialog
        const confirmed = confirm('Bạn có chắc chắn muốn xóa đơn hàng này?');
        if (!confirmed) return;

        // Show loading state
        const deleteButton = document.querySelector(`button[data-orderid="${orderId}"]`);
        if (deleteButton) {
            deleteButton.disabled = true;
            deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xóa...';
        }

        console.log('Deleting order:', orderId);
        const result = await orderAPI.deleteOrder(orderId);
        
        if (result && result.success) {
            // Remove the order from the local array
            orders = orders.filter(order => order.orderId !== orderId);
            displayOrders(orders);
            showSuccess('Đã xóa đơn hàng thành công!');
        } else {
            throw new Error(result?.message || 'Không thể xóa đơn hàng');
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        showError(`Lỗi khi xóa đơn hàng: ${error.message}`);
        
        // Re-enable delete button if it exists
        const deleteButton = document.querySelector(`button[data-orderid="${orderId}"]`);
        if (deleteButton) {
            deleteButton.disabled = false;
            deleteButton.innerHTML = '<i class="fas fa-trash"></i> Xóa';
        }
    }
}