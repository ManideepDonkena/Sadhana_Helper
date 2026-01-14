# Firebase Setup Guide for कृष्ण Workspace

## Quick Setup (5 minutes)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project"
3. Name: `Krishna-Suite-Mind-OS` (or your preference)
4. Accept terms and create

### Step 2: Enable Firestore Database
1. In Firebase Console, select your project
2. Go to **Firestore Database**
3. Click **Create Database**
4. Select: **Start in production mode**
5. Choose location: (closest to you)
6. Click **Create**

### Step 3: Enable Google Authentication
1. Go to **Authentication** → **Sign-in method**
2. Click **Google**
3. Enable it
4. Set Project Support Email
5. Click **Save**

### Step 4: Get Firebase Config
1. Go to **Project Settings** (gear icon)
2. Under "Your apps" → Click on Web app icon
3. Copy the config object that looks like:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### Step 5: Update Configuration
1. Open `modules/workspace/workspace.js`
2. Find the `firebaseConfig` object (top of file)
3. Replace with your config from Step 4
4. Save file

### Step 6: Set Firestore Security Rules
1. In Firestore Database, go to **Rules** tab
2. Replace with this:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      match /{document=**} {
        allow read, write: if request.auth.uid == uid;
      }
    }
  }
}
```
3. Click **Publish**

### Step 7: Test It!
1. Open `modules/workspace/workspace.html` in browser
2. Click "Enter कृष्ण Workspace"
3. Sign in with Google
4. Try adding a Bhavana insight
5. Refresh page - data should persist!

---

## Detailed Setup Guide

### Firebase Console Navigation

**Firebase Console Structure:**
```
Your Project
├── Authentication (Sign-in methods)
├── Firestore Database
│   ├── Data
│   ├── Rules
│   └── Indexes
├── Storage
├── Realtime Database
└── Project Settings
    └── Service Accounts (for backend)
```

### Firestore Data Structure

After first use, your Firestore will look like:
```
Firestore Database
└── users/
    └── {googleUserId}/
        ├── bhaktiPoints: 0
        ├── ashramLevel: 1
        ├── displayName: "Your Name"
        ├── email: "your@email.com"
        ├── createdAt: {timestamp}
        ├── lastActivityDate: {timestamp}
        ├── streakDays: 0
        ├── thoughts: []
        ├── resources: []
        ├── moods: []
        └── focusSessions: []
```

### Authentication Setup Details

**OAuth Consent Screen Configuration:**
1. In Firebase → Authentication
2. Click **OAuth consent screen**
3. Select "External"
4. Fill in:
   - App name: "कृष्ण Mind Suite"
   - User support email: (your email)
   - Developer contact: (your email)
5. Click **Save & Continue**
6. You can skip "Add or remove scopes" (defaults are fine)
7. Click **Save & Continue**
8. Review and click **Back to Dashboard**

---

## Troubleshooting

### "Firebase is not defined"
**Solution:**
- Ensure Firebase scripts are in workspace.html:
```html
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"></script>
```

### "User is not authenticated"
**Solution:**
- Ensure Google OAuth is enabled in Firebase Console
- Check Auth.js is loaded before workspace.js
- Try signing out and back in

### "Permission denied" errors
**Solution:**
- Check Firestore Rules are set correctly
- Ensure rules allow authenticated users
- Try publishing rules again
- Check user UID matches (console.log currentUser)

### "Data not syncing"
**Solution:**
- Open browser DevTools → Network tab
- Check for Firebase requests
- Look for CORS errors
- Verify Firestore Rules allow read/write
- Check internet connection

### Blank workspace after login
**Solution:**
1. Open Browser DevTools (F12)
2. Go to Console tab
3. Check for red error messages
4. Report error message
5. Verify Firebase config is correct

---

## Testing Checklist

After setup, verify:

- [ ] Firebase Console shows your project
- [ ] Firestore Database exists and is accessible
- [ ] Google Authentication is enabled
- [ ] Firestore Rules are published
- [ ] workspace.js has correct Firebase config
- [ ] Browser can load workspace.html
- [ ] Can click "Enter कृष्ण Workspace"
- [ ] Google sign-in modal appears
- [ ] Can sign in with Google account
- [ ] Workspace loads with empty state
- [ ] Can add a Bhavana insight
- [ ] Data appears immediately
- [ ] Refresh page - data persists
- [ ] Can see Bhakti Points increase
- [ ] Firestore shows new user document
- [ ] Chart displays correctly
- [ ] Can log mood entries

---

## Development Tips

### Local Testing
```javascript
// In browser console, check if Firebase is ready:
firebase.auth().currentUser  // Should show user object

