/**
 * 🙏 कृष्ण Mind Suite - Unified Firebase Configuration
 * 
 * This file provides a centralized Firebase configuration and utilities
 * for ALL modules in the Mind Suite platform.
 * 
 * Features:
 * - Single Firebase initialization
 * - Shared Firestore instance
 * - Auth state management
 * - User profile management
 * - Data sync utilities
 * - Offline support
 */

// Firebase configuration - SHARED ACROSS ALL MODULES
const firebaseConfig = {
    apiKey: "AIzaSyB9vdSNAUN4903GJWBJJoIIEhqSEOjajnw",
    authDomain: "my-website-11127.firebaseapp.com",
    projectId: "my-website-11127",
    storageBucket: "my-website-11127.firebasestorage.app",
    messagingSenderId: "766689827734",
    appId: "1:766689827734:web:7011801e380debecb5dbb7",
    measurementId: "G-0DEELR4DW0"
};

// ========================================
// Firebase Instance Manager
// ========================================
const FirebaseManager = {
    app: null,
    db: null,
    auth: null,
    initialized: false,
    initPromise: null,
    currentUser: null,
    authListeners: [],
    
    /**
     * Initialize Firebase (idempotent - safe to call multiple times)
     */
    async init() {
        if (this.initialized) return { app: this.app, db: this.db, auth: this.auth };
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = this._doInit();
        return this.initPromise;
    },
    
    async _doInit() {
        try {
            // Check if Firebase SDK is loaded
            if (typeof firebase === 'undefined') {
                console.warn('Firebase SDK not loaded. Running in offline mode.');
                return null;
            }
            
            // Initialize Firebase app (check if already initialized)
            if (!firebase.apps.length) {
                this.app = firebase.initializeApp(firebaseConfig);
            } else {
                this.app = firebase.apps[0];
            }
            
            // Initialize services
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            
            // Enable offline persistence
            try {
                await this.db.enablePersistence({ synchronizeTabs: true });
                console.log('🔄 Firestore offline persistence enabled');
            } catch (err) {
                if (err.code === 'failed-precondition') {
                    console.warn('Multiple tabs open, persistence only in one tab');
                } else if (err.code === 'unimplemented') {
                    console.warn('Browser does not support persistence');
                }
            }
            
            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.authListeners.forEach(listener => listener(user));
                
                if (user) {
                    console.log(`🙏 User signed in: ${user.displayName || user.email}`);
                } else {
                    console.log('👤 User signed out');
                }
            });
            
            this.initialized = true;
            console.log('🔥 Firebase initialized successfully');
            return { app: this.app, db: this.db, auth: this.auth };
            
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
            throw error;
        }
    },
    
    /**
     * Add auth state change listener
     */
    onAuthChange(callback) {
        this.authListeners.push(callback);
        // Immediately call with current state if known
        if (this.currentUser !== null || this.initialized) {
            callback(this.currentUser);
        }
        // Return unsubscribe function
        return () => {
            this.authListeners = this.authListeners.filter(cb => cb !== callback);
        };
    },
    
    /**
     * Get current user
     */
    getUser() {
        return this.currentUser;
    },
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.currentUser;
    }
};

