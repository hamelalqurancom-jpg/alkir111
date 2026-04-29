# 🔥 دليل إصلاح مزامنة Firebase - خطوة بخطوة

## ❗ المشكلة الأساسية: قواعد Firestore تمنع الكتابة

السبب الأول لعدم المزامنة هو أن Firebase ترفض القراءة/الكتابة لأن القواعد الافتراضية تشترط تسجيل الدخول.

---

## ✅ الخطوة الوحيدة المطلوبة منك: ضبط قواعد Firestore

### 1. افتح هذا الرابط مباشرة:
```
https://console.firebase.google.com/project/kkkkkkk-3185c/firestore/rules
```

### 2. امسح كل النص الموجود في المحرر واستبدله بهذا تماماً:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // بيانات الجمعية المشتركة (مفتوحة للقراءة والكتابة)
    match /charities/global_shared_data/{document=**} {
      allow read, write: if true;
    }
    // حسابات المستخدمين (محمية)
    match /charities/{charityId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == charityId;
    }
  }
}
```

### 3. اضغط زر **"نشر"** (Publish)

---

## 🔍 كيف تعرف أن المشكلة من القواعد؟

افتح المتصفح > F12 > Console - إذا رأيت:
```
🔒 FIRESTORE PERMISSION DENIED
```
فهذا يعني القواعد هي السبب.

---

## 🏗️ هيكل قاعدة البيانات في Firebase

```
charities/
  └── global_shared_data/          ← وثيقة المزامنة المشتركة
        ├── cases/                 ← مجموعة الحالات
        │     ├── {id}
        │     └── ...
        ├── donations/             ← مجموعة التبرعات
        ├── expenses/              ← مجموعة المصروفات
        ├── volunteers/            ← مجموعة المتطوعين
        ├── affidavits/            ← مجموعة الإفادات
        └── inventory/             ← مجموعة المخزن
```

---

## 📝 ملاحظات مهمة

| الموضوع | التفاصيل |
|---------|----------|
| **مدة القاعدة المفتوحة** | تنتهي تلقائياً بعد 30 يوم في Firebase |
| **النسخة الاحتياطية** | البيانات تُحفظ في localStorage تلقائياً كـ fallback |
| **تزامن لحظي** | المستمع (onSnapshot) يُحدّث كل الأجهزة فور الحفظ |
| **SDK المستخدم** | Firebase Compat v10 (النسخة المتوافقة مع الكود القديم) |

---

## ⚙️ إعدادات Firebase الحالية

```javascript
projectId: "kkkkkkk-3185c"
authDomain: "kkkkkkk-3185c.firebaseapp.com"
المسار: charities/global_shared_data/{collection}/{docId}
```

---

## 🚀 بعد ضبط القواعد - كيف تختبر المزامنة؟

1. افتح التطبيق في متصفحين مختلفين
2. أضف حالة جديدة في المتصفح الأول
3. في خلال **1-2 ثانية** يظهر في المتصفح الثاني تلقائياً
4. مؤشر الحالة في الأعلى سيُظهر: `✅ متزامن مع السحابة`
