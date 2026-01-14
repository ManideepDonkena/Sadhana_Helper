/**
 * MIND STATE LAB - LOGIC CORE
 * Contains state management, test logic, Firebase sync, and render loops.
 */

// Firebase config - must match main app's firebase-config.js
const LAB_FIREBASE_CONFIG = {
    apiKey: "AIzaSyB9vdSNAUN4903GJWBJJoIIEhqSEOjajnw",
    authDomain: "my-website-11127.firebaseapp.com",
    projectId: "my-website-11127",
    storageBucket: "my-website-11127.firebasestorage.app",
    messagingSenderId: "766689827734",
    appId: "1:766689827734:web:7011801e380debecb5dbb7",
    measurementId: "G-0DEELR4DW0"
};

const LAB_MODULE_NAME = 'lab';
const LAB_STORAGE_KEY = 'mind_state_lab_results';

// Firebase Manager for Lab module
class LabFirebaseManager {
    constructor() {
        this.initialized = false;
        this.user = null;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Check if FirebaseManager from firebase-config.js is available
            if (typeof FirebaseManager !== 'undefined') {
                const result = await FirebaseManager.init();
                if (result) {
                    this.user = FirebaseManager.getUser();
                    FirebaseManager.onAuthChange((user) => {
                        this.user = user;
                        if (user) {
                            this.migrateLocalToFirebase();
                            this.syncFromFirebase();
                        }
                    });
                    this.initialized = true;
                    console.log('Lab: Using FirebaseManager');
                    return;
                }
            }
            
            // Fallback: Check if Firebase is already loaded globally
            if (typeof firebase === 'undefined') {
                await this.loadFirebaseScripts();
            }
            
            // Initialize if not already done
            if (!firebase.apps.length) {
                firebase.initializeApp(LAB_FIREBASE_CONFIG);
            }
            
            // Listen for auth state changes
            firebase.auth().onAuthStateChanged((user) => {
                this.user = user;
                if (user) {
                    this.migrateLocalToFirebase();
                    this.syncFromFirebase();
                }
            });
            
            this.initialized = true;
            console.log('Lab: Using direct Firebase');
        } catch (error) {
            console.warn('Firebase init failed, using localStorage only:', error);
        }
    }

    async loadFirebaseScripts() {
        const scripts = [
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js'
        ];

        for (const src of scripts) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
    }

    isLoggedIn() {
        return !!this.user;
    }

    async getModuleData() {
        if (!this.isLoggedIn()) return null;
        
        try {
            const doc = await firebase.firestore()
                .collection('users')
                .doc(this.user.uid)
                .collection('modules')
                .doc(LAB_MODULE_NAME)
                .get();
            
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.warn('Failed to get Firebase data:', error);
            return null;
        }
    }

    async setModuleData(data) {
        if (!this.isLoggedIn()) return false;
        
        try {
            await firebase.firestore()
                .collection('users')
                .doc(this.user.uid)
                .collection('modules')
                .doc(LAB_MODULE_NAME)
                .set(data, { merge: true });
            
            console.log('Lab data saved to Firebase');
            return true;
        } catch (error) {
            console.warn('Failed to save to Firebase:', error);
            return false;
        }
    }

    async migrateLocalToFirebase() {
        const existingData = await this.getModuleData();
        const localData = JSON.parse(localStorage.getItem(LAB_STORAGE_KEY) || 'null');
        
        if (!existingData && localData) {
            await this.setModuleData({ 
                testResults: localData,
                lastUpdated: new Date().toISOString()
            });
            console.log('Lab data migrated to Firebase');
        }
    }
    
    async syncFromFirebase() {
        const firebaseData = await this.getModuleData();
        if (firebaseData && firebaseData.testResults) {
            const localData = JSON.parse(localStorage.getItem(LAB_STORAGE_KEY) || '{}');
            
            // Merge: Firebase wins for older data, local wins for newer
            const merged = this.mergeResults(localData, firebaseData.testResults);
            localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(merged));
            console.log('Lab data synced from Firebase');
        }
    }
    
    mergeResults(local, remote) {
        const merged = { ...remote };
        
        for (const testName of Object.keys(local)) {
            if (!merged[testName]) {
                merged[testName] = local[testName];
            } else {
                // Merge histories, keep unique by date
                const allHistory = [...(merged[testName].history || []), ...(local[testName].history || [])];
                const unique = [];
                const seen = new Set();
                
                for (const item of allHistory) {
                    const key = item.date + item.score;
                    if (!seen.has(key)) {
                        seen.add(key);
                        unique.push(item);
                    }
                }
                
                // Sort by date descending and keep last 20
                unique.sort((a, b) => new Date(b.date) - new Date(a.date));
                merged[testName].history = unique.slice(0, 20);
                
                // Update best score
                merged[testName].bestScore = Math.max(
                    merged[testName].bestScore || 0,
                    local[testName].bestScore || 0
                );
            }
        }
        
        return merged;
    }
}

