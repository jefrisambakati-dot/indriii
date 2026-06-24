# Kedipin – Project Overview (AI Reference Document)

> Dokumen ini menjelaskan seluruh arsitektur, struktur file, API, database, dan logika bisnis proyek **Kedipin** secara lengkap dan ringkas. Bacalah seluruh dokumen ini sebelum mengerjakan tugas apapun terkait project ini.

---

## 1. Ringkasan Proyek

**Kedipin** adalah aplikasi web kesehatan mata digital. Fungsinya:
- Monitoring jarak mata ke layar secara real-time menggunakan kamera (MediaPipe FaceMesh)
- Tracking screen time harian + pengingat istirahat mata
- Pencatatan keluhan mata (mata lelah, kering, sakit kepala, dll)
- Edukasi: artikel kesehatan mata + latihan mata + modul PDF
- Dashboard statistik per user
- Panel Admin untuk kelola artikel & upload modul PDF

---

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Spring Boot 3.3.2, Java 21 |
| ORM | Spring Data JPA + Hibernate |
| Database | PostgreSQL (Supabase cloud) |
| Auth | JWT (jjwt library), Spring Security |
| Build | Apache Maven 3.9.16 (bundled di folder project) |
| Frontend | Vanilla HTML + CSS + JavaScript (tidak ada framework) |
| File Upload | Spring Multipart → disimpan di folder `uploads/modules/` |

---

## 3. Cara Menjalankan

```powershell
# Di folder: C:\Users\WAKATOBI SOEA1\Desktop\indri

# Dev profile (kredensial hardcoded, paling mudah):
java -jar target\kedipin-1.0.0.jar --spring.profiles.active=dev

# Prod profile (butuh env vars: JWT_SECRET, DATABASE_URL, dll):
java -jar target\kedipin-1.0.0.jar --spring.profiles.active=prod

# Rebuild setelah ada perubahan Java:
.\apache-maven-3.9.16\bin\mvn.cmd clean package -DskipTests -q

# Akses aplikasi:
http://localhost:8080
```

> **PENTING:** Perubahan file frontend (`.js`, `.html`, `.css`) di `src/main/resources/static/` TIDAK perlu rebuild. Hanya perubahan Java yang memerlukan rebuild JAR.

---

## 4. Konfigurasi (`application.yml`)

```yaml
# Dev profile — semua hardcoded, langsung jalan:
datasource:
  url: jdbc:postgresql://aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
  username: postgres.inicyqhzbdwlfuztvknm
  password: jefri1234444445
jwt:
  secret: IniAdalahKunciRahasiaJWTDevelopmentYangSangatPanjangDanAman123!
  expiration-ms: 3600000   # 1 jam
app:
  upload:
    dir: uploads            # folder di root project, relatif dari CWD
```

---

## 5. Struktur Folder

```
indri/
├── src/main/java/com/kedipin/
│   ├── MainApplication.java
│   ├── config/
│   │   └── AdminSeeder.java          ← Seed admin account saat startup
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── AdminController.java
│   │   ├── ArticleController.java
│   │   ├── TrackingController.java
│   │   ├── DashboardController.java
│   │   ├── ExerciseController.java
│   │   ├── ModuleController.java
│   │   └── UserController.java
│   ├── dto/                          ← Request/Response DTOs
│   ├── entity/                       ← JPA Entity classes (9 tabel)
│   ├── repository/                   ← Spring Data JPA repositories
│   ├── security/
│   │   ├── SecurityConfig.java       ← Spring Security + CORS
│   │   ├── JwtTokenProvider.java     ← Generate & validate JWT
│   │   ├── JwtAuthenticationFilter.java
│   │   ├── CustomUserDetails.java
│   │   └── CustomUserDetailsService.java
│   └── service/
│       ├── impl/
│       │   ├── AuthServiceImpl.java
│       │   ├── ArticleServiceImpl.java
│       │   ├── ModuleServiceImpl.java
│       │   ├── TrackingServiceImpl.java
│       │   ├── ExerciseServiceImpl.java
│       │   └── UserServiceImpl.java
│       └── [interface files]
├── src/main/resources/
│   ├── application.yml
│   └── static/                       ← Frontend files (semua Vanilla JS)
│       ├── index.html / index.css    ← Login & Register page
│       ├── auth.js                   ← Logic login/register
│       ├── dashboard.html/js/css     ← Dashboard utama user
│       ├── tracking.html/js/css      ← Real-time eye tracking
│       ├── edukasi.html/js/css       ← Artikel + Latihan + Modul PDF
│       ├── statistik.html/js/css     ← Statistik & grafik
│       ├── history.html/js/css       ← Riwayat tracking & keluhan
│       ├── profil.html/js/css        ← Profil user
│       ├── admin.html/js/css         ← Admin panel
│       ├── shared.js                 ← Utility functions (WAJIB dibaca)
│       └── shared.css                ← Global CSS variables & components
├── uploads/
│   └── modules/                      ← PDF yang diupload admin disimpan di sini
└── target/
    └── kedipin-1.0.0.jar             ← Executable JAR
```

