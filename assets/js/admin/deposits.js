import { db } from './firebase-config.js';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    getDoc,
    runTransaction,
    addDoc
} from 'firebase/firestore';

let currentDeposits = [];
let selectedDepositId = null;

// Initialize deposits section
export async function initDepositsSection() {
    setupFilters();
    loadDeposits();
    setupModal();
}

// Set up filters
function setupFilters() {
    const statusFilter = document.getElementById('depositStatusFilter');
    const methodFilter = document.getElementById('depositMethodFilter');
    const searchInput = document.getElementById('depositSearch');

    statusFilter.addEventListener('change', filterDeposits);
    methodFilter.addEventListener('change', filterDeposits);
    searchInput.addEventListener('input', filterDeposits);
}

// Load deposits
async function loadDeposits() {
    try {
        const depositsQuery = query(
            collection(db, 'deposits'),
            orderBy('createdAt', 'desc')
        );

        onSnapshot(depositsQuery, async (snapshot) => {
            currentDeposits = [];
            for (const doc of snapshot.docs) {
                const deposit = { id: doc.id, ...doc.data() };
                // Get user details
                const userDoc = await getDoc(doc(db, 'users', deposit.uid));
                if (userDoc.exists()) {
                    deposit.user = userDoc.data();
                }
                currentDeposits.push(deposit);
            }
            filterDeposits();
        });
    } catch (error) {
        console.error('Error loading deposits:', error);
        alert('حدث خطأ أثناء تحميل الإيداعات');
    }
}

// Filter deposits
function filterDeposits() {
    const status = document.getElementById('depositStatusFilter').value;
    const method = document.getElementById('depositMethodFilter').value;
    const search = document.getElementById('depositSearch').value.toLowerCase();

    const filtered = currentDeposits.filter(deposit => {
        const matchStatus = status === 'all' || deposit.status === status;
        const matchMethod = method === 'all' || deposit.method === method;
        const matchSearch = deposit.id.toLowerCase().includes(search) ||
                          deposit.user?.username.toLowerCase().includes(search) ||
                          deposit.user?.displayName.toLowerCase().includes(search);

        return matchStatus && matchMethod && matchSearch;
    });

    renderDeposits(filtered);
}

// Render deposits table
function renderDeposits(deposits) {
    const tbody = document.getElementById('depositsTableBody');
    tbody.innerHTML = deposits.map(deposit => `
        <tr>
            <td>${deposit.id}</td>
            <td>${deposit.user?.displayName || '-'}</td>
            <td>${deposit.amount.toLocaleString('ar-EG')} جنيه</td>
            <td>${getMethodText(deposit.method)}</td>
            <td>${deposit.transactionNumber}</td>
            <td>${formatDate(deposit.createdAt)}</td>
            <td>
                <span class="status-badge status-${deposit.status}">
                    ${getStatusText(deposit.status)}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="showDepositDetails('${deposit.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
            </td>
        </tr>
    `).join('');
}

// Set up modal
function setupModal() {
    const modal = document.getElementById('depositDetailsModal');
    const closeBtn = modal.querySelector('.close');

    closeBtn.onclick = () => {
        modal.style.display = 'none';
        selectedDepositId = null;
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            selectedDepositId = null;
        }
    };
}

// Show deposit details
export async function showDepositDetails(depositId) {
    const deposit = currentDeposits.find(d => d.id === depositId);
    if (!deposit) return;

    selectedDepositId = depositId;
    const modal = document.getElementById('depositDetailsModal');

    document.getElementById('depositIdDetail').textContent = deposit.id;
    document.getElementById('depositUserDetail').textContent = deposit.user?.displayName || '-';
    document.getElementById('depositAmountDetail').textContent = `${deposit.amount.toLocaleString('ar-EG')} جنيه`;
    document.getElementById('depositMethodDetail').textContent = getMethodText(deposit.method);
    document.getElementById('depositTransactionDetail').textContent = deposit.transactionNumber;
    document.getElementById('depositStatusDetail').value = deposit.status;
    document.getElementById('depositNoteDetail').value = deposit.note || '';

    modal.style.display = 'block';
}

// Approve deposit
export async function approveDeposit() {
    if (!selectedDepositId) return;

    try {
        const deposit = currentDeposits.find(d => d.id === selectedDepositId);
        
        await runTransaction(db, async (transaction) => {
            // Update deposit status
            const depositRef = doc(db, 'deposits', selectedDepositId);
            transaction.update(depositRef, {
                status: 'approved',
                note: document.getElementById('depositNoteDetail').value.trim(),
                updatedAt: new Date().toISOString()
            });

            // Update user balance
            const userRef = doc(db, 'users', deposit.uid);
            const userDoc = await transaction.get(userRef);
            
            if (!userDoc.exists()) {
                throw new Error('User document does not exist!');
            }

            const newBalance = userDoc.data().balance + deposit.amount;
            transaction.update(userRef, { balance: newBalance });

            // Create notification
            const notificationRef = collection(db, 'notifications');
            transaction.set(doc(notificationRef), {
                uid: deposit.uid,
                title: 'تم استلام إيداعك',
                body: `تم إضافة ${deposit.amount} جنيه إلى رصيدك`,
                createdAt: new Date().toISOString()
            });
        });

        document.getElementById('depositDetailsModal').style.display = 'none';
        selectedDepositId = null;
        
        alert('تم الموافقة على الإيداع وإضافة الرصيد بنجاح');
    } catch (error) {
        console.error('Error approving deposit:', error);
        alert('حدث خطأ أثناء الموافقة على الإيداع');
    }
}

// Reject deposit
export async function rejectDeposit() {
    if (!selectedDepositId) return;

    try {
        await updateDoc(doc(db, 'deposits', selectedDepositId), {
            status: 'rejected',
            note: document.getElementById('depositNoteDetail').value.trim(),
            updatedAt: new Date().toISOString()
        });

        // Send notification to user
        const deposit = currentDeposits.find(d => d.id === selectedDepositId);
        await addDoc(collection(db, 'notifications'), {
            uid: deposit.uid,
            title: 'تم رفض الإيداع',
            body: `تم رفض إيداعك رقم ${selectedDepositId}. يرجى مراجعة الملاحظات`,
            createdAt: new Date().toISOString()
        });

        document.getElementById('depositDetailsModal').style.display = 'none';
        selectedDepositId = null;
        
        alert('تم رفض الإيداع بنجاح');
    } catch (error) {
        console.error('Error rejecting deposit:', error);
        alert('حدث خطأ أثناء رفض الإيداع');
    }
}

// Helper functions
function getMethodText(method) {
    const methods = {
        'vodafone': 'فودافون كاش',
        'bitcoin': 'بيتكوين',
        'ethereum': 'إيثريوم'
    };
    return methods[method] || method;
}

function getStatusText(status) {
    const statusTexts = {
        'pending': 'قيد المراجعة',
        'approved': 'تم الموافقة',
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