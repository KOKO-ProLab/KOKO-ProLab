import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// User Registration
export async function registerUser(username, email, password) {
    try {
        // Check if username is already taken
        const usernameDoc = await getDoc(doc(db, 'usernames', username));
        if (usernameDoc.exists()) {
            throw new Error('اسم المستخدم مستخدم بالفعل');
        }

        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            username: username,
            email: email,
            displayName: username,
            phone: '',
            balance: 0,
            role: 'user',
            rank: 'مبتدئ',
            verified: false,
            createdAt: new Date().toISOString()
        });

        // Reserve username
        await setDoc(doc(db, 'usernames', username), {
            uid: user.uid
        });

        return user;
    } catch (error) {
        console.error('Error during registration:', error);
        throw error;
    }
}

// User Login
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Error during login:', error);
        throw error;
    }
}

// Google Sign In
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Check if user profile exists
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            // Create new user profile for Google sign-in
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                username: user.email.split('@')[0],
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                phone: '',
                balance: 0,
                role: 'user',
                rank: 'مبتدئ',
                verified: false,
                createdAt: new Date().toISOString()
            });
        }

        return user;
    } catch (error) {
        console.error('Error during Google sign in:', error);
        throw error;
    }
}

// Password Reset
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}

// Sign Out
export async function logoutUser() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
}

// Auth State Observer
export function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
}