// ============================================
// نظام تخصيص رسائل الـ WhatsApp + تصفير البرنامج
// WhatsApp Messages Customization System
// ============================================

// --- تهيئة الرسائل الافتراضية ---
window.getDefaultMessages = () => {
    return {
        donationMessage: `شكراً جزيلاً لك أستاذ/ة {{الاسم}} على تبرعك الكريم بمبلغ {{المبلغ}} ج.م لصالح {{اسم_الجمعية}}. جزاكم الله خيراً.`,
        aidMessage: `نحيطكم علماً أستاذ/ة {{الاسم}} بأنه تم تسجيل صرف مساعدة لكم بقيمة {{المبلغ}} {{النوع}} بتاريخ {{التاريخ}}. مع تحيات {{اسم_الجمعية}}.`
    };
};

// --- حفظ الرسائل المخصصة ---
window.saveCustomMessages = () => {
    const donationMsg = document.getElementById('custom-donation-msg')?.value || '';
    const aidMsg = document.getElementById('custom-aid-msg')?.value || '';
    
    if (!donationMsg.trim() || !aidMsg.trim()) {
        alert('❌ جميع الرسائل يجب أن تحتوي على نصوص');
        return false;
    }

    localStorage.setItem('custom_donation_message', donationMsg);
    localStorage.setItem('custom_aid_message', aidMsg);
    
    alert('✅ تم حفظ الرسائل بنجاح!');
    console.log('💾 تم حفظ رسائل WhatsApp المخصصة');
    return true;
};

// --- استعادة الرسائل المخصصة ---
window.getCustomMessages = () => {
    const defaults = window.getDefaultMessages();
    return {
        donationMessage: localStorage.getItem('custom_donation_message') || defaults.donationMessage,
        aidMessage: localStorage.getItem('custom_aid_message') || defaults.aidMessage
    };
};

// --- إعادة تعيين الرسائل للافتراضية ---
window.resetMessagesToDefault = () => {
    if (!confirm('⚠️ هل أنت متأكد من إعادة تعيين الرسائل للقيم الافتراضية؟')) {
        return;
    }
    
    localStorage.removeItem('custom_donation_message');
    localStorage.removeItem('custom_aid_message');
    
    alert('✅ تم إعادة تعيين الرسائل للقيم الافتراضية');
    window.renderPage('settings');
    console.log('🔄 تم استعادة الرسائل الافتراضية');
};

// --- دالة مساعدة لاستبدال المتغيرات في الرسالة ---
window.processMessageTemplate = (template, variables = {}) => {
    let message = template;
    
    // استبدال جميع المتغيرات
    for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        message = message.replace(new RegExp(placeholder, 'g'), value || '');
    }
    
    return message;
};

// --- إرسال رسالة التبرع المخصصة ---
window.sendCustomDonationMessage = (phone, donorName, amount, charityName) => {
    if (!phone) return;
    
    const messages = window.getCustomMessages();
    const msg = window.processMessageTemplate(messages.donationMessage, {
        'الاسم': donorName,
        'المبلغ': amount,
        'اسم_الجمعية': charityName
    });
    
    window.sendWhatsAppMessage(phone, msg);
    console.log('📱 تم إرسال رسالة التبرع المخصصة');
};

// --- إرسال رسالة الصرف المخصصة ---
window.sendCustomAidMessage = (phone, beneficiaryName, amount, date, type, charityName) => {
    if (!phone) return;
    
    const messages = window.getCustomMessages();
    const typeLabel = type === 'inkind' ? 'عيني' : 'ج.م';
    const msg = window.processMessageTemplate(messages.aidMessage, {
        'الاسم': beneficiaryName,
        'المبلغ': amount,
        'النوع': typeLabel,
        'التاريخ': date,
        'اسم_الجمعية': charityName
    });
    
    window.sendWhatsAppMessage(phone, msg);
    console.log('📱 تم إرسال رسالة الصرف المخصصة');
};

// ============================================
// نظام تصفير البرنامج (Reset System)
// ============================================

