// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  setPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  set, 
  push, 
  onValue, 
  serverTimestamp, 
  update, 
  remove, 
  query, 
  orderByChild, 
  equalTo,
  get,
  runTransaction // تأكد من إضافة هذه الدالة
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { 
  getStorage, 
  ref as storageRef, 
  uploadBytesResumable, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

// ... (بقية الكود كما هو)

// تصدير الكائنات لاستخدامها في ملفات أخرى
export { 
  app, analytics, auth, database, storage,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut,
  ref, set, push, onValue, serverTimestamp, update, remove, query, orderByChild, equalTo, get, runTransaction,
  storageRef, uploadBytesResumable, getDownloadURL
};
