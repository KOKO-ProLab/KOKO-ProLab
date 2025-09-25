// Firebase Authentication
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Authentication State Observer
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        updateUIForAuthenticatedUser(user);
    } else {
        // User is signed out
        updateUIForAnonymousUser();
    }
});

// Sign in with Google
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            // Check if username exists
            return checkAndCreateUsername(user);
        })
        .catch((error) => {
            console.error("Error during Google sign in:", error);
            showNotification('error', 'حدث خطأ أثناء تسجيل الدخول');
        });
}

// Sign in with username
async function signInWithUsername(username, password) {
    try {
        // Find user by username
        const userDoc = await db.collection('usernames')
            .where('username', '==', username)
            .get();

        if (userDoc.empty) {
            throw new Error('اسم المستخدم غير موجود');
        }

        const email = userDoc.docs[0].data().email;
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        console.error("Error during username sign in:", error);
        showNotification('error', 'خطأ في اسم المستخدم أو كلمة المرور');
    }
}

// Check username uniqueness and create if needed
async function checkAndCreateUsername(user) {
    const username = user.displayName?.replace(/\s+/g, '_').toLowerCase() || `user_${Math.random().toString(36).slice(2, 8)}`;
    
    try {
        const usernameDoc = await db.collection('usernames').doc(username).get();
        
        if (!usernameDoc.exists) {
            // Create username document
            await db.collection('usernames').doc(username).set({
                uid: user.uid,
                email: user.email,
                username: username,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Update user profile
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                username: username,
                displayName: user.displayName || username,
                photoURL: user.photoURL,
                role: 'user',
                balance: 0,
                rank: 'مبتدئ',
                isVerified: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error checking/creating username:", error);
        throw error;
    }
}

// UI Updates
function updateUIForAuthenticatedUser(user) {
    // Update UI elements for logged in state
    document.getElementById('auth-buttons').innerHTML = `
        <span>مرحباً ${user.displayName || 'مستخدم'}</span>
        <button class="btn" onclick="auth.signOut()">تسجيل خروج</button>
    `;
    
    // Load user-specific content
    loadUserDashboard(user);
}

function updateUIForAnonymousUser() {
    // Update UI elements for logged out state
    document.getElementById('auth-buttons').innerHTML = `
        <button class="btn" onclick="signInWithGoogle()">تسجيل الدخول مع Google</button>
        <button class="btn" onclick="showLoginForm()">تسجيل الدخول</button>
    `;
    
    // Load public content
    loadPublicContent();
}

// Notifications
function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} fade-in`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Theme Toggle
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Initialize theme from localStorage
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
});