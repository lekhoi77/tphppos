import orderAPI from './api.js';

let orders = [];
let currentPage = 1;
const ordersPerPage = 10;
let orderToDelete = null;
let screenSize = getScreenSize();

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
        const response = await orderAPI.getOrders(currentPage, ordersPerPage);
        orders = response.orders;
        displayOrders(orders);
        updatePagination(response.totalPages);
    } catch (error) {
        showError('Không thể tải danh sách đơn hàng');
    }
});

// Function to display orders
function displayOrders(orders) {
    const tableBody = document.querySelector('#orderTable tbody');
    tableBody.innerHTML = '';

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.orderId}</td>
            <td>${order.cakeType}</td>
            <td>${order.customerName}</td>
            <td>${order.orderSource}</td>
            <td>${order.orderNotes || ''}</td>
            <td>${formatPrice(order.orderPrice)}</td>
            <td>${formatPrice(order.deposit)}</td>
            <td>${order.orderStatus}</td>
            <td>${order.deliveryAddress || ''}</td>
            <td>${formatDateTime(order.deliveryTime)}</td>
            <td>
                <button onclick="editOrder('${order.orderId}')" class="edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteOrder('${order.orderId}')" class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Function to add new order
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

// Function to update order
async function updateOrder(orderId, orderData) {
    try {
        const updatedOrder = await orderAPI.updateOrder(orderId, orderData);
        const index = orders.findIndex(order => order.orderId === orderId);
        if (index !== -1) {
            orders[index] = updatedOrder;
            displayOrders(orders);
        }
        hideModal();
        showSuccess('Đã cập nhật đơn hàng thành công!');
    } catch (error) {
        showError('Không thể cập nhật đơn hàng');
    }
}

// Function to delete order
async function deleteOrderFromDB(orderId) {
    try {
        await orderAPI.deleteOrder(orderId);
        orders = orders.filter(order => order.orderId !== orderId);
            return true;
    } catch (error) {
        showError('Không thể xóa đơn hàng');
        return false;
    }
}

// Function to handle pagination
async function changePage(page) {
    try {
        currentPage = page;
        const response = await orderAPI.getOrders(currentPage, ordersPerPage);
        orders = response.orders;
        displayOrders(orders);
        updatePagination(response.totalPages);
    } catch (error) {
        showError('Không thể tải trang đơn hàng');
    }
}

// Function to update pagination
function updatePagination(totalPages) {
    paginationContainer.innerHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        const prevButton = createPaginationButton(currentPage - 1, '←');
        paginationContainer.appendChild(prevButton);
    }
    
    // Page buttons
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 || // First page
            i === totalPages || // Last page
            (i >= currentPage - 2 && i <= currentPage + 2) // Pages around current page
        ) {
            const pageButton = createPaginationButton(i);
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            paginationContainer.appendChild(pageButton);
        } else if (
            (i === currentPage - 3 && currentPage > 4) ||
            (i === currentPage + 3 && currentPage < totalPages - 3)
        ) {
            // Add ellipsis
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            paginationContainer.appendChild(ellipsis);
        }
    }
    
    // Next button
    if (currentPage < totalPages) {
        const nextButton = createPaginationButton(currentPage + 1, '→');
        paginationContainer.appendChild(nextButton);
    }
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

// ... (giữ nguyên các hàm helper khác như formatPrice, formatDateTime, etc.)

// Function to show modal at clicked position
function showModalAtPosition(clickEvent) {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const clickY = clickEvent.clientY + scrollTop;
    
    orderModal.style.display = 'block';
    const modalContent = orderModal.querySelector('.modal-content');
    const modalHeight = modalContent.offsetHeight;
    const windowHeight = window.innerHeight;
    
    // Calculate the best position to show the modal
    let topPosition = clickY - (modalHeight / 2);
    
    // Make sure the modal doesn't go above the viewport
    topPosition = Math.max(scrollTop + 20, topPosition);
    
    // Make sure the modal doesn't go below the viewport
    const maxTop = scrollTop + windowHeight - modalHeight - 20;
    topPosition = Math.min(maxTop, topPosition);
    
    orderModal.style.top = topPosition + 'px';
    document.body.style.overflow = 'hidden';
    
    // Reset modal content scroll position to top
    modalContent.scrollTop = 0;
    
    // Add show class after a small delay to trigger animation
    requestAnimationFrame(() => {
        orderModal.classList.add('show');
    });
}

// Function to hide modal
function hideModal() {
    orderModal.classList.remove('show');
    // Wait for animation to complete before hiding
    setTimeout(() => {
        orderModal.style.display = 'none';
        orderForm.reset();
        document.body.style.overflow = '';
    }, 300); // Match animation duration
}

// Show modal when add order button is clicked
addOrderBtn.addEventListener('click', (e) => {
    // Reset form and prepare for new order
    orderForm.reset();
    
    // Set default delivery time to current date and time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById('deliveryTime').value = defaultDateTime;
    
    // Update modal title and button text
    document.querySelector('.popup-title').textContent = 'THÊM ĐƠN HÀNG';
    const submitButton = orderForm.querySelector('button[type="submit"]');
    submitButton.textContent = 'Thêm';
    
    // Show modal at click position
    showModalAtPosition(e);
});

// Close modal when clicking close or cancel button
closeBtn.addEventListener('click', hideModal);
cancelBtn.addEventListener('click', hideModal);

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === orderModal) {
        hideModal();
    }
});

// Handle form submission
orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(orderForm);
    const orderData = {
        orderId: generateOrderId(), // You need to implement this function
        cakeType: formData.get('cakeType'),
        customerName: formData.get('customerName'),
        orderSource: formData.get('orderSource'),
        orderNotes: formData.get('orderNotes'),
        orderPrice: parseFloat(formData.get('orderPrice').replace(/[,.]/g, '')),
        deposit: parseFloat(formData.get('deposit').replace(/[,.]/g, '') || 0),
        orderStatus: formData.get('orderStatus') || 'Đã đặt',
        deliveryAddress: formData.get('deliveryAddress'),
        deliveryTime: formData.get('deliveryTime')
    };

    try {
        await addOrder(orderData);
        hideModal();
        showSuccess('Đã thêm đơn hàng thành công!');
    } catch (error) {
        showError('Không thể thêm đơn hàng: ' + error.message);
    }
});

// Function to generate order ID
function generateOrderId() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${timestamp}${random}`;
}

// Export functions for use in other files
window.addOrder = addOrder;
window.updateOrder = updateOrder;
window.deleteOrder = deleteOrder;
window.deleteOrderFromDB = deleteOrderFromDB;
window.changePage = changePage;