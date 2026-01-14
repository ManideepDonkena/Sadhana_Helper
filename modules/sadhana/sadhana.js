// ==========================================
// SADHANA TRACKER - Enhanced with Security & Firebase
// ==========================================

// Data Management
const DB_KEY = 'sadhana_interactive_v5';
const MODULE_NAME = 'sadhana';
let TODAY_KEY = new Date().toISOString().split('T')[0];
let currentViewDate = TODAY_KEY;

const DEFAULT_DATA = {
    identity: "",
    myRituals: [
        { id: 101, name: "Chanting (Japa)", time: 10, emoji: "📿" },
        { id: 102, name: "Reading", time: 15, emoji: "📖" }
    ],
    dailyLogs: {}
};

let appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
let charts = {};
let isDataLoaded = false;

// Debounced save function
const debouncedSave = debounce(saveData, 500);

// ==========================================
// INITIALIZATION
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
    // Initialize Firebase first (if available)
    if (typeof FirebaseManager !== 'undefined') {
        try {
            await FirebaseManager.init();
        } catch (e) {
            console.warn('Firebase init failed, using localStorage:', e);
        }
    } else {
        console.warn('FirebaseManager not available, using localStorage only');
    }
    
    // Load data (from Firebase or localStorage)
    await loadData();
    
    renderDashboard();
    setupAutoSave();
    updateDateDisplay();
    initializePillarContent();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Listen for auth state changes to reload data
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (isDataLoaded) {
                // User logged in/out - reload data
                await loadData();
                renderDashboard();
            }
        });
    }
});

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + S = Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveData();
        Toast.success('Data saved!');
    }
    
    // Escape = Close modal
    if (e.key === 'Escape') {
        closeDayModal();
    }
}

// ==========================================
// PILLAR CONTENT
// ==========================================
const PILLAR_CONTENT = {
    identity: {
        title: "Identity over Mood",
        html: `<span class="text-orange-500 font-bold tracking-widest text-xs uppercase mb-3 block">Pillar 01</span>
               <h3 class="serif text-4xl text-stone-800 mb-6">Identity over Mood</h3>
               <p class="text-lg text-stone-600 leading-relaxed mb-6">Don't say "I will try to chant." Say "I am a chanter."<br><br>In spiritual life, we act according to our true self (*svarupa*), not our temporary feelings. When you attach discipline to your identity, you bypass the need for daily willpower.</p>
               <blockquote class="border-l-4 border-orange-300 pl-4 italic text-stone-500 my-4">"This is who I am becoming, so this is what I do."</blockquote>`
    },
    rhythm: {
        title: "Rhythm before Intensity",
        html: `<span class="text-emerald-500 font-bold tracking-widest text-xs uppercase mb-3 block">Pillar 02</span>
               <h3 class="serif text-4xl text-stone-800 mb-6">Rhythm before Intensity</h3>
               <p class="text-lg text-stone-600 leading-relaxed mb-6">Krishna recommends *Abhyāsa-yoga* (practice). This implies regularity.<br><br>The sun does not rise intensely once a week; it rises gently every day. Small daily acts accumulate far more spiritual power than sporadic bursts of passion.</p>`
    },
    structure: {
        title: "Structure is Mercy",
        html: `<span class="text-blue-500 font-bold tracking-widest text-xs uppercase mb-3 block">Pillar 03</span>
               <h3 class="serif text-4xl text-stone-800 mb-6">Structure is Mercy</h3>
               <p class="text-lg text-stone-600 leading-relaxed mb-6">When inspiration fades, *Viddhi-Bhakti* (regulated devotion) takes over.<br><br>Think of your routine not as a cage, but as a safety net. When your mind is weak, the structure holds you up until the natural taste (*Ruci*) returns.</p>`
    },
    resilience: {
        title: "Expect Slips",
        html: `<span class="text-red-500 font-bold tracking-widest text-xs uppercase mb-3 block">Pillar 04</span>
               <h3 class="serif text-4xl text-stone-800 mb-6">Expect Slips</h3>
               <p class="text-lg text-stone-600 leading-relaxed mb-6">Discipline is not never failing; it is returning after falling.<br><br>Krishna tells Arjuna in Gita 2.40: "In this endeavor there is no loss." A slip does not erase your previous service. Just stand up and continue.</p>`
    },
    devotion: {
        title: "Devotion over Pressure",
        html: `<span class="text-purple-500 font-bold tracking-widest text-xs uppercase mb-3 block">Pillar 05</span>
               <h3 class="serif text-4xl text-stone-800 mb-6">Devotion over Pressure</h3>
               <p class="text-lg text-stone-600 leading-relaxed mb-6">Force creates dry friction. Love creates flow.<br><br>When actions are offered with love (*Bhakti*) rather than fear of failure, the mind resists less. Even a small flower offered with genuine love is accepted by the Lord.</p>`
    }
};

