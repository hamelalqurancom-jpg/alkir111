// firebase-config.js
// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCFjTjcoC4XNDBfa7zfS38qISVOg3Zy7Ls",
  authDomain: "kkkkkkk-3185c.firebaseapp.com",
  projectId: "kkkkkkk-3185c",
  storageBucket: "kkkkkkk-3185c.firebasestorage.app",
  messagingSenderId: "483380085587",
  appId: "1:483380085587:web:f8542973f8b083d73d17a6",
  measurementId: "G-SERTKBRZSY"
};

// --- إعدادات Cloudinary لرفع الصور ---
const cloudinaryConfig = {
  cloudName: "dwrhl6gjf",
  uploadPreset: "asr-kareem"
};
window.cloudinaryConfig = cloudinaryConfig;

// تهيئة Firebase (محاطة بـ try/catch لضمان عمل النظام حتى بدون إنترنت)
try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    window.auth = firebase.auth();
    window.auth.languageCode = 'ar';
    console.log('✅ Firebase connected successfully');
  } else {
    console.warn('⚠️ Firebase SDK not loaded - running in offline mode');
    window.auth = null;
    window.db = null;
  }
} catch (e) {
  console.warn('⚠️ Firebase init failed - running in offline mode:', e.message);
  window.auth = null;
  window.db = null;
}