// --- تصفير جميع العمليات المعلقة (الحركات) ---
window.clearSyncQueue = () => {
    if (!confirm('⚠️ تحذير!\n\nهذا سيمسح جميع العمليات المعلقة (الحركات) غير المزامنة مع الخادم.\n\n✅ البيانات الأساسية (الحالات والتبرعات والمصروفات) ستبقى محفوظة.\n\nهل تريد المتابعة؟')) {
        return false;
    }

    if (!confirm('❌ تأكيد نهائي!\n\nهذا الإجراء لا يمكن التراجع عنه.\nسيتم حذف جميع الحركات المعلقة فقط.\n\nهل أنت متأكد؟')) {
        return false;
    }

    try {
        // حذف بيانات الـ sync queue
        localStorage.removeItem('sync_queue');
        localStorage.removeItem('sync_status');
        localStorage.removeItem('sync_pending_count');
        localStorage.removeItem('last_sync_time');
        
        // إعادة تهيئة نظام المزامنة إذا كان موجوداً
        if (window.offlineSync) {
            window.offlineSync.syncQueue = [];
            window.offlineSync.saveQueue();
            window.offlineSync.updatePendingCount();
            window.offlineSync.notifyListeners('queue_cleared', {});
        }
        
        alert('✅ تم تصفير البرنامج بنجاح!\n\nتم حذف جميع الحركات المعلقة.\nالبيانات الأساسية محفوظة بأمان.');
        console.log('🔄 تم تصفير قائمة العمليات المعلقة (Sync Queue)');
        
        // تحديث الصفحة لتطبيق التغييرات
        if (window.renderPage) {
            window.renderPage('settings');
        }
        
        return true;
    } catch (error) {
        alert('❌ حدث خطأ أثناء التصفير:\n' + error.message);
        console.error('خطأ في تصفير البرنامج:', error);
        return false;
    }
};

// --- عرض إحصائيات الحركات المعلقة ---
window.showPendingOperationsStats = () => {
    if (!window.offlineSync) {
        alert('نظام المزامنة غير متاح');
        return;
    }

    const stats = window.offlineSync.getStatistics();
    const queueLength = window.offlineSync.syncQueue.length;

    let details = `
📊 تقرير حالة الحركات المعلقة
════════════════════════════════
`;

    if (queueLength === 0) {
        details += `
✅ لا توجد حركات معلقة
جميع البيانات محدثة ومتزامنة بنجاح! 🎉
`;
    } else {
        details += `
⏳ عدد الحركات المعلقة: ${queueLength}
🌐 حالة الاتصال: ${stats.isOnline ? '🟢 متصل' : '🔴 غير متصل'}
📈 عمليات فاشلة: ${stats.failed}
🔄 متوسط محاولات: ${stats.averageRetries}

الحركات المعلقة سيتم حذفها عند الضغط على 'تصفير البرنامج'
`;
    }

    console.log(details);
    alert(details);
};

// ============================================
// تحديث دوال الإرسال الموجودة
// Update Existing Send Functions
// ============================================

// --- تحديث دالة الشكر عند التبرع ---
window.sendThankYouMessage_Updated = (phone, donorName, amount, charityName) => {
    window.sendCustomDonationMessage(phone, donorName, amount, charityName);
};

// --- تحديث دالة تأكيد الصرف ---
window.sendAidConfirmationMessage_Updated = (phone, beneficiaryName, amount, date, type, charityName) => {
    window.sendCustomAidMessage(phone, beneficiaryName, amount, date, type, charityName);
};

// ============================================
// HTML لإضافته في قسم الإعدادات
// HTML to Add to Settings Section
// ============================================

