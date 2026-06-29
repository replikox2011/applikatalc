/* ============================================================
   Firebase configuration (shared Firebase project with `study`)
   ------------------------------------------------------------
   Loads credentials from `/.env.local` dynamically at runtime.
   ============================================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// Default / fallback Firebase configuration (should be populated via env files)
export let firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: '',
};

// Default / fallback Admin credentials (should be populated via env files)
export let adminEmail = '';
export let adminPassword = '';

export let db = null;
export let auth = null;

let resolveInit;
export const firebaseInitPromise = new Promise((resolve) => {
  resolveInit = resolve;
});

async function initFirebase() {
  try {
    const res = await fetch('/.env.local');
    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n');
      const configFromEnv = {};
      for (const line of lines) {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim();

          if (key === 'REACT_APP_FIREBASE_API_KEY') configFromEnv.apiKey = val;
          if (key === 'REACT_APP_FIREBASE_AUTH_DOMAIN') configFromEnv.authDomain = val;
          if (key === 'REACT_APP_FIREBASE_PROJECT_ID') configFromEnv.projectId = val;
          if (key === 'REACT_APP_FIREBASE_STORAGE_BUCKET') configFromEnv.storageBucket = val;
          if (key === 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID') configFromEnv.messagingSenderId = val;
          if (key === 'REACT_APP_FIREBASE_APP_ID') configFromEnv.appId = val;
          if (key === 'REACT_APP_FIREBASE_MEASUREMENT_ID') configFromEnv.measurementId = val;

          if (key === 'REACT_APP_ADMIN_EMAIL') adminEmail = val;
          if (key === 'REACT_APP_ADMIN_PASSWORD') adminPassword = val;
        }
      }

      // Override default config if environment variables are provided
      if (configFromEnv.apiKey) {
        firebaseConfig = { ...firebaseConfig, ...configFromEnv };
      }
    }
  } catch (e) {
    console.log('No local env file loaded or failed to parse. Using defaults.', e);
  }

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  resolveInit({ db, auth });
}

// Start initialization immediately
initFirebase();

export async function saveApplication(data) {
  await firebaseInitPromise;
  const ref = await addDoc(collection(db, 'newusers'), {
    ...data,
    status: 0, // 0 = new | 1 = contacted | 2 = enrolled | 3 = rejected
    createdAt: serverTimestamp(),
    source: 'landing',
  });
  return ref.id;
}
