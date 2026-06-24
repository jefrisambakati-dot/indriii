/* ====================================================
   edukasi.js  –  Edukasi Page  v2
   Endpoints:
     GET /api/user/articles          → Article[]  (title, content, category, author, thumbnail)
     GET /api/user/exercises         → EyeExercise[] (title, description, duration, difficultyLevel, instructions)
     POST /api/user/exercises/complete/{id}
     GET /api/user/modules           → Module[]
   ==================================================== */

requireAuth();

// ── Fallback article data ─────────────────────────────
const FALLBACK_ARTICLES = [
    {
        id:1, title:'Aturan 20-20-20: Cara Paling Mudah Istirahatkan Mata',
        category:'Tips Harian', author:'Tim EyeGuard', thumbnail:'⏱️',
        content: `Mata lelah adalah keluhan paling umum di era digital. Aturan 20-20-20 adalah solusi paling sederhana yang terbukti secara ilmiah.

**Apa itu Aturan 20-20-20?**
Setiap 20 menit menatap layar, alihkan pandangan ke objek yang berjarak sekitar 20 kaki (6 meter) selama 20 detik.

**Kenapa Efektif?**
Saat melihat layar, otot siliar mata terus bekerja keras untuk menjaga fokus. Melihat ke kejauhan membuat otot ini rileks sepenuhnya, mencegah spasme dan kelelahan.

**Tips Menerapkan:**
• Pasang timer setiap 20 menit
• Gunakan fitur reminder di EyeGuard
• Sambil istirahat, berkedip 10 kali penuh
• Lakukan peregangan leher dan bahu

**Manfaat Jangka Panjang:**
Mengurangi risiko myopia progresif, mencegah sindrom mata komputer, dan meningkatkan produktivitas jangka panjang.`
    },
    {
        id:2, title:'Jarak Layar Ideal: Mengapa 50-70 cm Sangat Penting?',
        category:'Panduan Layar', author:'Tim EyeGuard', thumbnail:'📏',
        content: `Jarak antara mata dan layar adalah salah satu faktor terpenting yang sering diabaikan dalam kesehatan mata digital.

**Jarak Ideal:**
Para ahli optometri merekomendasikan jarak 50-70 cm (sekitar satu lengan penuh) antara mata dan layar komputer.

**Risiko Jarak Terlalu Dekat (< 30 cm):**
• Otot mata bekerja jauh lebih keras
• Meningkatkan risiko mata minus (myopia)
• Mempercepat kelelahan mata
• Mengurangi frekuensi kedipan

**Pengaturan Layar yang Tepat:**
• Posisi atas layar sejajar atau sedikit di bawah mata
• Layar dimiringkan 10-20 derajat
• Hindari pantulan cahaya langsung di layar
• Sesuaikan kecerahan dengan lingkungan sekitar

**Tips Posisi Tubuh:**
Duduk tegak dengan punggung bersandar, kaki menapak lantai, dan siku membentuk sudut 90 derajat.`
    },
    {
        id:3, title:'Blue Light: Mitos vs Fakta yang Perlu Kamu Tahu',
        category:'Kesehatan Mata', author:'Tim EyeGuard', thumbnail:'🔵',
        content: `Cahaya biru dari layar digital sering disalahkan sebagai penyebab utama kerusakan mata. Tapi, apa yang sebenarnya terbukti secara ilmiah?

**Fakta Blue Light:**
Cahaya biru memang dapat menembus hingga retina dan berpotensi menyebabkan kerusakan pada paparan intensitas tinggi dalam jangka sangat panjang.

**Yang Lebih Berbahaya Sebenarnya:**
Bukan blue light-nya, melainkan KURANGNYA BERKEDIP. Normalnya manusia berkedip 15-20 kali per menit, tapi saat menatap layar turun menjadi 5-7 kali per menit, menyebabkan mata kering.

**Apa yang Bisa Dilakukan:**
• Aktifkan Night Mode / Warm Light di malam hari
• Gunakan kacamata anti-blue light (manfaat terbatas, tapi membantu)
• Yang terpenting: terapkan aturan istirahat berkala
• Gunakan tetes mata buatan jika mata sering kering

**Kesimpulan:**
Blue light filter membantu, tapi bukan solusi utama. Kebiasaan istirahat dan berkedip jauh lebih penting.`
    },
    {
        id:4, title:'Nutrisi untuk Kesehatan Mata: Makan Apa Setelah Seharian di Depan Layar?',
        category:'Nutrisi', author:'Tim EyeGuard', thumbnail:'🥦',
        content: `Kesehatan mata tidak hanya ditentukan oleh kebiasaan penggunaan layar, tapi juga oleh apa yang kamu makan.

**Nutrisi Kunci untuk Mata:**

**1. Lutein & Zeaxanthin**
Ditemukan di bayam, kangkung, dan jagung. Melindungi retina dari paparan cahaya berbahaya dan menurunkan risiko degenerasi makula.

**2. Vitamin A**
Wortel, ubi jalar, dan hati ayam. Penting untuk penglihatan malam dan mencegah kebutaan malam.

**3. Omega-3**
Ikan salmon, sarden, kenari. Mengurangi risiko sindrom mata kering dan melindungi retina.

**4. Vitamin C & E**
Jeruk, stroberi, kacang almond. Antioksidan yang melindungi lensa mata dari kerusakan oksidatif.

**5. Zinc**
Daging, tiram, kacang-kacangan. Membantu transportasi Vitamin A dari hati ke retina.

**Menu Harian yang Direkomendasikan:**
Pagi: Smoothie bayam + jeruk + kenari
Siang: Ikan salmon + tumis kangkung
Malam: Wortel kukus + telur (mengandung lutein & zeaxanthin)`
    },
    {
        id:5, title:'Sindrom Mata Komputer: Kenali Gejala dan Cara Mencegahnya',
        category:'Penyakit Mata', author:'Tim EyeGuard', thumbnail:'💻',
        content: `Computer Vision Syndrome (CVS) atau Sindrom Mata Komputer adalah kondisi yang dialami jutaan pekerja dan pelajar di seluruh dunia.

**Gejala CVS:**
• Mata lelah, perih, atau terbakar
• Penglihatan kabur atau ganda
• Sakit kepala (terutama di dahi)
• Leher dan bahu kaku
• Mata kering atau berair berlebihan
• Sensitif terhadap cahaya

**Siapa yang Berisiko?**
Siapa pun yang menghabiskan lebih dari 2 jam sehari di depan layar digital. Risiko meningkat jika menggunakan kacamata yang tidak sesuai resep.

**Pencegahan:**
• Terapkan aturan 20-20-20
• Jaga jarak layar 50-70 cm
• Kurangi silau dengan tirai atau screen protector
• Periksakan mata minimal setahun sekali
• Gunakan artificial tears jika perlu

**Kapan ke Dokter?**
Jika gejala tidak membaik dalam 1 minggu setelah memperbaiki kebiasaan, segera konsultasikan dengan dokter mata.`
    },
];

