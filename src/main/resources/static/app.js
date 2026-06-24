// ─── SUPABASE CONFIG ────────────────────────────────────────────────────────
// KEDIPIN: Gunakan Java Spring Boot backend
// Set ke '' karena akan menggunakan relative path /api
const SUPABASE_URL = '';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0b292bWt1anhxaXVhaG9jb29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDI3MjIsImV4cCI6MjA2NTQxODcyMn0.7nqCdYOcEQ0R6RqBnzXRcY1Jit-qfXcQcuFaBYfJkCI';

// ─── KEDIPIN TOKEN KEYS ────────────────────────────────────────────────────────
const KEDIPIN_TOKEN_KEY = 'eyeguard_jwt_token';
const KEDIPIN_USER_KEY = 'eyeguard_user';

// ─── API HELPER ──────────────────────────────────────────────────────────────
const api = {
  headers: (token) => {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
};

// ─── AUTH API ────────────────────────────────────────────────────────────────
const authApi = {
  async signUp(email, password) {
    const res = await fetch(`${SUPABASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name: email.split('@')[0] })
    });
    const d = await res.json();
    if (!res.ok || d.success === false) throw new Error(d.message || 'Pendaftaran gagal.');
    return d;
  },
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password })
    });
    const d = await res.json();
    if (!res.ok || d.success === false) throw new Error(d.message || 'Login gagal.');
    return d;
  },
  async getUser(token) {
    const res = await fetch(`${SUPABASE_URL}/api/auth/user`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Sesi tidak valid.');
    return await res.json();
  }
};

// ─── DB HELPER (Supabase REST) ────────────────────────────────────────────────
const db = {
  async from(table, token) {
    return {
      select: async (cols = '*', query = '') => {
        let url = `${SUPABASE_URL}`;
        if (table === 'users') {
          const match = query.match(/id=eq\.(\d+)/);
          const userId = match ? match[1] : '';
          url += `/api/users/profile?userId=${userId}`;
        } else if (table === 'distance_logs') {
          const match = query.match(/user_id=eq\.(\d+)/);
          const userId = match ? match[1] : '';
          const limitMatch = query.match(/limit=(\d+)/);
          const limit = limitMatch ? limitMatch[1] : '100';
          url += `/api/tracking/distance?userId=${userId}&limit=${limit}`;
        } else if (table === 'complaint_logs') {
          const match = query.match(/user_id=eq\.(\d+)/);
          const userId = match ? match[1] : '';
          url += `/api/tracking/complaint?userId=${userId}`;
        } else if (table === 'daily_status') {
          const match = query.match(/user_id=eq\.(\d+)/);
          const userId = match ? match[1] : '';
          url += `/api/tracking/daily?userId=${userId}`;
        } else if (table === 'eye_exercises') {
          url += `/api/exercises`;
        } else if (table === 'health_articles') {
          url += `/api/articles`;
        }

        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Gagal memuat data ${table}`);
        const d = await res.json();
        if (table === 'users') {
          return [d];
        }
        return d;
      },
      insert: async (data) => {
        let url = `${SUPABASE_URL}`;
        if (table === 'users') {
          url += `/api/users/profile/update`;
        } else if (table === 'distance_logs') {
          url += `/api/tracking/distance`;
        } else if (table === 'complaint_logs') {
          url += `/api/tracking/complaint`;
        } else if (table === 'daily_status') {
          url += `/api/tracking/daily`;
        } else if (table === 'eye_exercises') {
          url += `/api/exercises`;
        } else if (table === 'health_articles') {
          url += `/api/articles`;
        }

        const res = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(data)
        });
        const d = await res.json();
        if (!res.ok || d.success === false) throw new Error(d.message || `Gagal menyimpan data ${table}`);
        return [data];
      },
      update: async (data, match) => {
        let url = `${SUPABASE_URL}`;
        if (table === 'users') {
          url += `/api/users/profile/update`;
        } else if (table === 'daily_status') {
          url += `/api/tracking/daily`;
        }

        const payload = { ...data, ...match };
        const res = await fetch(url, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
        });
        const d = await res.json();
        if (!res.ok || d.success === false) throw new Error(d.message || `Gagal memperbarui data ${table}`);
        return [payload];
      },
      delete: async (match) => {
        return true;
      }
    };
  }
};

// ─── STATE ───────────────────────────────────────────────────────────────────
let appState = {
  token: null,
  user: null,
  profile: null,
  currentPage: 'dashboard',
};

// ─── UTILITIES ───────────────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    background:${type === 'success' ? 'rgba(74,222,128,0.15)' : type === 'danger' ? 'rgba(248,113,113,0.15)' : 'rgba(124,92,252,0.15)'};
    border:1px solid ${type === 'success' ? 'rgba(74,222,128,0.3)' : type === 'danger' ? 'rgba(248,113,113,0.3)' : 'rgba(124,92,252,0.3)'};
    color:${type === 'success' ? '#4ade80' : type === 'danger' ? '#f87171' : '#a78bfa'};
    padding:12px 18px;border-radius:12px;font-size:14px;font-weight:500;
    backdrop-filter:blur(12px);box-shadow:0 8px 24px rgba(0,0,0,0.4);
    animation:fadeUp 0.3s ease;max-width:320px;
  `;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function showLoading(parentId) {
  $(`#${parentId}`).innerHTML = '<div class="loading"><div class="spinner"></div></div>';
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(sec) {
  if (!sec) return '—';
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function setupAuth() {
  const tabs = $$('.auth-tab');
  const loginForm = $('#login-form');
  const registerForm = $('#register-form');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
      } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
      }
      clearAuthMessages();
    });
  });

  $('#btn-login').addEventListener('click', handleLogin);
  $('#btn-register').addEventListener('click', handleRegister);
  $('#form-login-email').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(e); });
  $('#form-login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(e); });
}

