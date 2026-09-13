/* =========================================================
   KOLPOTULI V2 — FIREBASE CONFIGURATION
========================================================= */

// 1. Import Firebase Core and Analytics
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";

// 2. Import Auth & Database Modules (needed for user login and saving data)
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 3. Your Exact Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrHTQJLv5NcHKxMHJv9dwkCzQt9nXiqT4",
  authDomain: "kolpotuli.firebaseapp.com",
  projectId: "kolpotuli",
  storageBucket: "kolpotuli.firebasestorage.app",
  messagingSenderId: "1066024421637",
  appId: "1:1066024421637:web:f4784947fcf6531ac1cf6c",
  measurementId: "G-VNXEHSEE2V"
};

// 4. Initialize Firebase Services
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// 5. Export everything so your other scripts can use them
export { 
  app, 
  analytics, 
  auth, 
  db, 
  provider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs 
};