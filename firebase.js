// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
// e.g., import { getFirestore } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDC80jrgv7iC7pcgCnUsY3GqL1Nh0y9fEY",
  authDomain: "cabin-calendar-3c52f.firebaseapp.com",
  projectId: "cabin-calendar-3c52f",
  storageBucket: "cabin-calendar-3c52f.firebasestorage.app",
  messagingSenderId: "9860592954",
  appId: "1:9860592954:web:d90fbaaa47e4b4061b4c03"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the app if you want to import it in other files:
export { app };
