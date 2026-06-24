/* ====================================================
   auth.js  –  Login & Register
   ==================================================== */

let currentTab = 'login';

function switchTab(tab) {
    currentTab = tab;
    const indicator = document.getElementById('tab-indicator');
    const loginPanel    = document.getElementById('login-panel');
    const registerPanel = document.getElementById('register-panel');
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));

    if (tab === 'login') {
        document.getElementById('tab-login').classList.add('active');
        indicator.style.transform = 'translateX(0)';
        loginPanel.style.display = 'block';
        registerPanel.style.display = 'none';
    } else {
        document.getElementById('tab-register').classList.add('active');
        indicator.style.transform = 'translateX(100%)';
        loginPanel.style.display = 'none';
        registerPanel.style.display = 'block';
    }
    document.getElementById('login-err').style.display    = 'none';
    document.getElementById('register-err').style.display = 'none';
}

document.getElementById('tab-login').addEventListener('click', () => switchTab('login'));
document.getElementById('tab-register').addEventListener('click', () => switchTab('register'));

// ── LOGIN ─────────────────────────────────────────────
document.getElementById('btn-login').addEventListener('click', handleLogin);
document.getElementById('form-login-pass').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
});

async function handleLogin() {
    const email = document.getElementById('form-login-email').value.trim();
    const pass  = document.getElementById('form-login-pass').value;
    const errEl = document.getElementById('login-err');
    errEl.style.display = 'none';

    if (!email || !pass) { errEl.textContent = 'Isi email dan password.'; errEl.style.display = 'block'; return; }

    const btn = document.getElementById('btn-login');
    btn.disabled = true; btn.textContent = 'Memproses...';

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password: pass })
        });

        const json = await res.json();

        if (res.ok && json.success) {
            // Simpan token dengan key seragam
            localStorage.setItem('eyeguard_jwt_token', json.data.accessToken || json.data.token);
            if (json.data.user) {
                localStorage.setItem('eyeguard_user', JSON.stringify(json.data.user));
                if (json.data.user.role === 'SUPER_ADMIN') {
                    window.location.href = 'admin.html';
                    return;
                }
            }
            window.location.href = 'dashboard.html';
        } else {
            throw new Error(json.message || 'Email atau password salah');
        }
    } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
    } finally {
        btn.disabled = false; btn.textContent = 'Masuk';
    }
}

// ── REGISTER ──────────────────────────────────────────
document.getElementById('btn-register').addEventListener('click', handleRegister);

async function handleRegister() {
    const name    = document.getElementById('form-reg-name').value.trim();
    const email   = document.getElementById('form-reg-email').value.trim();
    const age     = document.getElementById('form-reg-age').value;
    const gender  = document.getElementById('form-reg-gender').value;
    const pass    = document.getElementById('form-reg-pass').value;
    const errEl   = document.getElementById('register-err');
    const sucEl   = document.getElementById('register-success');
    errEl.style.display = 'none'; sucEl.style.display = 'none';

    if (!name || !email || !pass) {
        errEl.textContent = 'Nama, email, dan password wajib diisi.';
        errEl.style.display = 'block'; return;
    }
    if (pass.length < 6) {
        errEl.textContent = 'Password minimal 6 karakter.';
        errEl.style.display = 'block'; return;
    }

    const btn = document.getElementById('btn-register');
    btn.disabled = true; btn.textContent = 'Mendaftar...';

    try {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: pass, age: parseInt(age) || null, gender })
        });

        const json = await res.json();

        if (res.ok && json.success) {
            // Auto-login setelah register
            if (json.data && (json.data.accessToken || json.data.token)) {
                localStorage.setItem('eyeguard_jwt_token', json.data.accessToken || json.data.token);
                if (json.data.user) localStorage.setItem('eyeguard_user', JSON.stringify(json.data.user));
                window.location.href = 'dashboard.html';
            } else {
                sucEl.textContent = '✅ Akun berhasil dibuat! Silakan masuk.';
                sucEl.style.display = 'block';
                setTimeout(() => switchTab('login'), 1500);
            }
        } else {
            throw new Error(json.message || 'Registrasi gagal.');
        }
    } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
    } finally {
        btn.disabled = false; btn.textContent = 'Buat Akun';
    }
}

// Tombol mata (Toggle Password Visibility)
function togglePass(inputId, btn) {
    const inp = document.getElementById(inputId);
    const isPass = inp.type === 'password';
    inp.type = isPass ? 'text' : 'password';
    btn.innerHTML = isPass
        ? '<i class="fa-regular fa-eye-slash"></i>'
        : '<i class="fa-regular fa-eye"></i>';
}