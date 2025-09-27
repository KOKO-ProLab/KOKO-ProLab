import { db } from './firebase-config.js';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    getDoc
} from 'firebase/firestore';

let currentOrders = [];
let selectedOrderId = null;

// Initialize orders section
export async function initOrdersSection() {
    setupFilters();
    loadOrders();
    setupModal();
}

// Set up filters
function setupFilters() {
    const statusFilter = document.getElementById('orderStatusFilter');
    const serviceFilter = document.getElementById('orderServiceFilter');
    const searchInput = document.getElementById('orderSearch');

    statusFilter.addEventListener('change', filterOrders);
    serviceFilter.addEventListener('change', filterOrders);
    searchInput.addEventListener('input', filterOrders);
}

// Load orders
async function loadOrders() {
    try {
        const ordersQuery = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc')
        );

        onSnapshot(ordersQuery, async (snapshot) => {
            currentOrders = [];
            for (const doc of snapshot.docs) {
                const order = { id: doc.id, ...doc.data() };
                // Get user details
                const userDoc = await getDoc(doc(db, 'users', order.uid));
                if (userDoc.exists()) {
                    order.user = userDoc.data();
                }
                currentOrders.push(order);
            }
            filterOrders();
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        alert('حدث خطأ أثناء تحميل الطلبات');
    }
}

// Filter orders
function filterOrders() {
    const status = document.getElementById('orderStatusFilter').value;
    const service = document.getElementById('orderServiceFilter').value;
    const search = document.getElementById('orderSearch').value.toLowerCase();

    const filtered = currentOrders.filter(order => {
        const matchStatus = status === 'all' || order.status === status;
        const matchService = service === 'all' || order.serviceType === service;
        const matchSearch = order.id.toLowerCase().includes(search) ||
                          order.user?.username.toLowerCase().includes(search) ||
                          order.user?.displayName.toLowerCase().includes(search);

        return matchStatus && matchService && matchSearch;
    });

    renderOrders(filtered);
}

// Render orders table
function renderOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>${order.user?.displayName || '-'}</td>
            <td>${getServiceTitle(order.serviceType)}</td>
            <td>${order.quantity}</td>
            <td>${formatDate(order.createdAt)}</td>
            <td>
                <span class="status-badge status-${order.status}">
                    ${getStatusText(order.status)}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="showOrderDetails('${order.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
            </td>
        </tr>
    `).join('');
}

// Set up modal
function setupModal() {
    const modal = document.getElementById('orderDetailsModal');
    const closeBtn = modal.querySelector('.close');

    closeBtn.onclick = () => {
        modal.style.display = 'none';
        selectedOrderId = null;
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            selectedOrderId = null;
        }
    };
}

// Show order details
export async function showOrderDetails(orderId) {
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;

    selectedOrderId = orderId;
    const modal = document.getElementById('orderDetailsModal');

    document.getElementById('orderIdDetail').textContent = order.id;
    document.getElementById('orderUserDetail').textContent = order.user?.displayName || '-';
    document.getElementById('orderServiceDetail').textContent = getServiceTitle(order.serviceType);
    document.getElementById('orderLinkDetail').textContent = order.link;
    document.getElementById('orderQuantityDetail').textContent = order.quantity;
    document.getElementById('orderStatusDetail').value = order.status;
    document.getElementById('orderNoteDetail').value = order.note || '';

    modal.style.display = 'block';
}

// Update order status
export async function updateOrderStatus() {
    if (!selectedOrderId) return;

    try {
        const status = document.getElementById('orderStatusDetail').value;
        const note = document.getElementById('orderNoteDetail').value.trim();

        await updateDoc(doc(db, 'orders', selectedOrderId), {
            status,
            note,
            updatedAt: new Date().toISOString()
        });

        // Send notification to user
        const order = currentOrders.find(o => o.id === selectedOrderId);
        await addDoc(collection(db, 'notifications'), {
            uid: order.uid,
            title: 'تحديث حالة الطلب',
            body: `تم تحديث حالة طلبك رقم ${selectedOrderId} إلى "${getStatusText(status)}"`,
            createdAt: new Date().toISOString()
        });

        document.getElementById('orderDetailsModal').style.display = 'none';
        selectedOrderId = null;
        
        alert('تم تحديث حالة الطلب بنجاح');
    } catch (error) {
        console.error('Error updating order:', error);
        alert('حدث خطأ أثناء تحديث حالة الطلب');
    }
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