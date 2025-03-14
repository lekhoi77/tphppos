// Initialize orders array from localStorage or empty array
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let editingOrderId = null; // Track which order is being edited
let orderToDelete = null; // Track which order is being deleted

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

// Show modal when add order button is clicked
addOrderBtn.addEventListener('click', () => {
    editingOrderId = null; // Reset editing state
    orderForm.reset();
    orderModal.style.display = 'flex';
});

// Close modal when clicking close button or cancel button
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

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === orderModal) {
        orderModal.style.display = 'none';
        orderForm.reset();
        editingOrderId = null;
    }
    if (e.target === notification) {
        notification.style.display = 'none';
        orderToDelete = null;
    }
});

// Handle notification buttons
notificationYes.addEventListener('click', () => {
    if (orderToDelete !== null) {
        try {
            // Remove the order
            orders = orders.filter(order => order.id !== orderToDelete);
            
            // Reorder remaining orders
            orders = orders.map((order, index) => {
                return {
                    ...order,
                    id: index + 1
                };
            });
            
            // Save to localStorage
            localStorage.setItem('orders', JSON.stringify(orders));
            
            // Update table display
            displayOrders();
            
            // Show success message
            notificationMessage.textContent = 'Đã xóa đơn hàng thành công!';
            notificationYes.style.display = 'none';
            notificationNo.style.display = 'none';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 1500);
        } catch (error) {
            notificationMessage.textContent = 'Có lỗi xảy ra khi xóa đơn hàng!';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 1500);
        }
    }
});

notificationNo.addEventListener('click', () => {
    notification.style.display = 'none';
    orderToDelete = null;
});

// Handle form submission
orderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form values
    const cakeType = document.getElementById('cakeType').value;
    const customerName = document.getElementById('customerName').value;
    const orderSource = document.getElementById('orderSource').value;
    const orderNotes = document.getElementById('orderNotes').value;
    const orderPrice = document.getElementById('orderPrice').value;
    const deposit = document.getElementById('deposit').value;
    const orderStatus = document.getElementById('orderStatus').value;
    const deliveryAddress = document.getElementById('deliveryAddress').value;
    const deliveryTime = document.getElementById('deliveryTime').value;

    if (editingOrderId !== null) {
        // Update existing order
        const orderIndex = orders.findIndex(order => order.id === editingOrderId);
        if (orderIndex !== -1) {
            orders[orderIndex] = {
                ...orders[orderIndex],
                cakeType,
                customerName,
                orderSource,
                orderNotes,
                orderPrice,
                deposit,
                orderStatus,
                deliveryAddress,
                deliveryTime
            };
        }
    } else {
        // Create new order with sequential ID
        const newOrder = {
            id: orders.length + 1,
            cakeType,
            customerName,
            orderSource,
            orderNotes,
            orderPrice,
            deposit,
            orderStatus,
            deliveryAddress,
            deliveryTime,
            date: new Date().toLocaleDateString('vi-VN')
        };
        orders.push(newOrder);
    }

    // Save to localStorage
    localStorage.setItem('orders', JSON.stringify(orders));

    // Update table display
    displayOrders();

    // Close modal and reset form
    orderModal.style.display = 'none';
    orderForm.reset();
    editingOrderId = null;
});

// Function to edit order
function editOrder(orderId) {
    const order = orders.find(order => order.id === orderId);
    if (order) {
        editingOrderId = orderId;
        // Fill form with order data
        document.getElementById('cakeType').value = order.cakeType;
        document.getElementById('customerName').value = order.customerName;
        document.getElementById('orderSource').value = order.orderSource;
        document.getElementById('orderNotes').value = order.orderNotes;
        document.getElementById('orderPrice').value = order.orderPrice;
        document.getElementById('deposit').value = order.deposit;
        document.getElementById('orderStatus').value = order.orderStatus;
        document.getElementById('deliveryAddress').value = order.deliveryAddress;
        document.getElementById('deliveryTime').value = order.deliveryTime;
        // Show modal
        orderModal.style.display = 'flex';
    }
}

// Function to delete order
function deleteOrder(orderId) {
    orderToDelete = orderId;
    notificationMessage.textContent = 'Bạn có chắc chắn muốn xóa đơn hàng này?';
    notificationYes.style.display = 'block';
    notificationNo.style.display = 'block';
    notification.style.display = 'flex';
}

// Function to display orders in table
function displayOrders() {
    orderTableBody.innerHTML = '';
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.cakeType}</td>
            <td>${order.customerName}</td>
            <td>${order.orderNotes}</td>
            <td>${order.orderSource}</td>
            <td>${order.date}</td>
            <td>${order.orderPrice}</td>
            <td>${order.deposit}</td>
            <td>${order.orderStatus}</td>
            <td>${order.deliveryAddress}</td>
            <td>
                <button onclick="editOrder(${order.id})" class="edit-btn">Sửa</button>
                <button onclick="deleteOrder(${order.id})" class="delete-btn">Xóa</button>
            </td>
        `;
        orderTableBody.appendChild(row);
    });
}

// Initial display of orders
displayOrders(); 