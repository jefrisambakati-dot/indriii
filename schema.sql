-- KEDIPIN DATABASE SCHEMA 👀

-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER',
    age INT,
    gender VARCHAR(50),
    profile_picture VARCHAR(255),
    daily_screen_target INT DEFAULT 240,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Admins (Untuk Akun Utama SUPER_ADMIN)
CREATE TABLE IF NOT EXISTS admins (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Eye Exercises
CREATE TABLE IF NOT EXISTS eye_exercises (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INT NOT NULL, -- dalam detik
    thumbnail VARCHAR(255),
    difficulty_level VARCHAR(50),
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Tracking Logs (Distance Logs)
CREATE TABLE IF NOT EXISTS tracking_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INT8 REFERENCES users(id) ON DELETE CASCADE,
    distance_cm FLOAT8 NOT NULL,
    status VARCHAR(50) NOT NULL, -- "SAFE" atau "WARNING"
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Complaints (Complaint Logs)
CREATE TABLE IF NOT EXISTS complaints (
    id BIGSERIAL PRIMARY KEY,
    user_id INT8 REFERENCES users(id) ON DELETE CASCADE,
    complaint_type VARCHAR(255) NOT NULL,
    severity INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Daily Status (Untuk Dashboard/Statistik)
CREATE TABLE IF NOT EXISTS daily_status (
    id BIGSERIAL PRIMARY KEY,
    user_id INT8 REFERENCES users(id) ON DELETE CASCADE,
    status_date DATE NOT NULL,
    total_screen_time INT DEFAULT 0,
    total_breaks INT DEFAULT 0,
    avg_distance FLOAT8 DEFAULT 0.0,
    eye_health_score INT DEFAULT 100,
    mood VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, status_date)
);

-- 7. Tabel Exercise Logs
CREATE TABLE IF NOT EXISTS exercise_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INT8 REFERENCES users(id) ON DELETE CASCADE,
    exercise_id INT8 REFERENCES eye_exercises(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabel Articles (Education Articles)
CREATE TABLE IF NOT EXISTS articles (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(100),
    thumbnail VARCHAR(255), -- excerpt
    author VARCHAR(255),
    is_published BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabel Modules (Untuk Upload PDF)
CREATE TABLE IF NOT EXISTS modules (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default Super Admin (Password: admin123, terenkripsi BCrypt $2a$10$wN9f1Zep3J4R.XU3.JqZou.T/Z3iA6/X4V5w10JqZ1xZg73O8U4s.)
-- Catatan: Seed ini opsional, di Spring Boot kita juga bisa melakukan inisialisasi via Runner.
INSERT INTO admins (username, email, password)
VALUES ('admin', 'admin@kedipin.com', '$2a$10$tZ2Ea4y2U4b9c1Z7WJgL2e4z/lQYk85h9kG9l8aB4pE6gTj6.R7c2')
ON CONFLICT (email) DO NOTHING;
