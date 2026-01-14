/**
 * Authentication System - Mind Suite
 * Firebase Authentication with Google OAuth and Email/Password
 */

const Auth = (function() {
    'use strict';

    let currentUser = null;
    let firebaseApp = null;
    let auth = null;
    let db = null;
    let authModalElement = null;

    const STORAGE_KEY = 'mindSuiteUser';

    /**
     * Initialize Firebase and Auth System
     */
    async function init(firebaseConfig) {
        // Check if user is stored locally
        loadLocalUser();
        
        // Create auth modal UI
        createAuthModal();

        // Try to use FirebaseManager if available (preferred)
        if (typeof FirebaseManager !== 'undefined') {
            try {
                const result = await FirebaseManager.init();
                if (result && result.auth && result.db) {
                    auth = result.auth;
                    db = result.db;
                    firebaseApp = result.app;
                    
                    // Setup auth state listener
                    auth.onAuthStateChanged(handleAuthStateChange);
                    console.log('Auth: Using FirebaseManager');
                }
            } catch (error) {
                console.warn('FirebaseManager init failed:', error);
            }
        }
        
        // Fallback: If no auth yet, try direct Firebase init
        if (!auth && typeof firebase !== 'undefined') {
            try {
                // Use provided config or check if firebase is already initialized
                if (firebase.apps.length > 0) {
                    firebaseApp = firebase.apps[0];
                    auth = firebase.auth();
                    db = firebase.firestore();
                } else if (firebaseConfig) {
                    firebaseApp = firebase.initializeApp(firebaseConfig);
                    auth = firebase.auth();
                    db = firebase.firestore();
                }
                
                if (auth) {
                    // Setup auth state listener
                    auth.onAuthStateChanged(handleAuthStateChange);
                    console.log('Auth: Using direct Firebase');
                }
            } catch (error) {
                console.error('Firebase initialization failed:', error);
                // Fall back to local-only auth
            }
        }

        setupEventListeners();
        updateUI();
    }

    /**
     * Load user from localStorage
     */
    function loadLocalUser() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                currentUser = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load user:', error);
        }
    }

    /**
     * Save user to localStorage
     */
    function saveLocalUser(user) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            currentUser = user;
        } catch (error) {
            console.error('Failed to save user:', error);
        }
    }

    /**
     * Handle Firebase auth state changes
     */
    async function handleAuthStateChange(firebaseUser) {
        if (firebaseUser) {
            // Check if this is a fresh sign-in or session restore
            const wasSignedIn = currentUser !== null;
            const isNewSignIn = !wasSignedIn && !sessionStorage.getItem('auth_session_restored');
            
            // User is signed in via Firebase
            const user = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                photoURL: firebaseUser.photoURL,
                provider: firebaseUser.providerData[0]?.providerId || 'password',
                createdAt: firebaseUser.metadata.creationTime,
                isFirebaseAuth: true
            };

            saveLocalUser(user);
            updateUI();
            
            // Mark session as restored so we don't show welcome again on this tab
            sessionStorage.setItem('auth_session_restored', 'true');

            // Only show welcome message on fresh sign-in, not page refresh
            if (isNewSignIn) {
                if (typeof Toast !== 'undefined') {
                    Toast.show(`Welcome back, ${user.displayName}!`, 'success');
                }

                // Send notification
                if (typeof NotificationCenter !== 'undefined') {
                    NotificationCenter.add({
                        type: 'INFO',
                        title: 'Signed In',
                        message: `You're now signed in as ${user.displayName}`
                    });
                }
            }
        } else {
            // User is signed out
            sessionStorage.removeItem('auth_session_restored');
            if (currentUser && currentUser.isFirebaseAuth) {
                currentUser = null;
                localStorage.removeItem(STORAGE_KEY);
                updateUI();
            }
        }
    }

    /**
     * Create auth modal UI
     */
    function createAuthModal() {
        authModalElement = document.createElement('div');
        authModalElement.id = 'auth-modal';
        authModalElement.className = 'auth-modal';
        authModalElement.innerHTML = `
            <div class="auth-modal-overlay"></div>
            <div class="auth-modal-content">
                <button class="auth-close" id="auth-close-btn">✕</button>
                
                <!-- Sign In Form -->
                <div class="auth-form-container" id="signin-form-container">
                    <h2>Welcome to Mind Suite</h2>
                    <p class="auth-subtitle">Sign in to sync your progress across devices</p>
                    
                    <button class="auth-google-btn" id="google-signin-btn">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <path fill="#4285F4" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"/>
                            <path fill="#34A853" d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z"/>
                            <path fill="#FBBC05" d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z"/>
                            <path fill="#EA4335" d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z"/>
                        </svg>
                        Continue with Google
                    </button>

                    <div class="auth-divider">
                        <span>or</span>
                    </div>

                    <form id="email-signin-form" class="auth-email-form">
                        <div class="auth-input-group">
                            <label for="signin-email">Email</label>
                            <input type="email" id="signin-email" required autocomplete="email">
                        </div>
                        <div class="auth-input-group">
                            <label for="signin-password">Password</label>
                            <input type="password" id="signin-password" required autocomplete="current-password">
                        </div>
                        <button type="submit" class="auth-submit-btn">Sign In</button>
                    </form>

                    <p class="auth-switch">
                        Don't have an account? <button id="show-signup-btn" class="auth-link-btn">Sign Up</button>
                    </p>

                    <p class="auth-guest-option">
                        <button id="guest-continue-btn" class="auth-link-btn">Continue as Guest</button>
                    </p>
                </div>

                <!-- Sign Up Form -->
                <div class="auth-form-container" id="signup-form-container" style="display: none;">
                    <h2>Create Your Account</h2>
                    <p class="auth-subtitle">Join Mind Suite and start your journey</p>
                    
                    <button class="auth-google-btn" id="google-signup-btn">
                        <svg width="20" height="20" viewBox="0 0 20 20">
                            <path fill="#4285F4" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"/>
                            <path fill="#34A853" d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z"/>
                            <path fill="#FBBC05" d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z"/>
                            <path fill="#EA4335" d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z"/>
                        </svg>
                        Sign up with Google
                    </button>

                    <div class="auth-divider">
                        <span>or</span>
                    </div>

                    <form id="email-signup-form" class="auth-email-form">
                        <div class="auth-input-group">
                            <label for="signup-name">Name</label>
                            <input type="text" id="signup-name" required autocomplete="name">
                        </div>
                        <div class="auth-input-group">
                            <label for="signup-email">Email</label>
                            <input type="email" id="signup-email" required autocomplete="email">
                        </div>
                        <div class="auth-input-group">
                            <label for="signup-password">Password</label>
                            <input type="password" id="signup-password" required minlength="6" autocomplete="new-password">
                            <small>At least 6 characters</small>
                        </div>
                        <button type="submit" class="auth-submit-btn">Create Account</button>
                    </form>

                    <p class="auth-switch">
                        Already have an account? <button id="show-signin-btn" class="auth-link-btn">Sign In</button>
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(authModalElement);
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Close modal
        document.getElementById('auth-close-btn').addEventListener('click', closeAuthModal);
        authModalElement.querySelector('.auth-modal-overlay').addEventListener('click', closeAuthModal);

        // Switch forms
        document.getElementById('show-signup-btn').addEventListener('click', () => switchForm('signup'));
        document.getElementById('show-signin-btn').addEventListener('click', () => switchForm('signin'));

        // Google auth
        document.getElementById('google-signin-btn').addEventListener('click', signInWithGoogle);
        document.getElementById('google-signup-btn').addEventListener('click', signInWithGoogle);

        // Email/Password forms
        document.getElementById('email-signin-form').addEventListener('submit', handleEmailSignIn);
        document.getElementById('email-signup-form').addEventListener('submit', handleEmailSignUp);

        // Guest mode
        document.getElementById('guest-continue-btn').addEventListener('click', continueAsGuest);

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && authModalElement.classList.contains('is-open')) {
                closeAuthModal();
            }
        });
    }

    /**
     * Open auth modal
     */
    function openAuthModal(formType = 'signin') {
        authModalElement.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        switchForm(formType);
    }

    /**
     * Close auth modal
     */
    function closeAuthModal() {
        authModalElement.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    /**
     * Switch between signin and signup forms
     */
    function switchForm(formType) {
        const signinContainer = document.getElementById('signin-form-container');
        const signupContainer = document.getElementById('signup-form-container');

        if (formType === 'signup') {
            signinContainer.style.display = 'none';
            signupContainer.style.display = 'block';
        } else {
            signinContainer.style.display = 'block';
            signupContainer.style.display = 'none';
        }
    }

    /**
     * Sign in with Google
     */
    async function signInWithGoogle() {
        // Try to initialize if not yet done
        if (!auth) {
            // Try to get auth from FirebaseManager
            if (typeof FirebaseManager !== 'undefined') {
                try {
                    const result = await FirebaseManager.init();
                    if (result && result.auth) {
                        auth = result.auth;
                        db = result.db;
                        firebaseApp = result.app;
                        auth.onAuthStateChanged(handleAuthStateChange);
                    }
                } catch (e) {
                    console.warn('Failed to init FirebaseManager for auth:', e);
                }
            }
            
            // Fallback: try direct firebase
            if (!auth && typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                auth = firebase.auth();
                db = firebase.firestore();
                auth.onAuthStateChanged(handleAuthStateChange);
            }
        }
        
        if (!auth) {
            Toast.show('Firebase not configured. Using guest mode.', 'warning');
            continueAsGuest();
            return;
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            await auth.signInWithPopup(provider);
            closeAuthModal();
        } catch (error) {
            console.error('Google sign-in error:', error);
            Toast.show(error.message, 'error');
        }
    }

    /**
     * Handle email/password sign in
     */
    async function handleEmailSignIn(e) {
        e.preventDefault();
        
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        if (!auth) {
            // Local authentication fallback
            const user = {
                uid: Date.now().toString(),
                email: email,
                displayName: email.split('@')[0],
                photoURL: null,
                provider: 'local',
                createdAt: new Date().toISOString(),
                isFirebaseAuth: false
            };
            
            saveLocalUser(user);
            closeAuthModal();
            updateUI();
            Toast.show('Signed in locally', 'success');
            return;
        }

        try {
            await auth.signInWithEmailAndPassword(email, password);
            closeAuthModal();
        } catch (error) {
            console.error('Email sign-in error:', error);
            Toast.show(error.message, 'error');
        }
    }

    /**
     * Handle email/password sign up
     */
    async function handleEmailSignUp(e) {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        if (!auth) {
            // Local authentication fallback
            const user = {
                uid: Date.now().toString(),
                email: email,
                displayName: name,
                photoURL: null,
                provider: 'local',
                createdAt: new Date().toISOString(),
                isFirebaseAuth: false
            };
            
            saveLocalUser(user);
            closeAuthModal();
            updateUI();
            Toast.show('Account created locally', 'success');
            
            if (typeof NotificationCenter !== 'undefined') {
                NotificationCenter.add({
                    type: 'ACHIEVEMENT',
                    title: 'Welcome to Mind Suite!',
                    message: `Great to have you here, ${name}!`
                });
            }
            return;
        }

        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName: name });
            closeAuthModal();
            
            if (typeof NotificationCenter !== 'undefined') {
                NotificationCenter.add({
                    type: 'ACHIEVEMENT',
                    title: 'Welcome to Mind Suite!',
                    message: `Great to have you here, ${name}!`
                });
            }
        } catch (error) {
            console.error('Email sign-up error:', error);
            Toast.show(error.message, 'error');
        }
    }

    /**
     * Continue as guest
     */
    function continueAsGuest() {
        const guestUser = {
            uid: 'guest-' + Date.now(),
            email: null,
            displayName: 'Guest',
            photoURL: null,
            provider: 'guest',
            createdAt: new Date().toISOString(),
            isFirebaseAuth: false,
            isGuest: true
        };

        saveLocalUser(guestUser);
        closeAuthModal();
        updateUI();
        Toast.show('Continuing as guest', 'info');
    }

    /**
     * Sign out
     */
    async function signOut() {
        if (auth && currentUser && currentUser.isFirebaseAuth) {
            try {
                await auth.signOut();
            } catch (error) {
                console.error('Sign out error:', error);
            }
        }
        
        currentUser = null;
        localStorage.removeItem(STORAGE_KEY);
        updateUI();
        Toast.show('Signed out successfully', 'success');
    }

    /**
     * Update UI based on auth state
     */
    function updateUI() {
        // Dispatch custom event for other modules
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user: currentUser } 
        }));
    }

    /**
     * Get current user
     */
    function getCurrentUser() {
        return currentUser;
    }

    /**
     * Check if user is authenticated
     */
    function isAuthenticated() {
        return currentUser !== null;
    }

    /**
     * Check if user is guest
     */
    function isGuest() {
        return currentUser && currentUser.isGuest === true;
    }

    /**
     * Public API
     */
    return {
        init,
        openAuthModal,
        closeAuthModal,
        signOut,
        getCurrentUser,
        isAuthenticated,
        isGuest
    };
})();

// Don't auto-initialize - let index.html handle initialization after FirebaseManager is ready
// The init will be called explicitly after FirebaseManager.init() completes
