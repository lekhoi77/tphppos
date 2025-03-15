// Initialize orders array from localStorage or empty array if none exists
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let editingOrderId = null;
let orderToDelete = null;

// Get DOM elements
const addOrderBtn = document.getElementById('addOrderBtn');
const orderModal = document.getElementById('orderModal');
const orderForm = document.getElementById('orderForm');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.querySelector('.cancel');
const orderTableBody = document.getElementById('orderTableBody');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const notificationYes = document.getElementById('notification-yes');
const notificationNo = document.getElementById('notification-no');

// Money formatting functions
function formatToVND(number) {
    if (!number) return '';
    const roundedNumber = Math.round(Number(number));
    return roundedNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseVNDToNumber(vndString) {
    if (!vndString) return 0;
    return Number(vndString.replace(/\./g, '')) || 0;
}

// Function to handle money input
function handleMoneyInput(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value) {
        const numberValue = Number(value);
        if (numberValue > 20000000) {
            value = '20000000';
        }
        e.target.value = formatToVND(value);
    } else {
        e.target.value = '';
    }
}

// Function to handle money keydown
function handleMoneyKeydown(e) {
    if (!((e.keyCode > 47 && e.keyCode < 58) || // numbers
          (e.keyCode > 95 && e.keyCode < 106) || // numpad
          e.keyCode === 8 || // backspace
          e.keyCode === 46 || // delete
          e.keyCode === 37 || // left arrow
          e.keyCode === 39 || // right arrow
          e.keyCode === 9)) { // tab
        e.preventDefault();
    }
}

// Add event listeners for money input fields
const orderPriceInput = document.getElementById('orderPrice');
const depositInput = document.getElementById('deposit');

orderPriceInput.addEventListener('keydown', handleMoneyKeydown);
orderPriceInput.addEventListener('input', handleMoneyInput);

depositInput.addEventListener('keydown', handleMoneyKeydown);
depositInput.addEventListener('input', handleMoneyInput);

// Show modal when add order button is clicked
addOrderBtn.addEventListener('click', () => {
    editingOrderId = null;
    orderForm.reset();
    document.querySelector('.popup-title').textContent = 'THÊM ĐƠN HÀNG';
    const submitButton = orderForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'Thêm';
    orderModal.style.display = 'flex';
});

// Close modal functions
closeBtn.addEventListener('click', () => {
    orderModal.style.display = 'none';
    orderForm.reset();
    editingOrderId = null;
});

cancelBtn.addEventListener('click', () => {
    orderModal.style.display = 'none';
    orderForm.reset();
    editingOrderId = null;
});

// Close notification when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === notification) {
        notification.style.display = 'none';
        orderToDelete = null;
    }
});

// Function to load orders from localStorage
function loadOrders() {
    displayOrders(orders);
}

// Function to save order
function saveOrder(orderData) {
    try {
        const formattedData = {
            id: editingOrderId || Date.now(), // Use timestamp as ID if new order
            cakeType: orderData.cakeType,
            customerName: orderData.customerName,
            orderSource: orderData.orderSource,
            orderNotes: orderData.orderNotes,
            orderPrice: orderData.orderPrice.replace(/[,.]/g, ''),
            deposit: orderData.deposit ? orderData.deposit.replace(/[,.]/g, '') : 0,
            orderStatus: orderData.orderStatus || 'Đã đặt',
            deliveryAddress: orderData.deliveryAddress,
            deliveryTime: orderData.deliveryTime,
            createdAt: editingOrderId ? (orders.find(o => o.id === editingOrderId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
        };

        if (editingOrderId) {
            // Update existing order
            const index = orders.findIndex(order => order.id === editingOrderId);
            if (index !== -1) {
                orders[index] = formattedData;
            }
        } else {
            // Add new order
            orders.push(formattedData);
        }

        // Save to localStorage
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Refresh display
        loadOrders();
        return true;
    } catch (error) {
        console.error('Error saving order:', error);
        alert('Có lỗi xảy ra khi lưu đơn hàng! Vui lòng kiểm tra lại thông tin.');
        return false;
    }
}

// Function to delete order
function deleteOrderFromDB(orderId) {
    try {
        orders = orders.filter(order => order.id !== orderId);
        localStorage.setItem('orders', JSON.stringify(orders));
        return true;
    } catch (error) {
        console.error('Error deleting order:', error);
        return false;
    }
}

// Function to handle form submission
function handleSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const orderData = {
        cakeType: document.getElementById('cakeType').value,
        customerName: document.getElementById('customerName').value,
        orderSource: document.getElementById('orderSource').value,
        orderNotes: document.getElementById('orderNotes').value,
        orderPrice: document.getElementById('orderPrice').value,
        deposit: document.getElementById('deposit').value,
        orderStatus: document.getElementById('orderStatus').value,
        deliveryAddress: document.getElementById('deliveryAddress').value,
        deliveryTime: document.getElementById('deliveryTime').value
    };

    if (saveOrder(orderData)) {
        orderForm.reset();
        orderModal.style.display = 'none';
    }
}

// Handle notification buttons
notificationYes.addEventListener('click', () => {
    if (orderToDelete !== null) {
        const success = deleteOrderFromDB(orderToDelete);
        
        if (success) {
            loadOrders(); // Refresh the orders list
            notificationMessage.textContent = 'Đã xóa đơn hàng thành công!';
            notificationYes.style.display = 'none';
            notificationNo.style.display = 'none';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 1500);
        } else {
            notificationMessage.textContent = 'Có lỗi xảy ra khi xóa đơn hàng!';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 1500);
        }
        orderToDelete = null;
    }
});

