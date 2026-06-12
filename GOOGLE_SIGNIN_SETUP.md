# Environment Variables Setup

## ✅ Firebase Credentials Already Available!

Your project already has Firebase Admin SDK credentials:
- **File**: `salam-jourey-firebase-adminsdk-fbsvc-2a397888cd.json` (in project root)
- **Status**: ✅ Ready to use
- **Backend Setup**: Automatic detection - no configuration needed!

The backend will automatically detect and load this file. No `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable is needed.

## Frontend Environment Variables (`.env.local` in `artifacts/salam-journey/`)

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Backend Environment Variables (`.env` in project root)

```env
# Firebase Admin SDK Credentials
# Option 1: Use the existing service account file (RECOMMENDED)
# Place: salam-jourey-firebase-adminsdk-fbsvc-2a397888cd.json (already in root)
# Backend will automatically detect and use it

# Option 2: JSON credentials string (if file is not in root)
# FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'

# JWT Configuration
JWT_SECRET=your_strong_secret_key_change_in_production

# Google OAuth Client ID (for fallback verification if Firebase Admin is not configured)
GOOGLE_CLIENT_ID=your_google_client_id
```

## Getting Firebase Credentials

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" and follow the setup wizard
3. Enable Google Sign-In in Authentication > Sign-in method

### 2. Get Frontend Credentials

1. In Firebase Console, go to Project Settings
2. Find your "Web apps" section and click your app
3. Copy the configuration object containing:
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

### 3. Get Backend Service Account

1. In Firebase Console, go to Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file - this contains all credentials for `FIREBASE_SERVICE_ACCOUNT_KEY`
4. Or place it as `artifacts/api-server/firebase-adminsdk.json`

### 4. Get Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select your Firebase project
3. Go to APIs & Services > Credentials
4. Create an "OAuth 2.0 Client ID" for Web application
5. Copy the Client ID

## Local Development Setup

### For Frontend:

```bash
cd artifacts/salam-journey
cp .env.example .env.local  # or create .env.local
# Edit .env.local with your Firebase credentials
```

### For Backend:

```bash
cd artifacts/api-server
# Place your firebase-adminsdk.json here
cp /path/to/firebase-adminsdk.json ./firebase-adminsdk.json

# Or set FIREBASE_SERVICE_ACCOUNT_KEY in the root .env
```

## Production Deployment

For production:

1. **Never** commit `.env` or credential files to version control
2. Use environment variable management in your hosting platform:
   - Vercel: Settings > Environment Variables
   - Heroku: Config Vars
   - Docker: Secrets or environment variable injection
3. For `FIREBASE_SERVICE_ACCOUNT_KEY`, copy the entire JSON string and set it as an environment variable
4. Generate a strong `JWT_SECRET` and set it in your production environment

## Testing the Integration

Once configured, the authentication flow works as follows:

1. User clicks "Continue with Google"
2. Firebase Auth popup opens
3. User completes Google login
4. Frontend extracts Firebase ID Token
5. Frontend sends ID Token to `POST /api/auth/firebase`
6. Backend:
   - Verifies token with Firebase Admin SDK
   - Finds or creates user in database
   - Issues custom JWT token
   - Returns access_token, token_type, expires_in, and user data
7. Frontend stores JWT in localStorage
8. Subsequent requests include JWT in `Authorization: Bearer <token>` header

## Troubleshooting

### "Firebase Admin not configured"
- Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` is set correctly
- Or place `firebase-adminsdk.json` in the correct location

### "Invalid Firebase token"
- Check that the frontend is using the correct Firebase project ID
- Ensure Google Sign-In is enabled in Firebase Authentication

### "Google sign-in is not configured"
- Ensure `VITE_GOOGLE_CLIENT_ID` is set in frontend `.env.local`
- Verify the Client ID matches your Firebase project

### Tokens not persisting
- Clear browser cache/localStorage
- Check browser console for localStorage permission errors
- Ensure JWT_SECRET is consistent between sessions
