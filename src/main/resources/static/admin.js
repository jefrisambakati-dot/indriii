/* ====================================================
   admin.js  –  Kedipin Admin Panel Logic
   ==================================================== */

// Ensure user is authenticated and is admin
const token = requireAuth();
const user = getUser();

if (!user || user.role !== 'SUPER_ADMIN') {
    logout();
}

let allArticles = [];
let allModules = [];
let currentAdminTab = 'articles';

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadArticles();
    loadModules();
});

// Tab switcher
function switchAdminTab(tab) {
    currentAdminTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
    
    if (tab === 'articles') {
        document.getElementById('tab-art').classList.add('active');
        document.getElementById('sec-articles').style.display = 'block';
    } else {
        document.getElementById('tab-mod').classList.add('active');
        document.getElementById('sec-modules').style.display = 'block';
    }
}

// Load stats from API
async function loadStats() {
    try {
        const res = await apiFetch('/api/admin/stats');
        if (res && res.ok) {
            const json = await res.json();
            const data = json.data;
            setText('stat-users', data.totalUsers ?? 0);
            setText('stat-articles', data.totalArticles ?? 0);
            setText('stat-modules', data.totalExercises ?? 0); // fallback or mapping
        }
    } catch (e) {
        console.warn('Failed to load stats:', e);
    }
}

// ── Manage Articles ──
async function loadArticles() {
    try {
        // Fetch all articles (including unpublished ones)
        const res = await apiFetch('/api/articles');
        if (res && res.ok) {
            const json = await res.json();
            allArticles = json.data || [];
            renderArticlesTable(allArticles);
            setText('stat-articles', allArticles.length);
        }
    } catch(e) {
        console.error('Failed to load articles:', e);
    }
}

