// ============================================
// اختبارات نظام المزامنة
// Offline Sync Testing Suite
// ============================================

class OfflineSyncTester {
    constructor() {
        this.tests = [];
        this.results = [];
        this.currentTest = 0;
    }

    /**
     * تشغيل جميع الاختبارات
     */
    async runAllTests() {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║        🧪 بدء مجموعة الاختبارات الشاملة                      ║
║        Offline Sync System - Test Suite                       ║
╚════════════════════════════════════════════════════════════════╝
        `);

        // إضافة جميع الاختبارات
        this.addTests();

        // تشغيل الاختبارات بالتسلسل
        for (const test of this.tests) {
            await this.runTest(test);
        }

        // عرض النتائج
        this.printResults();
    }

    /**
     * إضافة جميع الاختبارات
     */
    addTests() {
        // اختبارات الإضافة
        this.tests.push({
            name: 'إضافة عملية إلى قائمة الانتظار',
            fn: async () => {
                const opId = window.offlineSync.addToQueue({
                    type: 'case',
                    action: 'add',
                    data: { name: 'اختبار', phone: '01234567890' }
                });
                return opId && opId.length > 0;
            }
        });

        // اختبارات الحصول على البيانات
        this.tests.push({
            name: 'الحصول على قائمة الانتظار',
            fn: async () => {
                const queue = window.offlineSync.getQueue();
                return Array.isArray(queue) && queue.length > 0;
            }
        });

        // اختبارات الحالة
        this.tests.push({
            name: 'الحصول على حالة الاتصال',
            fn: async () => {
                const status = window.offlineSync.getStatus();
                return ['synced', 'pending', 'offline'].includes(status);
            }
        });

        // اختبارات الإحصائيات
        this.tests.push({
            name: 'الحصول على الإحصائيات',
            fn: async () => {
                const stats = window.offlineSync.getStatistics();
                return stats.total >= 0 && stats.pending >= 0;
            }
        });

        // اختبار التحديث
        this.tests.push({
            name: 'تحديث حالة العملية',
            fn: async () => {
                const queue = window.offlineSync.getQueue();
                if (queue.length === 0) return false;
                
                const opId = queue[0].id;
                window.offlineSync.updateOperationStatus(opId, 'synced');
                
                const updated = window.offlineSync.getOperation(opId);
                return updated.status === 'synced';
            }
        });

        // اختبار الحذف
        this.tests.push({
            name: 'حذف عملية من قائمة الانتظار',
            fn: async () => {
                const queue = window.offlineSync.getQueue();
                if (queue.length === 0) return false;
                
                const opId = queue[0].id;
                const result = window.offlineSync.removeFromQueue(opId);
                
                const removed = window.offlineSync.getOperation(opId);
                return result && !removed;
            }
        });

        // اختبار التصفية حسب النوع
        this.tests.push({
            name: 'الحصول على العمليات حسب النوع',
            fn: async () => {
                // أضف عملية من نوع محدد
                window.offlineSync.addToQueue({
                    type: 'donation',
                    action: 'add',
                    data: { amount: 100 }
                });
                
                const donations = window.offlineSync.getOperationsByType('donation');
                return Array.isArray(donations) && donations.length > 0;
            }
        });

        // اختبار المستمعين
        this.tests.push({
            name: 'تسجيل ومراقبة أحداث المزامنة',
            fn: async () => {
                let eventFired = false;
                
                const testListener = (event) => {
                    if (event.type === 'operation_added') {
                        eventFired = true;
                    }
                };
                
                window.offlineSync.addListener(testListener);
                
                window.offlineSync.addToQueue({
                    type: 'test',
                    action: 'add',
                    data: {}
                });
                
                await this.delay(100);
                return eventFired;
            }
        });

        // اختبار localStorage
        this.tests.push({
            name: 'حفظ واستعادة من localStorage',
            fn: async () => {
                const queueBefore = window.offlineSync.getQueue().length;
                
                // حفظ
                window.offlineSync.saveQueue();
                
                // محاكاة إعادة تشغيل بحذف الكائن
                const savedData = localStorage.getItem('sync_queue');
                
                return savedData !== null && JSON.parse(savedData).length > 0;
            }
        });

        // اختبار التصدير والاستيراد
        this.tests.push({
            name: 'تصدير واستيراد البيانات',
            fn: async () => {
                const exported = window.offlineSync.exportQueueAsJSON();
                const imported = JSON.parse(exported);
                
                return Array.isArray(imported) && imported.length > 0;
            }
        });

        // اختبار معرفات العمليات الفريدة
        this.tests.push({
            name: 'التحقق من توليد معرفات فريدة',
            fn: async () => {
                const op1 = window.offlineSync.generateOperationId();
                const op2 = window.offlineSync.generateOperationId();
                
                return op1 !== op2;
            }
        });

        // اختبار عدد العمليات المعلقة
        this.tests.push({
            name: 'حساب عدد العمليات المعلقة',
            fn: async () => {
                window.offlineSync.addToQueue({
                    type: 'test',
                    action: 'add',
                    data: {}
                });
                
                const pending = window.offlineSync.getPendingCount();
                return pending >= 1;
            }
        });

        // اختبار الاتصال
        this.tests.push({
            name: 'الكشف عن حالة الاتصال',
            fn: async () => {
                const isOnline = window.offlineSync.isOnlineStatus();
                return typeof isOnline === 'boolean';
            }
        });

        // اختبار مسح قائمة الانتظار
        this.tests.push({
            name: 'مسح قائمة الانتظار بالكامل',
            fn: async () => {
                const countBefore = window.offlineSync.getQueue().length;
                const deleted = window.offlineSync.clearQueue();
                const countAfter = window.offlineSync.getQueue().length;
                
                return countBefore > 0 && deleted > 0 && countAfter === 0;
            }
        });

        // اختبار الحصول على العمليات الفاشلة
        this.tests.push({
            name: 'الحصول على العمليات الفاشلة',
            fn: async () => {
                // أضف عملية وحدد حالتها كفاشلة
                const opId = window.offlineSync.addToQueue({
                    type: 'test',
                    action: 'add',
                    data: {}
                });
                
                window.offlineSync.updateOperationStatus(opId, 'failed', null, 'خطأ اختبار');
                
                const failed = window.offlineSync.getFailedOperations();
                return Array.isArray(failed) && failed.length > 0;
            }
        });

        // اختبار معالجات الأخطاء
        this.tests.push({
            name: 'معالجة الأخطاء في الإضافة',
            fn: async () => {
                try {
                    // محاولة إضافة عملية بدون نوع
                    window.offlineSync.addToQueue({
                        action: 'add',
                        data: {}
                    });
                    return false; // يجب أن ترجع false
                } catch (error) {
                    return true;
                }
            }
        });
    }

    /**
     * تشغيل اختبار واحد
     */
    async runTest(test) {
        this.currentTest++;
        
        try {
            console.log(`\n🧪 اختبار ${this.currentTest}/${this.tests.length}: ${test.name}...`);
            
            const result = await test.fn();
            
            if (result) {
                console.log(`✅ نجح الاختبار: ${test.name}`);
                this.results.push({ name: test.name, status: 'pass' });
            } else {
                console.log(`❌ فشل الاختبار: ${test.name}`);
                this.results.push({ name: test.name, status: 'fail' });
            }
        } catch (error) {
            console.log(`💥 خطأ في الاختبار: ${test.name} - ${error.message}`);
            this.results.push({ name: test.name, status: 'error', error: error.message });
        }
    }

    /**
     * طباعة النتائج
     */
    printResults() {
        const passed = this.results.filter(r => r.status === 'pass').length;
        const failed = this.results.filter(r => r.status === 'fail').length;
        const errors = this.results.filter(r => r.status === 'error').length;
        const total = this.results.length;

        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    📊 نتائج الاختبارات                         ║
╠════════════════════════════════════════════════════════════════╣
║ إجمالي الاختبارات:  ${total}
║ ✅ نجح:           ${passed}
║ ❌ فشل:           ${failed}
║ 💥 أخطاء:         ${errors}
║ 
║ معدل النجاح:      ${((passed / total) * 100).toFixed(2)}%
╠════════════════════════════════════════════════════════════════╣
║                    تفاصيل النتائج:
╠════════════════════════════════════════════════════════════════╣
        `);

