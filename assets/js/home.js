import { auth, db } from './firebase-config.js';
import { 
    collection,
    addDoc,
    query,
    where,
    getDocs,
    onSnapshot
} from 'firebase/firestore';

// Update statistics
async function updateStatistics() {
    try {
        const statsDoc = await getDocs(collection(db, 'stats'));
        if (!statsDoc.empty) {
            const stats = statsDoc.docs[0].data();
            document.getElementById('usersCount').textContent = stats.usersCount.toLocaleString('ar-EG');
            document.getElementById('ordersCount').textContent = stats.ordersCount.toLocaleString('ar-EG');
            document.getElementById('completedCount').textContent = stats.completedCount.toLocaleString('ar-EG');
        }
    } catch (error) {
        console.error('Error fetching statistics:', error);
    }
}

// Service Modal Management
const modal = document.getElementById('serviceModal');
const closeBtn = document.querySelector('.close');
const serviceForm = document.getElementById('serviceForm');
let currentService = '';

export function openServiceForm(serviceType) {
    if (!auth.currentUser) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
    }

    currentService = serviceType;
    const modalTitle = document.getElementById('modalTitle');
    modalTitle.textContent = getServiceTitle(serviceType);
    modal.style.display = 'block';
}

function getServiceTitle(serviceType) {
    const titles = {
        'web-design': 'طلب تصميم موقع',
        'android-app': 'طلب تطبيق أندرويد',
        'windows-app': 'طلب برنامج ويندوز',
        'followers': 'طلب زيادة متابعين',
        'likes': 'طلب زيادة إعجابات',
        'reports': 'طلب بلاغات',
        'profit': 'طلب استشارة أرباح',
        'explorer': 'طلب ظهور في الاكسبلور',
        'apps-games': 'طلب شحن تطبيقات',
        'payment': 'طلب فيزا دفع'
    };
    return titles[serviceType] || 'طلب جديد';
}

// Close modal
closeBtn.onclick = () => {
    modal.style.display = 'none';
};

window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Handle service request submission
serviceForm.onsubmit = async (e) => {
    e.preventDefault();

    const link = document.getElementById('serviceLink').value;
    const quantity = document.getElementById('serviceQuantity').value;

    try {
        // Add order to Firestore
        await addDoc(collection(db, 'orders'), {
            uid: auth.currentUser.uid,
            serviceType: currentService,
            link: link,
            quantity: parseInt(quantity),
            status: 'pending',
            createdAt: new Date().toISOString()
        });

        // Show success message
        alert('تم إرسال طلبك بنجاح');
        
        // Clear form and close modal
        serviceForm.reset();
        modal.style.display = 'none';

    } catch (error) {
        console.error('Error submitting order:', error);
        alert('حدث خطأ أثناء إرسال الطلب');
    }
};

// Initialize home page
document.addEventListener('DOMContentLoaded', () => {
    updateStatistics();

    // Listen for statistics updates
    onSnapshot(collection(db, 'stats'), (snapshot) => {
        if (!snapshot.empty) {
            const stats = snapshot.docs[0].data();
            document.getElementById('usersCount').textContent = stats.usersCount.toLocaleString('ar-EG');
            document.getElementById('ordersCount').textContent = stats.ordersCount.toLocaleString('ar-EG');
            document.getElementById('completedCount').textContent = stats.completedCount.toLocaleString('ar-EG');
        }
    });
});