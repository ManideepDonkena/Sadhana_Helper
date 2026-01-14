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
    lastActivityDate: null,
    // New sadhana-integrated fields
    myRituals: [
        { id: 101, name: "Chanting (Japa)", time: 16, emoji: "📿" },
        { id: 102, name: "Reading", time: 15, emoji: "📖" }
    ],
    dailyLogs: {},
    journal: []
};

// Get today's date key
const TODAY_KEY = new Date().toISOString().split('T')[0];
let currentJournalDate = TODAY_KEY;

let timerInterval = null;
let timeLeft = 25 * 60;
let selectedTimerDuration = 25;
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
            appData = { ...appData, ...JSON.parse(localData) };
        } catch(e) {}
    }
    
    // Ensure today's log exists
    ensureTodayLog();
    
    updateStatus(false);
    updateXPUI();
    renderDashboard();
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
        
        // Ensure today's log exists
        ensureTodayLog();
        
        // Render UI
        updateXPUI();
        renderDashboard();
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
        Toast?.show?.("Failed to load workspace: " + error.message, "error");
    }
}

// Helper to ensure today's daily log exists
function ensureTodayLog() {
    if (!appData.dailyLogs) appData.dailyLogs = {};
    if (!appData.dailyLogs[TODAY_KEY]) {
        appData.dailyLogs[TODAY_KEY] = { completedIds: [], nectar: "", notes: "" };
    }
}

// ========== DATA MANAGEMENT - FIRESTORE ==========
async function loadUserData() {
    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const serverData = userDoc.data();
            appData = { ...appData, ...serverData };
            console.log("User data loaded from Firestore");
        } else {
            // First time user - initialize with defaults
            appData = {
                ...appData,
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
                displayName: currentUser.displayName,
                myRituals: [
                    { id: 101, name: "Chanting (Japa)", time: 16, emoji: "📿" },
                    { id: 102, name: "Reading", time: 15, emoji: "📖" }
                ],
                dailyLogs: {},
                journal: []
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
    
    // Always save to localStorage as backup
    try {
        localStorage.setItem('workspace_data', JSON.stringify(appData));
    } catch(e) {
        console.warn('localStorage save failed:', e);
    }
    
    // Save to Firestore if available
    if (!currentUser || !db) return;
    
    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        await userRef.set(appData, { merge: true });
        console.log("Data saved to Firestore");
    } catch (error) {
        console.error("Error saving data:", error);
        Toast?.show?.("Failed to save data", "error");
    }
}

function setupRealtimeListeners() {
    if (!db || !currentUser) return;
    
    // Listen for real-time updates from Firestore
    db.collection('users').doc(currentUser.uid)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const serverData = doc.data();
                // Merge server data with local (server takes precedence)
                appData = { ...appData, ...serverData };
                updateXPUI();
                renderDashboard();
                console.log("Real-time update received");
            }
        }, (error) => {
            console.error("Real-time listener error:", error);
        });
}

