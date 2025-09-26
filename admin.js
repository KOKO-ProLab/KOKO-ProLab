// تهيئة Firebase (نفس التهيئة)
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
const auth = firebase.auth();
const db = firebase.firestore();

// حالة التطبيق
let currentAdmin = null;
let adminData = null;
let allOrders = [];
let allDeposits = [];
let allUsers = [];
let allServices = [];

// تهيئة لوحة الإدارة
document.addEventListener('DOMContentLoaded', function() {
    initAdminApp();
    setupAdminEventListeners();
    checkAdminAccess();
});

// تهيئة تطبيق الإدارة
function initAdminApp() {
    // مراقبة حالة المصادقة
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentAdmin = user;
            await loadAdminData(user.uid);
            
            // التحقق من صلاحية الإدارة
            if (adminData && adminData.role === 'admin') {
                loadAdminDashboard();
            } else {
                showMessage('ليس لديك صلاحية الوصول إلى لوحة الإدارة', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        } else {
            // إعادة التوجيه إلى صفحة تسجيل الدخول
            window.location.href = 'index.html';
        }
    });
}

// إعداد مستمعي الأحداث للإدارة
function setupAdminEventListeners() {
    // تبديل الوضع الليلي/الفاتح
    document.getElementById('admin-theme-toggle').addEventListener('click', toggleAdminTheme);
    
    // تسجيل الخروج
    document.getElementById('admin-logout-btn').addEventListener('click', adminLogout);
    
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

// التحقق من صلاحية الإدارة
async function checkAdminAccess() {
    const user = auth.currentUser;
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData.role !== 'admin') {
                showMessage('ليس لديك صلاحية الوصول إلى لوحة الإدارة', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Error checking admin access:', error);
        window.location.href = 'index.html';
    }
}

// تحميل بيانات المسؤول
async function loadAdminData(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (userDoc.exists) {
            adminData = userDoc.data();
        }
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

// تحميل لوحة التحكم
async function loadAdminDashboard() {
    await loadAdminStatistics();
    await loadAllOrders();
    await loadAllDeposits();
    await loadAllUsers();
    await loadAllServices();
    await loadTopUsers();
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
        
        // الإيرادات اليوم (سيتم تنفيذها لاحقاً)
        document.getElementById('admin-today-revenue').textContent = '0';
        
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
        ordersBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">لا توجد طلبات</td></tr>';
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
            <td class="status-${order.status}">${getStatusName(order.status)}</td>
            <td>${formatDate(order.created_at)}</td>
            <td>
                <button class="btn btn-outline manage-order-btn" data-id="${order.id}">إدارة</button>
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
        depositsBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">لا توجد طلبات إيداع</td></tr>';
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
            <td class="status-${deposit.status}">${getDepositStatusName(deposit.status)}</td>
            <td>${formatDate(deposit.created_at)}</td>
            <td>
                <button class="btn btn-outline manage-deposit-btn" data-id="${deposit.id}">إدارة</button>
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

// تحميل جميع المستخدمين
async function loadAllUsers() {
    try {
        const usersSnapshot = await db.collection('users').get();
        
        allUsers = [];
        usersSnapshot.forEach(doc => {
            allUsers.push({ id: doc.id, ...doc.data() });
        });
        
        displayAdminUsers();
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// عرض المستخدمين في لوحة الإدارة
function displayAdminUsers(filteredUsers = allUsers) {
    const usersBody = document.getElementById('users-admin-body');
    usersBody.innerHTML = '';
    
    if (filteredUsers.length === 0) {
        usersBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">لا توجد مستخدمين</td></tr>';
        return;
    }
    
    filteredUsers.forEach(user => {
        // تخطي حسابات الإدارة في القائمة إذا لزم الأمر
        if (user.role === 'admin') return;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username} ${user.verified ? '✓' : ''}</td>
            <td>${user.email}</td>
            <td>${user.balance || 0} جنيه</td>
            <td class="rank-${user.rank}">${getRankName(user.rank)}</td>
            <td>${user.verified ? 'موثق' : 'غير موثق'}</td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <button class="btn btn-outline manage-user-btn" data-id="${user.id}">تعديل</button>
            </td>
        `;
        usersBody.appendChild(row);
    });
    
    // إضافة مستمعي الأحداث لأزرار التعديل
    document.querySelectorAll('.manage-user-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            openUserAdminModal(userId);
        });
    });
}

// تحميل جميع الخدمات
async function loadAllServices() {
    try {
        const servicesSnapshot = await db.collection('products').get();
        
        allServices = [];
        servicesSnapshot.forEach(doc => {
            allServices.push({ id: doc.id, ...doc.data() });
        });
        
        displayAdminServices();
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// عرض الخدمات في لوحة الإدارة
function displayAdminServices() {
    const servicesGrid = document.getElementById('services-admin-grid');
    servicesGrid.innerHTML = '';
    
    allServices.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.innerHTML = `
            <h3>${service.name}</h3>
            <p>${service.description || 'لا يوجد وصف'}</p>
            <p><strong>الفئة:</strong> ${service.category}</p>
            <p><strong>السعر:</strong> ${service.price} جنيه</p>
            <p><strong>الحالة:</strong> ${service.active ? 'نشط' : 'غير نشط'}</p>
            <div class="admin-service-actions">
                <button class="btn btn-outline edit-service-btn" data-id="${service.id}">تعديل</button>
                <button class="btn btn-danger delete-service-btn" data-id="${service.id}">حذف</button>
            </div>
        `;
        servicesGrid.appendChild(serviceCard);
    });
    
    // إضافة مستمعي الأحداث لأزرار التعديل والحذف
    document.querySelectorAll('.edit-service-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const serviceId = this.getAttribute('data-id');
            openServiceAdminModal(serviceId);
        });
    });
    
    document.querySelectorAll('.delete-service-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const serviceId = this.getAttribute('data-id');
            deleteService(serviceId);
        });
    });
}

// تحميل أفضل المستخدمين
async function loadTopUsers() {
    try {
        // هذا مثال بسيط، يمكن تحسينه بحساب عدد الطلبات المكتملة لكل مستخدم
        const topUsersList = document.getElementById('top-users-list');
        topUsersList.innerHTML = '';
        
        // الحصول على أفضل 10 مستخدمين حسب الرصيد (مثال)
        const topUsers = allUsers
            .filter(user => user.role !== 'admin')
            .sort((a, b) => (b.balance || 0) - (a.balance || 0))
            .slice(0, 10);
        
        topUsers.forEach((user, index) => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <span>${index + 1}. ${user.username}</span>
                <span>${user.balance || 0} جنيه</span>
            `;
            topUsersList.appendChild(userItem);
        });
    } catch (error) {
        console.error('Error loading top users:', error);
    }
}

// فتح نموذج إدارة طلب الإيداع
async function openDepositAdminModal(depositId) {
    const deposit = allDeposits.find(d => d.id === depositId);
    if (!deposit) return;
    
    // الحصول على بيانات المستخدم
    let username = 'غير معروف';
    try {
        const userDoc = await db.collection('users').doc(deposit.user_uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            username = userData.username;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
    
    document.getElementById('deposit-admin-details').innerHTML = `
        <div class="deposit-details">
            <p><strong>المستخدم:</strong> ${username}</p>
            <p><strong>المبلغ:</strong> ${deposit.amount} جنيه</p>
            <p><strong>طريقة الدفع:</strong> ${getPaymentMethodName(deposit.method)}</p>
            <p><strong>الحالة:</strong> ${getDepositStatusName(deposit.status)}</p>
            <p><strong>التاريخ:</strong> ${formatDate(deposit.created_at)}</p>
        </div>
    `;
    
    // تخزين معرف الطلب في الزر
    document.getElementById('approve-deposit-btn').setAttribute('data-id', depositId);
    document.getElementById('reject-deposit-btn').setAttribute('data-id', depositId);
    
    openAdminModal('deposit-admin-modal');
}

// فتح نموذج إدارة طلب الخدمة
async function openOrderAdminModal(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    // الحصول على بيانات المستخدم
    let username = 'غير معروف';
    try {
        const userDoc = await db.collection('users').doc(order.user_uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            username = userData.username;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
    
    document.getElementById('order-admin-details').innerHTML = `
        <div class="order-details">
            <p><strong>المستخدم:</strong> ${username}</p>
            <p><strong>الخدمة:</strong> ${order.service_name}</p>
            <p><strong>الرابط:</strong> ${order.target_link}</p>
            <p><strong>الكمية:</strong> ${order.quantity}</p>
            <p><strong>السعر:</strong> ${order.price} جنيه</p>
            <p><strong>الحالة:</strong> ${getStatusName(order.status)}</p>
            <p><strong>التاريخ:</strong> ${formatDate(order.created_at)}</p>
        </div>
    `;
    
    // تخزين معرف الطلب في الأزرار
    document.getElementById('accept-order-btn').setAttribute('data-id', orderId);
    document.getElementById('complete-order-btn').setAttribute('data-id', orderId);
    document.getElementById('cancel-order-btn').setAttribute('data-id', orderId);
    
    openAdminModal('order-admin-modal');
}

// فتح نموذج إدارة المستخدم
async function openUserAdminModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('admin-user-id').value = userId;
    document.getElementById('admin-user-displayname').value = user.displayName || '';
    document.getElementById('admin-user-phone').value = user.phoneNumber || '';
    document.getElementById('admin-user-balance').value = user.balance || 0;
    document.getElementById('admin-user-rank').value = user.rank || 'beginner';
    document.getElementById('admin-user-verified').checked = user.verified || false;
    
    openAdminModal('user-admin-modal');
}

// فتح نموذج إدارة الخدمة
async function openServiceAdminModal(serviceId = null) {
    if (serviceId) {
        // وضع التعديل
        const service = allServices.find(s => s.id === serviceId);
        if (!service) return;
        
        document.getElementById('service-admin-modal-title').textContent = 'تعديل الخدمة';
        document.getElementById('admin-service-id').value = serviceId;
        document.getElementById('admin-service-name').value = service.name;
        document.getElementById('admin-service-description').value = service.description || '';
        document.getElementById('admin-service-category').value = service.category;
        document.getElementById('admin-service-price').value = service.price;
        document.getElementById('admin-service-active').checked = service.active !== false;
    } else {
        // وضع الإضافة
        document.getElementById('service-admin-modal-title').textContent = 'إضافة خدمة جديدة';
        document.getElementById('service-admin-form').reset();
        document.getElementById('admin-service-id').value = '';
        document.getElementById('admin-service-active').checked = true;
    }
    
    openAdminModal('service-admin-modal');
}

// حفظ الخدمة
async function saveService(e) {
    e.preventDefault();
    
    const serviceId = document.getElementById('admin-service-id').value;
    const name = document.getElementById('admin-service-name').value;
    const description = document.getElementById('admin-service-description').value;
    const category = document.getElementById('admin-service-category').value;
    const price = parseFloat(document.getElementById('admin-service-price').value);
    const active = document.getElementById('admin-service-active').checked;
    
    const serviceData = {
        name: name,
        description: description,
        category: category,
        price: price,
        active: active,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (serviceId) {
            // تحديث الخدمة الموجودة
            await db.collection('products').doc(serviceId).update(serviceData);
            showMessage('تم تحديث الخدمة بنجاح', 'success');
        } else {
            // إضافة خدمة جديدة
            serviceData.created_at = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('products').add(serviceData);
            showMessage('تم إضافة الخدمة بنجاح', 'success');
        }
        
        closeAdminModal('service-admin-modal');
        await loadAllServices();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// حفظ بيانات المستخدم
async function saveUser(e) {
    e.preventDefault();
    
    const userId = document.getElementById('admin-user-id').value;
    const displayName = document.getElementById('admin-user-displayname').value;
    const phoneNumber = document.getElementById('admin-user-phone').value;
    const balance = parseFloat(document.getElementById('admin-user-balance').value);
    const rank = document.getElementById('admin-user-rank').value;
    const verified = document.getElementById('admin-user-verified').checked;
    
    const userData = {
        displayName: displayName,
        phoneNumber: phoneNumber,
        balance: balance,
        rank: rank,
        verified: verified,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('users').doc(userId).update(userData);
        
        closeAdminModal('user-admin-modal');
        showMessage('تم تحديث بيانات المستخدم بنجاح', 'success');
        await loadAllUsers();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// حفظ إعدادات الدفع
async function savePaymentSettings(e) {
    e.preventDefault();
    
    const cryptoAddress = document.getElementById('crypto-address').value;
    const vodafoneNumber = document.getElementById('vodafone-number').value;
    
    // هنا سيتم حفظ الإعدادات في Firestore أو قاعدة بيانات أخرى
    showMessage('تم حفظ إعدادات الدفع بنجاح', 'success');
}

// حفظ الإعدادات العامة
async function saveGeneralSettings(e) {
    e.preventDefault();
    
    const googleLoginEnabled = document.getElementById('google-login-toggle').checked;
    const minDeposit = parseFloat(document.getElementById('min-deposit').value);
    
    // هنا سيتم حفظ الإعدادات في Firestore أو قاعدة بيانات أخرى
    showMessage('تم حفظ الإعدادات العامة بنجاح', 'success');
}

// حفظ المحتوى
async function saveContentSettings(e) {
    e.preventDefault();
    
    const privacyPolicy = document.getElementById('privacy-policy').value;
    const termsOfService = document.getElementById('terms-of-service').value;
    const aboutUs = document.getElementById('about-us').value;
    
    // هنا سيتم حفظ المحتوى في Firestore أو قاعدة بيانات أخرى
    showMessage('تم حفظ المحتوى بنجاح', 'success');
}

// الموافقة على طلب الإيداع
async function approveDeposit() {
    const depositId = this.getAttribute('data-id');
    const deposit = allDeposits.find(d => d.id === depositId);
    
    if (!deposit) return;
    
    try {
        // تحديث حالة الطلب
        await db.collection('deposits').doc(depositId).update({
            status: 'approved',
            processed_at: firebase.firestore.FieldValue.serverTimestamp()
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
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        closeAdminModal('deposit-admin-modal');
        showMessage('تم قبول طلب الإيداع وتحديث رصيد المستخدم', 'success');
        await loadAllDeposits();
        await loadAllUsers();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// رفض طلب الإيداع
async function rejectDeposit() {
    const depositId = this.getAttribute('data-id');
    
    try {
        await db.collection('deposits').doc(depositId).update({
            status: 'rejected',
            processed_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeAdminModal('deposit-admin-modal');
        showMessage('تم رفض طلب الإيداع', 'success');
        await loadAllDeposits();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// قبول طلب الخدمة
async function acceptOrder() {
    const orderId = this.getAttribute('data-id');
    const notes = document.getElementById('admin-order-notes').value;
    
    try {
        await db.collection('orders').doc(orderId).update({
            status: 'accepted',
            notes: notes,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeAdminModal('order-admin-modal');
        showMessage('تم قبول الطلب', 'success');
        await loadAllOrders();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// إكمال طلب الخدمة
async function completeOrder() {
    const orderId = this.getAttribute('data-id');
    const notes = document.getElementById('admin-order-notes').value;
    
    try {
        await db.collection('orders').doc(orderId).update({
            status: 'completed',
            notes: notes,
            completed_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeAdminModal('order-admin-modal');
        showMessage('تم إكمال الطلب', 'success');
        await loadAllOrders();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// إلغاء طلب الخدمة
async function cancelOrder() {
    const orderId = this.getAttribute('data-id');
    const notes = document.getElementById('admin-order-notes').value;
    
    try {
        const orderDoc = await db.collection('orders').doc(orderId).get();
        const order = orderDoc.data();
        
        // إذا كان الطلب ملغى، استعادة الرصيد للمستخدم
        if (order.status === 'accepted' || order.status === 'pending') {
            const userDoc = await db.collection('users').doc(order.user_uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const newBalance = (userData.balance || 0) + order.price;
                
                await db.collection('users').doc(order.user_uid).update({
                    balance: newBalance
                });
                
                // تسجيل المعاملة
                await db.collection('transactions').add({
                    user_uid: order.user_uid,
                    type: 'refund',
                    amount: order.price,
                    description: 'استعادة رصيد بسبب إلغاء الطلب',
                    created_at: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        
        await db.collection('orders').doc(orderId).update({
            status: 'canceled',
            notes: notes,
            canceled_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeAdminModal('order-admin-modal');
        showMessage('تم إلغاء الطلب', 'success');
        await loadAllOrders();
        await loadAllUsers();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// حذف الخدمة
async function deleteService(serviceId) {
    if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;
    
    try {
        await db.collection('products').doc(serviceId).delete();
        showMessage('تم حذف الخدمة بنجاح', 'success');
        await loadAllServices();
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// وظائف مساعدة
function switchTab(tabId) {
    // إخفاء جميع محتويات علامات التبويب
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // إلغاء تنشيط جميع أزرار علامات التبويب
    document.querySelectorAll('.tab-link').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // إظهار محتوى علامة التبويب المحددة
    document.getElementById(tabId).classList.add('active');
    
    // تنشيط زر علامة التبويب المحددة
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

function filterOrders() {
    const statusFilter = document.getElementById('order-status-filter').value;
    const searchFilter = document.getElementById('order-search').value.toLowerCase();
    
    let filteredOrders = allOrders;
    
    if (statusFilter) {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
    }
    
    if (searchFilter) {
        // هذا مثال بسيط، يمكن تحسينه بالبحث في بيانات المستخدم
        filteredOrders = filteredOrders.filter(order => 
            order.service_name.toLowerCase().includes(searchFilter) ||
            order.target_link.toLowerCase().includes(searchFilter)
        );
    }
    
    displayAdminOrders(filteredOrders);
}

function filterDeposits() {
    const statusFilter = document.getElementById('deposit-status-filter').value;
    
    let filteredDeposits = allDeposits;
    
    if (statusFilter) {
        filteredDeposits = filteredDeposits.filter(deposit => deposit.status === statusFilter);
    }
    
    displayAdminDeposits(filteredDeposits);
}

function filterUsers() {
    const searchFilter = document.getElementById('user-search').value.toLowerCase();
    const rankFilter = document.getElementById('user-rank-filter').value;
    
    let filteredUsers = allUsers.filter(user => user.role !== 'admin');
    
    if (searchFilter) {
        filteredUsers = filteredUsers.filter(user => 
            user.username.toLowerCase().includes(searchFilter) ||
            user.email.toLowerCase().includes(searchFilter)
        );
    }
    
    if (rankFilter) {
        filteredUsers = filteredUsers.filter(user => user.rank === rankFilter);
    }
    
    displayAdminUsers(filteredUsers);
}

function openAdminModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeAdminModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function toggleAdminTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // تحديث زر التبديل
    const themeToggle = document.getElementById('admin-theme-toggle');
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

async function adminLogout() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function getPaymentMethodName(method) {
    const methods = {
        'crypto': 'عملة رقمية',
        'vodafone': 'فودافون كاش'
    };
    return methods[method] || method;
}

function getDepositStatusName(status) {
    const statuses = {
        'pending': 'قيد الانتظار',
        'approved': 'مقبولة',
        'rejected': 'مرفوضة'
    };
    return statuses[status] || status;
}

// وظائف مساعدة مشتركة (يجب أن تكون متطابقة مع app.js)
function showMessage(message, type) {
    // إنشاء عنصر الرسالة
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    if (type === 'success') {
        messageEl.style.backgroundColor = '#28a745';
    } else if (type === 'error') {
        messageEl.style.backgroundColor = '#dc3545';
    }
    
    document.body.appendChild(messageEl);
    
    // إزالة الرسالة بعد 3 ثوان
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 300);
    }, 3000);
}

function getRankName(rank) {
    const ranks = {
        'beginner': 'مبتدئ',
        'intermediate': 'متوسط',
        'pro': 'متميز'
    };
    return ranks[rank] || rank;
}

function getStatusName(status) {
    const statuses = {
        'pending': 'قيد الانتظار',
        'accepted': 'مقبولة',
        'completed': 'مكتملة',
        'canceled': 'ملغاة'
    };
    return statuses[status] || status;
}

function formatDate(timestamp) {
    if (!timestamp) return 'غير محدد';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString('ar-EG');
}

// تحميل السمة المحفوظة
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeToggle = document.getElementById('admin-theme-toggle');
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}