// Initialize Firebase manager
const labFirebase = new LabFirebaseManager();
labFirebase.init();

// Test Results Storage
const TestResults = {
    getResults() {
        try {
            return JSON.parse(localStorage.getItem(LAB_STORAGE_KEY) || '{}');
        } catch {
            return {};
        }
    },

    async saveResult(testName, score, title, description) {
        const results = this.getResults();
        const now = new Date().toISOString();
        
        if (!results[testName]) {
            results[testName] = {
                history: [],
                bestScore: 0,
                totalAttempts: 0
            };
        }

        const scoreNum = parseInt(score) || 0;
        
        // Increment total attempts
        results[testName].totalAttempts = (results[testName].totalAttempts || 0) + 1;
        
        // Add to history (keep last 20)
        results[testName].history.unshift({
            score: scoreNum,
            title: title,
            description: description,
            date: now,
            attempt: results[testName].totalAttempts
        });
        
        if (results[testName].history.length > 20) {
            results[testName].history = results[testName].history.slice(0, 20);
        }

        // Update best score
        if (scoreNum > results[testName].bestScore) {
            results[testName].bestScore = scoreNum;
        }
        
        // Calculate average
        const scores = results[testName].history.map(h => h.score);
        results[testName].averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

        // Save to localStorage
        localStorage.setItem(LAB_STORAGE_KEY, JSON.stringify(results));

        // Save to Firebase (fire-and-forget)
        if (labFirebase.isLoggedIn()) {
            await labFirebase.setModuleData({ 
                testResults: results,
                lastUpdated: now
            });
        }

        return results[testName];
    },

    getBestScore(testName) {
        const results = this.getResults();
        return results[testName]?.bestScore || 0;
    },

    getTestHistory(testName) {
        const results = this.getResults();
        return results[testName]?.history || [];
    },
    
    clearAll() {
        localStorage.removeItem(LAB_STORAGE_KEY);
        if (labFirebase.isLoggedIn()) {
            labFirebase.setModuleData({ testResults: {}, lastUpdated: new Date().toISOString() });
        }
    }
};

