import { auth, db } from './firebase-config.js';
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    getDoc
} from 'firebase/firestore';

let currentTickets = [];

// Initialize support system
export async function initSupport() {
    if (!auth.currentUser) {
        window.location.href = '/';
        return;
    }

    setupModals();
    loadTickets();
    setupNewTicketForm();
}

// Set up modals
function setupModals() {
    const newTicketModal = document.getElementById('newTicketModal');
    const ticketDetailsModal = document.getElementById('ticketDetailsModal');
    const closeBtns = document.querySelectorAll('.close');

    closeBtns.forEach(btn => {
        btn.onclick = function() {
            newTicketModal.style.display = 'none';
            ticketDetailsModal.style.display = 'none';
        };
    });

    window.onclick = function(event) {
        if (event.target === newTicketModal || event.target === ticketDetailsModal) {
            newTicketModal.style.display = 'none';
            ticketDetailsModal.style.display = 'none';
        }
    };
}

// Load user's tickets
async function loadTickets() {
    try {
        const ticketsQuery = query(
            collection(db, 'tickets'),
            where('uid', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        onSnapshot(ticketsQuery, (snapshot) => {
            currentTickets = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            renderTickets();
        });
    } catch (error) {
        console.error('Error loading tickets:', error);
        alert('حدث خطأ أثناء تحميل التذاكر');
    }
}

// Render tickets list
function renderTickets() {
    const ticketsList = document.querySelector('.tickets-list');
    
    if (currentTickets.length === 0) {
        ticketsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-ticket-alt"></i>
                <h3>لا توجد تذاكر</h3>
                <p>لم تقم بإنشاء أي تذاكر حتى الآن</p>
            </div>
        `;
        return;
    }

    ticketsList.innerHTML = currentTickets.map(ticket => `
        <div class="ticket-card" onclick="showTicketDetails('${ticket.id}')">
            <div class="ticket-info">
                <span class="ticket-id">#${ticket.id}</span>
                <span class="ticket-category">${getCategoryText(ticket.category)}</span>
                <p class="ticket-preview">${ticket.message}</p>
            </div>
            <div class="ticket-meta">
                <span class="status-badge status-${ticket.status}">
                    ${getStatusText(ticket.status)}
                </span>
                <span class="ticket-date">${formatDate(ticket.createdAt)}</span>
            </div>
        </div>
    `).join('');
}

// Set up new ticket form
function setupNewTicketForm() {
    const form = document.getElementById('newTicketForm');
    form.onsubmit = async (e) => {
        e.preventDefault();

        const category = document.getElementById('ticketCategory').value;
        const message = document.getElementById('ticketMessage').value.trim();

        try {
            // Create new ticket
            await addDoc(collection(db, 'tickets'), {
                uid: auth.currentUser.uid,
                category,
                message,
                status: 'open',
                createdAt: new Date().toISOString()
            });

            // Reset form and close modal
            form.reset();
            document.getElementById('newTicketModal').style.display = 'none';
            alert('تم إنشاء التذكرة بنجاح');
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('حدث خطأ أثناء إنشاء التذكرة');
        }
    };
}

// Open new ticket modal
export function openNewTicketModal() {
    document.getElementById('newTicketModal').style.display = 'block';
}

// Show ticket details
export async function showTicketDetails(ticketId) {
    const ticket = currentTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const modal = document.getElementById('ticketDetailsModal');
    
    document.getElementById('ticketIdDetail').textContent = ticket.id;
    document.getElementById('ticketStatusBadge').textContent = getStatusText(ticket.status);
    document.getElementById('ticketStatusBadge').className = `status-badge status-${ticket.status}`;
    document.getElementById('ticketCategoryDetail').textContent = getCategoryText(ticket.category);
    document.getElementById('ticketDateDetail').textContent = formatDate(ticket.createdAt);
    document.getElementById('ticketMessageDetail').textContent = ticket.message;
    document.getElementById('ticketMessageTimeDetail').textContent = formatTime(ticket.createdAt);

    const replyContainer = document.getElementById('adminReplyContainer');
    if (ticket.reply) {
        document.getElementById('replyMessageDetail').textContent = ticket.reply;
        document.getElementById('replyTimeDetail').textContent = formatTime(ticket.replyAt);
        replyContainer.style.display = 'block';
    } else {
        replyContainer.style.display = 'none';
    }

    // Show/hide close button based on ticket status
    document.getElementById('ticketActions').style.display = 
        ticket.status === 'open' ? 'flex' : 'none';

    modal.style.display = 'block';
}

// Close ticket
export async function closeTicket() {
    const ticketId = document.getElementById('ticketIdDetail').textContent;
    
    try {
        await updateDoc(doc(db, 'tickets', ticketId), {
            status: 'closed',
            closedAt: new Date().toISOString()
        });

        document.getElementById('ticketDetailsModal').style.display = 'none';
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
        day: 'numeric'
    }).format(date);
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
        hour: 'numeric',
        minute: 'numeric'
    }).format(date);
}