// Initialize orders array from localStorage or empty array if none exists
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let editingOrderId = null;
let orderToDelete = null;
let currentPage = 1;
const ordersPerPage = 10;
let isMobile = window.innerWidth <= 768; // Kiểm tra nếu là mobile
let isTabletLandscape = window.innerWidth > 768 && window.innerWidth <= 1024 && window.innerHeight < window.innerWidth; // Kiểm tra nếu là tablet landscape

// Debounce function để tối ưu hiệu năng
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Theo dõi resize window với debounce
window.addEventListener('resize', debounce(function() {
    const wasMobile = isMobile;
    const wasTabletLandscape = isTabletLandscape;
    
    isMobile = window.innerWidth <= 768;
    isTabletLandscape = window.innerWidth > 768 && window.innerWidth <= 1024 && window.innerHeight < window.innerWidth;
    
    // Chỉ reload khi chuyển đổi giữa các mode
    if (wasMobile !== isMobile || wasTabletLandscape !== isTabletLandscape) {
        displayOrders(orders);
    }
}, 250));

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
    
    // Set default delivery time to current date and time
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById('deliveryTime').value = defaultDateTime;
    
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

// Function to generate next order ID
function generateOrderId() {
    // Tìm ID lớn nhất hiện tại
    let maxId = 0;
    orders.forEach(order => {
        // Nếu ID là dạng số hoặc chuỗi số (không có #)
        const numericId = parseInt(String(order.id).replace('#', ''));
        if (!isNaN(numericId) && numericId > maxId) {
            maxId = numericId;
        }
    });
    
    // Tạo ID mới với định dạng #xxxx
    return '#' + (maxId + 1).toString().padStart(4, '0');
}

// Function to display orders - tối ưu hóa
function displayOrders(ordersData) {
    orderTableBody.innerHTML = '';
    
    if (ordersData.length === 0) {
        orderTableBody.innerHTML = '<tr><td colspan="11" class="no-orders">Chưa có đơn hàng nào</td></tr>';
        return;
    }

    // Sort orders by creation date (newest first)
    // Chỉ sắp xếp khi cần thiết
    if (!ordersData._sorted) {
        ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        ordersData._sorted = true;
    }

    // Calculate pagination
    const totalPages = Math.ceil(ordersData.length / ordersPerPage);
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = Math.min(startIndex + ordersPerPage, ordersData.length);
    const currentOrders = ordersData.slice(startIndex, endIndex);

    // Tạo fragment để tối ưu DOM operations
    const fragment = document.createDocumentFragment();

    // Display current page orders
    currentOrders.forEach((order, index) => {
        const row = document.createElement('tr');
        row.classList.add('order-row');
        if (index < currentOrders.length - 1) {
            row.classList.add('order-row-border');
        }
        
        // Đảm bảo ID hiển thị theo định dạng #xxxx
        let displayId = order.id;
        if (!String(displayId).startsWith('#')) {
            // Nếu ID không bắt đầu bằng #, thêm vào
            displayId = '#' + String(displayId).padStart(4, '0');
        }
        
        // Tối ưu hiển thị trên mobile - Sử dụng cấu trúc mới
        if (isMobile) {
            row.innerHTML = `
                <td>${displayId}</td>
                <td>${order.cakeType || 'N/A'}</td>
                <td>${order.customerName || 'N/A'}</td>
                <td>${order.orderSource || 'N/A'}</td>
                <td>${formatToVND(order.orderPrice)}đ</td>
                <td>${formatToVND(order.deposit)}đ</td>
                <td class="${getStatusClass(order.orderStatus)}">${order.orderStatus || 'Đã đặt'}</td>
                <td>${order.deliveryTime ? formatDateTime(order.deliveryTime) : 'N/A'}</td>
                <td>
                    <button onclick="editOrder('${order.id}')" class="edit-btn">Sửa</button>
                    <button onclick="deleteOrder('${order.id}')" class="delete-btn">Xóa</button>
                </td>
            `;
        } else {
            row.innerHTML = `
                <td>${displayId}</td>
                <td>${order.cakeType || ''}</td>
                <td>${order.customerName || ''}</td>
                <td>${order.orderNotes || ''}</td>
                <td>${order.orderSource || ''}</td>
                <td>${formatToVND(order.orderPrice)}đ</td>
                <td>${formatToVND(order.deposit)}đ</td>
                <td class="${getStatusClass(order.orderStatus)}">${order.orderStatus || 'Đã đặt'}</td>
                <td>${order.deliveryAddress || ''}</td>
                <td>${order.deliveryTime ? formatDateTime(order.deliveryTime) : ''}</td>
                <td>
                    <button onclick="editOrder('${order.id}')" class="edit-btn">Sửa</button>
                    <button onclick="deleteOrder('${order.id}')" class="delete-btn">Xóa</button>
                </td>
            `;
        }
        
        fragment.appendChild(row);
    });
    
    orderTableBody.appendChild(fragment);

    // Update pagination buttons
    updatePagination(totalPages);
}