const FALLBACK_EXERCISES = [
    {
        id:1, title:'Kedipan Sadar', thumbnail:'👁️', duration:120, difficultyLevel:'Mudah',
        description:'Melatih frekuensi kedipan yang benar untuk menjaga kelembapan kornea mata.',
        instructions:'Duduk nyaman, mata terbuka biasa|Kedipkan mata perlahan sebanyak 10 kali|Setiap kedipan: tutup 2 detik, buka 2 detik|Istirahat 10 detik, ulangi 5 set|Lakukan setiap 20 menit penggunaan layar'
    },
    {
        id:2, title:'Gerakan 8 Arah', thumbnail:'🎯', duration:180, difficultyLevel:'Sedang',
        description:'Melatih seluruh otot-otot ekstraokular mata dengan gerakan sistematis ke delapan penjuru arah.',
        instructions:'Duduk tegak, kepala diam tidak bergerak|Gerakkan bola mata ke ATAS, tahan 2 detik|Gerakkan ke KANAN ATAS, tahan 2 detik|Gerakkan ke KANAN, tahan 2 detik|Teruskan searah jarum jam ke semua arah|Ulangi berlawanan jarum jam|Lakukan 3 putaran penuh'
    },
    {
        id:3, title:'Fokus Dekat-Jauh', thumbnail:'🔭', duration:120, difficultyLevel:'Mudah',
        description:'Melatih kemampuan akomodasi lensa mata dengan mengalihkan fokus secara bergantian.',
        instructions:'Pegang jari telunjuk 25 cm dari wajah|Fokus pada ujung jari selama 5 detik|Alihkan fokus ke objek jauh (6+ meter) selama 5 detik|Kembali ke jari, ulangi 10 kali|Jaga kepala tetap diam sepanjang latihan'
    },
    {
        id:4, title:'Pijat Periokular', thumbnail:'🤲', duration:90, difficultyLevel:'Mudah',
        description:'Pijat ringan area di sekitar mata untuk melancarkan sirkulasi dan meredakan ketegangan.',
        instructions:'Cuci tangan bersih terlebih dahulu|Tutup kedua mata|Letakkan jari tengah di sudut dalam kedua mata|Pijat perlahan ke arah pelipis dengan tekanan ringan|Buat lingkaran kecil di area tulang pipi bawah mata|Pijat alis dari pangkal ke ujung|Ulangi 8 kali gerakan setiap area'
    },
    {
        id:5, title:'Palming Relaksasi', thumbnail:'🌿', duration:300, difficultyLevel:'Mudah',
        description:'Teknik relaksasi mata total menggunakan kehangatan telapak tangan untuk menenangkan saraf optik.',
        instructions:'Gosok kedua telapak tangan dengan cepat hingga terasa hangat|Tutup kedua mata dengan lembut|Cekungkan telapak tangan menutupi mata tanpa menekan bola mata|Rasakan kehangatan yang menyebar ke area mata|Tarik napas dalam-dalam, hembuskan perlahan|Bayangkan warna hitam pekat yang sempurna|Pertahankan selama 5 menit penuh'
    },
    {
        id:6, title:'Rotasi Mata Penuh', thumbnail:'🌀', duration:150, difficultyLevel:'Sedang',
        description:'Rotasi 360 derajat bola mata untuk meregangkan semua serat otot ekstraokular secara menyeluruh.',
        instructions:'Duduk tegak dengan punggung lurus|Kepala diam, hanya bola mata yang bergerak|Gerakkan bola mata membuat lingkaran besar perlahan|Putar searah jarum jam sebanyak 5 kali (10 detik/putaran)|Pejamkan mata, istirahat 5 detik|Putar berlawanan jarum jam 5 kali|Istirahat, ulangi 3 set total'
    },
];