function initializePillarContent() {
    switchPillar('identity');
}

function switchPillar(pillarId) {
    const contentDiv = document.getElementById('pillar-content-text');
    contentDiv.innerHTML = PILLAR_CONTENT[pillarId].html;

    // Update tabs with ARIA
    document.querySelectorAll('.pillar-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
    });
    const activeTab = document.getElementById(`tab-${pillarId}`);
    activeTab.classList.add('active');
    activeTab.setAttribute('aria-selected', 'true');

    // Toggle visuals
    document.querySelectorAll('.pillar-visual').forEach(v => v.classList.add('hidden'));
    document.getElementById(`visual-${pillarId}`).classList.remove('hidden');

    // Initialize charts
    if(pillarId === 'rhythm') initRhythmChart();
    if(pillarId === 'resilience') initResilienceChart();
}

// ==========================================
// VISUAL INTERACTIONS
// ==========================================

function runIdentitySim() {
    const action = document.getElementById('sim-action').value.trim();
    if (!action) {
        Toast.warning('Please enter an action');
        return;
    }
    
    const resText = document.getElementById('identity-result-text');
    const resDiv = document.getElementById('identity-result');
    
    // Safe text transformation
    const sanitizedAction = Sanitizer.escapeHTML(action);
    let noun = action.split(' ').pop();
    if(noun.endsWith('ing')) noun = noun.slice(0, -3) + 'er';
    else noun = "servant of " + noun;

    const sanitizedNoun = Sanitizer.escapeHTML(noun);
    resText.innerHTML = `"I am not just doing a task.<br>I am a <span class='text-orange-600'>${sanitizedNoun}</span>."`;
    resDiv.classList.remove('hidden');
}

function initRhythmChart() {
    if(charts.rhythm) return;
    const ctx = document.getElementById('chartRhythm').getContext('2d');
    charts.rhythm = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
            datasets: [{
                label: 'Growth',
                data: [10, 20, 30, 40, 50, 60, 70],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: {display: false} },
            scales: { y: {display: false}, x: {display: false} }
        }
    });
}

function updateRhythmChart(mode) {
    if(!charts.rhythm) return;
    if(mode === 'steady') {
        charts.rhythm.data.datasets[0].data = [10, 20, 30, 40, 50, 60, 70];
        charts.rhythm.data.datasets[0].borderColor = '#10b981';
        charts.rhythm.data.datasets[0].fill = true;
    } else {
        charts.rhythm.data.datasets[0].data = [0, 80, 0, 0, 90, 0, 0];
        charts.rhythm.data.datasets[0].borderColor = '#ef4444';
        charts.rhythm.data.datasets[0].fill = false;
    }
    charts.rhythm.update();
}

function updateStructureVisual(val) {
    const person = document.getElementById('struct-person');
    const net = document.getElementById('struct-net');
    const pillars = document.getElementById('struct-pillars');
    const msg = document.getElementById('struct-msg');
    const slider = document.getElementById('motivation-slider');
    
    slider.setAttribute('aria-valuenow', val);

    if(val < 30) {
        person.style.transform = `translateY(0px)`;
        net.style.opacity = '1';
        pillars.style.opacity = '1';
        Sanitizer.setText(msg, "Motivation Low. Structure holds you up.");
        msg.className = "text-sm font-serif italic mt-4 text-stone-600";
    } else {
        const height = (val - 30) * 1.5;
        person.style.transform = `translateY(-${height}px)`;
        net.style.opacity = '0.3';
        pillars.style.opacity = '0.3';
        Sanitizer.setText(msg, "Motivation High. Spontaneous flow.");
        msg.className = "text-sm font-serif italic mt-4 text-orange-500";
    }
}

