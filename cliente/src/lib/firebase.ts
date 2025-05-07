// src/lib/firebase.ts - Modifica la configuración de persistencia

import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";

// Configuración de Firebase
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

// Configurar persistencia a nivel de sesión en lugar de 'local'
// Esto hará que Firebase no mantenga la sesión entre recargas de página
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log('Firebase configurado con persistencia de sesión');
  })
  .catch((error) => {
    console.error('Error configurando persistencia:', error);
  });

export { auth };
export default app;