function clearAuthMessages() {
  $$('.auth-err, .auth-success').forEach(el => el.style.display = 'none');
}

async function handleLogin(e) {
  if (e) e.preventDefault();
  const email = $('#form-login-email').value.trim();
  const pass = $('#form-login-pass').value;
  const errEl = $('#login-err');
  clearAuthMessages();

  if (!email || !pass) { errEl.textContent = 'Isi email dan password.'; errEl.style.display = 'block'; return; }

  const btn = $('#btn-login');
  btn.disabled = true; btn.textContent = 'Memproses...';

  try {
      const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: email, password: pass })
      });

      if (response.ok) {
          // Parse response JSON dari backend
          const resJson = await response.json();
          
          // JIKA SUKSES: Wajib simpan token
          // Asumsi struktur API: { data: { accessToken: "..." } }
          localStorage.setItem('eyeguard_jwt_token', resJson.data.accessToken);
          
          // JIKA SUKSES: Langsung arahkan secara eksplisit
          window.location.href = '/dashboard.html';
      } else if (response.status === 401) {
          // Bad Credentials
          throw new Error('Email atau password salah');
      } else {
          // Error lain dari server
          throw new Error('Terjadi kesalahan pada server. Silakan coba lagi.');
      }
  } catch (error) {
      errEl.textContent = error.message;
      errEl.style.display = 'block';
  } finally {
      btn.disabled = false;
      btn.textContent = 'Masuk';
  }
}

async function handleRegister() {
  const name = $('#form-reg-name').value.trim();
  const email = $('#form-reg-email').value.trim();
  const pass = $('#form-reg-pass').value;
  const errEl = $('#register-err');
  const sucEl = $('#register-success');
  clearAuthMessages();

  if (!name || !email || !pass) { errEl.textContent = 'Semua kolom wajib diisi.'; errEl.style.display = 'block'; return; }
  if (pass.length < 6) { errEl.textContent = 'Password minimal 6 karakter.'; errEl.style.display = 'block'; return; }

  const btn = $('#btn-register');
  btn.disabled = true; btn.textContent = 'Mendaftar...';

  try {
    const data = await authApi.signUp(email, pass);
    if (data.user) {
      // Store name for profile setup later
      sessionStorage.setItem('eyeguard_pending_name', name);
      sessionStorage.setItem('eyeguard_pending_email', email);
      
      if (data.access_token) {
        appState.token = data.access_token;
        appState.user = data.user;
        localStorage.setItem('eyeguard_token', data.access_token);
        localStorage.setItem('eyeguard_user', JSON.stringify(data.user));
        await initApp();
      } else {
        sucEl.textContent = '✓ Akun dibuat! Cek email untuk konfirmasi, lalu login.';
        sucEl.style.display = 'block';
      }
    }
  } catch (err) {
    errEl.textContent = err.message || 'Registrasi gagal.';
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false; btn.textContent = 'Daftar Sekarang';
  }
}

function handleLogout() {
  localStorage.removeItem('eyeguard_token');
  localStorage.removeItem('eyeguard_user');
  appState = { token: null, user: null, profile: null, currentPage: 'dashboard' };
  $('#app-screen').style.display = 'none';
  $('#auth-screen').style.display = 'flex';
  toast('Berhasil logout', 'info');
}

// ─── APP INIT ─────────────────────────────────────────────────────────────────
async function initApp() {
  $('#auth-screen').style.display = 'none';
  $('#app-screen').style.display = 'block';

  // Load user profile
  await loadProfile();

  // Setup sidebar
  updateSidebarUser();

  // Navigation
  setupNavigation();

  // Load initial page
  navigateTo('dashboard');
}

async function loadProfile() {
  if (!appState.token) return;
  try {
    const userId = appState.user?.id;
    if (!userId) return;
    const t = await db.from('users', appState.token);
    const rows = await t.select('*', `&id=eq.${userId}`);
    if (rows && rows.length > 0) {
      appState.profile = rows[0];
    } else {
      // New user, show setup
      const pendingName = sessionStorage.getItem('eyeguard_pending_name') || '';
      showProfileSetup(pendingName);
    }
  } catch (e) {
    console.warn('Profile load error:', e);
  }
}

