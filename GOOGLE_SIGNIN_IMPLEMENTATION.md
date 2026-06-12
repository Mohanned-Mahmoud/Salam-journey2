# Google Sign-In Implementation Guide

## Architecture Overview

This implementation uses a **hybrid approach** combining Firebase frontend authentication with custom JWT backend tokens:

```
User
  ↓
Firebase Auth (Google Popup)
  ↓
Firebase ID Token
  ↓
POST /api/auth/firebase (with ID Token)
  ↓
Backend: Verify Token → Find/Create User → Issue Custom JWT
  ↓
Custom JWT Token
  ↓
localStorage + Future API Requests (Authorization Header)
```

## Components Implemented

### Backend (Node.js + Express + TypeScript)

#### 1. JWT Utility (`src/lib/jwt.ts`)
- **`createAccessToken(payload: { sub: string })`**: Creates a signed JWT token
- **`verifyAccessToken(token: string)`**: Verifies and decodes a JWT token
- Algorithm: HS256 (HMAC SHA-256)
- Expiration: 7 days by default
- Secret: Read from `JWT_SECRET` environment variable

#### 2. Firebase Auth Route (`src/routes/auth.ts`)
- **`POST /auth/firebase`**
  - Accepts: `{ idToken: string }` (Firebase ID Token from frontend)
  - Verifies token using Firebase Admin SDK
  - Extracts email and picture from decoded token
  - Finds user by email or creates new user:
    - **New User**: Generate username from email prefix, ensure uniqueness by appending random numbers
    - **Existing User**: Only update if new data available
  - Issues custom JWT token
  - Response:
    ```json
    {
      "access_token": "eyJ...",
      "token_type": "Bearer",
      "expires_in": 604800,
      "user": {
        "id": "uuid",
        "name": "username",
        "email": "user@example.com",
        "phone": null,
        "createdAt": "2025-01-01T00:00:00Z"
      }
    }
    ```

### Frontend (React + TypeScript)

#### 1. Firebase Initialization (`src/lib/firebase.ts`)
- Initializes Firebase with environment variables
- Exports `auth`, `googleProvider`, and `app` instances
- Fallback to default values if env vars not set (for development)

#### 2. Google Sign-In Button (`src/components/auth/google-sign-in-button.tsx`)
- Uses `signInWithPopup` to open Google login popup
- Extracts Firebase ID Token using `getIdToken()`
- Sends to backend via `firebaseLogin()` hook
- Displays loading state during authentication

#### 3. Auth Context (`src/hooks/use-auth.tsx`)
- **New method**: `firebaseLogin(idToken: string)`
  - Sends ID token to backend `/auth/firebase`
  - Stores JWT in localStorage with expiration
  - Hydrates user data from `/users/{id}`
  - Updates auth context state
- **Updated**: `apiJson()` now includes JWT in Authorization header

#### 4. API Client (`src/lib/api.ts`)
- **New function**: `getAuthToken()`
  - Retrieves JWT from localStorage
  - Checks token expiration
  - Clears expired tokens
- **Updated**: All requests include `Authorization: Bearer <token>` header if token exists

## Data Flow

### 1. Google Sign-In
```
User clicks "Continue with Google"
    ↓
GoogleSignInButton.handleClick()
    ↓
signInWithPopup(auth, googleProvider)
    ↓
User completes Google login in popup
    ↓
result.user.getIdToken() → Firebase ID Token
    ↓
firebaseLogin(idToken)
```

### 2. Backend Authentication
```
POST /auth/firebase { idToken }
    ↓
admin.auth().verifyIdToken(idToken)
    ↓
Extract email, picture from decoded token
    ↓
db.select().from(usersTable).where(eq(email, ...))
    ↓
[IF NEW USER] → Create user with:
    - name: generated from email or random
    - email: from token
    - passwordHash: null
    ↓
[IF EXISTING] → User found
    ↓
createAccessToken({ sub: user.id })
    ↓
Return { access_token, token_type, expires_in, user }
```

### 3. JWT Storage & Usage
```
Frontend receives response
    ↓
localStorage.setItem("auth_token", access_token)
localStorage.setItem("auth_token_expires", expiration_time)
    ↓
setUser(hydrated_user)
    ↓
Future requests via apiJson()
    ↓
getAuthToken() → Retrieve and validate JWT
    ↓
Attach to headers: Authorization: Bearer <token>
```

## Security Considerations

### Token Security
- **Tokens stored in localStorage**: Accessible to XSS attacks. For enhanced security, use `httpOnly` cookies (requires backend modifications)
- **7-day expiration**: Configurable in JWT utility
- **Secret key**: Must be strong and unique per environment
- **HTTPS only**: Always use HTTPS in production

