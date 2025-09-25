// User Management Component for Admin Dashboard
class AdminUsers extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.loadUsers();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    padding: 20px;
                }

                .users-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 15px;
                    overflow: hidden;
                }

                th, td {
                    padding: 12px 15px;
                    text-align: right;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                th {
                    background: var(--primary-color, #4a90e2);
                    color: white;
                }

                tr:hover {
                    background: rgba(255, 255, 255, 0.05);
                }

                .user-actions {
                    display: flex;
                    gap: 5px;
                }

                .action-btn {
                    padding: 5px 10px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 0.9em;
                }

                .verify-btn {
                    background: #2ecc71;
                    color: white;
                }

                .promote-btn {
                    background: #f1c40f;
                    color: white;
                }

                .balance-btn {
                    background: #3498db;
                    color: white;
                }

                .delete-btn {
                    background: #e74c3c;
                    color: white;
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

                input, select {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
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

                .verified-badge {
                    display: inline-block;
                    padding: 2px 6px;
                    background: #2ecc71;
                    color: white;
                    border-radius: 10px;
                    font-size: 0.8em;
                }

                .rank-badge {
                    display: inline-block;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 0.8em;
                }

                .rank-beginner {
                    background: #95a5a6;
                    color: white;
                }

                .rank-intermediate {
                    background: #3498db;
                    color: white;
                }

                .rank-advanced {
                    background: #f1c40f;
                    color: white;
                }

                .search-bar {
                    margin-bottom: 20px;
                }

                .search-input {
                    width: 100%;
                    max-width: 300px;
                    padding: 8px;
                    border: 1px solid rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
            </style>

            <div class="admin-users">
                <div class="search-bar">
                    <input type="text" class="search-input" placeholder="بحث عن مستخدم...">
                </div>
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>اسم المستخدم</th>
                            <th>البريد الإلكتروني</th>
                            <th>الرتبة</th>
                            <th>الرصيد</th>
                            <th>الحالة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>

            <div class="backdrop"></div>
            <div class="modal">
                <h3>تعديل المستخدم</h3>
                <form id="userForm">
                    <div class="form-group">
                        <label for="balance">الرصيد</label>
                        <input type="number" id="balance" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="rank">الرتبة</label>
                        <select id="rank" required>
                            <option value="مبتدئ">مبتدئ</option>
                            <option value="متوسط">متوسط</option>
                            <option value="متميز">متميز</option>
                        </select>
                    </div>
                    <div class="action-buttons">
                        <button type="button" class="cancel-btn">إلغاء</button>
                        <button type="submit" class="save-btn">حفظ</button>
                    </div>
                </form>
            </div>
        `;
    }

    setupEventListeners() {
        const searchInput = this.shadowRoot.querySelector('.search-input');
        const modal = this.shadowRoot.querySelector('.modal');
        const backdrop = this.shadowRoot.querySelector('.backdrop');
        const cancelBtn = this.shadowRoot.querySelector('.cancel-btn');
        const form = this.shadowRoot.querySelector('#userForm');

        searchInput.addEventListener('input', (e) => this.filterUsers(e.target.value));
        backdrop.addEventListener('click', () => this.hideModal());
        cancelBtn.addEventListener('click', () => this.hideModal());
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async loadUsers() {
        try {
            const snapshot = await firebase.firestore().collection('users').get();
            const tbody = this.shadowRoot.querySelector('tbody');
            tbody.innerHTML = '';

            snapshot.forEach(doc => {
                const user = { id: doc.id, ...doc.data() };
                this.addUserToTable(user);
            });
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    addUserToTable(user) {
        const tbody = this.shadowRoot.querySelector('tbody');
        const row = document.createElement('tr');
        
        const rankClass = user.rank === 'مبتدئ' ? 'rank-beginner' : 
                         user.rank === 'متوسط' ? 'rank-intermediate' : 'rank-advanced';

        row.innerHTML = `
            <td>${user.username}${user.isVerified ? ' <span class="verified-badge">✓</span>' : ''}</td>
            <td>${user.email}</td>
            <td><span class="rank-badge ${rankClass}">${user.rank}</span></td>
            <td>$${user.balance || 0}</td>
            <td>${user.isActive ? 'نشط' : 'غير نشط'}</td>
            <td class="user-actions">
                ${!user.isVerified ? `<button class="action-btn verify-btn" data-id="${user.id}">توثيق</button>` : ''}
                <button class="action-btn promote-btn" data-id="${user.id}">ترقية</button>
                <button class="action-btn balance-btn" data-id="${user.id}">الرصيد</button>
                <button class="action-btn delete-btn" data-id="${user.id}">حذف</button>
            </td>
        `;

        row.querySelector('.verify-btn')?.addEventListener('click', () => this.verifyUser(user.id));
        row.querySelector('.promote-btn').addEventListener('click', () => this.showModal(user));
        row.querySelector('.balance-btn').addEventListener('click', () => this.showModal(user));
        row.querySelector('.delete-btn').addEventListener('click', () => this.deleteUser(user.id));

        tbody.appendChild(row);
    }

    filterUsers(query) {
        const rows = this.shadowRoot.querySelectorAll('tbody tr');
        const lowercaseQuery = query.toLowerCase();

        rows.forEach(row => {
            const username = row.cells[0].textContent.toLowerCase();
            const email = row.cells[1].textContent.toLowerCase();
            const shouldShow = username.includes(lowercaseQuery) || email.includes(lowercaseQuery);
            row.style.display = shouldShow ? '' : 'none';
        });
    }

    showModal(user) {
        const modal = this.shadowRoot.querySelector('.modal');
        const backdrop = this.shadowRoot.querySelector('.backdrop');
        const form = this.shadowRoot.querySelector('#userForm');

        form.elements.balance.value = user.balance || 0;
        form.elements.rank.value = user.rank;
        form.dataset.userId = user.id;

        modal.style.display = 'block';
        backdrop.style.display = 'block';
    }

    hideModal() {
        const modal = this.shadowRoot.querySelector('.modal');
        const backdrop = this.shadowRoot.querySelector('.backdrop');
        modal.style.display = 'none';
        backdrop.style.display = 'none';
    }

    async handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const userId = form.dataset.userId;
        const updates = {
            balance: parseFloat(form.elements.balance.value),
            rank: form.elements.rank.value
        };

        try {
            await firebase.firestore().collection('users')
                .doc(userId)
                .update(updates);

            this.hideModal();
            this.loadUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            alert('حدث خطأ أثناء تحديث بيانات المستخدم');
        }
    }

    async verifyUser(userId) {
        try {
            await firebase.firestore().collection('users')
                .doc(userId)
                .update({ isVerified: true });
            this.loadUsers();
        } catch (error) {
            console.error('Error verifying user:', error);
            alert('حدث خطأ أثناء توثيق المستخدم');
        }
    }

    async deleteUser(userId) {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

        try {
            await firebase.firestore().collection('users')
                .doc(userId)
                .delete();
            this.loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('حدث خطأ أثناء حذف المستخدم');
        }
    }
}

// Register the custom element
customElements.define('admin-users', AdminUsers);