function initResilienceChart() {
    if(charts.resilience) return;
    const ctx = document.getElementById('chartResilience').getContext('2d');
    charts.resilience = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Start', 'Day 10', 'Day 20', 'Slip', 'Recovery', 'Day 40'],
            datasets: [{
                label: 'Progress',
                data: [10, 30, 50, 25, 45, 70],
                borderColor: '#57534e',
                segment: {
                    borderColor: ctx => ctx.p0.parsed.y > ctx.p1.parsed.y ? '#ef4444' : '#10b981',
                    borderDash: ctx => ctx.p0.parsed.y > ctx.p1.parsed.y ? [5, 5] : undefined,
                },
                tension: 0.3,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: {display:false} },
            scales: { x: {display:false}, y: {display:false} }
        }
    });
}

function setDevotionMode(mode) {
    const flower = document.getElementById('bhakti-flower');
    const msg = document.getElementById('bhakti-msg');
    
    if(mode === 'love') {
        flower.innerText = "🌺";
        flower.style.transform = "scale(1.5) rotate(0deg)";
        Sanitizer.setText(msg, "Offering accepted instantly.");
        msg.classList.add("text-orange-600", "font-bold");
    } else {
        flower.innerText = "🥀";
        flower.style.transform = "scale(0.8) rotate(45deg)";
        Sanitizer.setText(msg, "The heart feels dry.");
        msg.classList.remove("text-orange-600", "font-bold");
    }
}

// ==========================================
// DATA MANAGEMENT
// ==========================================

async function loadData() {
    try {
        // Try Firebase first (via ModuleData which handles auth state)
        if (typeof ModuleData !== 'undefined') {
            const stored = await ModuleData.get(MODULE_NAME);
            
            if (stored && Object.keys(stored).length > 0) {
                appData = { ...DEFAULT_DATA, ...stored };
            } else {
                // Fall back to localStorage (for backward compatibility / migration)
                const localStored = Storage.get(DB_KEY);
                if (localStored) {
                    appData = { ...DEFAULT_DATA, ...localStored };
                    // Migrate to Firebase if user is logged in
                    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                        await ModuleData.set(MODULE_NAME, appData);
                        Toast.info('Data synced to cloud! ☁️');
                    }
                }
            }
        } else {
            // ModuleData not available, use localStorage only
            const localStored = Storage.get(DB_KEY);
            if (localStored) {
                appData = { ...DEFAULT_DATA, ...localStored };
            }
        }
        
        // Ensure current day exists
        if (!appData.dailyLogs[currentViewDate]) {
            appData.dailyLogs[currentViewDate] = { completedIds: [], nectar: "", notes: "" };
        }
        
        isDataLoaded = true;
    } catch (error) {
        console.error('Load error:', error);
        // Fallback to localStorage on error
        const stored = Storage.get(DB_KEY);
        if (stored) {
            appData = { ...DEFAULT_DATA, ...stored };
        }
        if (!appData.dailyLogs[currentViewDate]) {
            appData.dailyLogs[currentViewDate] = { completedIds: [], nectar: "", notes: "" };
        }
        isDataLoaded = true;
    }
}

async function saveData() {
    try {
        // Save to Firebase (via ModuleData) if available
        if (typeof ModuleData !== 'undefined') {
            const success = await ModuleData.set(MODULE_NAME, appData);
            
            // Also save to localStorage as backup
            Storage.set(DB_KEY, appData);
            
            if (success) {
                showSaveStatus();
            }
            return success;
        } else {
            // ModuleData not available, use localStorage only
            Storage.set(DB_KEY, appData);
            showSaveStatus();
            return true;
        }
    } catch (error) {
        console.error('Save error:', error);
        // Fallback to localStorage on error
        Storage.set(DB_KEY, appData);
        showSaveStatus();
        return true;
    }
}

