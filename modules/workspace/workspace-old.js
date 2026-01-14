/** --- CONFIGURATION --- **/
const CLIENT_ID = '758661934972-096amjqi6rsn14b9lv3br56ll76lvou6.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAf5iciZ4xA7xglz90TF1XzGVNAGVIga1U';
const DB_FILENAME = "mind_os_db.json";
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/tasks';
const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    'https://tasks.googleapis.com/$discovery/rest?version=v1'
];

// STATE
let tokenClient;
let dbFileId = null;
let appData = { thoughts: [], resources: [], moods: [], xp: 0, focusSessions: [] };
let currentTask = null;
let timerInterval = null;
let timeLeft = 25 * 60;
let isTimerRunning = false;
let chartInstance = null;

// --- INITIALIZATION ---
function gapiLoaded() {
    gapi.load('client', () => {
        gapi.client.init({ apiKey: API_KEY, discoveryDocs: DISCOVERY_DOCS })
            .then(() => {
                updateStatus(false);
                restoreSession(); // Attempt to restore session
            });
    });
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: SCOPES, callback: ''
    });
    document.getElementById('auth-btn').innerText = "Connect Google Account";
}

function handleAuth() {
    tokenClient.callback = async (resp) => {
        if (resp.error) throw resp;

        // Save token to localStorage
        const expiresAt = Date.now() + (resp.expires_in * 1000);
        localStorage.setItem('g_token', JSON.stringify({
            access_token: resp.access_token,
            expires_at: expiresAt
        }));

        document.getElementById('auth-overlay').style.display = 'none';
        updateStatus(true);
        await initApp();
    };
    tokenClient.requestAccessToken({ prompt: '' });
}

function restoreSession() {
    const stored = localStorage.getItem('g_token');
    if (!stored) return;

    try {
        const { access_token, expires_at } = JSON.parse(stored);
        if (Date.now() < expires_at) {
            gapi.client.setToken({ access_token });
            document.getElementById('auth-overlay').style.display = 'none';
            updateStatus(true);
            initApp();
            console.log("Session restored");
        } else {
            console.log("Session expired");
            localStorage.removeItem('g_token');
        }
    } catch (e) {
        console.error("Error restoring session", e);
        localStorage.removeItem('g_token');
    }
}

function updateStatus(connected) {
    const dot = document.getElementById('conn-dot');
    const txt = document.getElementById('conn-text');
    if (connected) {
        dot.classList.add('connected');
        txt.innerText = "System Online";
    } else {
        dot.classList.remove('connected');
        txt.innerText = "Disconnected";
    }
}

async function initApp() {
    await loadDatabase();
    await fetchTaskLists();
    updateXPUI();
    renderData();
    renderMoodChart();
    renderFocusHistory();
}

// --- GAMIFICATION LOGIC ---
function gainXP(amount, message) {
    appData.xp = (appData.xp || 0) + amount;
    updateXPUI();
    saveDatabase();

    // Show popup
    const popup = document.getElementById('xp-popup');
    popup.innerText = `+${amount} XP ${message}`;
    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), 2000);
}

function updateXPUI() {
    const xp = appData.xp || 0;
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;
    const nextLevelXP = Math.pow(level, 2) * 100;
    const prevLevelXP = Math.pow(level - 1, 2) * 100;
    const levelRange = nextLevelXP - prevLevelXP;
    const progress = xp - prevLevelXP;
    const percentage = Math.min(100, (progress / levelRange) * 100);

    document.getElementById('user-level').innerText = `LVL ${level}`;
    document.getElementById('xp-fill').style.width = `${percentage}%`;
    document.getElementById('xp-text').innerText = `${Math.round(progress)} / ${levelRange} XP`;
}

// --- DATABASE (DRIVE) ---
async function loadDatabase() {
    try {
        const response = await gapi.client.drive.files.list({
            'q': `name = '${DB_FILENAME}' and trashed = false`,
            'fields': 'files(id, name)',
            'spaces': 'drive'
        });
        const files = response.result.files;
        if (files && files.length > 0) {
            dbFileId = files[0].id;
            const content = await gapi.client.drive.files.get({ fileId: dbFileId, alt: 'media' });
            appData = content.result || { thoughts: [], resources: [], moods: [], xp: 0, focusSessions: [] };
            // Ensure new fields exist
            if (!appData.moods) appData.moods = [];
            if (!appData.xp) appData.xp = 0;
            if (!appData.focusSessions) appData.focusSessions = [];
        } else {
            await createDatabase();
        }
    } catch (e) { console.error("DB Error", e); }
}