---

## 6. Database — 9 Tabel di Supabase PostgreSQL

### `users`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | Auto increment |
| name | VARCHAR | Username (unique) |
| email | VARCHAR | Email (unique) |
| password | VARCHAR | BCrypt encoded |
| role | VARCHAR(50) | Selalu `"USER"` untuk user biasa |
| age | INTEGER | Usia |
| gender | VARCHAR(50) | Jenis kelamin |
| occupation | VARCHAR | Pekerjaan |
| profile_picture | VARCHAR | Path/URL foto |
| daily_screen_target | INTEGER | Target screen time (menit), default 240 |
| is_active | BOOLEAN | Default true |
| created_at, updated_at | TIMESTAMP | Auto managed |

### `admin` (tabel terpisah dari users)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| username | VARCHAR | `admin` |
| email | VARCHAR | `admin@kedipin.com` |
| password | VARCHAR | BCrypt dari `KedipinSafeAdmin2026!` |

### `tracking_logs`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| user_id | FK → users | |
| distance_cm | DOUBLE | Jarak mata ke layar dalam **cm** |
| status | VARCHAR(50) | `"SAFE"` (≥30cm) atau `"WARNING"` (<30cm) |
| detected_at | TIMESTAMP | Auto set |

### `daily_status`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| user_id | FK → users | |
| status_date | DATE | Unique per user per hari |
| total_screen_time | INTEGER | Total menit screen time hari itu |
| total_breaks | INTEGER | Jumlah istirahat |
| avg_distance | DOUBLE | Rata-rata jarak cm |
| eye_health_score | INTEGER | Skor 0–100 |
| mood | VARCHAR | `Sangat Baik/Baik/Biasa/Lelah/Sangat Lelah` |
| notes | TEXT | Catatan hari itu |

### `complaints` (keluhan mata)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| user_id | FK → users | |
| complaint_type | VARCHAR | Jenis keluhan |
| severity | INTEGER | 1–5 (1=ringan, 5=berat) |
| notes | TEXT | Catatan tambahan |
| created_at | TIMESTAMP | |

### `articles`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| title | VARCHAR | Judul artikel |
| content | TEXT | Isi artikel (bold dengan `**text**`, newline biasa) |
| category | VARCHAR | `Tips Harian/Panduan Layar/Kesehatan Mata/Nutrisi/Penyakit Mata` |
| author | VARCHAR | Default `Tim EyeGuard` |
| thumbnail | VARCHAR | Emoji atau URL gambar |
| is_published | BOOLEAN | Default true |
| created_at | TIMESTAMP | |

### `eye_exercises`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| title | VARCHAR | Nama latihan |
| description | TEXT | Deskripsi singkat |
| duration | INTEGER | Durasi dalam **detik** |
| difficulty_level | VARCHAR | `Mudah/Sedang/Sulit` |
| instructions | TEXT | Langkah-langkah dipisah karakter `\|` (pipe) |
| thumbnail | VARCHAR | Emoji |

### `exercise_logs`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| user_id | FK → users | |
| exercise_id | FK → eye_exercises | |
| completed_at | TIMESTAMP | Kapan selesai latihan |

