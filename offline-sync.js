// ============================================
// نظام المزامنة التلقائي للعمل بدون إنترنت
// Offline Sync System
// ============================================

class OfflineSync {
    constructor() {
        this.SYNC_QUEUE_KEY = 'sync_queue';
        this.SYNC_STATUS_KEY = 'sync_status';
        this.PENDING_COUNT_KEY = 'sync_pending_count';
        this.LAST_SYNC_KEY = 'last_sync_time';
        
        this.syncQueue = [];
        this.isSyncing = false;
        this.isOnline = navigator.onLine;
        
        // حالات الاتصال
        this.STATUS = {
            SYNCED: 'synced',      // 🟢 متصل وجميع البيانات مزامنة
            PENDING: 'pending',    // 🟡 متصل لكن بها عمليات معلقة
            OFFLINE: 'offline'     // 🔴 غير متصل
        };
        
        this.currentStatus = this.OFFLINE;
        
        // قائمة المستمعين (Listeners) للتحديثات
        this.listeners = [];
        
        // تحميل قائمة المزامنة من التخزين المحلي
        this.loadQueue();
        
        // إعداد المستمعين لأحداث الاتصال
        this.setupConnectionListeners();
        
        // محاولة المزامنة عند بدء التطبيق إن لزم الأمر
        this.attemptSync();
        
        console.log('✅ نظام المزامنة تم تهيئته بنجاح');
    }

    // ============================================
    // 1️⃣ إضافة عملية إلى قائمة الانتظار
    // ============================================
    addToQueue(operationData) {
        if (!operationData.type || !operationData.action) {
            console.error('❌ بيانات العملية غير صحيحة', operationData);
            return false;
        }

        const operation = {
            id: this.generateOperationId(),
            timestamp: new Date().toISOString(),
            type: operationData.type,           // 'case', 'donor', 'expense', etc.
            action: operationData.action,       // 'add', 'update', 'delete'
            data: operationData.data || {},     // بيانات العملية
            status: 'pending',                  // pending, synced, failed
            retries: 0,
            maxRetries: 5,
            error: null,
            syncedAt: null
        };

        this.syncQueue.push(operation);
        this.saveQueue();
        this.updatePendingCount();
        
        // إخطار المستمعين
        this.notifyListeners('operation_added', operation);
        
        // محاولة المزامنة إذا كان الإنترنت متصلاً
        if (this.isOnline) {
            this.attemptSync();
        }

        console.log(`📝 تم إضافة عملية: ${operation.id}`, operation);
        return operation.id;
    }

    // ============================================
    // 2️⃣ حذف عملية من قائمة الانتظار
    // ============================================
    removeFromQueue(operationId) {
        const index = this.syncQueue.findIndex(op => op.id === operationId);
        if (index > -1) {
            const removed = this.syncQueue.splice(index, 1)[0];
            this.saveQueue();
            this.updatePendingCount();
            this.notifyListeners('operation_removed', removed);
            console.log(`🗑️ تم حذف العملية: ${operationId}`);
            return true;
        }
        return false;
    }

    // ============================================
    // 3️⃣ تحديث حالة عملية
    // ============================================
    updateOperationStatus(operationId, status, syncedAt = null, error = null) {
        const operation = this.syncQueue.find(op => op.id === operationId);
        if (operation) {
            operation.status = status;
            if (syncedAt) operation.syncedAt = syncedAt;
            if (error) operation.error = error;
            this.saveQueue();
            this.notifyListeners('operation_status_changed', operation);
            return true;
        }
        return false;
    }