// ========================================
// User Profile Manager
// ========================================
const UserProfile = {
    profileData: null,
    preferencesData: null,
    statsData: null,
    
    /**
     * Default profile structure
     */
    getDefaultProfile() {
        return {
            displayName: '',
            spiritualName: '',
            email: '',
            photoURL: '',
            spiritualGoal: 'beginner',
            dailyTargetMinutes: 30,
            createdAt: new Date(),
            lastLogin: new Date(),
            profileComplete: false
        };
    },
    
    /**
     * Default preferences structure
     */
    getDefaultPreferences() {
        return {
            notificationEnabled: true,
            morningReminderEnabled: true,
            morningReminderTime: '06:00',
            eveningReminderEnabled: true,
            eveningReminderTime: '18:00',
            verseOfDayEnabled: true,
            practiceReminders: true,
            theme: 'dark'
        };
    },
    
    /**
     * Default stats structure
     */
    getDefaultStats() {
        return {
            totalBhaktiPoints: 0,
            currentLevel: 1,
            currentStreak: 0,
            longestStreak: 0,
            totalPracticeMinutes: 0,
            totalSessionsCompleted: 0,
            chaptersStudied: 0,
            lastActivityDate: null
        };
    },
    
    /**
     * Load user profile from Firebase
     */
    async loadProfile() {
        const user = FirebaseManager.getUser();
        if (!user) {
            console.log('No user logged in, cannot load profile');
            return null;
        }
        
        try {
            const { db } = await FirebaseManager.init();
            const profileDoc = await db.collection('users').doc(user.uid).get();
            
            if (profileDoc.exists) {
                this.profileData = { ...this.getDefaultProfile(), ...profileDoc.data() };
            } else {
                // Create new profile for first-time user
                this.profileData = this.getDefaultProfile();
                this.profileData.email = user.email;
                this.profileData.displayName = user.displayName || '';
                this.profileData.photoURL = user.photoURL || '';
            }
            
            return this.profileData;
        } catch (error) {
            console.error('Error loading profile:', error);
            return null;
        }
    },
    
    /**
     * Save user profile to Firebase
     */
    async saveProfile(profileData) {
        const user = FirebaseManager.getUser();
        if (!user) {
            console.error('No user logged in, cannot save profile');
            return false;
        }
        
        try {
            const { db } = await FirebaseManager.init();
            await db.collection('users').doc(user.uid).set({
                ...profileData,
                lastLogin: new Date()
            }, { merge: true });
            
            this.profileData = profileData;
            console.log('✅ Profile saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving profile:', error);
            return false;
        }
    },
    
    /**
     * Load user preferences
     */
    async loadPreferences() {
        const user = FirebaseManager.getUser();
        if (!user) return this.getDefaultPreferences();
        
        try {
            const { db } = await FirebaseManager.init();
            const prefsDoc = await db.collection('users').doc(user.uid)
                                     .collection('settings').doc('preferences').get();
            
            if (prefsDoc.exists) {
                this.preferencesData = { ...this.getDefaultPreferences(), ...prefsDoc.data() };
            } else {
                this.preferencesData = this.getDefaultPreferences();
            }
            
            return this.preferencesData;
        } catch (error) {
            console.error('Error loading preferences:', error);
            return this.getDefaultPreferences();
        }
    },
    
    /**
     * Save user preferences
     */
    async savePreferences(prefsData) {
        const user = FirebaseManager.getUser();
        if (!user) return false;
        
        try {
            const { db } = await FirebaseManager.init();
            await db.collection('users').doc(user.uid)
                    .collection('settings').doc('preferences').set(prefsData);
            
            this.preferencesData = prefsData;
            console.log('✅ Preferences saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving preferences:', error);
            return false;
        }
    },
    
    /**
     * Load user stats
     */
    async loadStats() {
        const user = FirebaseManager.getUser();
        if (!user) return this.getDefaultStats();
        
        try {
            const { db } = await FirebaseManager.init();
            const statsDoc = await db.collection('users').doc(user.uid)
                                     .collection('settings').doc('stats').get();
            
            if (statsDoc.exists) {
                this.statsData = { ...this.getDefaultStats(), ...statsDoc.data() };
            } else {
                this.statsData = this.getDefaultStats();
            }
            
            return this.statsData;
        } catch (error) {
            console.error('Error loading stats:', error);
            return this.getDefaultStats();
        }
    },
    
    /**
     * Update user stats
     */
    async updateStats(updates) {
        const user = FirebaseManager.getUser();
        if (!user) return false;
        
        try {
            const { db } = await FirebaseManager.init();
            await db.collection('users').doc(user.uid)
                    .collection('settings').doc('stats').set(updates, { merge: true });
            
            this.statsData = { ...this.statsData, ...updates };
            return true;
        } catch (error) {
            console.error('Error updating stats:', error);
            return false;
        }
    },
    
    /**
     * Check if profile setup is complete
     */
    isProfileComplete() {
        // Check explicit profileComplete flag
        if (this.profileData && this.profileData.profileComplete === true) {
            return true;
        }
        
        // Also check localStorage as fallback
        const localProfile = localStorage.getItem('kc_mindsuite_profile');
        if (localProfile) {
            try {
                const profile = JSON.parse(localProfile);
                if (profile.profileComplete === true) {
                    return true;
                }
            } catch (e) {
                // ignore
            }
        }
        
        // If user has a displayName in their profile, consider it complete
        if (this.profileData && this.profileData.displayName && this.profileData.displayName.trim()) {
            return true;
        }
        
        return false;
    }
};

