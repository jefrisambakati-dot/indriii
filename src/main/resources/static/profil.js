/* ====================================================
   profil.js  –  Profile Page  v2
   Endpoints:
     GET  /api/user/profile          → User entity
     POST /api/user/profile/update   → {name, age, gender, occupation, dailyScreenTarget}
   ==================================================== */

requireAuth();

document.addEventListener('DOMContentLoaded', loadProfile);

async function loadProfile() {
    try {
        const res = await apiFetch('/api/user/profile');
        if (res && res.ok) {
            const json = await res.json();
            renderProfile(json.data);
        } else {
            throw new Error('API failed');
        }
    } catch(e) {
        // Fallback: try localStorage user cache
        const cached = getUser();
        if (cached && cached.name) {
            renderProfile(cached);
        } else {
            renderProfile(DUMMY_PROFILE);
        }
    }
}

function renderProfile(user) {
    // Cache to localStorage for other pages
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    // Avatar: first letter of name
    const initial = (user.name || 'U').charAt(0).toUpperCase();
    setText('profile-avatar', initial);
    setText('profile-name', user.name || '--');
    setText('profile-email', user.email || '--');
    setText('profile-role', user.role || 'USER');

    // Stats strip
    setText('ps-age', user.age || '--');
    setText('ps-gender', user.gender ? user.gender.charAt(0) : '--'); // short
    setText('ps-target', user.dailyScreenTarget || 240);

    // Account info
    setText('info-email', user.email || '--');
    setText('info-occ', user.occupation || 'Belum diisi');
    setText('info-joined', user.createdAt ? fmtDateShort(user.createdAt) : '--');
    setText('info-status', user.isActive ? 'Aktif ✓' : 'Tidak Aktif');

    // Pre-fill edit form
    setVal('edit-name', user.name || '');
    setVal('edit-age', user.age || '');
    setVal('edit-gender', user.gender || '');
    setVal('edit-occupation', user.occupation || '');
    setVal('edit-target', user.dailyScreenTarget || 240);
}

async function saveProfile() {
    const name       = document.getElementById('edit-name').value.trim();
    const age        = parseInt(document.getElementById('edit-age').value) || null;
    const gender     = document.getElementById('edit-gender').value;
    const occupation = document.getElementById('edit-occupation').value.trim();
    const target     = parseInt(document.getElementById('edit-target').value) || 240;

    if (!name) {
        showErr('profile-err', 'Nama tidak boleh kosong.');
        return;
    }
    hideEl('profile-err');
    hideEl('profile-success');

    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const res = await apiFetch('/api/user/profile/update', {
            method: 'POST',
            body: JSON.stringify({ name, age, gender, occupation, dailyScreenTarget: target })
        });

        if (res && res.ok) {
            // Update cached user
            const cached = getUser();
            const updated = { ...cached, name, age, gender, occupation, dailyScreenTarget: target };
            localStorage.setItem(USER_KEY, JSON.stringify(updated));
            renderProfile(updated);
            showSuccess('profile-success', '✅ Profil berhasil disimpan!');
        } else {
            const json = res ? await res.json() : {};
            showErr('profile-err', json.message || 'Gagal menyimpan profil. Coba lagi.');
        }
    } catch(e) {
        showErr('profile-err', 'Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan';
    }
}
