/* ====================================================
   shared.js  –  Shared utilities for all EyeGuard pages
   v2.0 – Full failsafe + complete dummy data
   ==================================================== */

// ── Constants ────────────────────────────────────────
const TOKEN_KEY = 'eyeguard_jwt_token';
const USER_KEY  = 'eyeguard_user';
const KEDIPIN_API_BASE = '/api'; // Pointing to Java Spring Boot backend

// ── Auth Helpers ─────────────────────────────────────
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || '{}'); }
    catch(e) { return {}; }
}
function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = '/index.html';
}
function requireAuth() {
    const token = getToken();
    if (!token) { window.location.href = '/index.html'; return null; }
    
    // Role protection
    const user = getUser();
    const isAdminPage = window.location.pathname.endsWith('admin.html');
    
    if (user && user.role === 'SUPER_ADMIN' && !isAdminPage) {
        window.location.href = 'admin.html';
        return null;
    }
    if (user && user.role !== 'SUPER_ADMIN' && isAdminPage) {
        window.location.href = 'dashboard.html';
        return null;
    }
    return token;
}

// ── API Helper ────────────────────────────────────────
async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };
    try {
        const fullPath = path.startsWith('/') ? path : '/' + path;
        const res = await fetch(fullPath, { ...options, headers });
        if (res.status === 401) {
            // Token expired or invalid — force logout
            console.warn('Session expired. Logging out.');
            logout();
            return null;
        }
        if (res.status === 403) {
            // Forbidden on this specific endpoint — log but do NOT logout
            console.warn('Access forbidden for:', path, '(403). Skipping this call.');
            return null;
        }
        return res;
    } catch(e) {
        console.warn('Network error:', path, e.message);
        return null;
    }
}

// ── UI Helpers ────────────────────────────────────────
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}
function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}
function showErr(elId, msg) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = msg; el.style.display = 'block';
}
function showSuccess(elId, msg) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = msg; el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}
function hideEl(elId) {
    const el = document.getElementById(elId);
    if (el) el.style.display = 'none';
}
function togglePass(inputId, btn) {
    const inp = document.getElementById(inputId);
    const isPass = inp.type === 'password';
    inp.type = isPass ? 'text' : 'password';
    btn.innerHTML = isPass
        ? '<i class="fa-regular fa-eye-slash"></i>'
        : '<i class="fa-regular fa-eye"></i>';
}
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

// ── Bar Chart Builder ─────────────────────────────────
function renderBarChart(containerId, data, maxVal, labelKey, valKey) {
    labelKey = labelKey || 'date';
    valKey   = valKey   || 'minutes';
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!data || data.length === 0) {
        el.innerHTML = '<p style="color:var(--text-light);font-size:.8rem;padding:10px">Belum ada data</p>';
        return;
    }
    const max = maxVal || Math.max(...data.map(d => d[valKey]), 1);
    el.innerHTML = data.map(d => {
        const pct    = Math.max(4, (d[valKey] / max) * 100);
        const isWarn = d[valKey] > 480;
        return `<div class="bar-item">
            <span class="bar-val">${d[valKey]}</span>
            <div class="bar-fill ${isWarn ? 'warn' : ''}" style="height:${pct}%"></div>
            <span class="bar-label">${d[labelKey]}</span>
        </div>`;
    }).join('');
}

// ── Format Helpers ────────────────────────────────────
function fmtDate(dt) {
    if (!dt) return '--';
    return new Date(dt).toLocaleString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}
