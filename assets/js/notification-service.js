/**
 * 🙏 कृष्ण Mind Suite - Notification Service
 * 
 * Handles Krishna-conscious notifications:
 * - Morning sadhana reminders
 * - Evening reflections
 * - Verse of the day
 * - Practice reminders
 * - Random activity nudges (sadhana, pomodoro, mindstate, gita)
 * - Achievement notifications
 */

const NotificationService = {
    timers: [],
    randomTimers: [],
    hasPermission: false,
    lastRandomNotification: 0,
    minRandomInterval: 30 * 60 * 1000, // 30 minutes minimum between random notifications
    
    // Random nudge messages for different activities
    NUDGE_MESSAGES: {
        sadhana: [
            { title: '🪷 Sadhana Reminder', message: 'Have you logged your spiritual practice today?', action: { label: 'Log Sadhana →', href: 'modules/sadhana/index.html' } },
            { title: '📿 Time for Chanting?', message: 'A few rounds of japa can transform your day.', action: { label: 'Start Now →', href: 'modules/sadhana/index.html' } },
            { title: '🌸 Krishna is Waiting', message: 'Offer something to Krishna today - reading, chanting, or service.', action: { label: 'Open Sadhana →', href: 'modules/sadhana/index.html' } },
            { title: '🙏 Spiritual Check-in', message: 'How is your devotional practice going today?', action: { label: 'Track Progress →', href: 'modules/sadhana/index.html' } },
        ],
        pomodoro: [
            { title: '🍅 Focus Time?', message: 'Ready for a focused work session with Krishna\'s blessings?', action: { label: 'Start Pomodoro →', href: 'modules/workspace/workspace.html' } },
            { title: '⏱️ Deep Work Session', message: 'Dedicate 25 minutes of focused work as service.', action: { label: 'Open Workspace →', href: 'modules/workspace/workspace.html' } },
            { title: '🎯 Time to Focus', message: 'Work offered to Krishna becomes yoga. Start a focus session!', action: { label: 'Begin Session →', href: 'modules/workspace/workspace.html' } },
        ],
        mindstate: [
            { title: '🧠 Mind Check', message: 'Take a quick cognitive test to understand your mental state.', action: { label: 'Open Lab →', href: 'modules/lab/index.html' } },
            { title: '🧪 Test Your Mind', message: 'A clear mind serves Krishna better. Check your focus levels!', action: { label: 'Start Test →', href: 'modules/lab/index.html' } },
            { title: '🔬 Mind Lab Awaits', message: 'Curious about your attention span today? Let\'s find out!', action: { label: 'Take Test →', href: 'modules/lab/index.html' } },
        ],
        gita: [
            { title: '📚 Gita Wisdom', message: 'Continue your Bhakti Shastri studies today.', action: { label: 'Resume Study →', href: 'modules/gita/index.html' } },
            { title: '📖 Learn from Krishna', message: 'A few minutes with the Gita can change your perspective.', action: { label: 'Open Course →', href: 'modules/gita/index.html' } },
            { title: '🎧 Listen & Learn', message: 'Continue your Bhagavad Gita audio course.', action: { label: 'Continue →', href: 'modules/gita/index.html' } },
        ],
        general: [
            { title: '🙏 Hare Krishna!', message: 'Remember Krishna in all your activities today.' },
            { title: '🌺 Devotion Reminder', message: 'Even a moment of remembrance pleases the Lord.' },
            { title: '✨ Spiritual Thought', message: 'You are not this body. You are eternal spirit soul.' },
        ]
    },
    
    /**
     * Initialize notification service
     */
    init() {
        this.checkPermission();
        this.loadScheduledNotifications();
        this.startRandomNudges();
    },
    
    /**
     * Check and request notification permission
     */
    async checkPermission() {
        if (!('Notification' in window)) {
            console.log('Browser does not support notifications');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            this.hasPermission = true;
            return true;
        }
        
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.hasPermission = permission === 'granted';
            return this.hasPermission;
        }
        
        return false;
    },
    
    /**
     * Request notification permission (user initiated)
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            this.showInAppNotification({
                type: 'warning',
                title: 'Notifications Not Supported',
                message: 'Your browser does not support notifications.'
            });
            return false;
        }
        
        try {
            const permission = await Notification.requestPermission();
            this.hasPermission = permission === 'granted';
            
            if (this.hasPermission) {
                this.showInAppNotification({
                    type: 'success',
                    title: '🙏 Notifications Enabled',
                    message: 'You will now receive Krishna-conscious reminders!'
                });
            }
            
            return this.hasPermission;
        } catch (error) {
            console.error('Failed to request notification permission:', error);
            return false;
        }
    },
    
    /**
     * Schedule notifications based on user preferences
     */
    scheduleNotifications(preferences) {
        // Clear existing timers
        this.clearAllTimers();
        
        if (!preferences) return;
        
        const now = new Date();
        const today = now.toDateString();
        
        // Morning Reminder
        if (preferences.morningReminderEnabled && preferences.morningReminderTime) {
            this.scheduleDailyNotification(
                preferences.morningReminderTime,
                'MORNING_SADHANA',
                () => this.sendMorningNotification()
            );
        }
        
        // Evening Reminder
        if (preferences.eveningReminderEnabled && preferences.eveningReminderTime) {
            this.scheduleDailyNotification(
                preferences.eveningReminderTime,
                'EVENING_REFLECTION',
                () => this.sendEveningNotification()
            );
        }
        
        // Verse of the Day (at 8 AM by default if enabled)
        if (preferences.verseOfDayEnabled) {
            this.scheduleDailyNotification(
                '08:00',
                'VERSE_OF_DAY',
                () => this.sendVerseNotification()
            );
        }
        
        // Practice Reminders (every 3 hours between 9 AM - 9 PM)
        if (preferences.practiceReminders) {
            ['09:00', '12:00', '15:00', '18:00', '21:00'].forEach((time, i) => {
                this.scheduleDailyNotification(
                    time,
                    `PRACTICE_${i}`,
                    () => this.sendPracticeReminder()
                );
            });
        }
        
        console.log('🔔 Notifications scheduled based on preferences');
    },
    
    /**
     * Start random activity nudges
     */
    startRandomNudges() {
        // Clear existing random timers
        this.randomTimers.forEach(id => clearTimeout(id));
        this.randomTimers = [];
        
        // Get user preferences
        const prefsStr = localStorage.getItem('kc_mindsuite_preferences');
        const prefs = prefsStr ? JSON.parse(prefsStr) : { practiceReminders: true };
        
        if (!prefs.practiceReminders) return;
        
        // Schedule random nudges throughout active hours (8 AM - 10 PM)
        this.scheduleNextRandomNudge();
    },
    
    /**
     * Schedule the next random nudge
     */
    scheduleNextRandomNudge() {
        const now = new Date();
        const hour = now.getHours();
        
        // Only send nudges between 8 AM and 10 PM
        if (hour < 8 || hour >= 22) {
            // Schedule for next day at 8 AM
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(8, 0, 0, 0);
            const delay = tomorrow.getTime() - now.getTime();
            
            const timerId = setTimeout(() => this.scheduleNextRandomNudge(), delay);
            this.randomTimers.push(timerId);
            return;
        }
        
        // Random interval between 45 minutes and 3 hours
        const minInterval = 45 * 60 * 1000; // 45 minutes
        const maxInterval = 3 * 60 * 60 * 1000; // 3 hours
        const randomDelay = Math.floor(Math.random() * (maxInterval - minInterval)) + minInterval;
        
        const timerId = setTimeout(() => {
            this.sendRandomNudge();
            this.scheduleNextRandomNudge();
        }, randomDelay);
        
        this.randomTimers.push(timerId);
    },
    
    /**
     * Send a random activity nudge
     */
    sendRandomNudge() {
        const now = Date.now();
        
        // Don't send if too recent
        if (now - this.lastRandomNotification < this.minRandomInterval) {
            return;
        }
        
        // Check if page is visible - only send if user is active
        if (document.hidden) {
            return;
        }
        
        this.lastRandomNotification = now;
        
        // Choose a random activity category
        const categories = ['sadhana', 'pomodoro', 'mindstate', 'gita', 'general'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const messages = this.NUDGE_MESSAGES[category];
        const nudge = messages[Math.floor(Math.random() * messages.length)];
        
        // Add a verse if available
        let subtitle = null;
        if (typeof getRandomVerse === 'function') {
            const verse = getRandomVerse('encouragement');
            if (verse) {
                subtitle = `"${verse.text.substring(0, 80)}${verse.text.length > 80 ? '...' : ''}" — ${verse.ref}`;
            }
        }
        
        this.showInAppNotification({
            type: 'reminder',
            title: nudge.title,
            message: nudge.message,
            subtitle: subtitle,
            action: nudge.action
        });
    },
    
    /**
     * Send nudge for a specific activity (can be called from other modules)
     */
    sendActivityNudge(activity) {
        const messages = this.NUDGE_MESSAGES[activity] || this.NUDGE_MESSAGES.general;
        const nudge = messages[Math.floor(Math.random() * messages.length)];
        
        this.showInAppNotification({
            type: 'reminder',
            title: nudge.title,
            message: nudge.message,
            action: nudge.action
        });
    },
    
    /**
     * Schedule a daily notification at specified time
     */
    scheduleDailyNotification(timeStr, id, callback) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const now = new Date();
        let scheduledTime = new Date();
        
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // If time already passed today, schedule for tomorrow
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        const delay = scheduledTime.getTime() - now.getTime();
        
        const timerId = setTimeout(() => {
            callback();
            // Reschedule for next day
            this.scheduleDailyNotification(timeStr, id, callback);
        }, delay);
        
        this.timers.push({ id, timerId });
    },
    
    /**
     * Clear all scheduled timers
     */
    clearAllTimers() {
        this.timers.forEach(timer => clearTimeout(timer.timerId));
        this.timers = [];
    },
    
    /**
     * Load and apply scheduled notifications from user preferences
     */
    async loadScheduledNotifications() {
        if (typeof UserProfile !== 'undefined') {
            const prefs = await UserProfile.loadPreferences();
            if (prefs) {
                this.scheduleNotifications(prefs);
            }
        }
    },
    
    // ========================================
    // NOTIFICATION SENDERS
    // ========================================
    
    /**
     * Send morning sadhana reminder
     */
    sendMorningNotification() {
        const verse = typeof getMorningVerse === 'function' ? getMorningVerse() : null;
        
        this.sendBrowserNotification({
            title: '🌅 Hare Krishna! Time for Sadhana',
            body: verse ? `"${verse.text}" - ${verse.ref}` : 'Begin your day with Krishna consciousness.',
            icon: '🙏',
            tag: 'morning-sadhana'
        });
        
        this.showInAppNotification({
            type: 'reminder',
            title: '🌅 Morning Sadhana Time',
            message: verse ? verse.text : 'Rise and shine for Krishna!',
            action: {
                label: 'Start Sadhana →',
                href: 'modules/sadhana/index.html'
            }
        });
    },
    
    /**
     * Send evening reflection reminder
     */
    sendEveningNotification() {
        const verse = typeof getEveningVerse === 'function' ? getEveningVerse() : null;
        
        this.sendBrowserNotification({
            title: '🌙 Evening Reflection',
            body: verse ? `"${verse.text}" - ${verse.ref}` : 'Reflect on your day\'s devotion.',
            icon: '🙏',
            tag: 'evening-reflection'
        });
        
        this.showInAppNotification({
            type: 'reminder',
            title: '🌙 Evening Reflection',
            message: 'Take a moment to reflect on today\'s spiritual progress.',
            action: {
                label: 'Review Day →',
                href: 'modules/sadhana/index.html'
            }
        });
    },
    
    /**
     * Send verse of the day
     */
    sendVerseNotification() {
        const verse = typeof getDailyVerse === 'function' ? getDailyVerse() : null;
        if (!verse) return;
        
        this.sendBrowserNotification({
            title: '📖 Today\'s Gita Wisdom',
            body: `"${verse.text}" - ${verse.ref}`,
            icon: '📿',
            tag: 'verse-of-day'
        });
        
        this.showInAppNotification({
            type: 'verse',
            title: '📖 Verse of the Day',
            message: verse.text,
            subtitle: verse.ref
        });
    },
    
    /**
     * Send practice reminder with random encouraging verse
     */
    sendPracticeReminder() {
        const verse = typeof getRandomVerse === 'function' 
            ? getRandomVerse('encouragement') 
            : null;
        
        const messages = [
            'Take a moment to chant and connect with Krishna.',
            'A few minutes of reading can transform your day.',
            'Remember Krishna in your activities.',
            'Pause and offer your work to the Lord.',
            'Krishna is always with you. Feel His presence.'
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        this.showInAppNotification({
            type: 'reminder',
            title: '🙏 Quick Devotion',
            message: verse ? `"${verse.text}"` : message,
            subtitle: verse ? verse.ref : null
        });
    },
    
    /**
     * Send streak milestone notification
     */
    sendStreakNotification(days) {
        const verse = typeof getStreakVerse === 'function' ? getStreakVerse(days) : null;
        
        let title, message;
        if (days === 7) {
            title = '🔥 One Week Streak!';
            message = 'Wonderful! You\'ve been consistent for 7 days!';
        } else if (days === 30) {
            title = '🌟 One Month Streak!';
            message = 'Amazing dedication! 30 days of spiritual practice!';
        } else if (days === 100) {
            title = '💎 Century Milestone!';
            message = '100 days! Your tapasya is inspiring!';
        } else {
            title = `🔥 ${days} Day Streak!`;
            message = 'Keep the flame of devotion burning!';
        }
        
        this.sendBrowserNotification({
            title: title,
            body: verse ? `"${verse.text}"` : message,
            icon: '🔥',
            tag: 'streak-milestone'
        });
        
        this.showInAppNotification({
            type: 'achievement',
            title: title,
            message: verse ? verse.text : message,
            subtitle: verse ? verse.ref : null
        });
    },
    
    /**
     * Send level up notification
     */
    sendLevelUpNotification(level) {
        this.sendBrowserNotification({
            title: '📿 Level Up!',
            body: `Congratulations! You've reached ${level.name} (${level.title})!`,
            icon: '🎉',
            tag: 'level-up'
        });
        
        this.showInAppNotification({
            type: 'achievement',
            title: `📿 ${level.name}!`,
            message: `You've advanced to ${level.title}. Keep growing in devotion!`
        });
    },
    
    /**
     * Send achievement notification
     */
    sendAchievementNotification(achievement) {
        const verse = typeof getAchievementVerse === 'function' ? getAchievementVerse() : null;
        
        this.sendBrowserNotification({
            title: `🏆 ${achievement.title}`,
            body: achievement.description,
            icon: achievement.icon || '🏆',
            tag: 'achievement'
        });
        
        this.showInAppNotification({
            type: 'achievement',
            title: `🏆 ${achievement.title}`,
            message: achievement.description,
            subtitle: verse ? `"${verse.text}" - ${verse.ref}` : null
        });
    },
    
    // ========================================
    // NOTIFICATION DELIVERY
    // ========================================
    
    /**
     * Send browser notification (if permitted)
     */
    sendBrowserNotification(options) {
        if (!this.hasPermission) return;
        
        try {
            const notification = new Notification(options.title, {
                body: options.body,
                icon: options.icon ? `/assets/images/${options.icon}.png` : '/assets/images/favicon.png',
                badge: '/assets/images/badge.png',
                tag: options.tag,
                requireInteraction: false,
                silent: false
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            // Auto close after 10 seconds
            setTimeout(() => notification.close(), 10000);
            
        } catch (error) {
            console.error('Failed to send browser notification:', error);
        }
    },
    
    /**
     * Show in-app notification (floating toast)
     */
    showInAppNotification(options) {
        // Use NotificationCenter if available
        if (typeof NotificationCenter !== 'undefined') {
            NotificationCenter.add({
                type: options.type === 'achievement' ? 'SUCCESS' : 
                      options.type === 'reminder' ? 'INFO' :
                      options.type === 'verse' ? 'INFO' : 'INFO',
                title: options.title,
                message: options.message,
                subtitle: options.subtitle
            });
            return;
        }
        
        // Fallback to custom toast
        const toast = document.createElement('div');
        toast.className = 'kc-notification-toast';
        toast.innerHTML = `
            <div class="kc-toast-content">
                <div class="kc-toast-title">${options.title}</div>
                <div class="kc-toast-message">${options.message}</div>
                ${options.subtitle ? `<div class="kc-toast-subtitle">${options.subtitle}</div>` : ''}
                ${options.action ? `<a href="${options.action.href}" class="kc-toast-action">${options.action.label}</a>` : ''}
            </div>
            <button class="kc-toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('kc-toast-visible');
        });
        
        // Auto dismiss after 8 seconds
        setTimeout(() => {
            toast.classList.remove('kc-toast-visible');
            setTimeout(() => toast.remove(), 300);
        }, 8000);
    }
};

// Add toast styles dynamically (scoped name to avoid conflicts)
const kcNotificationToastStyles = document.createElement('style');
kcNotificationToastStyles.textContent = `
    .kc-notification-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(22, 33, 62, 0.95));
        border: 1px solid rgba(245, 176, 65, 0.3);
        border-radius: 15px;
        padding: 20px;
        max-width: 350px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 10000;
        backdrop-filter: blur(10px);
    }
    
    .kc-notification-toast.kc-toast-visible {
        transform: translateX(0);
        opacity: 1;
    }
    
    .kc-toast-content {
        padding-right: 30px;
    }
    
    .kc-toast-title {
        font-weight: 700;
        color: #F5B041;
        margin-bottom: 8px;
        font-size: 1rem;
    }
    
    .kc-toast-message {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.9rem;
        line-height: 1.5;
    }
    
    .kc-toast-subtitle {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.8rem;
        margin-top: 5px;
        font-style: italic;
    }
    
    .kc-toast-action {
        display: inline-block;
        margin-top: 12px;
        padding: 8px 16px;
        background: linear-gradient(135deg, #F5B041, #FF7F00);
        color: #1a1a2e;
        text-decoration: none;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        transition: all 0.2s;
    }
    
    .kc-toast-action:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(245, 176, 65, 0.3);
    }
    
    .kc-toast-close {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 1.2rem;
        cursor: pointer;
        padding: 5px;
        line-height: 1;
        transition: color 0.2s;
    }
    
    .kc-toast-close:hover {
        color: white;
    }
`;
document.head.appendChild(kcNotificationToastStyles);

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    NotificationService.init();
});

// Export for external use
if (typeof window !== 'undefined') {
    window.NotificationService = NotificationService;
}