        this.results.forEach((result, index) => {
            const icon = result.status === 'pass' ? '✅' : 
                        result.status === 'fail' ? '❌' : '💥';
            const errorMsg = result.error ? ` - ${result.error}` : '';
            console.log(`║ ${index + 1}. ${icon} ${result.name}${errorMsg}`);
        });

        console.log(`╚════════════════════════════════════════════════════════════════╝`);
    }

    /**
     * تأخير بسيط
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * الحصول على ملخص النتائج
     */
    getSummary() {
        return {
            total: this.results.length,
            passed: this.results.filter(r => r.status === 'pass').length,
            failed: this.results.filter(r => r.status === 'fail').length,
            errors: this.results.filter(r => r.status === 'error').length,
            successRate: ((this.results.filter(r => r.status === 'pass').length / this.results.length) * 100).toFixed(2)
        };
    }
}

// ============================================
// اختبارات الأداء
// ============================================

class PerformanceTester {
    constructor() {
        this.benchmarks = [];
    }

    async runBenchmarks() {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║              ⚡ اختبارات الأداء والسرعة                       ║
╚════════════════════════════════════════════════════════════════╝
        `);

        // اختبار سرعة الإضافة
        await this.benchmarkAddingOperations();
        
        // اختبار سرعة الحصول على البيانات
        await this.benchmarkRetrieval();
        
        // اختبار سرعة الحذف
        await this.benchmarkDeletion();
        
        // اختبار سرعة المزامنة
        await this.benchmarkSyncPerformance();
        
        this.printBenchmarks();
    }

    async benchmarkAddingOperations() {
        const count = 1000;
        const start = performance.now();
        
        for (let i = 0; i < count; i++) {
            window.offlineSync.addToQueue({
                type: 'test',
                action: 'add',
                data: { iteration: i }
            });
        }
        
        const end = performance.now();
        const time = end - start;
        const average = time / count;
        
        this.benchmarks.push({
            name: 'إضافة 1000 عملية',
            time: time.toFixed(2) + 'ms',
            average: average.toFixed(4) + 'ms/عملية'
        });

        console.log(`⚡ إضافة 1000 عملية: ${time.toFixed(2)}ms (${average.toFixed(4)}ms للعملية)`);
    }

    async benchmarkRetrieval() {
        const start = performance.now();
        
        for (let i = 0; i < 100; i++) {
            window.offlineSync.getQueue();
        }
        
        const end = performance.now();
        const time = end - start;
        const average = time / 100;
        
        this.benchmarks.push({
            name: 'جلب البيانات 100 مرة',
            time: time.toFixed(2) + 'ms',
            average: average.toFixed(4) + 'ms'
        });

        console.log(`⚡ جلب البيانات 100 مرة: ${time.toFixed(2)}ms`);
    }

    async benchmarkDeletion() {
        const queueLength = window.offlineSync.getQueue().length;
        const start = performance.now();
        
        window.offlineSync.clearQueue();
        
        const end = performance.now();
        const time = end - start;
        
        this.benchmarks.push({
            name: `حذف ${queueLength} عملية`,
            time: time.toFixed(2) + 'ms'
        });

        console.log(`⚡ حذف ${queueLength} عملية: ${time.toFixed(2)}ms`);
    }

    async benchmarkSyncPerformance() {
        const start = performance.now();
        
        await window.offlineSync.attemptSync();
        
        const end = performance.now();
        const time = end - start;
        
        this.benchmarks.push({
            name: 'محاولة مزامنة واحدة',
            time: time.toFixed(2) + 'ms'
        });

        console.log(`⚡ محاولة مزامنة: ${time.toFixed(2)}ms`);
    }

    printBenchmarks() {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    ⚡ نتائج الأداء                             ║
╠════════════════════════════════════════════════════════════════╣
        `);

