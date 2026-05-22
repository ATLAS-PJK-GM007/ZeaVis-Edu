# ZeaVis Edu

ZeaVis Edu adalah aplikasi fullstack untuk klasifikasi penyakit daun jagung menggunakan machine learning. Sistem ini terdiri dari tiga layanan utama: web frontend, API backend, dan layanan ML, yang dapat dijalankan secara lokal atau di-deploy dengan Docker.

## Fitur

- **Klasifikasi Penyakit Daun Jagung**: Mengidentifikasi 4 jenis penyakit daun jagung
- **Antarmuka Web Modern**: Dibangun dengan React, Vite, dan TypeScript
- **API RESTful**: Backend Elysia dengan Drizzle ORM untuk PostgreSQL
- **Layanan ML Terpisah**: FastAPI dengan model TensorFlow EfficientNetV2B0
- **Docker Deployment**: Containerized dengan docker-compose dan Traefik reverse proxy
- **Workflow ML Lengkap**: Dari preprocessing data hingga export model produksi

## Kelas Penyakit yang Dideteksi

Model machine learning dapat mengklasifikasikan 4 kondisi daun jagung:

1. **Bercak Daun** — Gray Leaf Spot
2. **Hawar Daun** — Northern/Southern Leaf Blight  
3. **Karat Daun** — Common Rust
4. **Daun Sehat** — healthy corn leaf

## Struktur Proyek

```
ZeaVis-Edu/
├── apps/
│   ├── web/          # Frontend React + Vite + TypeScript
│   ├── api/          # Backend Elysia + Drizzle + PostgreSQL
│   └── ml-service/   # FastAPI + TensorFlow ML service
├── packages/
│   └── shared/       # Shared TypeScript types dan utilities
├── Machine_Learning/ # Pipeline ML: preprocessing, training, export
├── docker-compose.yml
└── package.json      # Root workspace dengan Moon tasks
```

## Tech Stack

### Frontend (apps/web)
- **React 18** dengan TypeScript
- **Vite** untuk build tool
- **React Router** untuk routing
- **TanStack Query** untuk data fetching
- **Zustand** untuk state management
- **Tailwind CSS** untuk styling
- **shadcn/ui** untuk komponen UI

### Backend (apps/api)
- **Bun** runtime
- **Elysia** framework web
- **Drizzle ORM** dengan PostgreSQL
- **TypeScript**

### ML Service (apps/ml-service)
- **FastAPI** dengan Python
- **TensorFlow** untuk inferensi model
- **EfficientNetV2B0** arsitektur model
- **Pydantic** untuk validasi data

### ML Pipeline (Machine_Learning/)
- **Python** dengan TensorFlow/Keras
- **EfficientNetV2B0** untuk training
- **Google Colab** untuk training dengan GPU
- **TensorFlow SavedModel, TFLite, TensorFlow.js** untuk export

### Infrastruktur
- **Docker** dan **docker-compose** untuk containerization
- **Traefik** sebagai reverse proxy
- **PostgreSQL** database
- **Moon** sebagai task runner untuk monorepo

## Prasyarat

- **Node.js 18+** atau **Bun** (direkomendasikan)
- **Python 3.9+** dengan pip
- **Docker** dan **docker-compose** (untuk deployment)
- **Git**

## Instalasi

### 1. Clone Repository
```bash
git clone https://github.com/mytheclipse/ZeaVis-Edu.git
cd ZeaVis-Edu
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Setup Environment Variables
Salin file `.env.example` ke `.env` dan sesuaikan nilai-nilainya:
```bash
cp .env.example .env
```

## Menjalankan Secara Lokal

### Perintah Root (Menggunakan Moon)
```bash
# Development mode (semua layanan)
bun run dev

# Build production
bun run build

