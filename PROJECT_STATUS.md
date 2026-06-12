# Project: Salam Journey

## Project Overview
Salam Journey is a web application built with a React frontend and an Express.js backend. It utilizes Drizzle ORM for database management and Firebase for authentication. The project focuses on managing user bookings and course enrollments.

### Tech Stack
- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (via Drizzle ORM)
- **Authentication**: Firebase Auth (Google Sign-In)

---

## Issue Log & Resolutions

### 1. Google Sign-In Button Visibility
- **Problem**: The `GoogleSignInButton` was conditionally hidden if `VITE_GOOGLE_CLIENT_ID` was missing from the environment variables.
- **Cause**: The button was checking for a client ID that is not required when using the Firebase SDK for authentication.
- **Solution**: Removed the conditional check in `artifacts/salam-journey/src/components/auth/google-sign-in-button.tsx` to allow the button to render regardless of that specific environment variable.

### 2. Backend Token Audience Mismatch
- **Problem**: Google Sign-In failed at the backend with a `401 Invalid Google token` error.
- **Cause**: The backend was verifying the `aud` (audience) claim of the ID token against the `GOOGLE_CLIENT_ID`. However, tokens issued by Firebase use the Firebase Project ID as the audience.
- **Solution**: Updated `artifacts/api-server/src/routes/auth.ts` to verify the token audience against `process.env.FIREBASE_PROJECT_ID` (defaulting to `salam-journey`).

### 3. Email Verification Type Mismatch
- **Problem**: Tokens were still being rejected even after the audience fix.
- **Cause**: The backend was strictly checking for `tokenInfo.email_verified === "true"`. Google's `tokeninfo` API can return this value as either a boolean `true` or a string `"true"`.
- **Solution**: Updated the check in `artifacts/api-server/src/routes/auth.ts` to accept both boolean and string representations of `true`.

### 4. Generic Frontend Error Reporting
- **Problem**: When Google Sign-In failed, the frontend displayed a generic `"google_unavailable"` message, making debugging difficult.
- **Cause**: The `googleLogin` function in `use-auth.tsx` had a catch-all block that suppressed the actual API error.
- **Solution**: Modified `artifacts/salam-journey/src/hooks/use-auth.tsx` to catch `ApiError` and return the actual error message from the server.

---

## Current Status
- **Completed**: The Google Sign-In flow has been audited and fixed from both the frontend and backend perspectives.
- **Current Point**: We have stopped at the verification phase where the user should now be able to sign in using Google, and if any failures occur, the frontend will now report the specific error returned by the API.
- **Next Steps**: Verify the end-to-end flow with a real account and proceed with other feature developments.