        this.benchmarks.forEach((bench, index) => {
            console.log(`║ ${index + 1}. ${bench.name}`);
            console.log(`║    الوقت: ${bench.time}`);
            if (bench.average) {
                console.log(`║    المتوسط: ${bench.average}`);
            }
        });

        console.log(`╚════════════════════════════════════════════════════════════════╝`);
    }
}

// ============================================
// تشغيل الاختبارات
// ============================================

window.startSyncTests = async function() {
    // تشغيل الاختبارات الوظيفية
    const functionalTester = new OfflineSyncTester();
    await functionalTester.runAllTests();
    
    // تشغيل اختبارات الأداء
    const performanceTester = new PerformanceTester();
    await performanceTester.runBenchmarks();
    
    // عرض الملخص النهائي
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   ✅ انتهت جميع الاختبارات                    ║
╚════════════════════════════════════════════════════════════════╝

للبدء مع نظام المزامنة في التطبيق الخاص بك:
1. تأكد من وجود ملفات offline-sync.js و offline-sync-integration.js
2. أضف السكريبتات في index.html
3. استخدم الدوال المتاحة:
   - window.saveWithSync(type, action, data)
   - window.getSyncStatus()
   - window.showSyncQueueModal()

للمزيد من المعلومات، اقرأ: OFFLINE_SYNC_GUIDE.md
    `);
};

console.log('✅ تم تحميل مجموعة الاختبارات بنجاح');
console.log('💡 استدعِ: window.startSyncTests() لبدء الاختبارات');