### `modules` (modul PDF)
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | BIGINT PK | |
| title | VARCHAR | Judul modul |
| description | TEXT | Deskripsi |
| category | VARCHAR | Kategori (E-Book, dll) |
| file_path | VARCHAR | Path **absolut** ke file PDF di server |
| created_at | TIMESTAMP | |

---

## 7. Seluruh API Endpoint

### Auth (Public — tidak butuh token)
```
POST /api/auth/signup    Body: { name, email, password, age, gender }
POST /api/auth/login     Body: { username (email atau name), password }
                         Response: { success, data: { accessToken, user: { id, email, name, role } } }
```

### Articles (Publik, tanpa auth)
```
GET  /api/public/articles       Artikel published saja
GET  /api/articles              Semua artikel (published + draft)
GET  /api/articles/{id}         Detail artikel by ID
```

### User Endpoints (Bearer token, role: USER atau SUPER_ADMIN)
```
GET  /api/user/articles                     Artikel published
GET  /api/user/exercises                    Semua latihan mata
POST /api/user/exercises/complete/{id}      Log penyelesaian latihan
GET  /api/user/modules                      Daftar modul PDF
GET  /api/user/modules/download/{id}        Download PDF (Content-Disposition: attachment)

GET  /api/user/tracking/distance            Riwayat log jarak milik user
POST /api/user/tracking/distance            Simpan log jarak
     Body: { userId?, distanceCm, status }

GET  /api/user/tracking/complaint           Riwayat keluhan mata
POST /api/user/tracking/complaint           Simpan keluhan
     Body: { userId?, complaintType, severity, notes }

GET  /api/user/tracking/daily               Riwayat daily status
POST /api/user/tracking/daily               Update/simpan daily status
     Body: { userId?, totalScreenTime, totalBreaks, avgDistance, eyeHealthScore, mood, notes }

GET  /api/user/dashboard                    Summary dashboard user
GET  /api/user/profile                      Profil user
PUT  /api/user/profile                      Update profil
     Body: { name, age, gender, occupation, dailyScreenTarget }
```

### Admin Endpoints (Bearer token, role: SUPER_ADMIN saja)
```
GET    /api/admin/stats                Statistik: { totalUsers, totalArticles, totalExercises }
GET    /api/admin/users                Semua data users
GET    /api/admin/complaints           Semua keluhan semua user
GET    /api/admin/tracking-history     Top 100 log tracking

POST   /api/admin/articles             Buat artikel
       Body: { title, category, author, thumbnail, content, isPublished }
PUT    /api/admin/articles/{id}        Edit artikel
DELETE /api/admin/articles/{id}        Hapus artikel

POST   /api/admin/modules/upload       Upload PDF (multipart/form-data)
       Form fields: title, category, description, file (PDF)
DELETE /api/admin/modules/{id}         Hapus modul + file fisik dari disk
```

---

## 8. Sistem Autentikasi & Keamanan

### JWT Flow
1. User login → `AuthController` → token JWT dibuat → disimpan di browser `localStorage` key: `eyeguard_jwt_token`
2. Data user disimpan di `localStorage` key: `eyeguard_user` (JSON: `{ id, email, name, role }`)
3. Setiap request API → header `Authorization: Bearer <token>`
4. `JwtAuthenticationFilter` parse token → set ke `SecurityContext`

### Role System
- **`USER`** → user biasa, akses `/api/user/**`
- **`SUPER_ADMIN`** → admin, akses `/api/admin/**` DAN `/api/user/**`

Di Spring Security, role disimpan sebagai authority `ROLE_USER` dan `ROLE_SUPER_ADMIN`.

### SecurityConfig Rules
```java
/api/auth/**          → permitAll
/api/public/**        → permitAll
/*.js, /*.css, /*.html → permitAll
/api/admin/**         → hasRole("SUPER_ADMIN")
/api/user/**          → hasAnyRole("USER", "SUPER_ADMIN")
anyRequest            → permitAll
```

### Admin Account (Seed Otomatis)
```
Email    : admin@kedipin.com
Password : KedipinSafeAdmin2026!
Role JWT : SUPER_ADMIN
```
`AdminSeeder.java` membuat akun ini saat startup jika belum ada di tabel `admin`.

---

## 9. Frontend — Halaman & Fungsinya

