// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Tu configuración de Firebase que te proporcionaron
const firebaseConfig = {
  apiKey: "AIzaSyCmmYONfq1vYS5raV1bvlHFaIEEFjHRXqY",
  authDomain: "chat-3c167.firebaseapp.com",
  projectId: "chat-3c167",
  storageBucket: "chat-3c167.firebasestorage.app",
  messagingSenderId: "884662572653",
  appId: "1:884662572653:web:538e7525c785f3da655164",
  measurementId: "G-09JD8X4PP4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
export default app;