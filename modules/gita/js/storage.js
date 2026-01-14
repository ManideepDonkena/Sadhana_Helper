/**
 * LocalStorage wrapper with Firebase sync support.
 * Works offline with localStorage, syncs to Firebase when user is authenticated.
 * Now integrates with global FirebaseManager for consistent auth handling.
 */

const MODULE_NAME = 'gita';

// Firebase Manager for Gita module - uses global FirebaseManager when available
class GitaFirebaseManager {
    constructor() {
        this.initialized = false;
        this.user = null;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Use global FirebaseManager if available
            if (typeof FirebaseManager !== 'undefined') {
                await FirebaseManager.init();
                this.user = FirebaseManager.getUser();
                
                // Listen for auth changes via FirebaseManager
                FirebaseManager.onAuthChange((user) => {
                    this.user = user;
                    if (user) {
                        this.migrateLocalToFirebase();
                        this.loadFromFirebase();
                    }
                });
                
                this.initialized = true;
                
                // Load from Firebase if already logged in
                if (this.user) {
                    await this.loadFromFirebase();
                }
                return;
            }
            
            // Fallback: Check if Firebase is loaded directly
            if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                firebase.auth().onAuthStateChanged((user) => {
                    this.user = user;
                    if (user) {
                        this.migrateLocalToFirebase();
                        this.loadFromFirebase();
                    }
                });
                this.initialized = true;
            } else {
                console.warn('FirebaseManager not available, using localStorage only');
            }
        } catch (error) {
            console.warn('Firebase init failed, using localStorage only:', error);
        }
    }

    isLoggedIn() {
        // Check global FirebaseManager first
        if (typeof FirebaseManager !== 'undefined') {
            return !!FirebaseManager.getUser();
        }
        return !!this.user;
    }

    getUser() {
        if (typeof FirebaseManager !== 'undefined') {
            return FirebaseManager.getUser();
        }
        return this.user;
    }

    async getModuleData() {
        // Use global ModuleData if available
        if (typeof ModuleData !== 'undefined') {
            return await ModuleData.get(MODULE_NAME);
        }
        
        // Fallback to direct Firebase access
        if (!this.isLoggedIn()) return null;
        
        try {
            const user = this.getUser();
            const doc = await firebase.firestore()
                .collection('users')
                .doc(user.uid)
                .collection('modules')
                .doc(MODULE_NAME)
                .get();
            
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.warn('Failed to get Firebase data:', error);
            return null;
        }
    }

    async setModuleData(data) {
        // Use global ModuleData if available
        if (typeof ModuleData !== 'undefined') {
            return await ModuleData.set(MODULE_NAME, data);
        }
        
        // Fallback to direct Firebase access
        if (!this.isLoggedIn()) return false;
        
        try {
            const user = this.getUser();
            await firebase.firestore()
                .collection('users')
                .doc(user.uid)
                .collection('modules')
                .doc(MODULE_NAME)
                .set(data, { merge: true });
            
            return true;
        } catch (error) {
            console.warn('Failed to save to Firebase:', error);
            return false;
        }
    }

    async loadFromFirebase() {
        if (!this.isLoggedIn()) return;
        
        const data = await this.getModuleData();
        if (!data) return;
        
        // Merge Firebase data with local storage
        if (data.favorites) localStorage.setItem('bg_audio_favorites', JSON.stringify(data.favorites));
        if (data.customStarts) localStorage.setItem('bg_audio_custom_starts', JSON.stringify(data.customStarts));
        if (data.markers) localStorage.setItem('bg_audio_markers_v1', JSON.stringify(data.markers));
        if (data.notes) localStorage.setItem('bg_audio_notes_v1', JSON.stringify(data.notes));
        if (data.lastListened) localStorage.setItem('bg_audio_last_listened', JSON.stringify(data.lastListened));
        if (data.userProfile) localStorage.setItem('bg_user_profile', JSON.stringify(data.userProfile));
        if (data.activity) localStorage.setItem('bg_user_activity', JSON.stringify(data.activity));
        if (data.prefs) {
            if (data.prefs.rate) localStorage.setItem('bg_audio_rate', String(data.prefs.rate));
            if (data.prefs.volume) localStorage.setItem('bg_audio_volume', String(data.prefs.volume));
            if (data.prefs.theme) localStorage.setItem('bg_audio_theme', data.prefs.theme);
        }
        
        console.log('📚 Bhakti Shastri data loaded from Firebase');
        
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('gitaDataLoaded', { detail: data }));
    }

    async migrateLocalToFirebase() {
        // Get existing Firebase data first
        const existingData = await this.getModuleData();
        
        // Collect all local data
        const localData = {
            favorites: JSON.parse(localStorage.getItem('bg_audio_favorites') || '[]'),
            customStarts: JSON.parse(localStorage.getItem('bg_audio_custom_starts') || '{}'),
            markers: JSON.parse(localStorage.getItem('bg_audio_markers_v1') || '{}'),
            notes: JSON.parse(localStorage.getItem('bg_audio_notes_v1') || '{}'),
            lastListened: JSON.parse(localStorage.getItem('bg_audio_last_listened') || 'null'),
            userProfile: JSON.parse(localStorage.getItem('bg_user_profile') || 'null'),
            activity: JSON.parse(localStorage.getItem('bg_user_activity') || '[]'),
            prefs: {
                rate: localStorage.getItem('bg_audio_rate'),
                volume: localStorage.getItem('bg_audio_volume'),
                theme: localStorage.getItem('bg_audio_theme')
            }
        };

        // Only migrate if local has data and Firebase is empty
        if (!existingData && this.hasLocalData(localData)) {
            await this.setModuleData(localData);
            console.log('📚 Bhakti Shastri data migrated to Firebase');
        }
    }

    hasLocalData(data) {
        return data.favorites?.length > 0 ||
               Object.keys(data.customStarts || {}).length > 0 ||
               Object.keys(data.markers || {}).length > 0 ||
               Object.keys(data.notes || {}).length > 0 ||
               data.activity?.length > 0;
    }
}

