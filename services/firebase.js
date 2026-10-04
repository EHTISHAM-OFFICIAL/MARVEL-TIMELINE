import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAKQNQbDBw3supNsz1_e3L57Y4BHfXVFV8",
  authDomain: "tracker-marvel.firebaseapp.com",
  projectId: "tracker-marvel",
  storageBucket: "tracker-marvel.firebasestorage.app",
  messagingSenderId: "323039501952",
  appId: "1:323039501952:web:9f654979678a1994369065",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

// Make browser authentication persistence explicit. This removes ambiguity
// around the admin session surviving Firebase's initial auth restoration.
export const authPersistenceReady = setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Firebase browser persistence is unavailable; continuing with session authentication.", error);
});

export const db = getFirestore(firebaseApp);
