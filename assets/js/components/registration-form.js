// Registration Form Component
class RegistrationForm extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: Arial, sans-serif;
                }

                .registration-container {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 15px;
                    padding: 20px;
                    max-width: 400px;
                    margin: 20px auto;
                }

                .form-group {
                    margin-bottom: 15px;
                }

                label {
                    display: block;
                    margin-bottom: 5px;
                }

                input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    color: inherit;
                }

                button {
                    width: 100%;
                    padding: 10px;
                    border: none;
                    border-radius: 8px;
                    background: var(--primary-color, #4a90e2);
                    color: white;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                button:hover {
                    transform: translateY(-2px);
                }

                .error-message {
                    color: #e74c3c;
                    margin-top: 10px;
                    text-align: center;
                }

                .info-text {
                    font-size: 0.9em;
                    color: rgba(255, 255, 255, 0.7);
                    margin-top: 5px;
                }
            </style>

            <div class="registration-container">
                <form id="registrationForm">
                    <div class="form-group">
                        <label for="username">اسم المستخدم</label>
                        <input type="text" id="username" required pattern="[a-zA-Z0-9_]{3,20}">
                        <div class="info-text">يجب أن يتكون من 3-20 حرفاً، فقط أحرف وأرقام وشرطة سفلية</div>
                    </div>
                    <div class="form-group">
                        <label for="email">البريد الإلكتروني</label>
                        <input type="email" id="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">كلمة المرور</label>
                        <input type="password" id="password" required minlength="6">
                        <div class="info-text">على الأقل 6 أحرف</div>
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">تأكيد كلمة المرور</label>
                        <input type="password" id="confirmPassword" required>
                    </div>
                    <button type="submit">إنشاء حساب</button>
                    <div class="error-message"></div>
                </form>
            </div>
        `;
    }

    setupEventListeners() {
        const form = this.shadowRoot.getElementById('registrationForm');
        const errorMessage = this.shadowRoot.querySelector('.error-message');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = this.shadowRoot.getElementById('username').value;
            const email = this.shadowRoot.getElementById('email').value;
            const password = this.shadowRoot.getElementById('password').value;
            const confirmPassword = this.shadowRoot.getElementById('confirmPassword').value;

            try {
                // Validate password match
                if (password !== confirmPassword) {
                    throw new Error('كلمات المرور غير متطابقة');
                }

                // Check username availability
                const isUnique = await isUsernameUnique(username);
                if (!isUnique) {
                    throw new Error('اسم المستخدم مستخدم بالفعل');
                }

                // Create user with email and password
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Create user profile
                await createUserProfile(user, username);

                errorMessage.textContent = '';
                // Dispatch success event
                this.dispatchEvent(new CustomEvent('registration-success'));

            } catch (error) {
                errorMessage.textContent = error.message;
            }
        });
    }
}

async function createUserProfile(user, username) {
    const userData = {
        uid: user.uid,
        email: user.email,
        username: username,
        displayName: username,
        role: 'user',
        balance: 0,
        rank: 'مبتدئ',
        isVerified: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Create user document in Firestore
    await firebase.firestore().collection('users').doc(user.uid).set(userData);

    // Create username document
    await firebase.firestore().collection('usernames').doc(username).set({
        uid: user.uid,
        username: username,
        email: user.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Update user profile
    await user.updateProfile({
        displayName: username
    });
}

// Register the custom element
customElements.define('registration-form', RegistrationForm);