### `shared.js` — UTILITY GLOBAL
Dimuat di **semua halaman**. Fungsi penting:

| Fungsi | Kegunaan |
|---|---|
| `getToken()` | Ambil JWT dari localStorage |
| `getUser()` | Ambil data user dari localStorage |
| `logout()` | Hapus localStorage → redirect `/index.html` |
| `requireAuth()` | Cek token + role, redirect jika tidak valid. Admin di halaman non-admin → redirect ke `admin.html`. User biasa di `admin.html` → redirect ke `dashboard.html` |
| `apiFetch(path, options)` | Fetch dengan auto auth header. 401 → logout. 403 → log warning saja (TIDAK logout) |
| `addNotification(title, msg, type)` | Tambah notifikasi ke localStorage |
| `getNotifications()` | Ambil array notifikasi |
| `markNotificationsRead()` | Tandai semua sudah dibaca |
| `renderBarChart(id, data, max, labelKey, valKey)` | Render bar chart custom |
| `togglePass(inputId, btn)` | Toggle show/hide password field |
| `fmtDate(dt)`, `fmtMinutes(mins)` | Format tanggal & durasi |

### `index.html` + `auth.js` — Login & Register
- Dua tab: Login / Register
- Login → `POST /api/auth/login` → simpan token + user ke localStorage
- Jika `role === 'SUPER_ADMIN'` → redirect ke `admin.html`
- Jika `role === 'USER'` → redirect ke `dashboard.html`

### `dashboard.html` + `dashboard.js`
- Summary: screen time hari ini, jarak rata-rata, health score, jumlah istirahat
- Bar chart screen time 7 hari terakhir
- Quick actions ke halaman lain

### `tracking.html` + `tracking.js` — Real-time Eye Tracking
- Kamera via **MediaPipe FaceMesh** (di-load dari CDN)
- Deteksi jarak berdasarkan jarak antar landmark mata (index 33 dan 133)
- Formula konversi: `distanceCm = (FOCAL_LENGTH * REF_DISTANCE) / eyeDistancePx`
- Status: `SAFE` jika ≥30cm, `WARNING` jika <30cm
- Log otomatis ke backend setiap 5 detik → `POST /api/user/tracking/distance`
- Timer 20 menit → reminder istirahat (aturan 20-20-20)
- Notifikasi lonceng saat status WARNING

### `edukasi.html` + `edukasi.js` — Edukasi
- Tabs: Semua | Artikel | Latihan | Modul PDF
- Artikel dari `GET /api/user/articles` → jika kosong/error, tampilkan `FALLBACK_ARTICLES` (5 artikel hardcoded di JS)
- Latihan dari `GET /api/user/exercises` → jika kosong/error, tampilkan `FALLBACK_EXERCISES` (6 latihan hardcoded)
- Latihan punya timer countdown + animasi ring
- Modul PDF: download via **fetch+blob** (bukan `window.open`) → paksa save dialog

### `statistik.html` + `statistik.js`
- Bar chart screen time harian
- Rata-rata jarak, health score, total istirahat

### `history.html` + `history.js`
- Riwayat log jarak tracking dengan badge SAFE/WARNING
- Riwayat keluhan mata dengan severity badge (Ringan/Sedang/Berat)

### `profil.html` + `profil.js`
- Tampil & edit profil user
- `GET /api/user/profile` dan `PUT /api/user/profile`

### `admin.html` + `admin.js` + `admin.css`
- Hanya bisa diakses `SUPER_ADMIN` (dihandle oleh `requireAuth()`)
- Statistik: total users, total artikel, total modul
- Tab Artikel: CRUD via `/api/admin/articles`
- Tab Modul PDF: Upload + Download (force download) + Hapus
- Download menggunakan fetch+blob pattern

---

## 10. Notifikasi (Bell Icon)

Notifikasi **disimpan lokal di localStorage** (bukan dari server), key: `eyeguard_notifications`.

```json
{
  "id": "1719244800000abc123",
  "title": "Peringatan Jarak",
  "message": "Jarak mata terlalu dekat: 22cm!",
  "time": "2026-06-24T09:00:00.000Z",
  "type": "warning",
  "read": false
}
```

