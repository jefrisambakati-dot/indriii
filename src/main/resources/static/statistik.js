/* ====================================================
   statistik.js  –  Statistik Page  v2
   Endpoints:
     GET /api/user/dashboard          → aggregated + weeklyData
     GET /api/user/tracking/daily     → DailyStatus[]
     GET /api/user/tracking/distance  → TrackingLog[]
     GET /api/user/tracking/complaint → Complaint[]
   ==================================================== */

requireAuth();

document.addEventListener('DOMContentLoaded', loadAll);

async function loadAll() {
    // Parallel fetch
    const [dashRes, dailyRes, distRes, cmpRes] = await Promise.all([
        apiFetch('/api/user/dashboard'),
        apiFetch('/api/user/tracking/daily'),
        apiFetch('/api/user/tracking/distance'),
        apiFetch('/api/user/tracking/complaint'),
    ]);

    // Parse – fallback to dummy if any fails
    const dash  = (dashRes  && dashRes.ok)  ? (await dashRes.json()).data  : DUMMY_DASHBOARD;
    const daily = (dailyRes && dailyRes.ok) ? (await dailyRes.json()).data : DUMMY_DAILY;
    const dists = (distRes  && distRes.ok)  ? (await distRes.json()).data  : DUMMY_DISTANCES;
    const cmps  = (cmpRes   && cmpRes.ok)   ? (await cmpRes.json()).data   : DUMMY_COMPLAINTS;

    renderSummary(dash, daily, cmps);
    renderWeeklyChart(dash.weeklyData || []);
    renderHealthChart(daily);
    renderDailyList(daily);
    renderDistList(dists);
    renderCmpList(cmps);
}

function renderSummary(dash, daily, cmps) {
    setText('stat-total-time', dash.screenTime || '--');
    setText('stat-avg-dist', (dash.distanceValue ?? '--') + ' cm');
    setText('stat-total-complaints', String(cmps ? cmps.length : 0));
    setText('stat-total-breaks', dash.totalBreaks != null ? dash.totalBreaks + 'x' : '--');
}

function renderWeeklyChart(weeklyData) {
    renderBarChart('stat-bar-chart', weeklyData, 600, 'date', 'minutes');
}

function renderHealthChart(daily) {
    if (!daily || daily.length === 0) {
        renderBarChart('health-bar-chart', [], 100, 'date', 'minutes');
        return;
    }
    const last7 = daily.slice(-7).map(d => ({
        date: fmtDateShort(d.statusDate || d.date),
        minutes: d.eyeHealthScore || 0
    }));
    renderBarChart('health-bar-chart', last7, 100, 'date', 'minutes');
}

function renderDailyList(daily) {
    const el = document.getElementById('daily-list');
    if (!daily || daily.length === 0) {
        el.innerHTML = `<div class="empty-state">
            <span class="empty-icon">📅</span>
            Belum ada data harian. Mulai log screen time dari Dashboard!</div>`;
        return;
    }
    const sorted = [...daily].sort((a,b) => (b.statusDate||b.date||'').localeCompare(a.statusDate||a.date||''));
    el.innerHTML = sorted.slice(0, 14).map(d => {
        const score = d.eyeHealthScore || 0;
        const scoreClass = score >= 80 ? 'good' : score >= 60 ? 'mid' : 'bad';
        const mood = d.mood || '--';
        const date = d.statusDate || d.date || '--';
        const st   = fmtMinutes(d.totalScreenTime || 0);
        const dist = d.avgDistance ? Math.round(d.avgDistance) + ' cm' : '--';
        return `<div class="daily-item">
            <div class="daily-item-top">
                <span class="daily-date">📅 ${fmtDateShort(date)}</span>
                <span class="daily-score ${scoreClass}">Skor: ${score}/100</span>
            </div>
            <div class="daily-stats">
                <span class="daily-stat-item"><i class="fa-solid fa-clock"></i> ${st}</span>
                <span class="daily-stat-item"><i class="fa-solid fa-mug-hot"></i> ${d.totalBreaks || 0}x istirahat</span>
                <span class="daily-stat-item"><i class="fa-solid fa-ruler"></i> ${dist}</span>
                <span class="daily-stat-item daily-mood">${moodEmoji(mood)} ${mood}</span>
            </div>
            ${d.notes ? `<p style="font-size:.75rem;color:var(--text-light);margin-top:6px;font-style:italic">"${d.notes}"</p>` : ''}
        </div>`;
    }).join('');
}

function renderDistList(dists) {
    const el = document.getElementById('distance-list');
    if (!dists || dists.length === 0) {
        el.innerHTML = `<div class="empty-state">
            <span class="empty-icon">📏</span>
            Belum ada data jarak layar.</div>`;
        return;
    }
    el.innerHTML = dists.slice(0, 10).map(d => {
        const safe = d.status === 'SAFE' || d.distanceCm >= 30;
        return `<div class="dist-item">
            <div>
                <p class="dist-label"><i class="fa-solid fa-ruler" style="color:var(--primary)"></i> ${Math.round(d.distanceCm)} cm</p>
                <p class="dist-time">${fmtDate(d.detectedAt)}</p>
            </div>
            <span class="dist-badge badge-pill ${safe ? 'badge-safe' : 'badge-warn'}">
                ${safe ? 'Aman' : 'Terlalu Dekat'}
            </span>
        </div>`;
    }).join('');
}

function renderCmpList(cmps) {
    const el = document.getElementById('complaint-list');
    if (!cmps || cmps.length === 0) {
        el.innerHTML = `<div class="empty-state">
            <span class="empty-icon">🎉</span>
            Tidak ada keluhan tercatat. Mata kamu sehat!</div>`;
        return;
    }
    el.innerHTML = cmps.slice(0, 10).map(c => {
        const sev = c.severity || c.severityLevel || 1;
        return `<div class="cmp-item">
            <div>
                <p class="cmp-label"><i class="fa-solid fa-triangle-exclamation" style="color:var(--danger)"></i> ${c.complaintType}</p>
                <p class="cmp-time">${fmtDate(c.createdAt)}</p>
                ${c.notes ? `<p style="font-size:.72rem;color:var(--text-light);margin-top:2px">${c.notes}</p>` : ''}
            </div>
            <span class="cmp-badge badge-pill ${severityClass(sev)}">${severityLabel(sev)} (${sev}/5)</span>
        </div>`;
    }).join('');
}