// Initialize Firebase manager
const gitaFirebase = new GitaFirebaseManager();
gitaFirebase.init();

/**
 * Enhanced Storage class with Firebase sync
 */
class Storage {
    constructor(key, defaultVal = {}) {
        this.key = key;
        this.defaultVal = defaultVal;
    }

    get() {
        try {
            const raw = localStorage.getItem(this.key);
            if (!raw) return this.defaultVal;
            const parsed = JSON.parse(raw);
            return (typeof parsed === 'object' && parsed !== null) ? parsed : this.defaultVal;
        } catch {
            return this.defaultVal;
        }
    }

    set(val) {
        try {
            localStorage.setItem(this.key, JSON.stringify(val));
            // Also save to Firebase (fire-and-forget)
            this.syncToFirebase(val);
        } catch (e) {
            console.error('Storage save failed', e);
        }
    }

    async syncToFirebase(val) {
        if (!gitaFirebase.isLoggedIn()) return;
        
        // Map localStorage keys to Firebase fields
        const fieldMap = {
            'bg_audio_favorites': 'favorites',
            'bg_audio_custom_starts': 'customStarts',
            'bg_audio_markers_v1': 'markers',
            'bg_audio_notes_v1': 'notes',
            'bg_audio_last_listened': 'lastListened',
            'bg_user_profile': 'userProfile',
            'bg_user_activity': 'activity'
        };

        const field = fieldMap[this.key];
        if (field) {
            await gitaFirebase.setModuleData({ [field]: val });
        }
    }
}

// Specific stores with Firebase sync
export const favoritesStore = {
    key: 'bg_audio_favorites',
    get: () => {
        try {
            const raw = localStorage.getItem('bg_audio_favorites') || '[]';
            return new Set(JSON.parse(raw));
        } catch { return new Set(); }
    },
    save: async (set) => {
        try { 
            const arr = [...set];
            localStorage.setItem('bg_audio_favorites', JSON.stringify(arr)); 
            // Sync to Firebase
            if (gitaFirebase.isLoggedIn()) {
                await gitaFirebase.setModuleData({ favorites: arr });
            }
        } catch { }
    }
};

export const customStartsStore = new Storage('bg_audio_custom_starts', {});
export const markersStore = new Storage('bg_audio_markers_v1', {});
export const notesStore = new Storage('bg_audio_notes_v1', {});
export const lastListenedStore = new Storage('bg_audio_last_listened', null);
export const userProfileStore = new Storage('bg_user_profile', {
    username: 'Aspirant',
    avatar: null, // Will be assigned randomly if null
    joinedDate: new Date().toISOString(),
    points: 0,
    dailyGoalMinutes: 30,
    lastActiveDate: null
});

// Helper to assign random avatar if not set
const currentProfile = userProfileStore.get();
if (!currentProfile.avatar) {
    const avatars = ['arjun', 'dhruv', 'prahlad', 'bharath'];
    const random = avatars[Math.floor(Math.random() * avatars.length)];
    currentProfile.avatar = `assets/avatars/${random}.png`;
    userProfileStore.set(currentProfile);
}

export const activityStore = new Storage('bg_user_activity', []); // Match the key used in recordActivity

export const prefsStore = {
    getRate: () => parseFloat(localStorage.getItem('bg_audio_rate') || '1') || 1,
    setRate: async (v) => {
        localStorage.setItem('bg_audio_rate', String(v));
        if (gitaFirebase.isLoggedIn()) {
            await gitaFirebase.setModuleData({ 'prefs.rate': v });
        }
    },
    getVolume: () => parseFloat(localStorage.getItem('bg_audio_volume') || '1') || 1,
    setVolume: async (v) => {
        localStorage.setItem('bg_audio_volume', String(v));
        if (gitaFirebase.isLoggedIn()) {
            await gitaFirebase.setModuleData({ 'prefs.volume': v });
        }
    },
    getTheme: () => localStorage.getItem('bg_audio_theme') || 'dark',
    setTheme: async (v) => {
        localStorage.setItem('bg_audio_theme', v);
        if (gitaFirebase.isLoggedIn()) {
            await gitaFirebase.setModuleData({ 'prefs.theme': v });
        }
    }
};

// Export for external use
export { gitaFirebase };
