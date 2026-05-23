# ML Service — Rust Axum ONNX Runtime

Layanan inferensi machine learning berbasis Rust dengan Axum web framework dan ONNX Runtime untuk klasifikasi penyakit daun jagung. Service ini menyediakan endpoint HTTP untuk prediksi real-time dengan performa tinggi dan konsumsi resource minimal.

## Fitur

- **Framework:** Axum (async Rust web framework)
- **Runtime Inferensi:** ONNX Runtime untuk kompatibilitas lintas platform
- **Model:** EfficientNetV2B0 dalam format ONNX
- **Endpoint:** Health check, metadata, dan prediksi gambar
- **Multipart Upload:** Dukungan upload gambar langsung via HTTP POST

## Prasyarat

- Rust 1.70+ dan Cargo
- Model ONNX di `../../Machine_Learning/model/model.onnx` (atau path custom via `MODEL_PATH`)

## Instalasi & Setup

### Instalasi Dependensi

Dependensi Rust sudah terdaftar di `Cargo.toml`. Cargo akan mengunduh dan mengkompilasi otomatis saat pertama kali build.

```bash
cargo build
```

## Menjalankan Service Lokal

### Opsi 1: Default (Port 8000, Model dari Machine_Learning/)

```bash
cargo run
```

Service akan mencari model di path default dan mendengarkan di `http://localhost:8000`:
```
../../Machine_Learning/model/model.onnx
```

### Opsi 2: Local Development dengan .env.example (Port 8001)

Untuk development lokal dengan port 8001 (sesuai `.env.example`):

```bash
source .env.example
cargo run
```

Service akan mendengarkan di `http://localhost:8001` karena `ML_SERVICE_PORT=8001` di `.env.example`.

### Opsi 3: Custom Model Path

Jika model berada di lokasi lain, gunakan environment variable `MODEL_PATH`:

```bash
MODEL_PATH=/path/to/model.onnx cargo run
```

Atau kombinasikan dengan port custom:

```bash
ML_SERVICE_PORT=9000 MODEL_PATH=/path/to/model.onnx cargo run
```

## Environment Variables

| Variable | Default | Keterangan |
|---|---|---|
| `ML_SERVICE_HOST` | `0.0.0.0` | Bind address |
| `ML_SERVICE_PORT` | `8000` | Bind port (override untuk local dev dengan `.env.example`) |
| `MODEL_PATH` | `../../Machine_Learning/model/model.onnx` | Path ke file model ONNX |
| `MODEL_INPUT_SIZE` | `224` | Ukuran input gambar (224x224 untuk EfficientNetV2B0) |
| `RUST_LOG` | `info` | Level logging (debug, info, warn, error) |

## Endpoint API

### 1. Health Check

**Default (port 8000):**
```bash
curl http://localhost:8000/health
```

**Local dev dengan .env.example (port 8001):**
```bash
curl http://localhost:8001/health
```

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true,
  "model_path": "../../Machine_Learning/model/model.onnx"
}
```

### 2. Metadata

**Default (port 8000):**
```bash
curl http://localhost:8000/metadata
```

**Local dev dengan .env.example (port 8001):**
```bash
curl http://localhost:8001/metadata
```

**Response:**
```json
{
  "service": "ZeaVis ML Service",
  "version": "0.1.0",
  "model_path": "../../Machine_Learning/model/model.onnx",
  "input_size": 224,
  "labels": [
    "Bercak Daun",
    "Hawar Daun",
    "Karat Daun",
    "Daun Sehat"
  ]
}
```

### 3. Prediksi

Upload gambar daun jagung untuk klasifikasi:

**Default (port 8000):**
```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@/path/to/corn-leaf.jpg"
```

**Local dev dengan .env.example (port 8001):**
```bash
curl -X POST http://localhost:8001/predict \
  -F "file=@/path/to/corn-leaf.jpg"
```

**Response:**
```json
{
  "predictions": [
    {
      "label": "Daun Sehat",
      "confidence": 0.95
    },
    {
      "label": "Bercak Daun",
      "confidence": 0.03
    },
    {
      "label": "Hawar Daun",
      "confidence": 0.01
    },
    {
      "label": "Karat Daun",
      "confidence": 0.01
    }
  ],
  "top_prediction": {
    "label": "Daun Sehat",
    "confidence": 0.95
  }
}
```

## Verifikasi & Testing

### Build Produksi

```bash
cargo build --release
```

Output binary akan tersedia di `target/release/zeavis-ml-service`.

### Menjalankan Tests

```bash
cargo test
```

Tests mencakup validasi loading model, preprocessing gambar, dan output prediksi.

### Verifikasi Manual

#### Dengan default port 8000:

1. Jalankan service:
   ```bash
   cargo run
   ```

2. Di terminal lain, test health endpoint:
   ```bash
   curl http://localhost:8000/health
   ```

3. Test metadata:
   ```bash
   curl http://localhost:8000/metadata
   ```

4. Test prediksi dengan gambar sample:
   ```bash
   curl -X POST http://localhost:8000/predict \
     -F "file=@../../Machine_Learning/dataset/Daun\ Sehat/sample.jpg"
   ```

#### Dengan local dev port 8001 (.env.example):

1. Jalankan service dengan .env.example:
   ```bash
   source .env.example
   cargo run
   ```

2. Di terminal lain, test health endpoint:
   ```bash
   curl http://localhost:8001/health
   ```

3. Test metadata:
   ```bash
   curl http://localhost:8001/metadata
   ```

4. Test prediksi dengan gambar sample:
   ```bash
   curl -X POST http://localhost:8001/predict \
     -F "file=@../../Machine_Learning/dataset/Daun\ Sehat/sample.jpg"
   ```

## Troubleshooting

### Model tidak ditemukan

**Error:** `Failed to load model: No such file or directory`

**Solusi:** Pastikan file model tersedia di path yang benar:
```bash
ls -la ../../Machine_Learning/model/model.onnx
```

Atau set path custom:
```bash
MODEL_PATH=/absolute/path/to/model.onnx cargo run
```

### Port sudah digunakan

**Error:** `Address already in use`

**Solusi:** Service menggunakan port 8000 secara default. Jika port sudah digunakan, ubah dengan environment variable:

```bash
ML_SERVICE_PORT=9000 cargo run
```

Atau jika menggunakan `.env.example` (port 8001), pastikan tidak ada service lain di port tersebut:

```bash
lsof -i :8001
```

### ONNX Runtime tidak kompatibel

**Error:** `ONNX Runtime initialization failed`

**Solusi:** Pastikan ONNX Runtime binary kompatibel dengan sistem operasi. Cargo akan mengunduh binary yang sesuai otomatis. Jika masalah persisten, coba rebuild:
```bash
cargo clean
cargo build
```

## Deployment

### Docker

Service dapat di-deploy via Docker. Dockerfile sudah tersedia di direktori ini.

```bash
docker build -t zeavis-ml-service .
docker run -p 8000:8000 \
  -v /path/to/model.onnx:/app/model.onnx \
  -e MODEL_PATH=/app/model.onnx \
  zeavis-ml-service
```

### Docker Compose

Lihat `docker-compose.yml` di root repository untuk deployment lengkap dengan web, API, dan ML service.

## Dokumentasi Terkait

- [`Machine_Learning/README.md`](../../Machine_Learning/README.md) — Panduan training dan ekspor model ONNX
- [`README.md`](../../README.md) — Dokumentasi proyek utama