// Lab History UI Manager
const LabHistory = {
    testNames: {
        orb: 'Focus Orb',
        circle: 'Zen Circle',
        impulse: "Don't Click",
        steady: 'Microscope',
        breath: 'Breath Sync',
        vigilance: 'Vigilance',
        grounding: 'Grounding'
    },
    
    show() {
        const modal = document.getElementById('history-modal');
        const body = document.getElementById('history-body');
        const results = TestResults.getResults();
        
        if (Object.keys(results).length === 0) {
            body.innerHTML = `
                <div class="history-empty">
                    <p>🧪 No test results yet</p>
                    <p>Complete some tests to see your history!</p>
                </div>
            `;
        } else {
            let html = '';
            
            for (const [testKey, data] of Object.entries(results)) {
                const testName = this.testNames[testKey] || testKey;
                
                html += `
                    <div class="history-test">
                        <div class="history-test-name">
                            <span>${testName}</span>
                            <span class="history-best">Best: ${data.bestScore}%</span>
                        </div>
                `;
                
                if (data.history && data.history.length > 0) {
                    for (const item of data.history.slice(0, 5)) {
                        const date = new Date(item.date).toLocaleDateString();
                        const scoreColor = item.score >= 80 ? '#4ade80' : (item.score >= 50 ? '#facc15' : '#f87171');
                        
                        html += `
                            <div class="history-item">
                                <div>
                                    <div class="history-item-score" style="color: ${scoreColor}">${item.score}%</div>
                                    <div class="history-item-title">${item.title}</div>
                                </div>
                                <div class="history-item-date">${date}</div>
                            </div>
                        `;
                    }
                    
                    if (data.history.length > 5) {
                        html += `<div style="text-align: center; color: #666; font-size: 0.8rem; padding: 5px;">
                            + ${data.history.length - 5} more entries
                        </div>`;
                    }
                }
                
                html += `</div>`;
            }
            
            body.innerHTML = html;
        }
        
        modal.classList.add('active');
    },
    
    hide() {
        document.getElementById('history-modal').classList.remove('active');
    },
    
    clearAll() {
        if (confirm('⚠️ Delete all test history? This cannot be undone!')) {
            TestResults.clearAll();
            this.hide();
            if (typeof Toast !== 'undefined') {
                Toast.show('History cleared', 'success');
            }
        }
    },
    
    exportData() {
        const results = TestResults.getResults();
        const exportData = {
            exportDate: new Date().toISOString(),
            appName: 'Mind State Lab',
            version: '1.0',
            user: labFirebase.user?.email || 'anonymous',
            testResults: results,
            summary: this.generateSummary(results)
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `mindstate-lab-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (typeof Toast !== 'undefined') {
            Toast.show('Data exported successfully!', 'success');
        }
    },
    
    generateSummary(results) {
        const summary = {
            totalTests: 0,
            testsCompleted: Object.keys(results).length,
            overallAverageScore: 0,
            bestPerformingTest: null,
            worstPerformingTest: null
        };
        
        let totalScore = 0;
        let bestScore = 0;
        let worstScore = 100;
        
        for (const [testKey, data] of Object.entries(results)) {
            summary.totalTests += data.totalAttempts || data.history?.length || 0;
            
            if (data.bestScore > bestScore) {
                bestScore = data.bestScore;
                summary.bestPerformingTest = { name: this.testNames[testKey], score: data.bestScore };
            }
            
            if (data.averageScore && data.averageScore < worstScore) {
                worstScore = data.averageScore;
                summary.worstPerformingTest = { name: this.testNames[testKey], score: data.averageScore };
            }
            
            totalScore += data.averageScore || data.bestScore || 0;
        }
        
        summary.overallAverageScore = Math.round(totalScore / Object.keys(results).length) || 0;
        
        return summary;
    }
};

const App = {
    activeTest: null,
    rafId: null,
    timerId: null,
    timeouts: [], // Track active timeouts
    currentTestName: null,

    elements: {
        menu: document.getElementById('menu-screen'),
        game: document.getElementById('game-interface'),
        container: document.getElementById('test-container'),
        canvas: document.getElementById('game-canvas-layer'),
        timer: document.getElementById('hud-timer'),
        results: document.getElementById('result-modal'),
        resScore: document.getElementById('res-score'),
        resTitle: document.getElementById('res-title'),
        resDesc: document.getElementById('res-desc'),
    },

    // Wrapper for setTimeout to track IDs
    setTimeout(fn, delay) {
        const id = window.setTimeout(() => {
            fn();
            // Remove from array after execution
            this.timeouts = this.timeouts.filter(t => t !== id);
        }, delay);
        this.timeouts.push(id);
        return id;
    },

    startTest(testName) {
        this.currentTestName = testName;
        this.elements.menu.classList.add('hidden');
        this.elements.results.style.display = 'none';
        this.elements.game.style.display = 'flex';
        this.elements.container.innerHTML = ''; // Clear previous test elements

        // Reset Canvas
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas);

        // Initialize specific test
        if (Tests[testName]) {
            this.activeTest = Tests[testName];
            this.activeTest.init(this.elements.container, this.elements.canvas, this.elements.timer);
        }
    },

    resizeCanvas() {
        const canvas = document.getElementById('game-canvas-layer');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    },

    finishTest(score, title, description) {
        this.cleanup();
        this.elements.results.style.display = 'flex';
        this.elements.resScore.innerText = score;
        this.elements.resTitle.innerText = title;
        this.elements.resDesc.innerText = description;

        // Color coding
        const val = parseInt(score);
        const color = val >= 80 ? '#4ade80' : (val >= 50 ? '#facc15' : '#f87171');
        this.elements.resScore.style.color = color;
        this.elements.resTitle.style.color = color;

        // Save result to history
        if (this.currentTestName) {
            TestResults.saveResult(this.currentTestName, score, title, description);
        }
    },

    returnToMenu() {
        this.cleanup();
        this.elements.game.style.display = 'none';
        this.elements.results.style.display = 'none';
        this.elements.menu.classList.remove('hidden');
        this.currentTestName = null;
    },

    cleanup() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.timerId) clearInterval(this.timerId);

        // Clear tracked timeouts
        this.timeouts.forEach(id => window.clearTimeout(id));
        this.timeouts = [];

        if (this.activeTest && this.activeTest.cleanup) {
            this.activeTest.cleanup();
        }

        window.removeEventListener('resize', this.resizeCanvas);
        document.body.style.cursor = 'default';
    }
};

/* --- INDIVIDUAL TEST LOGIC --- */

const Tests = {

    // TEST 1: FOCUS ORB
    orb: {
        init(container, canvas, timerEl) {
            // Setup
            const orb = document.createElement('div');
            orb.id = 'orb-target';
            container.appendChild(orb);

            let timeLeft = 30;
            let totalFrames = 0;
            let focusFrames = 0;
            let orbX = window.innerWidth / 2, orbY = window.innerHeight / 2;
            // Fix: Start target away from orb to avoid div by zero
            let targetX = orbX + 100, targetY = orbY + 100;
            let mouseX = orbX, mouseY = orbY;

            // Mouse Tracker
            this.moveHandler = (e) => { mouseX = e.clientX; mouseY = e.clientY; };
            document.addEventListener('mousemove', this.moveHandler);
            document.body.style.cursor = 'none';

            // Create Player Cursor
            const playerCursor = document.createElement('div');
            playerCursor.style.width = '10px';
            playerCursor.style.height = '10px';
            playerCursor.style.background = '#fff';
            playerCursor.style.borderRadius = '50%';
            playerCursor.style.position = 'absolute';
            playerCursor.style.pointerEvents = 'none';
            playerCursor.style.transform = 'translate(-50%, -50%)';
            playerCursor.style.zIndex = '100';
            playerCursor.style.boxShadow = '0 0 10px #fff';
            container.appendChild(playerCursor);

            // Loop
            const loop = () => {
                totalFrames++;

                // Move Orb
                const dx = targetX - orbX;
                const dy = targetY - orbY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 20) {
                    targetX = 50 + Math.random() * (window.innerWidth - 100);
                    targetY = 50 + Math.random() * (window.innerHeight - 100);
                }

                if (dist > 0) {
                    orbX += (dx / dist) * 3; // Speed
                    orbY += (dy / dist) * 3;
                }

                orb.style.left = orbX + 'px';
                orb.style.top = orbY + 'px';

                // Update Player Cursor
                playerCursor.style.left = mouseX + 'px';
                playerCursor.style.top = mouseY + 'px';

                // Check collision
                const mDist = Math.hypot(mouseX - orbX, mouseY - orbY);
                if (mDist < 45) {
                    focusFrames++;
                    orb.style.borderColor = '#38bdf8';
                    orb.style.backgroundColor = 'rgba(56,189,248,0.6)';
                } else {
                    orb.style.borderColor = '#f87171';
                    orb.style.backgroundColor = 'rgba(248,113,113,0.2)';
                }

                App.rafId = requestAnimationFrame(loop);
            };
            loop();

            // Timer
            App.timerId = setInterval(() => {
                timeLeft--;
                timerEl.innerText = timeLeft + 's';
                if (timeLeft <= 0) {
                    const score = Math.round((focusFrames / totalFrames) * 100);
                    let title = score > 80 ? "Laser Focus" : (score > 50 ? "Drifting" : "Restless");
                    let desc = score > 80 ? "Your sustained attention is excellent." : "Your mind wandered frequently.";
                    App.finishTest(score + "%", title, desc);
                }
            }, 1000);
        },
        cleanup() {
            document.removeEventListener('mousemove', this.moveHandler);
        }
    },

    // TEST 2: IMPULSE CONTROL
    impulse: {
        init(container, canvas, timerEl) {
            const btn = document.createElement('div');
            btn.id = 'impulse-btn';
            btn.innerText = "WAIT";
            container.appendChild(btn);

            let timeLeft = 15; // Survival time
            let state = 'wait'; // wait, safe, danger
            let clicks = 0;
            let mistakes = 0;

            timerEl.innerText = "Survive 15s";

            // Logic to change button state
            const scheduleChange = () => {
                if (timeLeft <= 0) return;

                const delay = 500 + Math.random() * 1500;
                App.setTimeout(() => {
                    if (Math.random() > 0.4) {
                        // Danger Trigger
                        state = 'danger';
                        btn.className = 'impulse-danger';
                        btn.innerText = "DON'T CLICK";
                        // Quick switch back
                        App.setTimeout(() => {
                            state = 'wait';
                            btn.className = '';
                            btn.innerText = "WAIT";
                            scheduleChange();
                        }, 1000 + Math.random() * 1000);
                    } else {
                        // Safe Trigger
                        state = 'safe';
                        btn.className = 'impulse-safe';
                        btn.innerText = "CLICK NOW!";
                        App.setTimeout(() => {
                            state = 'wait';
                            btn.className = '';
                            btn.innerText = "WAIT";
                            scheduleChange();
                        }, 800);
                    }
                }, delay);
            };

            scheduleChange();

            // Click Handler
            btn.onmousedown = () => {
                if (state === 'danger' || state === 'wait') {
                    mistakes++;
                    container.style.backgroundColor = 'rgba(248,113,113,0.2)';
                    App.setTimeout(() => container.style.backgroundColor = 'transparent', 100);
                } else if (state === 'safe') {
                    clicks++; // Bonus
                }
            };

            // Timer
            App.timerId = setInterval(() => {
                timeLeft--;
                timerEl.innerText = timeLeft + 's';
                if (timeLeft <= 0) {
                    const score = Math.max(0, 100 - (mistakes * 20));
                    let title = mistakes === 0 ? "Stoic Mind" : "Impulsive";
                    let desc = `You clicked wrongly ${mistakes} times.`;
                    App.finishTest(score + "%", title, desc);
                }
            }, 1000);
        },
        cleanup() { }
    },

    // TEST 3: VIGILANCE
    vigilance: {
        init(container, canvas, timerEl) {
            const grid = document.createElement('div');
            grid.id = 'grid-container';
            // Create 9 boxes
            const boxes = [];
            for (let i = 0; i < 9; i++) {
                let b = document.createElement('div');
                b.className = 'grid-box';
                b.dataset.id = i;
                grid.appendChild(b);
                boxes.push(b);
            }
            container.appendChild(grid);

            let reactionTimes = [];
            let activeIdx = -1;
            let lastTime = 0;
            let count = 0;
            const MAX_TRIALS = 5;
            timerEl.innerText = "Wait for flash...";

            // Click Handler
            grid.onmousedown = (e) => {
                if (e.target.classList.contains('active')) {
                    const reaction = Date.now() - lastTime;
                    reactionTimes.push(reaction);
                    e.target.classList.remove('active');
                    container.style.backgroundColor = 'transparent'; // Reset flash
                    activeIdx = -1;
                    count++;

                    if (count >= MAX_TRIALS) {
                        endGame();
                    } else {
                        scheduleFlash();
                    }
                }
            };

            const scheduleFlash = () => {
                const delay = 1000 + Math.random() * 2000;
                App.setTimeout(() => {
                    activeIdx = Math.floor(Math.random() * 9);
                    boxes[activeIdx].classList.add('active');
                    // Visual flash for whole container
                    container.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    lastTime = Date.now();
                }, delay);
            };

            scheduleFlash();

            const endGame = () => {
                const avg = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
                // Score: <300ms is 100%, 1000ms is 0%
                let score = Math.max(0, Math.min(100, Math.round(100 - ((avg - 250) / 5))));
                App.finishTest(score + "%", "Reaction Time: " + Math.round(avg) + "ms", "Lower is better. <300ms is elite.");
            };
        },
        cleanup() { }
    },

    // TEST 4: ZEN CIRCLE (Drawing)
    circle: {
        init(container, canvas, timerEl) {
            const ctx = canvas.getContext('2d');
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            const r = 150;
            let drawing = false;
            let points = [];
            let timeLeft = 15;

            timerEl.innerText = "Trace the blue circle slowly";

            // Draw Guide
            const drawGuide = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 10;
                ctx.stroke();

                // User line
                if (points.length > 0) {
                    ctx.beginPath();
                    ctx.moveTo(points[0].x, points[0].y);
                    for (let p of points) ctx.lineTo(p.x, p.y);
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 4;
                    ctx.stroke();
                }
            };
            drawGuide();

            this.moveHandler = (e) => {
                if (drawing) {
                    points.push({ x: e.clientX, y: e.clientY });
                    drawGuide();
                }
            };

            this.downHandler = () => { drawing = true; points = []; };
            this.upHandler = () => {
                if (drawing) endGame();
                drawing = false;
            };

            document.addEventListener('mousemove', this.moveHandler);
            document.addEventListener('mousedown', this.downHandler);
            document.addEventListener('mouseup', this.upHandler);

            const endGame = () => {
                // Calculate deviation
                let error = 0;
                points.forEach(p => {
                    const dist = Math.hypot(p.x - cx, p.y - cy);
                    error += Math.abs(dist - r);
                });
                const avgError = error / points.length;
                // 0 error = 100%, 50px error = 0%
                const score = Math.max(0, Math.min(100, Math.round(100 - (avgError * 2))));

                // Check if circle is complete (angle coverage) - Simple check: points count
                if (points.length < 50) {
                    App.finishTest("Retry", "Too Short", "Please trace the full circle.");
                } else {
                    App.finishTest(score + "%", "Motor Control", `Average deviation: ${Math.round(avgError)}px`);
                }
            };
        },
        cleanup() {
            document.removeEventListener('mousemove', this.moveHandler);
            document.removeEventListener('mousedown', this.downHandler);
            document.removeEventListener('mouseup', this.upHandler);
        }
    },

    // TEST 5: STEADINESS (Microscope)
    steady: {
        init(container, canvas, timerEl) {
            const zone = document.createElement('div');
            zone.id = 'steady-zone';
            container.appendChild(zone);

            // Center the zone
            zone.style.left = (window.innerWidth / 2 - 20) + 'px';
            zone.style.top = (window.innerHeight / 2 - 20) + 'px';

            timerEl.innerText = "Keep mouse inside the circle";
            let timeLeft = 10;
            let totalMovement = 0;
            let lastX = -1, lastY = -1;
            let started = false;

            this.moveHandler = (e) => {
                if (!started) return;
                if (lastX !== -1) {
                    totalMovement += Math.hypot(e.clientX - lastX, e.clientY - lastY);
                }
                lastX = e.clientX;
                lastY = e.clientY;

                // Check boundary
                const cx = window.innerWidth / 2;
                const cy = window.innerHeight / 2;
                if (Math.hypot(e.clientX - cx, e.clientY - cy) > 20) {
                    totalMovement += 50; // Penalty for leaving
                    zone.style.borderColor = 'red';
                } else {
                    zone.style.borderColor = '#38bdf8';
                }
            };

            // Wait for user to enter circle to start
            zone.onmouseenter = () => {
                if (started) return;
                started = true;
                lastX = -1;
                document.addEventListener('mousemove', this.moveHandler);

                App.timerId = setInterval(() => {
                    timeLeft--;
                    timerEl.innerText = timeLeft + 's';
                    if (timeLeft <= 0) {
                        // Score: lower movement is better. 
                        // Expect some micro movement (e.g. 100px total over 10s is amazing)
                        // 1000px is bad.
                        const score = Math.max(0, Math.min(100, Math.round(100 - (totalMovement / 10))));
                        App.finishTest(score + "%", "Nervous Stability", `Total Micro-movement: ${Math.round(totalMovement)} units`);
                    }
                }, 1000);
            };
        },
        cleanup() {
            document.removeEventListener('mousemove', this.moveHandler);
        }
    },

    // TEST 6: BREATH SYNC
    breath: {
        init(container, canvas, timerEl) {
            const circle = document.createElement('div');
            circle.id = 'breath-circle';
            container.appendChild(circle);

            const guide = document.createElement('div');
            guide.id = 'breath-guide'; // The target outline
            container.appendChild(guide);

            const txt = document.createElement('div');
            txt.className = 'instruction-text';
            txt.innerHTML = "Hold <b>SPACE</b> when expanding<br>Release when contracting";
            container.appendChild(txt);

            let scale = 1;
            let direction = 1; // 1 = expand, -1 = contract
            let speed = 0.005;
            let holding = false;
            let scorePoints = 0;
            let totalFrames = 0;
            let timeLeft = 30;

            document.body.onkeydown = (e) => {
                if (e.code === 'Space') {
                    e.preventDefault(); // Prevent scrolling
                    holding = true;
                }
            };
            document.body.onkeyup = (e) => { if (e.code === 'Space') holding = false; };

            const loop = () => {

                totalFrames++;
                scale += speed * direction;

                // Visual Update
                circle.style.transform = `scale(${scale * 3})`; // 1 to 3

                // Logic: Change direction at limits
                if (scale >= 1.5) direction = -1;
                if (scale <= 0.5) direction = 1;

                // Scoring
                // Expanding (direction 1) -> Should Hold (holding true)
                // Contracting (direction -1) -> Should Release (holding false)
                if (direction === 1 && holding) scorePoints++;
                else if (direction === -1 && !holding) scorePoints++;

                App.rafId = requestAnimationFrame(loop);
            };
            loop();

            App.timerId = setInterval(() => {
                timeLeft--;
                timerEl.innerText = timeLeft + 's';
                if (timeLeft <= 0) {
                    const score = Math.round((scorePoints / totalFrames) * 100);
                    App.finishTest(score + "%", "Mind-Body Sync", "Ability to synchronize action with rhythm.");
                }
            }, 1000);
        },
        cleanup() {
            document.body.onkeydown = null;
            document.body.onkeyup = null;
        }
    },

    // TEST 7: GROUNDING (5-4-3-2-1)
    grounding: {
        init(container, canvas, timerEl) {
            // Setup UI
            const wrap = document.createElement('div');
            wrap.className = 'grounding-container';

            const stepTitle = document.createElement('div');
            stepTitle.className = 'grounding-step';
            wrap.appendChild(stepTitle);

            const instr = document.createElement('div');
            instr.className = 'grounding-instr';
            wrap.appendChild(instr);

            const btn = document.createElement('button');
            btn.className = 'btn-grounding';
            wrap.appendChild(btn);

            container.appendChild(wrap);
            timerEl.innerText = "Relax";

            // Game State
            const steps = [
                { count: 5, text: "👁️ Look around. Find 5 things you SEE.", action: "I see it" },
                { count: 4, text: "✋ Touch 4 things around you. Feel the texture.", action: "I feel it" },
                { count: 3, text: "👂 Listen carefully. Name 3 things you HEAR.", action: "I hear it" },
                { count: 2, text: "👃 Take a deep breath. Smell 2 things.", action: "I smell it" },
                { count: 1, text: "👅 Focus on your mouth. Taste 1 thing.", action: "I taste it" }
            ];

            let currentStepIdx = 0;
            let currentCount = 0;

            // Breathing Intro
            stepTitle.innerText = "Breathe";
            instr.innerText = "Take a deep breath in...";
            btn.style.display = 'none';

            App.setTimeout(() => {
                instr.innerText = "And breathe out slowly...";
                App.setTimeout(() => {
                    startStep(0);
                }, 3000);
            }, 3000);

            const startStep = (idx) => {
                if (idx >= steps.length) {
                    App.finishTest("Calm", "Grounding Complete", "You have centered yourself in the present moment.");
                    return;
                }
                currentStepIdx = idx;
                currentCount = 0;
                const step = steps[idx];

                stepTitle.innerText = step.count;
                instr.innerText = step.text;
                btn.innerText = `${step.action} (${currentCount}/${step.count})`;
                btn.style.display = 'inline-block';
            };

            btn.onclick = () => {
                const step = steps[currentStepIdx];
                currentCount++;

                // Visual feedback
                btn.style.transform = "scale(0.95)";
                setTimeout(() => btn.style.transform = "scale(1)", 100);

                if (currentCount >= step.count) {
                    // Next step
                    startStep(currentStepIdx + 1);
                } else {
                    btn.innerText = `${step.action} (${currentCount}/${step.count})`;
                }
            };
        },
        cleanup() { }
    }
};

// Auto-start logic
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const startGame = urlParams.get('start');
    if (startGame && Tests[startGame]) {
        setTimeout(() => {
            App.startTest(startGame);
        }, 500);
    }
});
