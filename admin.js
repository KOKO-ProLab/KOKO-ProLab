// تهيئة Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDUaSnYinH910wp3zDHOCNuqWp9QjwIRow",
    authDomain: "koko-prolab.firebaseapp.com",
    databaseURL: "https://koko-prolab-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "koko-prolab",
    storageBucket: "koko-prolab.firebasestorage.app",
    messagingSenderId: "61256824707",
    appId: "1:61256824707:web:a853065ec0a19f8d57e8b6",
    measurementId: "G-0JQ80XFM9E"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// حالة التطبيق
let allOrders = [];
let allDeposits = [];
let allUsers = [];
let allServices = [];
let allTickets = [];
let siteStats = {};

// تهيئة لوحة الإدارة
document.addEventListener('DOMContentLoaded', function() {
    console.log('بدء تحميل لوحة الإدارة...');
    initAdminApp();
    setupAdminEventListeners();
});

// تهيئة تطبيق الإدارة
function initAdminApp() {
    console.log('جاري تحميل لوحة الإدارة...');
    loadAdminDashboard();
}

// إعداد مستمعي الأحداث للإدارة
function setupAdminEventListeners() {
    // تبديل الوضع الليلي/الفاتح
    document.getElementById('admin-theme-toggle').addEventListener('click', toggleAdminTheme);
    
    // علامات التبويب
    document.querySelectorAll('.tab-link').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // الفلاتر
    document.getElementById('order-status-filter').addEventListener('change', filterOrders);
    document.getElementById('deposit-status-filter').addEventListener('change', filterDeposits);
    document.getElementById('user-search').addEventListener('input', filterUsers);
    document.getElementById('user-rank-filter').addEventListener('change', filterUsers);
    
    // النماذج
    document.getElementById('service-admin-form').addEventListener('submit', saveService);
    document.getElementById('user-admin-form').addEventListener('submit', saveUser);
    document.getElementById('payment-settings-form').addEventListener('submit', savePaymentSettings);
    document.getElementById('general-settings-form').addEventListener('submit', saveGeneralSettings);
    document.getElementById('content-settings-form').addEventListener('submit', saveContentSettings);
    document.getElementById('stats-settings-form').addEventListener('submit', saveStatsSettings);
    
    // الأزرار
    document.getElementById('add-service-btn').addEventListener('click', () => openServiceAdminModal());
    
    // إجراءات الطلبات
    document.getElementById('approve-deposit-btn').addEventListener('click', approveDeposit);
    document.getElementById('reject-deposit-btn').addEventListener('click', rejectDeposit);
    document.getElementById('accept-order-btn').addEventListener('click', acceptOrder);
    document.getElementById('complete-order-btn').addEventListener('click', completeOrder);
    document.getElementById('cancel-order-btn').addEventListener('click', cancelOrder);
    
    // إغلاق النماذج
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeAdminModal(modal.id);
        });
    });
    
    // إغلاق النماذج بالنقر خارجها
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeAdminModal(event.target.id);
        }
    });
}

// تحميل لوحة التحكم
async function loadAdminDashboard() {
    try {
        await loadAdminStatistics();
        await loadAllOrders();
        await loadAllDeposits();
        await loadAllUsers();
        await loadAllServices();
        await loadAllTickets();
        await loadTopUsers();
        await loadSiteStats();
        
        console.log('تم تحميل لوحة الإدارة بنجاح');
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        showMessage('خطأ في تحميل لوحة التحكم', 'error');
    }
}

// تحميل الإحصائيات
async function loadAdminStatistics() {
    try {
        // إجمالي المستخدمين
        const usersSnapshot = await db.collection('users').get();
        document.getElementById('admin-total-users').textContent = usersSnapshot.size;
        
        // الطلبات قيد الانتظار
        const pendingOrdersSnapshot = await db.collection('orders')
            .where('status', '==', 'pending')
            .get();
        document.getElementById('admin-pending-orders').textContent = pendingOrdersSnapshot.size;
        
        // طلبات الإيداع المعلقة
        const pendingDepositsSnapshot = await db.collection('deposits')
            .where('status', '==', 'pending')
            .get();
        document.getElementById('admin-pending-deposits').textContent = pendingDepositsSnapshot.size;
        
        // التذاكر المفتوحة
        const openTicketsSnapshot = await db.collection('tickets')
            .where('status', '==', 'open')
            .get();
        document.getElementById('admin-open-tickets').textContent = openTicketsSnapshot.size;
        
        // الإيرادات اليوم
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completedOrdersToday = await db.collection('orders')
            .where('status', '==', 'completed')
            .where('created_at', '>=', today)
            .get();
        
        let todayRevenue = 0;
        completedOrdersToday.forEach(doc => {
            todayRevenue += doc.data().price || 0;
        });
        document.getElementById('admin-today-revenue').textContent = todayRevenue.toFixed(2);
        
    } catch (error) {
        console.error('Error loading admin statistics:', error);
    }
}