function showSaveStatus() {
    const el = document.getElementById('saveStatus');
    el.classList.remove('opacity-0');
    setTimeout(() => el.classList.add('opacity-0'), 2000);
}

// ==========================================
// DASHBOARD RENDERING
// ==========================================

function renderDashboard() {
    renderIdentity();
    renderRituals();
    renderChecklist();
    renderGarden();
    renderJournalHistory();
}

function renderIdentity() {
    const disp = document.getElementById('identityDisplay');
    const edit = document.getElementById('identityEdit');
    const txt = document.getElementById('identityText');
    
    if(appData.identity) {
        disp.classList.remove('hidden');
        edit.classList.add('hidden');
        // Use textContent for security
        Sanitizer.setText(txt, `"I am ${appData.identity}"`);
    } else {
        disp.classList.add('hidden');
        edit.classList.remove('hidden');
    }
}

function renderRituals() {
    const list = document.getElementById('ritualList');
    list.innerHTML = '';
    
    appData.myRituals.forEach(r => {
        const el = document.createElement('div');
        el.className = 'flex justify-between items-center bg-stone-50 p-2 rounded border border-stone-200 text-xs';
        el.setAttribute('role', 'listitem');
        
        // Create elements safely
        const container = document.createElement('div');
        container.className = 'flex items-center';
        
        const emoji = document.createElement('span');
        emoji.className = 'text-base mr-2';
        emoji.textContent = r.emoji;
        
        const name = document.createElement('span');
        name.className = 'font-bold text-stone-700';
        name.textContent = r.name;
        
        const time = document.createElement('span');
        time.className = 'ml-2 text-stone-400';
        time.textContent = `(${r.time}m)`;
        
        container.appendChild(emoji);
        container.appendChild(name);
        container.appendChild(time);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-stone-300 hover:text-red-500 font-bold px-2';
        deleteBtn.textContent = '×';
        deleteBtn.onclick = () => deleteRitual(r.id);
        deleteBtn.setAttribute('aria-label', `Delete ${r.name} ritual`);
        
        el.appendChild(container);
        el.appendChild(deleteBtn);
        list.appendChild(el);
    });
}

function renderChecklist() {
    const container = document.getElementById('todayRitualsList');
    container.innerHTML = '';
    const log = appData.dailyLogs[currentViewDate] || { completedIds: [], nectar: "", notes: "" };

    if (appData.myRituals.length === 0) {
        const msg = document.createElement('p');
        msg.className = 'text-stone-400 italic text-xs col-span-2 text-center';
        msg.textContent = 'Add a service to begin.';
        container.appendChild(msg);
        return;
    }

    appData.myRituals.forEach(r => {
        const isChecked = log.completedIds.includes(r.id);
        const div = document.createElement('div');
        div.setAttribute('role', 'listitem');
        
        const label = document.createElement('label');
        label.className = 'cursor-pointer relative block h-full group';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'ritual-checkbox hidden';
        checkbox.checked = isChecked;
        checkbox.onchange = () => toggleCheck(r.id);
        checkbox.setAttribute('aria-label', `Mark ${r.name} as complete`);
        
        const card = document.createElement('div');
        card.className = 'flex items-center p-3 rounded-lg border border-stone-200 bg-white group-hover:border-orange-200 transition-all h-full shadow-sm';
        
        const iconContainer = document.createElement('div');
        iconContainer.className = `w-10 h-10 flex items-center justify-center bg-stone-50 rounded-full mr-3 text-xl transition-colors ${isChecked ? 'bg-emerald-100' : ''}`;
        iconContainer.textContent = r.emoji;
        
        const textContainer = document.createElement('div');
        textContainer.className = 'flex-1';
        
        const title = document.createElement('h4');
        title.className = `font-bold text-stone-700 text-sm ${isChecked ? 'line-through opacity-50' : ''}`;
        title.textContent = r.name;
        
        const duration = document.createElement('p');
        duration.className = 'text-[10px] text-stone-400';
        duration.textContent = `${r.time} mins`;
        
        textContainer.appendChild(title);
        textContainer.appendChild(duration);
        
        const checkIcon = document.createElement('div');
        checkIcon.className = 'check-icon opacity-0 transform scale-50 transition-all text-emerald-500 text-xl font-bold';
        checkIcon.textContent = '✓';
        
        card.appendChild(iconContainer);
        card.appendChild(textContainer);
        card.appendChild(checkIcon);
        
        label.appendChild(checkbox);
        label.appendChild(card);
        div.appendChild(label);
        container.appendChild(div);
    });

    // Update score
    const pct = appData.myRituals.length > 0 
        ? Math.round((log.completedIds.length / appData.myRituals.length) * 100) 
        : 0;
    document.getElementById('dailyScore').textContent = `${pct}%`;
}