async function showProfileSetup(name) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'setup-modal';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-title">👁️ Selamat Datang di EyeGuard!</div>
      <div class="modal-sub">Lengkapi profil kamu untuk mendapatkan rekomendasi yang lebih personal.</div>
      <div id="setup-err" class="auth-err"></div>
      <div class="form-group">
        <label>Nama Lengkap</label>
        <input id="setup-name" type="text" placeholder="Nama kamu" value="${name}">
      </div>
      <div class="form-group">
        <label>Usia</label>
        <input id="setup-age" type="number" placeholder="Umur kamu" min="5" max="100">
      </div>
      <div class="form-group">
        <label>Jenis Kelamin</label>
        <select id="setup-gender">
          <option value="">Pilih...</option>
          <option value="Laki-laki">Laki-laki</option>
          <option value="Perempuan">Perempuan</option>
        </select>
      </div>
      <div class="form-group">
        <label>Pekerjaan</label>
        <input id="setup-job" type="text" placeholder="Pelajar / Programmer / dll">
      </div>
      <div class="form-group">
        <label>Target Layar Harian (menit)</label>
        <input id="setup-target" type="number" placeholder="120" value="120" min="30">
      </div>
      <button class="btn-primary" id="btn-setup-save" style="margin-top:8px">Simpan Profil</button>
    </div>
  `;
  document.body.appendChild(overlay);

  $('#btn-setup-save').addEventListener('click', async () => {
    const n = $('#setup-name').value.trim();
    const a = parseInt($('#setup-age').value);
    const g = $('#setup-gender').value;
    const j = $('#setup-job').value.trim();
    const tgt = parseInt($('#setup-target').value) || 120;
    const errEl = $('#setup-err');
    errEl.style.display = 'none';

    if (!n) { errEl.textContent = 'Nama wajib diisi.'; errEl.style.display = 'block'; return; }

    try {
      const t = await db.from('users', appState.token);
      const newUser = {
        id: appState.user.id,
        username: appState.user.email?.split('@')[0] || n,
        email: appState.user.email,
        name: n,
        age: a || null,
        gender: g || null,
        occupation: j || null,
        daily_screen_target: tgt
      };
      await t.insert(newUser);
      appState.profile = newUser;
      overlay.remove();
      sessionStorage.removeItem('eyeguard_pending_name');
      updateSidebarUser();
      toast('Profil berhasil disimpan!', 'success');
      navigateTo('dashboard');
    } catch (e) {
      errEl.textContent = e.message || 'Gagal menyimpan profil.';
      errEl.style.display = 'block';
    }
  });
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
function setupNavigation() {
  $$('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      navigateTo(page);
      // mobile close
      if (window.innerWidth <= 900) {
        $('#sidebar').classList.remove('open');
        $('#mobile-overlay').style.display = 'none';
      }
    });
  });

  $('#btn-logout').addEventListener('click', handleLogout);

  // Hamburger
  const hamburger = document.createElement('button');
  hamburger.className = 'hamburger';
  hamburger.innerHTML = '☰';
  hamburger.id = 'hamburger';
  document.body.appendChild(hamburger);

  const mobileOverlay = document.createElement('div');
  mobileOverlay.className = 'mobile-overlay';
  mobileOverlay.id = 'mobile-overlay';
  document.body.appendChild(mobileOverlay);

  hamburger.addEventListener('click', () => {
    $('#sidebar').classList.toggle('open');
    mobileOverlay.style.display = $('#sidebar').classList.contains('open') ? 'block' : 'none';
  });
  mobileOverlay.addEventListener('click', () => {
    $('#sidebar').classList.remove('open');
    mobileOverlay.style.display = 'none';
  });
}

function navigateTo(page) {
  appState.currentPage = page;
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-item').forEach(n => n.classList.remove('active'));

  $(`#page-${page}`)?.classList.add('active');
  $(`.nav-item[data-page="${page}"]`)?.classList.add('active');

  // Load page data
  const loaders = {
    dashboard: loadDashboard,
    tracking: loadTracking,
    exercises: loadExercises,
    content: loadContent,
    profile: loadProfilePage,
  };
  if (loaders[page]) loaders[page]();
}

