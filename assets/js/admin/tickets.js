import { db } from './firebase-config.js';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    getDoc,
    addDoc
} from 'firebase/firestore';

let currentTickets = [];
let selectedTicketId = null;

// Initialize tickets management
export async function initTicketsSection() {
    setupFilters();
    loadTickets();
    setupModal();
    setupReplyForm();
}

// Set up filters
function setupFilters() {
    const statusFilter = document.getElementById('ticketStatusFilter');
    const categoryFilter = document.getElementById('ticketCategoryFilter');
    const searchInput = document.getElementById('ticketSearch');

    statusFilter.addEventListener('change', filterTickets);
    categoryFilter.addEventListener('change', filterTickets);
    searchInput.addEventListener('input', filterTickets);
}

// Load tickets
async function loadTickets() {
    try {
        const ticketsQuery = query(
            collection(db, 'tickets'),
            orderBy('createdAt', 'desc')
        );

        onSnapshot(ticketsQuery, async (snapshot) => {
            currentTickets = [];
            for (const doc of snapshot.docs) {
                const ticket = { id: doc.id, ...doc.data() };
                // Get user details
                const userDoc = await getDoc(doc(db, 'users', ticket.uid));
                if (userDoc.exists()) {
                    ticket.user = userDoc.data();
                }
                currentTickets.push(ticket);
            }
            filterTickets();
        });
    } catch (error) {
        console.error('Error loading tickets:', error);
        alert('حدث خطأ أثناء تحميل التذاكر');
    }
}

// Filter tickets
function filterTickets() {
    const status = document.getElementById('ticketStatusFilter').value;
    const category = document.getElementById('ticketCategoryFilter').value;
    const search = document.getElementById('ticketSearch').value.toLowerCase();

    const filtered = currentTickets.filter(ticket => {
        const matchStatus = status === 'all' || ticket.status === status;
        const matchCategory = category === 'all' || ticket.category === category;
        const matchSearch = ticket.id.toLowerCase().includes(search) ||
                          ticket.user?.username.toLowerCase().includes(search) ||
                          ticket.user?.displayName.toLowerCase().includes(search) ||
                          ticket.message.toLowerCase().includes(search);

        return matchStatus && matchCategory && matchSearch;
    });

    renderTickets(filtered);
}

// Render tickets table
function renderTickets(tickets) {
    const tbody = document.getElementById('ticketsTableBody');
    tbody.innerHTML = tickets.map(ticket => `
        <tr>
            <td>${ticket.id}</td>
            <td>${ticket.user?.displayName || '-'}</td>
            <td>${getCategoryText(ticket.category)}</td>
            <td>${formatDate(ticket.createdAt)}</td>
            <td>
                <span class="status-badge status-${ticket.status}">
                    ${getStatusText(ticket.status)}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="showTicketReply('${ticket.id}')">
                    <i class="fas fa-reply"></i> رد
                </button>
            </td>
        </tr>
    `).join('');
}

// Set up modal
function setupModal() {
    const modal = document.getElementById('ticketReplyModal');
    const closeBtn = modal.querySelector('.close');

    closeBtn.onclick = () => {
        modal.style.display = 'none';
        selectedTicketId = null;
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            selectedTicketId = null;
        }
    };
}

// Set up reply form
function setupReplyForm() {
    const form = document.getElementById('ticketReplyForm');
    form.onsubmit = async (e) => {
        e.preventDefault();

        if (!selectedTicketId) return;

        const reply = document.getElementById('ticketReply').value.trim();
        
        try {
            const ticket = currentTickets.find(t => t.id === selectedTicketId);
            
            // Update ticket with reply
            await updateDoc(doc(db, 'tickets', selectedTicketId), {
                reply,
                replyAt: new Date().toISOString(),
                status: 'closed',
                closedAt: new Date().toISOString()
            });

            // Send notification to user
            await addDoc(collection(db, 'notifications'), {
                uid: ticket.uid,
                title: 'رد جديد على تذكرتك',
                body: `تم الرد على تذكرتك رقم ${selectedTicketId}`,
                createdAt: new Date().toISOString()
            });

            document.getElementById('ticketReplyModal').style.display = 'none';
            form.reset();
            selectedTicketId = null;
            
            alert('تم إرسال الرد بنجاح');
        } catch (error) {
            console.error('Error replying to ticket:', error);
            alert('حدث خطأ أثناء إرسال الرد');
        }
    };
}

// Show ticket reply modal
export async function showTicketReply(ticketId) {
    const ticket = currentTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    selectedTicketId = ticketId;
    const modal = document.getElementById('ticketReplyModal');

    document.getElementById('modalTicketId').textContent = ticket.id;
    document.getElementById('modalTicketCategory').textContent = getCategoryText(ticket.category);
    document.getElementById('modalTicketUser').textContent = ticket.user?.displayName || '-';
    document.getElementById('modalTicketMessage').textContent = ticket.message;

    if (ticket.reply) {
        document.getElementById('ticketReply').value = ticket.reply;
    }

    modal.style.display = 'block';
}

// Close ticket without reply
export async function closeTicket() {
    if (!selectedTicketId) return;

    try {
        await updateDoc(doc(db, 'tickets', selectedTicketId), {
            status: 'closed',
            closedAt: new Date().toISOString()
        });

        document.getElementById('ticketReplyModal').style.display = 'none';
        selectedTicketId = null;
        
        alert('تم إغلاق التذكرة بنجاح');
    } catch (error) {
        console.error('Error closing ticket:', error);
        alert('حدث خطأ أثناء إغلاق التذكرة');
    }
}

// Helper functions
function getCategoryText(category) {
    const categories = {
        'support': 'دعم فني',
        'problem': 'إبلاغ عن مشكلة',
        'order': 'متابعة طلب',
        'merchant': 'تقديم على رتبة تاجر'
    };
    return categories[category] || category;
}

function getStatusText(status) {
    const statuses = {
        'open': 'مفتوحة',
        'closed': 'مغلقة'
    };
    return statuses[status] || status;
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