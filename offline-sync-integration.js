// ============================================
// دالات التكامل مع نظام المزامنة
// Offline Sync Integration Functions
// ============================================

/**
 * دالة عامة لحفظ أي بيانات مع المزامنة التلقائية
 * @param {string} type - نوع البيانات (case, donor, expense, etc.)
 * @param {string} action - الإجراء (add, update, delete)
 * @param {object} data - بيانات العملية
 * @returns {string} معرف العملية
 */
window.saveWithSync = function(type, action, data) {
    if (!window.offlineSync) {
        console.error('❌ نظام المزامنة غير متهيأ');
        return null;
    }

    // إضافة العملية إلى قائمة المزامنة
    const operationId = window.offlineSync.addToQueue({
        type: type,
        action: action,
        data: data
    });

    // حفظ في localStorage أيضاً للوصول المباشر أثناء بدء التطبيق
    const key = `local_${type}_${operationId}`;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.warn('⚠️ لا يمكن حفظ في localStorage:', error);
    }

    return operationId;
};

/**
 * دالة لتحديث أي بيانات مع المزامنة التلقائية
 */
window.updateWithSync = function(type, action, data) {
    return window.saveWithSync(type, action, data);
};

/**
 * دالة لحذف أي بيانات مع المزامنة التلقائية
 */
window.deleteWithSync = function(type, dataId) {
    return window.saveWithSync(type, 'delete', { id: dataId });
};

/**
 * دالة للحصول على الحالة الحالية للاتصال
 */
window.getSyncStatus = function() {
    if (!window.offlineSync) return null;
    return {
        status: window.offlineSync.getStatus(),
        isOnline: window.offlineSync.isOnlineStatus(),
        pendingCount: window.offlineSync.getPendingCount(),
        stats: window.offlineSync.getStatistics()
    };
};

/**
 * إنشاء مؤشر حالة الاتصال في الواجهة
 */
