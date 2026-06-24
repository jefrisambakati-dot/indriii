/* ====================================================
   dashboard.js  –  Dashboard Page  v2 (Kedipin)
   Endpoints:
     GET /api/user/dashboard          → full aggregated data
     POST /api/user/tracking/distance → {distanceCm, status}
     POST /api/user/tracking/complaint → {complaintType, severity, notes}
     POST /api/user/tracking/daily    → {date, totalScreenTime, totalBreaks, ...}
   ==================================================== */

requireAuth();

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    initNotifications();
});

async function loadDashboard() {
    try {
        const res = await apiFetch('/api/user/dashboard');
        if (res && res.ok) {
            const json = await res.json();
            renderDashboard(json.data || json);
        } else {
            throw new Error('API failed');
        }
    } catch(e) {
        console.warn('Dashboard fallback:', e.message);
        renderDashboard(DUMMY_DASHBOARD);
    }
}

function renderDashboard(data) {
    // Greeting
    const user = getUser();
    const name = (data.userName || user.name || 'Kawan').split(' ')[0];
    setText('user-greeting', `Hai, ${name} 👋`);

    // Health badge
    const score = data.healthScore ?? 85;
    setText('health-score', score);
    const badge = document.getElementById('health-badge');
    if (badge) {
        if (score >= 80)      badge.style.background = 'linear-gradient(135deg,#178d72,#20b08e)';
        else if (score >= 60) badge.style.background = 'linear-gradient(135deg,#f59e0b,#fbbf24)';
        else                  badge.style.background = 'linear-gradient(135deg,#ef4444,#f87171)';
    }

    // Screen Time
    setText('screen-time-val', data.screenTime || fmtMinutes(data.screenMinutes || 0));
    const trendUp = data.trendUp ?? false;
    const trendIcon = trendUp ? 'fa-arrow-up' : 'fa-arrow-down';
    const trendPct  = data.trendPercentage ?? 0;
    const trendEl   = document.getElementById('screen-time-trend');
    if (trendEl) {
        trendEl.innerHTML = `<i class="fa-solid ${trendIcon}"></i> ${trendPct}% dari kemarin`;
        trendEl.style.color = trendUp ? 'var(--danger)' : 'var(--primary)';
    }

    // Ring progress
    const pct = data.targetPercentage ?? 0;
    setText('target-pct', pct + '%');
    setText('target-detail', `${data.screenMinutes ?? 0} / ${data.targetMinutes ?? 240} menit`);
    setTimeout(() => {
        const ring = document.getElementById('ring-fill');
        if (ring) ring.style.strokeDashoffset = 201 - (pct / 100) * 201;
    }, 300);

    // Stats cards
    setText('jarak-badge', data.distanceStatus || 'Aman');
    setText('jarak-val', (data.distanceValue ?? 35) + ' cm');
    const jarakBadge = document.getElementById('jarak-badge');
    if (jarakBadge) {
        jarakBadge.style.color = data.distanceStatus === 'Aman' || data.distanceStatus === 'SAFE' ? 'var(--primary)' : 'var(--danger)';
    }

    setText('istirahat-val', data.totalBreaks != null ? data.totalBreaks + 'x' : '--');
    setText('keluhan-val', data.eyeComplaint || 'Tidak ada');

    // Show notif dot if health score is low
    const notifDot = document.getElementById('notif-dot');
    if (notifDot && score < 60) notifDot.style.display = 'block';

    // Bar chart
    renderBarChart('bar-chart', data.weeklyData || DUMMY_DASHBOARD.weeklyData, 600, 'date', 'minutes');
}

// ── Quick Action Modals ───────────────────────────────
function openLogDistance()   { openModal('modal-jarak'); }
function openLogComplaint()  { openModal('modal-keluhan'); }
function openLogScreenTime() {
    // Pre-fill today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('inp-date').value = today;
    openModal('modal-screentime');
}

async function submitLogDistance() {
    const raw = parseFloat(document.getElementById('inp-jarak').value);
    if (!raw || raw < 1) { 
        showErr('dist-err', 'Masukkan jarak yang valid (1-200 cm)');
        return; 
    }
    try {
        const res = await apiFetch('/api/user/tracking/distance', {
            method:'POST',
            body: JSON.stringify({
                distanceMeters: raw,
                activityType:   raw >= 30 ? 'SAFE' : raw >= 20 ? 'WARNING' : 'DANGER'
            })
        });
        if (res && res.ok) {
            closeModal('modal-jarak');
            document.getElementById('inp-jarak').value = '';
            showSuccess('dist-success', 'Jarak tercatat.');
            setTimeout(() => loadDashboard(), 500);
        } else {
            showErr('dist-err', 'Gagal menyimpan. Coba lagi.');
        }
    } catch(e) {
        showErr('dist-err', e.message);
    }
}

