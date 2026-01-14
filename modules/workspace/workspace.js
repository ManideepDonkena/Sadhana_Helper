/**
 * Krishna's Workspace - Firebase Integration
 * Spiritual practice platform with Bhakti Point gamification
 * Data synced with Firebase Firestore
 */

// ========== FIREBASE CONFIGURATION ==========
// Correct Firebase config - shared across all modules
const firebaseConfig = {
    apiKey: "AIzaSyB9vdSNAUN4903GJWBJJoIIEhqSEOjajnw",
    authDomain: "my-website-11127.firebaseapp.com",
    projectId: "my-website-11127",
    storageBucket: "my-website-11127.firebasestorage.app",
    messagingSenderId: "766689827734",
    appId: "1:766689827734:web:7011801e380debecb5dbb7",
    measurementId: "G-0DEELR4DW0"
};

// Initialize Firebase (check if already initialized)
let auth = null;
let db = null;

function initFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK not loaded yet');
            return false;
        }
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        auth = firebase.auth();
        db = firebase.firestore();
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
}

// Try to init Firebase immediately, will retry in DOMContentLoaded if needed
initFirebase();

// ========== STATE ==========
let currentUser = null;
let appData = {
    thoughts: [],
    resources: [],
    moods: [],
    bhaktiPoints: 0,
    ashramLevel: 1,
    focusSessions: [],
    streakDays: 0,
    lastActivityDate: null
};

let timerInterval = null;
let timeLeft = 25 * 60;
let isTimerRunning = false;
let chartInstance = null;
let isDataLoading = true;

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    // Retry Firebase init if not done
    if (!auth || !db) {
        initFirebase();
    }
    
    // Setup auth listener if Firebase is ready
    if (auth) {
        setupAuthListener();
    } else {
        // Firebase not available, use offline mode
        console.warn('Firebase not available, using offline mode');
        initializeWorkspaceOffline();
    }
});

function setupAuthListener() {
    if (!auth) {
        initializeWorkspaceOffline();
        return;
    }
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            console.log("User authenticated:", user.email);
            initializeWorkspace();
        } else {
            // User not signed in - redirect to main page to sign in
            currentUser = null;
            // Still initialize workspace with local data for preview
            initializeWorkspaceOffline();
        }
    });
}

async function initializeWorkspaceOffline() {
    // Load from localStorage if available
    const localData = localStorage.getItem('workspace_data');
    if (localData) {
        try {
            appData = JSON.parse(localData);
        } catch(e) {}
    }
    
    updateStatus(false);
    updateXPUI();
    renderData();
    renderMoodChart();
    renderFocusHistory();
}

async function handleAuth() {
    try {
        if (typeof firebase === 'undefined' || !auth) {
            console.error('Firebase not initialized');
            Toast?.show?.("Firebase not available. Please refresh the page.", "error");
            return;
        }
        
        // If user is already signed in through unified auth system
        const user = auth.currentUser;
        if (user) {
            initializeWorkspace();
        } else {
            // Fallback to sign in
            const provider = new firebase.auth.GoogleAuthProvider();
            await auth.signInWithPopup(provider);
        }
    } catch (error) {
        console.error("Auth error:", error);
        Toast?.show?.("Authentication failed: " + error.message, "error");
    }
}

function handleSignout() {
    if (confirm("Sign out from Krishna's Workspace?")) {
        if (typeof firebase === 'undefined' || !auth) {
            localStorage.clear();
            window.location.href = "../../index.html";
            return;
        }
        auth.signOut().then(() => {
            localStorage.clear();
            window.location.href = "../../index.html";
        });
    }
}

// ========== WORKSPACE INITIALIZATION ==========
async function initializeWorkspace() {
    try {
        isDataLoading = true;
        updateStatus(true);
        
        // Load user data from Firestore
        await loadUserData();
        
        // Setup real-time listeners
        setupRealtimeListeners();
        
        // Setup Google Tasks integration if available
        await setupGoogleTasks();
        
        // Render UI
        updateXPUI();
        renderData();
        renderMoodChart();
        renderFocusHistory();
        
        isDataLoading = false;
        
        // Show welcome notification
        NotificationCenter?.add({
            title: "Welcome to Krishna's Workspace",
            message: `Continue your spiritual journey, ${currentUser.displayName}`,
            type: "success",
            duration: 3000
        });
        
    } catch (error) {
        console.error("Workspace initialization error:", error);
        Toast.show("Failed to load workspace: " + error.message, "error");
    }
}

