// وظائف عامة للموقع
document.addEventListener('DOMContentLoaded', function() {
    // تبديل الوضع الداكن/الفاتح
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.setAttribute('aria-label', 'تبديل الوضع الداكن');
    
    // إضافة زر تبديل الوضع إلى شريط التنقل
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.insertBefore(themeToggle, navMenu.firstChild);
    }
    
    // التحقق من تفضيلات المستخدم
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = localStorage.getItem('theme');
    
    if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    // تبديل الوضع عند النقر
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        
        if (currentTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'light');
        }
    });
    
    // تفعيل القائمة المتنقلة
    const navToggle = document.getElementById('navToggle');
    const navMenuMobile = document.getElementById('navMenu');
    
    if (navToggle && navMenuMobile) {
        navToggle.addEventListener('click', function() {
            navMenuMobile.classList.toggle('active');
        });
    }
    
    // تحديث الإحصائيات
    updateStats();
});

// تحديث الإحصائيات من Firestore
function updateStats() {
    // عدد المستخدمين
    db.collection('users').get().then((querySnapshot) => {
        const usersCount = querySnapshot.size;
        document.getElementById('usersCount').textContent = usersCount.toLocaleString();
    });
    
    // عدد الطلبات المكتملة
    db.collection('orders').where('status', '==', 'completed').get().then((querySnapshot) => {
        const ordersCount = querySnapshot.size;
        document.getElementById('ordersCount').textContent = ordersCount.toLocaleString();
    });
}

// وظائف مساعدة
function formatDate(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function generateOrderId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// إدارة الإشعارات
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // إضافة أنماط الإشعار إذا لم تكن موجودة
    if (!document.querySelector('.notification-styles')) {
        const styles = document.createElement('style');
        styles.className = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1002;
                min-width: 300px;
                max-width: 500px;
                background: white;
                border-left: 4px solid #4361ee;
                border-radius: 4px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                animation: slideIn 0.3s ease-out;
            }
            
            .notification-success {
                border-left-color: #28a745;
            }
            
            .notification-error {
                border-left-color: #dc3545;
            }
            
            .notification-warning {
                border-left-color: #ffc107;
            }
            
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                margin-right: 0.5rem;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // إضافة الإشعار إلى الصفحة
    document.body.appendChild(notification);
    
    // إغلاق الإشعار عند النقر على الزر
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    // إغلاق الإشعار تلقائياً بعد 5 ثوانٍ
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}
