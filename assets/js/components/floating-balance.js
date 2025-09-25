// Floating Balance Button Component
class FloatingBalance extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.balance = 0;
    }

    static get observedAttributes() {
        return ['balance'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'balance') {
            this.balance = parseFloat(newValue);
            this.updateBalance();
        }
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadUserBalance();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                }

                .balance-container {
                    background: linear-gradient(45deg, var(--primary-color, #4a90e2), var(--secondary-color, #2c3e50));
                    border-radius: 30px;
                    padding: 15px 25px;
                    color: white;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    cursor: pointer;
                    transition: transform 0.3s, box-shadow 0.3s;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .balance-container:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
                }

                .icon {
                    font-size: 1.2em;
                }

                .amount {
                    font-weight: bold;
                    font-size: 1.1em;
                }

                .deposit-modal {
                    display: none;
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: var(--bg-color, white);
                    padding: 20px;
                    border-radius: 15px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    z-index: 1001;
                    min-width: 300px;
                }

                .modal-backdrop {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(5px);
                    z-index: 1000;
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }

                .close-button {
                    background: none;
                    border: none;
                    font-size: 1.5em;
                    cursor: pointer;
                    color: var(--text-color, black);
                }

                .input-group {
                    margin-bottom: 15px;
                }

                input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                    margin-top: 5px;
                }

                .deposit-button {
                    width: 100%;
                    padding: 10px;
                    background: var(--primary-color, #4a90e2);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .deposit-button:hover {
                    transform: translateY(-2px);
                }
            </style>

            <div class="balance-container">
                <span class="icon">💰</span>
                <span class="amount">${this.balance.toFixed(2)} $</span>
            </div>

            <div class="modal-backdrop"></div>
            <div class="deposit-modal">
                <div class="modal-header">
                    <h3>إيداع رصيد</h3>
                    <button class="close-button">&times;</button>
                </div>
                <div class="input-group">
                    <label for="amount">المبلغ ($)</label>
                    <input type="number" id="amount" min="1" step="0.01">
                </div>
                <div class="input-group">
                    <label for="payment-method">طريقة الدفع</label>
                    <select id="payment-method">
                        <option value="crypto">عملات رقمية</option>
                        <option value="vodafone">فودافون كاش</option>
                    </select>
                </div>
                <button class="deposit-button">إيداع</button>
            </div>
        `;
    }

    setupEventListeners() {
        const balanceContainer = this.shadowRoot.querySelector('.balance-container');
        const modal = this.shadowRoot.querySelector('.deposit-modal');
        const backdrop = this.shadowRoot.querySelector('.modal-backdrop');
        const closeButton = this.shadowRoot.querySelector('.close-button');
        const depositButton = this.shadowRoot.querySelector('.deposit-button');

        balanceContainer.addEventListener('click', () => this.showModal());
        closeButton.addEventListener('click', () => this.hideModal());
        backdrop.addEventListener('click', () => this.hideModal());
        depositButton.addEventListener('click', () => this.handleDeposit());
    }

    showModal() {
        const modal = this.shadowRoot.querySelector('.deposit-modal');
        const backdrop = this.shadowRoot.querySelector('.modal-backdrop');
        modal.style.display = 'block';
        backdrop.style.display = 'block';
    }

    hideModal() {
        const modal = this.shadowRoot.querySelector('.deposit-modal');
        const backdrop = this.shadowRoot.querySelector('.modal-backdrop');
        modal.style.display = 'none';
        backdrop.style.display = 'none';
    }

    async loadUserBalance() {
        const user = firebase.auth().currentUser;
        if (user) {
            const doc = await firebase.firestore().collection('users').doc(user.uid).get();
            if (doc.exists) {
                this.balance = doc.data().balance || 0;
                this.updateBalance();
            }
        }
    }

    updateBalance() {
        const amountElement = this.shadowRoot.querySelector('.amount');
        if (amountElement) {
            amountElement.textContent = `${this.balance.toFixed(2)} $`;
        }
    }

    async handleDeposit() {
        const amount = parseFloat(this.shadowRoot.querySelector('#amount').value);
        const paymentMethod = this.shadowRoot.querySelector('#payment-method').value;

        if (isNaN(amount) || amount <= 0) {
            alert('الرجاء إدخال مبلغ صحيح');
            return;
        }

        const user = firebase.auth().currentUser;
        if (!user) {
            alert('الرجاء تسجيل الدخول أولاً');
            return;
        }

        try {
            // Create deposit request
            await firebase.firestore().collection('deposits').add({
                userId: user.uid,
                amount: amount,
                paymentMethod: paymentMethod,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.hideModal();
            alert('تم إرسال طلب الإيداع بنجاح. سيتم مراجعته من قبل الإدارة.');
            
        } catch (error) {
            console.error('Error creating deposit request:', error);
            alert('حدث خطأ أثناء إنشاء طلب الإيداع');
        }
    }
}

// Register the custom element
customElements.define('floating-balance', FloatingBalance);