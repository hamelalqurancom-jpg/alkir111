// ============================================
// أمثلة متقدمة لنظام المزامنة
// Advanced Examples
// ============================================

/**
 * مثال 1: إدارة الحالات الاجتماعية
 * 
 * السيناريو: إضافة أو تحديث حالات من قبل الموظفين
 * المتطلبات:
 * - حفظ سريع حتى بدون إنترنت
 * - تتبع جميع التغييرات
 * - إخطار عند فشل المزامنة
 */

class CaseManager {
    constructor() {
        this.cases = [];
        this.syncListener = null;
        this.setupSyncListener();
    }

    setupSyncListener() {
        // مستمع مخصص لأحداث الحالات
        window.offlineSync.addListener((event) => {
            if (event.type.includes('case')) {
                this.handleCaseEvent(event);
            }
        });
    }

    async addCase(caseData) {
        // تحقق من البيانات
        if (!this.validateCaseData(caseData)) {
            throw new Error('البيانات غير صحيحة');
        }

        // إضافة طابع زمني وتحديد المستخدم
        const enrichedData = {
            ...caseData,
            createdAt: new Date().toISOString(),
            createdBy: window.currentUser?.name || 'مستخدم غير معروف',
            id: this.generateCaseId(),
            status: 'مفتوحة',
            priority: caseData.priority || 'عادية',
            tags: caseData.tags || []
        };

        // حفظ مع المزامنة
        const operationId = window.saveWithSync('case', 'add', enrichedData);

        // حفظ محلي للوصول الفوري
        this.cases.push(enrichedData);

        // تحديث الواجهة
        this.refreshUI();

        console.log(`✅ تم إضافة الحالة ${enrichedData.id} - العملية: ${operationId}`);

        return {
            caseId: enrichedData.id,
            operationId: operationId,
            offline: !window.offlineSync.isOnlineStatus()
        };
    }