function renderGarden() {
    const grid = document.getElementById('gardenGrid');
    grid.innerHTML = '';
    const today = new Date();
    
    // Last 42 days (6 weeks)
    for (let i = 41; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = DateUtils.toISODate(d);
        const log = appData.dailyLogs[key];
        
        const cell = document.createElement('div');
        cell.className = 'garden-cell bg-stone-100';
        cell.setAttribute('data-date', key);
        cell.setAttribute('role', 'button');
        cell.setAttribute('aria-label', `View entry for ${DateUtils.formatDisplay(key, {month: 'short'})}`);
        cell.title = key;
        cell.onclick = () => showDayDetail(key);
        cell.onkeypress = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showDayDetail(key);
            }
        };
        cell.tabIndex = 0;

        if (log) {
            const hasRitual = log.completedIds && log.completedIds.length > 0;
            const hasNote = (log.nectar && log.nectar.trim()) || (log.notes && log.notes.trim());

            if (hasRitual) {
                cell.classList.remove('bg-stone-100');
                cell.classList.add('bg-emerald-400');
            } else if (hasNote) {
                cell.classList.remove('bg-stone-100');
                cell.classList.add('bg-orange-200');
            }
        }
        grid.appendChild(cell);
    }
}

function renderJournalHistory() {
    const cont = document.getElementById('recentJournalEntries');
    cont.innerHTML = '';
    const entries = Object.keys(appData.dailyLogs)
        .sort().reverse()
        .filter(k => {
            const l = appData.dailyLogs[k];
            return (l.nectar && l.nectar.trim()) || (l.notes && l.notes.trim());
        })
        .slice(0, 3);
    
    if(entries.length === 0) {
        const msg = document.createElement('p');
        msg.className = 'text-xs text-stone-400 italic';
        msg.textContent = 'No nectar recorded yet.';
        cont.appendChild(msg);
        return;
    }

    entries.forEach(k => {
        const log = appData.dailyLogs[k];
        const dateStr = DateUtils.formatDisplay(k, {month:'short', weekday: undefined});
        
        const div = document.createElement('div');
        div.className = 'bg-stone-50 p-3 rounded-lg border border-stone-200 text-sm';
        div.setAttribute('role', 'listitem');
        
        const dateEl = document.createElement('span');
        dateEl.className = 'font-bold text-xs text-stone-700';
        dateEl.textContent = dateStr;
        
        const header = document.createElement('div');
        header.className = 'flex justify-between mb-1';
        header.appendChild(dateEl);
        
        div.appendChild(header);
        
        if(log.nectar) {
            const nectarDiv = document.createElement('div');
            nectarDiv.className = 'mb-1';
            
            const label = document.createElement('span');
            label.className = 'text-orange-500 text-[10px] uppercase font-bold';
            label.textContent = 'Nectar';
            
            const text = document.createElement('span');
            text.className = 'italic text-stone-600';
            text.textContent = ` "${log.nectar}"`;
            
            nectarDiv.appendChild(label);
            nectarDiv.appendChild(text);
            div.appendChild(nectarDiv);
        }
        
        if(log.notes) {
            const notesDiv = document.createElement('div');
            
            const label = document.createElement('span');
            label.className = 'text-stone-400 text-[10px] uppercase font-bold';
            label.textContent = 'Note';
            
            const text = document.createElement('span');
            text.className = 'text-stone-500';
            text.textContent = ` ${log.notes}`;
            
            notesDiv.appendChild(label);
            notesDiv.appendChild(text);
            div.appendChild(notesDiv);
        }
        
        cont.appendChild(div);
    });
}