// ── State ─────────────────────────────────────────────
let exerciseTimer = null;
let currentExercise = null;
let currentTab = 'all';
let allArticles  = [];
let allExercises = [];
let allModules   = [];

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initEdukasi);

async function initEdukasi() {
    await Promise.all([loadArticles(), loadExercises(), loadModules()]);
}

// ── Loaders ───────────────────────────────────────────
async function loadArticles() {
    try {
        const res = await apiFetch('/api/user/articles');
        if (res && res.ok) {
            const json = await res.json();
            allArticles = (json.data && json.data.length > 0) ? json.data : FALLBACK_ARTICLES;
        } else {
            allArticles = FALLBACK_ARTICLES;
        }
    } catch(e) {
        allArticles = FALLBACK_ARTICLES;
    }
    renderArticles(allArticles);
}

async function loadExercises() {
    try {
        const res = await apiFetch('/api/user/exercises');
        if (res && res.ok) {
            const json = await res.json();
            allExercises = (json.data && json.data.length > 0) ? json.data : FALLBACK_EXERCISES;
        } else {
            allExercises = FALLBACK_EXERCISES;
        }
    } catch(e) {
        allExercises = FALLBACK_EXERCISES;
    }
    renderExercises(allExercises);
}

async function loadModules() {
    try {
        const res = await apiFetch('/api/user/modules');
        if (res && res.ok) {
            const json = await res.json();
            allModules = json.data || [];
        }
    } catch(e) {
        allModules = [];
    }
    renderModules(allModules);
}

