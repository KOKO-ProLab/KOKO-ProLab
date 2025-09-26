// وظائف صفحة المستخدم الرئيسية
document.addEventListener('DOMContentLoaded', function() {
    // تعريف المتغيرات العامة
    let currentUser = null;
    let services = [];
    let paymentMethods = {};

    // تهيئة الصفحة
    initHomePage();

    function initHomePage() {
        // التحقق من تسجيل الدخول
        auth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                loadUserData();
                loadServices();
                loadNotifications();
                loadPaymentMethods();
                setupEventListeners();
            } else {
                // إذا لم يكن مسجلاً الدخول، إعادة التوجيه إلى الصفحة الرئيسية
                window.location.href = 'index.html';
            }
        });
    }

    function loadUserData() {
        // تحميل بيانات المستخدم
        db.collection('users').doc(currentUser.uid).onSnapshot((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                
                // تحديث واجهة المستخدم
                document.getElementById('userName').textContent = userData.displayName || userData.username;
                document.getElementById('userBalance').textContent = userData.balance.toFixed(2) + ' جنيه';
                document.getElementById('balanceValue').textContent = userData.balance.toFixed(2);
                
                // تحديث عدد الطلبات النشطة
                loadActiveOrdersCount();
            }
        });
    }

    function loadServices() {
        // قائمة الخدمات (يمكن جلبها من Firestore لاحقاً)
        services = [
            {
                id: 'web-design',
                name: 'تصميم مواقع',
                icon: 'fas fa-globe',
                description: 'تصميم مواقع احترافية متجاوبة مع جميع الأجهزة',
                price: 500,
                linkExample: 'أدخل رابط الموقع الحالي أو المتطلبات'
            },
            {
                id: 'android-app',
                name: 'تطبيقات أندرويد',
                icon: 'fas fa-mobile-alt',
                description: 'تطوير تطبيقات أندرويد مبتكرة وسهلة الاستخدام',
                price: 1000,
                linkExample: 'أدخل فكرة التطبيق أو المتطلبات'
            },
            {
                id: 'windows-software',
                name: 'برامج ويندوز',
                icon: 'fas fa-desktop',
                description: 'برمجة برامج ويندوز متقدمة تلبي احتياجاتك',
                price: 800,
                linkExample: 'أدخل متطلبات البرنامج'
            },
            {
                id: 'followers',
                name: 'زيادة متابعين',
                icon: 'fas fa-users',
                description: 'زيادة متابعين حقيقين لجميع منصات التواصل',
                price: 0.10,
                linkExample: 'أدخل رابط الحساب'
            },
            {
                id: 'likes',
                name: 'زيادة إعجابات',
                icon: 'fas fa-thumbs-up',
                description: 'زيادة إعجابات حقيقية للمنشورات',
                price: 0.05,
                linkExample: 'أدخل رابط المنشور'
            },
            {
                id: 'reports',
                name: 'بلاغات إغلاق حسابات',
                icon: 'fas fa-flag',
                description: 'خدمات الإبلاغ عن الحسابات المخالفة',
                price: 50,
                linkExample: 'أدخل رابط الحساب المراد الإبلاغ عنه'
            },
            {
                id: 'profits',
                name: 'تحقيق أرباح',
                icon: 'fas fa-chart-line',
                description: 'استراتيجيات تحقيق الأرباح عبر الإنترنت',
                price: 200,
                linkExample: 'أدخل مجال العمل الحالي'
            },
            {
                id: 'explore',
                name: 'ظهور في الاكسبلور',
                icon: 'fas fa-fire',
                description: 'ظهور المنشورات في صفحة الاستكشاف',
                price: 0.15,
                linkExample: 'أدخل رابط المنشور'
            },
            {
                id: 'app-charge',
                name: 'شحن تطبيقات وألعاب',
                icon: 'fas fa-gamepad',
                description: 'شحن رصيد للتطبيقات والألعاب',
                price: 0.8,
                linkExample: 'أدخل اسم التطبيق أو اللعبة'
            },
            {
                id: 'visa',
                name: 'فيزا دفع أونلاين',
                icon: 'fas fa-credit-card',
                description: 'إصدار فيزا افتراضية للدفع عبر الإنترنت',
                price: 10,
                linkExample: 'أدخل المبلغ المطلوب'
            }
        ];

        // عرض الخدمات
        const servicesGrid = document.getElementById('servicesGrid');
        servicesGrid.innerHTML = '';

        services.forEach(service => {
            const serviceCard = document.createElement('div');
            serviceCard.className = 'service-card';
            serviceCard.innerHTML = `
                <div class="service-icon">
                    <i class="${service.icon}"></i>
                </div>
                <div class="service-content">
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                    <div class="service-price">السعر: ${service.price.toFixed(2)} جنيه</div>
                    <button class="btn-order" data-service="${service.id}">إنشاء طلب</button>
                </div>
            `;
            servicesGrid.appendChild(serviceCard);
        });

        // إضافة event listeners لأزرار الطلبات
        document.querySelectorAll('.btn-order').forEach(button => {
            button.addEventListener('click', function() {
                const serviceId = this.getAttribute('data-service');
                openOrderModal(serviceId);
            });
        });
    }

    function loadPaymentMethods() {
        // تحميل طرق الدفع من Firestore
        db.collection('paymentMethods').doc('methods').get()
            .then((doc) => {
                if (doc.exists) {
                    paymentMethods = doc.data();
                    updatePaymentMethodsDisplay();
                } else {
                    // القيم الافتراضية إذا لم توجد في قاعدة البيانات
                    paymentMethods = {
                        vodafone: '01012345678',
                        bitcoin: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                        ethereum: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
                    };
                }
            })
            .catch((error) => {
                console.error('خطأ في تحميل طرق الدفع:', error);
            });
    }

    function updatePaymentMethodsDisplay() {
        // سيتم تحديث عرض طرق الدفع عند فتح نموذج الشحن
    }

    function loadActiveOrdersCount() {
        // حساب عدد الطلبات النشطة
        db.collection('orders')
            .where('uid', '==', currentUser.uid)
            .where('status', 'in', ['pending', 'in-progress'])
            .get()
            .then((querySnapshot) => {
                document.getElementById('ordersValue').textContent = querySnapshot.size;
            })
            .catch((error) => {
                console.error('خطأ في تحميل عدد الطلبات:', error);
            });
    }

    function loadNotifications() {
        // تحميل الإشعارات الحديثة
        db.collection('notifications')
            .where('uid', 'in', [currentUser.uid, null]) // إشعارات عامة أو خاصة بالمستخدم
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get()
            .then((querySnapshot) => {
                const notificationsList = document.getElementById('notificationsList');
                notificationsList.innerHTML = '';

                if (querySnapshot.empty) {
                    notificationsList.innerHTML = '<p class="no-notifications">لا توجد إشعارات جديدة</p>';
                    return;
                }

                querySnapshot.forEach((doc) => {
                    const notification = doc.data();
                    const notificationElement = document.createElement('div');
                    notificationElement.className = 'notification-item';
                    notificationElement.innerHTML = `
                        <div class="notification-icon">
                            <i class="fas fa-bell"></i>
                        </div>
                        <div class="notification-content">
                            <h4>${notification.title}</h4>
                            <p>${notification.body}</p>
                            <small>${formatDate(notification.createdAt)}</small>
                        </div>
                    `;
                    notificationsList.appendChild(notificationElement);
                });

                // تحديث عداد الإشعارات
                updateNotificationBadge();
            })
            .catch((error) => {
                console.error('خطأ في تحميل الإشعارات:', error);
            });
    }

    function updateNotificationBadge() {
        // حساب الإشعارات غير المقروءة
        db.collection('notifications')
            .where('uid', 'in', [currentUser.uid, null])
            .where('read', '==', false)
            .get()
            .then((querySnapshot) => {
                const badge = document.getElementById('notificationBadge');
                if (querySnapshot.size > 0) {
                    badge.textContent = querySnapshot.size;
                    badge.style.display = 'inline';
                } else {
                    badge.style.display = 'none';
                }
            });
    }

    function setupEventListeners() {
        // نموذج شحن الرصيد
        const depositBtn = document.getElementById('depositBtn');
        const depositModal = document.getElementById('depositModal');
        const depositForm = document.getElementById('depositForm');
        const depositMethod = document.getElementById('depositMethod');

        depositBtn.addEventListener('click', () => {
            depositModal.style.display = 'block';
        });

        depositMethod.addEventListener('change', function() {
            updatePaymentDetails(this.value);
        });

        depositForm.addEventListener('submit', handleDeposit);

        // نموذج التذكرة
        const ticketBtn = document.getElementById('ticketBtn');
        const ticketModal = document.getElementById('ticketModal');
        const ticketForm = document.getElementById('ticketForm');

        ticketBtn.addEventListener('click', () => {
            ticketModal.style.display = 'block';
        });

        ticketForm.addEventListener('submit', handleTicket);

        // إغلاق النماذج
        const closeButtons = document.querySelectorAll('.close');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                modal.style.display = 'none';
            });
        });

        // إغلاق النماذج عند النقر خارجها
        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
    }

    function openOrderModal(serviceId) {
        const service = services.find(s => s.id === serviceId);
        if (!service) return;

        const orderModal = document.getElementById('orderModal');
        const orderForm = document.getElementById('orderForm');

        // تعبئة البيانات
        document.getElementById('orderModalTitle').textContent = `طلب خدمة: ${service.name}`;
        document.getElementById('serviceType').value = service.id;
        document.getElementById('linkExample').textContent = service.linkExample;
        document.getElementById('summaryService').textContent = service.name;
        document.getElementById('summaryPrice').textContent = service.price.toFixed(2) + ' جنيه';

        // إعادة تعيين النموذج
        orderForm.reset();
        updateOrderSummary(service, 0);

        // إضافة event listeners للتحديث
        document.getElementById('orderQuantity').addEventListener('input', function() {
            updateOrderSummary(service, parseInt(this.value) || 0);
        });

        orderModal.style.display = 'block';
    }

    function updateOrderSummary(service, quantity) {
        document.getElementById('summaryQuantity').textContent = quantity;
        const total = service.price * quantity;
        document.getElementById('summaryTotal').textContent = total.toFixed(2) + ' جنيه';
    }

    function updatePaymentDetails(method) {
        const paymentDetails = document.getElementById('paymentDetails');
        
        if (!method) {
            paymentDetails.innerHTML = '';
            return;
        }

        let details = '';
        switch(method) {
            case 'vodafone':
                details = `
                    <div class="payment-info">
                        <h4>فودافون كاش</h4>
                        <p>رقم الهاتف: <strong>${paymentMethods.vodafone || '01012345678'}</strong></p>
                        <p>أرسل المبلغ إلى هذا الرقم ثم أدخل رقم التحويل</p>
                    </div>
                `;
                break;
            case 'bitcoin':
                details = `
                    <div class="payment-info">
                        <h4>Bitcoin</h4>
                        <p>العنوان: <strong>${paymentMethods.bitcoin || '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'}</strong></p>
                        <p>أرسل المبلغ إلى هذا العنوان ثم أدخل ID العملية</p>
                    </div>
                `;
                break;
            case 'ethereum':
                details = `
                    <div class="payment-info">
                        <h4>Ethereum</h4>
                        <p>العنوان: <strong>${paymentMethods.ethereum || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'}</strong></p>
                        <p>أرسل المبلغ إلى هذا العنوان ثم أدخل ID العملية</p>
                    </div>
                `;
                break;
        }

        paymentDetails.innerHTML = details;
    }

    async function handleDeposit(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('depositAmount').value);
        const method = document.getElementById('depositMethod').value;
        const transactionNumber = document.getElementById('transactionNumber').value;

        if (!currentUser) {
            showNotification('يجب تسجيل الدخول أولاً', 'error');
            return;
        }

        try {
            // حفظ طلب الإيداع في Firestore
            const depositData = {
                uid: currentUser.uid,
                amount: amount,
                method: method,
                transactionNumber: transactionNumber,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('deposits').add(depositData);
            
            showNotification('تم إرسال طلب الشحن بنجاح، سيتم المراجعة قريباً', 'success');
            document.getElementById('depositModal').style.display = 'none';
            document.getElementById('depositForm').reset();
            
        } catch (error) {
            console.error('خطأ في إرسال طلب الشحن:', error);
            showNotification('حدث خطأ أثناء إرسال طلب الشحن', 'error');
        }
    }

    async function handleOrder(e) {
        e.preventDefault();
        
        const serviceType = document.getElementById('serviceType').value;
        const link = document.getElementById('orderLink').value;
        const quantity = parseInt(document.getElementById('orderQuantity').value);
        const service = services.find(s => s.id === serviceType);

        if (!currentUser) {
            showNotification('يجب تسجيل الدخول أولاً', 'error');
            return;
        }

        // التحقق من الرصيد
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();
        const totalCost = service.price * quantity;

        if (userData.balance < totalCost) {
            showNotification('رصيدك غير كافٍ لإكمال هذا الطلب', 'error');
            return;
        }

        try {
            // خصم المبلغ من الرصيد
            await db.collection('users').doc(currentUser.uid).update({
                balance: firebase.firestore.FieldValue.increment(-totalCost)
            });

            // إنشاء الطلب
            const orderData = {
                orderId: generateOrderId(),
                uid: currentUser.uid,
                serviceType: serviceType,
                serviceName: service.name,
                link: link,
                quantity: quantity,
                cost: totalCost,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('orders').add(orderData);
            
            showNotification('تم إنشاء الطلب بنجاح', 'success');
            document.getElementById('orderModal').style.display = 'none';
            document.getElementById('orderForm').reset();
            
            // تحديث الرصيد وعدد الطلبات
            loadUserData();
            
        } catch (error) {
            console.error('خطأ في إنشاء الطلب:', error);
            showNotification('حدث خطأ أثناء إنشاء الطلب', 'error');
        }
    }

    async function handleTicket(e) {
        e.preventDefault();
        
        const category = document.getElementById('ticketCategory').value;
        const message = document.getElementById('ticketMessage').value;

        if (!currentUser) {
            showNotification('يجب تسجيل الدخول أولاً', 'error');
            return;
        }

        try {
            const ticketData = {
                ticketId: generateOrderId(),
                uid: currentUser.uid,
                category: category,
                message: message,
                status: 'open',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('tickets').add(ticketData);
            
            showNotification('تم إرسال التذكرة بنجاح', 'success');
            document.getElementById('ticketModal').style.display = 'none';
            document.getElementById('ticketForm').reset();
            
        } catch (error) {
            console.error('خطأ في إرسال التذكرة:', error);
            showNotification('حدث خطأ أثناء إرسال التذكرة', 'error');
        }
    }

    // إضافة event listener لنموذج الطلب
    document.getElementById('orderForm').addEventListener('submit', handleOrder);
});
