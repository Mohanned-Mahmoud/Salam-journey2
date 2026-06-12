# Quick Start Guide - Google Sign-In

## 5-Minute Setup

### Step 1: Firebase Credentials ✅ Already Available!
The Firebase service account file is already in your project root:
- `salam-jourey-firebase-adminsdk-fbsvc-2a397888cd.json` ✅

The backend will automatically detect and use this file. No additional setup needed!

### Step 2: Set Environment Variables

**Create `.env` file in project root:**
```bash
# Generate a strong secret (32+ characters)
JWT_SECRET=your_super_secret_key_with_32_plus_chars

# Get from Google Cloud Console > APIs & Services > Credentials
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

**Create `artifacts/salam-journey/.env.local`:**
```bash
# Copy these from Firebase Console > Project Settings
VITE_FIREBASE_API_KEY=AIzaSyBaqAwG6FUWOw5E_Ii_kb2Vm59RFeQOWAk
VITE_FIREBASE_AUTH_DOMAIN=salam-jourey.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=salam-jourey
VITE_FIREBASE_STORAGE_BUCKET=salam-jourey.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=88995482188
VITE_FIREBASE_APP_ID=1:88995482188:web:71957812d2b5eb0c9bc2e9

# Same as Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

### Step 3: Start Services

```bash
# Terminal 1: Backend
cd artifacts/api-server
pnpm run dev

# Terminal 2: Frontend  
cd artifacts/salam-journey
pnpm run dev
```

### Step 4: Test

1. Open http://localhost:5173
2. Click "Continue with Google" button
3. Complete Google login
4. You should be logged in! ✅

---

## What's Happening Behind the Scenes

```
Google Auth (Frontend) 
    ↓
Firebase ID Token 
    ↓
POST /auth/firebase 
    ↓
Backend Verification + JWT Creation 
    ↓
Custom JWT Token 
    ↓
localStorage Storage 
    ↓
Automatic JWT in All Requests
```

---

## Verify It's Working

### Frontend Console
```javascript
// Open DevTools > Console
localStorage.getItem('auth_token')  // Should show JWT
localStorage.getItem('auth_token_expires')  // Should show timestamp
```

### API Request Headers
```javascript
// Network tab should show:
Authorization: Bearer eyJ...
```

### Check User
```javascript
// In Frontend
const { user } = useAuth();
console.log(user); // Should show logged-in user
```

---

## Environment Variables Reference

### For Firebase Project Owners

The Firebase service account credentials file is already in your project:
- **File**: `salam-jourey-firebase-adminsdk-fbsvc-2a397888cd.json`
- **Backend automatically detects it** ✅
- **No additional setup required**

### Frontend Configuration

You only need to set the frontend Firebase config:

```env
# From Firebase Console > Project Settings > Your Apps > Web
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Backend Configuration

Minimal configuration needed:

```env
# Just a strong secret key
JWT_SECRET=your_strong_random_string

# Google Client ID (optional, for fallback)
GOOGLE_CLIENT_ID=your_client_id
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Firebase Admin not initialized" | Check that `salam-jourey-firebase-adminsdk-fbsvc-2a397888cd.json` is in the root directory |
| "Invalid Firebase token" | Verify frontend Firebase config matches the backend credentials |
| "CORS error" | Backend CORS should allow frontend origin |
| "Users not found after login" | Clear browser cache and localStorage, then try again |

---

## Using JWT in Protected Routes

```typescript
// In your API routes
import { requireAuth } from "./lib/auth-middleware";

router.get("/api/protected-route", requireAuth, async (req, res) => {
  const userId = req.userId; // Automatically set by middleware
  // Use userId to fetch user data
});
```

---

## Production Deployment

1. Set all environment variables in your hosting platform
2. Use strong random string for JWT_SECRET
3. Keep FIREBASE_SERVICE_ACCOUNT_KEY secure
4. Use HTTPS only
5. Consider implementing refresh tokens
6. Monitor authentication metrics

---

## Next Steps

- [ ] Run `pnpm install` in both directories
- [ ] Create `.env` and `.env.local` files
- [ ] Start both dev servers
- [ ] Test Google Sign-In flow
- [ ] Check documentation for advanced features
- [ ] Deploy to production

---

## Need Help?

- **Setup Issues**: See `GOOGLE_SIGNIN_SETUP.md`
- **Technical Details**: See `GOOGLE_SIGNIN_IMPLEMENTATION.md`
- **Implementation Summary**: See `IMPLEMENTATION_SUMMARY.md`

---

**That's it! You now have Google Sign-In fully integrated.** 🎉
