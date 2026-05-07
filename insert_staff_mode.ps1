$file = 'script.js'
$content = [System.IO.File]::ReadAllText((Resolve-Path $file).Path, [System.Text.Encoding]::UTF8)

$target = "window.renderPage = renderPage;"

$newFunctions = @"


// =============================================
// ---   STAFF MODE FUNCTIONS                ---
// =============================================

window.applyStaffModeSidebar = function() {
    var HIDDEN_IN_STAFF = ['dashboard', 'statistics', 'expenses', 'volunteers', 'reports', 'affidavit', 'settings', 'master'];
    document.querySelectorAll('.sidebar-nav li[data-page]').forEach(function(li) {
        var page = li.getAttribute('data-page');
        if (window.staffMode && HIDDEN_IN_STAFF.includes(page)) {
            li.style.display = 'none';
        } else {
            li.style.display = '';
        }
    });
    var badge = document.getElementById('staff-mode-badge');
    if (window.staffMode) {
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'staff-mode-badge';
            badge.innerHTML = '<i class="fas fa-user-tie"></i> وضع الموظفين';
            badge.style.cssText = 'display:inline-flex;align-items:center;gap:5px;background:#f59e0b;color:#1c1917;font-size:0.75rem;font-weight:800;padding:4px 12px;border-radius:20px;margin-right:10px;cursor:pointer;';
            badge.title = 'انقر لإلغاء وضع الموظفين';
            badge.onclick = function() { window.disableStaffMode(); };
            var headerLeft = document.querySelector('.header-left');
            if (headerLeft) headerLeft.appendChild(badge);
        }
    } else {
        if (badge) badge.remove();
    }
};

window.enableStaffMode = function() {
    var msg = 'تفعيل وضع الموظفين\n\nعند التفعيل: الرئيسية، الإحصائيات، المصروفات، المتطوعين، التقارير، الإفادات، الإعدادات ستكون مخفية.\nلإلغاء التفعيل ستحتاج كلمة السر: 0000\n\nهل تريد المتابعة؟';
    if (confirm(msg)) {
        window.staffMode = true;
        localStorage.setItem('staff_mode', 'true');
        window.applyStaffModeSidebar();
        renderPage('cases');
        setTimeout(function() { alert('تم تفعيل وضع الموظفين بنجاح! الصفحات الحساسة الآن مقفولة.'); }, 200);
    }
};

window.disableStaffMode = function() {
    var pass = prompt('ادخل كلمة السر لإلغاء وضع الموظفين:');
    if (pass === null) return;
    if (pass !== window.STAFF_MODE_PASSWORD) {
        alert('كلمة السر غير صحيحة! كلمة السر هي: 0000');
        return;
    }
    window.staffMode = false;
    localStorage.setItem('staff_mode', 'false');
    window.applyStaffModeSidebar();
    renderPage('settings');
    setTimeout(function() { alert('تم إلغاء وضع الموظفين. جميع الصفحات متاحة الآن.'); }, 200);
};

"@

if ($content.IndexOf($target) -ge 0) {
    $newContent = $content.Replace($target, $target + $newFunctions)
    [System.IO.File]::WriteAllText((Resolve-Path $file).Path, $newContent, [System.Text.Encoding]::UTF8)
    Write-Host "SUCCESS: Staff mode functions inserted at index $($content.IndexOf($target))"
} else {
    Write-Host "ERROR: Target string not found in file"
}