// تحميل جميع الطلبات
async function loadAllOrders() {
    try {
        const ordersSnapshot = await db.collection('orders')
            .orderBy('created_at', 'desc')
            .get();
        
        allOrders = [];
        ordersSnapshot.forEach(doc => {
            allOrders.push({ id: doc.id, ...doc.data() });
        });
        
        displayAdminOrders();
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// عرض الطلبات في لوحة الإدارة
function displayAdminOrders(filteredOrders = allOrders) {
    const ordersBody = document.getElementById('orders-admin-body');
    ordersBody.innerHTML = '';
    
    if (filteredOrders.length === 0) {
        ordersBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">لا توجد طلبات</td></tr>';
        return;
    }
    
    filteredOrders.forEach(async (order) => {
        // الحصول على بيانات المستخدم
        let username = 'غير معروف';
        try {
            const userDoc = await db.collection('users').doc(order.user_uid).get();
            if (userDoc.exists) {
                username = userDoc.data().username;
            }
        } catch (error) {
            console.error('Error loading user data for order:', error);
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${username}</td>
            <td>${order.service_name}</td>
            <td>${order.target_link}</td>
            <td>${order.quantity}</td>
            <td>${order.price} جنيه</td>
            <td><span class="status-${order.status}">${getStatusName(order.status)}</span></td>
            <td>${formatDate(order.created_at)}</td>
            <td>
                <button class="btn btn-outline manage-order-btn" data-id="${order.id}">
                    <i class="fas fa-cog"></i> إدارة
                </button>
            </td>
        `;
        ordersBody.appendChild(row);
    });
    
    // إضافة مستمعي الأحداث لأزرار الإدارة
    document.querySelectorAll('.manage-order-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            openOrderAdminModal(orderId);
        });
    });
}

// تحميل جميع طلبات الإيداع
async function loadAllDeposits() {
    try {
        const depositsSnapshot = await db.collection('deposits')
            .orderBy('created_at', 'desc')
            .get();
        
        allDeposits = [];
        depositsSnapshot.forEach(doc => {
            allDeposits.push({ id: doc.id, ...doc.data() });
        });
        
        displayAdminDeposits();
    } catch (error) {
        console.error('Error loading deposits:', error);
    }
}

// عرض طلبات الإيداع في لوحة الإدارة
function displayAdminDeposits(filteredDeposits = allDeposits) {
    const depositsBody = document.getElementById('deposits-admin-body');
    depositsBody.innerHTML = '';
    
    if (filteredDeposits.length === 0) {
        depositsBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">لا توجد طلبات إيداع</td></tr>';
        return;
    }
    
    filteredDeposits.forEach(async (deposit) => {
        // الحصول على بيانات المستخدم
        let username = 'غير معروف';
        try {
            const userDoc = await db.collection('users').doc(deposit.user_uid).get();
            if (userDoc.exists) {
                username = userDoc.data().username;
            }
        } catch (error) {
            console.error('Error loading user data for deposit:', error);
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${username}</td>
            <td>${deposit.amount} جنيه</td>
            <td>${getPaymentMethodName(deposit.method)}</td>
            <td><span class="status-${deposit.status}">${getDepositStatusName(deposit.status)}</span></td>
            <td>${formatDate(deposit.created_at)}</td>
            <td>
                <button class="btn btn-outline manage-deposit-btn" data-id="${deposit.id}">
                    <i class="fas fa-cog"></i> إدارة
                </button>
            </td>
        `;
        depositsBody.appendChild(row);
    });
    
    // إضافة مستمعي الأحداث لأزرار الإدارة
    document.querySelectorAll('.manage-deposit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const depositId = this.getAttribute('data-id');
            openDepositAdminModal(depositId);
        });
    });
}

