// ============================================================
// 🌙 نظام دورة التوزيع الشهري - Monthly Distribution Cycle
// ============================================================
// يتكامل مع نظام الجمعية الخيرية القائم
// يستخدم appData وsaveData() للتزامن الكامل

// --- DATA STRUCTURE ---
// appData.distributionCycles = [{
//   id: timestamp,
//   name: string,
//   month: number (1-12),
//   year: number,
//   notes: string,
//   status: 'ready' | 'in_progress' | 'completed' | 'archived',
//   warehouses: [warehouseObject],
//   createdAt: ISO string,
//   createdBy: string
// }]
//
// warehouseObject = {
//   id: timestamp,
//   name: string,
//   type: 'inkind' | 'financial' | 'both',
//   description: string,
//   status: 'active' | 'completed',
//   items: [{ inventoryId, name, totalQuantity, usedQuantity, pricePerUnit }],
//   financialAmount: number,
//   beneficiaries: [beneficiaryAssignment],
//   createdAt: ISO string
// }
//
// beneficiaryAssignment = {
//   caseId: number,
//   name: string,
//   phone: string,
//   deliveryStatus: 'waiting' | 'delivered' | 'absent' | 'deferred',
//   items: [{ name, qty }],
//   financialAmount: number,
//   deliveredAt: ISO string | null,
//   deliveredBy: string | null
// }

// --- INIT: ensure distributionCycles array exists ---
window.initDistributionCycles = function () {
    if (!appData.distributionCycles) {
        appData.distributionCycles = [];
    }
};