// ── Renderers ─────────────────────────────────────────
function renderArticles(articles) {
    const el = document.getElementById('article-list');
    if (!articles || articles.length === 0) {
        el.innerHTML = `<div class="empty-state"><span class="empty-icon">📰</span>Tidak ada artikel tersedia.</div>`;
        return;
    }
    el.innerHTML = articles.map((a, i) => `
        <div class="article-card" data-type="artikel" data-title="${a.title}" onclick="openArticle(${i})">
            <div class="article-thumb">${a.thumbnail || '📄'}</div>
            <div class="article-info">
                <p class="article-cat">${a.category || 'Artikel'}</p>
                <p class="article-title">${a.title}</p>
                <p class="article-meta">✍️ ${a.author || 'Tim EyeGuard'}</p>
            </div>
        </div>`).join('');
}

function renderExercises(exercises) {
    const el = document.getElementById('exercise-grid');
    el.innerHTML = exercises.map((ex, i) => {
        const mnt = Math.floor(ex.duration / 60);
        const det = ex.duration % 60;
        const durStr = mnt > 0 ? `${mnt}m ${det > 0 ? det+'d' : ''}` : `${det}d`;
        const diff = (ex.difficultyLevel || 'Mudah').toLowerCase();
        return `
        <div class="ex-card" data-type="latihan" data-title="${ex.title}" onclick="openExercise(${i})">
            <div class="ex-icon">${ex.thumbnail || '👁️'}</div>
            <p class="ex-name">${ex.title}</p>
            <p class="ex-dur"><i class="fa-regular fa-clock"></i> ${durStr}</p>
            <span class="ex-diff ${diff}">${ex.difficultyLevel || 'Mudah'}</span>
        </div>`;
    }).join('');
}

function renderModules(modules) {
    const el = document.getElementById('module-list');
    if (!modules || modules.length === 0) {
        el.innerHTML = `<div class="empty-state"><span class="empty-icon">📚</span>Belum ada modul PDF tersedia.<br>Hubungi admin untuk menambahkan modul.</div>`;
        return;
    }
    el.innerHTML = modules.map(m => `
        <div class="module-card">
            <div class="module-icon">📄</div>
            <div class="module-info">
                <p class="module-title">${m.title}</p>
                <p class="module-cat">${m.category || 'Modul'} ${m.description ? '• ' + m.description.substring(0, 50) : ''}</p>
            </div>
            <button class="module-dl-btn" onclick="downloadModule(${m.id})">
                <i class="fa-solid fa-download"></i> Unduh
            </button>
        </div>`).join('');
}

// ── Article Modal ─────────────────────────────────────
function openArticle(idx) {
    const a = allArticles[idx];
    if (!a) return;
    document.getElementById('modal-article-title').textContent = a.title;
    document.getElementById('modal-article-meta').textContent  =
        `${a.category || ''} • ✍️ ${a.author || 'Tim EyeGuard'}`;
    // Format: support bold **text**, bullet •, and line breaks
    const html = (a.content || '')
        .split('\n')
        .map(line => {
            if (!line.trim()) return '<br>';
            const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            return `<p>${formatted}</p>`;
        }).join('');
    document.getElementById('modal-article-body').innerHTML = html;
    openModal('modal-article');
}