// ========== DATA MANAGEMENT - FIRESTORE ==========
async function loadUserData() {
    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            appData = userDoc.data() || appData;
            console.log("User data loaded from Firestore");
        } else {
            // First time user - initialize
            appData = {
                thoughts: [],
                resources: [],
                moods: [],
                bhaktiPoints: 0,
                ashramLevel: 1,
                focusSessions: [],
                streakDays: 0,
                lastActivityDate: new Date().toISOString(),
                createdAt: new Date(),
                email: currentUser.email,
                displayName: currentUser.displayName
            };
            await saveUserData();
        }
    } catch (error) {
        console.error("Error loading user data:", error);
        throw error;
    }
}

async function saveUserData() {
    if (isDataLoading) return;
    
    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        await userRef.set(appData, { merge: true });
        console.log("Data saved to Firestore");
    } catch (error) {
        console.error("Error saving data:", error);
        Toast.show("Failed to save data", "error");
    }
}

function setupRealtimeListeners() {
    // Listen for real-time updates from Firestore
    db.collection('users').doc(currentUser.uid)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const serverData = doc.data();
                // Merge server data with local (server takes precedence)
                appData = { ...appData, ...serverData };
                updateXPUI();
                renderData();
                console.log("Real-time update received");
            }
        }, (error) => {
            console.error("Real-time listener error:", error);
        });
}

// ========== GAMIFICATION - BHAKTI POINTS ==========
async function gainBhaktiPoints(amount, action) {
    appData.bhaktiPoints += amount;
    
    // Check for level up
    const newLevel = calculateAshramLevel(appData.bhaktiPoints);
    const leveledUp = newLevel > appData.ashramLevel;
    
    if (leveledUp) {
        appData.ashramLevel = newLevel;
        showLevelUpNotification(newLevel);
    }
    
    // Save immediately
    await saveUserData();
    
    // Show XP popup
    showXPPopup(`+${amount} Bhakti Points! 🙏`);
    
    // Send notification
    NotificationCenter?.add({
        title: "Bhakti Earned",
        message: `+${amount} points for ${action}`,
        type: "success",
        duration: 2000
    });
}

function calculateAshramLevel(bhaktiPoints) {
    // Level progression: Each level requires 100 more points
    // Ashram Level 1: 0-100, Level 2: 100-300, Level 3: 300-600, etc.
    return Math.floor(Math.sqrt(bhaktiPoints / 50)) + 1;
}

function showXPPopup(message) {
    const popup = document.getElementById('xp-popup');
    popup.textContent = message;
    popup.style.display = 'block';
    popup.style.animation = 'none';
    
    setTimeout(() => {
        popup.style.animation = 'slideUp 1s ease-out forwards';
    }, 10);
    
    setTimeout(() => {
        popup.style.display = 'none';
    }, 1100);
}

function showLevelUpNotification(newLevel) {
    const levelTexts = [
        "🙏 Novice Devotee",
        "🧘 Apprentice Yogi",
        "⚡ Karma Warrior",
        "📖 Wisdom Seeker",
        "❤️ Bhakti Master"
    ];
    
    const levelText = levelTexts[Math.min(newLevel - 1, levelTexts.length - 1)];
    
    Toast.show(`Level Up! 🎉 You are now ${levelText}`, "success");
    
    NotificationCenter?.add({
        title: "✨ Ashram Level Up!",
        message: `You've reached ${levelText}. Continue your spiritual practice!`,
        type: "success",
        duration: 5000
    });
}

function updateXPUI() {
    const levelBadge = document.getElementById('user-level');
    const xpFill = document.getElementById('xp-fill');
    const xpText = document.getElementById('xp-text');
    
    const levelTexts = [
        "🙏 L1", "🧘 L2", "⚡ L3", "📖 L4", "❤️ L5"
    ];
    
    const currentLevelText = levelTexts[Math.min(appData.ashramLevel - 1, levelTexts.length - 1)];
    levelBadge.textContent = currentLevelText;
    
    // XP for current level
    const pointsForCurrentLevel = (appData.ashramLevel - 1) * 100;
    const pointsForNextLevel = appData.ashramLevel * 100;
    const pointsIntoLevel = appData.bhaktiPoints - pointsForCurrentLevel;
    const pointsNeededForLevel = pointsForNextLevel - pointsForCurrentLevel;
    
    const fillPercent = Math.min((pointsIntoLevel / pointsNeededForLevel) * 100, 100);
    xpFill.style.width = fillPercent + '%';
    
    xpText.textContent = `${Math.floor(pointsIntoLevel)} / ${pointsNeededForLevel} Bhakti Points`;
}