    // ============================================
    // 4️⃣ محاولة مزامنة جميع العمليات المعلقة
    // ============================================
    async attemptSync() {
        // إذا كنا نقوم بمزامنة بالفعل، لا تبدأ مزامنة أخرى
        if (this.isSyncing) {
            console.log('⏳ مزامنة جارية بالفعل...');
            return;
        }

        // إذا لم يكن هناك إنترنت أو لا توجد عمليات معلقة
        if (!this.isOnline) {
            this.updateStatus(this.STATUS.OFFLINE);
            return;
        }

        if (this.syncQueue.length === 0) {
            this.updateStatus(this.STATUS.SYNCED);
            return;
        }

        this.isSyncing = true;
        this.updateStatus(this.STATUS.PENDING);
        
        console.log(`🔄 بدء المزامنة... (${this.syncQueue.length} عملية معلقة)`);
        
        // الحصول على العمليات المعلقة فقط
        const pendingOperations = this.syncQueue.filter(op => op.status === 'pending');
        
        for (const operation of pendingOperations) {
            try {
                // استدعاء Firebase أو API للمزامنة
                const success = await this.syncOperation(operation);
                
                if (success) {
                    this.updateOperationStatus(
                        operation.id, 
                        'synced', 
                        new Date().toISOString()
                    );
                    console.log(`✅ تمت مزامنة العملية: ${operation.id}`);
                    this.notifyListeners('operation_synced', operation);
                } else {
                    operation.retries++;
                    if (operation.retries >= operation.maxRetries) {
                        this.updateOperationStatus(
                            operation.id, 
                            'failed', 
                            null, 
                            'تجاوز عدد محاولات إعادة المحاولة'
                        );
                        console.error(`❌ فشل تمام: ${operation.id}`);
                        this.notifyListeners('operation_failed', operation);
                    }
                    this.saveQueue();
                }
            } catch (error) {
                console.error(`❌ خطأ أثناء مزامنة: ${operation.id}`, error);
                operation.retries++;
                operation.error = error.message;
                
                if (operation.retries >= operation.maxRetries) {
                    this.updateOperationStatus(operation.id, 'failed', null, error.message);
                    this.notifyListeners('operation_failed', operation);
                }
                this.saveQueue();
            }
            
            // تأخير بسيط بين العمليات لتجنب الإرهاق
            await this.delay(100);
        }

        // تحديث الحالة النهائية
        const remainingPending = this.syncQueue.filter(op => op.status === 'pending');
        if (remainingPending.length === 0) {
            this.updateStatus(this.STATUS.SYNCED);
            this.recordSyncTime();
            console.log('✅ تمت جميع المزامنات بنجاح!');
        } else {
            this.updateStatus(this.STATUS.PENDING);
            console.log(`⚠️ ${remainingPending.length} عملية لم تتمكن من المزامنة`);
        }

        this.isSyncing = false;
    }

    // ============================================
    // 5️⃣ مزامنة عملية واحدة إلى Firebase
    // ============================================
    async syncOperation(operation) {
        // تحقق من وجود Firebase
        if (!window.db || !window.auth) {
            console.warn('⚠️ Firebase غير متصل');
            return false;
        }

        try {
            const userId = window.auth.currentUser?.uid;
            if (!userId) {
                console.error('❌ المستخدم غير مسجل دخول');
                return false;
            }

            // تحديد المسار بناءً على نوع العملية
            const collectionName = this.getCollectionName(operation.type);
            if (!collectionName) {
                console.error(`❌ نوع عملية غير معروف: ${operation.type}`);
                return false;
            }

            const docRef = window.db.collection('charities')
                .doc(window.charityId || userId)
                .collection(collectionName);

            // تنفيذ العملية المناسبة
            switch (operation.action) {
                case 'add':
                    await docRef.add({
                        ...operation.data,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        createdFromOffline: true,
                        localId: operation.id
                    });
                    return true;

                case 'update':
                    if (!operation.data.id) {
                        console.error('❌ معرف المستند مفقود للتحديث');
                        return false;
                    }
                    await docRef.doc(operation.data.id).update({
                        ...operation.data,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedFromOffline: true
                    });
                    return true;

                case 'delete':
                    if (!operation.data.id) {
                        console.error('❌ معرف المستند مفقود للحذف');
                        return false;
                    }
                    await docRef.doc(operation.data.id).delete();
                    return true;

                default:
                    console.error(`❌ إجراء غير معروف: ${operation.action}`);
                    return false;
            }
        } catch (error) {
            console.error('❌ خطأ أثناء مزامنة العملية:', error);
            return false;
        }
    }

