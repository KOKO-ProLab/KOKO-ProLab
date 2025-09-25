// Initialize Firebase app
const app = firebase.initializeApp({
    apiKey: "AIzaSyDUaSnYinH910wp3zDHOCNuqWp9QjwIRow",
    authDomain: "koko-prolab.firebaseapp.com",
    projectId: "koko-prolab",
    storageBucket: "koko-prolab.firebasestorage.app",
    messagingSenderId: "61256824707",
    appId: "1:61256824707:web:a853065ec0a19f8d57e8b6",
    measurementId: "G-0JQ80XFM9E"
});

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const analytics = firebase.analytics();

// Enable offline persistence for Firestore
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support all of the features required to enable persistence');
        }
    });

// Firebase Authentication state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // Get user data from Firestore
        db.collection('users').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    // Update UI with user data
                    updateUserUI(userData);
                }
            })
            .catch((error) => {
                console.error("Error getting user data:", error);
            });
    } else {
        // User is signed out
        updateAnonymousUI();
    }
});

// Handle Google Sign-in
function handleGoogleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            // Check if user exists in Firestore
            return db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (!doc.exists) {
                        // Create new user document
                        return createNewUser(user);
                    }
                });
        })
        .catch((error) => {
            console.error("Error during Google sign-in:", error);
        });
}

// Create new user in Firestore
function createNewUser(user) {
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'مستخدم جديد',
        photoURL: user.photoURL,
        role: 'user',
        balance: 0,
        rank: 'مبتدئ',
        isVerified: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    return db.collection('users').doc(user.uid).set(userData)
        .then(() => {
            console.log("New user created successfully");
            return userData;
        })
        .catch((error) => {
            console.error("Error creating new user:", error);
            throw error;
        });
}

// Check if username is unique
async function isUsernameUnique(username) {
    const snapshot = await db.collection('usernames')
        .where('username', '==', username)
        .get();
    return snapshot.empty;
}

// Export Firebase instances
window.app = app;
window.auth = auth;
window.db = db;
window.storage = storage;
window.analytics = analytics;