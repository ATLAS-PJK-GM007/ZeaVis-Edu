# Corn Leaf Disease Classification

Pipeline lengkap untuk klasifikasi penyakit daun jagung menggunakan **EfficientNetV2B0**, mulai dari persiapan dataset, pelatihan di Google Colab, hingga ekspor model ke format **TFLite** dan **TensorFlow.js** untuk kebutuhan produksi.

---

## Daftar Isi

1. [Kelas yang Diklasifikasikan](#1-kelas-yang-diklasifikasikan)
2. [Struktur Proyek](#2-struktur-proyek)
3. [Prasyarat & Instalasi](#3-prasyarat--instalasi)
4. [Sumber Dataset](#4-sumber-dataset)
5. [Tahap 1 — Preprocessing Lokal](#5-tahap-1--preprocessing-lokal)
6. [Tahap 2 — Upload ke Google Drive & Training di Colab](#6-tahap-2--upload-ke-google-drive--training-di-colab)
7. [Tahap 3 — Download Model dari Colab](#7-tahap-3--download-model-dari-colab)
8. [Tahap 4 — Ekspor Model untuk Produksi](#8-tahap-4--ekspor-model-untuk-produksi)
9. [Validasi Parity ONNX (Opsional)](#9-validasi-parity-onnx-opsional)
10. [Output Akhir](#10-output-akhir)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Kelas yang Diklasifikasikan

Model dilatih untuk mengenali **4 kelas** kondisi daun jagung:

| Label (Bahasa Indonesia) | Deskripsi |
|---|---|
| **Bercak Daun** | *Gray Leaf Spot* — bercak abu-abu memanjang pada daun |
| **Hawar Daun** | *Northern/Southern Leaf Blight* — hawar coklat berbentuk panjang |
| **Karat Daun** | *Common Rust* — bintik coklat kemerahan berbentuk pustula |
| **Daun Sehat** | Daun jagung tanpa gejala penyakit |

---

## 2. Struktur Proyek

```
.
├── dataset_1.zip             # File ZIP dataset 1 (dari Kaggle)
├── dataset_2.zip             # File ZIP dataset 2 (dari Kaggle)
├── dataset_3.zip             # File ZIP dataset 3 (dari SciDB)
│
├── preprocessing.py          # Skrip persiapan & penggabungan dataset
├── notebook.ipynb            # Notebook pelatihan (dijalankan di Google Colab)
├── save_model.py             # Skrip ekspor model ke TFLite & TensorFlow.js
│
├── best_model/
│   └── best_model.keras      # Model hasil training terbaik (diunduh dari Colab)
│
├── model/                    # Output ekspor (dibuat otomatis)
│   ├── saved_model/          # Format SavedModel TensorFlow
│   ├── tfjs_model/           # Format TensorFlow.js
│   └── model.tflite          # Format TFLite untuk Mobile
│
├── requirements.txt          # Daftar dependensi Python
└── README.md
```

---

## 3. Prasyarat & Instalasi

### Kebutuhan Sistem
- Python **3.9 – 3.11**
- Akun **Google** (untuk Google Drive & Google Colab)
- Akun **Kaggle** (untuk mengunduh dataset)
- Koneksi internet

### Instalasi Dependensi

Disarankan menggunakan virtual environment:

```bash
# Buat environment baru (opsional tapi dianjurkan)
python -m venv venv
source venv/bin/activate       # Linux / macOS
# venv\Scripts\activate        # Windows

# Instal semua dependensi
pip install -r requirements.txt
```

---

## 4. Sumber Dataset

Proyek ini menggabungkan **3 dataset** dari sumber berbeda untuk menghasilkan data yang lebih beragam dan representatif.

### Dataset 1 — Kaggle (Corn Leaf Disease - Indonesia)
> 🔗 https://www.kaggle.com/datasets/ndisan/corn-leaf-disease

Berisi gambar penyakit daun jagung dengan label dalam Bahasa Indonesia. Dataset ini memiliki **4 folder**, namun label **"Karat Daun" tidak digunakan** karena gambar di dalamnya tidak merepresentasikan penyakit karat yang sebenarnya.

| Folder di Dataset 1 | Tindakan |
|---|---|
| `Bercak Daun/` | Digunakan |
| `Hawar Daun/` | Digunakan |
| `Daun Sehat/` | Digunakan (sebagai tambahan) |
| `Karat Daun/` | **Dibuang** — data tidak representatif |

### Dataset 2 — Kaggle (Corn or Maize Leaf Disease)
> 🔗 https://www.kaggle.com/datasets/smaranjitghose/corn-or-maize-leaf-disease-dataset

Digunakan untuk **menggantikan** data Karat Daun dari Dataset 1 dan menambah variasi gambar Daun Sehat.

| Folder di Dataset 2 | Dipetakan ke Label |
|---|---|
| `Common_Rust/` | **Karat Daun** |
| `Healthy/` | **Daun Sehat** (tambahan) |
| `Blight/` | Tidak diproses |
| `Gray_Leaf_Spot/` | Tidak diproses |

### Dataset 3 — SciDB (China Agricultural Dataset)
> 🔗 https://www.scidb.cn/en/detail?dataSetId=19536c73f6d74946a212719a94f53ab3

Dataset dengan label berbahasa Mandarin. Digunakan untuk **menambah variasi data** pada tiga kelas utama. Pemetaan label dilakukan menggunakan file `desc.json` yang disertakan dalam dataset.

| Label Mandarin | Dipetakan ke Label |
|---|---|
| `大斑病` (Hawar Besar) | **Hawar Daun** |
| `小斑病` (Hawar Kecil) | **Hawar Daun** |
| `褐斑病` (Bercak Coklat) | **Bercak Daun** |
| `弯孢霉叶斑病` (Bercak Curvularia) | **Bercak Daun** |
| `圆斑病` (Bercak Bulat) | **Bercak Daun** |
| `灰斑病` (Bercak Abu-abu) | **Bercak Daun** |
| `南方锈病` (Karat Selatan) | **Karat Daun** |
| `普通锈病` (Karat Biasa) | **Karat Daun** |

---

## 5. Tahap 1 — Preprocessing Lokal

Skrip `preprocessing.py` menjalankan **5 tahap** secara berurutan untuk menyiapkan dataset akhir yang siap diunggah ke Google Drive.

### Persiapan

Unduh ketiga dataset dari sumber di atas, lalu letakkan file ZIP-nya di direktori yang sama dengan `preprocessing.py`:

```
.
├── preprocessing.py
├── dataset_1.zip
├── dataset_2.zip
└── dataset_3.zip
```

### Menjalankan Preprocessing

```bash
python preprocessing.py
```

### Alur Kerja Otomatis

#### Tahap 1 — Ekstraksi ZIP
Mengekstrak ketiga file `.zip` menjadi folder masing-masing (`dataset_1/`, `dataset_2/`, `dataset_3/`).

#### Tahap 2 — Menggabungkan Dataset 1 & 2
- Menyalin folder `Bercak Daun`, `Hawar Daun`, dan `Daun Sehat` dari Dataset 1 ke folder `dataset/`.
- **Folder `Karat Daun` dari Dataset 1 dilewati** karena gambarnya tidak representatif.
- Mengambil gambar `Common_Rust` dari Dataset 2 → disimpan ke `dataset/Karat Daun/`.
- Mengambil gambar `Healthy` dari Dataset 2 → digabung ke `dataset/Daun Sehat/`.

#### Tahap 3 — Menggabungkan Dataset 3
- Membaca file `desc.json` dari Dataset 3 yang berisi pasangan nama gambar dan labelnya.
- Memetakan label Mandarin ke label target (lihat tabel di atas).
- Menyalin gambar yang relevan ke folder `dataset/` yang sesuai.

#### Tahap 4 — Pembersihan Data (Cleaning)
Menghapus file gambar spesifik yang bermasalah (rusak, duplikat, atau tidak relevan):
- `CBS28.jpg`
- `Corn_Common_Rust (1275).jpg`
- `Corn_Common_Rust (1289).jpg`
- `Corn_Common_Rust (1295).jpg`
- `Corn_Gray_Spot (1).jpg`

#### Tahap 5 — Kompresi ke ZIP
Mengemas seluruh folder `dataset/` menjadi `dataset.zip` yang siap diunggah ke Google Drive.

### Hasil Akhir Preprocessing

```
dataset/
├── Bercak Daun/    ← DS1 + DS3
├── Hawar Daun/     ← DS1 + DS3
├── Karat Daun/     ← DS2 (Common Rust) + DS3
└── Daun Sehat/     ← DS1 + DS2 (Healthy)

dataset.zip         ← File siap upload ke Google Drive
```

---

## 6. Tahap 2 — Upload ke Google Drive & Training di Colab

### Langkah 1: Upload `dataset.zip` ke Google Drive

1. Buka [Google Drive](https://drive.google.com) di browser.
2. Upload file `dataset.zip` ke lokasi yang mudah diingat, misalnya:
   ```
   My Drive/corn_disease/dataset.zip
   ```

### Langkah 2: Buka Notebook di Google Colab

1. Upload `notebook.ipynb` ke Google Drive, atau buka langsung dari Colab:
   - Klik kanan file `notebook.ipynb` di Google Drive → **"Open with"** → **Google Colaboratory**.
2. Aktifkan GPU: **Runtime** → **Change runtime type** → pilih **T4 GPU**.

### Langkah 3: Mount Google Drive di Colab

Di sel pertama notebook, jalankan:

```python
from google.colab import drive
drive.mount('/content/drive')
```

Ikuti instruksi autentikasi yang muncul.

### Langkah 4: Ekstrak Dataset di Colab

```python
import zipfile

zip_path = '/content/drive/MyDrive/corn_disease/dataset.zip'
extract_path = '/content/dataset'

with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(extract_path)

print("Dataset berhasil diekstrak!")
```

### Langkah 5: Jalankan Training

Jalankan seluruh sel di `notebook.ipynb` secara berurutan. Notebook akan melatih model `EfficientNetV2B0` dan menyimpan model terbaik secara otomatis ke:

```
/content/drive/MyDrive/corn_disease/best_model.keras
```

> **Tips:** Aktifkan **"Run all"** dan pantau grafik loss/accuracy. Proses training bisa memakan waktu 30–90 menit tergantung ukuran dataset dan kuota GPU Colab.

---

## 7. Tahap 3 — Download Model dari Colab

Setelah training selesai, unduh `best_model.keras` dari Google Drive ke komputer lokal.

### Opsi A: Unduh via Google Drive (Direkomendasikan)

1. Buka Google Drive → navigasi ke folder `corn_disease/`.
2. Klik kanan `best_model.keras` → **Download**.
3. Letakkan file yang diunduh ke folder `best_model/` di proyek lokal:
   ```
   best_model/best_model.keras
   ```

### Opsi B: Unduh Langsung dari Colab

Tambahkan sel berikut di akhir notebook, lalu jalankan:

```python
from google.colab import files
files.download('/content/drive/MyDrive/corn_disease/best_model.keras')
```

---

## 8. Tahap 4 — Ekspor Model untuk Produksi

Setelah `best_model/best_model.keras` tersedia di lokal, jalankan skrip ekspor.

### Persiapan Struktur Folder

Pastikan struktur direktori sudah benar:

```
.
├── best_model/
│   └── best_model.keras   ← File hasil unduhan dari Colab
└── save_model.py
```

### Langkah 1: Ekspor ke SavedModel & TFLite

```bash
python save_model.py
```

Skrip ini akan:
1. Memuat model dari `best_model/best_model.keras`.
2. Membangun ulang arsitektur **tanpa layer augmentasi** (wajib untuk kompatibilitas TFJS).
3. Menyalin semua bobot terlatih ke arsitektur baru.
4. Mengekspor ke `model/saved_model/` (format SavedModel).
5. Mengonversi ke `model/model.tflite` (format TFLite untuk Android/iOS).

### Langkah 2: Konversi ke TensorFlow.js (untuk Web/Browser)

Konversi TFJS **harus dilakukan via CLI**, bukan dari dalam Python, untuk menghindari konflik library Protobuf.

```bash
# Langkah 2a: Atur variabel lingkungan
export PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python

# Langkah 2b: Konversi
tensorflowjs_converter \
    --input_format=tf_saved_model \
    --output_format=tfjs_graph_model \
    --signature_name=serving_default \
    --saved_model_tags=serve \
    model/saved_model \
    model/tfjs_model
```

### Langkah 3: Konversi ke ONNX (untuk Rust ONNX Runtime)

Konversi SavedModel ke format ONNX untuk digunakan oleh layanan inferensi Rust:

```bash
python convert_onnx.py
```

Skrip ini akan:
1. Memuat model dari `model/saved_model/`.
2. Mengonversi ke format ONNX.
3. Menyimpan ke `model/model.onnx`.

Model ONNX ini digunakan oleh layanan inferensi Rust di `apps/ml-service/` untuk performa dan kompatibilitas lintas platform yang lebih baik.

---

## 9. Validasi Parity ONNX (Opsional)

Untuk memverifikasi bahwa model ONNX menghasilkan prediksi yang sama dengan SavedModel asli, jalankan:

```bash
python validate_onnx_parity.py /path/to/corn-leaf.jpg
```

Skrip ini akan membandingkan output prediksi antara SavedModel dan ONNX untuk memastikan keakuratan konversi. **Validasi ini bersifat manual dan direkomendasikan, bukan wajib untuk deployment.**

---

## 10. Output Akhir

Setelah seluruh pipeline selesai dijalankan, berikut file output yang tersedia:

| File / Direktori | Format | Kegunaan |
|---|---|---|
| `dataset/` | Folder gambar terstruktur | Dataset akhir hasil preprocessing |
| `dataset.zip` | ZIP | Dataset untuk diupload ke Google Drive / Colab |
| `best_model/best_model.keras` | Keras | Model terlatih lengkap (dengan optimizer) |
| `model/saved_model/` | SavedModel (PB) | Inferensi server-side & jembatan konversi TFJS/ONNX |
| `model/model.tflite` | TFLite | Inferensi di perangkat **Android / iOS** |
| `model/model.onnx` | ONNX | Inferensi server-side via **Rust ONNX Runtime** |
| `model/tfjs_model/` | TensorFlow.js | Inferensi di **browser / Node.js** |

---

## 11. Troubleshooting

### `FileNotFoundError: dataset_1.zip tidak ditemukan`
**Solusi:** Pastikan ketiga file ZIP sudah diunduh dan diletakkan di direktori yang sama dengan `preprocessing.py`.

---

### `FileNotFoundError: Model file not found at best_model/best_model.keras`
**Solusi:** Unduh `best_model.keras` dari Google Drive/Colab dan letakkan di folder `best_model/`. Pastikan nama filenya tepat.

---

### `ValueError: incompatible with expected resource` (saat konversi TFJS)
**Penyebab:** Layer augmentasi data Keras (`random_flip`, dll.) bersifat *stateful* dinamis dan tidak bisa dibekukan oleh konverter TFJS.

**Solusi:** Sudah ditangani otomatis oleh fungsi `build_clean_model()` dalam `save_model.py`, yang membangun ulang arsitektur tanpa layer augmentasi sebelum proses ekspor.

---

### `VersionError: Detected incompatible Protobuf Gencode/Runtime versions`
**Penyebab:** Konflik antara library C++ Protobuf yang dibawa oleh `tensorflow_decision_forests` dengan *runtime* Python di lingkungan virtual lokal.

**Solusi:** Pastikan konversi TFJS dijalankan via **CLI langsung** (bukan `subprocess` dari Python) dengan variabel lingkungan berikut:
```bash
export PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python
```

---

### Sesi Colab terputus saat training
**Solusi:** Gunakan callback `ModelCheckpoint` di notebook untuk menyimpan checkpoint secara berkala ke Google Drive, sehingga training bisa dilanjutkan dari checkpoint terakhir tanpa mengulang dari awal.