window.createSyncStatusIndicator = function() {
    // تحقق من عدم وجود مؤشر موجود بالفعل
    if (document.getElementById('sync-status-indicator')) {
        return;
    }

    const headerTop = document.querySelector('.header-top') || document.querySelector('header') || document.body;
    
    // إنشاء عنصر المؤشر
    const indicator = document.createElement('div');
    indicator.id = 'sync-status-indicator';
    indicator.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 15px;
        border-radius: 20px;
        background: #10b981;
        color: white;
        font-family: 'Cairo', sans-serif;
        font-size: 13px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        transition: all 0.3s ease;
    `;

    // إنشاء شارة العداد
    const badge = document.createElement('span');
    badge.id = 'pending-count-badge';
    badge.style.cssText = `
        display: none;
        position: absolute;
        top: -8px;
        left: -8px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        border: 2px solid white;
    `;

    indicator.appendChild(badge);
    
    // إضافة حدث النقر لعرض تفاصيل
    indicator.addEventListener('click', () => {
        window.showSyncQueueModal();
    });

    // إضافة تأثير Hover
    indicator.addEventListener('mouseover', function() {
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    });

    indicator.addEventListener('mouseout', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    });

    document.body.appendChild(indicator);
    
    // تحديث المؤشر الأول
    if (window.offlineSync) {
        window.offlineSync.updateStatusIndicator();
    }

    console.log('✅ تم إنشاء مؤشر حالة الاتصال');
};

/**
 * إنشاء نافذة مشروط لعرض قائمة المزامنة
 */
window.showSyncQueueModal = function() {
    if (!window.offlineSync) return;

    // التحقق من وجود نافذة موجودة
    let modal = document.getElementById('sync-queue-modal');
    if (modal && modal.style.display !== 'none') {
        modal.style.display = 'none';
        return;
    }

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'sync-queue-modal';
        document.body.appendChild(modal);
    }

    const queue = window.offlineSync.getQueue();
    const stats = window.offlineSync.getStatistics();

    let content = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: 'Cairo', sans-serif;
        " onclick="if(event.target === this) document.getElementById('sync-queue-modal').style.display = 'none'">
            <div style="
                background: white;
                border-radius: 15px;
                padding: 25px;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #1f2937;">📋 قائمة المزامنة</h2>
                    <button onclick="document.getElementById('sync-queue-modal').style.display = 'none'" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #6b7280;
                    ">✕</button>
                </div>

                <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center;">
                        <div>
                            <div style="font-size: 24px; font-weight: bold; color: #1f2937;">${stats.total}</div>
                            <div style="font-size: 12px; color: #6b7280;">إجمالي العمليات</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${stats.pending}</div>
                            <div style="font-size: 12px; color: #6b7280;">معلقة</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: bold; color: #10b981;">${stats.synced}</div>
                            <div style="font-size: 12px; color: #6b7280;">متزامنة</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${stats.failed}</div>
                            <div style="font-size: 12px; color: #6b7280;">فاشلة</div>
                        </div>
                    </div>
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #d1d5db;">
                        <div style="font-size: 13px; color: #6b7280;">
                            <strong>الحالة:</strong> ${stats.isOnline ? '🟢 متصل بالإنترنت' : '🔴 غير متصل'}
                        </div>
                        <div style="font-size: 13px; color: #6b7280; margin-top: 5px;">
                            <strong>آخر مزامنة:</strong> ${stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleString('ar-EG') : 'لم يتم مزامنة بعد'}
                        </div>
                    </div>
                </div>

                <h3 style="margin: 20px 0 10px; color: #374151;">التفاصيل:</h3>
    `;

    if (queue.length === 0) {
        content += '<p style="text-align: center; color: #6b7280; padding: 20px;">✅ لا توجد عمليات معلقة</p>';
    } else {
        queue.forEach(op => {
            let statusColor, statusLabel, statusIcon;
            
            switch (op.status) {
                case 'pending':
                    statusColor = '#f59e0b';
                    statusLabel = 'معلقة';
                    statusIcon = '⏳';
                    break;
                case 'synced':
                    statusColor = '#10b981';
                    statusLabel = 'متزامنة';
                    statusIcon = '✅';
                    break;
                case 'failed':
                    statusColor = '#ef4444';
                    statusLabel = 'فاشلة';
                    statusIcon = '❌';
                    break;
                default:
                    statusColor = '#6b7280';
                    statusLabel = op.status;
                    statusIcon = '❓';
            }

            content += `
                <div style="
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-right: 4px solid ${statusColor};
                    padding: 12px;
                    margin-bottom: 10px;
                    border-radius: 8px;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #1f2937; margin-bottom: 5px;">
                                ${statusIcon} ${op.type} / ${op.action}
                            </div>
                            <div style="font-size: 12px; color: #6b7280;">
                                المعرف: <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${op.id}</code>
                            </div>
                            <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
                                الوقت: ${new Date(op.timestamp).toLocaleString('ar-EG')}
                            </div>
                            ${op.error ? `<div style="font-size: 12px; color: #ef4444; margin-top: 5px;">خطأ: ${op.error}</div>` : ''}
                            ${op.syncedAt ? `<div style="font-size: 12px; color: #10b981; margin-top: 5px;">تمت المزامنة: ${new Date(op.syncedAt).toLocaleString('ar-EG')}</div>` : ''}
                        </div>
                        <div style="text-align: center; min-width: 80px;">
                            <div style="
                                display: inline-block;
                                background: ${statusColor};
                                color: white;
                                padding: 4px 12px;
                                border-radius: 20px;
                                font-size: 12px;
                                font-weight: 600;
                            ">${statusLabel}</div>
                            ${op.status === 'failed' ? `
                                <button onclick="window.offlineSync.retryOperation('${op.id}'); location.reload();" style="
                                    display: block;
                                    margin-top: 8px;
                                    background: #3b82f6;
                                    color: white;
                                    border: none;
                                    padding: 4px 8px;
                                    border-radius: 6px;
                                    font-size: 11px;
                                    cursor: pointer;
                                    width: 100%;
                                ">إعادة محاولة</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    content += `
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="window.offlineSync.clearSyncedOperations(); location.reload();" style="
                        background: #f3f4f6;
                        border: 1px solid #d1d5db;
                        color: #374151;
                        padding: 8px 16px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-family: 'Cairo', sans-serif;
                        font-size: 13px;
                    ">🗑️ حذف المتزامنة</button>
                    <button onclick="document.getElementById('sync-queue-modal').style.display = 'none';" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-family: 'Cairo', sans-serif;
                        font-size: 13px;
                    ">إغلاق</button>
                </div>
            </div>
        </div>
    `;

    modal.innerHTML = content;
    modal.style.display = 'block';
};

/**
 * دالة لتحديث واجهة قائمة العمليات
 */
window.updateSyncQueueUI = function(event) {
    console.log('🔄 تحديث واجهة قائمة المزامنة:', event.type);
    // هذه الدالة يمكن تعديلها حسب احتياجات التطبيق
};

/**
 * دالة لمزامنة جميع العمليات يدويًا
 */
window.manualSync = function() {
    if (!window.offlineSync) return;
    
    console.log('🔄 جاري المزامنة اليدوية...');
    const badge = document.getElementById('pending-count-badge');
    if (badge) {
        badge.innerText = '...';
        badge.style.display = 'flex';
    }
    
    window.offlineSync.attemptSync().then(() => {
        console.log('✅ انتهت المزامنة اليدوية');
    });
};

/**
 * إضافة قائمة سياق (Context Menu) للعمليات
 */
window.addSyncContextMenu = function() {
    document.addEventListener('contextmenu', (e) => {
        const target = e.target.closest('[data-sync-id]');
        if (!target) return;

        e.preventDefault();
        
        const operationId = target.getAttribute('data-sync-id');
        const operation = window.offlineSync.getOperation(operationId);
        
        if (!operation) return;

        // إنشاء قائمة السياق
        let menu = document.getElementById('sync-context-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'sync-context-menu';
            document.body.appendChild(menu);
        }

        let menuHTML = `
            <div style="
                position: fixed;
                top: ${e.clientY}px;
                left: ${e.clientX}px;
                background: white;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                z-index: 10001;
                font-family: 'Cairo', sans-serif;
                min-width: 200px;
                overflow: hidden;
            ">
        `;

        if (operation.status === 'failed') {
            menuHTML += `
                <button onclick="window.offlineSync.retryOperation('${operationId}'); location.reload();" style="
                    width: 100%;
                    text-align: right;
                    padding: 10px 15px;
                    border: none;
                    background: none;
                    cursor: pointer;
                    color: #3b82f6;
                    border-bottom: 1px solid #f3f4f6;
                    font-size: 13px;
                ">🔄 إعادة محاولة</button>
            `;
        }

        menuHTML += `
            <button onclick="window.offlineSync.removeFromQueue('${operationId}'); location.reload();" style="
                width: 100%;
                text-align: right;
                padding: 10px 15px;
                border: none;
                background: none;
                cursor: pointer;
                color: #ef4444;
                font-size: 13px;
            ">🗑️ حذف من قائمة الانتظار</button>
        `;

        menuHTML += `</div>`;
        
        menu.innerHTML = menuHTML;
        
        // إغلاق القائمة عند النقر في أي مكان آخر
        const closeMenu = () => {
            menu.style.display = 'none';
            document.removeEventListener('click', closeMenu);
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 10);
    });
};

/**
 * إضافة تنبيهات الإنترنت
 */
window.setupNetworkAlerts = function() {
    window.addEventListener('online', () => {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-family: 'Cairo', sans-serif;
            font-weight: 600;
            z-index: 999;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = '🟢 تم استعادة الاتصال بالإنترنت';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    });

    window.addEventListener('offline', () => {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-family: 'Cairo', sans-serif;
            font-weight: 600;
            z-index: 999;
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = '🔴 تم قطع الاتصال بالإنترنت - سيتم حفظ البيانات محليًا';
        document.body.appendChild(notification);
    });
};

/**
 * تهيئة نظام المزامنة عند بدء التطبيق
 */
window.initializeOfflineSync = function() {
    console.log('🚀 جاري تهيئة نظام المزامنة...');
    
    // إنشاء مؤشر حالة الاتصال
    window.createSyncStatusIndicator();
    
    // إعداد تنبيهات الشبكة
    window.setupNetworkAlerts();
    
    // إضافة قوائم السياق
    window.addSyncContextMenu();
    
    console.log('✅ تم تهيئة نظام المزامنة بنجاح');
};

// تشغيل التهيئة عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initializeOfflineSync);
} else {
    window.initializeOfflineSync();
}

console.log('✅ تم تحميل دالات التكامل بنجاح');
