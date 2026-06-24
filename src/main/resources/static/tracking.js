/* ====================================================
   tracking.js  –  Tracking Page  v3 (Kedipin)
   ✅ Real-time timer (lokal browser)
   ✅ Auto-log distance ke /api/user/tracking/distance setiap 30 detik saat aktif
   ✅ Auto-log daily status saat STOP
   ✅ Complaint form terhubung ke backend
   ✅ Weekly chart dari /api/user/dashboard
   ✅ Fallback ke dummy data jika API error
   
   Endpoints yang ADA di backend:
     GET  /api/user/tracking/distance  → TrackingLog[]
     POST /api/user/tracking/distance  → {distanceMeters, activityType}
     GET  /api/user/tracking/complaint → Complaint[]
     POST /api/user/tracking/complaint → {complaintType, severityLevel, notes}
     GET  /api/user/tracking/daily     → DailyStatus[]
     POST /api/user/tracking/daily     → {date, screenTimeMinutes, totalBreaks, avgDistance, mood, notes}
     GET  /api/user/dashboard          → aggregated data
   ==================================================== */

requireAuth();

// ===== STATE =====
let trackingActive    = false;
let trackingStart     = null;   // timestamp ms
let timerInterval     = null;
let distanceInterval  = null;   // auto-log distance setiap 30s
let sessionBreaks     = 0;
let simulatedDistance = 40;     // cm, disimulasikan realtime

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', () => {
    initTrackingControls();
    initComplaintForm();
    initDistanceControls();
    loadDailyStats();
    loadWeeklyChart();
    restoreSessionFromStorage();
});

// ===== RESTORE SESSION jika tab refresh saat tracking aktif =====
function restoreSessionFromStorage() {
    const saved = sessionStorage.getItem('tracking_start');
    if (saved) {
        trackingStart  = parseInt(saved);
        trackingActive = true;
        sessionBreaks  = parseInt(sessionStorage.getItem('tracking_breaks') || '0');
        const startBtn  = document.getElementById('startTrackingBtn');
        const stopBtn   = document.getElementById('stopTrackingBtn');
        const liveCard  = document.querySelector('.tracking-live-card');
        const statusEl  = document.getElementById('tracking-status');
        const breakRow  = document.getElementById('break-row');
        const liveBadge = document.getElementById('live-badge');
        if (startBtn)  startBtn.style.display  = 'none';
        if (stopBtn)   { stopBtn.style.display = 'flex'; stopBtn.disabled = false; }
        if (liveCard)  liveCard.classList.add('active');
        if (statusEl)  statusEl.textContent    = 'Sedang berjalan';
        if (breakRow)  breakRow.style.display  = 'flex';
        if (liveBadge) liveBadge.style.display = 'flex';
        startTimerLoop();
        startDistanceLoop();
    }
}

// ===== TRACKING CONTROLS =====
function initTrackingControls() {
    const startBtn = document.getElementById('startTrackingBtn');
    const stopBtn  = document.getElementById('stopTrackingBtn');
    const breakBtn = document.getElementById('breakBtn');

    if (startBtn) startBtn.addEventListener('click', startTracking);
    if (stopBtn)  stopBtn.addEventListener('click',  stopTracking);
    if (breakBtn) breakBtn.addEventListener('click', logBreak);
}

async function startTracking() {
    trackingStart  = Date.now();
    trackingActive = true;
    sessionBreaks  = 0;
    sessionStorage.setItem('tracking_start', String(trackingStart));
    sessionStorage.setItem('tracking_breaks', '0');

    const startBtn = document.getElementById('startTrackingBtn');
    const stopBtn  = document.getElementById('stopTrackingBtn');
    const liveCard = document.querySelector('.tracking-live-card');
    const statusEl = document.getElementById('tracking-status');
    const breakRow = document.getElementById('break-row');
    const liveBadge= document.getElementById('live-badge');

    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn)  { stopBtn.style.display = 'flex'; stopBtn.disabled = false; }
    if (liveCard) liveCard.classList.add('active');
    if (statusEl) statusEl.textContent = 'Sedang berjalan';
    if (breakRow) breakRow.style.display = 'flex';
    if (liveBadge) liveBadge.style.display = 'flex';

    // Simulasi jarak awal
    simulatedDistance = Math.floor(Math.random() * 25 + 30); // 30-55cm
    updateDistanceUI(simulatedDistance);

    startTimerLoop();
    startDistanceLoop();
    showToast('Tracking dimulai! 🎯', 'success');
}

