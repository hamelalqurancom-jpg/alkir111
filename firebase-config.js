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
 *     // قاعدة المزامنة المشتركة (بدون تسجيل دخول بالبريد)
 *     match /charities/shared_app_data/{document=**} {
 *       allow read, write: if request.auth != null;
 *     }
 *     // قاعدة الحسابات المسجلة
 *     match /charities/{charityId}/{document=**} {
 *       allow read, write: if request.auth != null && request.auth.uid == charityId;
 *     }
 *   }
 * }
 * 
 * --- ملاحظة حول النطاقات المسموحة (Authorized Domains) ---
 * يرجى التأكد من إضافة رابط موقعك في إعدادات Firebase Console:
 * 1. اذهب إلى Authentication -> Settings -> Authorized Domains
 * 2. أضف النطاقات التالية:
 *    - localhost (للتجربة المحلية)
 *    - m-lapan.github.io (أو رابط GitHub الخاص بك)
 *    - kkkkkkk-3185c.web.app
 */

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// تعريف خدمات Firebase
window.auth = firebase.auth();
window.db = firebase.firestore();

// إعدادات اللغة لتسجيل الدخول (عربي)
window.auth.languageCode = 'ar';
