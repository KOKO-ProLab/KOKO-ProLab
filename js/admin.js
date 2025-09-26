// وظائف لوحة الإدارة
document.addEventListener('DOMContentLoaded', function() {
    let currentUser = null;
    let isAdmin = false;

    // تهيئة لوحة الإدارة
    initAdminPanel();

    function initAdminPanel() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                currentUser = user;
                
                // التحقق من صلاحيات المدير
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists && userDoc.data().role === 'admin') {
                    isAdmin = true;
                    loadAdminData();
                    setupEventListeners();
                } else {
                    // إذا لم يكن مديراً، إعادة التوجيه
                    window.location.href = 'index.html';
                }
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    function loadAdminData() {
        loadDashboardStats();
        loadRecentOrders();
        loadAllOrders();
        loadDeposits();
        loadUsers();
        loadTickets();
        loadNotifications();
        loadSettings();
    }

    function loadDashboardStats() {
        // إجمالي المستخدمين
        db.collection('users').get().then((snapshot) => {
            document.getElementById('totalUsers').textContent = snapshot.size;
        });

        // إجمالي الطلبات
        db.collection('orders').get().then((snapshot) => {
            document.getElementById('totalOrders').textContent = snapshot.size;
        });

        // إجمالي الإيرادات
        db.collection('orders').where('status', '==', 'completed').get().then((snapshot) => {
            let totalRevenue = 0;
            snapshot.forEach(doc => {
                totalRevenue += doc.data().cost;
            });
            document.getElementById('totalRevenue').textContent = totalRevenue.toFixed(2);
        });

        // التذاكر المفتوحة
        db.collection('tickets').where('status', '==', 'open').get().then((snapshot) => {
            document.getElementById('openTickets').textContent = snapshot.size;
        });
    }

    function loadRecentOrders() {
        db.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get()
            .then((snapshot) => {
                const container = document.getElementById('recentOrders');
                container.innerHTML = '';

                if (snapshot.empty) {
                    container.innerHTML = '<p>لا توجد طلبات حديثة</p>';
                    return;
                }

                snapshot.forEach(doc => {
                    const order = doc.data();
                    const element = document.createElement('div');
                    element.className = 'recent-order';
                    element.innerHTML = `
                        <div class="order-info">
                            <span class="order-id">#${order.orderId}</span>
                            <span class="order-service">${order.serviceName}</span>
                        </div>
                        <div class="order-status status-${order.status}">
                            ${getStatusText(order.status)}
                        </div>
                    `;
                    container.appendChild(element);
                });
            });
    }

    function loadAllOrders() {
        // سيتم تنفيذها في قسم إدارة الطلبات
    }

    function loadDeposits() {
        // سيتم تنفيذها في قسم طلبات الشحن
    }

    function loadUsers() {
        // سيتم تنفيذها في قسم إدارة المستخدمين
    }

    function loadTickets() {
        // سيتم تنفيذها في قسم تذاكر الدعم
    }

    function loadNotifications() {
        // سيتم تنفيذها في قسم الإشعارات
    }

    function loadSettings() {
        // تحميل إعدادات الدفع
        db.collection('paymentMethods').doc('methods').get()
            .then((doc) => {
                if (doc.exists) {
                    const methods = doc.data();
                    document.getElementById('vodafoneNumber').value = methods.vodafone || '';
                    document.getElementById('bitcoinAddress').value = methods.bitcoin || '';
                    document.getElementById('ethereumAddress').value = methods.ethereum || '';
                }
            });

        // تحميل الإحصائيات
        db.collection('stats').doc('general').get()
            .then((doc) => {
                if (doc.exists) {
                    const stats = doc.data();
                    document.getElementById('totalUsersStat').value = stats.usersCount || 0;
                    document.getElementById('totalOrdersStat').value = stats.ordersCount || 0;
                    document.getElementById('satisfactionRate').value = stats.satisfactionRate || '';
                }
            });
    }

    function setupEventListeners() {
        // التنقل بين الأقسام
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                
                // إزالة النشط من جميع العناصر
                navItems.forEach(nav => nav.classList.remove('active'));
                // إضافة النشط للعنصر المحدد
                this.classList.add('active');
                
                // إظهار المحتوى المناسب
                const tabId = this.getAttribute('data-tab');
                showTab(tabId);
            });
        });

        // نموذج إرسال إشعار
        const sendNotificationBtn = document.getElementById('sendNotificationBtn');
        const notificationModal = document.getElementById('notificationModal');
        const notificationForm = document.getElementById('notificationForm');
        const notificationType = document.getElementById('notificationType');

        sendNotificationBtn.addEventListener('click', () => {
            notificationModal.style.display = 'block';
        });

        notificationType.addEventListener('change', function() {
            const userSelection = document.getElementById('userSelection');
            userSelection.style.display = this.value === 'user' ? 'block' : 'none';
            
            if (this.value === 'user') {
                loadUsersForSelection();
            }
        });

        notificationForm.addEventListener('submit', sendNotification);

        // نموذج إعدادات الدفع
        const paymentSettingsForm = document.getElementById('paymentSettingsForm');
        paymentSettingsForm.addEventListener('submit', savePaymentSettings);

        // نموذج الإحصائيات
        const statsSettingsForm = document.getElementById('statsSettingsForm');
        statsSettingsForm.addEventListener('submit', saveStatsSettings);

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

    function showTab(tabId) {
        // إخفاء جميع المحتويات
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.classList.remove('active'));
        
        // إظهار المحتوى المحدد
        document.getElementById(tabId).classList.add('active');
        
        // تحميل البيانات الخاصة بالتبويب إذا لزم الأمر
        switch(tabId) {
            case 'orders':
                loadAllOrders();
                break;
            case 'deposits':
                loadDeposits();
                break;
            case 'users':
                loadUsers();
                break;
            case 'tickets':
                loadTickets();
                break;
            case 'notifications':
                loadNotifications();
                break;
        }
    }

    async function sendNotification(e) {
        e.preventDefault();
        
        const type = document.getElementById('notificationType').value;
        const title = document.getElementById('notificationTitle').value;
        const message = document.getElementById('notificationMessage').value;
        const userId = type === 'user' ? document.getElementById('selectedUser').value : null;

        try {
            const notificationData = {
                title: title,
                body: message,
                uid: userId,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                read: false
            };

            await db.collection('notifications').add(notificationData);
            
            showNotification('تم إرسال الإشعار بنجاح', 'success');
            document.getElementById('notificationModal').style.display = 'none';
            document.getElementById('notificationForm').reset();
            
        } catch (error) {
            console.error('خطأ في إرسال الإشعار:', error);
            showNotification('حدث خطأ أثناء إرسال الإشعار', 'error');
        }
    }

    async function savePaymentSettings(e) {
        e.preventDefault();
        
        const vodafone = document.getElementById('vodafoneNumber').value;
        const bitcoin = document.getElementById('bitcoinAddress').value;
        const ethereum = document.getElementById('ethereumAddress').value;

        try {
            await db.collection('paymentMethods').doc('methods').set({
                vodafone: vodafone,
                bitcoin: bitcoin,
                ethereum: ethereum,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showNotification('تم حفظ إعدادات الدفع بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حفظ إعدادات الدفع:', error);
            showNotification('حدث خطأ أثناء حفظ الإعدادات', 'error');
        }
    }

    async function saveStatsSettings(e) {
        e.preventDefault();
        
        const usersCount = parseInt(document.getElementById('totalUsersStat').value) || 0;
        const ordersCount = parseInt(document.getElementById('totalOrdersStat').value) || 0;
        const satisfactionRate = document.getElementById('satisfactionRate').value;

        try {
            await db.collection('stats').doc('general').set({
                usersCount: usersCount,
                ordersCount: ordersCount,
                satisfactionRate: satisfactionRate,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showNotification('تم حفظ الإحصائيات بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في حفظ الإحصائيات:', error);
            showNotification('حدث خطأ أثناء حفظ الإحصائيات', 'error');
        }
    }

    function loadUsersForSelection() {
        db.collection('users').get().then((snapshot) => {
            const select = document.getElementById('selectedUser');
            select.innerHTML = '<option value="">اختر المستخدم</option>';
            
            snapshot.forEach(doc => {
                const user = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = user.displayName || user.username;
                select.appendChild(option);
            });
        });
    }

    // وظائف مساعدة
    function getStatusText(status) {
        const statusMap = {
            'pending': 'قيد المراجعة',
            'in-progress': 'قيد التنفيذ',
            'completed': 'مكتمل',
            'rejected': 'مرفوض'
        };
        return statusMap[status] || status;
    }
});
