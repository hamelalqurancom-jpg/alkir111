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
 * --- قواعد حماية Firestore المطلوبة (وضع بدون حسابات) ---
 * اذهب إلى Firebase Console > Firestore > Rules واكتب هذا:
 * 
 * [نسخة مفتوحة - للاختبار فقط]
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /charities/global_shared_data/{document=**} {
 *       allow read, write: if true; // مفتوح للجميع - للاختبار فقط
 *     }
 *   }
 * }
 * 
 * الموعد النهائي: ستنتهي مدة allow read, write: if true
 * لذلك خلال فترة الاختبار ضع الموعد لشهر من الآن
 *
 * [تنبيه]: لا تستخدم allow read, write: if true في الإنتاج
 */

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// تعريف خدمات Firebase
window.auth = firebase.auth();
window.db = firebase.firestore();

// إعدادات اللغة لتسجيل الدخول (عربي)
window.auth.languageCode = 'ar';