// ==========================================
// INTERACTION HANDLERS
// ==========================================

function saveIdentity() {
    const val = document.getElementById('identityInput').value.trim();
    if(val) {
        const sanitized = Validator.text(val, 200);
        appData.identity = sanitized;
        saveData();
        renderIdentity();
        Toast.success('Identity saved!');
    }
}

function editIdentity() {
    appData.identity = "";
    saveData();
    renderIdentity();
}

function addCustomRitual() {
    const name = document.getElementById('newRitualName').value.trim();
    const time = document.getElementById('newRitualTime').value;
    const emoji = document.getElementById('newRitualEmoji').value;
    
    // Validation
    if(!Validator.ritualName(name)) {
        Toast.error('Please enter a valid ritual name (1-100 characters)');
        return;
    }
    
    if(!Validator.ritualTime(time)) {
        Toast.error('Please enter time between 1-1440 minutes');
        return;
    }
    
    const sanitizedName = Validator.text(name, 100);
    appData.myRituals.push({
        id: Date.now(),
        name: sanitizedName,
        time: parseInt(time),
        emoji
    });
    
    document.getElementById('newRitualName').value = "";
    document.getElementById('newRitualTime').value = "";
    
    saveData();
    renderRituals();
    renderChecklist();
    Toast.success('Ritual added!');
}

function deleteRitual(id) {
    if(confirm("Remove this service? This will not delete past logs.")) {
        appData.myRituals = appData.myRituals.filter(r => r.id !== id);
        saveData();
        renderRituals();
        renderChecklist();
        Toast.success('Ritual removed');
    }
}

function toggleCheck(id) {
    const log = appData.dailyLogs[currentViewDate];
    const idx = log.completedIds.indexOf(id);
    if(idx > -1) {
        log.completedIds.splice(idx, 1);
    } else {
        log.completedIds.push(id);
        const ritual = appData.myRituals.find(r => r.id === id);
        if(ritual) {
            Toast.success(`${ritual.name} completed! 🙏`);
        }
    }
    saveData();
    renderChecklist();
    renderGarden();
}

function setupAutoSave() {
    const nectar = document.getElementById('dailyNectar');
    const notes = document.getElementById('dailyNotes');
    const log = appData.dailyLogs[currentViewDate];
    
    if(log) {
        nectar.value = log.nectar || "";
        notes.value = log.notes || "";
    }
    
    nectar.addEventListener('input', e => {
        appData.dailyLogs[currentViewDate].nectar = Validator.text(e.target.value, 1000);
        debouncedSave();
    });
    
    notes.addEventListener('input', e => {
        appData.dailyLogs[currentViewDate].notes = Validator.text(e.target.value, 1000);
        debouncedSave();
    });
}

function updateDateDisplay() {
    document.getElementById('currentDateDisplay').textContent = 
        DateUtils.formatDisplay(currentViewDate);
}

// ==========================================
// DATE NAVIGATION
// ==========================================

function showDatePicker() {
    const picker = document.createElement('input');
    picker.type = 'date';
    picker.max = DateUtils.toISODate();
    picker.value = currentViewDate;
    picker.style.position = 'absolute';
    picker.style.opacity = '0';
    
    picker.onchange = (e) => {
        loadDayData(e.target.value);
        picker.remove();
    };
    
    document.body.appendChild(picker);
    picker.showPicker();
}

function loadDayData(dateStr) {
    if (!Validator.date(dateStr)) {
        Toast.error('Invalid date');
        return;
    }
    
    currentViewDate = dateStr;
    
    if (!appData.dailyLogs[currentViewDate]) {
        appData.dailyLogs[currentViewDate] = { completedIds: [], nectar: "", notes: "" };
    }
    
    updateDateDisplay();
    renderChecklist();
    
    // Update journal inputs
    const log = appData.dailyLogs[currentViewDate];
    document.getElementById('dailyNectar').value = log.nectar || "";
    document.getElementById('dailyNotes').value = log.notes || "";
    
    Toast.info(`Viewing ${DateUtils.formatDisplay(currentViewDate, {month: 'short'})}`);
}

