// Theme Management
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
body.setAttribute('data-theme', savedTheme);
updateThemeIcon();

themeToggle.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
});

function updateThemeIcon() {
    const icon = themeToggle.querySelector('i');
    const isDark = body.getAttribute('data-theme') === 'dark';
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

// Navigation Management
function loadPage(pageName) {
    const mainContent = document.getElementById('mainContent');
    fetch(`pages/${pageName}.html`)
        .then(response => response.text())
        .then(html => {
            mainContent.innerHTML = html;
            mainContent.classList.add('fade-in');
        })
        .catch(error => {
            console.error('Error loading page:', error);
            mainContent.innerHTML = '<p>Error loading page content.</p>';
        });
}

// Notification System
let notifications = [];

function addNotification(title, message) {
    const notification = {
        id: Date.now(),
        title,
        message,
        read: false
    };
    
    notifications.unshift(notification);
    updateNotificationBadge();
}

function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationCount');
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'inline' : 'none';
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Load home page by default
    loadPage('home');
    
    // Set up navigation listeners
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            loadPage(link.dataset.page);
        });
    });
});