// وظائف صفحة الملف الشخصي
document.addEventListener('DOMContentLoaded', function() {
    let currentUser = null;
    let userData = null;

    // تهيئة الصفحة
    initProfilePage();

    function initProfilePage() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                loadProfileData();
                setupEventListeners();
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    function loadProfileData() {
        db.collection('users').doc(currentUser.uid).onSnapshot((doc) => {
            if (doc.exists) {
                userData = doc.data();
                updateProfileUI();
            }
        });
    }

    function updateProfileUI() {
        // تحديث البيانات الأساسية
        document.getElementById('userName').textContent = userData.displayName || userData.username;
        document.getElementById('profileDisplayName').textContent = userData.displayName || userData.username;
        document.getElementById('profileUsername').textContent = '@' + userData.username;
        document.getElementById('profileBalance').textContent = userData.balance.toFixed(2);
        document.getElementById('username').value = userData.username;
        document.getElementById('email').value = userData.email;
        
        // البيانات القابلة للتعديل
        document.getElementById('displayName').value = userData.displayName || '';
        document.getElementById('phone').value = userData.phone || '';
        
        // معلومات إضافية
        document.getElementById('profileBadge').textContent = userData.rank || 'مبتدئ';
        document.getElementById('accountRank').textContent = userData.rank || 'مبتدئ';
        document.getElementById('accountVerified').textContent = userData.verified ? 'موثق' : 'غير موثق';
        document.getElementById('accountVerified').className = userData.verified ? 'verified' : 'not-verified';
        
        // تاريخ التسجيل
        if (userData.createdAt) {
            document.getElementById('joinDate').value = formatDate(userData.createdAt);
        }
        
        // عدد الطلبات النشطة
        loadActiveOrdersCount();
    }

    function loadActiveOrdersCount() {
        db.collection('orders')
            .where('uid', '==', currentUser.uid)
            .where('status', 'in', ['pending', 'in-progress'])
            .get()
            .then((querySnapshot) => {
                document.getElementById('profileOrders').textContent = querySnapshot.size;
            });
    }

    function setupEventListeners() {
        // نموذج تحديث الملف الشخصي
        const profileForm = document.getElementById('profileForm');
        profileForm.addEventListener('submit', updateProfile);

        // نموذج تغيير كلمة المرور
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        const changePasswordModal = document.getElementById('changePasswordModal');
        const changePasswordForm = document.getElementById('changePasswordForm');

        changePasswordBtn.addEventListener('click', () => {
            changePasswordModal.style.display = 'block';
        });

        changePasswordForm.addEventListener('submit', changePassword);

        // إغلاق النماذج
        const closeButtons = document.querySelectorAll('.close');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                modal.style.display = 'none';
            });
        });

        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });
    }

    async function updateProfile(e) {
        e.preventDefault();
        
        const displayName = document.getElementById('displayName').value;
        const phone = document.getElementById('phone').value;

        try {
            await db.collection('users').doc(currentUser.uid).update({
                displayName: displayName,
                phone: phone,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showNotification('تم تحديث الملف الشخصي بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في تحديث الملف الشخصي:', error);
            showNotification('حدث خطأ أثناء تحديث الملف الشخصي', 'error');
        }
    }

    async function changePassword(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmNewPassword) {
            showNotification('كلمتا المرور غير متطابقتين', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
            return;
        }

        try {
            // إعادة المصادقة للتأكد من صحة كلمة المرور الحالية
            const credential = firebase.auth.EmailAuthProvider.credential(
                currentUser.email, 
                currentPassword
            );
            
            await currentUser.reauthenticateWithCredential(credential);
            
            // تغيير كلمة المرور
            await currentUser.updatePassword(newPassword);
            
            showNotification('تم تغيير كلمة المرور بنجاح', 'success');
            document.getElementById('changePasswordModal').style.display = 'none';
            document.getElementById('changePasswordForm').reset();
            
        } catch (error) {
            console.error('خطأ في تغيير كلمة المرور:', error);
            
            if (error.code === 'auth/wrong-password') {
                showNotification('كلمة المرور الحالية غير صحيحة', 'error');
            } else {
                showNotification('حدث خطأ أثناء تغيير كلمة المرور', 'error');
            }
        }
    }
});