// ==========================================
// DAY DETAIL MODAL
// ==========================================

function showDayDetail(dateStr) {
    const modal = document.getElementById('dayModal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    title.textContent = DateUtils.formatDisplay(dateStr);
    
    const log = appData.dailyLogs[dateStr];
    
    if (!log || (!log.completedIds.length && !log.nectar && !log.notes)) {
        body.innerHTML = '<p class="text-stone-500 italic">No activity recorded for this day.</p>';
    } else {
        let html = '';
        
        // Completed rituals
        if (log.completedIds.length > 0) {
            html += '<div class="mb-4"><h4 class="font-bold text-stone-700 mb-2">Completed Services:</h4><ul class="space-y-1">';
            log.completedIds.forEach(id => {
                const ritual = appData.myRituals.find(r => r.id === id);
                if (ritual) {
                    html += `<li class="flex items-center gap-2"><span>${Sanitizer.escapeHTML(ritual.emoji)}</span><span>${Sanitizer.escapeHTML(ritual.name)}</span></li>`;
                }
            });
            html += '</ul></div>';
        }
        
        // Nectar
        if (log.nectar && log.nectar.trim()) {
            html += `<div class="mb-4 p-3 bg-orange-50 rounded"><p class="text-xs text-orange-600 font-bold mb-1">NECTAR</p><p class="text-stone-700 italic">"${Sanitizer.escapeHTML(log.nectar)}"</p></div>`;
        }
        
        // Notes
        if (log.notes && log.notes.trim()) {
            html += `<div class="p-3 bg-stone-50 rounded"><p class="text-xs text-stone-500 font-bold mb-1">NOTES</p><p class="text-stone-600">${Sanitizer.escapeHTML(log.notes)}</p></div>`;
        }
        
        body.innerHTML = html;
    }
    
    // Add view full day button
    const viewButton = document.createElement('button');
    viewButton.className = 'mt-4 w-full bg-orange-100 text-orange-800 hover:bg-orange-200 py-2 rounded text-sm font-bold';
    viewButton.textContent = 'View Full Day';
    viewButton.onclick = () => {
        loadDayData(dateStr);
        closeDayModal();
        scrollToSection('dashboard');
    };
    body.appendChild(viewButton);
    
    modal.classList.add('active');
}

function closeDayModal(event) {
    if (!event || event.target.id === 'dayModal') {
        document.getElementById('dayModal').classList.remove('active');
    }
}

// ==========================================
// DATA IMPORT/EXPORT
// ==========================================

async function clearData() {
    if(confirm("⚠️ Reset all data? This cannot be undone!\n\nConsider exporting a backup first.")) {
        if(confirm("Are you absolutely sure? All rituals, logs, and journal entries will be deleted.")) {
            // Clear both localStorage and Firebase
            Storage.remove(DB_KEY);
            if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser && typeof ModuleData !== 'undefined') {
                await ModuleData.set(MODULE_NAME, DEFAULT_DATA);
            }
            Toast.success('Data cleared. Reloading...');
            setTimeout(() => location.reload(), 1000);
        }
    }
}

function exportData() {
    try {
        const dataStr = JSON.stringify(appData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `sadhana_backup_${TODAY_KEY}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        Toast.success('Backup downloaded!');
    } catch (error) {
        console.error('Export error:', error);
        Toast.error('Failed to export data');
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                
                // Basic validation
                if (!imported.myRituals || !imported.dailyLogs) {
                    throw new Error('Invalid backup file format');
                }
                
                if(confirm('This will replace all current data. Continue?')) {
                    appData = { ...DEFAULT_DATA, ...imported };
                    saveData();
                    renderDashboard();
                    Toast.success('Data imported successfully!');
                }
            } catch (error) {
                console.error('Import error:', error);
                Toast.error('Invalid backup file. Please check the file and try again.');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// ==========================================
// UTILITIES
// ==========================================

function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const button = document.getElementById('mobile-menu-button');
    const isExpanded = menu.classList.contains('hidden');
    
    menu.classList.toggle('hidden');
    button.setAttribute('aria-expanded', isExpanded);
}