// ========== DASHBOARD RENDERING ==========
function renderDashboard() {
    renderRitualChecklist();
    renderGarden();
    renderQuickStats();
    updateJournalDate();
    renderJournalEntries();
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
    
    if (!levelBadge || !xpFill || !xpText) return;
    
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

// ========== RITUAL CHECKLIST ==========
function renderRitualChecklist() {
    const container = document.getElementById('ritualChecklist');
    if (!container) return;
    
    const log = appData.dailyLogs[TODAY_KEY] || { completedIds: [], nectar: "", notes: "" };
    
    if (!appData.myRituals || appData.myRituals.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-om"></i>
                <p>No rituals yet. Add your daily practices!</p>
            </div>
        `;
        updateDailyScore(0);
        return;
    }
    
    container.innerHTML = appData.myRituals.map(ritual => {
        const isCompleted = log.completedIds.includes(ritual.id);
        return `
            <div class="ritual-item ${isCompleted ? 'completed' : ''}" onclick="toggleRitual(${ritual.id})">
                <div class="ritual-emoji">${ritual.emoji}</div>
                <div class="ritual-info">
                    <div class="ritual-name">${escapeHTML(ritual.name)}</div>
                    <div class="ritual-time">${ritual.time} mins</div>
                </div>
                <div class="ritual-check">✓</div>
            </div>
        `;
    }).join('');
    
    // Update score
    const pct = Math.round((log.completedIds.length / appData.myRituals.length) * 100);
    updateDailyScore(pct);
}

function updateDailyScore(pct) {
    const scoreEl = document.getElementById('dailyScore');
    if (scoreEl) scoreEl.textContent = `${pct}%`;
}

async function toggleRitual(ritualId) {
    ensureTodayLog();
    const log = appData.dailyLogs[TODAY_KEY];
    const idx = log.completedIds.indexOf(ritualId);
    
    if (idx > -1) {
        // Uncomplete
        log.completedIds.splice(idx, 1);
    } else {
        // Complete
        log.completedIds.push(ritualId);
        const ritual = appData.myRituals.find(r => r.id === ritualId);
        if (ritual) {
            Toast?.show?.(`${ritual.name} completed! 🙏`, "success");
            await gainBhaktiPoints(10, `Completing ${ritual.name}`);
        }
    }
    
    await saveUserData();
    renderRitualChecklist();
    renderGarden();
}

// ========== RITUAL MANAGER MODAL ==========
function openRitualManager() {
    document.getElementById('ritual-modal').classList.add('active');
    renderRitualList();
}

function closeRitualManager() {
    document.getElementById('ritual-modal').classList.remove('active');
}

function renderRitualList() {
    const container = document.getElementById('ritual-list');
    if (!container) return;
    
    if (!appData.myRituals || appData.myRituals.length === 0) {
        container.innerHTML = '<p style="color:var(--text-dim); text-align:center;">No rituals added yet.</p>';
        return;
    }
    
    container.innerHTML = appData.myRituals.map(r => `
        <div class="ritual-list-item">
            <div class="ritual-list-item-info">
                <span style="font-size:1.2rem;">${r.emoji}</span>
                <span>${escapeHTML(r.name)}</span>
                <span style="color:var(--text-dim); font-size:0.8rem;">(${r.time}m)</span>
            </div>
            <button class="btn-delete" onclick="deleteRitual(${r.id})">×</button>
        </div>
    `).join('');
}

async function addRitual() {
    const nameInput = document.getElementById('newRitualName');
    const timeInput = document.getElementById('newRitualTime');
    const emojiSelect = document.getElementById('newRitualEmoji');
    
    const name = nameInput.value.trim();
    const time = parseInt(timeInput.value) || 10;
    const emoji = emojiSelect.value;
    
    if (!name) {
        Toast?.show?.("Please enter a ritual name", "warning");
        return;
    }
    
    if (!appData.myRituals) appData.myRituals = [];
    
    appData.myRituals.push({
        id: Date.now(),
        name: name.substring(0, 50),
        time: Math.min(Math.max(time, 1), 180),
        emoji
    });
    
    nameInput.value = '';
    timeInput.value = '';
    
    await saveUserData();
    renderRitualList();
    renderRitualChecklist();
    Toast?.show?.("Ritual added!", "success");
}

async function deleteRitual(ritualId) {
    if (!confirm("Remove this ritual?")) return;
    
    appData.myRituals = appData.myRituals.filter(r => r.id !== ritualId);
    await saveUserData();
    renderRitualList();
    renderRitualChecklist();
    Toast?.show?.("Ritual removed", "info");
}

// ========== GARDEN VISUALIZATION ==========
function renderGarden() {
    const grid = document.getElementById('gardenGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const today = new Date();
    
    // Last 42 days (6 weeks)
    for (let i = 41; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const log = appData.dailyLogs?.[key];
        
        const cell = document.createElement('div');
        cell.className = 'garden-cell';
        cell.title = formatDate(key);
        cell.onclick = () => showDayDetail(key);
        
        if (log) {
            const hasRitual = log.completedIds && log.completedIds.length > 0;
            const hasNote = (log.nectar && log.nectar.trim()) || (log.notes && log.notes.trim());
            
            if (hasRitual) {
                cell.classList.add('completed');
            } else if (hasNote) {
                cell.classList.add('partial');
            }
        }
        
        grid.appendChild(cell);
    }
}

function showDayDetail(dateKey) {
    const modal = document.getElementById('day-modal');
    const title = document.getElementById('day-modal-title');
    const body = document.getElementById('day-modal-body');
    
    title.textContent = formatDate(dateKey);
    
    const log = appData.dailyLogs?.[dateKey];
    
    if (!log || (!log.completedIds?.length && !log.nectar && !log.notes)) {
        body.innerHTML = '<p style="color:var(--text-dim); font-style:italic;">No activity recorded for this day.</p>';
    } else {
        let html = '';
        
        // Completed rituals
        if (log.completedIds?.length > 0) {
            html += '<div style="margin-bottom:15px;"><h4 style="color:var(--text-dim); margin-bottom:10px;">Completed:</h4>';
            log.completedIds.forEach(id => {
                const ritual = appData.myRituals?.find(r => r.id === id);
                if (ritual) {
                    html += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;"><span>${ritual.emoji}</span><span>${escapeHTML(ritual.name)}</span></div>`;
                }
            });
            html += '</div>';
        }
        
        // Nectar
        if (log.nectar?.trim()) {
            html += `<div style="background:rgba(245,158,11,0.1); padding:12px; border-radius:8px; margin-bottom:10px;">
                <span style="color:var(--accent); font-size:0.75rem; text-transform:uppercase; font-weight:600;">Nectar</span>
                <p style="color:#fff; font-style:italic; margin-top:5px;">"${escapeHTML(log.nectar)}"</p>
            </div>`;
        }
        
        // Notes
        if (log.notes?.trim()) {
            html += `<div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px;">
                <span style="color:var(--text-dim); font-size:0.75rem; text-transform:uppercase; font-weight:600;">Notes</span>
                <p style="color:var(--text-dim); margin-top:5px;">${escapeHTML(log.notes)}</p>
            </div>`;
        }
        
        body.innerHTML = html;
    }
    
    modal.classList.add('active');
}

