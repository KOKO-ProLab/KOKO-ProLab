// وظائف صفحة متابعة الطلبات
document.addEventListener('DOMContentLoaded', function() {
    let currentUser = null;
    let orders = [];
    let currentFilter = 'all';

    // تهيئة الصفحة
    initOrdersPage();

    function initOrdersPage() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                loadOrders();
                setupEventListeners();
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    function loadOrders() {
        db.collection('orders')
            .where('uid', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .onSnapshot((querySnapshot) => {
                orders = [];
                querySnapshot.forEach((doc) => {
                    orders.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                updateOrdersUI();
                updateOrdersStats();
            });
    }

    function updateOrdersUI() {
        const ordersList = document.getElementById('ordersList');
        const noOrders = document.getElementById('noOrders');
        
        if (orders.length === 0) {
            ordersList.innerHTML = '';
            noOrders.style.display = 'block';
            return;
        }
        
        noOrders.style.display = 'none';
        
        // تصفية الطلبات حسب الحالة
        const filteredOrders = currentFilter === 'all' 
            ? orders 
            : orders.filter(order => order.status === currentFilter);
        
        if (filteredOrders.length === 0) {
            ordersList.innerHTML = `
                <div class="no-filtered-orders">
                    <i class="fas fa-search"></i>
                    <p>لا توجد طلبات في هذه الفئة</p>
                </div>
            `;
            return;
        }
        
        ordersList.innerHTML = '';
        
        filteredOrders.forEach(order => {
            const orderElement = createOrderElement(order);
            ordersList.appendChild(orderElement);
        });
    }

    function createOrderElement(order) {
        const orderElement = document.createElement('div');
        orderElement.className = `order-item order-${order.status}`;
        orderElement.innerHTML = `
            <div class="order-header">
                <div class="order-info">
                    <span class="order-id">#${order.orderId}</span>
                    <span class="order-service">${order.serviceName}</span>
                </div>
                <div class="order-status status-${order.status}">
                    ${getStatusText(order.status)}
                </div>
            </div>
            <div class="order-details">
                <div class="detail">
                    <span class="label">الرابط:</span>
                    <span class="value">${order.link}</span>
                </div>
                <div class="detail">
                    <span class="label">الكمية:</span>
                    <span class="value">${order.quantity.toLocaleString()}</span>
                </div>
                <div class="detail">
                    <span class="label">التكلفة:</span>
                    <span class="value">${order.cost.toFixed(2)} جنيه</span>
                </div>
                <div class="detail">
                    <span class="label">التاريخ:</span>
                    <span class="value">${formatDate(order.createdAt)}</span>
                </div>
            </div>
            <div class="order-actions">
                <button class="btn-view-details" data-order-id="${order.id}">
                    <i class="fas fa-eye"></i>
                    عرض التفاصيل
                </button>
            </div>
        `;
        
        return orderElement;
    }

    function updateOrdersStats() {
        const stats = {
            pending: 0,
            'in-progress': 0,
            completed: 0,
            rejected: 0
        };
        
        orders.forEach(order => {
            if (stats.hasOwnProperty(order.status)) {
                stats[order.status]++;
            }
        });
        
        document.getElementById('pendingCount').textContent = stats.pending;
        document.getElementById('progressCount').textContent = stats['in-progress'];
        document.getElementById('completedCount').textContent = stats.completed;
        document.getElementById('rejectedCount').textContent = stats.rejected;
    }

    function getStatusText(status) {
        const statusMap = {
            'pending': 'قيد المراجعة',
            'in-progress': 'قيد التنفيذ',
            'completed': 'مكتمل',
            'rejected': 'مرفوض'
        };
        
        return statusMap[status] || status;
    }

    function setupEventListeners() {
        // فلاتر الطلبات
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // إزالة النشط من جميع الأزرار
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // إضافة النشط للزر المحدد
                this.classList.add('active');
                // تحديث الفلتر
                currentFilter = this.getAttribute('data-filter');
                updateOrdersUI();
            });
        });
        
        // تفاصيل الطلب
        document.addEventListener('click', function(e) {
            if (e.target.closest('.btn-view-details')) {
                const orderId = e.target.closest('.btn-view-details').getAttribute('data-order-id');
                showOrderDetails(orderId);
            }
        });
        
        // إغلاق النماذج
        const closeButtons = document.querySelectorAll('.close');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                modal.style.display = 'none';
            });
        });
        
        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
    }

    function showOrderDetails(orderId) {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        
        const modal = document.getElementById('orderDetailsModal');
        const detailsContainer = document.getElementById('orderDetails');
        
        detailsContainer.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">رقم الطلب:</span>
                <span class="detail-value">#${order.orderId}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">الخدمة:</span>
                <span class="detail-value">${order.serviceName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">الحالة:</span>
                <span class="detail-value status-${order.status}">${getStatusText(order.status)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">الرابط:</span>
                <span class="detail-value">${order.link}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">الكمية:</span>
                <span class="detail-value">${order.quantity.toLocaleString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">التكلفة:</span>
                <span class="detail-value">${order.cost.toFixed(2)} جنيه</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">تاريخ الإنشاء:</span>
                <span class="detail-value">${formatDate(order.createdAt)}</span>
            </div>
            ${order.completedAt ? `
            <div class="detail-row">
                <span class="detail-label">تاريخ الإكمال:</span>
                <span class="detail-value">${formatDate(order.completedAt)}</span>
            </div>
            ` : ''}
            ${order.notes ? `
            <div class="detail-row">
                <span class="detail-label">ملاحظات:</span>
                <span class="detail-value">${order.notes}</span>
            </div>
            ` : ''}
        `;
        
        modal.style.display = 'block';
    }
});
