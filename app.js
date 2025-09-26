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
const auth = firebase.auth();
const db = firebase.firestore();

// حالة التطبيق
let currentUser = null;
let userData = null;
let services = [];
let categories = [];
let userOrders = [];
let siteStats = {};

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    setupEventListeners();
    loadServices();
    loadSiteStatistics();
    checkLanguage();
    updateBalanceDisplay();
});

// تهيئة التطبيق
function initApp() {
    // مراقبة حالة المصادقة
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserData(user.uid);
            showUserMenu();
            loadUserOrders(user.uid);
            updateBalanceDisplay();
        } else {
            currentUser = null;
            userData = null;
            showAuthButtons();
            updateBalanceDisplay();
        }
    });
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // تبديل الوضع الليلي/الفاتح
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // فتح وإغلاق النماذج
    document.getElementById('login-btn').addEventListener('click', () => openModal('login-modal'));
    document.getElementById('register-btn').addEventListener('click', () => openModal('register-modal'));
    document.getElementById('deposit-btn').addEventListener('click', () => openModal('deposit-modal'));
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // التنقل بين الصفحات
    document.getElementById('nav-profile').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('profile-page');
    });
    
    document.getElementById('nav-orders').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('orders-page');
    });
    
    document.getElementById('nav-tickets').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('tickets-page');
    });
    
    document.getElementById('nav-home').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('home-page');
    });
    
    // التنقل بين النماذج
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('login-modal');
        openModal('register-modal');
    });
    
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('register-modal');
        openModal('login-modal');
    });
    
    document.getElementById('forgot-password').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('login-modal');
        openModal('forgot-modal');
    });
    
    // نماذج التسجيل والدخول
    document.getElementById('login-form').addEventListener('submit', login);
    document.getElementById('register-form').addEventListener('submit', register);
    document.getElementById('forgot-form').addEventListener('submit', resetPassword);
    document.getElementById('google-login').addEventListener('click', signInWithGoogle);
    
    // نماذج الخدمات والرصيد
    document.getElementById('deposit-form').addEventListener('submit', submitDeposit);
    document.getElementById('service-form').addEventListener('submit', submitOrder);
    document.getElementById('profile-form').addEventListener('submit', updateProfile);
    document.getElementById('ticket-form').addEventListener('submit', submitTicket);
    
    // تغيير كمية الطلب لحساب السعر
    document.getElementById('service-quantity').addEventListener('input', calculateOrderTotal);
    
    // تغيير طريقة الدفع
    document.getElementById('deposit-method').addEventListener('change', showPaymentDetails);
    
    // إغلاق النماذج
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // إغلاق النماذج بالنقر خارجها
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    });
    
    // قائمة الهاتف المحمول
    document.getElementById('hamburger').addEventListener('click', toggleMobileMenu);
    
    // الروابط في التذييل
    document.getElementById('privacy-link').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('privacy-page');
    });
    
    document.getElementById('terms-link').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('terms-page');
    });
    
    document.getElementById('about-link').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('about-page');
    });
    
    // التواصل الاجتماعي
    document.getElementById('telegram-btn').addEventListener('click', () => {
        window.open('https://t.me/kokoprolab', '_blank');
    });
    
    document.getElementById('whatsapp-btn').addEventListener('click', () => {
        window.open('https://wa.me/201000000000', '_blank');
    });
    
    // طلب رتبة تاجر
    document.getElementById('request-merchant').addEventListener('click', () => {
        if (!currentUser) {
            openModal('login-modal');
            return;
        }
        openMerchantRequestModal();
    });
}