// ========== ENTRIES (Thoughts, Resources, Moods) ==========
async function addEntry(type) {
    let entry = null;
    
    if (type === 'thought') {
        const content = document.getElementById('thought-input').value.trim();
        if (!content) return Toast.show("Please share your insight", "warning");
        
        entry = {
            id: Date.now().toString(),
            content,
            timestamp: new Date().toISOString(),
            type: 'thought'
        };
        appData.thoughts.push(entry);
        document.getElementById('thought-input').value = '';
        
        await gainBhaktiPoints(20, "Recording a spiritual insight");
        
    } else if (type === 'resource') {
        const url = document.getElementById('res-url').value.trim();
        const title = document.getElementById('res-title').value.trim();
        const tag = document.getElementById('res-tag').value;
        
        if (!url || !title) return Toast.show("Please fill in chapter and verse", "warning");
        
        entry = {
            id: Date.now().toString(),
            url,
            title,
            tag,
            timestamp: new Date().toISOString(),
            type: 'resource'
        };
        appData.resources.push(entry);
        document.getElementById('res-url').value = '';
        document.getElementById('res-title').value = '';
        
        await gainBhaktiPoints(10, "Adding a Divine Teaching");
    }
    
    await saveUserData();
    renderData();
}

function deleteEntry(id, type) {
    if (type === 'thought') {
        appData.thoughts = appData.thoughts.filter(t => t.id !== id);
    } else if (type === 'resource') {
        appData.resources = appData.resources.filter(r => r.id !== id);
    }
    saveUserData();
    renderData();
}

function renderData() {
    // Render thoughts
    const thoughtsGrid = document.getElementById('thoughts-grid');
    thoughtsGrid.innerHTML = appData.thoughts.map(t => `
        <div class="grid-item">
            <div class="grid-item-header">
                <span style="font-size:0.8rem; color:var(--text-dim);">${new Date(t.timestamp).toLocaleDateString()}</span>
                <button onclick="deleteEntry('${t.id}', 'thought')" style="background:none; color:var(--danger); border:none; cursor:pointer;">×</button>
            </div>
            <div class="grid-item-content">${t.content}</div>
        </div>
    `).join('');
    
    // Render resources
    const resourcesGrid = document.getElementById('resources-grid');
    resourcesGrid.innerHTML = appData.resources.map(r => `
        <div class="grid-item" style="border-left: 4px solid var(--resource);">
            <div class="grid-item-header">
                <span style="color:var(--text-dim); font-size:0.8rem;">${r.tag}</span>
                <button onclick="deleteEntry('${r.id}', 'resource')" style="background:none; color:var(--danger); border:none; cursor:pointer;">×</button>
            </div>
            <div class="grid-item-title">${r.url}</div>
            <div class="grid-item-content">${r.title}</div>
        </div>
    `).join('');
}

// ========== MOOD TRACKING ==========
async function logMood(level) {
    const comment = document.getElementById('mood-comment').value.trim();
    
    const moodEntry = {
        id: Date.now().toString(),
        level,
        comment,
        timestamp: new Date().toISOString()
    };
    
    appData.moods.push(moodEntry);
    document.getElementById('mood-comment').value = '';
    
    await gainBhaktiPoints(5, "Tracking devotional state");
    await saveUserData();
    
    renderMoodChart();
    Toast.show("Bhakti level recorded! 🙏", "success");
}

function renderMoodChart() {
    const ctx = document.getElementById('moodChart')?.getContext('2d');
    if (!ctx) return;
    
    // Get last 30 days of moods
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentMoods = appData.moods.filter(m => new Date(m.timestamp) > thirtyDaysAgo);
    
    // Aggregate by day
    const moodsByDay = {};
    recentMoods.forEach(m => {
        const day = new Date(m.timestamp).toLocaleDateString();
        if (!moodsByDay[day]) moodsByDay[day] = [];
        moodsByDay[day].push(m.level);
    });
    
    const labels = Object.keys(moodsByDay).sort();
    const averages = labels.map(day => {
        const levels = moodsByDay[day];
        return (levels.reduce((a, b) => a + b, 0) / levels.length).toFixed(1);
    });
    
    if (chartInstance) chartInstance.destroy();
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Bhakti Level (Devotional Connection)',
                data: averages,
                borderColor: 'var(--mood)',
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: 'var(--text-dim)', font: { size: 12 } }
                }
            },
            scales: {
                y: {
                    min: 1,
                    max: 5,
                    ticks: { color: 'var(--text-dim)' },
                    grid: { color: 'var(--border)' }
                },
                x: {
                    ticks: { color: 'var(--text-dim)' },
                    grid: { color: 'var(--border)' }
                }
            }
        }
    });
}