# Type checking
bun run typecheck
```

### Web App (apps/web)
```bash
cd apps/web
bun run dev
```
Akses di: http://localhost:5173

### API (apps/api)
```bash
cd apps/api
bun run start
```
Akses di: http://localhost:3000

### ML Service (apps/ml-service)
```bash
cd apps/ml-service
# Install dependencies Python
pip install -r requirements.txt
# Jalankan service
uvicorn main:app --reload --port 8000
```
Akses di: http://localhost:8000

## Endpoint ML Service

### 1. GET /health
**Deskripsi**: Health check endpoint
**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 2. GET /metadata
**Deskripsi**: Mendapatkan metadata model
**Response**:
```json
{
  "model_name": "EfficientNetV2B0",
  "input_size": 224,
  "classes": ["Bercak Daun", "Hawar Daun", "Karat Daun", "Daun Sehat"],
  "version": "1.0.0"
}
```

### 3. POST /predict
**Deskripsi**: Prediksi gambar daun jagung
**Request Body**:
```json
{
  "image": "base64_encoded_image_string"
}
```
**Response**:
```json
{
  "predictions": [
    {
      "class": "Bercak Daun",
      "confidence": 0.95
    },
    {
      "class": "Hawar Daun", 
      "confidence": 0.03
    },
    {
      "class": "Karat Daun",
      "confidence": 0.01
    },
    {
      "class": "Daun Sehat",
      "confidence": 0.01
    }
  ],
  "top_prediction": {
    "class": "Bercak Daun",
    "confidence": 0.95
  }
}
```

## Deployment dengan Docker

### 1. Build dan Jalankan dengan docker-compose
```bash
docker-compose up -d
```

### 2. Services dalam docker-compose.yml
- **web**: Frontend React app (port 80 dalam container)
- **api**: Backend API (port 3000 dalam container)  
- **ml**: ML service (port 8000 dalam container)
- **Network**: `app-shared-net` untuk komunikasi antar service

### 3. Environment Variables untuk Docker
Pastikan file `.env` berisi:
```env
DATABASE_URL=postgresql://user:password@postgres:5432/zeavis
API_PORT=3000
WEB_APP_URL=https://zeavisedu.asepharyana.tech
ML_SERVICE_URL=https://ml.zeavisedu.asepharyana.tech
MODEL_PATH=/app/model/best_model.keras
MODEL_INPUT_SIZE=224
```

## Workflow Machine Learning

### 1. Preprocessing Data
```bash
cd Machine_Learning
python preprocessing.py
```
Membutuhkan file `dataset_1.zip`, `dataset_2.zip`, `dataset_3.zip` di direktori yang sama.

### 2. Training di Google Colab
- Buka `notebook.ipynb` di Google Colab dengan GPU enabled
- Upload `dataset.zip` yang dihasilkan dari preprocessing
- Jalankan notebook untuk training model EfficientNetV2B0
- Model terbaik akan disimpan sebagai `best_model.keras`

### 3. Export Model untuk Produksi
```bash
cd Machine_Learning
python save_model.py
```
Menghasilkan:
- `model/saved_model/` (TensorFlow SavedModel)
- `model/model.tflite` (TFLite format)

### 4. Convert ke TensorFlow.js
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

## Artifak yang Dihasilkan

### File/Direktori yang Dihasilkan (tidak termasuk dalam repo)
- `Machine_Learning/dataset_1.zip`, `dataset_2.zip`, `dataset_3.zip` — dataset sumber
- `Machine_Learning/dataset/` dan `dataset.zip` — hasil preprocessing
- `Machine_Learning/best_model/best_model.keras` — model terlatih dari Colab
- `Machine_Learning/model/saved_model/`, `model/model.tflite`, `model/tfjs_model/` — export produksi

## Environment Variables

### Umum
```env
NODE_ENV=development|production
```

### Database
```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

### API
```env
API_PORT=3000
WEB_APP_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000
```

### ML Service
```env
MODEL_PATH=/path/to/best_model.keras
MODEL_INPUT_SIZE=224
```

## Troubleshooting

### 1. Bun Install Error
```bash
# Jika bun tidak terinstall
curl -fsSL https://bun.sh/install | bash
```

### 2. Python Dependencies Error
```bash
cd apps/ml-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Docker Network Error
```bash
# Buat network jika belum ada
docker network create app-shared-net
```

### 4. ML Model Not Found
Pastikan file `best_model.keras` ada di:
- `Machine_Learning/best_model/best_model.keras` (untuk local)
- `/app/model/best_model.keras` (untuk Docker container)

## Workflow Development

### 1. Setup Development Environment
```bash
git clone <repository>
cd ZeaVis-Edu
bun install
cp .env.example .env
```

### 2. Jalankan Layanan Secara Terpisah
```bash
# Terminal 1: Web app
cd apps/web && bun run dev

# Terminal 2: API
cd apps/api && bun run start

# Terminal 3: ML service
cd apps/ml-service && uvicorn main:app --reload --port 8000
```

### 3. Testing
```bash
# Type checking
bun run typecheck

# Build production
bun run build
```

### 4. Docker Testing
```bash
# Build dan jalankan
docker-compose up --build

# Hentikan services
docker-compose down
```

## Dokumentasi Terkait

- `Machine_Learning/README.md` — Dokumentasi workflow machine learning
- `CLAUDE.md` — Panduan untuk Claude Code
- `docker-compose.yml` — Konfigurasi Docker deployment
- `apps/web/package.json` — Dependencies frontend
- `apps/api/package.json` — Dependencies backend
- `apps/ml-service/requirements.txt` — Dependencies ML service

## Kontribusi

1. Fork repository
2. Buat branch fitur (`git checkout -b feature/amazing-feature`)
3. Commit perubahan (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Buat Pull Request

## Lisensi

Distributed under the MIT License. See `LICENSE` for more information.

## Kontak

Asep Haryana Saputra - [GitHub](https://github.com/mytheclipse)

Project Link: [https://github.com/mytheclipse/ZeaVis-Edu](https://github.com/mytheclipse/ZeaVis-Edu)