// ============================================================
// RENDER: دورة التوزيع الشهري (main page)
// ============================================================
window.renderDistributionCyclesPage = function () {
    window.initDistributionCycles();
    const cycles = appData.distributionCycles || [];

    const statusColors = {
        ready: { bg: '#dbeafe', text: '#1e40af', label: 'جاهزة', icon: 'fa-circle-check' },
        in_progress: { bg: '#fef3c7', text: '#92400e', label: 'جارية', icon: 'fa-spinner' },
        completed: { bg: '#d1fae5', text: '#065f46', label: 'مكتملة', icon: 'fa-check-double' },
        archived: { bg: '#f1f5f9', text: '#475569', label: 'مؤرشفة', icon: 'fa-archive' }
    };

    const cycleCards = cycles.length === 0 ? `
        <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px; color: #94a3b8;">
            <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #e0e7ff, #c7d2fe); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                <i class="fas fa-box-open" style="font-size: 2.5rem; color: #6366f1;"></i>
            </div>
            <h3 style="font-size: 1.3rem; color: #475569; margin-bottom: 8px;">لا توجد دورات توزيع بعد</h3>
            <p style="color: #94a3b8;">ابدأ بإنشاء دورة توزيع شهري جديدة</p>
            <button class="btn-primary" style="margin-top: 20px; padding: 12px 30px;" onclick="window.openNewCycleModal()">
                <i class="fas fa-plus-circle"></i> إنشاء أول دورة توزيع
            </button>
        </div>
    ` : cycles.map((cycle, idx) => {
        const sc = statusColors[cycle.status] || statusColors.ready;
        const warehouses = cycle.warehouses || [];
        const totalBeneficiaries = warehouses.reduce((sum, w) => sum + (w.beneficiaries || []).length, 0);
        const deliveredCount = warehouses.reduce((sum, w) =>
            sum + (w.beneficiaries || []).filter(b => b.deliveryStatus === 'delivered').length, 0);
        const progress = totalBeneficiaries > 0 ? Math.round((deliveredCount / totalBeneficiaries) * 100) : 0;
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        return `
            <div class="distribution-cycle-card" onclick="window.openCycleDetail(${cycle.id})" style="
                background: var(--card-bg, white);
                border-radius: 20px;
                padding: 24px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.07);
                border: 1px solid rgba(99,102,241,0.1);
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.25,1,0.5,1);
                position: relative;
                overflow: hidden;
            " onmouseenter="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 40px rgba(99,102,241,0.15)'"
               onmouseleave="this.style.transform=''; this.style.boxShadow='0 4px 20px rgba(0,0,0,0.07)'">
                
                <!-- Status Badge -->
                <div style="position: absolute; top: 16px; left: 16px; background: ${sc.bg}; color: ${sc.text}; padding: 4px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; display: flex; align-items: center; gap: 5px;">
                    <i class="fas ${sc.icon}"></i> ${sc.label}
                </div>

                <!-- Decorative accent -->
                <div style="position: absolute; top: 0; right: 0; width: 6px; height: 100%; background: linear-gradient(180deg, #6366f1, #3b82f6); border-radius: 0 20px 20px 0;"></div>

                <div style="margin-top: 16px;">
                    <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-main, #1e293b); margin-bottom: 4px;">${cycle.name}</h3>
                    <p style="font-size: 0.85rem; color: #6366f1; font-weight: 600; margin-bottom: 16px;">
                        <i class="fas fa-calendar-alt"></i> ${monthNames[(cycle.month || 1) - 1]} ${cycle.year || new Date().getFullYear()}
                    </p>
                </div>

                <!-- Stats Row -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
                    <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 12px;">
                        <div style="font-size: 1.4rem; font-weight: 800; color: #6366f1;">${warehouses.length}</div>
                        <div style="font-size: 0.72rem; color: #64748b; font-weight: 600;">مستودع</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 12px;">
                        <div style="font-size: 1.4rem; font-weight: 800; color: #1d4ed8;">${totalBeneficiaries}</div>
                        <div style="font-size: 0.72rem; color: #64748b; font-weight: 600;">مستفيد</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 12px;">
                        <div style="font-size: 1.4rem; font-weight: 800; color: #10b981;">${deliveredCount}</div>
                        <div style="font-size: 0.72rem; color: #64748b; font-weight: 600;">تم التسليم</div>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div style="margin-bottom: 14px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="font-size: 0.8rem; color: #64748b; font-weight: 600;">نسبة الإنجاز</span>
                        <span style="font-size: 0.8rem; font-weight: 800; color: #6366f1;">${progress}%</span>
                    </div>
                    <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${progress}%; background: linear-gradient(90deg, #6366f1, #3b82f6); border-radius: 4px; transition: width 0.8s ease;"></div>
                    </div>
                </div>

                <!-- Actions -->
                <div style="display: flex; gap: 8px; border-top: 1px solid #f1f5f9; padding-top: 14px;">
                    <button class="btn-primary" style="flex: 1; padding: 8px 12px; font-size: 0.82rem;" onclick="event.stopPropagation(); window.openCycleDetail(${cycle.id})">
                        <i class="fas fa-eye"></i> عرض
                    </button>
                    <button style="flex: 1; padding: 8px 12px; font-size: 0.82rem; background: #f1f5f9; color: #475569; border: none; border-radius: 10px; cursor: pointer; font-family: 'Cairo', sans-serif; font-weight: 600;" onclick="event.stopPropagation(); window.exportCycleReport(${cycle.id})">
                        <i class="fas fa-print"></i> تقرير
                    </button>
                    <button style="padding: 8px 12px; font-size: 0.82rem; background: #fee2e2; color: #e11d48; border: none; border-radius: 10px; cursor: pointer; font-family: 'Cairo', sans-serif; font-weight: 600;" onclick="event.stopPropagation(); window.deleteCycle(${cycle.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div style="padding: 0;">
            <!-- Page Header -->
            <div style="background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%); border-radius: 20px; padding: 28px 32px; margin-bottom: 24px; color: white; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -30px; left: -20px; width: 200px; height: 200px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                <div style="position: absolute; bottom: -40px; left: 120px; width: 150px; height: 150px; background: rgba(255,255,255,0.05); border-radius: 50%;"></div>
                <div style="position: relative; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 6px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <i class="fas fa-boxes" style="margin-left: 10px;"></i> دورات التوزيع الشهري
                        </h2>
                        <p style="opacity: 0.85; font-size: 0.9rem;">
                            إدارة توزيع المساعدات العينية والمالية على المستفيدين
                        </p>
                    </div>
                    <button class="btn-primary" style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.3); padding: 14px 28px; font-size: 1rem; white-space: nowrap; color: white;" onclick="window.openNewCycleModal()">
                        <i class="fas fa-plus-circle"></i> دورة توزيع جديدة
                    </button>
                </div>

                <!-- Quick Stats -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 22px;">
                    ${[
                        { icon: 'fa-layer-group', label: 'إجمالي الدورات', value: cycles.length },
                        { icon: 'fa-play-circle', label: 'جارية الآن', value: cycles.filter(c => c.status === 'in_progress').length },
                        { icon: 'fa-check-double', label: 'مكتملة', value: cycles.filter(c => c.status === 'completed').length },
                        { icon: 'fa-users', label: 'إجمالي المستفيدين', value: cycles.reduce((s, c) => s + (c.warehouses || []).reduce((ws, w) => ws + (w.beneficiaries || []).length, 0), 0) }
                    ].map(stat => `
                        <div style="background: rgba(255,255,255,0.12); border-radius: 14px; padding: 14px; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2);">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 36px; height: 36px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas ${stat.icon}" style="font-size: 1rem;"></i>
                                </div>
                                <div>
                                    <div style="font-size: 1.5rem; font-weight: 800; line-height: 1;">${stat.value}</div>
                                    <div style="font-size: 0.72rem; opacity: 0.8;">${stat.label}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Cycles Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px;">
                ${cycleCards}
            </div>
        </div>

        <!-- New Cycle Modal -->
        <div id="new-cycle-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 5000; display: none; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
            <div style="background: var(--card-bg, white); border-radius: 24px; padding: 32px; width: 100%; max-width: 520px; margin: 20px; box-shadow: 0 25px 50px rgba(0,0,0,0.25); max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h3 style="font-size: 1.3rem; font-weight: 800; color: var(--text-main, #1e293b);">
                        <i class="fas fa-plus-circle" style="color: #6366f1; margin-left: 8px;"></i>
                        إنشاء دورة توزيع جديدة
                    </h3>
                    <button onclick="window.closeNewCycleModal()" style="background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 1.1rem; color: #64748b;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div class="input-group-office">
                        <label style="font-weight: 700; color: #374151; display: block; margin-bottom: 6px;">
                            <i class="fas fa-tag" style="color: #6366f1; margin-left: 5px;"></i> اسم الدورة *
                        </label>
                        <input type="text" id="new-cycle-name" class="office-input" placeholder="مثال: توزيع رمضان 2026" style="font-size: 1rem;">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                        <div class="input-group-office">
                            <label style="font-weight: 700; color: #374151; display: block; margin-bottom: 6px;">
                                <i class="fas fa-calendar" style="color: #6366f1; margin-left: 5px;"></i> الشهر *
                            </label>
                            <select id="new-cycle-month" class="office-input">
                                ${['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'].map((m, i) => `<option value="${i+1}" ${i+1 === new Date().getMonth()+1 ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                        </div>
                        <div class="input-group-office">
                            <label style="font-weight: 700; color: #374151; display: block; margin-bottom: 6px;">
                                <i class="fas fa-calendar-alt" style="color: #6366f1; margin-left: 5px;"></i> السنة *
                            </label>
                            <input type="number" id="new-cycle-year" class="office-input" value="${new Date().getFullYear()}" min="2020" max="2040">
                        </div>
                    </div>
                    <div class="input-group-office">
                        <label style="font-weight: 700; color: #374151; display: block; margin-bottom: 6px;">
                            <i class="fas fa-sticky-note" style="color: #6366f1; margin-left: 5px;"></i> ملاحظات (اختياري)
                        </label>
                        <textarea id="new-cycle-notes" class="office-input" rows="3" placeholder="أضف ملاحظات حول هذه الدورة..." style="resize: vertical;"></textarea>
                    </div>
                </div>

                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <button class="btn-primary" style="flex: 1; padding: 14px; font-size: 1rem;" onclick="window.createNewCycle()">
                        <i class="fas fa-check-circle"></i> إنشاء الدورة
                    </button>
                    <button style="flex: 0.4; padding: 14px; background: #f1f5f9; color: #475569; border: none; border-radius: 12px; cursor: pointer; font-family: 'Cairo',sans-serif; font-weight: 700; font-size: 1rem;" onclick="window.closeNewCycleModal()">إلغاء</button>
                </div>
            </div>
        </div>
    `;
};

// ============================================================
// NEW CYCLE MODAL
// ============================================================
window.openNewCycleModal = function () {
    const modal = document.getElementById('new-cycle-modal');
    if (modal) modal.style.display = 'flex';
};
window.closeNewCycleModal = function () {
    const modal = document.getElementById('new-cycle-modal');
    if (modal) modal.style.display = 'none';
};
window.createNewCycle = function () {
    const name = document.getElementById('new-cycle-name')?.value?.trim();
    const month = parseInt(document.getElementById('new-cycle-month')?.value);
    const year = parseInt(document.getElementById('new-cycle-year')?.value);
    const notes = document.getElementById('new-cycle-notes')?.value?.trim();

    if (!name) { alert('يرجى إدخال اسم الدورة'); return; }
    if (!month || !year) { alert('يرجى اختيار الشهر والسنة'); return; }

    window.initDistributionCycles();
    const newCycle = {
        id: Date.now(),
        name, month, year, notes: notes || '',
        status: 'ready',
        warehouses: [],
        createdAt: new Date().toISOString(),
        createdBy: localStorage.getItem('logged_charity_name') || 'المستخدم'
    };
    appData.distributionCycles.push(newCycle);
    saveData();
    window.closeNewCycleModal();
    window.renderPage('distribution');
    setTimeout(() => window.openCycleDetail(newCycle.id), 100);
};

window.deleteCycle = function (cycleId) {
    const pass = prompt('أدخل كلمة سر الحذف:');
    if (pass !== '1111') { if (pass !== null) alert('كلمة السر خاطئة!'); return; }
    if (!confirm('هل أنت متأكد من حذف هذه الدورة وجميع مستودعاتها؟')) return;
    appData.distributionCycles = appData.distributionCycles.filter(c => c.id !== cycleId);
    saveData();
    window.renderPage('distribution');
};

// ============================================================
// CYCLE DETAIL PAGE
// ============================================================
window.openCycleDetail = function (cycleId) {
    window.initDistributionCycles();
    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    window._currentCycleId = cycleId;

    const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const warehouses = cycle.warehouses || [];
    const totalBenef = warehouses.reduce((s, w) => s + (w.beneficiaries || []).length, 0);
    const delivered = warehouses.reduce((s, w) => s + (w.beneficiaries || []).filter(b => b.deliveryStatus === 'delivered').length, 0);
    const progress = totalBenef > 0 ? Math.round((delivered / totalBenef) * 100) : 0;

    const statusLabels = { ready: 'جاهزة', in_progress: 'جارية', completed: 'مكتملة', archived: 'مؤرشفة' };
    const typeLabels = { inkind: 'عيني', financial: 'مالي', both: 'عيني + مالي' };
    const typeColors = { inkind: '#8b5cf6', financial: '#10b981', both: '#f59e0b' };

    const warehouseCards = warehouses.length === 0 ? `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #f8fafc; border-radius: 16px; border: 2px dashed #cbd5e1;">
            <i class="fas fa-warehouse" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 14px; display: block;"></i>
            <p style="color: #94a3b8; font-size: 1rem; font-weight: 600;">لا توجد مستودعات بعد</p>
            <p style="color: #cbd5e1; font-size: 0.85rem; margin-bottom: 16px;">أنشئ أول مستودع توزيع لهذه الدورة</p>
            <button class="btn-primary" style="padding: 12px 28px;" onclick="window.openNewWarehouseModal()">
                <i class="fas fa-plus"></i> إنشاء مستودع
            </button>
        </div>
    ` : warehouses.map(wh => {
        const whBenef = (wh.beneficiaries || []).length;
        const whDelivered = (wh.beneficiaries || []).filter(b => b.deliveryStatus === 'delivered').length;
        const whProgress = whBenef > 0 ? Math.round((whDelivered / whBenef) * 100) : 0;
        const tc = typeColors[wh.type] || '#6366f1';

        return `
            <div style="background: var(--card-bg, white); border-radius: 18px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.06); border-top: 4px solid ${tc};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
                    <div>
                        <h4 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main, #1e293b); margin-bottom: 4px;">${wh.name}</h4>
                        <span style="background: ${tc}22; color: ${tc}; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">
                            <i class="fas fa-${wh.type === 'inkind' ? 'box' : wh.type === 'financial' ? 'money-bill' : 'layer-group'}"></i>
                            ${typeLabels[wh.type] || wh.type}
                        </span>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button class="btn-primary" style="padding: 7px 14px; font-size: 0.8rem;" onclick="window.openWarehouseManager(${cycleId}, '${wh.id}')">
                            <i class="fas fa-expand"></i> إدارة
                        </button>
                        <button style="padding: 7px 14px; font-size: 0.8rem; background: #ecfdf5; color: #059669; border: none; border-radius: 10px; cursor: pointer; font-family: 'Cairo',sans-serif; font-weight: 700;" onclick="window.openQRScanScreen(${cycleId}, '${wh.id}')">
                            <i class="fas fa-qrcode"></i> مسح
                        </button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                    <div style="text-align: center; padding: 8px; background: #f8fafc; border-radius: 10px;">
                        <div style="font-size: 1.2rem; font-weight: 800; color: ${tc};">${whBenef}</div>
                        <div style="font-size: 0.7rem; color: #64748b;">مستفيد</div>
                    </div>
                    <div style="text-align: center; padding: 8px; background: #ecfdf5; border-radius: 10px;">
                        <div style="font-size: 1.2rem; font-weight: 800; color: #059669;">${whDelivered}</div>
                        <div style="font-size: 0.7rem; color: #64748b;">تم</div>
                    </div>
                    <div style="text-align: center; padding: 8px; background: #fff7ed; border-radius: 10px;">
                        <div style="font-size: 1.2rem; font-weight: 800; color: #ea580c;">${whBenef - whDelivered}</div>
                        <div style="font-size: 0.7rem; color: #64748b;">متبقي</div>
                    </div>
                </div>

                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.78rem; color: #64748b;">
                        <span>الإنجاز</span><span style="font-weight: 700; color: ${tc};">${whProgress}%</span>
                    </div>
                    <div style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; width: ${whProgress}%; background: linear-gradient(90deg, ${tc}, ${tc}aa); border-radius: 3px;"></div>
                    </div>
                </div>

                <div style="display: flex; gap: 6px;">
                    <button style="flex: 1; padding: 6px; font-size: 0.75rem; background: #fee2e2; color: #e11d48; border: none; border-radius: 8px; cursor: pointer; font-family: 'Cairo',sans-serif; font-weight: 700;" onclick="window.deleteWarehouse(${cycleId}, '${wh.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                    <button style="flex: 2; padding: 6px; font-size: 0.75rem; background: #f1f5f9; color: #475569; border: none; border-radius: 8px; cursor: pointer; font-family: 'Cairo',sans-serif; font-weight: 700;" onclick="window.exportWarehouseReport(${cycleId}, '${wh.id}')">
                        <i class="fas fa-file-export"></i> تصدير تقرير
                    </button>
                </div>
            </div>
        `;
    }).join('');

    const contentArea = document.getElementById('content-area');
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.innerText = `دورة التوزيع - ${cycle.name}`;
    if (contentArea) contentArea.innerHTML = `
        <!-- Back + Header -->
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
            <button onclick="window.renderPage('distribution')" style="background: #f1f5f9; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1rem; color: #475569; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-arrow-right"></i>
            </button>
            <div>
                <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--text-main, #1e293b); margin: 0;">${cycle.name}</h2>
                <span style="font-size: 0.85rem; color: #6366f1; font-weight: 600;">
                    <i class="fas fa-calendar"></i> ${monthNames[(cycle.month || 1) - 1]} ${cycle.year}
                    ${cycle.notes ? `· ${cycle.notes}` : ''}
                </span>
            </div>
            <div style="margin-right: auto; display: flex; gap: 10px;">
                <button class="btn-primary" style="padding: 10px 20px; background: #10b981; font-size: 0.9rem;" onclick="window.exportCycleReport(${cycleId})">
                    <i class="fas fa-print"></i> تقرير الدورة
                </button>
            </div>
        </div>

        <!-- Overall Progress Card -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; padding: 24px 28px; margin-bottom: 20px; color: white; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 20px; align-items: center;">
            ${[
                { label: 'المستودعات', value: warehouses.length, icon: 'fa-warehouse', color: '#6366f1' },
                { label: 'إجمالي المستفيدين', value: totalBenef, icon: 'fa-users', color: '#3b82f6' },
                { label: 'تم التسليم', value: delivered, icon: 'fa-check-circle', color: '#10b981' },
                { label: 'المتبقي', value: totalBenef - delivered, icon: 'fa-clock', color: '#f59e0b' }
            ].map(s => `
                <div style="text-align: center;">
                    <div style="width: 48px; height: 48px; background: ${s.color}22; border: 2px solid ${s.color}44; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">
                        <i class="fas ${s.icon}" style="color: ${s.color};"></i>
                    </div>
                    <div style="font-size: 1.8rem; font-weight: 900; line-height: 1;">${s.value}</div>
                    <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 2px;">${s.label}</div>
                </div>
            `).join('')}
        </div>

        <!-- Warehouses Section -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main, #1e293b);">
                <i class="fas fa-warehouse" style="color: #6366f1; margin-left: 8px;"></i> مستودعات التوزيع
            </h3>
            <button class="btn-primary" style="padding: 10px 22px;" onclick="window.openNewWarehouseModal()">
                <i class="fas fa-plus"></i> مستودع جديد
            </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
            ${warehouseCards}
        </div>

        <!-- New Warehouse Modal -->
        ${window.buildNewWarehouseModalHTML(cycleId)}
    `;
};

// ============================================================
// WAREHOUSE MODAL
// ============================================================
window.buildNewWarehouseModalHTML = function (cycleId) {
    return `
        <div id="new-warehouse-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 5000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
            <div style="background: var(--card-bg, white); border-radius: 24px; padding: 32px; width: 100%; max-width: 500px; margin: 20px; box-shadow: 0 25px 50px rgba(0,0,0,0.3); max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-main, #1e293b);">
                        <i class="fas fa-warehouse" style="color: #6366f1; margin-left: 8px;"></i> إنشاء مستودع توزيع
                    </h3>
                    <button onclick="document.getElementById('new-warehouse-modal').style.display='none'" style="background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 1.1rem; color: #64748b;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div class="input-group-office">
                        <label style="font-weight: 700; color: #374151; display: block; margin-bottom: 6px;">اسم المستودع *</label>
                        <input type="text" id="new-wh-name" class="office-input" placeholder="مثال: مستودع رمضان الأول">
                    </div>
                    <div class="input-group-office">
                        <label style="font-weight: 700; color: #374151; display: block; margin-bottom: 8px;">نوع التوزيع *</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                            ${[
                                { val: 'inkind', icon: 'fa-box', label: 'عيني', color: '#8b5cf6' },
                                { val: 'financial', icon: 'fa-money-bill-wave', label: 'مالي', color: '#10b981' },
                                { val: 'both', icon: 'fa-layer-group', label: 'كلاهما', color: '#f59e0b' }
                            ].map(t => `
                                <label style="display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 8px; border: 2px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s; text-align: center;" 
                                       onclick="document.querySelectorAll('.wh-type-label').forEach(l=>l.style.borderColor='#e2e8f0'); this.style.borderColor='${t.color}'; this.style.background='${t.color}11';" class="wh-type-label">
                                    <input type="radio" name="wh-type" value="${t.val}" style="display: none;">
                                    <i class="fas ${t.icon}" style="font-size: 1.4rem; color: ${t.color};"></i>
                                    <span style="font-size: 0.82rem; font-weight: 700; color: #374151;">${t.label}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="input-group-office">
                        <label style="font-weight: 700; color: #374151; display: block; margin-bottom: 6px;">وصف المستودع</label>
                        <textarea id="new-wh-desc" class="office-input" rows="2" placeholder="وصف اختياري..."></textarea>
                    </div>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <button class="btn-primary" style="flex: 1; padding: 14px;" onclick="window.createWarehouse(${cycleId})">
                        <i class="fas fa-save"></i> إنشاء المستودع
                    </button>
                    <button style="flex: 0.4; padding: 14px; background: #f1f5f9; color: #475569; border: none; border-radius: 12px; cursor: pointer; font-family: 'Cairo',sans-serif; font-weight: 700;" onclick="document.getElementById('new-warehouse-modal').style.display='none'">إلغاء</button>
                </div>
            </div>
        </div>
    `;
};

window.openNewWarehouseModal = function () {
    const modal = document.getElementById('new-warehouse-modal');
    if (modal) modal.style.display = 'flex';
};
window.createWarehouse = function (cycleId) {
    const name = document.getElementById('new-wh-name')?.value?.trim();
    const typeInput = document.querySelector('input[name="wh-type"]:checked');
    const type = typeInput ? typeInput.value : null;
    const desc = document.getElementById('new-wh-desc')?.value?.trim();

    if (!name) { alert('يرجى إدخال اسم المستودع'); return; }
    if (!type) { alert('يرجى اختيار نوع التوزيع'); return; }

    window.initDistributionCycles();
    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;

    const newWarehouse = {
        id: String(Date.now()),
        name, type, description: desc || '',
        status: 'active',
        items: [], financialAmount: 0,
        beneficiaries: [],
        createdAt: new Date().toISOString()
    };
    if (!cycle.warehouses) cycle.warehouses = [];
    cycle.warehouses.push(newWarehouse);
    if (cycle.status === 'ready') cycle.status = 'in_progress';
    saveData();
    document.getElementById('new-warehouse-modal').style.display = 'none';
    window.openCycleDetail(cycleId);
};

window.deleteWarehouse = function (cycleId, warehouseId) {
    const pass = prompt('أدخل كلمة سر الحذف:');
    if (pass !== '1111') { if (pass !== null) alert('كلمة السر خاطئة!'); return; }
    if (!confirm('هل أنت متأكد من حذف هذا المستودع؟')) return;
    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    cycle.warehouses = cycle.warehouses.filter(w => w.id !== warehouseId);
    saveData();
    window.openCycleDetail(cycleId);
};

// ============================================================
// WAREHOUSE MANAGER (full management screen)
// ============================================================
window.openWarehouseManager = function (cycleId, warehouseId) {
    window.initDistributionCycles();
    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const wh = cycle.warehouses.find(w => w.id === warehouseId);
    if (!wh) return;

    window._currentCycleId = cycleId;
    window._currentWarehouseId = warehouseId;

    const typeLabels = { inkind: 'عيني', financial: 'مالي', both: 'عيني + مالي' };
    const typeColors = { inkind: '#8b5cf6', financial: '#10b981', both: '#f59e0b' };
    const tc = typeColors[wh.type] || '#6366f1';
    const inventory = appData.inventory || [];
    const cases = appData.cases || [];

    const deliveryStatusLabels = {
        waiting: { label: 'قيد الانتظار', icon: 'fa-hourglass-half', color: '#f59e0b', bg: '#fef3c7' },
        delivered: { label: 'تم التسليم', icon: 'fa-check-circle', color: '#10b981', bg: '#d1fae5' },
        absent: { label: 'غائب', icon: 'fa-user-slash', color: '#e11d48', bg: '#fee2e2' },
        deferred: { label: 'مؤجل', icon: 'fa-clock', color: '#6366f1', bg: '#e0e7ff' }
    };

    const benefs = wh.beneficiaries || [];
    const benefRows = benefs.length === 0 ? `
        <tr><td colspan="7" style="text-align: center; padding: 30px; color: #94a3b8;">لا يوجد مستفيدون مضافون حتى الآن</td></tr>
    ` : benefs.map((b, idx) => {
        const ds = deliveryStatusLabels[b.deliveryStatus] || deliveryStatusLabels.waiting;
        return `
            <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''">
                <td style="padding: 10px 14px; font-weight: 700;">${b.name}</td>
                <td style="padding: 10px 14px; color: #64748b;">${b.phone || '-'}</td>
                <td style="padding: 10px 14px;">
                    <span style="background: ${ds.bg}; color: ${ds.color}; padding: 3px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                        <i class="fas ${ds.icon}"></i> ${ds.label}
                    </span>
                </td>
                <td style="padding: 10px 14px; font-size: 0.82rem; color: #475569;">
                    ${(b.items || []).map(it => `${it.name}: ${it.qty}`).join(' / ') || '-'}
                    ${b.financialAmount ? `<br><span style="color: #10b981; font-weight: 700;">+ ${b.financialAmount} ج.م</span>` : ''}
                </td>
                <td style="padding: 10px 14px; font-size: 0.78rem; color: #94a3b8;">${b.deliveredAt ? new Date(b.deliveredAt).toLocaleString('ar-EG') : '-'}</td>
                <td style="padding: 10px 14px;">
                    <select style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 4px 8px; font-family: 'Cairo',sans-serif; font-size: 0.8rem; cursor: pointer;"
                            onchange="window.updateBenefStatus(${cycleId}, '${warehouseId}', ${idx}, this.value)">
                        <option value="waiting" ${b.deliveryStatus==='waiting'?'selected':''}>قيد الانتظار</option>
                        <option value="delivered" ${b.deliveryStatus==='delivered'?'selected':''}>تم التسليم</option>
                        <option value="absent" ${b.deliveryStatus==='absent'?'selected':''}>غائب</option>
                        <option value="deferred" ${b.deliveryStatus==='deferred'?'selected':''}>مؤجل</option>
                    </select>
                </td>
                <td style="padding: 10px 14px;">
                    <div style="display: flex; gap: 6px;">
                        <button style="padding: 5px 10px; background: #ecfdf5; color: #059669; border: none; border-radius: 8px; cursor: pointer; font-family: 'Cairo',sans-serif; font-size: 0.78rem; font-weight: 700;" onclick="window.confirmDeliveryForBenef(${cycleId}, '${warehouseId}', ${idx})">
                            <i class="fas fa-check"></i> تأكيد
                        </button>
                        <button style="padding: 5px 10px; background: #fee2e2; color: #e11d48; border: none; border-radius: 8px; cursor: pointer; font-family: 'Cairo',sans-serif; font-size: 0.78rem;" onclick="window.removeBeneficiary(${cycleId}, '${warehouseId}', ${idx})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    const inventoryOptions = inventory.map(item => `
        <option value="${item.id}" data-name="${item.name}" data-qty="${item.remainingQuantity}" data-price="${item.unitPrice || 0}">
            ${item.name} (متاح: ${item.remainingQuantity})
        </option>
    `).join('');

    const contentArea = document.getElementById('content-area');
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.innerText = `إدارة المستودع - ${wh.name}`;
    if (contentArea) contentArea.innerHTML = `
        <!-- Back Navigation -->
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
            <button onclick="window.openCycleDetail(${cycleId})" style="background: #f1f5f9; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1rem; color: #475569; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-arrow-right"></i>
            </button>
            <div>
                <h2 style="font-size: 1.2rem; font-weight: 800; color: var(--text-main, #1e293b); margin: 0;">${wh.name}</h2>
                <span style="font-size: 0.82rem; color: ${tc}; font-weight: 700;">
                    <i class="fas fa-tag"></i> ${typeLabels[wh.type] || wh.type}
                    · ${cycle.name}
                </span>
            </div>
            <div style="margin-right: auto; display: flex; gap: 10px;">
                <button class="btn-primary" style="padding: 10px 18px; background: #6366f1; font-size: 0.88rem;" onclick="window.openQRScanScreen(${cycleId}, '${warehouseId}')">
                    <i class="fas fa-qrcode"></i> مسح QR
                </button>
                <button class="btn-primary" style="padding: 10px 18px; background: #10b981; font-size: 0.88rem;" onclick="window.exportWarehouseReport(${cycleId}, '${warehouseId}')">
                    <i class="fas fa-print"></i> تقرير
                </button>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 380px; gap: 18px;">
            <!-- LEFT: Beneficiaries Table -->
            <div>
                <!-- Add Beneficiaries Panel - Multi-Method -->
                <div style="background: var(--card-bg, white); border-radius: 18px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 16px;">
                    <h4 style="font-size: 1rem; font-weight: 800; color: var(--text-main, #1e293b); margin-bottom: 14px;">
                        <i class="fas fa-user-plus" style="color: #6366f1; margin-left: 6px;"></i> إضافة مستفيدين
                    </h4>

                    <!-- Method Tabs -->
                    <div style="display: flex; gap: 6px; margin-bottom: 16px; background: #f1f5f9; border-radius: 12px; padding: 4px;">
                        <button id="wh-tab-search" onclick="window.switchAddTab('search', ${cycleId}, '${warehouseId}')"
                            style="flex:1; padding: 8px 10px; border: none; border-radius: 9px; cursor: pointer; font-family:'Cairo',sans-serif; font-size:0.8rem; font-weight:700; background:#6366f1; color:white; transition:all 0.2s;">
                            <i class="fas fa-search"></i> بحث بالاسم
                        </button>
                        <button id="wh-tab-range" onclick="window.switchAddTab('range', ${cycleId}, '${warehouseId}')"
                            style="flex:1; padding: 8px 10px; border: none; border-radius: 9px; cursor: pointer; font-family:'Cairo',sans-serif; font-size:0.8rem; font-weight:700; background:transparent; color:#64748b; transition:all 0.2s;">
                            <i class="fas fa-list-ol"></i> نطاق رقمي
                        </button>
                        <button id="wh-tab-table" onclick="window.switchAddTab('table', ${cycleId}, '${warehouseId}')"
                            style="flex:1; padding: 8px 10px; border: none; border-radius: 9px; cursor: pointer; font-family:'Cairo',sans-serif; font-size:0.8rem; font-weight:700; background:transparent; color:#64748b; transition:all 0.2s;">
                            <i class="fas fa-table"></i> جدول الاختيار
                        </button>
                        <button id="wh-tab-all" onclick="window.switchAddTab('all', ${cycleId}, '${warehouseId}')"
                            style="flex:1; padding: 8px 10px; border: none; border-radius: 9px; cursor: pointer; font-family:'Cairo',sans-serif; font-size:0.8rem; font-weight:700; background:transparent; color:#64748b; transition:all 0.2s;">
                            <i class="fas fa-users"></i> الكل
                        </button>
                    </div>

                    <!-- Tab: Search by Name -->
                    <div id="wh-panel-search">
                        <div style="position: relative;">
                            <i class="fas fa-search" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                            <input type="text" id="wh-beneficiary-search" class="office-input" placeholder="ابحث بالاسم أو الهاتف أو رقم البحث..."
                                   style="padding-right: 38px;"
                                   oninput="window.searchBeneficiaryForWarehouse(this.value, ${cycleId}, '${warehouseId}')">
                        </div>
                        <div id="wh-search-results" style="max-height: 220px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 12px; display: none; margin-top: 8px;"></div>
                    </div>

                    <!-- Tab: Range Selection -->
                    <div id="wh-panel-range" style="display:none;">
                        <div style="background: #f8fafc; border-radius: 12px; padding: 14px;">
                            <p style="font-size:0.82rem; color:#64748b; margin-bottom:12px;">
                                <i class="fas fa-info-circle" style="color:#6366f1;"></i>
                                اختر الحالات من رقم بحث معين لآخر (حسب الترتيب الرقمي)
                            </p>
                            <div style="display: flex; gap: 10px; align-items: flex-end;">
                                <div style="flex:1;">
                                    <label style="font-size:0.8rem; font-weight:700; color:#374151; display:block; margin-bottom:5px;">من رقم</label>
                                    <input type="number" id="wh-range-from" class="office-input" placeholder="1" min="1" style="font-size:0.9rem;">
                                </div>
                                <div style="flex:1;">
                                    <label style="font-size:0.8rem; font-weight:700; color:#374151; display:block; margin-bottom:5px;">إلى رقم</label>
                                    <input type="number" id="wh-range-to" class="office-input" placeholder="50" min="1" style="font-size:0.9rem;">
                                </div>
                                <button class="btn-primary" style="padding:10px 16px; white-space:nowrap; font-size:0.85rem;" onclick="window.previewRangeSelection(${cycleId}, '${warehouseId}')">
                                    <i class="fas fa-eye"></i> معاينة
                                </button>
                            </div>
                            <div id="wh-range-preview" style="margin-top:12px;"></div>
                        </div>
                    </div>

                    <!-- Tab: Table Selection -->
                    <div id="wh-panel-table" style="display:none;">
                        <div style="margin-bottom: 10px; display:flex; justify-content:space-between; align-items:center; gap:8px;">
                            <input type="text" id="wh-table-filter" class="office-input" placeholder="فلترة في الجدول..."
                                   style="flex:1; font-size:0.85rem;"
                                   oninput="window.filterBenefTable(this.value)">
                            <button class="btn-primary" style="padding:8px 14px; font-size:0.82rem; white-space:nowrap; background:#6366f1;" onclick="window.selectAllInTable(${cycleId}, '${warehouseId}')">
                                <i class="fas fa-check-double"></i> تحديد الكل
                            </button>
                            <button class="btn-primary" style="padding:8px 14px; font-size:0.82rem; white-space:nowrap; background:#10b981;" onclick="window.addCheckedFromTable(${cycleId}, '${warehouseId}')">
                                <i class="fas fa-user-plus"></i> إضافة المحددين
                            </button>
                        </div>
                        <div style="max-height: 260px; overflow-y:auto; border:1px solid #e2e8f0; border-radius:12px;">
                            <table style="width:100%; border-collapse:collapse; font-size:0.82rem;" id="wh-cases-table">
                                <thead style="position:sticky;top:0;background:#f8fafc;z-index:1;">
                                    <tr>
                                        <th style="padding:8px 12px; width:36px;"><input type="checkbox" id="wh-check-all" onchange="window.toggleAllTableChecks(this)"></th>
                                        <th style="padding:8px 12px; text-align:right; font-weight:700; color:#475569;">رقم البحث</th>
                                        <th style="padding:8px 12px; text-align:right; font-weight:700; color:#475569;">الاسم</th>
                                        <th style="padding:8px 12px; text-align:right; font-weight:700; color:#475569;">الهاتف</th>
                                    </tr>
                                </thead>
                                <tbody id="wh-cases-tbody">
                                    ${(function() {
                                        const existingIds = new Set((wh.beneficiaries || []).map(b => b.caseId));
                                        return (appData.cases || []).filter(c => !c.hidden && !existingIds.has(c.id))
                                            .map(c => `
                                                <tr class="wh-case-row" data-name="${(c.name||'').toLowerCase()}" data-phone="${(c.phone||'').toLowerCase()}" data-num="${c.searchNumber||''}">
                                                    <td style="padding:7px 12px; text-align:center;">
                                                        <input type="checkbox" class="wh-case-check" data-case-id="${c.id}">
                                                    </td>
                                                    <td style="padding:7px 12px; color:#6366f1; font-weight:700;">${c.searchNumber || '-'}</td>
                                                    <td style="padding:7px 12px; font-weight:700;">${c.name || ''}</td>
                                                    <td style="padding:7px 12px; color:#64748b;">${c.phone || '-'}</td>
                                                </tr>
                                            `).join('') || '<tr><td colspan="4" style="text-align:center;padding:20px;color:#94a3b8;">لا توجد حالات متاحة</td></tr>';
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Tab: Add All -->
                    <div id="wh-panel-all" style="display:none;">
                        <div style="background: #fef3c7; border-radius: 12px; padding: 16px; text-align:center;">
                            <i class="fas fa-users" style="font-size:2rem; color:#d97706; margin-bottom:10px; display:block;"></i>
                            <p style="font-size:0.88rem; color:#92400e; margin-bottom:14px; font-weight:700;">
                                سيتم إضافة جميع الحالات غير المضافة حتى الآن دفعةً واحدة
                            </p>
                            <p style="font-size:0.8rem; color:#b45309; margin-bottom:14px;">
                                الحالات المتاحة: <strong>${(appData.cases || []).filter(c => !c.hidden && !(wh.beneficiaries||[]).some(b=>b.caseId===c.id)).length}</strong> حالة
                            </p>
                            <button class="btn-primary" style="padding:12px 28px; background:#d97706; font-size:0.9rem;" onclick="window.addAllCasesToWarehouse(${cycleId}, '${warehouseId}')">
                                <i class="fas fa-users"></i> إضافة الجميع
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Beneficiaries Table -->
                <div style="background: var(--card-bg, white); border-radius: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow: hidden;">
                    <div style="padding: 16px 20px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="font-size: 1rem; font-weight: 800; color: var(--text-main, #1e293b); margin: 0;">
                            <i class="fas fa-list" style="color: #6366f1; margin-left: 6px;"></i>
                            قائمة المستفيدين (${benefs.length})
                        </h4>
                        <div style="display: flex; gap: 8px; font-size: 0.78rem;">
                            ${['waiting','delivered','absent','deferred'].map(s => {
                                const ds = deliveryStatusLabels[s];
                                const count = benefs.filter(b => b.deliveryStatus === s).length;
                                return `<span style="background: ${ds.bg}; color: ${ds.color}; padding: 3px 8px; border-radius: 20px; font-weight: 700;">${ds.label}: ${count}</span>`;
                            }).join('')}
                        </div>
                    </div>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
                            <thead>
                                <tr style="background: #f8fafc;">
                                    <th style="padding: 10px 14px; text-align: right; font-weight: 700; color: #475569;">الاسم</th>
                                    <th style="padding: 10px 14px; text-align: right; font-weight: 700; color: #475569;">الهاتف</th>
                                    <th style="padding: 10px 14px; text-align: right; font-weight: 700; color: #475569;">الحالة</th>
                                    <th style="padding: 10px 14px; text-align: right; font-weight: 700; color: #475569;">المخصصات</th>
                                    <th style="padding: 10px 14px; text-align: right; font-weight: 700; color: #475569;">وقت التسليم</th>
                                    <th style="padding: 10px 14px; text-align: right; font-weight: 700; color: #475569;">تعديل الحالة</th>
                                    <th style="padding: 10px 14px; text-align: right; font-weight: 700; color: #475569;">إجراء</th>
                                </tr>
                            </thead>
                            <tbody id="warehouse-beneficiaries-tbody">
                                ${benefRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- RIGHT: Items + Financial Configuration -->
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${wh.type !== 'financial' ? `
                <!-- In-Kind Items -->
                <div style="background: var(--card-bg, white); border-radius: 18px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
                    <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-main, #1e293b); margin-bottom: 14px;">
                        <i class="fas fa-boxes" style="color: #8b5cf6; margin-left: 6px;"></i> الأصناف العينية
                    </h4>
                    <div id="wh-items-list">
                        ${(wh.items || []).length === 0 ? '<p style="text-align:center;color:#94a3b8;padding:16px;font-size:0.85rem;">لم تُضف أصناف بعد</p>' :
                            (wh.items || []).map((item, i) => `
                                <div style="display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: #f8f5ff; border-radius: 10px; margin-bottom: 6px;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 700; font-size: 0.85rem; color: #374151;">${item.name}</div>
                                        <div style="font-size: 0.75rem; color: #64748b;">الكمية: ${item.totalQuantity} | مستخدم: ${item.usedQuantity || 0}</div>
                                    </div>
                                    <button style="padding: 4px 8px; background: #fee2e2; color: #e11d48; border: none; border-radius: 6px; cursor: pointer; font-size: 0.75rem;" onclick="window.removeWarehouseItem(${cycleId}, '${warehouseId}', ${i})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `).join('')
                        }
                    </div>
                    <!-- Add Item -->
                    <div style="border-top: 1px solid #ede9fe; padding-top: 14px; margin-top: 10px;">
                        <select id="wh-item-select" class="office-input" style="margin-bottom: 8px; font-size: 0.85rem;">
                            <option value="">-- اختر صنف من المخزن --</option>
                            ${inventoryOptions}
                        </select>
                        <div style="display: flex; gap: 8px;">
                            <input type="number" id="wh-item-qty" class="office-input" placeholder="الكمية" style="flex: 1; font-size: 0.85rem;" min="1">
                            <button class="btn-primary" style="padding: 8px 14px; font-size: 0.82rem; white-space: nowrap;" onclick="window.addItemToWarehouse(${cycleId}, '${warehouseId}')">
                                <i class="fas fa-plus"></i> إضافة
                            </button>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${wh.type !== 'inkind' ? `
                <!-- Financial Config -->
                <div style="background: var(--card-bg, white); border-radius: 18px; padding: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
                    <h4 style="font-size: 0.95rem; font-weight: 800; color: var(--text-main, #1e293b); margin-bottom: 14px;">
                        <i class="fas fa-money-bill-wave" style="color: #10b981; margin-left: 6px;"></i> التوزيع المالي
                    </h4>
                    <div class="input-group-office" style="margin-bottom: 10px;">
                        <label style="font-weight: 700; font-size: 0.85rem; display: block; margin-bottom: 5px;">المبلغ الإجمالي</label>
                        <input type="number" id="wh-fin-amount" class="office-input" placeholder="0.00" value="${wh.financialAmount || ''}" style="font-size: 0.9rem;" min="0" step="0.01">
                    </div>
                    <div class="input-group-office" style="margin-bottom: 14px;">
                        <label style="font-weight: 700; font-size: 0.85rem; display: block; margin-bottom: 5px;">طريقة التوزيع</label>
                        <select id="wh-fin-method" class="office-input" style="font-size: 0.85rem;">
                            <option value="equal">توزيع متساوٍ</option>
                            <option value="manual">يدوي (لكل مستفيد)</option>
                        </select>
                    </div>
                    <button class="btn-primary" style="width: 100%; padding: 10px; background: #10b981; font-size: 0.9rem;" onclick="window.applyFinancialDistribution(${cycleId}, '${warehouseId}')">
                        <i class="fas fa-calculator"></i> تطبيق التوزيع المالي
                    </button>
                </div>
                ` : ''}

                <!-- Quick Stats -->
                <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 18px; padding: 20px; color: white;">
                    <h4 style="font-size: 0.9rem; font-weight: 800; margin-bottom: 14px; opacity: 0.9;">إحصائيات المستودع</h4>
                    ${[
                        { label: 'إجمالي المستفيدين', value: benefs.length, color: '#6366f1' },
                        { label: 'تم التسليم', value: benefs.filter(b => b.deliveryStatus==='delivered').length, color: '#10b981' },
                        { label: 'قيد الانتظار', value: benefs.filter(b => b.deliveryStatus==='waiting').length, color: '#f59e0b' },
                        { label: 'غائب', value: benefs.filter(b => b.deliveryStatus==='absent').length, color: '#e11d48' }
                    ].map(s => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
                            <span style="font-size: 0.82rem; opacity: 0.7;">${s.label}</span>
                            <span style="font-weight: 800; color: ${s.color}; font-size: 1.1rem;">${s.value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
};

// ============================================================
// BENEFICIARY MULTI-METHOD SELECTION
// ============================================================

window.switchAddTab = function (tab, cycleId, warehouseId) {
    const tabs = ['search', 'range', 'table', 'all'];
    tabs.forEach(t => {
        const btn = document.getElementById('wh-tab-' + t);
        const panel = document.getElementById('wh-panel-' + t);
        if (btn) {
            btn.style.background = t === tab ? '#6366f1' : 'transparent';
            btn.style.color = t === tab ? 'white' : '#64748b';
        }
        if (panel) panel.style.display = t === tab ? 'block' : 'none';
    });
};

window.previewRangeSelection = function (cycleId, warehouseId) {
    const from = parseInt(document.getElementById('wh-range-from')?.value);
    const to = parseInt(document.getElementById('wh-range-to')?.value);
    const preview = document.getElementById('wh-range-preview');
    if (!preview) return;

    if (!from || !to || from > to) {
        preview.innerHTML = '<p style="color:#e11d48; font-size:0.82rem; margin-top:8px;">⚠️ يرجى إدخال نطاق رقمي صحيح (من ≤ إلى)</p>';
        return;
    }

    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    const wh = cycle?.warehouses.find(w => w.id === warehouseId);
    const existingIds = new Set((wh?.beneficiaries || []).map(b => b.caseId));

    const matched = (appData.cases || []).filter(c => {
        const num = parseInt(c.searchNumber);
        return !c.hidden && !existingIds.has(c.id) && !isNaN(num) && num >= from && num <= to;
    }).sort((a, b) => parseInt(a.searchNumber) - parseInt(b.searchNumber));

    if (matched.length === 0) {
        preview.innerHTML = '<p style="color:#94a3b8; font-size:0.82rem; margin-top:8px; text-align:center;">لا توجد حالات في هذا النطاق</p>';
        return;
    }

    preview.innerHTML = `
        <div style="border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; margin-top:10px;">
            <div style="background:#f8fafc; padding:8px 14px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0;">
                <span style="font-size:0.82rem; font-weight:700; color:#374151;">
                    <i class="fas fa-users" style="color:#6366f1;"></i> ${matched.length} حالة في هذا النطاق
                </span>
                <button class="btn-primary" style="padding:6px 14px; font-size:0.78rem; background:#6366f1;"
                        onclick="window.addRangeToWarehouse(${cycleId}, '${warehouseId}', ${from}, ${to})">
                    <i class="fas fa-user-plus"></i> إضافة الكل (${matched.length})
                </button>
            </div>
            <div style="max-height:150px; overflow-y:auto;">
                ${matched.map(c => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 14px; border-bottom:1px solid #f8fafc; font-size:0.82rem;">
                        <span style="font-weight:700; color:#1e293b;">${c.name}</span>
                        <span style="color:#6366f1; font-weight:700;">#${c.searchNumber}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

window.addRangeToWarehouse = function (cycleId, warehouseId, from, to) {
    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    const wh = cycle?.warehouses.find(w => w.id === warehouseId);
    if (!wh) return;

    const existingIds = new Set((wh.beneficiaries || []).map(b => b.caseId));
    const matched = (appData.cases || []).filter(c => {
        const num = parseInt(c.searchNumber);
        return !c.hidden && !existingIds.has(c.id) && !isNaN(num) && num >= from && num <= to;
    });

    let added = 0;
    matched.forEach(caseObj => {
        const defaultItems = (wh.items || []).map(item => ({
            name: item.name,
            qty: Math.floor(item.totalQuantity / Math.max((wh.beneficiaries.length + 1), 1))
        }));
        wh.beneficiaries.push({
            caseId: caseObj.id,
            name: caseObj.name,
            phone: caseObj.phone || '',
            deliveryStatus: 'waiting',
            items: defaultItems,
            financialAmount: 0,
            deliveredAt: null,
            deliveredBy: null
        });
        added++;
    });

    saveData();
    alert(`✅ تم إضافة ${added} حالة بنجاح`);
    window.openWarehouseManager(cycleId, warehouseId);
};

window.filterBenefTable = function (query) {
    const q = query.toLowerCase();
    document.querySelectorAll('.wh-case-row').forEach(row => {
        const name = row.dataset.name || '';
        const phone = row.dataset.phone || '';
        const num = row.dataset.num || '';
        row.style.display = (!q || name.includes(q) || phone.includes(q) || num.includes(q)) ? '' : 'none';
    });
};

window.toggleAllTableChecks = function (masterCheckbox) {
    document.querySelectorAll('.wh-case-check').forEach(cb => {
        const row = cb.closest('tr');
        if (row && row.style.display !== 'none') cb.checked = masterCheckbox.checked;
    });
};

window.selectAllInTable = function (cycleId, warehouseId) {
    document.querySelectorAll('.wh-case-check').forEach(cb => {
        const row = cb.closest('tr');
        if (row && row.style.display !== 'none') cb.checked = true;
    });
    const masterCb = document.getElementById('wh-check-all');
    if (masterCb) masterCb.checked = true;
};

window.addCheckedFromTable = function (cycleId, warehouseId) {
    const checked = document.querySelectorAll('.wh-case-check:checked');
    if (checked.length === 0) { alert('يرجى تحديد حالة واحدة على الأقل'); return; }

    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    const wh = cycle?.warehouses.find(w => w.id === warehouseId);
    if (!wh) return;

    let added = 0;
    checked.forEach(cb => {
        const caseId = parseInt(cb.dataset.caseId);
        if (wh.beneficiaries.some(b => b.caseId === caseId)) return;
        const caseObj = (appData.cases || []).find(c => c.id === caseId);
        if (!caseObj) return;
        const defaultItems = (wh.items || []).map(item => ({
            name: item.name,
            qty: Math.floor(item.totalQuantity / Math.max((wh.beneficiaries.length + 1), 1))
        }));
        wh.beneficiaries.push({
            caseId: caseObj.id,
            name: caseObj.name,
            phone: caseObj.phone || '',
            deliveryStatus: 'waiting',
            items: defaultItems,
            financialAmount: 0,
            deliveredAt: null,
            deliveredBy: null
        });
        added++;
    });

    saveData();
    alert(`✅ تم إضافة ${added} حالة بنجاح`);
    window.openWarehouseManager(cycleId, warehouseId);
};

// ============================================================
// BENEFICIARY MANAGEMENT
// ============================================================
window.searchBeneficiaryForWarehouse = function (query, cycleId, warehouseId) {
    const resultsDiv = document.getElementById('wh-search-results');
    if (!resultsDiv) return;

    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    const wh = cycle?.warehouses.find(w => w.id === warehouseId);
    const existingIds = new Set((wh?.beneficiaries || []).map(b => b.caseId));

    if (!query || query.length < 2) {
        resultsDiv.style.display = 'none';
        return;
    }

    const q = query.toLowerCase();
    const matched = (appData.cases || []).filter(c =>
        !c.hidden &&
        !existingIds.has(c.id) &&
        (`${c.name} ${c.phone} ${c.searchNumber || ''} ${c.nationalId || ''}`).toLowerCase().includes(q)
    ).slice(0, 10);

    if (matched.length === 0) {
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = '<div style="padding: 16px; text-align: center; color: #94a3b8; font-size: 0.85rem;">لا توجد نتائج</div>';
        return;
    }

    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = matched.map(c => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.15s;"
             onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background=''"
             onclick="window.addBeneficiaryToWarehouse(${cycleId}, '${warehouseId}', ${c.id})">
            <div>
                <div style="font-weight: 700; font-size: 0.9rem; color: #1e293b;">${c.name}</div>
                <div style="font-size: 0.75rem; color: #64748b;">${c.phone || ''} ${c.searchNumber ? '· رقم: ' + c.searchNumber : ''}</div>
            </div>
            <button class="btn-primary" style="padding: 5px 12px; font-size: 0.78rem;">إضافة</button>
        </div>
    `).join('');
};

window.addBeneficiaryToWarehouse = function (cycleId, warehouseId, caseId) {
    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const wh = cycle.warehouses.find(w => w.id === warehouseId);
    if (!wh) return;

    if (wh.beneficiaries.some(b => b.caseId === caseId)) {
        alert('هذا المستفيد مضاف بالفعل'); return;
    }

    const caseObj = (appData.cases || []).find(c => c.id === caseId);
    if (!caseObj) return;

    const defaultItems = (wh.items || []).map(item => ({
        name: item.name,
        qty: Math.floor(item.totalQuantity / Math.max((wh.beneficiaries.length + 1), 1))
    }));

    wh.beneficiaries.push({
        caseId: caseObj.id,
        name: caseObj.name,
        phone: caseObj.phone || '',
        deliveryStatus: 'waiting',
        items: defaultItems,
        financialAmount: wh.financialAmount ? Math.floor(wh.financialAmount / Math.max((wh.beneficiaries.length + 1), 1)) : 0,
        deliveredAt: null,
        deliveredBy: null
    });

    saveData();
    const searchInput = document.getElementById('wh-beneficiary-search');
    if (searchInput) { searchInput.value = ''; }
    document.getElementById('wh-search-results').style.display = 'none';
    window.openWarehouseManager(cycleId, warehouseId);
};

window.addAllCasesToWarehouse = function (cycleId, warehouseId) {
    if (!confirm(`هل تريد إضافة جميع الحالات النشطة (${(appData.cases || []).filter(c => !c.hidden).length} حالة) إلى هذا المستودع؟`)) return;

    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const wh = cycle.warehouses.find(w => w.id === warehouseId);
    if (!wh) return;

    const existing = new Set(wh.beneficiaries.map(b => b.caseId));
    let addedCount = 0;

    (appData.cases || []).filter(c => !c.hidden && !existing.has(c.id)).forEach(caseObj => {
        wh.beneficiaries.push({
            caseId: caseObj.id,
            name: caseObj.name,
            phone: caseObj.phone || '',
            deliveryStatus: 'waiting',
            items: [],
            financialAmount: 0,
            deliveredAt: null,
            deliveredBy: null
        });
        addedCount++;
    });

    saveData();
    alert(`✅ تم إضافة ${addedCount} حالة إلى المستودع`);
    window.openWarehouseManager(cycleId, warehouseId);
};

window.removeBeneficiary = function (cycleId, warehouseId, bIdx) {
    if (!confirm('هل تريد إزالة هذا المستفيد من المستودع؟')) return;
    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const wh = cycle.warehouses.find(w => w.id === warehouseId);
    if (!wh) return;
    wh.beneficiaries.splice(bIdx, 1);
    saveData();
    window.openWarehouseManager(cycleId, warehouseId);
};

window.updateBenefStatus = function (cycleId, warehouseId, bIdx, newStatus) {
    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const wh = cycle.warehouses.find(w => w.id === warehouseId);
    if (!wh || !wh.beneficiaries[bIdx]) return;
    wh.beneficiaries[bIdx].deliveryStatus = newStatus;
    if (newStatus === 'delivered' && !wh.beneficiaries[bIdx].deliveredAt) {
        wh.beneficiaries[bIdx].deliveredAt = new Date().toISOString();
        wh.beneficiaries[bIdx].deliveredBy = localStorage.getItem('logged_charity_name') || 'موظف';
        window.recordDeliveryInHistory(cycleId, warehouseId, bIdx);
    }
    saveData();
};

window.confirmDeliveryForBenef = function (cycleId, warehouseId, bIdx) {
    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const wh = cycle.warehouses.find(w => w.id === warehouseId);
    if (!wh || !wh.beneficiaries[bIdx]) return;
    const b = wh.beneficiaries[bIdx];

    if (b.deliveryStatus === 'delivered') {
        alert(`⚠️ تحذير: هذا المستفيد (${b.name}) قد استلم توزيعه بالفعل بتاريخ ${b.deliveredAt ? new Date(b.deliveredAt).toLocaleString('ar-EG') : 'غير معروف'}`);
        return;
    }

    if (confirm(`تأكيد تسليم المستفيد: ${b.name}؟`)) {
        b.deliveryStatus = 'delivered';
        b.deliveredAt = new Date().toISOString();
        b.deliveredBy = localStorage.getItem('logged_charity_name') || 'موظف';
        window.recordDeliveryInHistory(cycleId, warehouseId, bIdx);
        saveData();
        window.openWarehouseManager(cycleId, warehouseId);
    }
};

// Record delivery into case's aidHistory and expenses
window.recordDeliveryInHistory = function (cycleId, warehouseId, bIdx) {
    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const wh = cycle.warehouses.find(w => w.id === warehouseId);
    if (!wh) return;
    const b = wh.beneficiaries[bIdx];
    if (!b) return;

    const caseObj = (appData.cases || []).find(c => c.id === b.caseId);
    if (!caseObj) return;

    if (!caseObj.aidHistory) caseObj.aidHistory = [];
    if (!caseObj.distributionHistory) caseObj.distributionHistory = [];

    const dateStr = new Date().toISOString().split('T')[0];
    const itemsDesc = (b.items || []).map(i => `${i.name}: ${i.qty}`).join('، ');
    const finDesc = b.financialAmount ? `مبلغ مالي: ${b.financialAmount} ج.م` : '';
    const desc = [itemsDesc, finDesc].filter(Boolean).join(' | ');

    // Add to aidHistory
    caseObj.aidHistory.push({
        date: dateStr,
        amount: b.financialAmount || 0,
        category: `توزيع شهري - ${cycle.name} - ${wh.name}`,
        note: desc || 'توزيع عيني',
        type: wh.type
    });

    // Add to distributionHistory
    caseObj.distributionHistory.push({
        cycleId, warehouseId,
        cycleName: cycle.name,
        warehouseName: wh.name,
        month: cycle.month, year: cycle.year,
        items: b.items || [],
        financialAmount: b.financialAmount || 0,
        deliveredAt: b.deliveredAt,
        deliveredBy: b.deliveredBy
    });

    // Add expense record
    if (b.financialAmount > 0) {
        if (!appData.expenses) appData.expenses = [];
        appData.expenses.push({
            id: Date.now() + Math.random(),
            date: dateStr,
            name: b.name,
            phone: b.phone,
            amount: b.financialAmount,
            category: `توزيع شهري - ${cycle.name}`,
            note: `مستودع: ${wh.name} | دورة: ${cycle.name}`,
            inkind: false,
            sourceType: 'distribution'
        });
    }

    // Decrease inventory for in-kind items
    if ((b.items || []).length > 0 && appData.inventory) {
        (b.items || []).forEach(delivItem => {
            const invItem = appData.inventory.find(inv => inv.name === delivItem.name);
            if (invItem) {
                invItem.remainingQuantity = Math.max(0, (parseFloat(invItem.remainingQuantity) || 0) - (parseFloat(delivItem.qty) || 0));
            }
        });
    }
};

// Add item to warehouse
window.addItemToWarehouse = function (cycleId, warehouseId) {
    const sel = document.getElementById('wh-item-select');
    const qtyInput = document.getElementById('wh-item-qty');
    if (!sel || !sel.value) { alert('يرجى اختيار صنف من المخزن'); return; }
    const qty = parseFloat(qtyInput?.value);
    if (!qty || qty <= 0) { alert('يرجى إدخال كمية صحيحة'); return; }

    const opt = sel.options[sel.selectedIndex];
    const name = opt.getAttribute('data-name');
    const available = parseFloat(opt.getAttribute('data-qty'));
    const price = parseFloat(opt.getAttribute('data-price')) || 0;

    if (qty > available) { alert(`الكمية المطلوبة (${qty}) أكبر من المتاح في المخزن (${available})`); return; }

    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const wh = cycle.warehouses.find(w => w.id === warehouseId);
    if (!wh) return;

    const existing = wh.items.find(i => i.name === name);
    if (existing) { existing.totalQuantity += qty; }
    else { wh.items.push({ inventoryId: sel.value, name, totalQuantity: qty, usedQuantity: 0, pricePerUnit: price }); }

    saveData();
    window.openWarehouseManager(cycleId, warehouseId);
};

window.removeWarehouseItem = function (cycleId, warehouseId, itemIdx) {
    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const wh = cycle.warehouses.find(w => w.id === warehouseId);
    if (!wh) return;
    wh.items.splice(itemIdx, 1);
    saveData();
    window.openWarehouseManager(cycleId, warehouseId);
};

window.applyFinancialDistribution = function (cycleId, warehouseId) {
    const amount = parseFloat(document.getElementById('wh-fin-amount')?.value);
    const method = document.getElementById('wh-fin-method')?.value;
    if (!amount || amount <= 0) { alert('يرجى إدخال مبلغ مالي صحيح'); return; }

    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const wh = cycle.warehouses.find(w => w.id === warehouseId);
    if (!wh) return;

    wh.financialAmount = amount;
    if (method === 'equal' && wh.beneficiaries.length > 0) {
        const perPerson = Math.floor(amount / wh.beneficiaries.length);
        wh.beneficiaries.forEach(b => { b.financialAmount = perPerson; });
    }
    saveData();
    alert(`✅ تم تطبيق التوزيع المالي - ${amount} ج.م على ${wh.beneficiaries.length} مستفيد`);
    window.openWarehouseManager(cycleId, warehouseId);
};

// ============================================================
// QR SCAN SCREEN
// ============================================================
window.openQRScanScreen = function (cycleId, warehouseId) {
    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const wh = cycle.warehouses.find(w => w.id === warehouseId);
    if (!wh) return;

    window._currentCycleId = cycleId;
    window._currentWarehouseId = warehouseId;

    const contentArea = document.getElementById('content-area');
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.innerText = `شاشة التوزيع - ${wh.name}`;
    if (contentArea) contentArea.innerHTML = `
        <!-- Navigation -->
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
            <button onclick="window.openWarehouseManager(${cycleId}, '${warehouseId}')" style="background: #f1f5f9; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 1rem; color: #475569; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-arrow-right"></i>
            </button>
            <div>
                <h2 style="font-size: 1.2rem; font-weight: 800; color: var(--text-main, #1e293b); margin: 0;">
                    <i class="fas fa-qrcode" style="color: #6366f1; margin-left: 8px;"></i> شاشة التوزيع والمسح
                </h2>
                <span style="font-size: 0.82rem; color: #64748b;">${cycle.name} · ${wh.name}</span>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <!-- Search Panel -->
            <div style="background: var(--card-bg, white); border-radius: 20px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.07);">
                <h3 style="font-size: 1rem; font-weight: 800; color: var(--text-main, #1e293b); margin-bottom: 16px;">
                    <i class="fas fa-search" style="color: #6366f1; margin-left: 6px;"></i> البحث عن المستفيد
                </h3>
                
                <div style="position: relative; margin-bottom: 14px;">
                    <i class="fas fa-qrcode" style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: #6366f1; font-size: 1.1rem;"></i>
                    <input type="text" id="qr-scan-input" class="office-input" 
                           placeholder="ابحث بالاسم أو رقم QR أو الهاتف أو الرقم القومي..."
                           style="padding-right: 44px; font-size: 0.95rem;"
                           oninput="window.searchForDistributionScan(this.value)"
                           autofocus>
                </div>

                <div id="scan-search-results" style="max-height: 400px; overflow-y: auto;"></div>
            </div>

            <!-- Delivery Confirmation Panel -->
            <div id="delivery-confirmation-panel" style="background: var(--card-bg, white); border-radius: 20px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.07);">
                <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
                    <i class="fas fa-qrcode" style="font-size: 4rem; margin-bottom: 16px; color: #e2e8f0;"></i>
                    <h3 style="color: #cbd5e1; font-size: 1rem;">ابحث عن مستفيد للبدء</h3>
                    <p style="font-size: 0.85rem; margin-top: 8px;">أدخل اسم المستفيد أو امسح QR الخاص به</p>
                </div>
            </div>
        </div>

        <!-- Pending Deliveries List -->
        <div style="background: var(--card-bg, white); border-radius: 20px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.07); margin-top: 20px;">
            <h3 style="font-size: 1rem; font-weight: 800; color: var(--text-main, #1e293b); margin-bottom: 16px;">
                <i class="fas fa-hourglass-half" style="color: #f59e0b; margin-left: 6px;"></i>
                قائمة الانتظار (${(wh.beneficiaries || []).filter(b => b.deliveryStatus === 'waiting').length} مستفيد)
            </h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                ${(wh.beneficiaries || []).filter(b => b.deliveryStatus === 'waiting').slice(0, 20).map((b, i) => {
                    const realIdx = (wh.beneficiaries || []).findIndex(x => x.caseId === b.caseId);
                    return `
                        <div style="padding: 10px 14px; background: #fef9f0; border-radius: 12px; border-right: 4px solid #f59e0b; display: flex; justify-content: space-between; align-items: center; cursor: pointer;"
                             onclick="window.showDeliveryPanel(${cycleId}, '${warehouseId}', ${realIdx})">
                            <div>
                                <div style="font-weight: 700; font-size: 0.85rem; color: #92400e;">${b.name}</div>
                                <div style="font-size: 0.72rem; color: #a16207;">${b.phone || ''}</div>
                            </div>
                            <i class="fas fa-chevron-left" style="color: #f59e0b;"></i>
                        </div>
                    `;
                }).join('')}
                ${(wh.beneficiaries || []).filter(b => b.deliveryStatus === 'waiting').length > 20 ? `
                    <div style="padding: 10px; text-align: center; color: #94a3b8; font-size: 0.82rem;">
                        + ${(wh.beneficiaries || []).filter(b => b.deliveryStatus === 'waiting').length - 20} آخرين
                    </div>
                ` : ''}
            </div>
        </div>
    `;
};

window.searchForDistributionScan = function (query) {
    const resultsDiv = document.getElementById('scan-search-results');
    if (!resultsDiv) return;
    const cycleId = window._currentCycleId;
    const warehouseId = window._currentWarehouseId;

    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const wh = cycle.warehouses.find(w => w.id === warehouseId);
    if (!wh) return;

    if (!query || query.length < 2) {
        resultsDiv.innerHTML = '';
        return;
    }

    const q = query.toLowerCase();
    const matched = (wh.beneficiaries || []).map((b, idx) => ({ b, idx })).filter(({ b }) =>
        (`${b.name} ${b.phone} ${b.caseId}`).toLowerCase().includes(q)
    );

    if (matched.length === 0) {
        resultsDiv.innerHTML = '<div style="text-align:center; padding: 20px; color: #94a3b8; font-size: 0.85rem;">لا توجد نتائج في هذا المستودع</div>';
        return;
    }

    const statusColors = {
        waiting: '#f59e0b', delivered: '#10b981', absent: '#e11d48', deferred: '#6366f1'
    };
    const statusLabels = { waiting: 'قيد الانتظار', delivered: 'تم التسليم', absent: 'غائب', deferred: 'مؤجل' };

    resultsDiv.innerHTML = matched.slice(0, 8).map(({ b, idx }) => `
        <div style="padding: 12px 14px; border-radius: 12px; margin-bottom: 8px; border: 2px solid #e2e8f0; cursor: pointer; transition: all 0.2s; background: white;"
             onmouseenter="this.style.borderColor='#6366f1'; this.style.background='#f5f3ff'"
             onmouseleave="this.style.borderColor='#e2e8f0'; this.style.background='white'"
             onclick="window.showDeliveryPanel(${cycleId}, '${warehouseId}', ${idx})">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <strong style="color: #1e293b; font-size: 0.95rem;">${b.name}</strong>
                <span style="background: ${statusColors[b.deliveryStatus]}22; color: ${statusColors[b.deliveryStatus]}; padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">
                    ${statusLabels[b.deliveryStatus] || b.deliveryStatus}
                </span>
            </div>
            <div style="font-size: 0.78rem; color: #64748b;">${b.phone || ''}</div>
        </div>
    `).join('');
};

window.showDeliveryPanel = function (cycleId, warehouseId, bIdx) {
    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const wh = cycle.warehouses.find(w => w.id === warehouseId);
    if (!wh) return;
    const b = wh.beneficiaries[bIdx];
    if (!b) return;

    const panel = document.getElementById('delivery-confirmation-panel');
    if (!panel) return;

    const alreadyDelivered = b.deliveryStatus === 'delivered';
    const caseObj = (appData.cases || []).find(c => c.id === b.caseId);

    if (alreadyDelivered) {
        panel.innerHTML = `
            <div style="background: #fee2e2; border-radius: 16px; padding: 20px; margin-bottom: 16px; border: 2px solid #fca5a5; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: #e11d48; margin-bottom: 10px; display: block;"></i>
                <h3 style="color: #be123c; font-size: 1.1rem; margin-bottom: 6px;">تحذير: استلم بالفعل</h3>
                <p style="color: #9f1239; font-size: 0.85rem; margin-bottom: 10px;">
                    هذا المستفيد قد استلم توزيعه بالفعل
                </p>
                <div style="background: white; border-radius: 10px; padding: 12px; font-size: 0.8rem; color: #64748b;">
                    <div>📅 التاريخ: <strong>${b.deliveredAt ? new Date(b.deliveredAt).toLocaleString('ar-EG') : '-'}</strong></div>
                    <div>👤 بواسطة: <strong>${b.deliveredBy || '-'}</strong></div>
                </div>
            </div>
            <div style="font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-bottom: 8px;">${b.name}</div>
            <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 16px;">${b.phone || ''}</div>
            <button onclick="window.openWarehouseManager(${cycleId}, '${warehouseId}')" style="width: 100%; padding: 12px; background: #f1f5f9; color: #475569; border: none; border-radius: 12px; cursor: pointer; font-family: 'Cairo',sans-serif; font-weight: 700; font-size: 0.9rem;">
                رجوع للقائمة
            </button>
        `;
        return;
    }

    const itemsList = (b.items || []).length > 0
        ? (b.items || []).map(it => `
            <div style="display: flex; justify-content: space-between; padding: 6px 10px; background: #f5f3ff; border-radius: 8px; margin-bottom: 4px;">
                <span style="font-weight: 600; color: #4c1d95;">${it.name}</span>
                <span style="font-weight: 800; color: #6366f1;">${it.qty}</span>
            </div>
        `).join('')
        : '<p style="color: #94a3b8; font-size: 0.82rem; text-align: center; padding: 8px;">لا توجد أصناف محددة</p>';

    panel.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px;">
            ${caseObj?.photoUrl ? `<img src="${caseObj.photoUrl}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 3px solid #6366f1; margin-bottom: 8px;">` : `
                <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #6366f1, #3b82f6); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px;">
                    <i class="fas fa-user" style="font-size: 1.8rem; color: white;"></i>
                </div>
            `}
            <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-main, #1e293b); margin-bottom: 2px;">${b.name}</h3>
            <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 14px;">${b.phone || ''}</p>
        </div>

        <div style="margin-bottom: 14px;">
            <h4 style="font-size: 0.88rem; font-weight: 800; color: #374151; margin-bottom: 8px;">
                <i class="fas fa-box" style="color: #8b5cf6;"></i> المخصصات العينية
            </h4>
            ${itemsList}
        </div>

        ${b.financialAmount > 0 ? `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #ecfdf5; border-radius: 10px; border: 1px solid #a7f3d0; margin-bottom: 14px;">
            <span style="font-weight: 700; color: #065f46;"><i class="fas fa-money-bill-wave"></i> مبلغ مالي</span>
            <span style="font-size: 1.3rem; font-weight: 900; color: #059669;">${b.financialAmount} ج.م</span>
        </div>
        ` : ''}

        <div style="display: flex; gap: 10px;">
            <button class="btn-primary" style="flex: 1; padding: 14px; font-size: 1rem; background: #10b981;" onclick="window.confirmDeliveryForBenef(${cycleId}, '${warehouseId}', ${bIdx})">
                <i class="fas fa-check-double" style="font-size: 1.1rem;"></i> تأكيد التسليم
            </button>
            <button style="padding: 14px; background: #fee2e2; color: #e11d48; border: none; border-radius: 12px; cursor: pointer; font-family: 'Cairo',sans-serif; font-weight: 700; font-size: 0.85rem;" 
                    onclick="window.updateBenefStatus(${cycleId}, '${warehouseId}', ${bIdx}, 'absent'); window.openQRScanScreen(${cycleId}, '${warehouseId}')">
                <i class="fas fa-user-slash"></i> غائب
            </button>
        </div>
    `;
};

// ============================================================
// REPORTS
// ============================================================
window.exportCycleReport = function (cycleId) {
    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;

    const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    const warehouses = cycle.warehouses || [];
    const totalBenef = warehouses.reduce((s, w) => s + (w.beneficiaries || []).length, 0);
    const delivered = warehouses.reduce((s, w) => s + (w.beneficiaries || []).filter(b => b.deliveryStatus === 'delivered').length, 0);
    const charityName = localStorage.getItem('logged_charity_name') || 'الجمعية';
    const logo = window.getCharityLogo ? window.getCharityLogo() : 'logo.png';
    const progress = totalBenef > 0 ? Math.round((delivered / totalBenef) * 100) : 0;

    const reportHTML = `
        <div style="font-family: 'Cairo', sans-serif; direction: rtl; padding: 30px; max-width: 900px; margin: 0 auto;">
            <div style="text-align: center; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 25px;">
                <img src="${logo}" style="height: 60px; margin-bottom: 10px;" onerror="this.style.display='none'">
                <h1 style="color: #1e293b; font-size: 1.5rem; margin-bottom: 4px;">${charityName}</h1>
                <h2 style="color: #6366f1; font-size: 1.1rem;">تقرير دورة التوزيع: ${cycle.name}</h2>
                <p style="color: #64748b;">${monthNames[(cycle.month || 1) - 1]} ${cycle.year} | ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 25px;">
                ${[
                    { label: 'المستودعات', value: warehouses.length, color: '#6366f1' },
                    { label: 'إجمالي المستفيدين', value: totalBenef, color: '#3b82f6' },
                    { label: 'تم التسليم', value: delivered, color: '#10b981' },
                    { label: 'نسبة الإنجاز', value: progress + '%', color: '#f59e0b' }
                ].map(s => `
                    <div style="text-align: center; padding: 14px; background: ${s.color}11; border: 2px solid ${s.color}33; border-radius: 12px;">
                        <div style="font-size: 1.8rem; font-weight: 900; color: ${s.color};">${s.value}</div>
                        <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">${s.label}</div>
                    </div>
                `).join('')}
            </div>

            ${warehouses.map(wh => {
                const whBenefs = wh.beneficiaries || [];
                const whDelivered = whBenefs.filter(b => b.deliveryStatus === 'delivered');
                const whWaiting = whBenefs.filter(b => b.deliveryStatus === 'waiting');
                const whAbsent = whBenefs.filter(b => b.deliveryStatus === 'absent');
                const typeLabels = { inkind: 'عيني', financial: 'مالي', both: 'عيني + مالي' };

                return `
                    <div style="margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden;">
                        <div style="background: #1e293b; color: white; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin: 0; font-size: 1rem;">${wh.name}</h3>
                            <span style="background: rgba(255,255,255,0.15); padding: 3px 12px; border-radius: 20px; font-size: 0.8rem;">
                                ${typeLabels[wh.type] || wh.type}
                            </span>
                        </div>
                        <div style="padding: 14px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 14px;">
                                <div style="text-align: center; padding: 8px; background: #f8fafc; border-radius: 8px;">
                                    <div style="font-weight: 800; font-size: 1.2rem; color: #1d4ed8;">${whBenefs.length}</div>
                                    <div style="font-size: 0.72rem; color: #64748b;">إجمالي</div>
                                </div>
                                <div style="text-align: center; padding: 8px; background: #ecfdf5; border-radius: 8px;">
                                    <div style="font-weight: 800; font-size: 1.2rem; color: #059669;">${whDelivered.length}</div>
                                    <div style="font-size: 0.72rem; color: #64748b;">تم التسليم</div>
                                </div>
                                <div style="text-align: center; padding: 8px; background: #fef3c7; border-radius: 8px;">
                                    <div style="font-weight: 800; font-size: 1.2rem; color: #d97706;">${whWaiting.length}</div>
                                    <div style="font-size: 0.72rem; color: #64748b;">انتظار</div>
                                </div>
                            </div>
                            ${whDelivered.length > 0 ? `
                                <h4 style="font-size: 0.88rem; font-weight: 800; color: #059669; margin-bottom: 8px;">✅ تم التسليم:</h4>
                                <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-bottom: 10px;">
                                    <thead><tr style="background: #f0fdf4;">
                                        <th style="padding: 6px 10px; text-align: right; border: 1px solid #d1fae5;">الاسم</th>
                                        <th style="padding: 6px 10px; border: 1px solid #d1fae5;">وقت التسليم</th>
                                        <th style="padding: 6px 10px; border: 1px solid #d1fae5;">المبلغ المالي</th>
                                    </tr></thead>
                                    <tbody>
                                        ${whDelivered.map(b => `
                                            <tr>
                                                <td style="padding: 6px 10px; border: 1px solid #d1fae5; font-weight: 700;">${b.name}</td>
                                                <td style="padding: 6px 10px; border: 1px solid #d1fae5; text-align: center;">${b.deliveredAt ? new Date(b.deliveredAt).toLocaleString('ar-EG') : '-'}</td>
                                                <td style="padding: 6px 10px; border: 1px solid #d1fae5; text-align: center; font-weight: 700; color: #059669;">${b.financialAmount || 0} ج.م</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            ` : ''}
                            ${whWaiting.length > 0 ? `
                                <h4 style="font-size: 0.88rem; font-weight: 800; color: #d97706; margin-bottom: 8px;">⏳ قيد الانتظار:</h4>
                                <p style="font-size: 0.82rem; color: #64748b;">${whWaiting.map(b => b.name).join(' - ')}</p>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('')}

            <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 0.75rem; color: #94a3b8;">
                صُدِّر بتاريخ: ${new Date().toLocaleString('ar-EG')} | ${charityName}
            </div>
        </div>
    `;

    localStorage.setItem('printPayload', reportHTML);
    localStorage.setItem('printType', 'portrait');
    window.open('print.html', '_blank');
};

window.exportWarehouseReport = function (cycleId, warehouseId) {
    const cycle = appData.distributionCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    const wh = cycle?.warehouses.find(w => w.id === warehouseId);
    if (!wh) return;

    const charityName = localStorage.getItem('logged_charity_name') || 'الجمعية';
    const benefs = wh.beneficiaries || [];

    const reportHTML = `
        <div style="font-family: 'Cairo', sans-serif; direction: rtl; padding: 20px;">
            <h2 style="color: #6366f1; margin-bottom: 5px;">${charityName} - تقرير مستودع التوزيع</h2>
            <h3 style="margin-bottom: 3px;">${wh.name} | ${cycle.name}</h3>
            <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 20px;">${new Date().toLocaleDateString('ar-EG')}</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead>
                    <tr style="background: #6366f1; color: white;">
                        <th style="padding: 8px 12px; text-align: right;">#</th>
                        <th style="padding: 8px 12px; text-align: right;">الاسم</th>
                        <th style="padding: 8px 12px; text-align: right;">الهاتف</th>
                        <th style="padding: 8px 12px; text-align: center;">الحالة</th>
                        <th style="padding: 8px 12px; text-align: center;">المخصصات</th>
                        <th style="padding: 8px 12px; text-align: center;">المبلغ المالي</th>
                        <th style="padding: 8px 12px; text-align: center;">وقت التسليم</th>
                        <th style="padding: 8px 12px; text-align: center;">بواسطة</th>
                    </tr>
                </thead>
                <tbody>
                    ${benefs.map((b, i) => {
                        const statusColors = { waiting: '#f59e0b', delivered: '#10b981', absent: '#e11d48', deferred: '#6366f1' };
                        const statusLabels = { waiting: 'انتظار', delivered: 'تم', absent: 'غائب', deferred: 'مؤجل' };
                        return `
                            <tr style="border-bottom: 1px solid #e2e8f0; background: ${i % 2 === 0 ? '#f8fafc' : 'white'}">
                                <td style="padding: 8px 12px;">${i + 1}</td>
                                <td style="padding: 8px 12px; font-weight: 700;">${b.name}</td>
                                <td style="padding: 8px 12px;">${b.phone || '-'}</td>
                                <td style="padding: 8px 12px; text-align: center;">
                                    <span style="background: ${statusColors[b.deliveryStatus]}22; color: ${statusColors[b.deliveryStatus]}; padding: 2px 8px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">
                                        ${statusLabels[b.deliveryStatus] || b.deliveryStatus}
                                    </span>
                                </td>
                                <td style="padding: 8px 12px; text-align: center; font-size: 0.78rem;">
                                    ${(b.items || []).map(it => `${it.name}: ${it.qty}`).join(', ') || '-'}
                                </td>
                                <td style="padding: 8px 12px; text-align: center; font-weight: 700; color: #059669;">
                                    ${b.financialAmount ? b.financialAmount + ' ج.م' : '-'}
                                </td>
                                <td style="padding: 8px 12px; text-align: center; font-size: 0.75rem;">
                                    ${b.deliveredAt ? new Date(b.deliveredAt).toLocaleString('ar-EG') : '-'}
                                </td>
                                <td style="padding: 8px 12px; text-align: center; font-size: 0.78rem;">${b.deliveredBy || '-'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div style="text-align: center; margin-top: 20px; font-size: 0.75rem; color: #94a3b8;">
                إجمالي المستفيدين: ${benefs.length} | تم التسليم: ${benefs.filter(b => b.deliveryStatus === 'delivered').length} | المتبقي: ${benefs.filter(b => b.deliveryStatus === 'waiting').length}
            </div>
        </div>
    `;

    localStorage.setItem('printPayload', reportHTML);
    localStorage.setItem('printType', 'landscape');
    window.open('print.html', '_blank');
};

console.log('✅ Monthly Distribution Cycle module loaded successfully');
