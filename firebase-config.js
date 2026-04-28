// firebase-config.js
// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB2a0owQsMRh705Z9icWIBF2nFJ4v_AW7E",
  authDomain: "alkair-1a7a8.firebaseapp.com",
  projectId: "alkair-1a7a8",
  storageBucket: "alkair-1a7a8.firebasestorage.app",
  messagingSenderId: "557517888203",
  appId: "1:557517888203:web:d31d86ab85b7694e85d94e",
  measurementId: "G-C3PL5FH6G3"
};

// --- إعدادات Cloudinary لرفع الصور ---
// (يرجى استبدال هذه القيم ببيانات حسابك)
const cloudinaryConfig = {
  cloudName: "dwrhl6gjf",
  uploadPreset: "asr-kareem"
};
window.cloudinaryConfig = cloudinaryConfig;

/**
 * --- قواعد حماية Firestore المقترحة ---
 * (يجب ضبطها في لوحة تحكم Firebase)
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /charities/{charityId}/{document=**} {
 *       allow read, write: if request.auth != null && request.auth.uid == charityId;
 *     }
 *   }
 * }
 * 
 * --- ملاحظة حول النطاقات المسموحة (Authorized Domains) ---
 * يرجى التأكد من إضافة رابط موقعك (مثل al-khair-66.web.app) في إعدادات 
 * Firebase Console -> Authentication -> Settings -> Authorized Domains
 */

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// تعريف خدمات Firebase
window.auth = firebase.auth();
window.db = firebase.firestore();

// إعدادات اللغة لتسجيل الدخول (عربي)
window.auth.languageCode = 'ar';