window.getMessagesSettingsHTML = () => {
    const messages = window.getCustomMessages();
    const defaults = window.getDefaultMessages();

    return `
                    <!-- ===== رسائل الـ WhatsApp المخصصة ===== -->
                    <div class="card" style="border-top: 4px solid #059669; margin-bottom: 20px;">
                        <div class="card-header" style="background: #f0fdf4;">
                            <h2 style="color: #059669;"><i class="fab fa-whatsapp"></i> رسائل الإخطار عبر WhatsApp</h2>
                            <p style="color: #666; font-size: 0.85rem; margin-top: 5px;">قم بتخصيص نصوص الرسائل المرسلة تلقائياً عند التبرع والصرف</p>
                        </div>
                        <div style="padding: 25px;">
                            <!-- معلومات المتغيرات -->
                            <div style="background: #e0f2fe; border: 1px solid #0284c7; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                                <p style="color: #0369a1; font-weight: 700; margin: 0 0 10px 0;">
                                    <i class="fas fa-info-circle"></i> المتغيرات المتاحة:
                                </p>
                                <div style="color: #0369a1; font-size: 0.9rem; line-height: 1.8;">
                                    • <code style="background:#ffffff; padding: 2px 8px; border-radius: 4px;">{{الاسم}}</code> - اسم المتبرع أو المستفيد
                                    <br>
                                    • <code style="background:#ffffff; padding: 2px 8px; border-radius: 4px;">{{المبلغ}}</code> - المبلغ المتبرع به أو المصروف
                                    <br>
                                    • <code style="background:#ffffff; padding: 2px 8px; border-radius: 4px;">{{اسم_الجمعية}}</code> - اسم الجمعية
                                    <br>
                                    • <code style="background:#ffffff; padding: 2px 8px; border-radius: 4px;">{{التاريخ}}</code> - تاريخ العملية (الصرف فقط)
                                    <br>
                                    • <code style="background:#ffffff; padding: 2px 8px; border-radius: 4px;">{{النوع}}</code> - نوع الصرف: نقدي أو عيني (الصرف فقط)
                                </div>
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
                                <!-- رسالة التبرع -->
                                <div>
                                    <label style="display: block; font-weight: 800; color: #059669; margin-bottom: 10px;">
                                        <i class="fas fa-gift"></i> رسالة الشكر على التبرع
                                    </label>
                                    <textarea 
                                        id="custom-donation-msg"
                                        class="office-input"
                                        rows="6"
                                        placeholder="${defaults.donationMessage}"
                                        style="font-size: 0.9rem; font-family: 'Cairo', sans-serif; width: 100%; padding: 12px; border: 1px solid #d1f2eb; border-radius: 8px; resize: vertical;"
                                    >${messages.donationMessage}</textarea>
                                    <p style="font-size: 0.75rem; color: #666; margin-top: 8px;">
                                        <i class="fas fa-lightbulb"></i> تُرسل هذه الرسالة تلقائياً عند تسجيل تبرع جديد
                                    </p>
                                </div>

                                <!-- رسالة الصرف -->
                                <div>
                                    <label style="display: block; font-weight: 800; color: #0369a1; margin-bottom: 10px;">
                                        <i class="fas fa-hand-holding-heart"></i> رسالة تأكيد الصرف
                                    </label>
                                    <textarea 
                                        id="custom-aid-msg"
                                        class="office-input"
                                        rows="6"
                                        placeholder="${defaults.aidMessage}"
                                        style="font-size: 0.9rem; font-family: 'Cairo', sans-serif; width: 100%; padding: 12px; border: 1px solid #e0f2fe; border-radius: 8px; resize: vertical;"
                                    >${messages.aidMessage}</textarea>
                                    <p style="font-size: 0.75rem; color: #666; margin-top: 8px;">
                                        <i class="fas fa-lightbulb"></i> تُرسل هذه الرسالة تلقائياً عند تسجيل صرف مساعدة
                                    </p>
                                </div>
                            </div>

                            <!-- أزرار التحكم -->
                            <div style="display: flex; gap: 15px; margin-top: 25px; flex-wrap: wrap;">
                                <button 
                                    class="btn-primary"
                                    style="background: linear-gradient(135deg, #059669, #047857); padding: 12px 30px; font-weight: 800; flex: 1; min-width: 200px;"
                                    onclick="window.saveCustomMessages(); setTimeout(() => window.renderPage('settings'), 500);"
                                >
                                    <i class="fas fa-save"></i> حفظ الرسائل المخصصة
                                </button>
                                <button 
                                    class="btn-secondary"
                                    style="border-color: #cbd5e1; color: #64748b; padding: 12px 30px; font-weight: 800;"
                                    onclick="window.resetMessagesToDefault();"
                                >
                                    <i class="fas fa-redo"></i> إعادة تعيين للافتراضي
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- ===== تصفير البرنامج ===== -->
                    <div class="card" style="border-top: 4px solid #f97316; margin-bottom: 20px;">
                        <div class="card-header" style="background: #fff7ed;">
                            <h2 style="color: #ea580c;"><i class="fas fa-broom"></i> تصفير البرنامج</h2>
                            <p style="color: #666; font-size: 0.85rem; margin-top: 5px;">نظّف الحركات المعلقة واستعد من جديد</p>
                        </div>
                        <div style="padding: 25px;">
                            <!-- شرح مفصل -->
                            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                                <p style="color: #92400e; font-weight: 700; margin: 0 0 12px 0;">
                                    <i class="fas fa-info-circle"></i> ماذا يفعل تصفير البرنامج؟
                                </p>
                                <div style="color: #78350f; font-size: 0.9rem; line-height: 2; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                    <div>
                                        <p style="font-weight: 800; margin: 0 0 8px 0;">✅ سيتم حذفه:</p>
                                        <ul style="margin: 0; padding-right: 20px; color: #78350f;">
                                            <li>الحركات المعلقة (العمليات غير المزامنة)</li>
                                            <li>قائمة الانتظار (Sync Queue)</li>
                                            <li>حالة الاتصال المحفوظة</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p style="font-weight: 800; margin: 0 0 8px 0;">🔒 سيبقى محفوظاً:</p>
                                        <ul style="margin: 0; padding-right: 20px; color: #78350f;">
                                            <li>❌ الحالات (البيانات الأساسية)</li>
                                            <li>❌ التبرعات والمتبرعين</li>
                                            <li>❌ المصروفات والمساعدات</li>
                                        </ul>
                                    </div>
                                </div>
                                <p style="color: #b45309; font-weight: 800; margin: 15px 0 0 0; font-size: 0.9rem;">
                                    💡 استخدم هذا عندما تريد تنظيف قائمة الحركات العالقة كما تنظف شيء متسخ ليعود نضيفاً!
                                </p>
                            </div>

                            <!-- عرض الحركات المعلقة -->
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                                <p style="color: #334155; font-weight: 700; margin: 0 0 10px 0;">
                                    <i class="fas fa-tasks"></i> حالة الحركات المعلقة:
                                </p>
                                <div id="pending-ops-status" style="color: #64748b; font-size: 0.9rem;">
                                    <i class="fas fa-spinner fa-spin"></i> جاري تحميل الحالة...
                                </div>
                                <button 
                                    class="btn-secondary"
                                    style="margin-top: 10px; font-size: 0.85rem; padding: 8px 15px;"
                                    onclick="window.showPendingOperationsStats();"
                                >
                                    <i class="fas fa-chart-bar"></i> عرض التفاصيل
                                </button>
                            </div>

                            <!-- زر التصفير -->
                            <button 
                                class="btn-primary"
                                style="width: 100%; background: linear-gradient(135deg, #f97316, #ea580c); padding: 18px; font-weight: 800; font-size: 1.1rem; border-radius: 10px; justify-content: center;"
                                onclick="window.clearSyncQueue();"
                            >
                                <i class="fas fa-broom"></i> تصفير البرنامج الآن
                            </button>
                            <p style="font-size: 0.8rem; color: #e11d48; text-align: center; margin-top: 12px; font-weight: 800;">
                                ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه!
                            </p>
                        </div>
                    </div>
    `;
};

