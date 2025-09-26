// إدارة المصادقة
document.addEventListener('DOMContentLoaded', function() {
    // عناصر واجهة المستخدم
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const googleLogin = document.getElementById('googleLogin');
    const googleRegister = document.getElementById('googleRegister');
    const forgotPassword = document.getElementById('forgotPassword');
    
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    const navAuth = document.getElementById('navAuth');
    const navUser = document.getElementById('navUser');
    const userName = document.getElementById('userName');
    
    // إغلاق النماذج
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            loginModal.style.display = 'none';
            registerModal.style.display = 'none';
            forgotPasswordModal.style.display = 'none';
        });
    });
    
    // فتح النماذج
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            loginModal.style.display = 'block';
            registerModal.style.display = 'none';
            forgotPasswordModal.style.display = 'none';
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            registerModal.style.display = 'block';
            loginModal.style.display = 'none';
            forgotPasswordModal.style.display = 'none';
        });
    }
    
    if (forgotPassword) {
        forgotPassword.addEventListener('click', (e) => {
            e.preventDefault();
            forgotPasswordModal.style.display = 'block';
            loginModal.style.display = 'none';
        });
    }
    
    // إغلاق النماذج عند النقر خارجها
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if (event.target === registerModal) {
            registerModal.style.display = 'none';
        }
        if (event.target === forgotPasswordModal) {
            forgotPasswordModal.style.display = 'none';
        }
    });
    
    // تسجيل الدخول
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            // البحث عن المستخدم باستخدام اسم المستخدم
            db.collection('users').where('username', '==', username).get()
                .then((querySnapshot) => {
                    if (querySnapshot.empty) {
                        alert('اسم المستخدم أو كلمة المرور غير صحيحة');
                        return;
                    }
                    
                    const userDoc = querySnapshot.docs[0];
                    const userData = userDoc.data();
                    const email = userData.email;
                    
                    // تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
                    auth.signInWithEmailAndPassword(email, password)
                        .then((userCredential) => {
                            // تم تسجيل الدخول بنجاح
                            loginModal.style.display = 'none';
                            loginForm.reset();
                            updateUI();
                        })
                        .catch((error) => {
                            console.error('خطأ في تسجيل الدخول:', error);
                            alert('اسم المستخدم أو كلمة المرور غير صحيحة');
                        });
                })
                .catch((error) => {
                    console.error('خطأ في البحث عن المستخدم:', error);
                    alert('حدث خطأ أثناء تسجيل الدخول');
                });
        });
    }
    
    // التسجيل بحساب Google
    if (googleLogin) {
        googleLogin.addEventListener('click', signInWithGoogle);
    }
    
    if (googleRegister) {
        googleRegister.addEventListener('click', signInWithGoogle);
    }
    
    function signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        auth.signInWithPopup(provider)
            .then((result) => {
                // تم تسجيل الدخول بنجاح
                const user = result.user;
                
                // التحقق مما إذا كان المستخدم موجوداً مسبقاً
                db.collection('users').doc(user.uid).get()
                    .then((doc) => {
                        if (!doc.exists) {
                            // إنشاء مستخدم جديد
                            const username = generateUsername(user.displayName);
                            
                            db.collection('users').doc(user.uid).set({
                                username: username,
                                email: user.email,
                                displayName: user.displayName || '',
                                phone: '',
                                balance: 0,
                                role: 'user',
                                rank: 'مبتدئ',
                                verified: false,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                            })
                            .then(() => {
                                console.log('تم إنشاء مستخدم جديد');
                                updateUI();
                            })
                            .catch((error) => {
                                console.error('خطأ في إنشاء المستخدم:', error);
                            });
                        } else {
                            updateUI();
                        }
                    })
                    .catch((error) => {
                        console.error('خطأ في التحقق من المستخدم:', error);
                    });
                
                loginModal.style.display = 'none';
                registerModal.style.display = 'none';
            })
            .catch((error) => {
                console.error('خطأ في تسجيل الدخول بحساب Google:', error);
                alert('حدث خطأ أثناء تسجيل الدخول بحساب Google');
            });
    }
    
    // إنشاء حساب جديد
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            
            // التحقق من تطابق كلمتي المرور
            if (password !== confirmPassword) {
                alert('كلمتا المرور غير متطابقتين');
                return;
            }
            
            // التحقق من أن اسم المستخدم غير مستخدم
            db.collection('users').where('username', '==', username).get()
                .then((querySnapshot) => {
                    if (!querySnapshot.empty) {
                        alert('اسم المستخدم هذا مستخدم بالفعل، يرجى اختيار اسم آخر');
                        return;
                    }
                    
                    // إنشاء المستخدم في Firebase Authentication
                    auth.createUserWithEmailAndPassword(email, password)
                        .then((userCredential) => {
                            const user = userCredential.user;
                            
                            // حفظ بيانات المستخدم في Firestore
                            db.collection('users').doc(user.uid).set({
                                username: username,
                                email: email,
                                displayName: '',
                                phone: '',
                                balance: 0,
                                role: 'user',
                                rank: 'مبتدئ',
                                verified: false,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                            })
                            .then(() => {
                                // تم إنشاء الحساب بنجاح
                                registerModal.style.display = 'none';
                                registerForm.reset();
                                updateUI();
                            })
                            .catch((error) => {
                                console.error('خطأ في حفظ بيانات المستخدم:', error);
                                alert('حدث خطأ أثناء إنشاء الحساب');
                            });
                        })
                        .catch((error) => {
                            console.error('خطأ في إنشاء الحساب:', error);
                            alert('حدث خطأ أثناء إنشاء الحساب: ' + error.message);
                        });
                })
                .catch((error) => {
                    console.error('خطأ في التحقق من اسم المستخدم:', error);
                    alert('حدث خطأ أثناء إنشاء الحساب');
                });
        });
    }
    
    // استعادة كلمة المرور
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('resetEmail').value;
            
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    alert('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني');
                    forgotPasswordModal.style.display = 'none';
                    forgotPasswordForm.reset();
                })
                .catch((error) => {
                    console.error('خطأ في إرسال رابط الاستعادة:', error);
                    alert('حدث خطأ أثناء إرسال رابط الاستعادة: ' + error.message);
                });
        });
    }
    
    // تسجيل الخروج
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            auth.signOut()
                .then(() => {
                    updateUI();
                })
                .catch((error) => {
                    console.error('خطأ في تسجيل الخروج:', error);
                });
        });
    }
    
    // تحديث واجهة المستخدم بناءً على حالة المصادقة
    function updateUI() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                // المستخدم مسجل الدخول
                if (navAuth) navAuth.style.display = 'none';
                if (navUser) navUser.style.display = 'flex';
                
                // جلب بيانات المستخدم
                db.collection('users').doc(user.uid).get()
                    .then((doc) => {
                        if (doc.exists) {
                            const userData = doc.data();
                            if (userName) {
                                userName.textContent = userData.displayName || userData.username;
                            }
                        }
                    })
                    .catch((error) => {
                        console.error('خطأ في جلب بيانات المستخدم:', error);
                    });
            } else {
                // المستخدم غير مسجل الدخول
                if (navAuth) navAuth.style.display = 'flex';
                if (navUser) navUser.style.display = 'none';
            }
        });
    }
    
    // توليد اسم مستخدم فريد
    function generateUsername(displayName) {
        const baseName = displayName ? displayName.replace(/\s+/g, '').toLowerCase() : 'user';
        const randomNum = Math.floor(Math.random() * 1000);
        return `${baseName}${randomNum}`;
    }
    
    // تهيئة واجهة المستخدم عند تحميل الصفحة
    updateUI();
});