// Check if Firestore is connected:
firebase.firestore().settings({ experimentalAutoDetectLongPolling: true })

// View current user data:
db.collection('users').doc(firebase.auth().currentUser.uid).get()
    .then(doc => console.log(doc.data()))
```

### Debugging Firestore
```javascript
// Enable Firestore logging:
firebase.firestore().enableLogging(true);

// Listen to specific user document:
db.collection('users').doc(currentUser.uid).onSnapshot(
    doc => console.log('Updated:', doc.data()),
    error => console.error('Error:', error)
);
```

### Monitoring Firestore Usage
1. Firebase Console → **Firestore Database** → **Usage** tab
2. See read/write operations
3. Monitor quota usage
4. Set up billing alerts

---

## Performance Tips

### Optimize Queries
```javascript
// Limit data loaded:
db.collection('users').doc(uid)
    .get()
    .then(doc => doc.data())  // Only loads necessary fields
```

### Reduce Reads
```javascript
// Use real-time listener (more efficient):
db.collection('users').doc(uid).onSnapshot(doc => {
    // Updates when data changes
});

// Better than polling every second
```

### Data Structure Best Practices
- Keep documents under 100KB
- Use subcollections for large arrays
- Index frequently queried fields
- Denormalize data when needed

---

## Security Checklist

- [ ] API Keys restricted to your domain
- [ ] Firestore Rules set to production mode
- [ ] Authentication required for all data
- [ ] No sensitive data in client code
- [ ] HTTPS enabled (automatic with Firebase Hosting)
- [ ] Regular security audits scheduled
- [ ] Backup strategy in place

---

## Production Deployment

### Before Going Live

1. **Test thoroughly:**
   - All CRUD operations work
   - Real-time sync functions correctly
   - Authentication flow is smooth

2. **Security Review:**
   - Firestore Rules reviewed
   - API keys restricted
   - No sensitive data exposed

3. **Performance Check:**
   - Monitor Firestore usage
   - Check read/write operations
   - Verify response times

4. **Backup Strategy:**
   - Regular exports of user data
   - Disaster recovery plan
   - Data retention policy

### Monitoring in Production

```
Firebase Console → Project Settings → Quotas & Limits
- Monitor API calls
- Track storage usage
- Set budget alerts
```

---

## FAQs

**Q: How much does Firebase cost?**
A: Free tier covers most development needs. Pay-as-you-go for scale.

**Q: Can I export my data?**
A: Yes, use Firebase Export feature or backup regularly.

**Q: What if Firebase goes down?**
A: Workspace has fallback to localStorage for offline mode.

**Q: Can multiple users use the same account?**
A: Each user needs their own Firebase Authentication.

**Q: How do I backup data?**
A: Use Firebase Console → Firestore Database → Export Collection

---

## Next Steps

1. ✅ Complete setup above
2. ✅ Test all workspace features
3. ✅ Customize Firebase config if needed
4. ✅ Set up monitoring
5. ✅ Deploy to production
6. ✅ Share with users

---

## Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Authentication Guide](https://firebase.google.com/docs/auth)
- [Security Rules](https://firebase.google.com/docs/rules)

---

**Setup Version:** 1.0
**Last Updated:** 2024
**Status:** Ready to Deploy ✅