// ========================================
// Module Data Manager
// ========================================
const ModuleData = {
    /**
     * Get module data from Firebase
     */
    async get(moduleName, docName = 'data') {
        const user = FirebaseManager.getUser();
        if (!user) {
            console.log(`No user, returning localStorage for ${moduleName}`);
            return this.getFromLocalStorage(moduleName);
        }
        
        try {
            const { db } = await FirebaseManager.init();
            const doc = await db.collection('users').doc(user.uid)
                               .collection(moduleName).doc(docName).get();
            
            if (doc.exists) {
                return doc.data();
            }
            return null;
        } catch (error) {
            console.error(`Error loading ${moduleName} data:`, error);
            // Fallback to localStorage
            return this.getFromLocalStorage(moduleName);
        }
    },
    
    /**
     * Save module data to Firebase
     */
    async set(moduleName, data, docName = 'data') {
        const user = FirebaseManager.getUser();
        if (!user) {
            console.log(`No user, saving to localStorage for ${moduleName}`);
            return this.setToLocalStorage(moduleName, data);
        }
        
        try {
            const { db } = await FirebaseManager.init();
            await db.collection('users').doc(user.uid)
                    .collection(moduleName).doc(docName).set({
                        ...data,
                        lastUpdated: new Date()
                    }, { merge: true });
            
            // Also save to localStorage as backup
            this.setToLocalStorage(moduleName, data);
            
            return true;
        } catch (error) {
            console.error(`Error saving ${moduleName} data:`, error);
            // Fallback to localStorage
            return this.setToLocalStorage(moduleName, data);
        }
    },
    
    /**
     * Merge data (useful for partial updates)
     */
    async merge(moduleName, updates, docName = 'data') {
        const user = FirebaseManager.getUser();
        if (!user) {
            const existing = this.getFromLocalStorage(moduleName) || {};
            return this.setToLocalStorage(moduleName, { ...existing, ...updates });
        }
        
        try {
            const { db } = await FirebaseManager.init();
            await db.collection('users').doc(user.uid)
                    .collection(moduleName).doc(docName).set({
                        ...updates,
                        lastUpdated: new Date()
                    }, { merge: true });
            
            return true;
        } catch (error) {
            console.error(`Error merging ${moduleName} data:`, error);
            return false;
        }
    },
    
    /**
     * Add item to array field
     */
    async addToArray(moduleName, fieldName, item, docName = 'data') {
        const user = FirebaseManager.getUser();
        if (!user) {
            const existing = this.getFromLocalStorage(moduleName) || {};
            const arr = existing[fieldName] || [];
            arr.push({ ...item, createdAt: new Date() });
            existing[fieldName] = arr;
            return this.setToLocalStorage(moduleName, existing);
        }
        
        try {
            const { db } = await FirebaseManager.init();
            await db.collection('users').doc(user.uid)
                    .collection(moduleName).doc(docName).update({
                        [fieldName]: firebase.firestore.FieldValue.arrayUnion({
                            ...item,
                            createdAt: new Date()
                        }),
                        lastUpdated: new Date()
                    });
            
            return true;
        } catch (error) {
            console.error(`Error adding to ${moduleName}.${fieldName}:`, error);
            return false;
        }
    },
    
    /**
     * LocalStorage fallback methods
     */
    getFromLocalStorage(moduleName) {
        const key = `kc_mindsuite_${moduleName}`;
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.error(`Error reading localStorage for ${moduleName}:`, e);
            return null;
        }
    },
    
    setToLocalStorage(moduleName, data) {
        const key = `kc_mindsuite_${moduleName}`;
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error(`Error writing localStorage for ${moduleName}:`, e);
            return false;
        }
    },
    
    /**
     * Migrate data from localStorage to Firebase
     */
    async migrateFromLocalStorage(moduleName, localStorageKey) {
        const user = FirebaseManager.getUser();
        if (!user) return false;
        
        try {
            const localData = localStorage.getItem(localStorageKey);
            if (!localData) return false;
            
            const data = JSON.parse(localData);
            await this.set(moduleName, data);
            
            console.log(`✅ Migrated ${moduleName} data from localStorage to Firebase`);
            return true;
        } catch (error) {
            console.error(`Error migrating ${moduleName}:`, error);
            return false;
        }
    }
};