// تسجيل الدخول
async function login(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        showLoading(true);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        closeModal('login-modal');
        showMessage('تم تسجيل الدخول بنجاح', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// التسجيل
async function register(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    // التحقق من أن اسم المستخدم فريد
    const usernameQuery = await db.collection('users').where('username', '==', username).get();
    if (!usernameQuery.empty) {
        document.getElementById('username-error').textContent = 'اسم المستخدم موجود مسبقاً';
        return;
    }
    
    try {
        showLoading(true);
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // حفظ بيانات المستخدم في Firestore
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            displayName: username,
            phoneNumber: '',
            role: 'user',
            balance: 0,
            rank: 'beginner',
            verified: false,
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeModal('register-modal');
        showMessage('تم إنشاء الحساب بنجاح', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// تسجيل الدخول بحساب Google
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    
    try {
        showLoading(true);
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // التحقق مما إذا كان المستخدم جديداً
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // إنشاء مستخدم جديد
            await db.collection('users').doc(user.uid).set({
                username: user.email.split('@')[0],
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                phoneNumber: user.phoneNumber || '',
                role: 'user',
                balance: 0,
                rank: 'beginner',
                verified: false,
                created_at: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        closeModal('login-modal');
        showMessage('تم تسجيل الدخول بنجاح', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// استعادة كلمة المرور
async function resetPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgot-email').value;
    
    try {
        showLoading(true);
        await auth.sendPasswordResetEmail(email);
        closeModal('forgot-modal');
        showMessage('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// تسجيل الخروج
async function logout() {
    try {
        await auth.signOut();
        showMessage('تم تسجيل الخروج بنجاح', 'success');
        showPage('home-page');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// تحميل بيانات المستخدم
async function loadUserData(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (userDoc.exists) {
            userData = userDoc.data();
            updateProfileDisplay();
            updateBalanceDisplay();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// تحديث عرض الملف الشخصي
function updateProfileDisplay() {
    if (!userData) return;
    
    document.getElementById('user-name').textContent = userData.displayName || userData.username;
    document.getElementById('current-balance').textContent = userData.balance || 0;
    
    const profileCard = document.getElementById('profile-card');
    profileCard.innerHTML = `
        <div class="profile-header">
            <div class="profile-avatar">
                ${(userData.displayName || userData.username).charAt(0).toUpperCase()}
            </div>
            <div>
                <h2>${userData.displayName || userData.username}</h2>
                <p class="rank-badge rank-${userData.rank}">${getRankName(userData.rank)}</p>
            </div>
        </div>
        <div class="profile-info">
            <div class="info-item">
                <span>اسم المستخدم:</span>
                <span>${userData.username}</span>
            </div>
            <div class="info-item">
                <span>البريد الإلكتروني:</span>
                <span>${userData.email}</span>
            </div>
            <div class="info-item">
                <span>الاسم المعروض:</span>
                <span>${userData.displayName || 'غير محدد'} 
                    <button onclick="openEditProfile()" class="btn btn-outline" style="padding: 5px 10px;">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                </span>
            </div>
            <div class="info-item">
                <span>رقم الهاتف:</span>
                <span>${userData.phoneNumber || 'غير محدد'} 
                    <button onclick="openEditProfile()" class="btn btn-outline" style="padding: 5px 10px;">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                </span>
            </div>
            <div class="info-item">
                <span>الرصيد:</span>
                <span class="balance-amount">${userData.balance || 0} جنيه</span>
            </div>
            <div class="info-item">
                <span>الرتبة:</span>
                <span class="rank-badge rank-${userData.rank}">${getRankName(userData.rank)}</span>
            </div>
            <div class="info-item">
                <span>الحالة:</span>
                <span>${userData.verified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> موثق</span>' : 'غير موثق'}</span>
            </div>
        </div>
    `;
}

// تحديث عرض الرصيد في الشريط العلوي
function updateBalanceDisplay() {
    const balanceElement = document.getElementById('header-balance');
    if (currentUser && userData) {
        balanceElement.innerHTML = `
            <i class="fas fa-wallet"></i>
            <span class="balance-amount">${userData.balance || 0} جنيه</span>
        `;
        balanceElement.style.display = 'flex';
    } else {
        balanceElement.style.display = 'none';
    }
}

// فتح نموذج تعديل الملف الشخصي
function openEditProfile() {
    document.getElementById('edit-displayname').value = userData.displayName || '';
    document.getElementById('edit-phone').value = userData.phoneNumber || '';
    openModal('profile-modal');
}

// تحديث الملف الشخصي
async function updateProfile(e) {
    e.preventDefault();
    
    const displayName = document.getElementById('edit-displayname').value;
    const phoneNumber = document.getElementById('edit-phone').value;
    
    try {
        showLoading(true);
        await db.collection('users').doc(currentUser.uid).update({
            displayName: displayName,
            phoneNumber: phoneNumber
        });
        
        userData.displayName = displayName;
        userData.phoneNumber = phoneNumber;
        updateProfileDisplay();
        
        closeModal('profile-modal');
        showMessage('تم تحديث الملف الشخصي بنجاح', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// تحميل الخدمات
async function loadServices() {
    try {
        const servicesSnapshot = await db.collection('products').where('active', '==', true).get();
        services = [];
        categories = [];
        
        servicesSnapshot.forEach(doc => {
            const service = { id: doc.id, ...doc.data() };
            services.push(service);
            
            if (!categories.includes(service.category)) {
                categories.push(service.category);
            }
        });
        
        displayCategories();
        displayServices();
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// عرض الفئات
function displayCategories() {
    const categoriesContainer = document.getElementById('categories');
    categoriesContainer.innerHTML = '';
    
    const allBtn = document.createElement('button');
    allBtn.className = 'category-btn active';
    allBtn.innerHTML = '<i class="fas fa-th-large"></i> الكل';
    allBtn.addEventListener('click', () => filterServices('all'));
    categoriesContainer.appendChild(allBtn);
    
    categories.forEach(category => {
        const categoryBtn = document.createElement('button');
        categoryBtn.className = 'category-btn';
        categoryBtn.innerHTML = `<i class="fas fa-tag"></i> ${category}`;
        categoryBtn.addEventListener('click', () => filterServices(category));
        categoriesContainer.appendChild(categoryBtn);
    });
}

// عرض الخدمات
function displayServices(filter = 'all') {
    const servicesGrid = document.getElementById('services-grid');
    servicesGrid.innerHTML = '';
    
    const filteredServices = filter === 'all' 
        ? services 
        : services.filter(service => service.category === filter);
    
    filteredServices.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.innerHTML = `
            <h3><i class="fas fa-cube"></i> ${service.name}</h3>
            <p>${service.description || 'لا يوجد وصف'}</p>
            <ul class="service-features">
                <li>جودة عالية</li>
                <li>تشغيل فوري</li>
                <li>دعم فني 24/7</li>
            </ul>
            <div class="price">${service.price} جنيه</div>
            <button class="btn btn-primary order-btn" data-id="${service.id}">
                <i class="fas fa-shopping-cart"></i> طلب الخدمة
            </button>
        `;
        servicesGrid.appendChild(serviceCard);
    });
    
    // إضافة مستمعي الأحداث لأزرار الطلب
    document.querySelectorAll('.order-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const serviceId = this.getAttribute('data-id');
            openServiceModal(serviceId);
        });
    });
}

// تصفية الخدمات حسب الفئة
function filterServices(category) {
    // تحديث أزرار الفئات النشطة
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    displayServices(category);
}

// فتح نموذج طلب الخدمة
function openServiceModal(serviceId) {
    if (!currentUser) {
        openModal('login-modal');
        return;
    }
    
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    document.getElementById('service-modal-title').textContent = `طلب خدمة: ${service.name}`;
    document.getElementById('service-id').value = serviceId;
    document.getElementById('unit-price').textContent = service.price;
    document.getElementById('total-price').textContent = service.price;
    
    openModal('service-modal');
}

// حساب السعر الإجمالي للطلب
function calculateOrderTotal() {
    const quantity = parseInt(document.getElementById('service-quantity').value) || 1;
    const unitPrice = parseFloat(document.getElementById('unit-price').textContent);
    const totalPrice = quantity * unitPrice;
    
    document.getElementById('total-price').textContent = totalPrice.toFixed(2);
}

// إرسال طلب خدمة
async function submitOrder(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showMessage('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    const serviceId = document.getElementById('service-id').value;
    const link = document.getElementById('service-link').value;
    const quantity = parseInt(document.getElementById('service-quantity').value);
    
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    const totalPrice = quantity * service.price;
    
    // التحقق من وجود رصيد كافي
    if (userData.balance < totalPrice) {
        showMessage('رصيدك غير كافي لتنفيذ هذا الطلب', 'error');
        return;
    }
    
    try {
        showLoading(true);
        await db.collection('orders').add({
            user_uid: currentUser.uid,
            service_id: serviceId,
            service_name: service.name,
            target_link: link,
            quantity: quantity,
            price: totalPrice,
            status: 'pending',
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // خصم المبلغ من رصيد المستخدم
        await db.collection('users').doc(currentUser.uid).update({
            balance: firebase.firestore.FieldValue.increment(-totalPrice)
        });
        
        // تحديث رصيد المستخدم محلياً
        userData.balance -= totalPrice;
        updateBalanceDisplay();
        
        closeModal('service-modal');
        showMessage('تم إرسال طلبك بنجاح', 'success');
        
        // تحديث نموذج الطلب
        document.getElementById('service-form').reset();
        loadUserOrders(currentUser.uid);
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// إيداع الرصيد
function showPaymentDetails() {
    const method = document.getElementById('deposit-method').value;
    const paymentDetails = document.getElementById('payment-details');
    
    if (method === 'crypto') {
        paymentDetails.innerHTML = `
            <div class="payment-info">
                <h4><i class="fas fa-coins"></i> التحويل بالعملات الرقمية</h4>
                <p>يرجى التحويل إلى العنوان التالي:</p>
                <div class="crypto-address">
                    <strong>1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</strong>
                    <button class="btn btn-outline copy-btn" data-text="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa">
                        <i class="fas fa-copy"></i> نسخ
                    </button>
                </div>
                <p class="note">بعد التحويل، أرسل صورة للإثبات مع رقم المعاملة.</p>
            </div>
        `;
    } else if (method === 'vodafone') {
        paymentDetails.innerHTML = `
            <div class="payment-info">
                <h4><i class="fas fa-mobile-alt"></i> التحويل بفودافون كاش</h4>
                <p>يرجى التحويل إلى الرقم التالي:</p>
                <div class="vodafone-number">
                    <strong>0100 000 0000</strong>
                    <button class="btn btn-outline copy-btn" data-text="01000000000">
                        <i class="fas fa-copy"></i> نسخ
                    </button>
                </div>
                <p class="note">بعد التحويل، أرسل صورة للإثبات مع رقم المعاملة.</p>
            </div>
        `;
    } else {
        paymentDetails.innerHTML = '';
    }
    
    // إضافة مستمعي الأحداث لأزرار النسخ
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const text = this.getAttribute('data-text');
            navigator.clipboard.writeText(text).then(() => {
                showMessage('تم نسخ النص', 'success');
            });
        });
    });
}

// إرسال طلب الإيداع
async function submitDeposit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showMessage('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    const method = document.getElementById('deposit-method').value;
    
    if (amount <= 0) {
        showMessage('يرجى إدخال مبلغ صحيح', 'error');
        return;
    }
    
    try {
        showLoading(true);
        await db.collection('deposits').add({
            user_uid: currentUser.uid,
            amount: amount,
            method: method,
            status: 'pending',
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeModal('deposit-modal');
        showMessage('تم إرسال طلب الإيداع بنجاح', 'success');
        
        // تحديث نموذج الإيداع
        document.getElementById('deposit-form').reset();
        document.getElementById('payment-details').innerHTML = '';
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// تحميل طلبات المستخدم
async function loadUserOrders(uid) {
    try {
        const ordersSnapshot = await db.collection('orders')
            .where('user_uid', '==', uid)
            .orderBy('created_at', 'desc')
            .get();
        
        userOrders = [];
        ordersSnapshot.forEach(doc => {
            userOrders.push({ id: doc.id, ...doc.data() });
        });
        
        displayUserOrders();
    } catch (error) {
        console.error('Error loading user orders:', error);
    }
}

// عرض طلبات المستخدم
function displayUserOrders() {
    const ordersBody = document.getElementById('orders-body');
    ordersBody.innerHTML = '';
    
    if (userOrders.length === 0) {
        ordersBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">لا توجد طلبات</td></tr>';
        return;
    }
    
    userOrders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.service_name}</td>
            <td>${order.target_link}</td>
            <td>${order.quantity}</td>
            <td>${order.price} جنيه</td>
            <td><span class="status-${order.status}">${getStatusName(order.status)}</span></td>
            <td>${formatDate(order.created_at)}</td>
            <td>
                <button class="btn btn-outline view-order-btn" data-id="${order.id}">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        ordersBody.appendChild(row);
    });
}

// تحميل إحصائيات الموقع
async function loadSiteStatistics() {
    try {
        const statsDoc = await db.collection('statistics').doc('site_stats').get();
        if (statsDoc.exists) {
            siteStats = statsDoc.data();
            updateSiteStatistics();
        }
    } catch (error) {
        console.error('Error loading site statistics:', error);
    }
}

// تحديث إحصائيات الموقع
function updateSiteStatistics() {
    document.getElementById('total-users').textContent = siteStats.totalUsers || '0';
    document.getElementById('completed-orders').textContent = siteStats.completedOrders || '0';
    document.getElementById('top-users').textContent = siteStats.topUsers || '0';
}

// إرسال تذكرة دعم
async function submitTicket(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showMessage('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    const type = document.getElementById('ticket-type').value;
    const subject = document.getElementById('ticket-subject').value;
    const message = document.getElementById('ticket-message').value;
    
    try {
        showLoading(true);
        await db.collection('tickets').add({
            user_uid: currentUser.uid,
            type: type,
            subject: subject,
            message: message,
            status: 'open',
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeModal('ticket-modal');
        showMessage('تم إرسال التذكرة بنجاح', 'success');
        document.getElementById('ticket-form').reset();
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// طلب رتبة تاجر
async function submitMerchantRequest(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showMessage('يجب تسجيل الدخول أولاً', 'error');
        return;
    }
    
    const experience = document.getElementById('merchant-experience').value;
    const portfolio = document.getElementById('merchant-portfolio').value;
    
    try {
        showLoading(true);
        await db.collection('merchant_requests').add({
            user_uid: currentUser.uid,
            experience: experience,
            portfolio: portfolio,
            status: 'pending',
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeModal('merchant-modal');
        showMessage('تم إرسال طلب رتبة التاجر بنجاح', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// وظائف مساعدة
function showUserMenu() {
    document.getElementById('auth-buttons').style.display = 'none';
    document.getElementById('user-menu').style.display = 'flex';
}

function showAuthButtons() {
    document.getElementById('auth-buttons').style.display = 'flex';
    document.getElementById('user-menu').style.display = 'none';
}

function showPage(pageId) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    
    // إظهار الصفحة المطلوبة
    document.getElementById(pageId).style.display = 'block';
    
    // تحديث التنقل النشط
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // إضافة المزيد من وظائف إدارة الصفحات حسب الحاجة
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const hamburger = document.getElementById('hamburger');
    
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // تحديث زر التبديل
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function showMessage(message, type) {
    // إنشاء عنصر الرسالة
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
    
    // إزالة الرسالة بعد 3 ثوان
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 300);
    }, 3000);
}

function showLoading(show) {
    if (show) {
        document.body.classList.add('loading');
    } else {
        document.body.classList.remove('loading');
    }
}

function getRankName(rank) {
    const ranks = {
        'beginner': 'مبتدئ',
        'intermediate': 'متوسط',
        'pro': 'متميز',
        'vip': 'VIP'
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

function checkLanguage() {
    const userLang = navigator.language || navigator.userLanguage;
    const isRTL = userLang.startsWith('ar') || userLang.startsWith('he') || userLang.startsWith('fa');
    
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = isRTL ? 'ar' : 'en';
}

// تحميل السمة المحفوظة
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// إظهار الصفحة الرئيسية افتراضياً
showPage('home-page');
