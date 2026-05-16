import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBaqAwG6FUWOw5E_Ii_kb2Vm59RFeQOWAk",
  authDomain: "salam-jourey.firebaseapp.com",
  projectId: "salam-jourey",
  storageBucket: "salam-jourey.firebasestorage.app",
  messagingSenderId: "88995482188",
  appId: "1:88995482188:web:71957812d2b5eb0c9bc2e9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