// ── Exercise Modal ────────────────────────────────────
function openExercise(idx) {
    const ex = allExercises[idx];
    if (!ex) return;
    currentExercise = ex;
    if (exerciseTimer) clearInterval(exerciseTimer);

    // Reset timer UI
    document.getElementById('ex-timer').style.display = 'none';
    document.getElementById('timer-ring-fill').style.strokeDashoffset = 0;
    document.getElementById('ex-start-btn').innerHTML = '<i class="fa-solid fa-play"></i> Mulai Latihan';
    document.getElementById('ex-start-btn').disabled = false;
    document.getElementById('timer-count').textContent = ex.duration;

    // Fill modal
    document.getElementById('ex-title').textContent = ex.title;
    const diff = ex.difficultyLevel || 'Mudah';
    const diffEl = document.getElementById('ex-difficulty');
    diffEl.textContent = diff;
    diffEl.className = `ex-difficulty ${diff.toLowerCase()}`;
    document.getElementById('ex-description').textContent = ex.description || '';

    const steps = (ex.instructions || '').split('|').filter(s => s.trim());
    document.getElementById('ex-steps').innerHTML = steps.map((s, i) => `
        <div class="ex-step">
            <div class="ex-step-num">${i+1}</div>
            <p class="ex-step-txt">${s.trim()}</p>
        </div>`).join('');

    openModal('modal-exercise');
}

// ── Exercise Timer ────────────────────────────────────
function startExercise() {
    if (!currentExercise) return;
    const total = currentExercise.duration;
    let remaining = total;
    const timerEl  = document.getElementById('ex-timer');
    const countEl  = document.getElementById('timer-count');
    const ringEl   = document.getElementById('timer-ring-fill');
    const startBtn = document.getElementById('ex-start-btn');
    const circumf  = 226; // 2π*36

    timerEl.style.display = 'block';
    startBtn.disabled = true;
    startBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sedang berjalan...';
    countEl.textContent = remaining;

    exerciseTimer = setInterval(async () => {
        remaining--;
        countEl.textContent = remaining;
        const progress = (remaining / total);
        ringEl.style.strokeDashoffset = circumf * (1 - progress);

        if (remaining <= 0) {
            clearInterval(exerciseTimer);
            countEl.textContent = '✓';
            startBtn.disabled = false;
            startBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Ulangi Latihan';
            ringEl.style.stroke = '#f59e0b';
            addNotification('Latihan Mata Selesai', `Anda menyelesaikan latihan mata '${currentExercise.title}'!`, 'success');
            // Log completion to backend (best effort)
            try {
                await apiFetch(`/api/user/exercises/complete/${currentExercise.id}`, { method:'POST' });
            } catch(e) { /* silent fail */ }
        }
    }, 1000);
}

// ── Module Download ───────────────────────────────────
async function downloadModule(id) {
    const mod = allModules.find(m => m.id === id);
    const filename = (mod ? mod.title.replace(/[^a-zA-Z0-9\s]/g, '') : 'modul') + '.pdf';

    try {
        const token = getToken();
        const res = await fetch(`/api/user/modules/download/${id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Gagal mengunduh file.');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
        addNotification('Unduhan Dimulai', `Modul "${mod ? mod.title : 'PDF'}" sedang diunduh.`, 'success');
    } catch (e) {
        alert('Gagal mengunduh: ' + e.message);
    }
}

// ── Tab Filter ────────────────────────────────────────
function setTab(tab, btn) {
    currentTab = tab;
    document.querySelectorAll('.edu-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const sa = document.getElementById('section-artikel');
    const sl = document.getElementById('section-latihan');
    const sm = document.getElementById('section-modul');
    sa.style.display = (tab === 'all' || tab === 'artikel')  ? '' : 'none';
    sl.style.display = (tab === 'all' || tab === 'latihan')  ? '' : 'none';
    sm.style.display = (tab === 'all' || tab === 'modul')    ? '' : 'none';
    filterContent(); // re-apply search
}

// ── Search Filter ─────────────────────────────────────
function filterContent() {
    const q = document.getElementById('search-input').value.toLowerCase().trim();
    document.querySelectorAll('.article-card, .ex-card, .module-card').forEach(el => {
        const title = (el.dataset.title || el.querySelector('.article-title, .ex-name, .module-title')?.textContent || '').toLowerCase();
        el.style.display = (!q || title.includes(q)) ? '' : 'none';
    });
}
