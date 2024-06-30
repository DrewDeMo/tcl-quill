import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBU8CBm-Piy1wP63LqlolZGsVN-9ou22t0",
  authDomain: "tcl-money-app.firebaseapp.com",
  projectId: "tcl-money-app",
  storageBucket: "tcl-money-app.appspot.com",
  messagingSenderId: "466660318391",
  appId: "1:466660318391:web:8bbcad218372e9e1318132",
  measurementId: "G-3QXMKVBYXY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { auth, db, analytics };// Trigger new build