Type values: `"success"`, `"warning"`, `"danger"`, `"info"`

Dipicu dari:
- `tracking.js` → WARNING jarak terlalu dekat
- `tracking.js` → Reminder istirahat 20 menit
- `edukasi.js` → Latihan selesai
- `edukasi.js` → Download modul dimulai
- `history.js` → Keluhan berhasil dicatat

---

## 11. Hal Penting & Gotcha

### 1. Rebuild JAR diperlukan hanya untuk perubahan Java
```powershell
# Stop server → rebuild → restart:
.\apache-maven-3.9.16\bin\mvn.cmd clean package -DskipTests -q
java -jar target\kedipin-1.0.0.jar --spring.profiles.active=dev
```

### 2. SUPER_ADMIN harus bisa akses /api/user/**
Admin panel memanggil `/api/user/modules` dan endpoint user lainnya. Jika SecurityConfig hanya izinkan `USER` di `/api/user/**`, admin akan dapat 403 dan ter-logout.

### 3. apiFetch — 401 logout, 403 TIDAK logout
- 401 = token expired/invalid → force logout (benar)
- 403 = tidak punya akses ke endpoint tertentu → log warning, skip, tetap di halaman

### 4. Admin tabel terpisah dari users
Tabel `admin` dan `users` adalah entitas berbeda. `CustomUserDetailsService.loadUserByUsername()` cek tabel `admin` dulu, lalu `users`.

### 5. Download PDF gunakan fetch+blob
Jangan gunakan `window.open(url, '_blank')` atau `<a href target=_blank>` — browser akan preview PDF. Gunakan:
```js
const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }});
const blob = await res.blob();
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'nama-file.pdf';
document.body.appendChild(a);
a.click();
setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
```

### 6. File PDF disimpan di path absolut
`ModuleServiceImpl` menyimpan `file_path` sebagai path absolut OS ke file PDF. Pastikan folder `uploads/modules/` ada dan server punya write access.

### 7. Tracking jarak dalam satuan cm
Field DB: `distance_cm` (Double). Jangan kirim dalam meter. Threshold: <30cm = WARNING.

### 8. Fallback data di frontend
Jika API gagal/kosong, `edukasi.js` otomatis tampilkan data dummy (artikel & latihan hardcoded). Ini bukan bug — by design agar halaman tidak kosong.

---

## 12. CSS Variables Global (shared.css)

```css
--primary:    #0ea5e9   /* Biru terang */
--accent:     #06b6d4   /* Cyan */
--success:    #10b981   /* Hijau */
--warning:    #f59e0b   /* Kuning/oranye */
--danger:     #ef4444   /* Merah */
--purple:     #8b5cf6   /* Ungu */
--bg-dark:    #0f172a   /* Background halaman */
--bg-card:    #1e293b   /* Background card */
--bg-muted:   #334155   /* Elemen muted */
--text:       #f1f5f9   /* Teks utama */
--text-light: #94a3b8   /* Teks sekunder */
--border:     rgba(255,255,255,.07)
--radius:     16px
--shadow:     0 8px 24px rgba(0,0,0,.25)
```

Font: **Inter** (Google Fonts). Tema: **Dark mode**.

---

## 13. File Paling Kritis

| File | Path | Kenapa Penting |
|---|---|---|
| `shared.js` | `static/` | Utility global — dibaca semua halaman, berisi auth logic |
| `SecurityConfig.java` | `security/` | Menentukan siapa yang bisa akses endpoint mana |
| `application.yml` | `resources/` | Koneksi DB + secret JWT |
| `AdminSeeder.java` | `config/` | Membuat akun admin saat startup |
| `JwtTokenProvider.java` | `security/` | Generate & validate JWT, baca role dari claims |
| `CustomUserDetailsService.java` | `security/` | Cari user/admin dari DB berdasarkan ID + role dari JWT |
| `tracking.js` | `static/` | Logika kamera + MediaPipe + auto-log ke backend |
| `edukasi.js` | `static/` | Artikel + latihan + download PDF |
| `admin.js` | `static/` | Semua logic panel admin |

---

*Dokumen dibuat berdasarkan analisis penuh kode project Kedipin. Diperbarui: 2026-06-25.*
