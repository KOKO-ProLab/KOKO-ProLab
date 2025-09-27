import { auth, db } from './firebase-config.js';
import { 
    doc, 
    getDoc,
    updateDoc,
    onSnapshot
} from 'firebase/firestore';
import {
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'firebase/auth';

let isEditing = {
    displayName: false,
    phone: false
};

let userData = null;

// Initialize profile page
export async function initProfile() {
    if (!auth.currentUser) {
        window.location.href = '/';
        return;
    }

    // Get user data
    const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    if (userDoc.exists()) {
        userData = userDoc.data();
        updateProfileUI(userData);
    }

    // Listen for real-time updates
    onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
        if (doc.exists()) {
            userData = doc.data();
            updateProfileUI(userData);
        }
    });

    // Set up event listeners
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('saveChangesBtn').addEventListener('click', saveChanges);
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordChange);
}

// Update UI with user data
function updateProfileUI(data) {
    document.getElementById('displayNameHeader').textContent = data.displayName;
    document.getElementById('userRank').textContent = data.rank;
    document.getElementById('verifiedBadge').style.display = data.verified ? 'inline-flex' : 'none';
    document.getElementById('userBalance').textContent = data.balance.toLocaleString('ar-EG');
    document.getElementById('usernameField').textContent = data.username;
    document.getElementById('emailField').textContent = data.email;
    document.getElementById('displayNameInput').value = data.displayName;
    document.getElementById('phoneInput').value = data.phone || '';
}

// Toggle edit mode for fields
export function toggleEdit(field) {
    const input = document.getElementById(`${field}Input`);
    const editBtn = input.nextElementSibling;
    const saveBtn = document.getElementById('saveChangesBtn');

    isEditing[field] = !isEditing[field];

    input.disabled = !isEditing[field];
    editBtn.innerHTML = isEditing[field] ? '<i class="fas fa-times"></i>' : '<i class="fas fa-edit"></i>';
    
    if (isEditing[field]) {
        input.focus();
    }

    saveBtn.style.display = Object.values(isEditing).some(value => value) ? 'inline-block' : 'none';
}

// Save profile changes
async function saveChanges() {
    try {
        const updates = {};

        if (isEditing.displayName) {
            const newDisplayName = document.getElementById('displayNameInput').value.trim();
            if (newDisplayName && newDisplayName !== userData.displayName) {
                updates.displayName = newDisplayName;
            }
        }

        if (isEditing.phone) {
            const newPhone = document.getElementById('phoneInput').value.trim();
            if (newPhone !== userData.phone) {
                updates.phone = newPhone;
            }
        }

        if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), updates);
            alert('تم حفظ التغييرات بنجاح');

            // Reset edit states
            Object.keys(isEditing).forEach(field => {
                isEditing[field] = false;
                const input = document.getElementById(`${field}Input`);
                input.disabled = true;
                input.nextElementSibling.innerHTML = '<i class="fas fa-edit"></i>';
            });

            document.getElementById('saveChangesBtn').style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('حدث خطأ أثناء حفظ التغييرات');
    }
}

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('كلمة المرور الجديدة غير متطابقة');
        return;
    }

    try {
        const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            currentPassword
        );

        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);

        alert('تم تغيير كلمة المرور بنجاح');
        e.target.reset();
    } catch (error) {
        console.error('Error changing password:', error);
        alert('حدث خطأ أثناء تغيير كلمة المرور');
    }
}

// Handle logout
async function handleLogout() {
    try {
        await auth.signOut();
        window.location.href = '/';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('حدث خطأ أثناء تسجيل الخروج');
    }
}