function closeDayModal() {
    document.getElementById('day-modal').classList.remove('active');
}

// ========== QUICK STATS ==========
function renderQuickStats() {
    // Sessions today
    const todaySessions = appData.focusSessions?.filter(s => {
        return s.timestamp?.startsWith(TODAY_KEY);
    }).length || 0;
    
    const sessionsEl = document.getElementById('sessions-today');
    if (sessionsEl) sessionsEl.textContent = todaySessions;
    
    // Streak calculation
    const streakEl = document.getElementById('streak-days');
    if (streakEl) streakEl.textContent = calculateStreak();
    
    // Mini timer display sync
    updateMiniTimerDisplay();
}

function calculateStreak() {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const log = appData.dailyLogs?.[key];
        
        if (log && log.completedIds?.length > 0) {
            streak++;
        } else if (i > 0) {
            // Allow today to be incomplete
            break;
        }
    }
    
    return streak;
}

function updateMiniTimerDisplay() {
    const mini = document.getElementById('mini-timer-display');
    if (mini) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        mini.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

// ========== QUICK NECTAR ==========
async function saveQuickNectar() {
    const input = document.getElementById('quickNectar');
    const nectar = input.value.trim();
    
    if (!nectar) {
        Toast?.show?.("Please write some nectar first", "warning");
        return;
    }
    
    ensureTodayLog();
    appData.dailyLogs[TODAY_KEY].nectar = nectar.substring(0, 500);
    
    await gainBhaktiPoints(15, "Recording today's nectar");
    await saveUserData();
    
    input.value = '';
    renderGarden();
    Toast?.show?.("Nectar saved! ✨", "success");
}

// ========== JOURNAL ==========
function updateJournalDate() {
    const dateEl = document.getElementById('journal-date');
    if (dateEl) {
        if (currentJournalDate === TODAY_KEY) {
            dateEl.textContent = 'Today';
        } else {
            dateEl.textContent = formatDate(currentJournalDate);
        }
    }
    
    // Load journal content for this date
    const log = appData.dailyLogs?.[currentJournalDate] || { nectar: '', notes: '' };
    
    const nectarInput = document.getElementById('journalNectar');
    const notesInput = document.getElementById('journalNotes');
    
    if (nectarInput) nectarInput.value = log.nectar || '';
    if (notesInput) notesInput.value = log.notes || '';
}

function navigateJournalDate(direction) {
    const current = new Date(currentJournalDate);
    current.setDate(current.getDate() + direction);
    
    const newKey = current.toISOString().split('T')[0];
    
    // Don't go into the future
    if (newKey > TODAY_KEY) return;
    
    currentJournalDate = newKey;
    updateJournalDate();
}

async function saveJournal() {
    const nectar = document.getElementById('journalNectar')?.value.trim() || '';
    const notes = document.getElementById('journalNotes')?.value.trim() || '';
    
    if (!nectar && !notes) {
        Toast?.show?.("Please write something first", "warning");
        return;
    }
    
    if (!appData.dailyLogs) appData.dailyLogs = {};
    if (!appData.dailyLogs[currentJournalDate]) {
        appData.dailyLogs[currentJournalDate] = { completedIds: [], nectar: '', notes: '' };
    }
    
    appData.dailyLogs[currentJournalDate].nectar = nectar.substring(0, 1000);
    appData.dailyLogs[currentJournalDate].notes = notes.substring(0, 1000);
    
    await gainBhaktiPoints(20, "Journal entry");
    await saveUserData();
    
    renderGarden();
    renderJournalEntries();
    Toast?.show?.("Journal saved! 📝", "success");
}

function renderJournalEntries() {
    const container = document.getElementById('journal-entries');
    if (!container) return;
    
    const entries = Object.keys(appData.dailyLogs || {})
        .sort().reverse()
        .filter(k => {
            const l = appData.dailyLogs[k];
            return (l.nectar && l.nectar.trim()) || (l.notes && l.notes.trim());
        })
        .slice(0, 5);
    
    if (entries.length === 0) {
        container.innerHTML = '<p style="color:var(--text-dim); font-style:italic;">No entries yet. Start journaling!</p>';
        return;
    }
    
    container.innerHTML = entries.map(k => {
        const log = appData.dailyLogs[k];
        return `
            <div class="journal-entry">
                <div class="journal-entry-date">${formatDate(k)}</div>
                ${log.nectar ? `<div class="journal-entry-nectar">"${escapeHTML(log.nectar.substring(0, 100))}${log.nectar.length > 100 ? '...' : ''}"</div>` : ''}
                ${log.notes ? `<div class="journal-entry-notes">${escapeHTML(log.notes.substring(0, 100))}${log.notes.length > 100 ? '...' : ''}</div>` : ''}
            </div>
        `;
    }).join('');
}

// ========== MOOD TRACKING ==========
async function logMood(level) {
    const commentEl = document.getElementById('mood-comment');
    const comment = commentEl?.value.trim() || '';
    
    if (!appData.moods) appData.moods = [];
    
    const moodEntry = {
        id: Date.now().toString(),
        level,
        comment,
        timestamp: new Date().toISOString()
    };
    
    appData.moods.push(moodEntry);
    if (commentEl) commentEl.value = '';
    
    await gainBhaktiPoints(5, "Tracking devotional state");
    await saveUserData();
    
    renderMoodChart();
    Toast?.show?.("Bhakti level recorded! 🙏", "success");
}

function renderMoodChart() {
    const ctx = document.getElementById('moodChart')?.getContext('2d');
    if (!ctx) return;
    
    // Get last 30 days of moods
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentMoods = (appData.moods || []).filter(m => new Date(m.timestamp) > thirtyDaysAgo);
    
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
                label: 'Bhakti Level',
                data: averages,
                borderColor: '#ec4899',
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
                    labels: { color: '#888', font: { size: 12 } }
                }
            },
            scales: {
                y: {
                    min: 1,
                    max: 5,
                    ticks: { color: '#888' },
                    grid: { color: 'rgba(255,255,255,0.08)' }
                },
                x: {
                    ticks: { color: '#888' },
                    grid: { color: 'rgba(255,255,255,0.08)' }
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
        Toast?.show?.("Mood data cleared", "info");
    }
}

