// Product Management Component for Admin Dashboard
class AdminProducts extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadProducts();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 20px;
                }

                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }

                .product-card {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 15px;
                    padding: 20px;
                    position: relative;
                }

                .add-product-btn {
                    background: var(--primary-color, #4a90e2);
                    color: white;
                    border: none;
                    border-radius: 25px;
                    padding: 10px 20px;
                    cursor: pointer;
                    transition: transform 0.2s;
                }

                .add-product-btn:hover {
                    transform: translateY(-2px);
                }

                .modal {
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

                .backdrop {
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

                .form-group {
                    margin-bottom: 15px;
                }

                label {
                    display: block;
                    margin-bottom: 5px;
                }

                input, select, textarea {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                    background: var(--bg-color, white);
                    color: var(--text-color, black);
                }

                .action-buttons {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                }

                .action-buttons button {
                    flex: 1;
                    padding: 8px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                }

                .save-btn {
                    background: var(--primary-color, #4a90e2);
                    color: white;
                }

                .cancel-btn {
                    background: rgba(0, 0, 0, 0.1);
                }

                .edit-btn, .delete-btn {
                    padding: 5px 10px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-right: 5px;
                }

                .edit-btn {
                    background: var(--primary-color, #4a90e2);
                    color: white;
                }

                .delete-btn {
                    background: #e74c3c;
                    color: white;
                }

                .error-message {
                    color: #e74c3c;
                    margin-top: 10px;
                    text-align: center;
                }
            </style>

            <div class="admin-products">
                <button class="add-product-btn">إضافة خدمة جديدة</button>
                <div class="products-grid"></div>
            </div>

            <div class="backdrop"></div>
            <div class="modal">
                <h3>إضافة/تعديل خدمة</h3>
                <form id="productForm">
                    <div class="form-group">
                        <label for="title">عنوان الخدمة</label>
                        <input type="text" id="title" required>
                    </div>
                    <div class="form-group">
                        <label for="description">وصف الخدمة</label>
                        <textarea id="description" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="price">السعر ($)</label>
                        <input type="number" id="price" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="category">الفئة</label>
                        <select id="category" required>
                            <option value="web">تصميم مواقع</option>
                            <option value="android">تصميم تطبيقات أندرويد</option>
                            <option value="windows">تصميم برامج ويندوز</option>
                            <option value="social">خدمات التواصل الاجتماعي</option>
                            <option value="other">خدمات أخرى</option>
                        </select>
                    </div>
                    <div class="action-buttons">
                        <button type="button" class="cancel-btn">إلغاء</button>
                        <button type="submit" class="save-btn">حفظ</button>
                    </div>
                    <div class="error-message"></div>
                </form>
            </div>
        `;
    }

    setupEventListeners() {
        const addButton = this.shadowRoot.querySelector('.add-product-btn');
        const modal = this.shadowRoot.querySelector('.modal');
        const backdrop = this.shadowRoot.querySelector('.backdrop');
        const cancelBtn = this.shadowRoot.querySelector('.cancel-btn');
        const form = this.shadowRoot.querySelector('#productForm');

        addButton.addEventListener('click', () => this.showModal());
        backdrop.addEventListener('click', () => this.hideModal());
        cancelBtn.addEventListener('click', () => this.hideModal());
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    showModal(product = null) {
        const modal = this.shadowRoot.querySelector('.modal');
        const backdrop = this.shadowRoot.querySelector('.backdrop');
        const form = this.shadowRoot.querySelector('#productForm');

        if (product) {
            // Edit mode
            form.elements.title.value = product.title;
            form.elements.description.value = product.description;
            form.elements.price.value = product.price;
            form.elements.category.value = product.category;
            form.dataset.productId = product.id;
        } else {
            // Add mode
            form.reset();
            delete form.dataset.productId;
        }

        modal.style.display = 'block';
        backdrop.style.display = 'block';
    }

    hideModal() {
        const modal = this.shadowRoot.querySelector('.modal');
        const backdrop = this.shadowRoot.querySelector('.backdrop');
        modal.style.display = 'none';
        backdrop.style.display = 'none';
    }

    async loadProducts() {
        try {
            const snapshot = await firebase.firestore().collection('products').get();
            const productsGrid = this.shadowRoot.querySelector('.products-grid');
            productsGrid.innerHTML = '';

            snapshot.forEach(doc => {
                const product = { id: doc.id, ...doc.data() };
                this.addProductToUI(product);
            });
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    addProductToUI(product) {
        const productsGrid = this.shadowRoot.querySelector('.products-grid');
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <h3>${product.title}</h3>
            <p>${product.description}</p>
            <p>السعر: $${product.price}</p>
            <p>الفئة: ${product.category}</p>
            <div class="action-buttons">
                <button class="edit-btn" data-id="${product.id}">تعديل</button>
                <button class="delete-btn" data-id="${product.id}">حذف</button>
            </div>
        `;

        productCard.querySelector('.edit-btn').addEventListener('click', () => this.showModal(product));
        productCard.querySelector('.delete-btn').addEventListener('click', () => this.deleteProduct(product.id));

        productsGrid.appendChild(productCard);
    }

    async handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const productData = {
            title: form.elements.title.value,
            description: form.elements.description.value,
            price: parseFloat(form.elements.price.value),
            category: form.elements.category.value
        };

        try {
            if (form.dataset.productId) {
                // Update existing product
                await firebase.firestore().collection('products')
                    .doc(form.dataset.productId)
                    .update(productData);
            } else {
                // Add new product
                await firebase.firestore().collection('products').add(productData);
            }

            this.hideModal();
            this.loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            const errorMessage = this.shadowRoot.querySelector('.error-message');
            errorMessage.textContent = 'حدث خطأ أثناء حفظ المنتج';
        }
    }

    async deleteProduct(productId) {
        if (!confirm('هل أنت متأكد من حذف هذه الخدمة؟')) return;

        try {
            await firebase.firestore().collection('products').doc(productId).delete();
            this.loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('حدث خطأ أثناء حذف المنتج');
        }
    }
}

// Register the custom element
customElements.define('admin-products', AdminProducts);