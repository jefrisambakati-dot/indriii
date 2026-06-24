/* ====================================================
   history.js  –  History Page  v1 (Kedipin)
   Endpoints:
     GET /api/user/tracking/distance  → TrackingLog[]
       { id, distanceCm, status, detectedAt }
     GET /api/user/tracking/complaint → Complaint[]
       { id, complaintType, severity/severityLevel, notes, createdAt }
     GET /api/user/tracking/daily     → DailyStatus[]
       { id, statusDate, totalScreenTime, totalBreaks, avgDistance,
         eyeHealthScore, avgBlinkRate, postureScore, mood, notes }
   ==================================================== */

requireAuth();

let currentTab = 'distance';

document.addEventListener('DOMContentLoaded', () => {
    loadTab('distance');
});

// ── Tab Switch ──────────────────────────────────────
function setHistoryTab(tab, btn) {
    currentTab = tab;
    // Toggle active class on buttons
    document.querySelectorAll('.h-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Hide all lists
    document.querySelectorAll('.history-list').forEach(el => el.style.display = 'none');
    const listEl = document.getElementById('hist-' + tab);
    if (listEl) listEl.style.display = 'block';

    loadTab(tab);
}

async function loadTab(tab) {
    const endpointMap = {
        distance:  '/api/user/tracking/distance',
        complaint: '/api/user/tracking/complaint',
        daily:     '/api/user/tracking/daily'
    };
    const listId = 'hist-' + tab;
    const el     = document.getElementById(listId);
    if (!el) return;

    // Skeleton
    el.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>`;

    try {
        const res = await apiFetch(endpointMap[tab]);
        if (res && res.ok) {
            const json = await res.json();
            const data = json.data;
            renderTab(tab, el, data);
        } else {
            // Fallback dummy
            renderTab(tab, el, getDummy(tab));
        }
    } catch(e) {
        renderTab(tab, el, getDummy(tab));
    }
}

// ── Render by tab ───────────────────────────────────
function renderTab(tab, el, data) {
    if (tab === 'distance')  renderDistanceList(el, data);
    if (tab === 'complaint') renderComplaintList(el, data);
    if (tab === 'daily')     renderDailyList(el, data);
}

function renderDistanceList(el, data) {
    if (!data || data.length === 0) {
        el.innerHTML = emptyState('📏', 'Belum ada data jarak layar.', 'Mulai tracking untuk mencatat jarak layar Anda.');
        return;
    }
    const sorted = [...data].sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));
    el.innerHTML = sorted.map(d => {
        const dist   = Math.round(d.distanceCm || (d.distanceMeters * 100) || 0);
        const safe   = d.status === 'SAFE' || dist >= 30;
        const warn   = d.status === 'WARNING' || (dist >= 20 && dist < 30);
        const badgeClass = safe ? 'badge-safe' : warn ? 'badge-warn' : 'badge-danger';
        const badgeText  = safe ? 'Aman' : warn ? 'Peringatan' : 'Berbahaya';
        const icon       = safe ? '✅' : warn ? '⚠️' : '🚨';
        return `
        <div class="hist-item">
            <div class="hist-left">
                <div class="hist-icon" style="background:${safe ? '#e6f5f1' : warn ? '#fff7ed' : '#fff5f5'}">
                    <span>${icon}</span>
                </div>
                <div>
                    <p class="hist-title">${dist} cm dari layar</p>
                    <p class="hist-sub">${fmtDate(d.detectedAt)}</p>
                </div>
            </div>
            <span class="badge-pill ${badgeClass}">${badgeText}</span>
        </div>`;
    }).join('');
}

function renderComplaintList(el, data) {
    if (!data || data.length === 0) {
        el.innerHTML = emptyState('🎉', 'Tidak ada keluhan tercatat.', 'Mata kamu sehat! Pertahankan kebiasaan baik.');
        return;
    }
    const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    el.innerHTML = sorted.map(c => {
        const sev  = c.severity || c.severityLevel || 1;
        const cls  = severityClass(sev);
        const lbl  = severityLabel(sev);
        return `
        <div class="hist-item">
            <div class="hist-left">
                <div class="hist-icon" style="background:#fff5f5">
                    <i class="fa-solid fa-eye" style="color:#ef4444;font-size:.9rem"></i>
                </div>
                <div>
                    <p class="hist-title">${c.complaintType}</p>
                    <p class="hist-sub">${fmtDate(c.createdAt)}</p>
                    ${c.notes ? `<p class="hist-note">"${c.notes}"</p>` : ''}
                </div>
            </div>
            <span class="badge-pill ${cls}">${lbl} (${sev}/5)</span>
        </div>`;
    }).join('');
}

function renderDailyList(el, data) {
    if (!data || data.length === 0) {
        el.innerHTML = emptyState('📅', 'Belum ada data harian.', 'Mulai log screen time dari Dashboard untuk melihat riwayat harian.');
        return;
    }
    const sorted = [...data].sort((a, b) => (b.statusDate||'').localeCompare(a.statusDate||''));
    el.innerHTML = sorted.map(d => {
        const score = d.eyeHealthScore || 0;
        const scoreColor = score >= 80 ? '#178d72' : score >= 60 ? '#f59e0b' : '#ef4444';
        const scoreBg    = score >= 80 ? '#e6f5f1' : score >= 60 ? '#fff7ed' : '#fff5f5';
        const mood    = d.mood || '--';
        const screenT = fmtMinutes(d.totalScreenTime || 0);
        const dist    = d.avgDistance ? Math.round(d.avgDistance) + ' cm' : '--';
        return `
        <div class="hist-daily-item">
            <div class="hd-top">
                <div class="hd-date-col">
                    <span class="hd-date">📅 ${formatDate(d.statusDate)}</span>
                    <span class="hd-mood">${moodEmoji(mood)} ${mood}</span>
                </div>
                <div class="hd-score" style="background:${scoreBg};color:${scoreColor}">
                    ${score}<small>/100</small>
                </div>
            </div>
            <div class="hd-stats">
                <div class="hd-stat">
                    <i class="fa-solid fa-clock" style="color:var(--primary)"></i>
                    <span>${screenT}</span>
                </div>
                <div class="hd-stat">
                    <i class="fa-solid fa-mug-hot" style="color:var(--purple)"></i>
                    <span>${d.totalBreaks || 0}x istirahat</span>
                </div>
                <div class="hd-stat">
                    <i class="fa-solid fa-ruler" style="color:var(--blue)"></i>
                    <span>${dist}</span>
                </div>
            </div>
            ${d.notes ? `<p class="hist-note">"${d.notes}"</p>` : ''}
        </div>`;
    }).join('');
}

// ── Helpers ─────────────────────────────────────────
function emptyState(icon, title, sub) {
    return `<div class="empty-state">
        <span class="empty-icon">${icon}</span>
        <strong style="display:block;margin-bottom:6px">${title}</strong>
        <span>${sub}</span>
    </div>`;
}

function formatDate(dateStr) {
    if (!dateStr) return '--';
    try {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday:'short', day:'numeric', month:'long', year:'numeric'
        });
    } catch(e) { return dateStr; }
}

// Dummy fallback
function getDummy(tab) {
    if (tab === 'distance')  return DUMMY_DISTANCES;
    if (tab === 'complaint') return DUMMY_COMPLAINTS;
    if (tab === 'daily')     return DUMMY_DAILY;
    return [];
}