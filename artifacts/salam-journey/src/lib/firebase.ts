import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBaqAwG6FUWOw5E_Ii_kb2Vm59RFeQOWAk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "salam-jourey.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "salam-jourey",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "salam-jourey.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "88995482188",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:88995482188:web:71957812d2b5eb0c9bc2e9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