    async updateCase(caseId, updates) {
        // ابحث عن الحالة محليًا
        const caseIndex = this.cases.findIndex(c => c.id === caseId);
        if (caseIndex === -1) {
            throw new Error('الحالة غير موجودة');
        }

        // تحديث محلي
        this.cases[caseIndex] = {
            ...this.cases[caseIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
            updatedBy: window.currentUser?.name || 'مستخدم'
        };

        // حفظ في المزامنة
        const operationId = window.saveWithSync('case', 'update', {
            id: caseId,
            ...updates
        });

        // تحديث الواجهة
        this.refreshUI();

        return operationId;
    }

    async deleteCase(caseId) {
        // حذف محلي
        this.cases = this.cases.filter(c => c.id !== caseId);

        // حفظ في المزامنة
        const operationId = window.deleteWithSync('case', caseId);

        // تحديث الواجهة
        this.refreshUI();

        return operationId;
    }

    handleCaseEvent(event) {
        switch (event.type) {
            case 'operation_synced':
                if (event.data.type === 'case') {
                    console.log(`✅ تمت مزامنة الحالة: ${event.data.id}`);
                    this.showNotification('تمت مزامنة الحالة بنجاح', 'success');
                }
                break;

            case 'operation_failed':
                if (event.data.type === 'case') {
                    console.error(`❌ فشلت مزامنة الحالة: ${event.data.error}`);
                    this.showNotification(
                        `فشل حفظ الحالة: ${event.data.error}`,
                        'error',
                        { retryable: true, operationId: event.data.id }
                    );
                }
                break;
        }
    }

    validateCaseData(data) {
        // التحقق من الحقول المطلوبة
        const required = ['name', 'phone'];
        return required.every(field => data[field] && data[field].trim());
    }

    generateCaseId() {
        return `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    refreshUI() {
        // تحديث عرض الحالات في الواجهة
        const container = document.getElementById('cases-list');
        if (container) {
            container.innerHTML = this.cases.map(c => `
                <div class="case-card" data-case-id="${c.id}">
                    <h3>${c.name}</h3>
                    <p>الهاتف: ${c.phone}</p>
                    <p>الحالة: <span class="status-badge ${c.status}">${c.status}</span></p>
                    <small>أنشئت بواسطة: ${c.createdBy}</small>
                </div>
            `).join('');
        }
    }

    showNotification(message, type = 'info', options = {}) {
        console.log(`[${type.toUpperCase()}] ${message}`);
        // يمكن تطبيق رسائل حقيقية هنا
    }

    getStats() {
        return {
            total: this.cases.length,
            opened: this.cases.filter(c => c.status === 'مفتوحة').length,
            closed: this.cases.filter(c => c.status === 'مغلقة').length,
            synced: window.offlineSync.getOperationsByType('case')
                .filter(op => op.status === 'synced').length
        };
    }
}

// إنشاء مثيل من CaseManager
window.caseManager = new CaseManager();

// مثال على الاستخدام:
/*
await window.caseManager.addCase({
    name: 'أحمد محمد',
    phone: '01234567890',
    address: 'شارع الاستقلال',
    notes: 'حالة معيشية صعبة'
});
*/

---

/**
 * مثال 2: إدارة التبرعات والإيرادات
 * 
 * السيناريو: تسجيل التبرعات والإيرادات
 * المتطلبات:
 * - حفظ آمن للبيانات المالية
 * - تحديث الخزينة تلقائيًا
 * - تقارير فورية
 */

class DonationManager {
    constructor() {
        this.donations = [];
        this.treasury = { balance: 0, lastUpdated: null };
        this.setupListeners();
    }

    setupListeners() {
        window.offlineSync.addListener((event) => {
            if (event.data?.type === 'donation' && event.type === 'operation_synced') {
                // تحديث رصيد الخزينة
                this.updateTreasuryBalance();
            }
        });
    }

    async recordDonation(donation) {
        // تحقق من صحة البيانات
        if (donation.amount <= 0) {
            throw new Error('المبلغ يجب أن يكون موجباً');
        }

        const donationRecord = {
            ...donation,
            id: `donation_${Date.now()}`,
            status: 'معلقة',
            recordedAt: new Date().toISOString(),
            recordedBy: window.currentUser?.name,
            syncStatus: window.offlineSync.isOnlineStatus() ? 'مزامن' : 'معلق'
        };

        // حفظ التبرع
        const operationId = window.saveWithSync('donation', 'add', donationRecord);

        // حفظ محلي
        this.donations.push(donationRecord);

        // تحديث الخزينة محليًا
        this.treasury.balance += donation.amount;
        this.treasury.lastUpdated = new Date().toISOString();

        // حفظ تحديث الخزينة أيضًا
        window.saveWithSync('treasury', 'update', {
            id: 'main_treasury',
            balance: this.treasury.balance,
            lastTransaction: operationId
        });

        console.log(`💰 تم تسجيل تبرع بمبلغ ${donation.amount} - العملية: ${operationId}`);

        return {
            operationId: operationId,
            newBalance: this.treasury.balance,
            offline: !window.offlineSync.isOnlineStatus()
        };
    }

    async recordExpense(expense) {
        // تسجيل مصروف
        const expenseRecord = {
            ...expense,
            id: `expense_${Date.now()}`,
            recordedAt: new Date().toISOString(),
            recordedBy: window.currentUser?.name,
            category: expense.category || 'عام'
        };

        const operationId = window.saveWithSync('expense', 'add', expenseRecord);

        // تقليل رصيد الخزينة
        this.treasury.balance -= expense.amount;

        // حفظ التحديث
        window.saveWithSync('treasury', 'update', {
            id: 'main_treasury',
            balance: this.treasury.balance
        });

        console.log(`💸 تم تسجيل مصروف بمبلغ ${expense.amount} - العملية: ${operationId}`);

        return operationId;
    }

    updateTreasuryBalance() {
        // إعادة حساب الرصيد من جميع العمليات
        const syncedDonations = window.offlineSync.getOperationsByType('donation')
            .filter(op => op.status === 'synced');
        
        const syncedExpenses = window.offlineSync.getOperationsByType('expense')
            .filter(op => op.status === 'synced');

        let balance = 0;
        syncedDonations.forEach(op => balance += op.data.amount || 0);
        syncedExpenses.forEach(op => balance -= op.data.amount || 0);

        this.treasury.balance = balance;
        this.treasury.lastUpdated = new Date().toISOString();

        console.log(`💰 تم تحديث الرصيد: ${this.treasury.balance}`);
    }

    getDailyReport() {
        const today = new Date().toDateString();
        const todayDonations = this.donations.filter(d => 
            new Date(d.recordedAt).toDateString() === today
        );

        const totalDonations = todayDonations.reduce((sum, d) => sum + d.amount, 0);
        const donationCount = todayDonations.length;

        return {
            date: today,
            totalDonations: totalDonations,
            donationCount: donationCount,
            averagePerDonation: donationCount > 0 ? totalDonations / donationCount : 0,
            balance: this.treasury.balance,
            syncedCount: window.offlineSync.getOperationsByType('donation')
                .filter(op => op.status === 'synced').length
        };
    }

    generateFinancialReport(startDate, endDate) {
        const filtered = this.donations.filter(d => {
            const dDate = new Date(d.recordedAt);
            return dDate >= startDate && dDate <= endDate;
        });

        return {
            period: `من ${startDate.toLocaleDateString('ar-EG')} إلى ${endDate.toLocaleDateString('ar-EG')}`,
            totalDonations: filtered.reduce((sum, d) => sum + d.amount, 0),
            donationCount: filtered.length,
            donors: [...new Set(filtered.map(d => d.donorId))].length,
            averagePerDonation: filtered.length > 0 
                ? filtered.reduce((sum, d) => sum + d.amount, 0) / filtered.length 
                : 0,
            methods: this.groupByMethod(filtered),
            categories: this.groupByCategory(filtered)
        };
    }

    groupByMethod(donations) {
        return donations.reduce((acc, d) => {
            acc[d.method] = (acc[d.method] || 0) + d.amount;
            return acc;
        }, {});
    }

    groupByCategory(donations) {
        return donations.reduce((acc, d) => {
            acc[d.category] = (acc[d.category] || 0) + 1;
            return acc;
        }, {});
    }
}

// إنشاء مثيل من DonationManager
window.donationManager = new DonationManager();

---

/**
 * مثال 3: نظام إعادات المحاولة الذكي
 * 
 * السيناريو: إعادة محاولة تلقائية وذكية للعمليات الفاشلة
 */

class SmartRetryManager {
    constructor() {
        this.retryStrategies = {
            exponential: this.exponentialBackoff,
            linear: this.linearBackoff,
            immediate: this.immediateRetry
        };
        this.currentStrategy = 'exponential';
        this.setupListener();
    }

    setupListener() {
        window.offlineSync.addListener((event) => {
            if (event.type === 'operation_failed') {
                this.handleFailedOperation(event.data);
            }
        });
    }

    async handleFailedOperation(operation) {
        const delay = this.calculateDelay(operation.retries);
        
        console.log(`⏳ سيتم إعادة محاولة العملية ${operation.id} بعد ${delay}ms`);

        await this.delay(delay);

        // تحقق من الإنترنت قبل إعادة المحاولة
        if (window.offlineSync.isOnlineStatus()) {
            window.offlineSync.retryOperation(operation.id);
            console.log(`🔄 جاري إعادة محاولة العملية ${operation.id}`);
        } else {
            console.log(`🔴 لا يمكن إعادة المحاولة - الإنترنت غير متصل`);
        }
    }

    calculateDelay(retries) {
        return this.retryStrategies[this.currentStrategy](retries);
    }

    exponentialBackoff(retries) {
        // تأخير أسي: 1s, 2s, 4s, 8s, 16s
        return Math.min(1000 * Math.pow(2, retries), 30000);
    }

    linearBackoff(retries) {
        // تأخير خطي: 5s, 10s, 15s, 20s, 25s
        return (retries + 1) * 5000;
    }

    immediateRetry(retries) {
        // إعادة محاولة فورية
        return 100;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setStrategy(strategyName) {
        if (this.retryStrategies[strategyName]) {
            this.currentStrategy = strategyName;
            console.log(`✅ تم تعيين استراتيجية إعادة المحاولة: ${strategyName}`);
        }
    }
}

// إنشاء مثيل
window.retryManager = new SmartRetryManager();

---

/**
 * مثال 4: لوحة تحكم المزامنة
 * 
 * السيناريو: عرض لوحة تحكم متقدمة لحالة المزامنة
 */

class SyncDashboard {
    constructor() {
        this.updateInterval = 5000; // تحديث كل 5 ثوانية
        this.startAutoUpdate();
    }

    startAutoUpdate() {
        setInterval(() => {
            this.updateDashboard();
        }, this.updateInterval);
    }

    updateDashboard() {
        const stats = window.offlineSync.getStatistics();
        const status = window.getSyncStatus();

        const dashboard = {
            timestamp: new Date().toLocaleString('ar-EG'),
            connection: {
                status: status.isOnline ? '🟢 متصل' : '🔴 غير متصل',
                lastCheck: new Date().toISOString()
            },
            operations: {
                total: stats.total,
                pending: stats.pending,
                synced: stats.synced,
                failed: stats.failed,
                successRate: stats.synced > 0 ? 
                    ((stats.synced / (stats.synced + stats.failed)) * 100).toFixed(2) + '%' : 
                    'N/A'
            },
            performance: {
                averageRetries: stats.averageRetries,
                lastSyncTime: stats.lastSyncTime ? 
                    new Date(stats.lastSyncTime).toLocaleString('ar-EG') : 
                    'لم تتم مزامنة بعد'
            }
        };

        this.renderDashboard(dashboard);
        return dashboard;
    }

    renderDashboard(dashboard) {
        const container = document.getElementById('sync-dashboard');
        if (!container) return;

        const html = `
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <h3>🌐 الاتصال</h3>
                    <p>${dashboard.connection.status}</p>
                </div>
                
                <div class="dashboard-card">
                    <h3>📦 العمليات</h3>
                    <p>الإجمالي: ${dashboard.operations.total}</p>
                    <p>المعلقة: <span class="pending">${dashboard.operations.pending}</span></p>
                    <p>المتزامنة: <span class="synced">${dashboard.operations.synced}</span></p>
                </div>
                
                <div class="dashboard-card">
                    <h3>📊 الأداء</h3>
                    <p>معدل النجاح: ${dashboard.operations.successRate}</p>
                    <p>متوسط المحاولات: ${dashboard.performance.averageRetries}</p>
                </div>
                
                <div class="dashboard-card">
                    <h3>🕐 آخر تحديث</h3>
                    <p>${dashboard.timestamp}</p>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    exportReport() {
        const report = this.updateDashboard();
        const csv = this.convertToCSV(report);
        return csv;
    }

    convertToCSV(report) {
        let csv = 'تقرير المزامنة\n';
        csv += `الوقت: ${report.timestamp}\n\n`;
        
        csv += 'الاتصال\n';
        csv += `الحالة: ${report.connection.status}\n\n`;
        
        csv += 'العمليات\n';
        csv += `الإجمالي: ${report.operations.total}\n`;
        csv += `المعلقة: ${report.operations.pending}\n`;
        csv += `المتزامنة: ${report.operations.synced}\n`;
        csv += `الفاشلة: ${report.operations.failed}\n`;
        
        return csv;
    }
}

// إنشاء مثيل
window.syncDashboard = new SyncDashboard();

---

/**
 * مثال 5: معالج الأخطاء الشامل
 */

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.setupErrorListener();
    }

