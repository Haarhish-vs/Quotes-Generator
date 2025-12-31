// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKUoYiZK57VzYCyBeO7YOktVjFv0l7has",
  authDomain: "quotesapp-88d36.firebaseapp.com",
  projectId: "quotesapp-88d36",
  storageBucket: "quotesapp-88d36.firebasestorage.app",
  messagingSenderId: "32926277637",
  appId: "1:32926277637:web:e9424210dba6eecdeafc6c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firestore
const db = getFirestore(app);

export { db };