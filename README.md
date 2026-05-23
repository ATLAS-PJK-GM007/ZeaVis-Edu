# ZeaVis Edu

ZeaVis Edu adalah aplikasi edukasi untuk membantu mengenali penyakit daun jagung melalui klasifikasi gambar berbasis machine learning. Repositori ini menggabungkan aplikasi web, API backend, layanan inferensi ML, serta pipeline pelatihan dan ekspor model EfficientNetV2B0.

## Fitur Utama

- Aplikasi web untuk pengalaman pengguna dan interaksi edukatif.
- API backend untuk status layanan, integrasi data, dan komunikasi dengan layanan ML.
- ML service berbasis Rust/Axum dengan ONNX Runtime untuk inferensi penyakit daun jagung dari gambar.
- Pipeline machine learning untuk preprocessing dataset, training di Google Colab, dan ekspor model produksi.
- Dukungan Docker untuk deployment web, API, dan ML service.
- Workspace monorepo berbasis Bun dan Moon untuk menjalankan task development, typecheck, dan build secara terpusat.

## Kelas Penyakit

Model klasifikasi menargetkan empat label berbahasa Indonesia:

| Label | Deskripsi |
|---|---|
| Bercak Daun | Gray Leaf Spot |
| Hawar Daun | Northern/Southern Leaf Blight |
| Karat Daun | Common Rust |
| Daun Sehat | Daun jagung tanpa gejala penyakit |

## Struktur Proyek

```text
.
├── apps/
│   ├── api/              # Backend Elysia/Bun
│   ├── ml-service/       # Layanan inferensi Rust/Axum + ONNX Runtime
│   └── web/              # Frontend React + Vite
├── Machine_Learning/     # Pipeline dataset, training, dan ekspor model
├── packages/
│   └── shared/           # Tipe dan utilitas bersama TypeScript
├── docker-compose.yml    # Konfigurasi deployment container
├── package.json          # Script dan workspace root Bun
└── README.md             # Dokumentasi utama proyek
```

## Tech Stack

### Frontend

- React
- Vite
- TypeScript
- React Router
- TanStack Query
- Zustand
- Tailwind CSS

### Backend API

- Bun
- Elysia
- Drizzle ORM
- PostgreSQL

### Machine Learning

- Python (preprocessing, training, export)
- TensorFlow/Keras
- EfficientNetV2B0
- Rust
- Axum
- ONNX Runtime
- TFLite
- TensorFlow.js

### Tooling & Deployment

- Bun workspaces
- Moon task runner
- Docker
- Docker Compose
- GitHub Container Registry
- Traefik labels untuk routing deployment

## Prasyarat

Untuk menjalankan seluruh project secara lokal, siapkan:

- Bun
- Python 3.9–3.11 untuk pipeline ML
- Rust dan Cargo untuk `apps/ml-service`
- Docker dan Docker Compose jika ingin menjalankan/deploy via container
- PostgreSQL jika fitur backend yang membutuhkan database digunakan
- File model `Machine_Learning/model/model.onnx` untuk inferensi ML lokal

## Instalasi Root Workspace

Jalankan dari root repository:

```bash
bun install
```

## Menjalankan Project Lokal

### Menjalankan Semua Task Development

```bash
bun run dev
```

Script ini menjalankan task `dev` melalui Moon untuk workspace yang tersedia.

### Type Check

```bash
bun run typecheck
```

### Build Produksi

```bash
bun run build
```

## Menjalankan Service Secara Terpisah

### Web App

```bash
cd apps/web
bun run dev
```

Secara default Vite akan menjalankan server development dan menampilkan URL lokal di terminal.

### API Backend

```bash
cd apps/api
bun run start
```

API membaca konfigurasi dari file `.env` di root repository melalui script Bun.

Script lain yang tersedia:

```bash
bun run db:generate
bun run db:migrate
bun run db:seed
bun run typecheck
```

### ML Service

```bash
cd apps/ml-service
cargo run
```

Default path model adalah:

```text
../../Machine_Learning/model/model.onnx
```

Jika model berada di lokasi lain, gunakan environment variable `MODEL_PATH`:

```bash
MODEL_PATH=/path/to/model.onnx cargo run
```

## Endpoint Penting