notificationNo.addEventListener('click', () => {
    notification.style.display = 'none';
    orderToDelete = null;
});

// Function to edit order
function editOrder(orderId) {
    const order = orders.find(order => order.id === orderId);
    if (order) {
        editingOrderId = orderId;
        
        // Update modal title
        document.querySelector('.popup-title').textContent = 'SỬA ĐƠN HÀNG';
        
        // Fill form with order data
        document.getElementById('cakeType').value = order.cakeType || '';
        document.getElementById('customerName').value = order.customerName || '';
        document.getElementById('orderSource').value = order.orderSource || '';
        document.getElementById('orderNotes').value = order.orderNotes || '';
        document.getElementById('orderPrice').value = formatToVND(order.orderPrice) || '';
        document.getElementById('deposit').value = formatToVND(order.deposit) || '';
        document.getElementById('orderStatus').value = order.orderStatus || 'Đã đặt';
        document.getElementById('deliveryAddress').value = order.deliveryAddress || '';
        document.getElementById('deliveryTime').value = order.deliveryTime || '';
        
        // Update submit button text
        const submitButton = orderForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Cập nhật';
        
        // Show modal
        orderModal.style.display = 'flex';
    }
}

// Function to delete order
function deleteOrder(orderId) {
    orderToDelete = orderId;
    notification.style.display = 'flex';
    notificationMessage.textContent = 'Bạn có chắc chắn muốn xóa đơn hàng này?';
    notificationYes.style.display = 'inline-block';
    notificationNo.style.display = 'inline-block';
}

// Function to format datetime
function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) return dateTimeStr;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Function to format date
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

// Function to get status class
function getStatusClass(status) {
    switch (status) {
        case 'Đã giao':
            return 'status-delivered';
        case 'Hủy':
            return 'status-cancelled';
        case 'Đã đặt':
        default:
            return 'status-ordered';
    }
}

// Function to display orders
function displayOrders(ordersData) {
    orderTableBody.innerHTML = '';
    
    if (ordersData.length === 0) {
        orderTableBody.innerHTML = '<tr><td colspan="11" class="no-orders">Chưa có đơn hàng nào</td></tr>';
        return;
    }

    // Sort orders by creation date (newest first)
    ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    ordersData.forEach((order, index) => {
        const row = document.createElement('tr');
        row.classList.add('order-row'); // Add class for styling
        if (index < ordersData.length - 1) {
            row.classList.add('order-row-border'); // Add border class except for last row
        }
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.cakeType}</td>
            <td>${order.customerName}</td>
            <td>${order.orderNotes}</td>
            <td>${order.orderSource}</td>
            <td>${formatToVND(order.orderPrice)}đ</td>
            <td>${formatToVND(order.deposit)}đ</td>
            <td class="${getStatusClass(order.orderStatus)}">${order.orderStatus}</td>
            <td>${order.deliveryAddress}</td>
            <td>${order.deliveryTime ? formatDateTime(order.deliveryTime) : ''}</td>
            <td>
                <button onclick="editOrder(${order.id})" class="edit-btn">Sửa</button>
                <button onclick="deleteOrder(${order.id})" class="delete-btn">Xóa</button>
            </td>
        `;
        orderTableBody.appendChild(row);
    });
}

// Add form submit event listener
orderForm.addEventListener('submit', handleSubmit);

// Initial load of orders
loadOrders();

// Add custom validation message for required fields
document.addEventListener('DOMContentLoaded', function() {
    const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
    requiredInputs.forEach(input => {
        input.oninvalid = function(e) {
            e.target.setCustomValidity("Vui lòng nhập thông tin");
        };
        input.oninput = function(e) {
            e.target.setCustomValidity("");
        };
    });
}); 