// ========== FOCUS / SADHANA TIMER ==========
function setTimer(minutes) {
    if (isTimerRunning) {
        Toast?.show?.("Stop timer first to change duration", "warning");
        return;
    }
    
    selectedTimerDuration = minutes;
    timeLeft = minutes * 60;
    updateTimerDisplay();
    updateMiniTimerDisplay();
    
    // Update active preset button
    document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
    event?.target?.classList.add('active');
}

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
                updateMiniTimerDisplay();
            } else {
                completeFocusSession();
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timeLeft = selectedTimerDuration * 60;
    isTimerRunning = false;
    document.getElementById('timer-btn').textContent = 'START SADHANA';
    updateTimerDisplay();
    updateMiniTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const display = document.getElementById('timer-display');
    if (display) {
        display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

async function completeFocusSession() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    
    if (!appData.focusSessions) appData.focusSessions = [];
    
    const session = {
        id: Date.now().toString(),
        duration: selectedTimerDuration,
        completed: true,
        timestamp: new Date().toISOString()
    };
    
    appData.focusSessions.push(session);
    
    const points = Math.round(selectedTimerDuration * 2);
    await gainBhaktiPoints(points, `Completing a ${selectedTimerDuration}-minute Sadhana session`);
    await saveUserData();
    
    resetTimer();
    renderFocusHistory();
    renderQuickStats();
    
    Toast?.show?.("Sadhana Session Complete! 🙏", "success");
    
    // Show motivational message
    const quotes = [
        "\"The mind is restless and difficult to control, but it is subdued by practice.\" - BG 6.35",
        "\"He who conquers his senses is superior to his body.\" - BG 3.42",
        "\"Yoga is the journey of the self, through the self, to the self.\" - BG 6.20",
        "\"A person can rise through the efforts of his own mind.\" - BG 6.5",
        "\"Whatever action a great man performs, common men follow.\" - BG 3.21"
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
    if (!history) return;
    
    const recentSessions = (appData.focusSessions || []).slice(-5).reverse();
    
    if (recentSessions.length === 0) {
        history.innerHTML = '<div style="font-size:0.8rem; color:var(--text-dim);">No sessions yet</div>';
        return;
    }
    
    history.innerHTML = recentSessions.map(s => 
        `<div style="font-size:0.8rem; color:var(--text-dim);">✓ ${s.duration}m - ${formatDate(s.timestamp.split('T')[0])}</div>`
    ).join('');
}

// ========== SOUND & AMBIENCE ==========
function toggleSound(soundType, element) {
    const audio = document.getElementById(`audio-${soundType}`);
    if (!audio) return;
    
    if (audio.paused) {
        audio.play();
        element.style.opacity = '1';
        element.style.background = 'var(--accent)';
    } else {
        audio.pause();
        audio.currentTime = 0;
        element.style.opacity = '0.5';
        element.style.background = '';
    }
}

// ========== VIEW SWITCHING ==========
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    event?.target?.closest('.nav-item')?.classList.add('active');
    
    // Refresh relevant data when switching views
    if (viewId === 'view-dashboard') {
        renderDashboard();
    } else if (viewId === 'view-journal') {
        updateJournalDate();
        renderJournalEntries();
    } else if (viewId === 'view-mood') {
        renderMoodChart();
    }
}

// ========== UTILITY FUNCTIONS ==========
function updateStatus(connected) {
    const dot = document.getElementById('conn-dot');
    const txt = document.getElementById('conn-text');
    if (!dot || !txt) return;
    
    if (connected) {
        dot.classList.add('connected');
        txt.innerText = "Synced with Krishna";
    } else {
        dot.classList.remove('connected');
        txt.innerText = "Offline Mode";
    }
}

function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch(e) {
        return dateStr;
    }
}

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function clearUI() {
    document.querySelectorAll('.view-section').forEach(v => {
        const grid = v.querySelector('.grid-list');
        if (grid) grid.innerHTML = '';
    });
}

// ========== EXPORT FOR TESTING ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { toggleRitual, gainBhaktiPoints, logMood, saveJournal };
}