function updateSidebarUser() {
  const name = appState.profile?.name || appState.user?.email?.split('@')[0] || 'User';
  const email = appState.user?.email || '';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  $('#sidebar-name').textContent = name;
  $('#sidebar-email').textContent = email;
  $('#sidebar-avatar').textContent = initials;
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
async function loadDashboard() {
  const userId = appState.user?.id;
  if (!userId) return;

  showLoading('dash-stats');
  showLoading('dash-recent');

  try {
    // Parallel requests
    const [distanceLogs, statusRows, exercises] = await Promise.all([
      fetchDistanceLogs(userId, '&limit=7'),
      fetchDailyStatus(userId),
      fetchExercises()
    ]);

    // Stats
    const totalDist = distanceLogs.reduce((a, b) => a + (b.distance_meters || 0), 0);
    const today = statusRows.find(r => r.date === new Date().toISOString().split('T')[0]);
    const screenMins = today?.screen_time_minutes || 0;
    const target = appState.profile?.daily_screen_target || 120;
    const score = calculateHealthScore(screenMins, target, distanceLogs.length);

    $('#dash-stats').innerHTML = `
      <div class="stats-grid">
        <div class="stat-card purple">
          <span class="stat-icon">👁️</span>
          <div class="stat-value">${score}</div>
          <div class="stat-label">Skor Kesehatan Mata</div>
        </div>
        <div class="stat-card cyan">
          <span class="stat-icon">🏃</span>
          <div class="stat-value">${(totalDist/1000).toFixed(1)}km</div>
          <div class="stat-label">Total Jarak 7 Hari</div>
        </div>
        <div class="stat-card pink">
          <span class="stat-icon">📺</span>
          <div class="stat-value">${screenMins}m</div>
          <div class="stat-label">Layar Hari Ini</div>
        </div>
        <div class="stat-card green">
          <span class="stat-icon">🧘</span>
          <div class="stat-value">${exercises.length}</div>
          <div class="stat-label">Total Latihan Tersedia</div>
        </div>
      </div>
    `;

    // Health score ring
    const pct = Math.min(score, 100);
    const circ = 2 * Math.PI * 54;
    const dashOffset = circ - (pct / 100) * circ;
    const color = score >= 75 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171';

    $('#dash-recent').innerHTML = `
      <div class="grid-2" style="gap:20px;margin-bottom:20px">
        <div class="card">
          <div class="card-title">💚 Skor Kesehatan Mata</div>
          <div class="score-ring-wrap">
            <div class="score-ring">
              <svg viewBox="0 0 120 120" width="140" height="140">
                <defs>
                  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="${color}"/>
                    <stop offset="100%" stop-color="${color}88"/>
                  </linearGradient>
                </defs>
                <circle class="track" cx="60" cy="60" r="54" stroke="rgba(255,255,255,0.07)" fill="none" stroke-width="10"/>
                <circle class="fill" cx="60" cy="60" r="54" fill="none" stroke-width="10" stroke="${color}"
                  stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${dashOffset}" transform="rotate(-90 60 60)"/>
              </svg>
              <div class="score-center">
                <div class="score-num" style="color:${color}">${score}</div>
                <div class="score-lbl">/ 100</div>
              </div>
            </div>
          </div>
          <div style="margin-top:14px">
            <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-secondary);margin-bottom:6px">
              <span>Target Layar</span>
              <span>${screenMins}m / ${target}m</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${Math.min((screenMins/target)*100,100)}%;background:${screenMins>target?'linear-gradient(90deg,#f87171,#fb7185)':'linear-gradient(90deg,var(--accent),var(--accent2))'}"></div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">📍 Aktivitas Terkini</div>
          ${distanceLogs.length === 0
            ? '<div class="empty-state"><span class="empty-icon">🌿</span><h3>Belum ada data</h3><p>Catat aktivitas pertamamu di halaman Tracking!</p></div>'
            : `<div class="table-wrap"><table>
                <thead><tr><th>Tanggal</th><th>Jarak</th><th>Tipe</th></tr></thead>
                <tbody>
                  ${distanceLogs.slice(0,5).map(l => `
                    <tr>
                      <td>${formatDate(l.created_at)}</td>
                      <td><strong>${l.distance_meters}m</strong></td>
                      <td><span class="badge badge-purple">${l.activity_type || 'Umum'}</span></td>
                    </tr>`).join('')}
                </tbody></table></div>`
          }
          <button class="btn btn-outline" style="margin-top:14px;width:100%" onclick="navigateTo('tracking')">➕ Catat Aktivitas</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">💡 Tips Hari Ini</div>
        <div class="alert alert-info">👁️ <strong>Aturan 20-20-20:</strong> Setiap 20 menit, lihat objek 20 kaki (~6m) jauhnya selama 20 detik untuk mengurangi kelelahan mata.</div>
        <div class="alert alert-warning">🌙 <strong>Mode Gelap:</strong> Gunakan mode gelap atau filter cahaya biru di malam hari untuk melindungi mata kamu.</div>
        <div class="alert alert-success">🧘 <strong>Latihan Mata:</strong> Lakukan latihan mata setidaknya 2x sehari untuk menjaga fleksibilitas otot mata.</div>
      </div>
    `;

  } catch (e) {
    console.error(e);
    $('#dash-stats').innerHTML = `<div class="alert alert-danger">⚠️ Gagal memuat data: ${e.message}</div>`;
    $('#dash-recent').innerHTML = '';
  }
}

function calculateHealthScore(screenMins, target, activeDays) {
  let score = 100;
  const ratio = screenMins / (target || 120);
  if (ratio > 2) score -= 40;
  else if (ratio > 1.5) score -= 25;
  else if (ratio > 1) score -= 10;
  score += Math.min(activeDays * 3, 15);
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── TRACKING ─────────────────────────────────────────────────────────────────
async function loadTracking() {
  const userId = appState.user?.id;
  showLoading('tracking-content');

  try {
    const [distLogs, compLogs, statusRows] = await Promise.all([
      fetchDistanceLogs(userId),
      fetchComplaintLogs(userId),
      fetchDailyStatus(userId)
    ]);

    const today = new Date().toISOString().split('T')[0];
    const todayStatus = statusRows.find(r => r.date === today);

    $('#tracking-content').innerHTML = `
      <div class="grid-2" style="margin-bottom:20px">
        <!-- Catat Jarak -->
        <div class="card">
          <div class="card-title">🏃 Catat Aktivitas Fisik</div>
          <div class="form-group">
            <label>Jarak (meter)</label>
            <input id="t-dist" type="number" placeholder="Contoh: 1500" min="1">
          </div>
          <div class="form-group">
            <label>Tipe Aktivitas</label>
            <select id="t-type">
              <option value="Jalan Kaki">Jalan Kaki</option>
              <option value="Lari">Lari</option>
              <option value="Bersepeda">Bersepeda</option>
              <option value="Renang">Renang</option>
              <option value="Olahraga Lain">Olahraga Lain</option>
            </select>
          </div>
          <div class="form-group">
            <label>Catatan (opsional)</label>
            <input id="t-note" type="text" placeholder="Misal: lari pagi di lapangan">
          </div>
          <button class="btn btn-accent" id="btn-log-dist">➕ Catat Aktivitas</button>
        </div>

        <!-- Catat Keluhan -->
        <div class="card">
          <div class="card-title">😣 Catat Keluhan Mata</div>
          <div class="form-group">
            <label>Jenis Keluhan</label>
            <select id="t-complaint">
              <option value="Mata Lelah">Mata Lelah</option>
              <option value="Mata Kering">Mata Kering</option>
              <option value="Sakit Kepala">Sakit Kepala</option>
              <option value="Penglihatan Kabur">Penglihatan Kabur</option>
              <option value="Mata Merah">Mata Merah</option>
              <option value="Mata Berair">Mata Berair</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div class="form-group">
            <label>Tingkat Keparahan (1–10)</label>
            <input id="t-severity" type="range" min="1" max="10" value="5">
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);margin-top:4px"><span>Ringan</span><span id="t-severity-val">5</span><span>Parah</span></div>
          </div>
          <div class="form-group">
            <label>Catatan</label>
            <input id="t-complaint-note" type="text" placeholder="Deskripsi singkat">
          </div>
          <button class="btn btn-accent" id="btn-log-complaint">➕ Catat Keluhan</button>
        </div>
      </div>

      <!-- Screen Time -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-title">📺 Update Waktu Layar Hari Ini</div>
        <div class="input-row">
          <div class="form-group">
            <label>Total Waktu Layar (menit)</label>
            <input id="t-screen" type="number" placeholder="${todayStatus?.screen_time_minutes || 0}" value="${todayStatus?.screen_time_minutes || ''}" min="0">
          </div>
          <button class="btn btn-accent" id="btn-update-screen" style="margin-bottom:0">💾 Simpan</button>
        </div>
      </div>

      <!-- Riwayat -->
      <div class="grid-2">
        <div class="card">
          <div class="card-title">📋 Riwayat Aktivitas</div>
          <div class="table-wrap">
            ${distLogs.length === 0
              ? '<div class="empty-state" style="padding:30px"><span class="empty-icon">🏃</span><h3>Belum ada aktivitas</h3></div>'
              : `<table>
                  <thead><tr><th>Tanggal</th><th>Jarak</th><th>Tipe</th></tr></thead>
                  <tbody>
                    ${distLogs.slice(0,8).map(l => `
                      <tr>
                        <td>${formatDate(l.created_at)}</td>
                        <td><strong>${l.distance_meters}m</strong></td>
                        <td><span class="badge badge-purple">${l.activity_type || '—'}</span></td>
                      </tr>`).join('')}
                  </tbody></table>`
            }
          </div>
        </div>
        <div class="card">
          <div class="card-title">😣 Riwayat Keluhan</div>
          <div class="table-wrap">
            ${compLogs.length === 0
              ? '<div class="empty-state" style="padding:30px"><span class="empty-icon">✨</span><h3>Tidak ada keluhan!</h3></div>'
              : `<table>
                  <thead><tr><th>Tanggal</th><th>Keluhan</th><th>Level</th></tr></thead>
                  <tbody>
                    ${compLogs.slice(0,8).map(l => {
                      const sev = l.severity_level || l.severity || 5;
                      const badge = sev >= 7 ? 'badge-danger' : sev >= 4 ? 'badge-warning' : 'badge-safe';
                      return `<tr>
                        <td>${formatDate(l.created_at)}</td>
                        <td><strong>${l.complaint_type || l.complaint || '—'}</strong></td>
                        <td><span class="badge ${badge}">${sev}/10</span></td>
                      </tr>`;
                    }).join('')}
                  </tbody></table>`
            }
          </div>
        </div>
      </div>
    `;

    // Severity slider
    $('#t-severity')?.addEventListener('input', e => $('#t-severity-val').textContent = e.target.value);

    // Log distance
    $('#btn-log-dist')?.addEventListener('click', async () => {
      const dist = parseInt($('#t-dist').value);
      const type = $('#t-type').value;
      const note = $('#t-note').value;
      if (!dist || dist <= 0) { toast('Masukkan jarak yang valid!', 'danger'); return; }
      try {
        const t = await db.from('distance_logs', appState.token);
        await t.insert({ user_id: userId, distance_meters: dist, activity_type: type, notes: note || null, created_at: new Date().toISOString() });
        toast('Aktivitas berhasil dicatat! 🏃', 'success');
        loadTracking();
      } catch (e) { toast(e.message, 'danger'); }
    });

    // Log complaint
    $('#btn-log-complaint')?.addEventListener('click', async () => {
      const complaint = $('#t-complaint').value;
      const severity = parseInt($('#t-severity').value);
      const note = $('#t-complaint-note').value;
      try {
        const t = await db.from('complaint_logs', appState.token);
        await t.insert({ user_id: userId, complaint_type: complaint, severity_level: severity, notes: note || null, created_at: new Date().toISOString() });
        toast('Keluhan berhasil dicatat! 😌', 'success');
        loadTracking();
      } catch (e) { toast(e.message, 'danger'); }
    });

    // Update screen time
    $('#btn-update-screen')?.addEventListener('click', async () => {
      const mins = parseInt($('#t-screen').value);
      if (isNaN(mins)) { toast('Masukkan menit yang valid!', 'danger'); return; }
      try {
        if (todayStatus) {
          const t = await db.from('daily_status', appState.token);
          await t.update({ screen_time_minutes: mins }, { id: todayStatus.id });
        } else {
          const t = await db.from('daily_status', appState.token);
          await t.insert({ user_id: userId, date: today, screen_time_minutes: mins });
        }
        toast('Waktu layar diperbarui! 📺', 'success');
        loadTracking();
      } catch (e) { toast(e.message, 'danger'); }
    });

  } catch (e) {
    $('#tracking-content').innerHTML = `<div class="alert alert-danger">⚠️ ${e.message}</div>`;
  }
}

// ─── EXERCISES ────────────────────────────────────────────────────────────────
async function loadExercises() {
  showLoading('exercises-content');
  try {
    const exercises = await fetchExercises();

    $('#exercises-content').innerHTML = `
      <div class="card section-gap">
        <div class="card-title">➕ Tambah Latihan Baru</div>
        <div class="grid-2" style="gap:12px;margin-bottom:12px">
          <div class="form-group" style="margin-bottom:0">
            <label>Nama Latihan</label>
            <input id="ex-name" type="text" placeholder="Contoh: Palming">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label>Durasi (detik)</label>
            <input id="ex-dur" type="number" placeholder="60" min="10">
          </div>
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <input id="ex-desc" type="text" placeholder="Deskripsi singkat latihan">
        </div>
        <div class="grid-2" style="gap:12px;margin-bottom:12px">
          <div class="form-group" style="margin-bottom:0">
            <label>Repetisi</label>
            <input id="ex-rep" type="number" placeholder="5" min="1" value="5">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label>Kategori</label>
            <select id="ex-cat">
              <option value="Relaksasi">Relaksasi</option>
              <option value="Fokus">Fokus</option>
              <option value="Peregangan">Peregangan</option>
              <option value="Penguatan">Penguatan</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Instruksi Detail</label>
          <input id="ex-instr" type="text" placeholder="Langkah-langkah melakukan latihan...">
        </div>
        <button class="btn btn-accent" id="btn-add-exercise">➕ Tambah Latihan</button>
      </div>

      <div class="section-title">🧘 Latihan Tersedia (${exercises.length})</div>
      <div class="exercise-grid" id="exercise-list">
        ${exercises.length === 0
          ? '<div class="empty-state"><span class="empty-icon">🧘</span><h3>Belum ada latihan</h3><p>Tambahkan latihan mata pertamamu!</p></div>'
          : exercises.map(ex => renderExerciseCard(ex)).join('')
        }
      </div>
    `;

    // Add exercise
    $('#btn-add-exercise')?.addEventListener('click', async () => {
      const name = $('#ex-name').value.trim();
      const dur = parseInt($('#ex-dur').value);
      const desc = $('#ex-desc').value.trim();
      const rep = parseInt($('#ex-rep').value) || 5;
      const cat = $('#ex-cat').value;
      const instr = $('#ex-instr').value.trim();

      if (!name || !dur) { toast('Nama dan durasi wajib diisi!', 'danger'); return; }

      try {
        const t = await db.from('eye_exercises', appState.token);
        await t.insert({
          exercise_name: name,
          duration_seconds: dur,
          description: desc || null,
          repetitions: rep,
          category: cat,
          instructions: instr || null,
          difficulty_level: 'Mudah',
          is_active: true,
          created_by: appState.user?.id,
          created_at: new Date().toISOString()
        });
        toast('Latihan berhasil ditambahkan! 🧘', 'success');
        loadExercises();
      } catch (e) { toast(e.message, 'danger'); }
    });

    // Attach start timer buttons
    $$('.btn-start-ex').forEach(btn => {
      btn.addEventListener('click', () => {
        const dur = parseInt(btn.dataset.dur);
        const name = btn.dataset.name;
        startExerciseTimer(name, dur);
      });
    });

  } catch (e) {
    $('#exercises-content').innerHTML = `<div class="alert alert-danger">⚠️ ${e.message}</div>`;
  }
}

function renderExerciseCard(ex) {
  const catColor = {
    Relaksasi: 'badge-purple',
    Fokus: 'badge-safe',
    Peregangan: 'badge-warning',
    Penguatan: 'badge-danger'
  }[ex.category] || 'badge-purple';

  return `
    <div class="exercise-card">
      <div class="exercise-title">🧘 ${ex.exercise_name}</div>
      <div class="exercise-desc">${ex.description || 'Tidak ada deskripsi.'}</div>
      <div class="exercise-meta">
        <span class="badge ${catColor}">${ex.category || 'Umum'}</span>
        <span class="badge badge-purple">⏱️ ${formatTime(ex.duration_seconds)}</span>
        <span class="badge badge-purple">🔄 ${ex.repetitions || 1}x</span>
      </div>
      ${ex.instructions ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.5">${ex.instructions}</div>` : ''}
      <div class="exercise-actions">
        <button class="btn btn-accent btn-start-ex" data-dur="${ex.duration_seconds || 60}" data-name="${ex.exercise_name}">▶ Mulai</button>
      </div>
    </div>
  `;
}

function startExerciseTimer(name, dur) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  let remaining = dur;
  let interval;

  overlay.innerHTML = `
    <div class="modal-box" style="text-align:center;max-width:360px">
      <div style="font-size:48px;margin-bottom:16px">🧘</div>
      <div class="modal-title" style="text-align:center">${name}</div>
      <div style="font-size:64px;font-family:'Outfit',sans-serif;font-weight:800;color:var(--accent);margin:24px 0" id="timer-display">${remaining}</div>
      <div class="progress-bar" style="margin-bottom:20px">
        <div class="progress-fill" id="timer-progress" style="width:100%"></div>
      </div>
      <div style="color:var(--text-secondary);font-size:14px;margin-bottom:24px">Fokus dan ikuti instruksi latihan.</div>
      <button class="btn btn-danger" id="btn-stop-timer">✕ Berhenti</button>
    </div>
  `;
  document.body.appendChild(overlay);

  interval = setInterval(() => {
    remaining--;
    const timerEl = overlay.querySelector('#timer-display');
    const progEl = overlay.querySelector('#timer-progress');
    if (timerEl) timerEl.textContent = remaining;
    if (progEl) progEl.style.width = `${(remaining / dur) * 100}%`;
    if (remaining <= 0) {
      clearInterval(interval);
      if (timerEl) timerEl.textContent = '✓';
      if (timerEl) timerEl.style.color = 'var(--success)';
      setTimeout(() => { overlay.remove(); toast('Latihan selesai! 🎉', 'success'); }, 1200);
    }
  }, 1000);

  overlay.querySelector('#btn-stop-timer').addEventListener('click', () => {
    clearInterval(interval);
    overlay.remove();
  });
}

// ─── CONTENT ──────────────────────────────────────────────────────────────────
async function loadContent() {
  showLoading('content-area');
  try {
    const articles = await fetchArticles();

    $('#content-area').innerHTML = `
      <div class="card section-gap">
        <div class="card-title">✍️ Tulis Artikel Baru</div>
        <div class="grid-2" style="gap:12px;margin-bottom:12px">
          <div class="form-group" style="margin-bottom:0">
            <label>Judul Artikel</label>
            <input id="art-title" type="text" placeholder="Judul yang menarik...">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label>Kategori</label>
            <select id="art-cat">
              <option value="Kesehatan Mata">Kesehatan Mata</option>
              <option value="Tips Produktivitas">Tips Produktivitas</option>
              <option value="Nutrisi">Nutrisi</option>
              <option value="Gaya Hidup">Gaya Hidup</option>
              <option value="Teknologi">Teknologi</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Ringkasan</label>
          <input id="art-excerpt" type="text" placeholder="Ringkasan singkat artikel...">
        </div>
        <div class="form-group">
          <label>Konten</label>
          <textarea id="art-content" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid var(--glass-border);border-radius:10px;padding:12px;color:var(--text-primary);font-size:14px;outline:none;resize:vertical;min-height:100px;font-family:'Inter',sans-serif" placeholder="Tulis konten artikel..."></textarea>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-accent" id="btn-publish-art">📤 Publish Artikel</button>
          <button class="btn btn-outline" id="btn-draft-art">💾 Simpan Draft</button>
        </div>
      </div>

      <div class="section-title">📚 Artikel (${articles.length})</div>
      <div class="articles-grid" id="articles-list">
        ${articles.length === 0
          ? '<div class="empty-state"><span class="empty-icon">📰</span><h3>Belum ada artikel</h3><p>Jadilah yang pertama menulis konten!</p></div>'
          : articles.map(a => renderArticleCard(a)).join('')
        }
      </div>
    `;

    const publishArticle = async (isPublished) => {
      const title = $('#art-title').value.trim();
      const excerpt = $('#art-excerpt').value.trim();
      const content = $('#art-content').value.trim();
      const category = $('#art-cat').value;
      if (!title) { toast('Judul wajib diisi!', 'danger'); return; }
      try {
        const t = await db.from('health_articles', appState.token);
        await t.insert({
          title,
          excerpt: excerpt || null,
          content: content || null,
          category,
          author_id: appState.user?.id,
          is_published: isPublished,
          created_at: new Date().toISOString(),
          published_at: isPublished ? new Date().toISOString() : null
        });
        toast(isPublished ? 'Artikel dipublish! 🎉' : 'Draft disimpan!', 'success');
        loadContent();
      } catch (e) { toast(e.message, 'danger'); }
    };

    $('#btn-publish-art')?.addEventListener('click', () => publishArticle(true));
    $('#btn-draft-art')?.addEventListener('click', () => publishArticle(false));

  } catch (e) {
    $('#content-area').innerHTML = `<div class="alert alert-danger">⚠️ ${e.message}</div>`;
  }
}

function renderArticleCard(a) {
  const emojis = { 'Kesehatan Mata': '👁️', 'Tips Produktivitas': '⚡', 'Nutrisi': '🥗', 'Gaya Hidup': '🌿', 'Teknologi': '💻' };
  const emoji = emojis[a.category] || '📰';
  return `
    <div class="article-card">
      <div class="article-thumb" style="background:linear-gradient(135deg,rgba(124,92,252,0.25),rgba(92,224,252,0.15))">
        <span style="font-size:48px">${emoji}</span>
      </div>
      <div class="article-body">
        <div class="article-category">${a.category || 'Umum'}</div>
        <div class="article-title">${a.title}</div>
        ${a.excerpt ? `<div class="article-excerpt">${a.excerpt}</div>` : ''}
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div class="article-meta">📅 ${formatDate(a.created_at)}</div>
          <span class="badge ${a.is_published ? 'badge-safe' : 'badge-warning'}">${a.is_published ? '✓ Published' : '📝 Draft'}</span>
        </div>
      </div>
    </div>
  `;
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
async function loadProfilePage() {
  const profile = appState.profile;
  const user = appState.user;

  $('#profile-content').innerHTML = `
    <div class="grid-2" style="gap:20px">
      <div class="card">
        <div class="card-title">👤 Informasi Profil</div>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
          <div style="width:64px;height:64px;background:linear-gradient(135deg,var(--accent),var(--accent2));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;flex-shrink:0">
            ${(profile?.name || user?.email || 'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
          </div>
          <div>
            <div style="font-size:20px;font-weight:700;font-family:'Outfit',sans-serif">${profile?.name || '—'}</div>
            <div style="color:var(--text-muted);font-size:13px">${user?.email || '—'}</div>
          </div>
        </div>
        <div class="form-group">
          <label>Nama Lengkap</label>
          <input id="p-name" type="text" value="${profile?.name || ''}" placeholder="Nama lengkap">
        </div>
        <div class="form-group">
          <label>Usia</label>
          <input id="p-age" type="number" value="${profile?.age || ''}" placeholder="Umur">
        </div>
        <div class="form-group">
          <label>Jenis Kelamin</label>
          <select id="p-gender">
            <option value="">Pilih...</option>
            <option value="Laki-laki" ${profile?.gender === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
            <option value="Perempuan" ${profile?.gender === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
          </select>
        </div>
        <div class="form-group">
          <label>Pekerjaan</label>
          <input id="p-job" type="text" value="${profile?.occupation || ''}" placeholder="Pekerjaan">
        </div>
        <div class="form-group">
          <label>Target Layar Harian (menit)</label>
          <input id="p-target" type="number" value="${profile?.daily_screen_target || 120}" placeholder="120">
        </div>
        <button class="btn btn-accent" id="btn-save-profile">💾 Simpan Perubahan</button>
      </div>

      <div>
        <div class="card section-gap">
          <div class="card-title">📊 Statistik Akun</div>
          <div id="profile-stats">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">⚠️ Zona Bahaya</div>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:14px;line-height:1.6">Hapus semua data tracking kamu. Tindakan ini tidak dapat dibatalkan.</p>
          <button class="btn btn-danger" id="btn-danger-zone">🗑️ Hapus Semua Data Tracking</button>
        </div>
      </div>
    </div>
  `;

  // Load stats
  try {
    const userId = user?.id;
    const [distLogs, compLogs, statusRows] = await Promise.all([
      fetchDistanceLogs(userId),
      fetchComplaintLogs(userId),
      fetchDailyStatus(userId)
    ]);
    const totalDist = distLogs.reduce((a, b) => a + (b.distance_meters || 0), 0);
    $('#profile-stats').innerHTML = `
      <div class="stats-grid" style="grid-template-columns:1fr 1fr;gap:12px">
        <div class="stat-card purple" style="padding:14px">
          <span class="stat-icon" style="font-size:20px">🏃</span>
          <div class="stat-value" style="font-size:22px">${(totalDist/1000).toFixed(1)}km</div>
          <div class="stat-label">Total Jarak</div>
        </div>
        <div class="stat-card cyan" style="padding:14px">
          <span class="stat-icon" style="font-size:20px">😣</span>
          <div class="stat-value" style="font-size:22px">${compLogs.length}</div>
          <div class="stat-label">Total Keluhan</div>
        </div>
        <div class="stat-card pink" style="padding:14px">
          <span class="stat-icon" style="font-size:20px">📅</span>
          <div class="stat-value" style="font-size:22px">${statusRows.length}</div>
          <div class="stat-label">Hari Aktif</div>
        </div>
        <div class="stat-card green" style="padding:14px">
          <span class="stat-icon" style="font-size:20px">📋</span>
          <div class="stat-value" style="font-size:22px">${distLogs.length}</div>
          <div class="stat-label">Total Aktivitas</div>
        </div>
      </div>
    `;
  } catch (e) {
    $('#profile-stats').innerHTML = '<div class="alert alert-warning">Gagal memuat statistik</div>';
  }

  // Save profile
  $('#btn-save-profile')?.addEventListener('click', async () => {
    const updatedProfile = {
      name: $('#p-name').value.trim(),
      age: parseInt($('#p-age').value) || null,
      gender: $('#p-gender').value || null,
      occupation: $('#p-job').value.trim() || null,
      daily_screen_target: parseInt($('#p-target').value) || 120,
    };
    try {
      const userId = user?.id;
      const t = await db.from('users', appState.token);
      await t.update(updatedProfile, { id: userId });
      appState.profile = { ...appState.profile, ...updatedProfile };
      updateSidebarUser();
      toast('Profil berhasil diperbarui! ✓', 'success');
    } catch (e) { toast(e.message, 'danger'); }
  });

  // Danger zone
  $('#btn-danger-zone')?.addEventListener('click', () => {
    if (confirm('Yakin mau hapus semua data tracking? Tindakan ini tidak bisa dibatalkan!')) {
      toast('Fitur hapus data dinonaktifkan untuk keamanan.', 'danger');
    }
  });
}

// ─── DATA FETCHERS ────────────────────────────────────────────────────────────
async function fetchDistanceLogs(userId, extra = '') {
  try {
    const t = await db.from('distance_logs', appState.token);
    return await t.select('*', `&user_id=eq.${userId}&order=created_at.desc${extra}`);
  } catch { return []; }
}

async function fetchComplaintLogs(userId) {
  try {
    const t = await db.from('complaint_logs', appState.token);
    return await t.select('*', `&user_id=eq.${userId}&order=created_at.desc`);
  } catch { return []; }
}

async function fetchDailyStatus(userId) {
  try {
    const t = await db.from('daily_status', appState.token);
    return await t.select('*', `&user_id=eq.${userId}&order=date.desc`);
  } catch { return []; }
}

async function fetchExercises() {
  try {
    const t = await db.from('eye_exercises', appState.token);
    return await t.select('*', '&order=created_at.desc');
  } catch { return []; }
}

async function fetchArticles() {
  try {
    const t = await db.from('health_articles', appState.token);
    return await t.select('*', '&order=created_at.desc');
  } catch { return []; }
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setupAuth();

  const savedToken = localStorage.getItem(KEDIPIN_TOKEN_KEY);
  const savedUser = localStorage.getItem(KEDIPIN_USER_KEY);

  if (savedToken && savedUser) {
    try {
      // Verify token still valid
      const userInfo = await authApi.getUser(savedToken);
      appState.token = savedToken;
      appState.user = userInfo;
      await initApp();
    } catch {
      // Token expired, show auth
      localStorage.removeItem(KEDIPIN_TOKEN_KEY);
      localStorage.removeItem(KEDIPIN_USER_KEY);
    }
  }
});