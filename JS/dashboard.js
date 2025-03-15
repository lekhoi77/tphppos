// Initialize orders array from localStorage or empty array if none exists
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let editingOrderId = null;
let orderToDelete = null;
let currentPage = 1;
const ordersPerPage = 10;

// Kiểm tra kích thước màn hình
let screenSize = getScreenSize();

// Hàm xác định kích thước màn hình
function getScreenSize() {
    const width = window.innerWidth;
    if (width <= 480) return 'mobile-small';
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
}

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
    const newScreenSize = getScreenSize();
    if (screenSize !== newScreenSize) {
        screenSize = newScreenSize;
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

// Show modal when add order button is clicked
addOrderBtn.addEventListener('click', (e) => {
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
    showModalAtPosition(e);
});

// Close modal functions
closeBtn.addEventListener('click', () => {
    hideModal();
});

cancelBtn.addEventListener('click', () => {
    hideModal();
});

// Close notification when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === notification) {
        hideNotification();
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

// Function to display orders
function displayOrders(ordersData) {
    orderTableBody.innerHTML = '';
    
    if (ordersData.length === 0) {
        orderTableBody.innerHTML = '<tr><td colspan="11" class="no-orders">Chưa có đơn hàng nào</td></tr>';
        return;
    }

    // Sort orders by creation date (newest first)
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
        
        // Đảm bảo ID hiển thị theo định dạng #xxxx
        let displayId = order.id;
        if (!String(displayId).startsWith('#')) {
            displayId = '#' + String(displayId).padStart(4, '0');
        }
        
        // Hiển thị khác nhau dựa trên kích thước màn hình
        if (screenSize === 'desktop') {
            // Desktop view - hiển thị dạng bảng đầy đủ
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
        } else {
            // Card view cho tablet và mobile
            row.innerHTML = `
                <div class="order-card-header">
                    <span class="order-id">${displayId}</span>
                    <span class="order-status ${getStatusClass(order.orderStatus)}">${order.orderStatus || 'Đã đặt'}</span>
                </div>
                <div class="order-card-main">
                    <div class="info-group">
                        <span class="info-label">Loại bánh</span>
                        <span class="info-value">${order.cakeType || 'N/A'}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Khách hàng</span>
                        <span class="info-value">${order.customerName || 'N/A'}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Kênh</span>
                        <span class="info-value">${order.orderSource || 'N/A'}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Thời gian giao</span>
                        <span class="info-value">${order.deliveryTime ? formatDateTime(order.deliveryTime) : 'N/A'}</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Giá</span>
                        <span class="info-value">${formatToVND(order.orderPrice)}đ</span>
                    </div>
                    <div class="info-group">
                        <span class="info-label">Đã cọc</span>
                        <span class="info-value">${formatToVND(order.deposit)}đ</span>
                    </div>
                    ${order.deliveryAddress ? `
                        <div class="info-group" style="grid-column: 1 / -1;">
                            <span class="info-label">Địa chỉ giao</span>
                            <span class="info-value">${order.deliveryAddress}</span>
                        </div>
                    ` : ''}
                    ${order.orderNotes ? `
                        <div class="order-card-notes">
                            <span class="info-label">Nội dung :</span>
                            <span class="info-value">${order.orderNotes}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="order-card-footer">
                    <button onclick="editOrder('${order.id}')" class="edit-btn">Sửa</button>
                    <button onclick="deleteOrder('${order.id}')" class="delete-btn">Xóa</button>
                </div>
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
            // Scroll to top on mobile/tablet
            if (screenSize !== 'desktop') {
                window.scrollTo({top: 0, behavior: 'smooth'});
            }
        }
    };
    pagination.appendChild(prevButton);

    // Page numbers - Hiển thị số lượng nút phù hợp với kích thước màn hình
    let maxPageButtons;
    if (screenSize === 'mobile-small') {
        maxPageButtons = 3;
    } else if (screenSize === 'mobile') {
        maxPageButtons = 5;
    } else if (screenSize === 'tablet') {
        maxPageButtons = 7;
        } else {
        maxPageButtons = 10;
    }
    
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
            if (screenSize !== 'desktop') {
                window.scrollTo({top: 0, behavior: 'smooth'});
            }
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
            if (screenSize !== 'desktop') {
                window.scrollTo({top: 0, behavior: 'smooth'});
            }
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
            if (screenSize !== 'desktop') {
                window.scrollTo({top: 0, behavior: 'smooth'});
            }
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
            if (screenSize !== 'desktop') {
                window.scrollTo({top: 0, behavior: 'smooth'});
            }
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
    const order = orders.find(order => {
        const normalizedOrderId = String(order.id).replace('#', '');
        const normalizedSearchId = String(orderId).replace('#', '');
        return normalizedOrderId === normalizedSearchId;
    });
    
    if (order) {
        editingOrderId = order.id;
        
        document.querySelector('.popup-title').textContent = 'SỬA ĐƠN HÀNG';
        
        document.getElementById('cakeType').value = order.cakeType || '';
        document.getElementById('customerName').value = order.customerName || '';
        document.getElementById('orderSource').value = order.orderSource || '';
        document.getElementById('orderNotes').value = order.orderNotes || '';
        document.getElementById('orderPrice').value = formatToVND(order.orderPrice) || '';
        document.getElementById('deposit').value = formatToVND(order.deposit) || '';
        document.getElementById('orderStatus').value = order.orderStatus || 'Đã đặt';
        document.getElementById('deliveryAddress').value = order.deliveryAddress || '';
        document.getElementById('deliveryTime').value = order.deliveryTime || '';
        
        const submitButton = orderForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Cập nhật';
        
        // Get the edit button's position
        const editButton = event.target;
        const buttonRect = editButton.getBoundingClientRect();
        const clickEvent = {
            clientY: buttonRect.top + (buttonRect.height / 2)
        };
        showModalAtPosition(clickEvent);
    } else {
        console.error('Không tìm thấy đơn hàng với ID:', orderId);
    }
}