async function submitLogComplaint() {
    const type     = document.getElementById('inp-complaint').value;
    const severity = parseInt(document.getElementById('inp-severity').value) || 3;
    const notes    = document.getElementById('inp-notes').value.trim();
    try {
        const res = await apiFetch('/api/user/tracking/complaint', {
            method:'POST',
            body: JSON.stringify({ complaintType: type, severityLevel: severity, notes })
        });
        if (res && res.ok) {
            closeModal('modal-keluhan');
            document.getElementById('inp-notes').value = '';
            showSuccess('keluhan-success', 'Keluhan tercatat.');
            setTimeout(() => loadDashboard(), 500);
        } else {
            showErr('keluhan-err', 'Gagal menyimpan. Coba lagi.');
        }
    } catch(e) {
        showErr('keluhan-err', e.message);
    }
}

async function submitLogScreenTime() {
    const date    = document.getElementById('inp-date').value || new Date().toISOString().split('T')[0];
    const mins    = parseInt(document.getElementById('inp-screentime').value) || 0;
    const breaks  = parseInt(document.getElementById('inp-breaks').value) || 0;
    const dist    = parseFloat(document.getElementById('inp-avg-dist').value) || null;
    const mood    = document.getElementById('inp-mood').value;
    const notes   = document.getElementById('inp-daily-notes').value.trim();
    
    if (mins < 0 || breaks < 0) {
        showErr('daily-err', 'Nilai tidak boleh negatif.');
        return;
    }

    try {
        const res = await apiFetch('/api/user/tracking/daily', {
            method:'POST',
            body: JSON.stringify({
                date:              date,
                screenTimeMinutes: mins,
                totalBreaks:       breaks,
                avgDistance:       dist,
                mood:              mood || null,
                notes:             notes || null
            })
        });
        if (res && res.ok) {
            closeModal('modal-screentime');
            showSuccess('daily-success', 'Data harian tersimpan.');
            setTimeout(() => loadDashboard(), 500);
        } else {
            showErr('daily-err', 'Gagal menyimpan. Coba lagi.');
        }
    } catch(e) {
        showErr('daily-err', e.message);
    }
}

// ── Notifications UI Setup ──
function initNotifications() {
    const notifBtn = document.getElementById('notif-btn');
    const panel = document.getElementById('notif-panel');
    
    if (notifBtn && panel) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const visible = panel.style.display === 'flex';
            panel.style.display = visible ? 'none' : 'flex';
            if (!visible) {
                renderNotificationsList();
            }
        });
        
        // Hide panel when clicking outside
        document.addEventListener('click', () => {
            panel.style.display = 'none';
        });
    }

    // Check if we need to show the red dot initially
    const notifs = getNotifications();
    if (notifs.length === 0) {
        addNotification('Selamat Datang!', 'Mulai gunakan Kedipin untuk melacak kesehatan mata Anda secara real-time.', 'info');
    }
    const hasUnread = getNotifications().some(n => !n.read);
    const dot = document.getElementById('notif-dot');
    if (dot) dot.style.display = hasUnread ? 'block' : 'none';
}

function renderNotificationsList() {
    const body = document.getElementById('notif-panel-body');
    if (!body) return;
    const notifs = getNotifications();
    if (notifs.length === 0) {
        body.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-light);font-size:.8rem">Belum ada notifikasi</div>';
        return;
    }
    
    body.innerHTML = notifs.map(n => {
        const timeStr = new Date(n.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const iconMap = { success: '✓', warning: '⚠️', danger: '🚨', info: 'ℹ️' };
        const icon = iconMap[n.type] || '🔔';
        return `
        <div class="notif-item ${n.read ? '' : 'unread'}">
            <div class="notif-icon ${n.type}">${icon}</div>
            <div class="notif-content">
                <p class="notif-title">${n.title}</p>
                <p class="notif-desc">${n.message}</p>
                <span class="notif-time">${timeStr}</span>
            </div>
        </div>`;
    }).join('');
}

function clearAndCloseNotifs() {
    markNotificationsRead();
    renderNotificationsList();
    const panel = document.getElementById('notif-panel');
    if (panel) {
        setTimeout(() => { panel.style.display = 'none'; }, 800);
    }
}