async function stopTracking() {
    if (!trackingActive) return;

    const durationMs   = Date.now() - trackingStart;
    const durationMins = Math.round(durationMs / 60000);
    trackingActive     = false;

    stopTimerLoop();
    stopDistanceLoop();
    sessionStorage.removeItem('tracking_start');
    sessionStorage.removeItem('tracking_breaks');

    const startBtn = document.getElementById('startTrackingBtn');
    const stopBtn  = document.getElementById('stopTrackingBtn');
    const liveCard = document.querySelector('.tracking-live-card');
    const statusEl = document.getElementById('tracking-status');
    const timerEl  = document.getElementById('tracking-timer');
    const breakRow = document.getElementById('break-row');
    const liveBadge= document.getElementById('live-badge');

    if (startBtn) startBtn.style.display = 'flex';
    if (stopBtn)  { stopBtn.style.display = 'none'; stopBtn.disabled = true; }
    if (liveCard) liveCard.classList.remove('active');
    if (statusEl) statusEl.textContent = 'Selesai';
    if (timerEl)  timerEl.textContent  = '00:00:00';
    if (breakRow) breakRow.style.display = 'none';
    if (liveBadge) liveBadge.style.display = 'none';

    // Ambil data hari ini terlebih dahulu untuk diakumulasikan agar tidak menimpa data sebelumnya
    let existingScreenTime = 0;
    let existingBreaks = 0;
    let existingAvgDist = simulatedDistance;

    try {
        const dailyRes = await apiFetch('/api/user/tracking/daily');
        if (dailyRes && dailyRes.ok) {
            const dailyJson = await dailyRes.json();
            const dailyList = dailyJson.data || [];
            const todayStr = new Date().toISOString().split('T')[0];
            const todayStatus = dailyList.find(d => (d.statusDate || d.date) === todayStr);
            if (todayStatus) {
                existingScreenTime = todayStatus.totalScreenTime || 0;
                existingBreaks = todayStatus.totalBreaks || 0;
                existingAvgDist = todayStatus.avgDistance || simulatedDistance;
            }
        }
    } catch(e) {
        console.warn('Gagal memuat status harian sebelumnya untuk akumulasi.', e);
    }

    const finalScreenTime = existingScreenTime + durationMins;
    const finalBreaks = existingBreaks + sessionBreaks;
    const finalAvgDist = Math.round((existingAvgDist + simulatedDistance) / 2);

    // Auto-simpan daily status ke backend
    const today = new Date().toISOString().split('T')[0];
    try {
        await apiFetch('/api/user/tracking/daily', {
            method: 'POST',
            body: JSON.stringify({
                date:              today,
                screenTimeMinutes: finalScreenTime,
                totalBreaks:       finalBreaks,
                avgDistance:       finalAvgDist,
                mood:              null,
                notes:             `Ditambahkan sesi tracking ${durationMins} menit via Kedipin`
            })
        });
        showToast(`✅ Sesi ${durationMins} menit tersimpan!`, 'success');
        addNotification('Sesi Tracking Selesai', `Anda menyelesaikan sesi pelacakan layar selama ${durationMins} menit dengan rata-rata jarak ${simulatedDistance} cm.`, 'success');
    } catch(e) {
        showToast('Sesi selesai (offline mode)', 'warn');
        addNotification('Sesi Tracking Selesai', `Sesi tracking selesai offline (${durationMins} menit).`, 'info');
    }

    loadDailyStats();
    loadWeeklyChart();
}

function logBreak() {
    if (!trackingActive) return;
    sessionBreaks++;
    sessionStorage.setItem('tracking_breaks', String(sessionBreaks));
    const el = document.getElementById('break-count');
    if (el) el.textContent = sessionBreaks + 'x';
    showToast('Istirahat dicatat 🫖', 'success');
    addNotification('Istirahat Dicatat', 'Sesi istirahat mata berhasil dicatat.', 'success');
}

// ===== TIMER LOOP =====
function startTimerLoop() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!trackingActive) return;
        const elapsed  = Math.floor((Date.now() - trackingStart) / 1000);
        const h = String(Math.floor(elapsed / 3600)).padStart(2,'0');
        const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2,'0');
        const s = String(elapsed % 60).padStart(2,'0');
        const timerEl = document.getElementById('tracking-timer');
        if (timerEl) timerEl.textContent = `${h}:${m}:${s}`;

        // Peringatan setiap 20 menit (aturan 20-20-20)
        if (elapsed > 0 && elapsed % 1200 === 0) {
            showToast('👁️ 20 menit berlalu! Lihat objek jauh selama 20 detik.', 'warn');
        }
    }, 1000);
}
function stopTimerLoop() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

// ===== DISTANCE LOOP – simulasi + log ke backend =====
let uiInterval = null;
let lastBeepTime = 0;

