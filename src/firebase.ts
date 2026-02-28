import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCKXSxn0mTdGFSDV8Z7TY-AKFq1NrWUmK4",
  authDomain: "procvisual-8afad.firebaseapp.com",
  projectId: "procvisual-8afad",
  storageBucket: "procvisual-8afad.firebasestorage.app",
  messagingSenderId: "567701838235",
  appId: "1:567701838235:web:5e60278c477e4b3c09a93e",
  measurementId: "G-GLZGN2J32J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
