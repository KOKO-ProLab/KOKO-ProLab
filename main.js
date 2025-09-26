
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
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const themeSwitcher = document.getElementById('theme-switcher');
const loginModal = document.getElementById('login-modal');
const orderModal = document.getElementById('order-modal');
const loginCloseButton = loginModal.querySelector('.close-button');
const orderCloseButton = orderModal.querySelector('.close-button');
const loginUsernameBtn = document.getElementById('login-username');
const loginGoogleBtn = document.getElementById('login-google');
const usernameInput = document.getElementById('username');
const categoryGrid = document.getElementById('category-grid');
const orderForm = document.getElementById('order-form');
const orderModalTitle = document.getElementById('order-modal-title');
const ordersContainer = document.getElementById('orders-container');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendChatMessageBtn = document.getElementById('send-chat-message');
const chatHeader = document.getElementById('chat-header');
const chatBody = document.getElementById('chat-body');
const userCountEl = document.getElementById('user-count');
const reviewsContainer = document.getElementById('reviews-container');
const showMoreReviewsBtn = document.getElementById('show-more-reviews');

let currentService = null;
let lastVisibleReview = null;

// --- Authentication ---
loginGoogleBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(result => {
            console.log("Logged in with Google:", result.user);
            const user = result.user;
            // Check if user is new, if so, add to 'users' collection
            const userRef = firestore.collection('users').doc(user.uid);
            return userRef.get().then(doc => {
                if (!doc.exists) {
                    userRef.set({
                        displayName: user.displayName,
                        email: user.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            });
        })
        .then(() => loginModal.style.display = 'none')
        .catch(error => console.error("Google login error:", error));
});

loginUsernameBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
        firestore.collection('users').where('username', '==', username).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    auth.signInAnonymously()
                        .then(userCredential => {
                            const user = userCredential.user;
                            return firestore.collection('users').doc(user.uid).set({
                                username: username,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        })
                        .then(() => {
                            console.log("Logged in with username:", username);
                            loginModal.style.display = 'none';
                        })
                        .catch(error => console.error("Anonymous login error:", error));
                } else {
                    alert("Username already taken. Please choose another one.");
                }
            })
            .catch(error => console.error("Error checking username:", error));
    } else {
        alert("Please enter a username.");
    }
});

auth.onAuthStateChanged(user => {
    if (user) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        displayUserOrders(user.uid);
        // Show user-specific sections
        document.getElementById('order-status').style.display = 'block';
        document.getElementById('chat-widget').style.display = 'block';

    } else {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        ordersContainer.innerHTML = '<p>Please log in to see your orders.</p>';
        // Hide user-specific sections
        document.getElementById('order-status').style.display = 'none';
        document.getElementById('chat-widget').style.display = 'none';
    }
});

logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => console.log("User logged out."));
});


// --- UI ---
themeSwitcher.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
});

loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
loginCloseButton.addEventListener('click', () => loginModal.style.display = 'none');
orderCloseButton.addEventListener('click', () => orderModal.style.display = 'none');
window.addEventListener('click', (event) => {
    if (event.target == loginModal) loginModal.style.display = 'none';
    if (event.target == orderModal) orderModal.style.display = 'none';
});

// --- Services & Orders ---
function displayServiceCategories() {
    firestore.collection('services').orderBy('name').onSnapshot(snapshot => {
        categoryGrid.innerHTML = '';
        snapshot.forEach(doc => {
            const service = doc.data();
            const card = document.createElement('div');
            card.className = 'category-card';
            card.innerHTML = `<h4>${service.name}</h4>`;
            card.onclick = () => openOrderModal(doc.id, service.name);
            categoryGrid.appendChild(card);
        });
    });
}

function openOrderModal(serviceId, serviceName) {
    if (!auth.currentUser) {
        alert("Please log in to place an order.");
        loginModal.style.display = 'block';
        return;
    }
    currentService = serviceId;
    orderModalTitle.textContent = `Place Order for ${serviceName}`;
    orderModal.style.display = 'block';
}

orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const link = document.getElementById('order-link').value;
    const quantity = document.getElementById('order-quantity').value;
    const user = auth.currentUser;

    if (user && currentService && link && quantity) {
        firestore.collection('orders').add({
            userId: user.uid,
            serviceId: currentService,
            link: link,
            quantity: Number(quantity),
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            orderForm.reset();
            orderModal.style.display = 'none';
            alert('Order placed successfully!');
        })
        .catch(error => console.error("Error placing order: ", error));
    }
});


function displayUserOrders(userId) {
    firestore.collection('orders').where('userId', '==', userId).orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            ordersContainer.innerHTML = '';
            if (snapshot.empty) {
                ordersContainer.innerHTML = '<p>You have no orders yet.</p>';
                return;
            }
            snapshot.forEach(doc => {
                const order = doc.data();
                const orderEl = document.createElement('div');
                orderEl.className = 'order-item';
                orderEl.innerHTML = `
                    <p><strong>Service:</strong> ${order.serviceId}</p>
                    <p><strong>Link:</strong> ${order.link}</p>
                    <p><strong>Quantity:</strong> ${order.quantity}</p>
                    <p><strong>Status:</strong> <span class="status-${order.status}">${order.status}</span></p>
                `;
                ordersContainer.appendChild(orderEl);
            });
        });
}

// --- Live Chat ---
chatHeader.addEventListener('click', () => {
    chatBody.style.display = chatBody.style.display === 'none' || chatBody.style.display === '' ? 'flex' : 'none';
});

function displayChatMessages() {
    firestore.collection('chat').orderBy('timestamp').limitToLast(50)
        .onSnapshot(snapshot => {
            chatMessages.innerHTML = '';
            snapshot.forEach(doc => {
                const msg = doc.data();
                const msgEl = document.createElement('div');
                msgEl.innerHTML = `<b>${msg.name || 'Anonymous'}:</b> ${msg.message}`;
                chatMessages.appendChild(msgEl);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
}

sendChatMessageBtn.addEventListener('click', () => {
    const message = chatInput.value.trim();
    const user = auth.currentUser;
    if (message && user) {
        let displayName = 'Anonymous';
        if (user.isAnonymous) {
            firestore.collection('users').doc(user.uid).get().then(doc => {
                 if (doc.exists) {
                    displayName = doc.data().username;
                 }
                 sendMessage(displayName, message, user.uid);
            });
        } else {
            displayName = user.displayName;
            sendMessage(displayName, message, user.uid);
        }
    }
});

function sendMessage(name, message, uid) {
     firestore.collection('chat').add({
            name: name,
            message: message,
            userId: uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            chatInput.value = '';
        });
}


// --- Stats & Reviews ---
function updateUserStats() {
    firestore.collection('users').get().then(snapshot => {
        userCountEl.textContent = `${snapshot.size.toLocaleString()}+`;
    });
}

function displayReviews(loadMore = false) {
    let query = firestore.collection('reviews').orderBy('createdAt', 'desc').limit(4);
    if (loadMore && lastVisibleReview) {
        query = query.startAfter(lastVisibleReview);
    }

    query.get().then(snapshot => {
        if (snapshot.empty && !loadMore) {
            reviewsContainer.innerHTML = "<p>No reviews yet.</p>";
            showMoreReviewsBtn.style.display = 'none';
        }

        lastVisibleReview = snapshot.docs[snapshot.docs.length - 1];

        snapshot.forEach(doc => {
            const review = doc.data();
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            reviewCard.innerHTML = `
                <h4>${review.author || 'Anonymous'}</h4>
                <p>"${review.text}"</p>
                <div class="rating">${ '★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
            `;
            reviewsContainer.appendChild(reviewCard);
        });

        if (snapshot.docs.length < 4) {
            showMoreReviewsBtn.style.display = 'none';
        } else {
            showMoreReviewsBtn.style.display = 'block';
        }
    });
}

showMoreReviewsBtn.addEventListener('click', () => displayReviews(true));


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    displayServiceCategories();
    displayChatMessages();
    updateUserStats();
    displayReviews();
    // Set initial theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
});