function resetMoods() {
    if (confirm("Clear all mood data?")) {
        appData.moods = [];
        saveUserData();
        renderMoodChart();
        Toast.show("Mood data cleared", "info");
    }
}

// ========== FOCUS / SADHANA TIMER ==========
function toggleTimer() {
    const btn = document.getElementById('timer-btn');
    
    if (isTimerRunning) {
        clearInterval(timerInterval);
        btn.textContent = 'RESUME SADHANA';
        isTimerRunning = false;
    } else {
        isTimerRunning = true;
        btn.textContent = 'PAUSE SADHANA';
        
        timerInterval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimerDisplay();
            } else {
                completeFocusSession();
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timeLeft = 25 * 60;
    isTimerRunning = false;
    document.getElementById('timer-btn').textContent = 'START SADHANA';
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer-display').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

async function completeFocusSession() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    
    const session = {
        id: Date.now().toString(),
        duration: 25,
        completed: true,
        timestamp: new Date().toISOString()
    };
    
    appData.focusSessions.push(session);
    
    await gainBhaktiPoints(50, "Completing a 25-minute Sadhana session");
    await saveUserData();
    
    resetTimer();
    renderFocusHistory();
    
    Toast.show("Sadhana Session Complete! 🙏", "success");
    
    // Show motivational message
    const quotes = [
        "\"The mind is restless and difficult to control, but it is subdued by practice.\" - BG 6.35",
        "\"He who conquers his senses is superior to his body.\" - BG 3.42",
        "\"Yoga is the journey of the self, through the self, to the self.\" - BG 6.20"
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    NotificationCenter?.add({
        title: "🧘 Sadhana Complete!",
        message: randomQuote,
        type: "success",
        duration: 5000
    });
}

function renderFocusHistory() {
    const history = document.getElementById('focus-history');
    const recentSessions = appData.focusSessions.slice(-5).reverse();
    
    history.innerHTML = recentSessions.map(s => 
        `<div style="font-size:0.8rem; color:var(--text-dim);">✓ ${new Date(s.timestamp).toLocaleDateString()}</div>`
    ).join('');
}

// ========== GOOGLE TASKS INTEGRATION ==========
async function setupGoogleTasks() {
    // Check if user has Google Account connected
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/tasks');
    
    try {
        // Try to get Google credentials if user logged in with Google
        if (currentUser.providerData.some(p => p.providerId === 'google.com')) {
            const credential = await auth.currentUser.getIdTokenResult();
            console.log("Google Tasks available for this user");
            // Initialize Google Tasks API here if needed
        }
    } catch (error) {
        console.log("Google Tasks not available:", error.message);
    }
}

async function fetchGoogleTasks() {
    Toast.show("Google Tasks integration coming soon", "info");
}

async function fetchTasksInList() {
    // Placeholder for Google Tasks integration
}

async function createTask() {
    // Placeholder for Google Tasks integration
}

// ========== SOUND & AMBIENCE ==========
function toggleSound(soundType, element) {
    const audio = document.getElementById(`audio-${soundType}`);
    
    if (audio.paused) {
        audio.play();
        element.style.opacity = '1';
    } else {
        audio.pause();
        audio.currentTime = 0;
        element.style.opacity = '0.5';
    }
}

// ========== VIEW SWITCHING ==========
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    event.target.closest('.nav-item')?.classList.add('active');
}

// ========== UTILITY FUNCTIONS ==========
function updateStatus(connected) {
    const dot = document.getElementById('conn-dot');
    const txt = document.getElementById('conn-text');
    if (connected) {
        dot.classList.add('connected');
        txt.innerText = "Synced with Krishna";
    } else {
        dot.classList.remove('connected');
        txt.innerText = "Disconnected";
    }
}

function clearUI() {
    document.querySelectorAll('.view-section').forEach(v => {
        v.querySelector('.grid-list')?.innerHTML = '';
    });
}

// ========== EXPORT FOR TESTING ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { addEntry, gainBhaktiPoints, logMood };
}
