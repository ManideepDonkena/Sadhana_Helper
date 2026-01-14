/**
 * Notification Center - Mind Suite
 * Centralized notification management system for all modules
 */

const NotificationCenter = (function() {
    'use strict';

    const MAX_NOTIFICATIONS = 50;
    const STORAGE_KEY = 'mindSuiteNotifications';

    let notifications = [];
    let unreadCount = 0;
    let isOpen = false;
    let bellElement = null;
    let panelElement = null;
    let badgeElement = null;

    // Notification types with icons and colors
    const NotificationTypes = {
        ACHIEVEMENT: { icon: '🏆', color: '#f59e0b', title: 'Achievement Unlocked!' },
        STREAK: { icon: '🔥', color: '#ef4444', title: 'Streak Update' },
        GOAL: { icon: '🎯', color: '#10b981', title: 'Goal Progress' },
        REMINDER: { icon: '🔔', color: '#3b82f6', title: 'Reminder' },
        LESSON: { icon: '📚', color: '#8b5cf6', title: 'New Lesson' },
        RITUAL: { icon: '🪷', color: '#f97316', title: 'Ritual Reminder' },
        LEVEL_UP: { icon: '⭐', color: '#fbbf24', title: 'Level Up!' },
        INFO: { icon: 'ℹ️', color: '#38bdf8', title: 'Information' }
    };

    /**
     * Initialize the notification center
     */
    function init() {
        loadNotifications();
        createUI();
        setupEventListeners();
        updateBadge();
    }

    /**
     * Load notifications from localStorage
     */
    function loadNotifications() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                notifications = JSON.parse(stored);
                calculateUnreadCount();
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
            notifications = [];
        }
    }

    /**
     * Save notifications to localStorage
     */
    function saveNotifications() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
        } catch (error) {
            console.error('Failed to save notifications:', error);
        }
    }

    /**
     * Calculate unread count
     */
    function calculateUnreadCount() {
        unreadCount = notifications.filter(n => !n.read).length;
    }

    /**
     * Create notification UI elements
     */
    function createUI() {
        // Check if bell already exists in the page (from HTML)
        const existingBell = document.querySelector('.nav-notification-btn');
        
        if (existingBell) {
            // Use the existing bell from the nav, don't create a new one
            bellElement = existingBell;
            
            // Add badge to existing bell if not present
            if (!bellElement.querySelector('.notification-badge')) {
                const badge = document.createElement('span');
                badge.className = 'notification-badge';
                badge.id = 'notification-badge';
                badge.style.display = 'none';
                badge.textContent = '0';
                bellElement.appendChild(badge);
            }
            badgeElement = bellElement.querySelector('.notification-badge');
        } else {
            // Create bell button only if one doesn't exist
            bellElement = document.createElement('button');
            bellElement.id = 'notification-bell';
            bellElement.className = 'notification-bell';
            bellElement.setAttribute('aria-label', 'Notifications');
            bellElement.setAttribute('title', 'View notifications');
            bellElement.innerHTML = `
                <span class="bell-icon">🔔</span>
                <span class="notification-badge" id="notification-badge" style="display: none;">0</span>
            `;
            badgeElement = bellElement.querySelector('#notification-badge');
            document.body.appendChild(bellElement);
        }

        // Create notification panel
        panelElement = document.createElement('div');
        panelElement.id = 'notification-panel';
        panelElement.className = 'notification-panel';
        panelElement.innerHTML = `
            <div class="notification-header">
                <h3>Notifications</h3>
                <div class="notification-actions">
                    <button id="mark-all-read" class="btn-text" title="Mark all as read">✓ All</button>
                    <button id="clear-all-notifications" class="btn-text" title="Clear all">🗑️</button>
                    <button id="close-notifications" class="btn-icon">✕</button>
                </div>
            </div>
            <div class="notification-list" id="notification-list">
                <div class="notification-empty">
                    <span class="empty-icon">🔕</span>
                    <p>No notifications yet</p>
                </div>
            </div>
        `;

        // Append panel to body
        document.body.appendChild(panelElement);
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Toggle panel
        bellElement.addEventListener('click', togglePanel);

        // Close panel
        document.getElementById('close-notifications').addEventListener('click', closePanel);

        // Mark all as read
        document.getElementById('mark-all-read').addEventListener('click', markAllAsRead);

        // Clear all
        document.getElementById('clear-all-notifications').addEventListener('click', clearAll);

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (isOpen && !bellElement.contains(e.target) && !panelElement.contains(e.target)) {
                closePanel();
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isOpen) {
                closePanel();
            }
        });
    }

    /**
     * Toggle notification panel
     */
    function togglePanel() {
        if (isOpen) {
            closePanel();
        } else {
            openPanel();
        }
    }

    /**
     * Open notification panel
     */
    function openPanel() {
        isOpen = true;
        panelElement.classList.add('is-open');
        bellElement.classList.add('active');
        renderNotifications();
    }

    /**
     * Close notification panel
     */
    function closePanel() {
        isOpen = false;
        panelElement.classList.remove('is-open');
        bellElement.classList.remove('active');
    }

    /**
     * Render notifications list
     */
    function renderNotifications() {
        const listElement = document.getElementById('notification-list');
        
        if (notifications.length === 0) {
            listElement.innerHTML = `
                <div class="notification-empty">
                    <span class="empty-icon">🔕</span>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        listElement.innerHTML = '';

        // Sort by timestamp (newest first)
        const sorted = [...notifications].sort((a, b) => b.timestamp - a.timestamp);

        sorted.forEach(notification => {
            const item = createNotificationElement(notification);
            listElement.appendChild(item);
        });
    }

    /**
     * Create notification DOM element
     */
    function createNotificationElement(notification) {
        const type = NotificationTypes[notification.type] || NotificationTypes.INFO;
        const div = document.createElement('div');
        div.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
        div.dataset.id = notification.id;

        const timeAgo = getTimeAgo(notification.timestamp);

        div.innerHTML = `
            <div class="notification-icon" style="background-color: ${type.color}">
                ${type.icon}
            </div>
            <div class="notification-content">
                <div class="notification-title">${Sanitizer.escapeHTML(notification.title || type.title)}</div>
                <div class="notification-message">${Sanitizer.escapeHTML(notification.message)}</div>
                <div class="notification-time">${timeAgo}</div>
            </div>
            <button class="notification-dismiss" data-id="${notification.id}" title="Dismiss">✕</button>
        `;

        // Mark as read on click
        div.addEventListener('click', (e) => {
            if (!e.target.classList.contains('notification-dismiss')) {
                markAsRead(notification.id);
                if (notification.action) {
                    notification.action();
                }
            }
        });

        // Dismiss button
        div.querySelector('.notification-dismiss').addEventListener('click', (e) => {
            e.stopPropagation();
            removeNotification(notification.id);
        });

        return div;
    }

    /**
     * Add a new notification
     */
    function add(options) {
        const notification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: options.type || 'INFO',
            title: options.title || '',
            message: options.message || '',
            timestamp: Date.now(),
            read: false,
            action: options.action || null
        };

        notifications.unshift(notification);

        // Limit notifications
        if (notifications.length > MAX_NOTIFICATIONS) {
            notifications = notifications.slice(0, MAX_NOTIFICATIONS);
        }

        calculateUnreadCount();
        saveNotifications();
        updateBadge();

        // Show toast
        if (typeof Toast !== 'undefined') {
            Toast.show(notification.message, 'info', 3000);
        }

        // Auto-open panel if it's important
        if (['ACHIEVEMENT', 'LEVEL_UP', 'STREAK'].includes(notification.type)) {
            setTimeout(() => {
                if (!isOpen) openPanel();
            }, 500);
        }

        return notification.id;
    }

    /**
     * Mark notification as read
     */
    function markAsRead(id) {
        const notification = notifications.find(n => n.id === id);
        if (notification && !notification.read) {
            notification.read = true;
            calculateUnreadCount();
            saveNotifications();
            updateBadge();

            // Update UI
            const element = document.querySelector(`[data-id="${id}"]`);
            if (element) {
                element.classList.remove('unread');
                element.classList.add('read');
            }
        }
    }

    /**
     * Mark all as read
     */
    function markAllAsRead() {
        notifications.forEach(n => n.read = true);
        unreadCount = 0;
        saveNotifications();
        updateBadge();
        renderNotifications();
    }

    /**
     * Remove notification
     */
    function removeNotification(id) {
        notifications = notifications.filter(n => n.id !== id);
        calculateUnreadCount();
        saveNotifications();
        updateBadge();
        renderNotifications();
    }

    /**
     * Clear all notifications
     */
    function clearAll() {
        if (confirm('Are you sure you want to clear all notifications?')) {
            notifications = [];
            unreadCount = 0;
            saveNotifications();
            updateBadge();
            renderNotifications();
        }
    }

    /**
     * Update badge count
     */
    function updateBadge() {
        if (badgeElement) {
            if (unreadCount > 0) {
                badgeElement.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badgeElement.style.display = 'flex';
                bellElement.classList.add('has-unread');
            } else {
                badgeElement.style.display = 'none';
                bellElement.classList.remove('has-unread');
            }
        }
    }

    /**
     * Get time ago string
     */
    function getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        
        return new Date(timestamp).toLocaleDateString();
    }

    /**
     * Public API
     */
    return {
        init,
        add,
        markAsRead,
        markAllAsRead,
        clearAll,
        toggle: togglePanel,
        open: openPanel,
        close: closePanel,
        getUnreadCount: () => unreadCount,
        getAll: () => [...notifications],
        types: NotificationTypes
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NotificationCenter.init());
} else {
    NotificationCenter.init();
}