async function createDatabase() {
    const fileMetadata = { 'name': DB_FILENAME, 'mimeType': 'application/json' };
    const response = await gapi.client.drive.files.create({ resource: fileMetadata, fields: 'id' });
    dbFileId = response.result.id;
    await saveDatabase();
}

async function saveDatabase() {
    if (!dbFileId) return;
    await gapi.client.request({
        path: '/upload/drive/v3/files/' + dbFileId,
        method: 'PATCH', params: { uploadType: 'media' }, body: JSON.stringify(appData)
    });
}

// --- FEATURES LOGIC ---

function addEntry(type) {
    if (type === 'thought') {
        const txt = document.getElementById('thought-input').value;
        if (!txt) return;
        appData.thoughts.unshift({ id: Date.now(), text: txt, date: new Date().toLocaleString() });
        document.getElementById('thought-input').value = '';
        gainXP(10, "Insight Logged");
    } else {
        const url = document.getElementById('res-url').value;
        const title = document.getElementById('res-title').value;
        const tag = document.getElementById('res-tag').value;
        if (!url) return;
        appData.resources.unshift({ id: Date.now(), url, title, tag, date: new Date().toLocaleDateString() });
        document.getElementById('res-url').value = '';
        document.getElementById('res-title').value = '';
        gainXP(10, "Resource Saved");
    }
    renderData();
    saveDatabase();
}

function logMood(val) {
    const comment = document.getElementById('mood-comment').value;
    appData.moods.push({ val: val, comment: comment, date: new Date().toISOString() });
    document.getElementById('mood-comment').value = ''; // Clear input
    gainXP(5, "Mood Tracked");
    renderMoodChart();
    saveDatabase();
}

function resetMoods() {
    if (confirm("Are you sure you want to clear your mood history? This cannot be undone.")) {
        appData.moods = [];
        renderMoodChart();
        saveDatabase();
    }
}

function renderData() {
    document.getElementById('thoughts-grid').innerHTML = appData.thoughts.map(t => `
        <div class="card c-thought"><p>${t.text}</p><div class="tag">${t.date}</div></div>
    `).join('');

    document.getElementById('resources-grid').innerHTML = appData.resources.map(r => `
        <div class="card c-resource">
            <h4><a href="${r.url}" target="_blank" style="color:white;text-decoration:none">${r.title || r.url}</a></h4>
            <div class="tag" style="background:var(--resource); color:black;">${r.tag}</div>
        </div>
    `).join('');
}

function renderMoodChart() {
    const ctx = document.getElementById('moodChart').getContext('2d');
    const last14 = appData.moods.slice(-14); // Last 14 entries

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last14.map(m => new Date(m.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })),
            datasets: [{
                label: 'Mood Level',
                data: last14.map(m => m.val),
                borderColor: '#8b5cf6',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(139, 92, 246, 0.1)'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { min: 0, max: 6, ticks: { color: '#94a3b8' } }, x: { ticks: { color: '#94a3b8' } } },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        afterLabel: function (context) {
                            const idx = context.dataIndex;
                            const mood = last14[idx];
                            return mood.comment ? `Note: ${mood.comment}` : '';
                        }
                    }
                }
            }
        }
    });
}

// --- GOOGLE TASKS ---
async function fetchTaskLists() {
    try {
        const res = await gapi.client.tasks.tasklists.list();
        const lists = res.result.items;
        const select = document.getElementById('tasklist-select');
        select.innerHTML = '';
        if (lists && lists.length > 0) {
            lists.forEach(l => { let opt = document.createElement('option'); opt.value = l.id; opt.text = l.title; select.add(opt); });
            fetchTasksInList(lists[0].id);
        }
    } catch (e) { console.error(e); }
}