### ML Service

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/health` | Mengecek status service dan status model |
| GET | `/metadata` | Melihat metadata service, label, input size, dan path model |
| POST | `/predict` | Mengunggah gambar daun jagung untuk klasifikasi |

Contoh verifikasi lokal:

```bash
curl http://localhost:8001/health
curl http://localhost:8001/metadata
curl -X POST http://localhost:8001/predict -F "file=@/path/to/corn-leaf.jpg"
```

## Docker Deployment

File `docker-compose.yml` di root menyiapkan tiga service produksi:

- `web` untuk frontend
- `api` untuk backend
- `ml` untuk layanan inferensi machine learning

Konfigurasi compose menggunakan image dari GitHub Container Registry:

```text
ghcr.io/${GITHUB_REPOSITORY:-mytheclipse/zeavis-edu}/web:main
ghcr.io/${GITHUB_REPOSITORY:-mytheclipse/zeavis-edu}/api:main
ghcr.io/${GITHUB_REPOSITORY:-mytheclipse/zeavis-edu}/ml:main
```

Compose juga mengasumsikan network eksternal bernama `app-shared-net` dan routing Traefik untuk domain produksi. Service `ml` berjalan pada port `8000` di dalam container.

Contoh menjalankan compose setelah environment dan network siap:

```bash
docker compose up -d
```

## Workflow Machine Learning

Detail lengkap tersedia di [`Machine_Learning/README.md`](Machine_Learning/README.md). Ringkasnya:

1. Unduh `dataset_1.zip`, `dataset_2.zip`, dan `dataset_3.zip` lalu letakkan di `Machine_Learning/`.
2. Jalankan preprocessing lokal:

   ```bash
   cd Machine_Learning
   python preprocessing.py
   ```

3. Upload `dataset.zip` ke Google Drive.
4. Jalankan `notebook.ipynb` di Google Colab dengan GPU.
5. Download model terbaik sebagai `best_model/best_model.keras`.
6. Ekspor model produksi:

   ```bash
   python save_model.py
   ```

7. Konversi TensorFlow.js via CLI:

   ```bash
   export PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python
   tensorflowjs_converter \
     --input_format=tf_saved_model \
     --output_format=tfjs_graph_model \
     --signature_name=serving_default \
     --saved_model_tags=serve \
     model/saved_model \
     model/tfjs_model
   ```

Output utama pipeline ML:

| Path | Kegunaan |
|---|---|
| `Machine_Learning/dataset.zip` | Dataset siap upload ke Colab |
| `Machine_Learning/best_model/best_model.keras` | Model Keras hasil training |
| `Machine_Learning/model/saved_model/` | TensorFlow SavedModel |
| `Machine_Learning/model/model.tflite` | Model untuk mobile/TFLite |
| `Machine_Learning/model/model.onnx` | Model untuk Rust ONNX Runtime |
| `Machine_Learning/model/tfjs_model/` | Model untuk TensorFlow.js |

## Artifact Lokal dan Generated Files

Beberapa file tidak tersedia di fresh clone karena berukuran besar, dihasilkan lokal, atau berasal dari sumber eksternal:

- `Machine_Learning/dataset_1.zip`
- `Machine_Learning/dataset_2.zip`
- `Machine_Learning/dataset_3.zip`
- `Machine_Learning/dataset/`
- `Machine_Learning/dataset.zip`
- `Machine_Learning/best_model/best_model.keras`
- `Machine_Learning/model/saved_model/`
- `Machine_Learning/model/model.tflite`
- `Machine_Learning/model/model.onnx`
- `Machine_Learning/model/tfjs_model/`

## Environment Variable Penting

| Variable | Digunakan oleh | Keterangan |
|---|---|---|
| `DATABASE_URL` | API | URL koneksi PostgreSQL untuk Drizzle |
| `API_PORT` | API | Port backend produksi |
| `WEB_APP_URL` | API | URL frontend untuk konfigurasi CORS/integrasi |
| `ML_SERVICE_URL` | API | URL layanan ML |
| `MODEL_PATH` | ML Service | Lokasi file model ONNX, default `../../Machine_Learning/model/model.onnx` |
| `MODEL_INPUT_SIZE` | ML Service | Ukuran input model, default produksi `224` |

## Troubleshooting

### `bun run dev` gagal karena dependency belum tersedia

Jalankan ulang instalasi dari root repository:

```bash
bun install
```

### API membutuhkan database

Pastikan `DATABASE_URL` tersedia di `.env` root dan PostgreSQL dapat diakses oleh aplikasi.

### ML service gagal memuat model

Pastikan file model tersedia di path default:

```text
Machine_Learning/model/model.onnx
```

Atau set path khusus:

```bash
MODEL_PATH=/path/to/model.onnx cargo run
```

### Docker Compose gagal karena network tidak ditemukan

`docker-compose.yml` menggunakan network eksternal `app-shared-net`. Buat network tersebut jika belum ada:

```bash
docker network create app-shared-net
```

### Konversi TensorFlow.js gagal karena konflik protobuf

Jalankan konversi melalui CLI dan set environment variable berikut:

```bash
export PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python
```

## Pengembangan

Alur umum pengembangan:

1. Install dependency dengan `bun install`.
2. Jalankan service yang dibutuhkan secara lokal.
3. Jalankan `bun run typecheck` sebelum membuat commit.
4. Jalankan `bun run build` untuk memverifikasi build produksi.
5. Untuk perubahan ML, ikuti dokumentasi detail di `Machine_Learning/README.md`.
6. Untuk perubahan ML service, cek juga `apps/ml-service/README.md`.

## Dokumentasi Terkait

- [`Machine_Learning/README.md`](Machine_Learning/README.md) — panduan lengkap dataset, training, dan ekspor model.
- [`apps/ml-service/README.md`](apps/ml-service/README.md) — panduan menjalankan dan memverifikasi layanan inferensi ML.
