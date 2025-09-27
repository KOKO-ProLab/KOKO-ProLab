import { auth, db } from './firebase-config.js';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    getDocs
} from 'firebase/firestore';

let allOrders = [];
let filteredOrders = [];

// Initialize orders page
export async function initOrders() {
    if (!auth.currentUser) {
        window.location.href = '/';
        return;
    }

    // Set up event listeners
    document.getElementById('statusFilter').addEventListener('change', filterOrders);
    document.getElementById('serviceFilter').addEventListener('change', filterOrders);
    document.getElementById('searchInput').addEventListener('input', filterOrders);

    // Modal close button
    const modal = document.getElementById('orderModal');
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    // Load orders
    loadOrders();
}

// Load user's orders
async function loadOrders() {
    const loadingState = document.getElementById('loadingState');
    const ordersSection = document.querySelector('.orders-list');
    const emptyState = document.getElementById('emptyState');

    try {
        loadingState.style.display = 'block';
        ordersSection.style.display = 'none';
        emptyState.style.display = 'none';

        // Create query for user's orders
        const ordersQuery = query(
            collection(db, 'orders'),
            where('uid', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        // Set up real-time listener
        onSnapshot(ordersQuery, (snapshot) => {
            allOrders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            filterOrders();
            loadingState.style.display = 'none';
            
            if (allOrders.length === 0) {
                emptyState.style.display = 'block';
            } else {
                ordersSection.style.display = 'block';
            }
        });

    } catch (error) {
        console.error('Error loading orders:', error);
        loadingState.style.display = 'none';
        alert('حدث خطأ أثناء تحميل الطلبات');
    }
}

// Filter orders based on user selection
function filterOrders() {
    const statusFilter = document.getElementById('statusFilter').value;
    const serviceFilter = document.getElementById('serviceFilter').value;
    const searchText = document.getElementById('searchInput').value.toLowerCase();

    filteredOrders = allOrders.filter(order => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const matchesService = serviceFilter === 'all' || order.serviceType === serviceFilter;
        const matchesSearch = order.id.toLowerCase().includes(searchText) ||
                            getServiceTitle(order.serviceType).toLowerCase().includes(searchText);

        return matchesStatus && matchesService && matchesSearch;
    });

    renderOrders();
}

// Render orders list
function renderOrders() {
    const ordersSection = document.querySelector('.orders-list');
    const emptyState = document.getElementById('emptyState');

    if (filteredOrders.length === 0) {
        ordersSection.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    ordersSection.style.display = 'block';
    emptyState.style.display = 'none';

    ordersSection.innerHTML = filteredOrders.map(order => `
        <div class="order-card card" onclick="showOrderDetails('${order.id}')">
            <div class="order-icon">
                <i class="${getServiceIcon(order.serviceType)}"></i>
            </div>
            <div class="order-info">
                <span class="order-id">#${order.id}</span>
                <span class="order-service">${getServiceTitle(order.serviceType)}</span>
                <span class="order-date">${formatDate(order.createdAt)}</span>
            </div>
            <div class="status-badge status-${order.status}">
                ${getStatusText(order.status)}
            </div>
        </div>
    `).join('');
}

// Show order details in modal
export function showOrderDetails(orderId) {
    const order = filteredOrders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('orderModal');
    document.getElementById('orderIdDetail').textContent = '#' + order.id;
    document.getElementById('serviceTypeDetail').textContent = getServiceTitle(order.serviceType);
    document.getElementById('linkDetail').textContent = order.link;
    document.getElementById('quantityDetail').textContent = order.quantity;
    document.getElementById('statusDetail').textContent = getStatusText(order.status);
    document.getElementById('statusDetail').className = `status-badge status-${order.status}`;
    document.getElementById('createdAtDetail').textContent = formatDate(order.createdAt);

    if (order.note) {
        document.getElementById('noteGroup').style.display = 'block';
        document.getElementById('noteDetail').textContent = order.note;
    } else {
        document.getElementById('noteGroup').style.display = 'none';
    }

    modal.style.display = 'block';
}

// Helper functions
function getServiceTitle(serviceType) {
    const titles = {
        'web-design': 'تصميم موقع',
        'android-app': 'تطبيق أندرويد',
        'windows-app': 'برنامج ويندوز',
        'followers': 'زيادة متابعين',
        'likes': 'زيادة إعجابات',
        'reports': 'بلاغات',
        'profit': 'تحقيق أرباح',
        'explorer': 'ظهور في الاكسبلور',
        'apps-games': 'شحن تطبيقات',
        'payment': 'فيزا دفع'
    };
    return titles[serviceType] || serviceType;
}

function getServiceIcon(serviceType) {
    const icons = {
        'web-design': 'fas fa-laptop-code',
        'android-app': 'fab fa-android',
        'windows-app': 'fab fa-windows',
        'followers': 'fas fa-users',
        'likes': 'fas fa-heart',
        'reports': 'fas fa-flag',
        'profit': 'fas fa-money-bill-wave',
        'explorer': 'fas fa-compass',
        'apps-games': 'fas fa-gamepad',
        'payment': 'fas fa-credit-card'
    };
    return icons[serviceType] || 'fas fa-cube';
}

function getStatusText(status) {
    const statusTexts = {
        'pending': 'قيد المراجعة',
        'in-progress': 'قيد التنفيذ',
        'completed': 'مكتمل',
        'rejected': 'مرفوض'
    };
    return statusTexts[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    }).format(date);
}