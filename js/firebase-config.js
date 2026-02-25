// ============================================================
//  Firebase Configuration – Sentiment AI
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, where, Timestamp, doc, setDoc }
  from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlStbiWCJG2j5YSByBglTZ2PvrchwFVAc",
  authDomain: "sentiment-ai-708f0.firebaseapp.com",
  projectId: "sentiment-ai-708f0",
  storageBucket: "sentiment-ai-708f0.firebasestorage.app",
  messagingSenderId: "596779712157",
  appId: "1:596779712157:web:9caa86e23dcb1dc1a8de74",
  measurementId: "G-5251XVR0SW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ── Auth Helpers ─────────────────────────────────────────────
async function registerUser(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // Store user profile in Firestore
  await setDoc(doc(db, "users", cred.user.uid), {
    email: cred.user.email,
    displayName: email.split('@')[0],
    createdAt: Timestamp.now()
  });
  return cred.user;
}

async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

async function logoutUser() {
  await signOut(auth);
  sessionStorage.clear();
  window.location.href = 'index.html';
}

function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

function getCurrentUser() {
  return auth.currentUser;
}

// ── Session guard for protected pages ────────────────────────
function requireAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        sessionStorage.clear();
        window.location.href = 'index.html';
      } else {
        // Keep session info in sync
        sessionStorage.setItem('user_email', user.email);
        sessionStorage.setItem('user_name', user.email.split('@')[0]);
        sessionStorage.setItem('user_uid', user.uid);
        resolve(user);
      }
    });
  });
}

// ── Firestore: Emotion Logs ──────────────────────────────────
async function addEmotionLog(logData) {
  const user = auth.currentUser;
  if (!user) return null;
  const docRef = await addDoc(collection(db, "emotion_logs"), {
    ...logData,
    userId: user.uid,
    userName: user.email.split('@')[0],
    timestamp: Timestamp.now()
  });
  return docRef.id;
}

async function getEmotionLogs(maxResults = 200) {
  const user = auth.currentUser;
  if (!user) return [];
  const q = query(
    collection(db, "emotion_logs"),
    where("userId", "==", user.uid),
    orderBy("timestamp", "desc"),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    const ts = data.timestamp?.toDate() || new Date();
    return {
      id: d.id,
      date: ts.toLocaleDateString('en-IN'),
      time: ts.toTimeString().slice(0, 8),
      isoDate: ts.toISOString(),
      emotion: data.emotion,
      confidence: data.confidence,
      source: data.source || 'Live',
      user: data.userName || 'User'
    };
  });
}

// ── UI Helper: populate sidebar/topbar user info ─────────────
function populateUserUI(user) {
  const name = user.email.split('@')[0];
  const els = {
    topbarName: name,
    topbarAvatar: name[0].toUpperCase(),
    sidebarAvatar: name[0].toUpperCase(),
    sidebarName: name,
    sidebarEmail: user.email,
  };
  for (const [id, val] of Object.entries(els)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
}

// Export everything
export {
  app, auth, db,
  registerUser, loginUser, logoutUser, onAuthChange, getCurrentUser, requireAuth,
  addEmotionLog, getEmotionLogs,
  populateUserUI,
  collection, addDoc, getDocs, query, orderBy, limit, where, Timestamp, doc, setDoc
};
