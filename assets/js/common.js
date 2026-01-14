// ==========================================
// COMMON UTILITIES - Shared across all modules
// ==========================================

// XSS Protection - Sanitize HTML
const Sanitizer = {
    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} str - The string to sanitize
     * @returns {string} - Sanitized string
     */
    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Sanitize and set text content safely
     * @param {HTMLElement} element - The element to update
     * @param {string} text - The text to set
     */
    setText(element, text) {
        if (element) {
            element.textContent = text || '';
        }
    },

    /**
     * Strip all HTML tags from string
     * @param {string} html - String with HTML
     * @returns {string} - Plain text
     */
    stripHTML(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }
};

// Toast Notification System
const Toast = {
    container: null,

    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'success', duration = 3000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = 'toast-message';
        
        const colors = {
            success: { bg: '#10b981', icon: '✓' },
            error: { bg: '#ef4444', icon: '✕' },
            warning: { bg: '#fbbf24', icon: '⚠' },
            info: { bg: '#38bdf8', icon: 'ℹ' }
        };

        const config = colors[type] || colors.info;

        toast.style.cssText = `
            background: ${config.bg};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            font-weight: 500;
            min-width: 250px;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;

        toast.innerHTML = `
            <span style="font-size: 18px;">${config.icon}</span>
            <span>${Sanitizer.escapeHTML(message)}</span>
        `;

        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); },
    info(message) { this.show(message, 'info'); }
};

// Add toast animations
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(toastStyles);

// Date Utilities
const DateUtils = {
    /**
     * Format date to YYYY-MM-DD
     */
    toISODate(date = new Date()) {
        return date.toISOString().split('T')[0];
    },

    /**
     * Format date for display
     */
    formatDisplay(dateString, options = {}) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: options.weekday || 'long',
            year: 'numeric',
            month: options.month || 'long',
            day: 'numeric',
            ...options
        });
    },

    /**
     * Get date N days ago
     */
    daysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return this.toISODate(date);
    },

    /**
     * Calculate days between two dates
     */
    daysBetween(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diff = Math.abs(d2 - d1);
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
};

// Storage Utilities with error handling
const Storage = {
    /**
     * Get item from localStorage with error handling
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Storage.get error for key "${key}":`, error);
            Toast.error('Failed to load data');
            return defaultValue;
        }
    },

    /**
     * Set item in localStorage with quota check
     */
    set(key, value) {
        try {
            const data = JSON.stringify(value);
            
            // Check size (5MB limit for most browsers)
            if (data.length > 4900000) {
                Toast.error('Data too large! Please export and archive old entries.');
                return false;
            }

            localStorage.setItem(key, data);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                Toast.error('Storage full! Please export your data.');
            } else {
                console.error(`Storage.set error for key "${key}":`, error);
                Toast.error('Failed to save data');
            }
            return false;
        }
    },

    /**
     * Remove item from localStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Storage.remove error for key "${key}":`, error);
            return false;
        }
    },

    /**
     * Check if storage is available
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }
};

// Input Validation
const Validator = {
    /**
     * Validate ritual name
     */
    ritualName(name) {
        if (!name || typeof name !== 'string') return false;
        const trimmed = name.trim();
        return trimmed.length >= 1 && trimmed.length <= 100;
    },

    /**
     * Validate ritual time
     */
    ritualTime(time) {
        const num = parseInt(time);
        return !isNaN(num) && num >= 1 && num <= 1440; // Max 24 hours
    },

    /**
     * Validate date string
     */
    date(dateStr) {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateStr)) return false;
        const date = new Date(dateStr);
        return date instanceof Date && !isNaN(date);
    },

    /**
     * Sanitize and validate text input
     */
    text(str, maxLength = 1000) {
        if (!str) return '';
        const sanitized = Sanitizer.stripHTML(str);
        return sanitized.substring(0, maxLength);
    }
};

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for ES6 modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Sanitizer, Toast, DateUtils, Storage, Validator, debounce };
}
