// src/firebase.js
// Firebase Web SDK initialization for React.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration (sudah diperbaiki, apiKey utuh)
const firebaseConfig = {
  apiKey: "AIzaSyAf4ANQ01j6we9WUi_5XHkZhxYXxVeJg1A",
  authDomain: "kerjapraktekjsms.firebaseapp.com",
  projectId: "kerjapraktekjsms",
  storageBucket: "kerjapraktekjsms.firebasestorage.app",
  messagingSenderId: "398017396049",
  appId: "1:398017396049:web:dddac07be3c33f0b816770",
  measurementId: "G-DEDYM9PNK0"
};

// Inisialisasi Firebase (hindari double initialization)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Firestore instance
export const db = getFirestore(app);

export default app;