async function fetchTasksInList(listId) {
    const container = document.getElementById('google-tasks-list');
    container.innerHTML = 'Loading...';
    try {
        const res = await gapi.client.tasks.tasks.list({ tasklist: listId, showCompleted: false, maxResults: 20 });
        const tasks = res.result.items || [];
        container.innerHTML = '';

        tasks.forEach(task => {
            const div = document.createElement('div');
            div.className = 'task-item';
            div.innerHTML = `
                <div style="font-weight:600">${task.title}</div>
                <div class="check-circle" onclick="completeTask('${listId}', '${task.id}', this)" title="Complete Task">✓</div>
            `;
            div.onclick = (e) => { if (e.target.className !== 'check-circle') selectTask(task); };
            container.appendChild(div);
        });
    } catch (e) { console.error(e); }
}

async function completeTask(listId, taskId, el) {
    // Visual update immediately
    el.parentElement.style.opacity = '0.5';

    try {
        await gapi.client.tasks.tasks.update({
            tasklist: listId, task: taskId,
            resource: { id: taskId, status: 'completed' }
        });
        gainXP(50, "Task Completed!");
        el.parentElement.remove();
    } catch (e) { console.error(e); }
}

async function createTask() {
    const input = document.getElementById('new-task-input');
    const title = input.value;
    const listId = document.getElementById('tasklist-select').value;

    if (!title || !listId) return;

    try {
        // Optimistic UI update could go here, but for simplicity we wait for API
        const res = await gapi.client.tasks.tasks.insert({
            tasklist: listId,
            resource: { title: title }
        });

        input.value = '';
        fetchTasksInList(listId); // Refresh list
        gainXP(10, "Task Created");
    } catch (e) { console.error("Error creating task", e); }
}

function selectTask(task) {
    currentTask = task;
    document.getElementById('active-task-name').innerText = task.title;
    document.querySelectorAll('.task-item').forEach(i => i.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
}

// --- FOCUS TIMER & SOUND ---
function toggleTimer() {
    const btn = document.getElementById('timer-btn');
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        btn.innerText = "RESUME";
    } else {
        if (!currentTask) {
            alert("Select a task first!");
            return;
        }

        // Request Notification Permission
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) {
                finishFocusSession();
            }
        }, 1000);
        isTimerRunning = true;
        btn.innerText = "PAUSE";
    }
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${m}:${s}`;
}

function finishFocusSession() {
    clearInterval(timerInterval);

    // Notification
    if (Notification.permission === "granted") {
        new Notification("Focus Session Complete!", {
            body: "Great job! Time to take a break.",
            icon: "favicon.png"
        });
    }

    // Log Session
    const session = {
        id: Date.now(),
        taskId: currentTask.id,
        taskTitle: currentTask.title,
        duration: 25, // minutes
        timestamp: new Date().toLocaleString()
    };
    appData.focusSessions.unshift(session);
    saveDatabase();
    renderFocusHistory();

    timeLeft = 25 * 60;
    isTimerRunning = false;
    document.getElementById('timer-btn').innerText = "START FOCUS";
    gainXP(25, "Focus Session Done");

    // Relaxation Prompt
    setTimeout(() => {
        if (confirm("Session Complete! Would you like to start a Grounding exercise to relax?")) {
            window.location.href = "Mindstate_Games.html?start=grounding";
        }
    }, 500);
}

function resetTimer() {
    clearInterval(timerInterval); isTimerRunning = false; timeLeft = 25 * 60; updateTimerDisplay();
    document.getElementById('timer-btn').innerText = "START FOCUS";
}

function renderFocusHistory() {
    const container = document.getElementById('focus-history');
    if (!container) return;

    container.innerHTML = appData.focusSessions.slice(0, 5).map(s => `
        <div class="session-item">
            <span>${s.taskTitle}</span>
            <span>${s.duration}m • ${s.timestamp.split(',')[0]}</span>
        </div>
    `).join('');
}

function toggleSound(type, btn) {
    const audio = document.getElementById(`audio-${type}`);
    if (audio.paused) {
        // Pause others
        document.querySelectorAll('audio').forEach(a => { a.pause(); a.currentTime = 0; });
        document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));

        audio.play();
        btn.classList.add('active');
    } else {
        audio.pause();
        btn.classList.remove('active');
    }
}

function switchView(id, element) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Add active class to the clicked nav item
    const targetEl = element || (typeof event !== 'undefined' ? event.currentTarget : null);
    if (targetEl) {
        targetEl.classList.add('active');
    }
}

function handleSignout() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        localStorage.removeItem('g_token'); // Clear stored token
        location.reload();
    }
}

window.onload = function () { gapiLoaded(); gisLoaded(); }