function renderArticlesTable(articles) {
    const tbody = document.getElementById('articles-table-body');
    if (!tbody) return;
    if (articles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-light)">Tidak ada artikel ditemukan.</td></tr>`;
        return;
    }

    tbody.innerHTML = articles.map(art => {
        const statusBadge = art.isPublished 
            ? '<span class="badge badge-safe">✓ Published</span>' 
            : '<span class="badge badge-warning">📝 Draft</span>';
        
        return `
        <tr>
            <td><strong>${art.title}</strong></td>
            <td><span class="badge badge-purple">${art.category || 'Umum'}</span></td>
            <td>${art.author || 'Tim EyeGuard'}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon edit" onclick="openArticleModal(${art.id})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon delete" onclick="deleteArticle(${art.id})" title="Hapus"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function filterArticles() {
    const q = document.getElementById('search-article').value.toLowerCase().trim();
    const filtered = allArticles.filter(art => art.title.toLowerCase().includes(q));
    renderArticlesTable(filtered);
}

// Open Article Modal for New / Edit
function openArticleModal(id) {
    hideEl('art-err');
    document.getElementById('inp-art-title').value = '';
    document.getElementById('inp-art-cat').value = 'Tips Harian';
    document.getElementById('inp-art-author').value = 'Tim EyeGuard';
    document.getElementById('inp-art-thumb').value = '📄';
    document.getElementById('inp-art-content').value = '';
    document.getElementById('inp-art-publish').checked = true;
    document.getElementById('art-id').value = '';
    
    if (id) {
        // Edit Mode
        document.getElementById('art-modal-title').textContent = 'Edit Artikel';
        const art = allArticles.find(a => a.id === id);
        if (art) {
            document.getElementById('art-id').value = art.id;
            document.getElementById('inp-art-title').value = art.title || '';
            document.getElementById('inp-art-cat').value = art.category || 'Tips Harian';
            document.getElementById('inp-art-author').value = art.author || 'Tim EyeGuard';
            document.getElementById('inp-art-thumb').value = art.thumbnail || '📄';
            document.getElementById('inp-art-content').value = art.content || '';
            document.getElementById('inp-art-publish').checked = art.isPublished || false;
        }
    } else {
        // Create Mode
        document.getElementById('art-modal-title').textContent = 'Tulis Artikel Baru';
    }
    openModal('modal-art-edit');
}

function closeArtModal() {
    closeModal('modal-art-edit');
}

// Save Article
async function saveArticle() {
    const id = document.getElementById('art-id').value;
    const title = document.getElementById('inp-art-title').value.trim();
    const category = document.getElementById('inp-art-cat').value;
    const author = document.getElementById('inp-art-author').value.trim();
    const thumbnail = document.getElementById('inp-art-thumb').value.trim();
    const content = document.getElementById('inp-art-content').value.trim();
    const isPublished = document.getElementById('inp-art-publish').checked;

    if (!title || !content) {
        showErr('art-err', 'Judul dan Konten wajib diisi.');
        return;
    }

    const payload = { title, category, author, thumbnail, content, isPublished };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/admin/articles/${id}` : '/api/admin/articles';

    const btn = document.getElementById('btn-art-save');
    btn.disabled = true; btn.textContent = 'Menyimpan...';

    try {
        const res = await apiFetch(url, {
            method,
            body: JSON.stringify(payload)
        });

        if (res && res.ok) {
            closeArtModal();
            loadArticles();
            showToast('✓ Artikel berhasil disimpan!', 'success');
        } else {
            showErr('art-err', 'Gagal menyimpan artikel. Periksa isian Anda.');
        }
    } catch(e) {
        showErr('art-err', e.message);
    } finally {
        btn.disabled = false; btn.textContent = 'Simpan Artikel';
    }
}

// Delete Article
async function deleteArticle(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus artikel ini?')) return;
    try {
        const res = await apiFetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
        if (res && res.ok) {
            loadArticles();
            showToast('✓ Artikel berhasil dihapus', 'success');
        } else {
            showToast('Gagal menghapus artikel.', 'danger');
        }
    } catch(e) {
        showToast('Error: ' + e.message, 'danger');
    }
}

// ── Manage Modules ──
async function loadModules() {
    try {
        const res = await apiFetch('/api/user/modules');
        if (res && res.ok) {
            const json = await res.json();
            allModules = json.data || [];
            renderModulesTable(allModules);
            setText('stat-modules', allModules.length);
        }
    } catch(e) {
        console.error('Failed to load modules:', e);
    }
}

function renderModulesTable(modules) {
    const tbody = document.getElementById('modules-table-body');
    if (!tbody) return;
    if (modules.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;color:var(--text-light)">Tidak ada modul PDF ditemukan.</td></tr>`;
        return;
    }

    tbody.innerHTML = modules.map(m => `
    <tr>
        <td><strong>${m.title}</strong></td>
        <td><span class="badge badge-safe">${m.category || 'PDF'}</span></td>
        <td>${m.description || 'Tidak ada deskripsi.'}</td>
        <td>
            <div class="action-btns">
                <button class="btn-icon edit" onclick="downloadModuleAdmin(${m.id}, '${(m.title||'modul').replace(/'/g,'')}')"
                    title="Download"><i class="fa-solid fa-download"></i></button>
                <button class="btn-icon delete" onclick="deleteModule(${m.id})" title="Hapus"><i class="fa-solid fa-trash"></i></button>
            </div>
        </td>
    </tr>`).join('');
}

function openModuleModal() {
    hideEl('mod-err');
    document.getElementById('inp-mod-title').value = '';
    document.getElementById('inp-mod-cat').value = 'E-Book';
    document.getElementById('inp-mod-desc').value = '';
    document.getElementById('inp-mod-file').value = '';
    openModal('modal-mod-upload');
}

function closeModModal() {
    closeModal('modal-mod-upload');
}

// Upload Module File
async function uploadModuleFile() {
    const title = document.getElementById('inp-mod-title').value.trim();
    const category = document.getElementById('inp-mod-cat').value.trim();
    const description = document.getElementById('inp-mod-desc').value.trim();
    const fileInput = document.getElementById('inp-mod-file');
    
    if (!title || fileInput.files.length === 0) {
        showErr('mod-err', 'Judul dan Berkas PDF wajib dipilih.');
        return;
    }

    const file = fileInput.files[0];
    if (file.type !== 'application/pdf') {
        showErr('mod-err', 'Berkas harus dalam format PDF.');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('file', file);

    const btn = document.getElementById('btn-mod-save');
    btn.disabled = true; btn.textContent = 'Mengunggah...';

    try {
        const token = getToken();
        // Multipart upload custom fetch
        const res = await fetch('/api/admin/modules/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (res.ok) {
            closeModModal();
            loadModules();
            showToast('✓ Modul PDF berhasil diunggah!', 'success');
        } else {
            const errJson = await res.json().catch(() => ({}));
            showErr('mod-err', errJson.message || 'Gagal mengunggah modul.');
        }
    } catch(e) {
        showErr('mod-err', e.message);
    } finally {
        btn.disabled = false; btn.textContent = 'Unggah Sekarang';
    }
}

// Helper to show toasts in admin
function showToast(msg, type = 'success') {
    let toast = document.getElementById('toast-notif');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notif';
        toast.style.cssText = `
            position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
            padding:12px 24px; border-radius:24px; font-size:.85rem; font-weight:600;
            z-index:9999; transition:opacity .3s; text-align:center;
            box-shadow:0 4px 16px rgba(0,0,0,.15);
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#178d72' : '#ef4444';
    toast.style.color = '#fff';
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// Force-download PDF module (admin)
async function downloadModuleAdmin(id, title) {
    const filename = (title || 'modul').replace(/[^a-zA-Z0-9\s]/g, '') + '.pdf';
    try {
        const token = getToken();
        const res = await fetch(`/api/user/modules/download/${id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('File tidak ditemukan.');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
        showToast('✓ Unduhan dimulai: ' + title, 'success');
    } catch(e) {
        showToast('Gagal mengunduh: ' + e.message, 'danger');
    }
}

// Delete module (admin)
async function deleteModule(id) {
    if (!confirm('Hapus modul PDF ini?')) return;
    try {
        const res = await apiFetch(`/api/admin/modules/${id}`, { method: 'DELETE' });
        if (res && res.ok) {
            loadModules();
            showToast('✓ Modul berhasil dihapus', 'success');
        } else {
            showToast('Gagal menghapus modul.', 'danger');
        }
    } catch(e) {
        showToast('Error: ' + e.message, 'danger');
    }
}
