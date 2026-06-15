# ZeaVis Edu

> Klasifikasi penyakit daun jagung berbasis machine learning — dari dataset hingga aplikasi web.

**ZeaVis Edu** adalah aplikasi edukasi pengenalan penyakit daun jagung melalui klasifikasi gambar. Repositori ini mencakup pipeline machine learning lengkap (EfficientNetV2B0), layanan inferensi Rust/ONNX Runtime, aplikasi web React, API backend Elysia, serta infrastruktur multi-VPS dengan observabilitas penuh.

---

## Daftar Isi

1. [Tentang ZeaVis Edu](#1-tentang-zeavis-edu)
2. [Kelas Penyakit](#2-kelas-penyakit)
3. [Arsitektur Proyek](#3-arsitektur-proyek)
4. [Tech Stack](#4-tech-stack)
5. [Panduan Memulai](#5-panduan-memulai)
   - [5.1 Instalasi Root Workspace](#51-instalasi-root-workspace)
   - [5.2 Menjalankan Aplikasi Web & API](#52-menjalankan-aplikasi-web--api)
   - [5.3 Pipeline Machine Learning](#53-pipeline-machine-learning)
   - [5.4 ML Inference Service](#54-ml-inference-service)
   - [5.5 Infrastruktur & Deployment](#55-infrastruktur--deployment)
   - [5.6 Telemetry & Observabilitas](#56-telemetry--observabilitas)
6. [Dokumentasi Lengkap](#6-dokumentasi-lengkap)
7. [Troubleshooting Umum](#7-troubleshooting-umum)

---

## 1. Tentang ZeaVis Edu

ZeaVis Edu membantu petani, peneliti, dan pelajar mengidentifikasi penyakit daun jagung secara cepat menggunakan kamera. Pengguna cukup mengunggah foto daun jagung dan sistem akan mengklasifikasikannya ke dalam salah satu dari empat kategori kondisi daun.

### Fitur Utama

- **Aplikasi Web** — Antarmuka pengguna interaktif berbasis React + Vite
- **API Backend** — Layanan data dan autentikasi berbasis Elysia + PostgreSQL
- **ML Inference Service** — Inferensi real-time via Rust/Axum + ONNX Runtime
- **Pipeline ML** — Preprocessing dataset, pelatihan di Google Colab, ekspor model ke TFLite, TFJS, dan ONNX
- **Infrastruktur Multi-VPS** — Deployment produksi dengan Tailscale mesh VPN
- **Observabilitas** — Prometheus → ClickHouse pipeline dengan dashboard metrik

---

## 2. Kelas Penyakit

Model mengklasifikasikan gambar ke dalam **4 kelas** berbahasa Indonesia:

| Label | Deskripsi |
|---|---|
| **Bercak Daun** | *Gray Leaf Spot* — bercak abu-abu memanjang |
| **Hawar Daun** | *Northern/Southern Leaf Blight* — hawar coklat berbentuk panjang |
| **Karat Daun** | *Common Rust* — bintik coklat kemerahan berbentuk pustula |
| **Daun Sehat** | Daun jagung tanpa gejala penyakit |

---

## 3. Arsitektur Proyek

```
.
├── apps/
│   ├── api/                # Backend Elysia/Bun + Drizzle ORM + PostgreSQL
│   ├── ml-service/         # Layanan inferensi Rust/Axum + ONNX Runtime
│   └── web/                # Frontend React + Vite + Tailwind
├── Machine_Learning/       # Pipeline dataset, training, dan ekspor model
│   └── README.md           # ⤷ Panduan lengkap pipeline ML
├── infra/
│   └── README.md           # ⤷ Panduan deployment multi-VPS
├── packages/
│   └── shared/             # Tipe dan utilitas bersama TypeScript
├── telemetry/              # Submodule — Prometheus → ClickHouse pipeline
├── docker-compose.yml      # Konfigurasi deployment container
├── package.json            # Root workspace Bun + Moon
└── README.md               # ⤷ Anda di sini
```

| Komponen | Teknologi | Dokumentasi |
|---|---|---|
| Web Frontend | React, Vite, Tailwind, Zustand | `apps/web/` |
| API Backend | Bun, Elysia, Drizzle ORM, PostgreSQL | `apps/api/` |
| ML Inference | Rust, Axum, ONNX Runtime | [`apps/ml-service/README.md`](apps/ml-service/README.md) |
| ML Pipeline | Python, TensorFlow/Keras, EfficientNetV2B0 | [`Machine_Learning/README.md`](Machine_Learning/README.md) |
| Infrastruktur | Docker, Coolify, Traefik, Tailscale | [`infra/README.md`](infra/README.md) |
| Telemetry | Prometheus, ClickHouse, Vector, Vue 3 | `telemetry/` |

---

## 4. Tech Stack

### Frontend
React &bull; Vite &bull; TypeScript &bull; React Router &bull; TanStack Query &bull; Zustand &bull; Tailwind CSS

### Backend API
Bun &bull; Elysia &bull; Drizzle ORM &bull; PostgreSQL

### Machine Learning
Python &bull; TensorFlow/Keras &bull; EfficientNetV2B0 &bull; Rust &bull; Axum &bull; ONNX Runtime &bull; TFLite &bull; TensorFlow.js

### Tooling & Deployment
Bun workspaces &bull; Moon task runner &bull; Docker &bull; Docker Compose &bull; Coolify &bull; Traefik

### Telemetry & Observabilitas
Prometheus &bull; Metric Ingester (Go) &bull; Vector &bull; ClickHouse &bull; Query Proxy (Go) &bull; Telemetry UI (Vue 3)

---

## 5. Panduan Memulai

### Prasyarat

- **Bun** — untuk workspace TypeScript
- **Python 3.9–3.11** — untuk pipeline ML
- **Rust & Cargo** — untuk `apps/ml-service`
- **Docker & Docker Compose** — untuk deployment dan telemetry
- **PostgreSQL** — untuk backend API

### 5.1 Instalasi Root Workspace

```bash
# Clone repositori
git clone https://github.com/mytheclipse/zeavis-edu.git
cd zeavis-edu

# Instal dependensi TypeScript workspace
bun install
```

### 5.2 Menjalankan Aplikasi Web & API

```bash
# Semua task development (web + api)
bun run dev

# Atau jalankan terpisah:
cd apps/web && bun run dev     # Frontend — Vite dev server
cd apps/api && bun run start   # API backend
```

**Environment variables** yang perlu disiapkan di root `.env`:

| Variable | Keterangan |
|---|---|
| `DATABASE_URL` | URL koneksi PostgreSQL |
| `SESSION_SECRET` | Secret untuk session auth |
| `WEB_APP_URL` | URL frontend (untuk CORS) |
| `ML_SERVICE_URL` | URL layanan inferensi ML |

### 5.3 Pipeline Machine Learning

Pipeline lengkap preprocessing dataset, pelatihan model di Google Colab, dan ekspor ke berbagai format produksi.

> 📖 **Panduan lengkap:** [`Machine_Learning/README.md`](Machine_Learning/README.md)

**Ringkasan alur:**

1. Unduh 3 file ZIP dataset ke `Machine_Learning/`
2. Jalankan `python preprocessing.py` untuk menggabungkan dataset
3. Upload `dataset.zip` ke Google Drive
4. Jalankan `notebook.ipynb` di Google Colab (GPU T4)
5. Download `best_model.keras` hasil training
6. Ekspor model: `python save_model.py` → TFLite + SavedModel
7. Konversi ke TFJS dan ONNX

**Output pipeline:**

| Path | Format | Kegunaan |
|---|---|---|
| `Machine_Learning/model/saved_model/` | TensorFlow SavedModel | Jembatan konversi |
| `Machine_Learning/model/model.tflite` | TFLite | Mobile (Android/iOS) |
| `Machine_Learning/model/model.onnx` | ONNX | Rust inference service |
| `Machine_Learning/model/tfjs_model/` | TensorFlow.js | Web browser |

### 5.4 ML Inference Service

Layanan inferensi berbasis Rust/Axum dengan ONNX Runtime untuk prediksi real-time.

> 📖 **Panduan lengkap:** [`apps/ml-service/README.md`](apps/ml-service/README.md)

```bash
cd apps/ml-service
cargo run                           # Default port 8000

# Atau dengan konfigurasi custom:
MODEL_PATH=/path/to/model.onnx ML_SERVICE_PORT=9000 cargo run
```

**Endpoint utama:**

| Method | Path | Deskripsi |
|---|---|---|
| `GET` | `/health` | Health check + status model |
| `GET` | `/metadata` | Info model, label, versi |
| `POST` | `/predict` | Klasifikasi gambar (multipart upload) |

### 5.5 Infrastruktur & Deployment

> 📖 **Panduan lengkap:** [`infra/README.md`](infra/README.md)

Arsitektur produksi berjalan di **dua VPS terpisah** yang terhubung via **Tailscale** mesh VPN:

| VPS | Hostname | Peran |
|---|---|---|
| **App VPS** | `imrnes` (Arch Linux) | Web, API, ML Service |
| **Telemetry VPS** | `orange` (Ubuntu) | Prometheus, ClickHouse, Telemetry UI |

```bash
# Deploy app services via Docker Compose
docker compose up -d

# Deploy telemetry stack
make telemetry-up
```

### 5.6 Telemetry & Observabilitas

Pipeline metrik lengkap: **Prometheus → Metric Ingester → Vector → ClickHouse → Telemetry UI**.

Setiap service ZeaVis Edu mengekspos endpoint `GET /metrics` dalam format Prometheus. Prometheus di Telemetry VPS melakukan scrape melalui IP Tailscale.

```bash
make telemetry-up          # Mode produksi
make telemetry-up-local    # Mode development lokal
make telemetry-status      # Cek kesehatan
make telemetry-logs        # Lihat log
```

| Service | Port | Peran |
|---|---|---|
| Prometheus | 9090 | Scraping & remote_write |
| Metric Ingester | 9091 | Enrichment & filtering |
| Vector | 9001 | Buffering |
| ClickHouse | 8123 | Penyimpanan analitik |
| Query Proxy | 9092 | Read-only SQL proxy |
| Telemetry UI | 8181 | Dashboard metrik |

---

## 6. Dokumentasi Lengkap

| Dokumen | Isi |
|---|---|
| [`Machine_Learning/README.md`](Machine_Learning/README.md) | Panduan lengkap pipeline ML — preprocessing, training Colab, ekspor model TFLite/TFJS/ONNX |
| [`apps/ml-service/README.md`](apps/ml-service/README.md) | ML inference service — setup, endpoint API, konfigurasi, troubleshooting |
| [`infra/README.md`](infra/README.md) | Arsitektur multi-VPS — diagram, GitHub Secrets, port, metrics flow |
| [`METRICS.md`](METRICS.md) | Daftar lengkap metrik Prometheus yang diekspos |
| `telemetry/` (submodule) | Source code telemetry stack |

---

## 7. Troubleshooting Umum

### `bun install` gagal
Pastikan Bun versi terbaru terinstal:
```bash
bun --version   # minimal 1.x
```

### API membutuhkan database
Pastikan `DATABASE_URL` tersedia di root `.env` dan PostgreSQL dapat diakses.

### ML service gagal memuat model
Pastikan `Machine_Learning/model/model.onnx` sudah dibuat:
```bash
ls -la Machine_Learning/model/model.onnx
```
Jika belum, jalankan pipeline ML terlebih dahulu — lihat [`Machine_Learning/README.md`](Machine_Learning/README.md).

### Docker Compose gagal — network tidak ditemukan
```bash
docker network create app-shared-net
```

### Konversi TensorFlow.js gagal (konflik protobuf)
```bash
export PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python
```

---

## Pengembangan

1. `bun install`
2. Jalankan service yang dibutuhkan secara lokal
3. `bun run typecheck` sebelum commit
4. `bun run build` untuk verifikasi build produksi
5. Ikuti dokumentasi detail di masing-masing README untuk perubahan spesifik

---

> 🧬 **ZeaVis Edu** — Memberdayakan pertanian presisi melalui machine learning
