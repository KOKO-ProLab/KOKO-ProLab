// Login Form Component
class LoginForm extends HTMLElement {
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

                .login-container {
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

                .divider {
                    margin: 20px 0;
                    text-align: center;
                    position: relative;
                }

                .divider::before,
                .divider::after {
                    content: '';
                    position: absolute;
                    top: 50%;
                    width: 45%;
                    height: 1px;
                    background: rgba(255, 255, 255, 0.2);
                }

                .divider::before { left: 0; }
                .divider::after { right: 0; }
            </style>

            <div class="login-container">
                <form id="loginForm">
                    <div class="form-group">
                        <label for="username">اسم المستخدم</label>
                        <input type="text" id="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">كلمة المرور</label>
                        <input type="password" id="password" required>
                    </div>
                    <button type="submit">تسجيل الدخول</button>
                    <div class="error-message"></div>
                </form>
                <div class="divider">أو</div>
                <button id="googleSignIn">
                    تسجيل الدخول مع Google
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        const form = this.shadowRoot.getElementById('loginForm');
        const googleButton = this.shadowRoot.getElementById('googleSignIn');
        const errorMessage = this.shadowRoot.querySelector('.error-message');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = this.shadowRoot.getElementById('username').value;
            const password = this.shadowRoot.getElementById('password').value;

            try {
                await signInWithUsername(username, password);
                errorMessage.textContent = '';
            } catch (error) {
                errorMessage.textContent = error.message;
            }
        });

        googleButton.addEventListener('click', async () => {
            try {
                await signInWithGoogle();
                errorMessage.textContent = '';
            } catch (error) {
                errorMessage.textContent = error.message;
            }
        });
    }
}

// Register the custom element
customElements.define('login-form', LoginForm);