function fmtDateShort(dt) {
    if (!dt) return '--';
    return new Date(dt).toLocaleDateString('id-ID', { day:'numeric', month:'short' });
}
function fmtMinutes(mins) {
    if (mins === null || mins === undefined) return '-- menit';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} menit`;
    return `${h} jam ${m} mnt`;
}

// ── Severity Badge Helper ─────────────────────────────
function severityClass(sev) {
    if (sev <= 2) return 'sev-low';
    if (sev <= 3) return 'sev-mid';
    return 'sev-high';
}
function severityLabel(sev) {
    if (sev <= 2) return 'Ringan';
    if (sev <= 3) return 'Sedang';
    return 'Berat';
}

// ── Mood Emoji ────────────────────────────────────────
function moodEmoji(mood) {
    const map = { 'Sangat Baik':'😄','Baik':'🙂','Biasa':'😐','Lelah':'😔','Sangat Lelah':'😞' };
    return map[mood] || '😐';
}

// ── Dummy Data (Fallback) ─────────────────────────────
const DUMMY_DASHBOARD = {
    userName: 'Pengguna EyeGuard',
    screenTime: '4 Jam 30 Menit',
    screenMinutes: 270,
    trendUp: false,
    trendPercentage: 8,
    distanceStatus: 'Aman',
    distanceValue: 40,
    lastRestTime: '7x istirahat',
    eyeComplaint: 'Tidak ada',
    targetPercentage: 80,
    targetMinutes: 240,
    healthScore: 85,
    totalBreaks: 7,
    weeklyData: [
        {date:'Sen',minutes:210},{date:'Sel',minutes:300},{date:'Rab',minutes:240},
        {date:'Kam',minutes:360},{date:'Jum',minutes:270},{date:'Sab',minutes:150},{date:'Min',minutes:90}
    ]
};

const DUMMY_DISTANCES = [
    {id:1, distanceCm:42, status:'SAFE', detectedAt: new Date(Date.now()-3600000).toISOString()},
    {id:2, distanceCm:28, status:'WARNING', detectedAt: new Date(Date.now()-7200000).toISOString()},
    {id:3, distanceCm:50, status:'SAFE', detectedAt: new Date(Date.now()-86400000).toISOString()},
    {id:4, distanceCm:35, status:'SAFE', detectedAt: new Date(Date.now()-172800000).toISOString()},
    {id:5, distanceCm:22, status:'WARNING', detectedAt: new Date(Date.now()-259200000).toISOString()},
];

const DUMMY_COMPLAINTS = [
    {id:1, complaintType:'Mata lelah', severity:3, notes:'', createdAt: new Date(Date.now()-3600000).toISOString()},
    {id:2, complaintType:'Mata kering', severity:2, notes:'', createdAt: new Date(Date.now()-86400000).toISOString()},
    {id:3, complaintType:'Sakit kepala', severity:4, notes:'Setelah 4 jam layar', createdAt: new Date(Date.now()-172800000).toISOString()},
];

const DUMMY_DAILY = [
    {id:1, statusDate:'2026-06-17', totalScreenTime:210, totalBreaks:8, avgDistance:42, eyeHealthScore:90, avgBlinkRate:14, postureScore:92, mood:'Baik', notes:''},
    {id:2, statusDate:'2026-06-18', totalScreenTime:300, totalBreaks:5, avgDistance:38, eyeHealthScore:78, avgBlinkRate:11, postureScore:75, mood:'Biasa', notes:''},
    {id:3, statusDate:'2026-06-19', totalScreenTime:240, totalBreaks:10, avgDistance:45, eyeHealthScore:92, avgBlinkRate:16, postureScore:88, mood:'Sangat Baik', notes:''},
    {id:4, statusDate:'2026-06-20', totalScreenTime:360, totalBreaks:3, avgDistance:30, eyeHealthScore:65, avgBlinkRate:9, postureScore:62, mood:'Lelah', notes:''},
    {id:5, statusDate:'2026-06-21', totalScreenTime:270, totalBreaks:7, avgDistance:40, eyeHealthScore:82, avgBlinkRate:13, postureScore:81, mood:'Baik', notes:''},
    {id:6, statusDate:'2026-06-22', totalScreenTime:150, totalBreaks:12, avgDistance:48, eyeHealthScore:95, avgBlinkRate:17, postureScore:95, mood:'Sangat Baik', notes:''},
    {id:7, statusDate:'2026-06-23', totalScreenTime:90, totalBreaks:4, avgDistance:35, eyeHealthScore:88, avgBlinkRate:12, postureScore:85, mood:'Baik', notes:''},
];

const DUMMY_PROFILE = {
    id: 1,
    name: 'Pengguna EyeGuard',
    email: 'user@eyeguard.id',
    age: 22,
    gender: 'Laki-laki',
    occupation: 'Mahasiswa',
    dailyScreenTarget: 240,
    role: 'USER',
    isActive: true,
    createdAt: '2026-01-01T00:00:00'
};

// ── Notifications Helper ─────────────────────────────
function getNotifications() {
    try {
        return JSON.parse(localStorage.getItem('eyeguard_notifications') || '[]');
    } catch(e) {
        return [];
    }
}

function addNotification(title, message, type = 'info') {
    const notifs = getNotifications();
    const newNotif = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        title,
        message,
        time: new Date().toISOString(),
        type, // 'success', 'warning', 'danger', 'info'
        read: false
    };
    notifs.unshift(newNotif);
    if (notifs.length > 20) notifs.pop();
    localStorage.setItem('eyeguard_notifications', JSON.stringify(notifs));
    
    // Update dot
    const dot = document.getElementById('notif-dot');
    if (dot) dot.style.display = 'block';
    
    if (window.onNewNotification) {
        window.onNewNotification(newNotif);
    }
}

function markNotificationsRead() {
    const notifs = getNotifications();
    notifs.forEach(n => n.read = true);
    localStorage.setItem('eyeguard_notifications', JSON.stringify(notifs));
    const dot = document.getElementById('notif-dot');
    if (dot) dot.style.display = 'none';
}