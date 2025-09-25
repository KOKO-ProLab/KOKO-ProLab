// Role-based Access Control and Security Utilities
class SecurityManager {
    static async checkUserRole(uid) {
        if (!uid) return null;

        try {
            const userDoc = await firebase.firestore().collection('users')
                .doc(uid)
                .get();

            if (!userDoc.exists) return null;
            return userDoc.data().role;
        } catch (error) {
            console.error('Error checking user role:', error);
            return null;
        }
    }

    static async requireAuth() {
        return new Promise((resolve, reject) => {
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    resolve(user);
                } else {
                    window.location.href = '/index.html';
                    reject(new Error('Authentication required'));
                }
            });
        });
    }

    static async requireAdmin() {
        try {
            const user = await this.requireAuth();
            const role = await this.checkUserRole(user.uid);

            if (role !== 'admin') {
                window.location.href = '/index.html';
                throw new Error('Admin access required');
            }

            return user;
        } catch (error) {
            console.error('Error checking admin access:', error);
            throw error;
        }
    }

    static setupAuthStateListener() {
        firebase.auth().onAuthStateChanged(async user => {
            if (user) {
                // User is signed in
                const role = await this.checkUserRole(user.uid);
                document.body.setAttribute('data-user-role', role || 'user');
                
                // Update UI based on role
                this.updateUIForRole(role);

                // Set up real-time user data listener
                this.setupUserDataListener(user.uid);
            } else {
                // User is signed out
                document.body.removeAttribute('data-user-role');
                this.updateUIForRole(null);
            }
        });
    }

    static setupUserDataListener(uid) {
        return firebase.firestore().collection('users')
            .doc(uid)
            .onSnapshot(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    // Update UI with user data
                    this.updateUserData(userData);
                }
            }, error => {
                console.error('Error in user data listener:', error);
            });
    }

    static updateUIForRole(role) {
        // Hide/show elements based on user role
        const adminElements = document.querySelectorAll('[data-admin-only]');
        const userElements = document.querySelectorAll('[data-user-only]');
        const authElements = document.querySelectorAll('[data-auth-only]');

        adminElements.forEach(el => {
            el.style.display = role === 'admin' ? '' : 'none';
        });

        userElements.forEach(el => {
            el.style.display = role ? '' : 'none';
        });

        authElements.forEach(el => {
            el.style.display = role ? '' : 'none';
        });
    }

    static updateUserData(userData) {
        // Update UI elements with user data
        const balanceElements = document.querySelectorAll('[data-user-balance]');
        const rankElements = document.querySelectorAll('[data-user-rank]');
        const nameElements = document.querySelectorAll('[data-user-name]');

        balanceElements.forEach(el => {
            el.textContent = `$${userData.balance || 0}`;
        });

        rankElements.forEach(el => {
            el.textContent = userData.rank || 'مبتدئ';
        });

        nameElements.forEach(el => {
            el.textContent = userData.displayName || userData.username;
        });
    }

    static async protectRoute(requiredRole = null) {
        try {
            const user = await this.requireAuth();
            if (requiredRole) {
                const role = await this.checkUserRole(user.uid);
                if (role !== requiredRole) {
                    window.location.href = '/index.html';
                    throw new Error(`${requiredRole} role required`);
                }
            }
            return user;
        } catch (error) {
            console.error('Error protecting route:', error);
            throw error;
        }
    }

    // Validate user input to prevent XSS
    static sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    // Rate limiting for API calls
    static rateLimiter = {
        limits: {},
        async checkLimit(userId, action, limit = 10, timeWindow = 60000) {
            const key = `${userId}-${action}`;
            const now = Date.now();

            if (!this.limits[key]) {
                this.limits[key] = {
                    count: 0,
                    timestamp: now
                };
            }

            // Reset counter if time window has passed
            if (now - this.limits[key].timestamp > timeWindow) {
                this.limits[key] = {
                    count: 0,
                    timestamp: now
                };
            }

            // Check if limit is exceeded
            if (this.limits[key].count >= limit) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }

            // Increment counter
            this.limits[key].count++;
            return true;
        }
    };

    // Validate and process file uploads
    static async validateFileUpload(file, allowedTypes = ['image/jpeg', 'image/png'], maxSize = 5 * 1024 * 1024) {
        if (!allowedTypes.includes(file.type)) {
            throw new Error('نوع الملف غير مسموح به');
        }

        if (file.size > maxSize) {
            throw new Error('حجم الملف كبير جداً');
        }

        return true;
    }
}

// Export the SecurityManager class
window.SecurityManager = SecurityManager;

// Initialize security features
document.addEventListener('DOMContentLoaded', () => {
    SecurityManager.setupAuthStateListener();
});