    setupErrorListener() {
        window.offlineSync.addListener((event) => {
            if (event.type === 'operation_failed') {
                this.logError({
                    operationId: event.data.id,
                    type: event.data.type,
                    action: event.data.action,
                    error: event.data.error,
                    timestamp: event.timestamp,
                    retries: event.data.retries
                });

                // محاولة الإصلاح التلقائي
                this.attemptAutoFix(event.data);
            }
        });

        // اتصد أخطاء JavaScript العامة
        window.addEventListener('error', (event) => {
            this.logError({
                type: 'JavaScript Error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                timestamp: new Date().toISOString()
            });
        });
    }

    logError(error) {
        this.errorLog.push(error);

        // حافظ على حد أقصى لحجم السجل
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }

        // احفظ في localStorage
        localStorage.setItem('error_log', JSON.stringify(this.errorLog));

        console.error('❌ حدث خطأ:', error);
    }

    attemptAutoFix(operation) {
        // محاولات الإصلاح التلقائي حسب نوع الخطأ
        if (operation.error.includes('Network')) {
            console.log('🔧 محاولة الانتظار للاتصال...');
            // سيحاول النظام المزامنة عند عودة الإنترنت
        } else if (operation.error.includes('Invalid')) {
            console.log('⚠️ بيانات غير صحيحة - يحتاج تدخل يدوي');
            this.alertUser(`خطأ في العملية ${operation.id}: البيانات غير صحيحة`);
        } else if (operation.error.includes('Timeout')) {
            console.log('⏱️ انتهت مهلة الوقت - محاولة إعادة');
            window.offlineSync.retryOperation(operation.id);
        }
    }

    alertUser(message) {
        // عرض تنبيه للمستخدم
        console.warn(message);
        // يمكن إضافة واجهة رسومية للتنبيهات
    }

    getErrorLog() {
        return this.errorLog;
    }

    clearErrorLog() {
        this.errorLog = [];
        localStorage.removeItem('error_log');
        console.log('✅ تم مسح سجل الأخطاء');
    }

    generateErrorReport() {
        const report = {
            totalErrors: this.errorLog.length,
            byType: {},
            recent: this.errorLog.slice(-10),
            timestamp: new Date().toISOString()
        };

        // تجميع الأخطاء حسب النوع
        this.errorLog.forEach(err => {
            report.byType[err.type] = (report.byType[err.type] || 0) + 1;
        });

        return report;
    }
}

// إنشاء مثيل
window.errorHandler = new ErrorHandler();

console.log('✅ تم تحميل جميع الأمثلة المتقدمة بنجاح');