// الموافقة على طلب الإيداع
async function approveDeposit() {
    const depositId = this.getAttribute('data-id');
    const deposit = allDeposits.find(d => d.id === depositId);
    
    if (!deposit) return;
    
    try {
        showLoading(true);
        
        // تحديث حالة الطلب
        await db.collection('deposits').doc(depositId).update({
            status: 'approved',
            processed_at: firebase.firestore.FieldValue.serverTimestamp(),
            processed_by: 'admin'
        });
        
        // زيادة رصيد المستخدم
        const userDoc = await db.collection('users').doc(deposit.user_uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const newBalance = (userData.balance || 0) + deposit.amount;
            
            await db.collection('users').doc(deposit.user_uid).update({
                balance: newBalance
            });
            
            // تسجيل المعاملة
            await db.collection('transactions').add({
                user_uid: deposit.user_uid,
                type: 'deposit',
                amount: deposit.amount,
                description: `إيداع رصيد عبر ${getPaymentMethodName(deposit.method)}`,
                status: 'completed',
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        closeAdminModal('deposit-admin-modal');
        showMessage('تم قبول طلب الإيداع وتحديث رصيد المستخدم', 'success');
        await loadAllDeposits();
        await loadAllUsers();
        await loadAdminStatistics();
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// رفض طلب الإيداع
async function rejectDeposit() {
    const depositId = this.getAttribute('data-id');
    const deposit = allDeposits.find(d => d.id === depositId);
    
    try {
        showLoading(true);
        
        await db.collection('deposits').doc(depositId).update({
            status: 'rejected',
            processed_at: firebase.firestore.FieldValue.serverTimestamp(),
            processed_by: 'admin'
        });
        
        closeAdminModal('deposit-admin-modal');
        showMessage('تم رفض طلب الإيداع', 'success');
        await loadAllDeposits();
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// قبول طلب الخدمة
async function acceptOrder() {
    const orderId = this.getAttribute('data-id');
    const notes = document.getElementById('admin-order-notes').value;
    
    try {
        showLoading(true);
        
        await db.collection('orders').doc(orderId).update({
            status: 'accepted',
            notes: notes,
            updated_at: firebase.firestore.FieldValue.serverTimestamp(),
            accepted_by: 'admin'
        });
        
        closeAdminModal('order-admin-modal');
        showMessage('تم قبول الطلب', 'success');
        await loadAllOrders();
        await loadAdminStatistics();
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// إكمال طلب الخدمة
async function completeOrder() {
    const orderId = this.getAttribute('data-id');
    const notes = document.getElementById('admin-order-notes').value;
    
    try {
        showLoading(true);
        
        await db.collection('orders').doc(orderId).update({
            status: 'completed',
            notes: notes,
            completed_at: firebase.firestore.FieldValue.serverTimestamp(),
            completed_by: 'admin'
        });
        
        closeAdminModal('order-admin-modal');
        showMessage('تم إكمال الطلب', 'success');
        await loadAllOrders();
        await loadAdminStatistics();
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// إلغاء طلب الخدمة
async function cancelOrder() {
    const orderId = this.getAttribute('data-id');
    const notes = document.getElementById('admin-order-notes').value;
    const order = allOrders.find(o => o.id === orderId);
    
    try {
        showLoading(true);
        
        // إذا كان الطلب ملغى، استعادة الرصيد للمستخدم
        if (order.status === 'accepted' || order.status === 'pending') {
            const userDoc = await db.collection('users').doc(order.user_uid).get();
            if (userDoc.exists) {
                await db.collection('users').doc(order.user_uid).update({
                    balance: firebase.firestore.FieldValue.increment(order.price)
                });
                
                // تسجيل المعاملة
                await db.collection('transactions').add({
                    user_uid: order.user_uid,
                    type: 'refund',
                    amount: order.price,
                    description: 'استعادة رصيد بسبب إلغاء الطلب',
                    status: 'completed',
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        
        await db.collection('orders').doc(orderId).update({
            status: 'canceled',
            notes: notes,
            canceled_at: firebase.firestore.FieldValue.serverTimestamp(),
            canceled_by: 'admin'
        });
        
        closeAdminModal('order-admin-modal');
        showMessage('تم إلغاء الطلب', 'success');
        await loadAllOrders();
        await loadAllUsers();
        await loadAdminStatistics();
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// تحميل إحصائيات الموقع
async function loadSiteStats() {
    try {
        const statsDoc = await db.collection('statistics').doc('site_stats').get();
        if (statsDoc.exists) {
            siteStats = statsDoc.data();
            updateStatsForm();
        }
    } catch (error) {
        console.error('Error loading site stats:', error);
    }
}

// تحديث نموذج الإحصائيات
function updateStatsForm() {
    document.getElementById('stats-total-users').value = siteStats.totalUsers || '';
    document.getElementById('stats-completed-orders').value = siteStats.completedOrders || '';
    document.getElementById('stats-top-users').value = siteStats.topUsers || '';
    document.getElementById('stats-total-revenue').value = siteStats.totalRevenue || '';
}

// حفظ إحصائيات الموقع
async function saveStatsSettings(e) {
    e.preventDefault();
    
    const totalUsers = parseInt(document.getElementById('stats-total-users').value) || 0;
    const completedOrders = parseInt(document.getElementById('stats-completed-orders').value) || 0;
    const topUsers = parseInt(document.getElementById('stats-top-users').value) || 0;
    const totalRevenue = parseFloat(document.getElementById('stats-total-revenue').value) || 0;
    
    try {
        showLoading(true);
        
        await db.collection('statistics').doc('site_stats').set({
            totalUsers: totalUsers,
            completedOrders: completedOrders,
            topUsers: topUsers,
            totalRevenue: totalRevenue,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage('تم حفظ الإحصائيات بنجاح', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// وظائف مساعدة محسنة
function showLoading(show) {
    if (show) {
        document.body.classList.add('loading');
    } else {
        document.body.classList.remove('loading');
    }
}

function showMessage(message, type) {
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: var(--border-radius);
        color: white;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    if (type === 'success') {
        messageEl.style.backgroundColor = '#28a745';
    } else if (type === 'error') {
        messageEl.style.backgroundColor = '#dc3545';
    }
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 300);
    }, 3000);
}

// ... (بقية الدوال تبقى كما هي مع تحسينات طفيفة)
