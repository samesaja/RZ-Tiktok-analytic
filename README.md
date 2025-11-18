# RZ TikTok Live Analytic

Dashboard analitik untuk memonitor performa TikTok Live secara **real‑time** dan menganalisis performa historis per akun, dengan dukungan insight AI dari **Gemini**.

## Fitur Utama

- **Start monitoring dari homepage**
  - Input username TikTok (dengan atau tanpa `@`).
  - Tombol **Start Monitoring** mengarahkan ke halaman live: `/live/[username]`.

- **Live monitoring (`/live/[username]`)**
  - Menjalankan service Python (melalui API backend) untuk memonitor live.
  - Menampilkan metrik real‑time: viewers, engagement rate, algorithm score, likes, gifts, dsb.
  - Menyimpan snapshot metrik ke database (Prisma) secara periodik.

- **Dashboard historis (`/dashboard`)**
  - Ringkasan global: total akun, total sesi, rata‑rata score, best score, median score.
  - Faktor algoritma (engagement, retention, quality, monetization, follow).
  - Highlight **Top Performer**.
  - Tabel **Analisis per Akun** dengan tombol **Detail** per username.

- **Analisis per akun (`/dashboard/account/[username]`)**
  - Chart `Score per Session` (bar chart) per akun.
  - Chart `Engagement vs Retention` per sesi.
  - **Insight AI (Gemini)** yang merangkum pola performa dan memberi saran optimasi.

## Arsitektur Singkat

- **Frontend**: Next.js App Router (TypeScript, `app/`), Tailwind + shadcn/ui untuk komponen UI.
- **Backend API**: route Next.js di `app/api`.
- **Database**: Prisma ORM (lihat `prisma/schema.prisma`).
- **Live service**: endpoint di `lib/liveService.ts` yang memanggil service Python eksternal.
- **AI Analysis**: Google Gemini API (`gemini-2.5-flash`).

## Struktur Route Penting

- `GET /` – Homepage, quick start monitoring + ringkasan analytics.
- `GET /live/[username]` – Halaman live monitoring real‑time untuk satu akun.
- `GET /dashboard` – Dashboard historis lintas akun.
- `GET /dashboard/account/[username]` – Detail analitik per akun (chart + Gemini).

API utama:

- `/api/live/start` – Mulai monitoring untuk username tertentu.
- `/api/live/stop` – Hentikan monitoring.
- `/api/live/metrics` – Ambil metrik live real‑time.
- `/api/live/save-metrics` – Simpan snapshot metrik ke DB.
- `/api/analytics/summary` – Ringkasan algoritma global + per akun.
- `/api/analytics/account/[username]` – Data historis per akun.
- `/api/analytics/account/[username]/gemini` – Analisis AI dari Gemini untuk akun.

## Prasyarat

- Node.js 18+
- Database yang kompatibel dengan Prisma (misalnya PostgreSQL / MySQL / SQLite).
- Service Python TikTok Live (backend eksternal) berjalan dan dapat diakses oleh Next.js.

## Konfigurasi Environment

Buat file `.env` di root project dan isi variabel yang dibutuhkan, contohnya:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/tiktok_live"

# Base URL untuk service Python TikTok Live
PYTHON_SERVICE_BASE_URL="http://localhost:8000"  # contoh

# Interval polling live metrics (ms)
NEXT_PUBLIC_LIVE_POLL_INTERVAL=5000

# API key Gemini (JANGAN di-commit ke repo publik)
GEMINI_API_KEY="..."
```

> Penting: `.env` sebaiknya tidak di‑commit ke Git karena berisi kredensial sensitif.

## Setup Database (Prisma)

1. Edit skema Prisma di `prisma/schema.prisma` sesuai kebutuhan.
2. Jalankan migrasi:

```bash
npx prisma migrate dev
```

3. (Opsional) Buka Prisma Studio untuk inspeksi data:

```bash
npx prisma studio
```

## Menjalankan Aplikasi Secara Lokal

Instal dependensi:

```bash
npm install
```

Jalankan server development:

```bash
npm run dev
```

Lalu buka:

- `http://localhost:3000/` – Halaman utama + Quick Start Monitoring.
- `http://localhost:3000/dashboard` – Dashboard historis.

Pastikan juga service Python TikTok Live berjalan dan dapat merespons endpoint yang dipanggil oleh `lib/liveService.ts`.

## Alur Penggunaan

1. **Mulai monitoring live**
   - Buka `/`.
   - Masukkan username TikTok (contoh: `@corord6` atau `corord6`).
   - Klik **Start Monitoring** → diarahkan ke `/live/[username]`.
   - Di halaman live, klik **Start Monitoring** pada panel untuk memulai streaming data.

2. **Lihat dashboard historis**
   - Buka `/dashboard` atau klik tombol **Buka Dashboard Historis** di header homepage.
   - Lihat ringkasan global + tabel **Analisis per Akun**.

3. **Analisis mendalam per akun + Gemini**
   - Di `/dashboard`, klik tombol **Detail** pada salah satu akun.
   - Halaman `/dashboard/account/[username]` menampilkan:
     - Chart `Score per Session`.
     - Chart `Engagement vs Retention`.
     - Card **Insight AI (Gemini)** berisi ringkasan dan saran.

Jika server Gemini sedang overload (503), UI akan menampilkan pesan ramah yang menyarankan untuk mencoba lagi beberapa menit kemudian.

## Catatan Keamanan

- Jangan expose `GEMINI_API_KEY` ke klien; saat ini pemanggilan Gemini dilakukan **hanya di server** (route API).
- Simpan `.env` secara lokal atau di secret manager platform deployment (Vercel, Render, dsb).

## Deployment Singkat

Secara umum, langkah deployment Next.js standar:

1. Set `DATABASE_URL`, `PYTHON_SERVICE_BASE_URL`, `GEMINI_API_KEY`, dan variabel lain di environment platform.
2. Jalankan migrasi Prisma di environment produksi.
3. Deploy app Next.js (contoh: Vercel, Railway, Render).

Pastikan service Python TikTok Live juga dideploy dan dapat diakses dari URL yang diberikan di `PYTHON_SERVICE_BASE_URL`.

---

Kontribusi, issue, atau ide pengembangan lebih lanjut (misalnya jenis chart baru, metrik tambahan, atau model AI lain) sangat dipersilakan melalui GitHub.
