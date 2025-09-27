import { auth, db } from './firebase-config.js';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';

// Initialize admin panel
export async function initAdminPanel() {
    // Check if user is admin
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        window.location.href = '/';
        return;
    }

    // Set up navigation
    setupNavigation();
    
    // Load initial statistics
    loadStatistics();
    
    // Load orders section by default
    loadSection('orders');

    // Set up real-time listeners
    setupListeners();
}

// Set up navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadSection(btn.dataset.section);
        });
    });
}

// Load different sections
async function loadSection(section) {
    const contentArea = document.getElementById('adminContent');
    contentArea.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';

    try {
        const response = await fetch(`/pages/admin/${section}.html`);
        const content = await response.text();
        contentArea.innerHTML = content;

        // Initialize section specific functionality
        switch (section) {
            case 'orders':
                initOrdersSection();
                break;
            case 'deposits':
                initDepositsSection();
                break;
            case 'users':
                initUsersSection();
                break;
            case 'stats':
                initStatsSection();
                break;
            case 'notifications':
                initNotificationsSection();
                break;
            case 'payment':
                initPaymentSection();
                break;
            case 'settings':
                initSettingsSection();
                break;
        }
    } catch (error) {
        console.error('Error loading section:', error);
        contentArea.innerHTML = '<p class="error-message">حدث خطأ أثناء تحميل المحتوى</p>';
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const statsDoc = await getDoc(doc(db, 'stats', 'general'));
        if (statsDoc.exists()) {
            const stats = statsDoc.data();
            document.getElementById('totalUsers').textContent = stats.usersCount.toLocaleString('ar-EG');
            document.getElementById('totalOrders').textContent = stats.ordersCount.toLocaleString('ar-EG');
            document.getElementById('totalDeposits').textContent = stats.depositsCount.toLocaleString('ar-EG');
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Set up real-time listeners
function setupListeners() {
    // Listen for new orders
    onSnapshot(collection(db, 'orders'), (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                // Handle new order
                updateOrdersCount();
            }
        });
    });

    // Listen for new deposits
    onSnapshot(collection(db, 'deposits'), (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                // Handle new deposit
                updateDepositsCount();
            }
        });
    });
}

// Update statistics
async function updateOrdersCount() {
    const statsRef = doc(db, 'stats', 'general');
    const ordersCount = (await getDocs(collection(db, 'orders'))).size;
    await updateDoc(statsRef, { ordersCount });
    document.getElementById('totalOrders').textContent = ordersCount.toLocaleString('ar-EG');
}

async function updateDepositsCount() {
    const statsRef = doc(db, 'stats', 'general');
    const depositsCount = (await getDocs(collection(db, 'deposits'))).size;
    await updateDoc(statsRef, { depositsCount });
    document.getElementById('totalDeposits').textContent = depositsCount.toLocaleString('ar-EG');
}

// Export functions for use in section-specific files
export {
    loadStatistics,
    updateOrdersCount,
    updateDepositsCount
};