function triggerDistanceWarning(dist, status) {
    const cardEl = document.querySelector('.tracking-distance-card');
    if (cardEl) {
        cardEl.style.animation = 'pulse-warning 1s infinite alternate';
    }
    
    // Peringatan Audio Beep menggunakan Web Audio API (Maks 1x tiap 10 detik agar tidak bising)
    const now = Date.now();
    if (now - lastBeepTime > 10000) {
        lastBeepTime = now;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {
            console.warn('AudioContext warning beep skipped:', e.message);
        }
        addNotification('Jarak Terlalu Dekat', `Jarak mata ke layar terdeteksi ${dist} cm (Terlalu Dekat). Mohon jauhkan layar perangkat Anda!`, 'warning');
    }
}

function startDistanceLoop() {
    if (distanceInterval) clearInterval(distanceInterval);
    if (uiInterval) clearInterval(uiInterval);

    // 1. UI Fluctuation loop (setiap 2 detik agar dinamis/alive)
    uiInterval = setInterval(() => {
        if (!trackingActive) return;
        
        // Fluktuasi kecil ±1 atau 2 cm
        const change = (Math.random() > 0.5 ? 1 : -1) * (Math.random() > 0.7 ? 2 : 1);
        simulatedDistance = Math.max(15, Math.min(75, simulatedDistance + change));
        const dist = Math.round(simulatedDistance);
        
        let status = 'SAFE';
        if (dist < 20) status = 'DANGER';
        else if (dist < 30) status = 'WARNING';

        updateDistanceUI(dist, status);
        
        // Picu peringatan jika jarak terlalu dekat
        if (status !== 'SAFE') {
            triggerDistanceWarning(dist, status);
        }
    }, 2000);

    // 2. Backend logging loop (setiap 30 detik)
    distanceInterval = setInterval(async () => {
        if (!trackingActive) return;
        const dist = Math.round(simulatedDistance);
        let status = 'SAFE';
        if (dist < 20) status = 'DANGER';
        else if (dist < 30) status = 'WARNING';

        try {
            await apiFetch('/api/user/tracking/distance', {
                method: 'POST',
                body: JSON.stringify({
                    distanceMeters:  dist, // Kirim cm langsung
                    activityType:    status
                })
            });
        } catch(e) { /* silent */ }

    }, 30000);
}

function stopDistanceLoop() {
    if (distanceInterval) { clearInterval(distanceInterval); distanceInterval = null; }
    if (uiInterval) { clearInterval(uiInterval); uiInterval = null; }
    const cardEl = document.querySelector('.tracking-distance-card');
    if (cardEl) cardEl.style.animation = 'none';
}

function updateDistanceUI(dist, status = 'SAFE') {
    const valEl    = document.getElementById('distanceValue');
    const statusEl = document.getElementById('distanceStatus');
    const cardEl   = document.querySelector('.tracking-distance-card');

    if (valEl) valEl.textContent = dist + ' cm';
    if (statusEl) {
        statusEl.className = 'distance-status';
        if (status === 'DANGER') {
            statusEl.textContent = '⚠️ Terlalu Dekat! Jauhkan layar.';
            statusEl.classList.add('danger');
            if (cardEl) cardEl.style.borderColor = '#ef4444';
        } else if (status === 'WARNING') {
            statusEl.textContent = '⚠️ Terlalu Dekat';
            statusEl.classList.add('warning');
            if (cardEl) cardEl.style.borderColor = '#f59e0b';
        } else {
            statusEl.textContent = '✅ Jarak Aman';
            if (cardEl) {
                cardEl.style.borderColor = '#bae6fd';
                cardEl.style.animation = 'none';
            }
        }
    }
}

// ===== DISTANCE MANUAL INPUT =====
function initDistanceControls() {
    const logBtn = document.getElementById('logDistanceBtn');
    if (logBtn) logBtn.addEventListener('click', manualLogDistance);
}

async function manualLogDistance() {
    const input = document.getElementById('manualDistance');
    if (!input) return;
    const dist = parseFloat(input.value);
    if (!dist || dist < 1 || dist > 300) {
        showToast('Masukkan jarak yang valid (1-300 cm)', 'warn');
        return;
    }
    simulatedDistance = dist;
    const status = dist >= 30 ? 'SAFE' : dist >= 20 ? 'WARNING' : 'DANGER';
    updateDistanceUI(Math.round(dist), status);
    input.value = '';

    // Picu peringatan visual jika jarak yang diinput di bawah batasan aman
    if (status !== 'SAFE') {
        triggerDistanceWarning(Math.round(dist), status);
    }

    try {
        const res = await apiFetch('/api/user/tracking/distance', {
            method: 'POST',
            body: JSON.stringify({
                distanceMeters:  dist, // Kirim cm langsung ke backend DTO distanceMeters
                activityType:    status
            })
        });
        if (res && res.ok) showToast('Jarak tercatat ✅', 'success');
        else showToast('Gagal simpan jarak', 'warn');
    } catch(e) {
        showToast('Jarak disimpan offline', 'warn');
    }
}