// Function to hide modal
function hideModal() {
    orderModal.classList.remove('show');
    // Wait for animation to complete before hiding
    setTimeout(() => {
        orderModal.style.display = 'none';
        orderForm.reset();
        editingOrderId = null;
        document.body.style.overflow = '';
    }, 300); // Match animation duration
}

// Function to delete order
function deleteOrder(orderId) {
    orderToDelete = orderId;
    const notification = document.getElementById('notification');
    
    // Lấy vị trí của nút xóa
    const deleteButton = event.target;
    const buttonRect = deleteButton.getBoundingClientRect();
    
    // Hiển thị thông báo
    notification.style.display = 'block';
    notificationMessage.textContent = 'Bạn có chắc chắn muốn xóa đơn hàng này?';
    notificationYes.style.display = 'inline-block';
    notificationNo.style.display = 'inline-block';
    
    // Chỉ áp dụng vị trí động cho tablet và mobile
    if (screenSize !== 'desktop') {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const notificationHeight = notification.offsetHeight;
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        
        // Tính toán vị trí left để thông báo không vượt quá màn hình
        let leftPosition = buttonRect.left;
        const notificationWidth = notification.offsetWidth;
        if (leftPosition + notificationWidth > windowWidth) {
            leftPosition = windowWidth - notificationWidth - 10;
        }
        if (leftPosition < 10) {
            leftPosition = 10;
        }
        
        // Tính toán vị trí top để thông báo không vượt quá màn hình
        let topPosition = buttonRect.top + scrollTop;
        
        // Kiểm tra xem thông báo có bị che khuất bởi bottom của viewport không
        if (topPosition + notificationHeight > scrollTop + windowHeight) {
            // Nếu bị che, hiển thị thông báo phía trên nút
            topPosition = buttonRect.top + scrollTop - notificationHeight - 10;
        }
        
        // Áp dụng vị trí
        notification.style.left = leftPosition + 'px';
        notification.style.top = topPosition + 'px';
    }
}

// Function to hide notification
function hideNotification() {
    const notification = document.getElementById('notification');
    notification.style.display = 'none';
    orderToDelete = null;
    
    // Reset position styles
    if (screenSize !== 'desktop') {
        notification.style.left = '';
        notification.style.top = '';
    }
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
        hideModal();
    }
}

// Update notification button event listeners
notificationYes.addEventListener('click', () => {
    if (orderToDelete !== null) {
        const success = deleteOrderFromDB(orderToDelete);
        
        if (success) {
            if (currentPage > 1 && (currentPage - 1) * ordersPerPage >= orders.length) {
                currentPage--;
            }
            
            displayOrders(orders);
            notificationMessage.textContent = 'Đã xóa đơn hàng thành công!';
            notificationYes.style.display = 'none';
            notificationNo.style.display = 'none';
            setTimeout(hideNotification, 1500);
        } else {
            notificationMessage.textContent = 'Có lỗi xảy ra khi xóa đơn hàng!';
            setTimeout(hideNotification, 1500);
        }
        orderToDelete = null;
    }
});

notificationNo.addEventListener('click', hideNotification);

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