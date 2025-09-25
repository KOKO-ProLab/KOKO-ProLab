// Live Chat Component
class LiveChat extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.unsubscribe = null;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    z-index: 1000;
                }

                .chat-button {
                    background: var(--primary-color, #4a90e2);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 60px;
                    height: 60px;
                    font-size: 24px;
                    cursor: pointer;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    transition: transform 0.3s, box-shadow 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .chat-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
                }

                .chat-window {
                    display: none;
                    position: fixed;
                    bottom: 90px;
                    left: 20px;
                    width: 300px;
                    height: 400px;
                    background: var(--bg-color, white);
                    border-radius: 15px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                    overflow: hidden;
                }

                .chat-header {
                    background: var(--primary-color, #4a90e2);
                    color: white;
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .close-chat {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                }

                .chat-messages {
                    height: 300px;
                    overflow-y: auto;
                    padding: 15px;
                }

                .message {
                    margin-bottom: 10px;
                    padding: 8px 12px;
                    border-radius: 15px;
                    max-width: 80%;
                    word-wrap: break-word;
                }

                .message.user {
                    background: var(--primary-color, #4a90e2);
                    color: white;
                    margin-left: auto;
                }

                .message.support {
                    background: rgba(0, 0, 0, 0.1);
                    margin-right: auto;
                }

                .chat-input {
                    display: flex;
                    padding: 10px;
                    border-top: 1px solid rgba(0, 0, 0, 0.1);
                }

                input {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 20px;
                    margin-right: 10px;
                }

                .send-button {
                    background: var(--primary-color, #4a90e2);
                    color: white;
                    border: none;
                    border-radius: 20px;
                    padding: 8px 15px;
                    cursor: pointer;
                }

                .unread-badge {
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: red;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    display: none;
                }
            </style>

            <button class="chat-button">
                💬
                <span class="unread-badge">0</span>
            </button>

            <div class="chat-window">
                <div class="chat-header">
                    <span>الدعم الفني</span>
                    <button class="close-chat">&times;</button>
                </div>
                <div class="chat-messages"></div>
                <div class="chat-input">
                    <input type="text" placeholder="اكتب رسالتك هنا...">
                    <button class="send-button">إرسال</button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        const chatButton = this.shadowRoot.querySelector('.chat-button');
        const chatWindow = this.shadowRoot.querySelector('.chat-window');
        const closeButton = this.shadowRoot.querySelector('.close-chat');
        const sendButton = this.shadowRoot.querySelector('.send-button');
        const input = this.shadowRoot.querySelector('input');
        const unreadBadge = this.shadowRoot.querySelector('.unread-badge');

        chatButton.addEventListener('click', () => {
            chatWindow.style.display = 'block';
            unreadBadge.style.display = 'none';
            unreadBadge.textContent = '0';
            this.markMessagesAsRead();
        });

        closeButton.addEventListener('click', () => {
            chatWindow.style.display = 'none';
        });

        sendButton.addEventListener('click', () => this.sendMessage());

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Subscribe to messages
        this.subscribeToMessages();
    }

    async sendMessage() {
        const input = this.shadowRoot.querySelector('input');
        const message = input.value.trim();

        if (!message) return;

        const user = firebase.auth().currentUser;
        if (!user) {
            alert('الرجاء تسجيل الدخول أولاً');
            return;
        }

        try {
            await firebase.firestore().collection('chats').add({
                userId: user.uid,
                message: message,
                sender: 'user',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                read: false
            });

            input.value = '';

        } catch (error) {
            console.error('Error sending message:', error);
            alert('حدث خطأ أثناء إرسال الرسالة');
        }
    }

    subscribeToMessages() {
        const user = firebase.auth().currentUser;
        if (!user) return;

        this.unsubscribe = firebase.firestore()
            .collection('chats')
            .where('userId', '==', user.uid)
            .orderBy('timestamp', 'asc')
            .onSnapshot((snapshot) => {
                let unreadCount = 0;
                
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        this.addMessageToUI(change.doc.data());
                        if (change.doc.data().sender === 'support' && !change.doc.data().read) {
                            unreadCount++;
                        }
                    }
                });

                if (unreadCount > 0) {
                    const unreadBadge = this.shadowRoot.querySelector('.unread-badge');
                    unreadBadge.style.display = 'flex';
                    unreadBadge.textContent = unreadCount;
                }
            });
    }

    addMessageToUI(messageData) {
        const messagesContainer = this.shadowRoot.querySelector('.chat-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${messageData.sender}`;
        messageElement.textContent = messageData.message;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async markMessagesAsRead() {
        const user = firebase.auth().currentUser;
        if (!user) return;

        const unreadMessages = await firebase.firestore()
            .collection('chats')
            .where('userId', '==', user.uid)
            .where('sender', '==', 'support')
            .where('read', '==', false)
            .get();

        const batch = firebase.firestore().batch();
        unreadMessages.forEach((doc) => {
            batch.update(doc.ref, { read: true });
        });

        await batch.commit();
    }
}

// Register the custom element
customElements.define('live-chat', LiveChat);