// ===== COMPLAINT FORM =====
function initComplaintForm() {
    const btn = document.getElementById('submitComplaintBtn');
    if (btn) btn.addEventListener('click', submitComplaint);
}

async function submitComplaint() {
    const select    = document.getElementById('complaintSelect');
    const sevEl     = document.getElementById('complaintSeverity');
    const notesEl   = document.getElementById('complaintNotes');
    const btn       = document.getElementById('submitComplaintBtn');

    const complaintType   = select ? select.value : '';
    const severityLevel   = sevEl  ? parseInt(sevEl.value) || 3 : 3;
    const notes           = notesEl ? notesEl.value.trim() : '';

    if (!complaintType) {
        showToast('Pilih jenis keluhan terlebih dahulu', 'warn');
        return;
    }

    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';

    try {
        const res = await apiFetch('/api/user/tracking/complaint', {
            method: 'POST',
            body: JSON.stringify({ complaintType, severityLevel, notes })
        });

        if (res && res.ok) {
            if (select)  select.value  = '';
            if (sevEl)   sevEl.value   = '3';
            if (notesEl) notesEl.value = '';
            showToast('Keluhan berhasil dicatat ✅', 'success');
            addNotification('Keluhan Dicatat', `Keluhan '${complaintType}' (Tingkat: ${severityLevel}) berhasil dilaporkan.`, 'danger');
        } else {
            showToast('Gagal mengirim keluhan. Coba lagi.', 'warn');
        }
    } catch(e) {
        showToast('Error jaringan: ' + e.message, 'warn');
    } finally {
        btn.disabled  = false;
        btn.innerHTML = orig;
    }
}

// ===== LOAD DAILY STATS =====
async function loadDailyStats() {
    const res = await apiFetch('/api/user/tracking/daily');
    if (res && res.ok) {
        const json   = await res.json();
        const daily  = json.data || DUMMY_DAILY;
        renderDailyStats(daily);
    } else {
        renderDailyStats(DUMMY_DAILY);
    }
}

function renderDailyStats(daily) {
    if (!daily || daily.length === 0) {
        setText('trk-blink',   '-- / menit');
        setText('trk-posture', '--% Baik');
        setText('trk-summary-text', 'Belum ada data minggu ini. Mulai tracking sekarang!');
        return;
    }
    const latest = daily[0];
    setText('trk-blink',   (latest.avgBlinkRate  || 12) + 'x / menit');
    setText('trk-posture', (latest.postureScore   || 78) + '% Baik');
    updateSummaryText(daily);
}

function updateSummaryText(daily) {
    const week = daily.slice(0, 7);
    if (week.length === 0) {
        setText('trk-summary-text', 'Belum ada data minggu ini.');
        return;
    }
    const avg     = Math.round(week.reduce((s, d) => s + (d.totalScreenTime || 0), 0) / week.length);
    const h       = Math.floor(avg / 60);
    const m       = avg % 60;
    let trendTxt  = '';
    if (week.length >= 2) {
        const t = week[0].totalScreenTime || 0;
        const y = week[1].totalScreenTime || 0;
        if (y > 0) {
            const pct = Math.round((Math.abs(t - y) / y) * 100);
            trendTxt  = t > y ? ` Meningkat ${pct}% dari kemarin.` : t < y ? ` Menurun ${pct}% dari kemarin.` : ' Sama dengan kemarin.';
        }
    }
    setText('trk-summary-text', `Rata-rata layar ${h} jam ${m} menit per hari.${trendTxt}`);
}

// ===== WEEKLY CHART =====
async function loadWeeklyChart() {
    const res = await apiFetch('/api/user/dashboard');
    if (res && res.ok) {
        const json = await res.json();
        renderBarChart('tracking-bar-chart', json.data?.weeklyData || DUMMY_DASHBOARD.weeklyData, 600, 'date', 'minutes');
    } else {
        renderBarChart('tracking-bar-chart', DUMMY_DASHBOARD.weeklyData, 600, 'date', 'minutes');
    }
}

// ===== TOAST NOTIFICATION =====
function showToast(msg, type = 'success') {
    let toast = document.getElementById('toast-notif');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notif';
        toast.style.cssText = `
            position:fixed; bottom:90px; left:50%; transform:translateX(-50%);
            padding:10px 20px; border-radius:24px; font-size:.85rem; font-weight:600;
            z-index:9999; transition:opacity .3s; max-width:320px; text-align:center;
            box-shadow:0 4px 16px rgba(0,0,0,.15);
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#178d72' : type === 'warn' ? '#f59e0b' : '#ef4444';
    toast.style.color = '#fff';
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}