// --- دالة تحديث حالة الحركات المعلقة في الإعدادات ---
window.updatePendingOpsStatus = () => {
    const statusEl = document.getElementById('pending-ops-status');
    if (!statusEl) return;

    if (!window.offlineSync) {
        statusEl.innerHTML = '<span style="color: #666;">نظام المزامنة غير متاح</span>';
        return;
    }

    const stats = window.offlineSync.getStatistics();
    const queueLength = window.offlineSync.syncQueue.length;

    let html = '';
    if (queueLength === 0) {
        html = `<span style="color: #059669; font-weight: 800;">✅ لا توجد حركات معلقة - جميع البيانات محدثة!</span>`;
    } else {
        html = `
            <div style="color: #ea580c; font-weight: 800;">
                ⏳ توجد <strong>${queueLength}</strong> حركة معلقة
            </div>
            <div style="margin-top: 8px; color: #64748b; font-size: 0.85rem;">
                🌐 حالة الاتصال: ${stats.isOnline ? '🟢 متصل' : '🔴 غير متصل'}
                <br>
                ❌ عمليات فاشلة: ${stats.failed}
            </div>
        `;
    }

    statusEl.innerHTML = html;
};

console.log('✅ تم تحميل نظام تخصيص الرسائل وتصفير البرنامج بنجاح');
