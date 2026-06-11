# 📊 Laporan Perubahan — `ddced09` → `8137057` (HEAD)

**Periode:** 11 Juni 2026, 15:17 — 19:42 UTC  
**Branch:** `main`  
**Total commit:** 6 (ddced09 tidak termasuk, itu adalah base)

---

## 📜 Daftar Commit

| # | Hash | Tanggal | Deskripsi |
|---|------|---------|-----------|
| 1 | `b83b2e1` | 15:18 | **feat**: download dataset dari Google Drive saat running locally |
| 2 | `7a7e5b5` | 15:19 | **fix**: update Google Drive file ID ke link dataset yang benar |
| 3 | `8c65e33` | 16:31 | **chore**: clear notebook outputs dan tambah `.gitignore` |
| 4 | `c733f3b` | 16:39 | *WIP commit* |
| 5 | `4377be1` | 16:49 | **chore**: update notebook execution count dan outputs |
| 6 | `8137057` | 19:42 | *WIP commit — hasil kerja sesi Hugging Face integration* |

---

## 📁 File yang Berubah (dari `ddced09` → HEAD)

| File | Perubahan | Keterangan |
|------|-----------|------------|
| `Machine_Learning/notebook.ipynb` | +3,857/-348 | Notebook dual-compatible (Colab + local), section 1–18 lengkap |
| `Machine_Learning/.gitignore` | +19 (new) | Ignore `dataset/`, `dataset_split/`, `best_model/`, `model/`, dll |
| `Machine_Learning/requirements.txt` | +2 | Tambah `gdown` + `huggingface_hub` |
| `Machine_Learning/save_model.py` | 1 line | Fix: `sigmoid` → `softmax` di output layer |
| `Machine_Learning/upload_hf.py` | +258 (new) | Script export pipeline + upload ke Hugging Face |
| `model/model.tflite` | binary | Regenerated (softmax fix) |
| `model/saved_model/` | binary | Regenerated |

**Total:** 9 file, +3,792 insertions, -348 deletions

---

## 🔍 Detail Perubahan per Area

### 1. Dataset Download (`b83b2e1`, `7a7e5b5`)

- Tambah dependency `gdown` ke `requirements.txt`
- Notebook sekarang auto-download dataset dari Google Drive (`file_id: 1s0H2l...`) saat running locally jika file ZIP belum ada
- Colab path tetap pakai `drive.mount()`
- Drive file ID diupdate di commit `7a7e5b5`

### 2. Notebook Restructuring (`ddced09` → `8c65e33` → `4377be1`)

- Notebook direstruktur dari numbering 1/2/4 menjadi section bernomor rapi 1–17 (kemudian 18)
- Semua section punya header markdown yang deskriptif
- Hyperparameter (seed, IMG_SIZE, BATCH_SIZE) ditambahkan
- Import diperluas: `AdamW`, `compute_class_weight`, `preprocess_input`, `Counter`, `random`
- Mixed precision policy `float32` eksplisit
- Cell outputs cleared di commit `8c65e33`
- Execution count dan outputs diupdate di `4377be1`

### 3. `.gitignore` (`8c65e33`)

File baru `Machine_Learning/.gitignore` mengabaikan:
- `dataset/`, `dataset_split/`, `dataset_jagung.zip`
- `best_model/`, `model/`
- Path development lainnya (`node_modules/`, `.bun/`, `.moon/cache/`, `.env`, `dist/`, `build/`, `coverage/`, `venv/`, `.claude/`, dll)

### 4. `save_model.py` Fix (`8137057`)

```diff
-    outputs = layers.Dense(num_classes, activation='sigmoid', dtype='float32')(x)
+    outputs = layers.Dense(num_classes, activation='softmax', dtype='float32')(x)
```

Perbaikan kritis: output 4 kelas harus softmax, bukan sigmoid.

### 5. Hugging Face Upload (`8137057`) 🔥 **Fitur Baru**

**`Machine_Learning/upload_hf.py`** — 258 lines script mandiri:

```
Pipeline:
  save_model.py → convert_onnx.py → TFJS converter (optional)
  → labels.json + README.md
  → upload ke Hugging Face Hub
```

- Repo: `MythEclipse2737/corn-leaf-disease-classifier`
- Auth via `HF_TOKEN` env var
- TFJS conversion graceful-fail (protobuf version conflict known)
- Upload semua: `best_model.keras` (213MB) + TFLite + ONNX + SavedModel + TFJS (partial) + labels.json + README.md
- **Hasil:** 11 files terupload ke https://huggingface.co/MythEclipse2737/corn-leaf-disease-classifier

**Notebook Section 18** — cell markdown + code untuk call `upload_hf.py` otomatis.

---

## 📈 Working Tree (Uncommitted Changes)

Saat ini **tidak ada uncommitted changes** — `8137057` adalah commit terakhir yang mencakup semua hasil kerja.

---

## ✅ Ringkasan Outcome

| Goal | Status |
|------|--------|
| Notebook dual-compatible (Colab + local) | ✅ |
| Auto-download dataset dari Google Drive | ✅ |
| `.gitignore` untuk artifacts besar | ✅ |
| Fix `sigmoid` → `softmax` | ✅ |
| Hugging Face integration (upload script + notebook section) | ✅ |
| Model artifacts uploaded to HF Hub | ✅ 11 files |
| Temporarily pinned to `MythEclipse2737/` namespace | ⚠️ not `zeavis-edu/` (no org access) |

### Files on Hugging Face

```
MythEclipse2737/corn-leaf-disease-classifier
├── .gitattributes
├── README.md
├── best_model.keras              (213 MB)
├── model/
│   ├── labels.json
│   ├── model.onnx
│   ├── model.tflite
│   ├── saved_model/
│   │   ├── fingerprint.pb
│   │   ├── saved_model.pb
│   │   └── variables/
│   │       ├── variables.data-00000-of-00001
│   │       └── variables.index
│   └── tfjs_model/
│       └── model.json             (partial — no weight shards)
```

---

## ⚠️ Catatan

1. **TFJS converter gagal** karena protobuf version mismatch (`tensorflow_decision_forests` → `yggdrasil_decision_forests`). Model TF.js di HF hanya berisi `model.json` (metadata saja, tidak ada weight shards). Issue ini pre-existing dan tidak blocking.
2. **HF repo namespace**: pakai `MythEclipse2737/` karena token tidak punya write access ke `zeavis-edu/` org.
3. **Token HF terekspos** di chat — perlu di-rotate di https://huggingface.co/settings/tokens.