    // ============================================
    // 6️⃣ تحديد مجموعة Firebase حسب نوع العملية
    // ============================================
    getCollectionName(type) {
        const typeMap = {
            'case': 'cases',
            'donor': 'donors',
            'expense': 'expenses',
            'donation': 'donations',
            'revenue': 'revenues',
            'treasury': 'treasury',
            'volunteer': 'volunteers',
            'report': 'reports'
        };
        return typeMap[type] || null;
    }

    // ============================================
    // 7️⃣ تحديث حالة الاتصال
    // ============================================
    updateStatus(status) {
        if (this.currentStatus === status) return; // بدون تغيير

        this.currentStatus = status;
        localStorage.setItem(this.SYNC_STATUS_KEY, status);
        this.notifyListeners('status_changed', { status, timestamp: new Date().toISOString() });
        
        this.updateStatusIndicator();
        console.log(`🔔 حالة الاتصال: ${this.getStatusLabel(status)}`);
    }

    // ============================================
    // 8️⃣ أحداث الاتصال والقطع
    // ============================================
    setupConnectionListeners() {
        window.addEventListener('online', () => {
            console.log('🟢 تم استعادة الاتصال بالإنترنت');
            this.isOnline = true;
            this.updateStatus(this.STATUS.PENDING);
            // محاولة المزامنة فوراً عند عودة الإنترنت
            this.attemptSync();
            this.notifyListeners('connection_restored', null);
        });

        window.addEventListener('offline', () => {
            console.log('🔴 تم قطع الاتصال بالإنترنت');
            this.isOnline = false;
            this.updateStatus(this.STATUS.OFFLINE);
            this.notifyListeners('connection_lost', null);
        });

        // فحص الاتصال بشكل دوري (كل 5 ثوان)
        setInterval(() => {
            this.checkConnection();
        }, 5000);
    }

    // ============================================
    // 9️⃣ فحص اتصال الإنترنت بشكل دقيق
    // ============================================
    async checkConnection() {
        try {
            // محاولة جلب ملف صغير من Firebase
            const response = await fetch('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png', {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store'
            });
            
            if (!this.isOnline) {
                console.log('🟢 تم استعادة الاتصال');
                this.isOnline = true;
                window.dispatchEvent(new Event('online'));
            }
        } catch (error) {
            if (this.isOnline) {
                console.log('🔴 تم قطع الاتصال');
                this.isOnline = false;
                window.dispatchEvent(new Event('offline'));
            }
        }
    }