### Firebase Admin Verification
- Tokens verified using Firebase Admin SDK
- Requires valid service account credentials
- Fallback to Google tokeninfo API if Admin SDK unavailable

### Database
- Passwords are `null` for Firebase-authenticated users
- Email uniqueness enforced at database level
- Phone field currently unused (can be updated later)

### Recommendations
1. **Use httpOnly Cookies**: Set JWT in secure, httpOnly cookies instead of localStorage
2. **Implement Refresh Tokens**: Add a separate refresh token mechanism
3. **Add Rate Limiting**: Prevent brute force attempts on `/auth/firebase`
4. **CSRF Protection**: Ensure CORS is properly configured
5. **Token Rotation**: Implement periodic token refresh

## File Changes Summary

### Created Files
- `artifacts/api-server/src/lib/jwt.ts` - JWT utility

### Modified Files
- `artifacts/api-server/src/routes/auth.ts` - Added `/auth/firebase` endpoint
- `artifacts/salam-journey/src/lib/firebase.ts` - Environment variables support
- `artifacts/salam-journey/src/lib/api.ts` - JWT in Authorization header
- `artifacts/salam-journey/src/hooks/use-auth.tsx` - Added `firebaseLogin` method
- `artifacts/salam-journey/src/components/auth/google-sign-in-button.tsx` - Uses Firebase ID Token

### New Configuration Files
- `GOOGLE_SIGNIN_SETUP.md` - Setup and configuration guide
- `artifacts/salam-journey/.env.example` - Frontend environment variables template

## Testing the Implementation

### Step 1: Configure Environment Variables

```bash
# Frontend: artifacts/salam-journey/.env.local
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_GOOGLE_CLIENT_ID=...

# Backend: .env (root)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
JWT_SECRET=your_strong_secret_key
GOOGLE_CLIENT_ID=...
```

### Step 2: Start Both Services

```bash
# Terminal 1: Backend
cd artifacts/api-server
pnpm install
pnpm run dev

# Terminal 2: Frontend
cd artifacts/salam-journey
pnpm install
pnpm run dev
```

### Step 3: Test Google Sign-In

1. Open frontend in browser (http://localhost:5173)
2. Open auth modal/login page
3. Click "Continue with Google"
4. Complete Google login in popup
5. Check browser console for any errors
6. Verify user is logged in and stored in context

### Step 4: Verify Backend

```bash
# Check server logs for:
# - Token verification success
# - User creation/update
# - JWT issuance

# Test directly:
curl -X POST http://localhost:8080/api/auth/firebase \
  -H "Content-Type: application/json" \
  -d '{"idToken":"<FIREBASE_ID_TOKEN>"}'

# Response should include access_token, user data
```

### Step 5: Verify Token Storage

1. Open browser DevTools → Application → localStorage
2. Look for `auth_token` and `auth_token_expires`
3. Verify token format (header.payload.signature)

## Troubleshooting

### Issue: "Invalid Firebase token"
- **Cause**: Token verification failed
- **Solution**: 
  - Check `FIREBASE_SERVICE_ACCOUNT_KEY` is valid
  - Verify Firebase project ID matches
  - Ensure service account has permissions

### Issue: "Google sign-in is not configured"
- **Cause**: Frontend environment variables not set
- **Solution**:
  - Create `.env.local` in `artifacts/salam-journey/`
  - Set all `VITE_FIREBASE_*` variables
  - Restart frontend dev server

### Issue: Users created with weird usernames
- **Cause**: Email prefix already taken, random suffix applied
- **Solution**: This is expected behavior for duplicate email prefixes

### Issue: Token not included in requests
- **Cause**: localStorage not accessible or token expired
- **Solution**:
  - Check browser localStorage permissions
  - Verify token hasn't expired
  - Check `auth_token_expires` timestamp

### Issue: CORS errors
- **Cause**: Backend CORS not properly configured
- **Solution**:
  - Verify `cors()` middleware in backend
  - Check frontend origin matches CORS settings
  - Add frontend URL to CORS whitelist if needed

## Future Enhancements

1. **Profile Picture Storage**: Add `profilePicture` field to users table
2. **Refresh Tokens**: Implement token refresh mechanism
3. **Session Management**: Add logout functionality with token invalidation
4. **Rate Limiting**: Add authentication attempt limiting
5. **Analytics**: Track Google Sign-In success/failure rates
6. **Social Linking**: Allow linking multiple OAuth providers to one account
7. **Email Verification**: Require email verification before account access
8. **2FA Support**: Add two-factor authentication option
