/**
 * 🙏 कृष्ण Mind Suite - Profile Manager
 * 
 * Handles user profile collection, setup flow, and profile UI
 */

const ProfileManager = {
    modal: null,
    currentStep: 1,
    totalSteps: 3,
    profileData: {},
    onComplete: null,
    
    /**
     * Initialize Profile Manager
     */
    init() {
        this.createModal();
        this.attachEventListeners();
    },
    
    /**
     * Create profile setup modal
     */
    createModal() {
        // Remove existing modal if any
        const existing = document.getElementById('profile-setup-modal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'profile-setup-modal';
        modal.className = 'profile-modal';
        modal.innerHTML = `
            <div class="profile-modal-overlay"></div>
            <div class="profile-modal-content">
                <div class="profile-modal-header">
                    <h2>🙏 Welcome to Krishna's Garden</h2>
                    <p class="profile-subtitle">Let us know you better for a personalized spiritual journey</p>
                    <div class="profile-progress">
                        <div class="profile-progress-bar" style="width: 33%"></div>
                    </div>
                    <div class="profile-step-indicator">Step <span id="current-step">1</span> of ${this.totalSteps}</div>
                </div>
                
                <div class="profile-modal-body">
                    <!-- Step 1: Basic Info -->
                    <div class="profile-step" id="profile-step-1">
                        <div class="form-group">
                            <label for="profile-displayName">
                                <span class="label-icon">👤</span>
                                What should we call you?
                            </label>
                            <input type="text" id="profile-displayName" 
                                   placeholder="Your Name" maxlength="50" autocomplete="name">
                        </div>
                        
                        <div class="form-group">
                            <label for="profile-spiritualName">
                                <span class="label-icon">🙏</span>
                                Spiritual Name <span class="optional">(Optional)</span>
                            </label>
                            <input type="text" id="profile-spiritualName" 
                                   placeholder="e.g., Govinda Das, Radha Devi" maxlength="50">
                            <span class="form-hint">If you've received initiation or have a devotional name</span>
                        </div>
                        
                        <div class="form-group">
                            <label for="profile-spiritualGoal">
                                <span class="label-icon">🌱</span>
                                Where are you on your spiritual journey?
                            </label>
                            <select id="profile-spiritualGoal">
                                <option value="beginner">🌱 Just Beginning - Curious about spirituality</option>
                                <option value="exploring">🌿 Exploring - Learning about Krishna consciousness</option>
                                <option value="practicing">🌳 Practicing - Regular sadhana started</option>
                                <option value="dedicated">🌸 Dedicated - Committed practitioner</option>
                                <option value="initiated">📿 Initiated - Received diksha from guru</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="profile-dailyTarget">
                                <span class="label-icon">⏱️</span>
                                Daily Practice Goal
                            </label>
                            <div class="slider-container">
                                <input type="range" id="profile-dailyTarget" 
                                       min="15" max="180" value="30" step="15">
                                <div class="slider-value">
                                    <span id="target-minutes">30</span> minutes/day
                                </div>
                            </div>
                            <div class="slider-labels">
                                <span>15 min</span>
                                <span>3 hours</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Step 2: Daily Activities & Interests -->
                    <div class="profile-step" id="profile-step-2" style="display: none;">
                        <div class="notification-header">
                            <h3>🎯 What Would You Like to Focus On?</h3>
                            <p>Select the modules you're most interested in</p>
                        </div>
                        
                        <div class="interest-options">
                            <label class="interest-option">
                                <input type="checkbox" id="interest-sadhana" checked>
                                <div class="interest-card">
                                    <span class="interest-icon">🪷</span>
                                    <div class="interest-info">
                                        <strong>Sadhana Tracker</strong>
                                        <span>Track chanting, reading & spiritual practices</span>
                                    </div>
                                </div>
                            </label>
                            
                            <label class="interest-option">
                                <input type="checkbox" id="interest-gita" checked>
                                <div class="interest-card">
                                    <span class="interest-icon">📚</span>
                                    <div class="interest-info">
                                        <strong>Bhakti Shastri</strong>
                                        <span>Study Bhagavad Gita with audio lectures</span>
                                    </div>
                                </div>
                            </label>
                            
                            <label class="interest-option">
                                <input type="checkbox" id="interest-workspace" checked>
                                <div class="interest-card">
                                    <span class="interest-icon">🍅</span>
                                    <div class="interest-info">
                                        <strong>Focus Workspace</strong>
                                        <span>Pomodoro timer & ambient sounds for work</span>
                                    </div>
                                </div>
                            </label>
                            
                            <label class="interest-option">
                                <input type="checkbox" id="interest-lab">
                                <div class="interest-card">
                                    <span class="interest-icon">🧠</span>
                                    <div class="interest-info">
                                        <strong>Mind Laboratory</strong>
                                        <span>Cognitive tests & mental wellness tracking</span>
                                    </div>
                                </div>
                            </label>
                        </div>
                        
                        <div class="form-group" style="margin-top: 20px;">
                            <label for="profile-chantingRounds">
                                <span class="label-icon">📿</span>
                                Daily Chanting Goal (Rounds)
                            </label>
                            <div class="slider-container">
                                <input type="range" id="profile-chantingRounds" 
                                       min="0" max="64" value="4" step="1">
                                <div class="slider-value">
                                    <span id="chanting-rounds">4</span> rounds
                                </div>
                            </div>
                            <div class="slider-labels">
                                <span>0</span>
                                <span>64 rounds</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Step 3: Notifications -->
                    <div class="profile-step" id="profile-step-3" style="display: none;">
                        <div class="notification-header">
                            <h3>🔔 Stay Connected with Krishna</h3>
                            <p>Receive spiritual reminders and Gita wisdom throughout your day</p>
                        </div>
                        
                        <div class="notification-option">
                            <div class="option-header">
                                <label class="toggle-label">
                                    <input type="checkbox" id="pref-morningReminder" checked>
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">
                                        <span class="option-icon">🌅</span>
                                        Morning Sadhana Reminder
                                    </span>
                                </label>
                            </div>
                            <div class="option-details">
                                <input type="time" id="pref-morningTime" value="06:00">
                                <span class="time-hint">Wake up to Krishna's wisdom</span>
                            </div>
                        </div>
                        
                        <div class="notification-option">
                            <div class="option-header">
                                <label class="toggle-label">
                                    <input type="checkbox" id="pref-eveningReminder" checked>
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">
                                        <span class="option-icon">🌙</span>
                                        Evening Reflection Reminder
                                    </span>
                                </label>
                            </div>
                            <div class="option-details">
                                <input type="time" id="pref-eveningTime" value="20:00">
                                <span class="time-hint">End your day with gratitude</span>
                            </div>
                        </div>
                        
                        <div class="notification-option">
                            <div class="option-header">
                                <label class="toggle-label">
                                    <input type="checkbox" id="pref-verseOfDay" checked>
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">
                                        <span class="option-icon">📖</span>
                                        Daily Gita Verse
                                    </span>
                                </label>
                            </div>
                            <div class="option-details">
                                <span class="verse-preview" id="daily-verse-preview">
                                    "You have a right to perform your prescribed duties..." — BG 2.47
                                </span>
                            </div>
                        </div>
                        
                        <div class="notification-option">
                            <div class="option-header">
                                <label class="toggle-label">
                                    <input type="checkbox" id="pref-practiceReminders" checked>
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">
                                        <span class="option-icon">🔔</span>
                                        Random Activity Nudges
                                    </span>
                                </label>
                            </div>
                            <div class="option-details">
                                <span class="time-hint">Gentle reminders for sadhana, focus sessions & mind checks</span>
                            </div>
                        </div>
                        
                        <div class="notification-permission" id="notification-permission">
                            <p>📱 Enable browser notifications for reminders</p>
                            <button type="button" id="enable-notifications-btn" class="btn-secondary">
                                Enable Notifications
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="profile-modal-footer">
                    <button type="button" id="profile-back-btn" class="btn-secondary" style="display: none;">
                        ← Back
                    </button>
                    <button type="button" id="profile-skip-btn" class="btn-ghost">
                        Skip for now
                    </button>
                    <button type="button" id="profile-next-btn" class="btn-primary">
                        Continue →
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
        this.addModalStyles();
    },
    
    /**
     * Add modal styles
     */
    addModalStyles() {
        if (document.getElementById('profile-modal-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'profile-modal-styles';
        styles.textContent = `
            .profile-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .profile-modal.active {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .profile-modal.visible {
                opacity: 1;
            }
            
            .profile-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(8px);
            }
            
            .profile-modal-content {
                position: relative;
                background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 20px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 200, 87, 0.2);
            }
            
            .profile-modal-header {
                padding: 30px 30px 20px;
                text-align: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .profile-modal-header h2 {
                color: #F5B041;
                font-size: 1.8rem;
                margin: 0 0 8px;
            }
            
            .profile-subtitle {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.95rem;
                margin: 0 0 20px;
            }
            
            .profile-progress {
                height: 4px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 10px;
            }
            
            .profile-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #F5B041, #FF7F00);
                transition: width 0.3s ease;
            }
            
            .profile-step-indicator {
                color: rgba(255, 255, 255, 0.5);
                font-size: 0.85rem;
            }
            
            .profile-modal-body {
                padding: 25px 30px;
            }
            
            .profile-step {
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .form-group {
                margin-bottom: 22px;
            }
            
            .form-group label {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #fff;
                font-size: 0.95rem;
                margin-bottom: 10px;
            }
            
            .label-icon {
                font-size: 1.2rem;
            }
            
            .optional {
                color: rgba(255, 255, 255, 0.4);
                font-size: 0.8rem;
                font-weight: normal;
            }
            
            .form-group input[type="text"],
            .form-group select {
                width: 100%;
                padding: 14px 16px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 10px;
                color: #fff;
                font-size: 1rem;
                transition: all 0.2s ease;
            }
            
            .form-group input[type="text"]:focus,
            .form-group select:focus {
                outline: none;
                border-color: #F5B041;
                background: rgba(245, 176, 65, 0.1);
            }
            
            .form-group input::placeholder {
                color: rgba(255, 255, 255, 0.4);
            }
            
            .form-group select option {
                background: #1a1a2e;
                padding: 10px;
            }
            
            .form-hint {
                display: block;
                color: rgba(255, 255, 255, 0.4);
                font-size: 0.8rem;
                margin-top: 6px;
            }
            
            .slider-container {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .slider-container input[type="range"] {
                flex: 1;
                -webkit-appearance: none;
                height: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                cursor: pointer;
            }
            
            .slider-container input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                background: linear-gradient(135deg, #F5B041, #FF7F00);
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(245, 176, 65, 0.4);
            }
            
            .slider-value {
                min-width: 120px;
                text-align: center;
                color: #F5B041;
                font-weight: 600;
                font-size: 1.1rem;
            }
            
            .slider-labels {
                display: flex;
                justify-content: space-between;
                color: rgba(255, 255, 255, 0.4);
                font-size: 0.75rem;
                margin-top: 5px;
            }
            
            /* Notification Options */
            .notification-header {
                text-align: center;
                margin-bottom: 25px;
            }
            
            .notification-header h3 {
                color: #F5B041;
                font-size: 1.3rem;
                margin: 0 0 8px;
            }
            
            .notification-header p {
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.9rem;
                margin: 0;
            }
            
            .notification-option {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 12px;
                border: 1px solid rgba(255, 255, 255, 0.08);
            }
            
            .option-header {
                margin-bottom: 10px;
            }
            
            .toggle-label {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
            }
            
            .toggle-label input[type="checkbox"] {
                display: none;
            }
            
            .toggle-slider {
                width: 44px;
                height: 24px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                position: relative;
                transition: all 0.3s ease;
                flex-shrink: 0;
            }
            
            .toggle-slider::after {
                content: '';
                position: absolute;
                width: 18px;
                height: 18px;
                background: #fff;
                border-radius: 50%;
                top: 3px;
                left: 3px;
                transition: all 0.3s ease;
            }
            
            .toggle-label input:checked + .toggle-slider {
                background: linear-gradient(90deg, #F5B041, #FF7F00);
            }
            
            .toggle-label input:checked + .toggle-slider::after {
                left: 23px;
            }
            
            .toggle-text {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #fff;
                font-size: 0.95rem;
            }
            
            .option-icon {
                font-size: 1.2rem;
            }
            
            .option-details {
                padding-left: 56px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .option-details input[type="time"] {
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                color: #fff;
                font-size: 0.9rem;
            }
            
            .time-hint {
                color: rgba(255, 255, 255, 0.4);
                font-size: 0.8rem;
            }
            
            .verse-preview {
                display: block;
                color: rgba(255, 200, 87, 0.8);
                font-style: italic;
                font-size: 0.85rem;
                line-height: 1.4;
            }
            
            .notification-permission {
                text-align: center;
                padding: 20px;
                margin-top: 15px;
                background: rgba(78, 205, 196, 0.1);
                border-radius: 12px;
                border: 1px dashed rgba(78, 205, 196, 0.3);
            }
            
            .notification-permission p {
                color: rgba(255, 255, 255, 0.7);
                margin: 0 0 12px;
                font-size: 0.9rem;
            }
            
            .notification-permission.granted {
                background: rgba(39, 174, 96, 0.1);
                border-color: rgba(39, 174, 96, 0.3);
            }
            
            .notification-permission.granted p {
                color: #27AE60;
            }
            
            /* Interest Options (Step 2) */
            .interest-options {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .interest-option {
                cursor: pointer;
            }
            
            .interest-option input[type="checkbox"] {
                display: none;
            }
            
            .interest-card {
                display: flex;
                align-items: center;
                gap: 15px;
                background: rgba(255, 255, 255, 0.05);
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 15px;
                transition: all 0.2s ease;
            }
            
            .interest-option input:checked + .interest-card {
                border-color: var(--kc-gold, #F5B041);
                background: rgba(245, 176, 65, 0.1);
            }
            
            .interest-card:hover {
                border-color: rgba(245, 176, 65, 0.5);
            }
            
            .interest-icon {
                font-size: 2rem;
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.08);
                border-radius: 12px;
            }
            
            .interest-info {
                flex: 1;
            }
            
            .interest-info strong {
                display: block;
                color: #fff;
                font-size: 1rem;
                margin-bottom: 4px;
            }
            
            .interest-info span {
                color: rgba(255, 255, 255, 0.5);
                font-size: 0.85rem;
            }
            
            /* Footer Buttons */
            .profile-modal-footer {
                padding: 20px 30px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .profile-modal-footer button {
                padding: 12px 24px;
                border-radius: 10px;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #F5B041, #FF7F00);
                color: #1a1a2e;
                border: none;
                flex: 1;
            }
            
            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(245, 176, 65, 0.4);
            }
            
            .btn-secondary {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.15);
            }
            
            .btn-ghost {
                background: transparent;
                color: rgba(255, 255, 255, 0.5);
                border: none;
            }
            
            .btn-ghost:hover {
                color: rgba(255, 255, 255, 0.8);
            }
            
            /* Mobile Responsive */
            @media (max-width: 480px) {
                .profile-modal-content {
                    width: 95%;
                    max-height: 95vh;
                }
                
                .profile-modal-header,
                .profile-modal-body,
                .profile-modal-footer {
                    padding-left: 20px;
                    padding-right: 20px;
                }
                
                .profile-modal-header h2 {
                    font-size: 1.5rem;
                }
                
                .option-details {
                    padding-left: 0;
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .profile-modal-footer {
                    flex-wrap: wrap;
                }
                
                .btn-primary {
                    order: -1;
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(styles);
    },
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Next button
        document.getElementById('profile-next-btn')?.addEventListener('click', () => {
            if (this.currentStep < this.totalSteps) {
                this.nextStep();
            } else {
                this.saveAndComplete();
            }
        });
        
        // Back button
        document.getElementById('profile-back-btn')?.addEventListener('click', () => {
            this.prevStep();
        });
        
        // Skip button
        document.getElementById('profile-skip-btn')?.addEventListener('click', () => {
            this.skipSetup();
        });
        
        // Daily target slider
        document.getElementById('profile-dailyTarget')?.addEventListener('input', (e) => {
            document.getElementById('target-minutes').textContent = e.target.value;
        });
        
        // Chanting rounds slider
        document.getElementById('profile-chantingRounds')?.addEventListener('input', (e) => {
            document.getElementById('chanting-rounds').textContent = e.target.value;
        });
        
        // Enable notifications button
        document.getElementById('enable-notifications-btn')?.addEventListener('click', () => {
            this.requestNotificationPermission();
        });
        
        // Overlay click to close (optional)
        document.querySelector('.profile-modal-overlay')?.addEventListener('click', (e) => {
            // Only close if clicking directly on overlay, not bubbled events
            if (e.target.classList.contains('profile-modal-overlay')) {
                // Don't close during setup - user should complete or skip
            }
        });
    },
    
    /**
     * Open the profile setup modal
     */
    open(callback) {
        this.onComplete = callback;
        this.currentStep = 1;
        this.updateStepDisplay();
        
        // Pre-populate with existing data if available
        this.populateFromUser();
        
        this.modal.classList.add('active');
        requestAnimationFrame(() => {
            this.modal.classList.add('visible');
        });
        
        // Focus first input
        setTimeout(() => {
            document.getElementById('profile-displayName')?.focus();
        }, 300);
        
        // Update daily verse preview
        this.updateDailyVersePreview();
        
        // Check notification permission status
        this.updateNotificationPermissionUI();
    },
    
    /**
     * Close the modal
     */
    close() {
        this.modal.classList.remove('visible');
        setTimeout(() => {
            this.modal.classList.remove('active');
        }, 300);
    },
    
    /**
     * Go to next step
     */
    nextStep() {
        if (this.currentStep === 1) {
            // Validate step 1
            const displayName = document.getElementById('profile-displayName').value.trim();
            if (!displayName) {
                this.showError('Please enter your name');
                document.getElementById('profile-displayName').focus();
                return;
            }
        }
        
        // Hide current step
        document.getElementById(`profile-step-${this.currentStep}`).style.display = 'none';
        
        // Show next step
        this.currentStep++;
        document.getElementById(`profile-step-${this.currentStep}`).style.display = 'block';
        
        this.updateStepDisplay();
    },
    
    /**
     * Go to previous step
     */
    prevStep() {
        // Hide current step
        document.getElementById(`profile-step-${this.currentStep}`).style.display = 'none';
        
        // Show previous step
        this.currentStep--;
        document.getElementById(`profile-step-${this.currentStep}`).style.display = 'block';
        
        this.updateStepDisplay();
    },
    
    /**
     * Update step display
     */
    updateStepDisplay() {
        // Update step indicator
        document.getElementById('current-step').textContent = this.currentStep;
        
        // Update progress bar
        const progress = (this.currentStep / this.totalSteps) * 100;
        document.querySelector('.profile-progress-bar').style.width = `${progress}%`;
        
        // Update buttons
        const backBtn = document.getElementById('profile-back-btn');
        const nextBtn = document.getElementById('profile-next-btn');
        
        backBtn.style.display = this.currentStep > 1 ? 'block' : 'none';
        nextBtn.textContent = this.currentStep === this.totalSteps ? 
            'Complete Setup 🙏' : 'Continue →';
    },
    
    /**
     * Populate form from existing user data
     */
    populateFromUser() {
        const user = FirebaseManager?.getUser?.();
        if (user) {
            if (user.displayName) {
                document.getElementById('profile-displayName').value = user.displayName;
            }
        }
        
        // Load saved profile if exists
        const savedProfile = UserProfile?.profileData;
        if (savedProfile) {
            if (savedProfile.displayName) {
                document.getElementById('profile-displayName').value = savedProfile.displayName;
            }
            if (savedProfile.spiritualName) {
                document.getElementById('profile-spiritualName').value = savedProfile.spiritualName;
            }
            if (savedProfile.spiritualGoal) {
                document.getElementById('profile-spiritualGoal').value = savedProfile.spiritualGoal;
            }
            if (savedProfile.dailyTargetMinutes) {
                document.getElementById('profile-dailyTarget').value = savedProfile.dailyTargetMinutes;
                document.getElementById('target-minutes').textContent = savedProfile.dailyTargetMinutes;
            }
            if (savedProfile.chantingRounds) {
                const chantingEl = document.getElementById('profile-chantingRounds');
                const roundsEl = document.getElementById('chanting-rounds');
                if (chantingEl) chantingEl.value = savedProfile.chantingRounds;
                if (roundsEl) roundsEl.textContent = savedProfile.chantingRounds;
            }
            // Interests
            if (savedProfile.interests) {
                document.getElementById('interest-sadhana').checked = savedProfile.interests.sadhana !== false;
                document.getElementById('interest-gita').checked = savedProfile.interests.gita !== false;
                document.getElementById('interest-workspace').checked = savedProfile.interests.workspace !== false;
                document.getElementById('interest-lab').checked = savedProfile.interests.lab === true;
            }
        }
        
        // Load saved preferences
        const savedPrefs = UserProfile?.preferencesData;
        if (savedPrefs) {
            document.getElementById('pref-morningReminder').checked = savedPrefs.morningReminderEnabled !== false;
            document.getElementById('pref-morningTime').value = savedPrefs.morningReminderTime || '06:00';
            document.getElementById('pref-eveningReminder').checked = savedPrefs.eveningReminderEnabled !== false;
            document.getElementById('pref-eveningTime').value = savedPrefs.eveningReminderTime || '20:00';
            document.getElementById('pref-verseOfDay').checked = savedPrefs.verseOfDayEnabled !== false;
            document.getElementById('pref-practiceReminders').checked = savedPrefs.practiceReminders !== false;
        }
    },
    
    /**
     * Collect form data
     */
    collectFormData() {
        this.profileData = {
            displayName: document.getElementById('profile-displayName').value.trim(),
            spiritualName: document.getElementById('profile-spiritualName').value.trim(),
            spiritualGoal: document.getElementById('profile-spiritualGoal').value,
            dailyTargetMinutes: parseInt(document.getElementById('profile-dailyTarget').value),
            chantingRounds: parseInt(document.getElementById('profile-chantingRounds')?.value || '4'),
            interests: {
                sadhana: document.getElementById('interest-sadhana')?.checked !== false,
                gita: document.getElementById('interest-gita')?.checked !== false,
                workspace: document.getElementById('interest-workspace')?.checked !== false,
                lab: document.getElementById('interest-lab')?.checked === true
            },
            profileComplete: true
        };
        
        this.preferencesData = {
            morningReminderEnabled: document.getElementById('pref-morningReminder').checked,
            morningReminderTime: document.getElementById('pref-morningTime').value,
            eveningReminderEnabled: document.getElementById('pref-eveningReminder').checked,
            eveningReminderTime: document.getElementById('pref-eveningTime').value,
            verseOfDayEnabled: document.getElementById('pref-verseOfDay').checked,
            practiceReminders: document.getElementById('pref-practiceReminders').checked,
            notificationEnabled: Notification.permission === 'granted'
        };
    },
    
    /**
     * Save profile and complete setup
     */
    async saveAndComplete() {
        this.collectFormData();
        
        try {
            // Save profile
            if (typeof UserProfile !== 'undefined') {
                await UserProfile.saveProfile(this.profileData);
                await UserProfile.savePreferences(this.preferencesData);
            }
            
            // Update display name in Firebase Auth if different
            const user = FirebaseManager?.getUser?.();
            if (user && user.displayName !== this.profileData.displayName) {
                try {
                    await user.updateProfile({ displayName: this.profileData.displayName });
                } catch (e) {
                    console.warn('Could not update display name:', e);
                }
            }
            
            // Schedule notifications if enabled
            if (typeof NotificationService !== 'undefined') {
                await NotificationService.scheduleNotifications(this.preferencesData);
            }
            
            this.close();
            
            // Show success message
            this.showWelcomeMessage();
            
            // Callback
            if (this.onComplete) {
                this.onComplete(this.profileData, this.preferencesData);
            }
            
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showError('Failed to save profile. Please try again.');
        }
    },
    
    /**
     * Skip setup
     */
    skipSetup() {
        // Save minimal profile
        this.collectFormData();
        this.profileData.profileComplete = false;
        
        // Save to local storage at minimum
        localStorage.setItem('kc_mindsuite_profile', JSON.stringify(this.profileData));
        localStorage.setItem('kc_mindsuite_preferences', JSON.stringify(this.preferencesData));
        
        this.close();
        
        if (this.onComplete) {
            this.onComplete(this.profileData, this.preferencesData);
        }
    },
    
    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            this.updateNotificationPermissionUI();
            
            if (permission === 'granted') {
                // Show test notification
                new Notification('🙏 Hare Krishna!', {
                    body: 'Notifications are now enabled. You\'ll receive spiritual reminders.',
                    icon: '/assets/icons/lotus-icon.png'
                });
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    },
    
    /**
     * Update notification permission UI
     */
    updateNotificationPermissionUI() {
        const permissionDiv = document.getElementById('notification-permission');
        const btn = document.getElementById('enable-notifications-btn');
        
        if (Notification.permission === 'granted') {
            permissionDiv.classList.add('granted');
            permissionDiv.innerHTML = '<p>✅ Notifications enabled! You\'ll receive spiritual reminders.</p>';
        } else if (Notification.permission === 'denied') {
            permissionDiv.innerHTML = `
                <p>⚠️ Notifications are blocked</p>
                <span style="font-size: 0.85rem; color: rgba(255,255,255,0.5);">
                    Enable in browser settings to receive reminders
                </span>
            `;
        }
    },
    
    /**
     * Update daily verse preview
     */
    updateDailyVersePreview() {
        if (typeof getDailyVerse === 'function') {
            const verse = getDailyVerse();
            const preview = document.getElementById('daily-verse-preview');
            if (preview && verse) {
                const shortText = verse.text.length > 60 ? 
                    verse.text.substring(0, 60) + '...' : verse.text;
                preview.textContent = `"${shortText}" — ${verse.ref}`;
            }
        }
    },
    
    /**
     * Show error message
     */
    showError(message) {
        // Simple alert for now, can be replaced with toast
        if (typeof Toast !== 'undefined') {
            Toast.show(message, 'error');
        } else {
            alert(message);
        }
    },
    
    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        const name = this.profileData.displayName || 'Seeker';
        const spiritualName = this.profileData.spiritualName;
        
        const greeting = spiritualName ? 
            `Hare Krishna, ${spiritualName}! 🙏` : 
            `Hare Krishna, ${name}! 🙏`;
        
        if (typeof Toast !== 'undefined') {
            Toast.show(greeting + '\nWelcome to your spiritual journey.', 'success', 4000);
        } else {
            // Fallback notification
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'welcome-toast';
            welcomeDiv.innerHTML = `
                <div style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    border: 1px solid #F5B041;
                    border-radius: 12px;
                    padding: 20px;
                    z-index: 10001;
                    animation: slideIn 0.3s ease;
                ">
                    <h3 style="color: #F5B041; margin: 0 0 8px;">${greeting}</h3>
                    <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 0.9rem;">
                        Welcome to your spiritual journey.
                    </p>
                </div>
            `;
            document.body.appendChild(welcomeDiv);
            setTimeout(() => welcomeDiv.remove(), 4000);
        }
    },
    
    /**
     * Check if profile setup is needed
     */
    isSetupNeeded() {
        // First check localStorage
        const localProfile = localStorage.getItem('kc_mindsuite_profile');
        if (localProfile) {
            try {
                const profile = JSON.parse(localProfile);
                if (profile.profileComplete === true) {
                    return false; // Setup not needed
                }
            } catch (e) {
                console.warn('Error parsing local profile:', e);
            }
        }
        
        // Also check UserProfile if available
        if (typeof UserProfile !== 'undefined' && UserProfile.profileData) {
            if (UserProfile.profileData.profileComplete === true) {
                return false; // Setup not needed
            }
            // Also check if displayName is set (basic profile exists)
            if (UserProfile.profileData.displayName && UserProfile.profileData.displayName.trim()) {
                return false; // Basic profile exists, don't prompt again
            }
        }
        
        return true; // Setup needed
    },
    
    /**
     * Mark profile as complete (for external use)
     */
    markComplete() {
        const profile = {
            profileComplete: true,
            displayName: document.getElementById('profile-displayName')?.value || 'User',
            completedAt: new Date().toISOString()
        };
        localStorage.setItem('kc_mindsuite_profile', JSON.stringify(profile));
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ProfileManager.init());
} else {
    ProfileManager.init();
}

// Export
if (typeof window !== 'undefined') {
    window.ProfileManager = ProfileManager;
}