    // ============================================
    // 🔟 تحديث مؤشر الحالة في الواجهة
    // ============================================
    updateStatusIndicator() {
        const indicator = document.getElementById('sync-status-indicator');
        const badge = document.getElementById('pending-count-badge');
        
        if (!indicator) return;

        const status = this.currentStatus;
        const pendingCount = this.getPendingCount();

        // تحديث اللون والأيقونة
        let color, icon, label;
        
        switch (status) {
            case this.STATUS.SYNCED:
                color = '#10b981'; // أخضر
                icon = '🟢';
                label = 'متصل - جميع البيانات مزامنة';
                break;
            case this.STATUS.PENDING:
                color = '#f59e0b'; // أصفر
                icon = '🟡';
                label = `متصل - ${pendingCount} عملية بانتظار المزامنة`;
                break;
            case this.STATUS.OFFLINE:
                color = '#ef4444'; // أحمر
                icon = '🔴';
                label = 'غير متصل بالإنترنت';
                break;
        }

        indicator.style.backgroundColor = color;
        indicator.setAttribute('data-status', status);
        indicator.setAttribute('title', label);
        indicator.innerHTML = `
            <span style="font-size: 18px; margin: 0 5px;">${icon}</span>
            <span class="status-label">${label}</span>
        `;

        // تحديث شارة العدد
        if (badge) {
            if (pendingCount > 0) {
                badge.innerText = pendingCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // ============================================
    // 1️⃣1️⃣ تسجيل آخر وقت مزامنة
    // ============================================
    recordSyncTime() {
        const now = new Date().toISOString();
        localStorage.setItem(this.LAST_SYNC_KEY, now);
        this.notifyListeners('last_sync_updated', now);
    }

    // ============================================
    // 1️⃣2️⃣ حفظ قائمة المزامنة في localStorage
    // ============================================
    saveQueue() {
        try {
            localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
        } catch (error) {
            console.error('❌ خطأ في حفظ قائمة المزامنة:', error);
            // إذا امتلأت الذاكرة، حاول حذف العمليات القديمة المتزامنة
            const syncedOps = this.syncQueue.filter(op => op.status === 'synced');
            if (syncedOps.length > 0) {
                // احتفظ فقط بـ 100 عملية متزامنة
                if (syncedOps.length > 100) {
                    this.syncQueue = this.syncQueue.filter(op => 
                        op.status !== 'synced' || syncedOps.indexOf(op) < 50
                    );
                    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
                }
            }
        }
    }

    // ============================================
    // 1️⃣3️⃣ تحميل قائمة المزامنة من localStorage
    // ============================================
    loadQueue() {
        try {
            const saved = localStorage.getItem(this.SYNC_QUEUE_KEY);
            if (saved) {
                this.syncQueue = JSON.parse(saved);
                console.log(`📦 تم تحميل ${this.syncQueue.length} عملية من قائمة الانتظار`);
            }
        } catch (error) {
            console.error('❌ خطأ في تحميل قائمة المزامنة:', error);
            this.syncQueue = [];
        }
    }

    // ============================================
    // 1️⃣4️⃣ الحصول على عدد العمليات المعلقة
    // ============================================
    getPendingCount() {
        return this.syncQueue.filter(op => op.status === 'pending').length;
    }

    // ============================================
    // 1️⃣5️⃣ تحديث عداد العمليات المعلقة
    // ============================================
    updatePendingCount() {
        const count = this.getPendingCount();
        localStorage.setItem(this.PENDING_COUNT_KEY, count);
        this.updateStatusIndicator();
        this.notifyListeners('pending_count_changed', count);
    }

    // ============================================
    // 1️⃣6️⃣ الحصول على جميع العمليات
    // ============================================
    getQueue() {
        return JSON.parse(JSON.stringify(this.syncQueue)); // نسخة عميقة
    }

    // ============================================
    // 1️⃣7️⃣ الحصول على عملية معينة
    // ============================================
    getOperation(operationId) {
        return this.syncQueue.find(op => op.id === operationId);
    }

    // ============================================
    // 1️⃣8️⃣ الحصول على العمليات حسب النوع
    // ============================================
    getOperationsByType(type) {
        return this.syncQueue.filter(op => op.type === type);
    }

    // ============================================
    // 1️⃣9️⃣ الحصول على العمليات حسب الحالة
    // ============================================
    getOperationsByStatus(status) {
        return this.syncQueue.filter(op => op.status === status);
    }

    // ============================================
    // 2️⃣0️⃣ تسجيل مستمع لأحداث المزامنة
    // ============================================
    addListener(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
            console.log('📡 تم تسجيل مستمع جديد للمزامنة');
        }
    }

    // ============================================
    // 2️⃣1️⃣ إخطار المستمعين بحدث
    // ============================================
    notifyListeners(eventType, data) {
        this.listeners.forEach(callback => {
            try {
                callback({
                    type: eventType,
                    data: data,
                    timestamp: new Date().toISOString(),
                    queue: this.getQueue()
                });
            } catch (error) {
                console.error('❌ خطأ في استدعاء مستمع:', error);
            }
        });
    }

    // ============================================
    // 2️⃣2️⃣ حالات الاتصال
    // ============================================
    getStatus() {
        return this.currentStatus;
    }

    getStatusLabel(status) {
        switch (status) {
            case this.STATUS.SYNCED:
                return '🟢 متصل - مزامن تماماً';
            case this.STATUS.PENDING:
                return `🟡 متصل - ${this.getPendingCount()} عملية معلقة`;
            case this.STATUS.OFFLINE:
                return '🔴 غير متصل';
            default:
                return 'حالة غير معروفة';
        }
    }

    isOnlineStatus() {
        return this.isOnline;
    }

    // ============================================
    // 2️⃣3️⃣ مسح قائمة المزامنة بالكامل
    // ============================================
    clearQueue() {
        const count = this.syncQueue.length;
        this.syncQueue = [];
        this.saveQueue();
        this.updatePendingCount();
        console.log(`🗑️ تم مسح ${count} عملية من قائمة الانتظار`);
        return count;
    }

    // ============================================
    // 2️⃣4️⃣ مسح العمليات المتزامنة فقط
    // ============================================
    clearSyncedOperations() {
        const syncedCount = this.syncQueue.filter(op => op.status === 'synced').length;
        this.syncQueue = this.syncQueue.filter(op => op.status !== 'synced');
        this.saveQueue();
        this.updatePendingCount();
        console.log(`🗑️ تم مسح ${syncedCount} عملية متزامنة`);
        return syncedCount;
    }

    // ============================================
    // 2️⃣5️⃣ إعادة محاولة عملية فاشلة
    // ============================================
    retryOperation(operationId) {
        const operation = this.getOperation(operationId);
        if (operation && operation.status === 'failed') {
            operation.status = 'pending';
            operation.retries = 0;
            operation.error = null;
            this.saveQueue();
            this.notifyListeners('operation_retry', operation);
            console.log(`🔄 جاري إعادة محاولة العملية: ${operationId}`);
            if (this.isOnline) {
                this.attemptSync();
            }
            return true;
        }
        return false;
    }

    // ============================================
    // 2️⃣6️⃣ الحصول على إحصائيات المزامنة
    // ============================================
    getStatistics() {
        return {
            total: this.syncQueue.length,
            pending: this.getPendingCount(),
            synced: this.syncQueue.filter(op => op.status === 'synced').length,
            failed: this.syncQueue.filter(op => op.status === 'failed').length,
            isOnline: this.isOnline,
            currentStatus: this.currentStatus,
            lastSyncTime: localStorage.getItem(this.LAST_SYNC_KEY),
            averageRetries: this.syncQueue.length > 0 
                ? (this.syncQueue.reduce((sum, op) => sum + op.retries, 0) / this.syncQueue.length).toFixed(2)
                : 0
        };
    }

    // ============================================
    // 2️⃣7️⃣ الحصول على تقرير العمليات الفاشلة
    // ============================================
    getFailedOperations() {
        return this.syncQueue.filter(op => op.status === 'failed');
    }

    // ============================================
    // 2️⃣8️⃣ إنشاء معرّف فريد للعملية
    // ============================================
    generateOperationId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // ============================================
    // 2️⃣9️⃣ تأخير بسيط (async/await)
    // ============================================
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ============================================
    // 3️⃣0️⃣ تصدير البيانات للنسخ الاحتياطي
    // ============================================
    exportQueueAsJSON() {
        return JSON.stringify(this.syncQueue, null, 2);
    }

    // ============================================
    // 3️⃣1️⃣ استيراد البيانات من نسخة احتياطية
    // ============================================
    importQueueFromJSON(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (Array.isArray(imported)) {
                this.syncQueue = [...this.syncQueue, ...imported];
                this.saveQueue();
                this.updatePendingCount();
                console.log(`📥 تم استيراد ${imported.length} عملية`);
                return true;
            }
        } catch (error) {
            console.error('❌ خطأ في استيراد البيانات:', error);
        }
        return false;
    }
}

// ============================================
// إنشاء مثيل عام من نظام المزامنة
// ============================================
window.offlineSync = new OfflineSync();

// تسجيل مستمع عام لأحداث المزامنة
window.offlineSync.addListener((event) => {
    console.log(`📡 حدث المزامنة:`, event.type, event.data);
    
    // يمكن استخدام هذا لتحديث واجهة المستخدم
    if (event.type === 'operation_synced' || event.type === 'operation_failed') {
        // تحديث قائمة العمليات في الواجهة إن وجدت
        if (typeof window.updateSyncQueueUI === 'function') {
            window.updateSyncQueueUI(event);
        }
    }
});

// تسجيل Service Worker من أجل المزامنة في الخلفية
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
        // يمكن استخدام Service Worker للمزامنة في الخلفية
        console.log('✅ Service Worker جاهز للمزامنة في الخلفية');
    });
}

console.log('🚀 تم تحميل نظام المزامنة الذكي بنجاح');
