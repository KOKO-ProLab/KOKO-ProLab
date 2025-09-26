
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const firestore = firebase.firestore();

// DOM Elements
const adminLoginSection = document.getElementById('admin-login');
const adminPanelSection = document.getElementById('admin-panel');
const adminPasswordInput = document.getElementById('admin-password');
const adminLoginBtn = document.getElementById('admin-login-btn');
const logoutBtn = document.getElementById('logout-btn');

const serviceNameInput = document.getElementById('service-name');
const addServiceBtn = document.getElementById('add-service-btn');
const servicesList = document.getElementById('services-list');
const ordersList = document.getElementById('orders-list');
const usersList = document.getElementById('users-list');
const chatMessages = document.getElementById('chat-messages');

const ADMIN_PASSWORD = "YOUR_ADMIN_PASSWORD"; // Replace with a secure password

// --- Admin Authentication ---
adminLoginBtn.addEventListener('click', () => {
    if (adminPasswordInput.value === ADMIN_PASSWORD) {
        sessionStorage.setItem('isAdmin', 'true');
        showAdminPanel();
    } else {
        alert('Incorrect password');
    }
});

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('isAdmin');
    showLoginScreen();
});

function checkAdminAuth() {
    if (sessionStorage.getItem('isAdmin') === 'true') {
        showAdminPanel();
    } else {
        showLoginScreen();
    }
}

function showAdminPanel() {
    adminLoginSection.style.display = 'none';
    adminPanelSection.style.display = 'block';
    loadAllData();
}

function showLoginScreen() {
    adminLoginSection.style.display = 'block';
    adminPanelSection.style.display = 'none';
}

// --- Data Management ---
function loadAllData() {
    displayServices();
    displayOrders();
    displayUsers();
    displayChat();
}

// Services
addServiceBtn.addEventListener('click', () => {
    const serviceName = serviceNameInput.value.trim();
    if (serviceName) {
        firestore.collection('services').add({ name: serviceName })
            .then(() => {
                serviceNameInput.value = '';
                alert('Service added!');
            })
            .catch(error => console.error("Error adding service: ", error));
    }
});

function displayServices() {
    firestore.collection('services').orderBy('name').onSnapshot(snapshot => {
        servicesList.innerHTML = '<h4>Current Services</h4>';
        snapshot.forEach(doc => {
            const service = doc.data();
            const serviceEl = document.createElement('div');
            serviceEl.innerHTML = `${service.name} <button onclick="deleteService('${doc.id}')">Delete</button>`;
            servicesList.appendChild(serviceEl);
        });
    });
}

window.deleteService = function(id) {
    if (confirm("Are you sure you want to delete this service?")) {
        firestore.collection('services').doc(id).delete();
    }
}

// Orders
function displayOrders() {
    firestore.collection('orders').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        ordersList.innerHTML = ''
        snapshot.forEach(doc => {
            const order = doc.data();
            const orderEl = document.createElement('div');
            orderEl.className = 'order-item';
            orderEl.innerHTML = `
                <p><strong>User:</strong> ${order.userId}</p>
                <p><strong>Service:</strong> ${order.serviceId}</p>
                <p><strong>Link:</strong> ${order.link}</p>
                <p><strong>Quantity:</strong> ${order.quantity}</p>
                <p><strong>Status:</strong>
                    <select onchange="updateOrderStatus('${doc.id}', this.value)">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </p>
            `;
            ordersList.appendChild(orderEl);
        });
    });
}

window.updateOrderStatus = function(id, status) {
    firestore.collection('orders').doc(id).update({ status: status });
}

// Users
function displayUsers() {
    firestore.collection('users').onSnapshot(snapshot => {
        usersList.innerHTML = '';
        snapshot.forEach(doc => {
            const user = doc.data();
            const userEl = document.createElement('div');
            userEl.innerHTML = `<p>${user.displayName || user.username || 'Anonymous'} (${user.email || doc.id})</p>`;
            usersList.appendChild(userEl);
        });
    });
}

// Chat
function displayChat() {
     firestore.collection('chat').orderBy('timestamp', 'desc').limit(100).onSnapshot(snapshot => {
        chatMessages.innerHTML = '';
        snapshot.docs.reverse().forEach(doc => {
            const msg = doc.data();
            const msgEl = document.createElement('div');
            msgEl.innerHTML = `<b>${msg.name}:</b> ${msg.message}`;
            chatMessages.appendChild(msgEl);
        });
    });
}

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', checkAdminAuth);