// ========================================
// Sync Manager (handles offline/online)
// ========================================
const SyncManager = {
    pendingSync: [],
    isOnline: navigator.onLine,
    
    init() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processPendingSync();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    },
    
    queueSync(moduleName, data) {
        this.pendingSync.push({ moduleName, data, timestamp: Date.now() });
        this.savePendingSync();
    },
    
    async processPendingSync() {
        if (!this.isOnline || this.pendingSync.length === 0) return;
        
        console.log(`📤 Processing ${this.pendingSync.length} pending sync items`);
        
        const toProcess = [...this.pendingSync];
        this.pendingSync = [];
        
        for (const item of toProcess) {
            try {
                await ModuleData.set(item.moduleName, item.data);
            } catch (error) {
                // Re-queue failed items
                this.pendingSync.push(item);
            }
        }
        
        this.savePendingSync();
    },
    
    savePendingSync() {
        localStorage.setItem('kc_pending_sync', JSON.stringify(this.pendingSync));
    },
    
    loadPendingSync() {
        try {
            const stored = localStorage.getItem('kc_pending_sync');
            this.pendingSync = stored ? JSON.parse(stored) : [];
        } catch (e) {
            this.pendingSync = [];
        }
    }
};

// ========================================
// Spiritual Level System
// ========================================
const SpiritualLevels = {
    levels: [
        { level: 1, name: 'Shravana', title: 'Seeker', minPoints: 0, color: '#6c757d' },
        { level: 2, name: 'Kirtana', title: 'Chanter', minPoints: 100, color: '#28a745' },
        { level: 3, name: 'Smarana', title: 'Rememberer', minPoints: 300, color: '#17a2b8' },
        { level: 4, name: 'Pada-sevana', title: 'Servant', minPoints: 600, color: '#007bff' },
        { level: 5, name: 'Arcana', title: 'Worshiper', minPoints: 1000, color: '#6610f2' },
        { level: 6, name: 'Vandana', title: 'Devoted', minPoints: 1500, color: '#e83e8c' },
        { level: 7, name: 'Dasya', title: 'Servitor', minPoints: 2200, color: '#fd7e14' },
        { level: 8, name: 'Sakhya', title: 'Friend', minPoints: 3000, color: '#ffc107' },
        { level: 9, name: 'Atma-nivedana', title: 'Surrendered', minPoints: 4000, color: '#F5B041' }
    ],
    
    getLevelForPoints(points) {
        let currentLevel = this.levels[0];
        for (const level of this.levels) {
            if (points >= level.minPoints) {
                currentLevel = level;
            } else {
                break;
            }
        }
        return currentLevel;
    },
    
    getNextLevel(currentLevel) {
        const idx = this.levels.findIndex(l => l.level === currentLevel);
        return idx < this.levels.length - 1 ? this.levels[idx + 1] : null;
    },
    
    getProgressToNextLevel(points) {
        const current = this.getLevelForPoints(points);
        const next = this.getNextLevel(current.level);
        
        if (!next) return { current, next: null, progress: 100, pointsNeeded: 0 };
        
        const pointsInLevel = points - current.minPoints;
        const pointsToNext = next.minPoints - current.minPoints;
        const progress = Math.min(100, Math.floor((pointsInLevel / pointsToNext) * 100));
        
        return {
            current,
            next,
            progress,
            pointsNeeded: next.minPoints - points
        };
    }
};

// ========================================
// Initialize on load
// ========================================
(function init() {
    SyncManager.init();
    SyncManager.loadPendingSync();
})();

// Export for use in modules
if (typeof window !== 'undefined') {
    window.FirebaseManager = FirebaseManager;
    window.UserProfile = UserProfile;
    window.ModuleData = ModuleData;
    window.SyncManager = SyncManager;
    window.SpiritualLevels = SpiritualLevels;
}