// Function to update pagination buttons
function updatePagination(totalPages) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) {
        const container = document.createElement('div');
        container.className = 'pagination';
        document.querySelector('main').appendChild(container);
    }

    const pagination = document.querySelector('.pagination');
    pagination.innerHTML = '';

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Trước';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            displayOrders(orders);
            // Scroll to top on mobile
            if (isMobile) {
                window.scrollTo({top: 0, behavior: 'smooth'});
            }
        }
    };
    pagination.appendChild(prevButton);

    // Page numbers - Hiển thị số nút trang phù hợp với từng thiết bị
    const maxPageButtons = isMobile ? 3 : (isTabletLandscape ? 5 : 10);
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    // Điều chỉnh lại startPage nếu cần
    if (endPage - startPage + 1 < maxPageButtons) {
        startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    // Thêm nút trang đầu nếu cần
    if (startPage > 1) {
        const firstPageButton = document.createElement('button');
        firstPageButton.textContent = '1';
        firstPageButton.onclick = () => {
            currentPage = 1;
            displayOrders(orders);
            if (isMobile) window.scrollTo({top: 0, behavior: 'smooth'});
        };
        pagination.appendChild(firstPageButton);
        
        // Thêm dấu ... nếu cần
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            pagination.appendChild(ellipsis);
        }
    }

    // Thêm các nút trang
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.toggle('active', i === currentPage);
        pageButton.onclick = () => {
            currentPage = i;
            displayOrders(orders);
            if (isMobile) window.scrollTo({top: 0, behavior: 'smooth'});
        };
        pagination.appendChild(pageButton);
    }
    
    // Thêm nút trang cuối nếu cần
    if (endPage < totalPages) {
        // Thêm dấu ... nếu cần
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            pagination.appendChild(ellipsis);
        }
        
        const lastPageButton = document.createElement('button');
        lastPageButton.textContent = totalPages;
        lastPageButton.onclick = () => {
            currentPage = totalPages;
            displayOrders(orders);
            if (isMobile) window.scrollTo({top: 0, behavior: 'smooth'});
        };
        pagination.appendChild(lastPageButton);
    }

    // Next button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Sau';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayOrders(orders);
            if (isMobile) window.scrollTo({top: 0, behavior: 'smooth'});
        }
    };
    pagination.appendChild(nextButton);
}

// Function to save order
function saveOrder(orderData) {
    try {
        const formattedData = {
            id: editingOrderId || generateOrderId(),
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
            const index = orders.findIndex(order => order.id === editingOrderId);
            if (index !== -1) {
                orders[index] = formattedData;
            }
        } else {
            orders.push(formattedData);
        }

        localStorage.setItem('orders', JSON.stringify(orders));
        displayOrders(orders);
        return true;
    } catch (error) {
        console.error('Error saving order:', error);
        alert('Có lỗi xảy ra khi lưu đơn hàng! Vui lòng kiểm tra lại thông tin.');
        return false;
    }
}

// Function to edit order
function editOrder(orderId) {
    // Tìm đơn hàng bằng ID, xử lý cả trường hợp có # và không có #
    const order = orders.find(order => {
        // Chuẩn hóa cả hai ID để so sánh
        const normalizedOrderId = String(order.id).replace('#', '');
        const normalizedSearchId = String(orderId).replace('#', '');
        return normalizedOrderId === normalizedSearchId;
    });
    
    if (order) {
        editingOrderId = order.id; // Sử dụng ID gốc từ đơn hàng tìm thấy
        
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
    } else {
        console.error('Không tìm thấy đơn hàng với ID:', orderId);
    }
}

// Function to delete order
function deleteOrder(orderId) {
    // Lưu ID để xóa sau này
    orderToDelete = orderId;
    notification.style.display = 'flex';
    notificationMessage.textContent = 'Bạn có chắc chắn muốn xóa đơn hàng này?';
    notificationYes.style.display = 'inline-block';
    notificationNo.style.display = 'inline-block';
}

// Function to delete order from DB
function deleteOrderFromDB(orderId) {
    try {
        // Tìm đơn hàng bằng ID, xử lý cả trường hợp có # và không có #
        orders = orders.filter(order => {
            // Chuẩn hóa cả hai ID để so sánh
            const normalizedOrderId = String(order.id).replace('#', '');
            const normalizedSearchId = String(orderId).replace('#', '');
            return normalizedOrderId !== normalizedSearchId;
        });
        
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
            // Kiểm tra nếu trang hiện tại không còn đơn hàng nào và không phải trang đầu tiên
            if (currentPage > 1 && (currentPage - 1) * ordersPerPage >= orders.length) {
                currentPage--;
            }
            
            displayOrders(orders); // Refresh the orders list
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

// Add form submit event listener
orderForm.addEventListener('submit', handleSubmit);

// Initial load of orders
loadOrders();

// Add custom validation message for required fields
document.addEventListener('DOMContentLoaded', function() {
    const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
    requiredInputs.forEach(input => {
        input.oninvalid = function(e) {
            if (input.id === 'orderSource') {
                e.target.setCustomValidity("Chọn kênh đi trời");
            } else {
                e.target.setCustomValidity("Nhập thiếu này nhen");
            }
        };
        input.oninput = function(e) {
            e.target.setCustomValidity("");
        };
    });
}); 