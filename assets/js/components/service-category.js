// Service Category Component
class ServiceCategory extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['icon', 'title', 'description', 'price'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        const icon = this.getAttribute('icon') || '🔧';
        const title = this.getAttribute('title') || 'الخدمة';
        const description = this.getAttribute('description') || 'وصف الخدمة';
        const price = this.getAttribute('price') || '0';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .service-card {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 15px;
                    padding: 20px;
                    transition: transform 0.3s, box-shadow 0.3s;
                    cursor: pointer;
                }

                .service-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
                }

                .icon {
                    font-size: 2em;
                    margin-bottom: 10px;
                }

                .title {
                    font-size: 1.2em;
                    font-weight: bold;
                    margin: 10px 0;
                }

                .description {
                    font-size: 0.9em;
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 15px;
                }

                .price {
                    font-size: 1.1em;
                    font-weight: bold;
                    color: var(--primary-color, #4a90e2);
                }

                .order-form {
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

                .close-button {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 1.5em;
                    cursor: pointer;
                    color: var(--text-color, black);
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
                    border: 1px solid rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                }

                .submit-button {
                    width: 100%;
                    padding: 10px;
                    background: var(--primary-color, #4a90e2);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .submit-button:hover {
                    transform: translateY(-2px);
                }

                .error-message {
                    color: #e74c3c;
                    margin-top: 10px;
                    text-align: center;
                }
            </style>

            <div class="service-card">
                <div class="icon">${icon}</div>
                <div class="title">${title}</div>
                <div class="description">${description}</div>
                <div class="price">$${price}</div>
            </div>

            <div class="modal-backdrop"></div>
            <div class="order-form">
                <button class="close-button">&times;</button>
                <h3>طلب خدمة: ${title}</h3>
                <form id="orderForm">
                    <div class="form-group">
                        <label for="link">الرابط</label>
                        <input type="text" id="link" required>
                    </div>
                    <div class="form-group">
                        <label for="quantity">الكمية</label>
                        <input type="number" id="quantity" min="1" required>
                    </div>
                    <div class="total-price">
                        المجموع: $<span id="totalPrice">0</span>
                    </div>
                    <button type="submit" class="submit-button">تأكيد الطلب</button>
                    <div class="error-message"></div>
                </form>
            </div>
        `;
    }

    setupEventListeners() {
        const card = this.shadowRoot.querySelector('.service-card');
        const modal = this.shadowRoot.querySelector('.order-form');
        const backdrop = this.shadowRoot.querySelector('.modal-backdrop');
        const closeButton = this.shadowRoot.querySelector('.close-button');
        const orderForm = this.shadowRoot.querySelector('#orderForm');
        const quantityInput = this.shadowRoot.querySelector('#quantity');
        const totalPriceSpan = this.shadowRoot.querySelector('#totalPrice');

        card.addEventListener('click', () => this.showModal());
        closeButton.addEventListener('click', () => this.hideModal());
        backdrop.addEventListener('click', () => this.hideModal());
        
        quantityInput.addEventListener('input', () => {
            const quantity = parseInt(quantityInput.value) || 0;
            const price = parseFloat(this.getAttribute('price')) || 0;
            totalPriceSpan.textContent = (quantity * price).toFixed(2);
        });

        orderForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    showModal() {
        const modal = this.shadowRoot.querySelector('.order-form');
        const backdrop = this.shadowRoot.querySelector('.modal-backdrop');
        modal.style.display = 'block';
        backdrop.style.display = 'block';
    }

    hideModal() {
        const modal = this.shadowRoot.querySelector('.order-form');
        const backdrop = this.shadowRoot.querySelector('.modal-backdrop');
        modal.style.display = 'none';
        backdrop.style.display = 'none';
    }

    async handleSubmit(e) {
        e.preventDefault();

        const user = firebase.auth().currentUser;
        if (!user) {
            alert('الرجاء تسجيل الدخول أولاً');
            return;
        }

        const link = this.shadowRoot.querySelector('#link').value;
        const quantity = parseInt(this.shadowRoot.querySelector('#quantity').value);
        const price = parseFloat(this.getAttribute('price')) || 0;
        const totalPrice = quantity * price;

        try {
            // Get user's current balance
            const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            const userBalance = userDoc.data().balance || 0;

            if (userBalance < totalPrice) {
                throw new Error('رصيدك غير كافي لإتمام هذا الطلب');
            }

            // Create order
            await firebase.firestore().collection('orders').add({
                userId: user.uid,
                serviceTitle: this.getAttribute('title'),
                link: link,
                quantity: quantity,
                price: price,
                totalPrice: totalPrice,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update user balance
            await firebase.firestore().collection('users').doc(user.uid).update({
                balance: firebase.firestore.FieldValue.increment(-totalPrice)
            });

            this.hideModal();
            alert('تم إرسال الطلب بنجاح');
            
            // Dispatch event to update floating balance
            document.dispatchEvent(new CustomEvent('balance-updated'));

        } catch (error) {
            console.error('Error creating order:', error);
            const errorMessage = this.shadowRoot.querySelector('.error-message');
            errorMessage.textContent = error.message;
        }
    }
}

// Register the custom element
customElements.define('service-category', ServiceCategory);