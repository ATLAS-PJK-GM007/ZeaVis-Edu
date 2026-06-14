import os
import shutil
import zipfile
import json
import logging
import tempfile
from pathlib import Path
from PIL import Image, UnidentifiedImageError

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ==========================================
# KONFIGURASI DAN MAPPING
# ==========================================
DAFTAR_ZIP = ['dataset_1.zip', 'dataset_2.zip', 'dataset_3.zip']
TARGET_DIR = "dataset"

# Kaggle dataset paths (untuk auto-download)
KAGGLE_DS1 = "ndisan/corn-leaf-disease"
KAGGLE_DS2 = "smaranjitghose/corn-or-maize-leaf-disease-dataset"

# Google Drive file ID for dataset_3 fallback (SciDB via alternative host)
DS3_GDRIVE_ID = None  # Replace with known ID if available

PEMETAAN_KATEGORI = {
    "大斑病": "Hawar Daun",
    "小斑病": "Hawar Daun",
    "褐斑病": "Bercak Daun",
    "弯孢霉叶斑病": "Bercak Daun",
    "圆斑病": "Bercak Daun",
    "灰斑病": "Bercak Daun",
    "南方锈病": "Karat Daun",
    "普通锈病": "Karat Daun",
}

# Known-corrupt images (empty/broken JPEG headers)
DAFTAR_FILE_HAPUS = [
    "CBS28.jpg",
    "Corn_Common_Rust (1275).jpg",
    "Corn_Common_Rust (1289).jpg",
    "Corn_Common_Rust (1295).jpg",
    "Corn_Gray_Spot (1).jpg"
]

MIN_WIDTH, MIN_HEIGHT = 32, 32
MAX_ASPECT_RATIO = 5.0
MIN_FILE_SIZE = 512


# ==========================================
# TAHAP 0: DOWNLOAD DATASET OTOMATIS
# ==========================================
def _download_kagglehub(ref, zip_name, timeout=120):
    """Download dataset via kagglehub with a timeout to prevent hanging."""
    import multiprocessing
    log.info(f"  Downloading {ref} via kagglehub (timeout={timeout}s)...")

    def _do_download(q):
        try:
            import kagglehub
            path = kagglehub.dataset_download(ref)
            q.put(("ok", path))
        except Exception as e:
            q.put(("err", str(e)))

    q = multiprocessing.Queue()
    p = multiprocessing.Process(target=_do_download, args=(q,))
    p.start()
    p.join(timeout)

    if p.is_alive():
        p.terminate()
        p.join()
        log.warning(f"  [FAIL] {ref} download timed out after {timeout}s.")
        return None

    status, val = q.get()
    if status != "ok":
        log.warning(f"  [FAIL] {ref} download failed: {val}")
        return None

    path = val
    # Pack into ZIP for extraction step
    try:
        shutil.make_archive(zip_name.replace('.zip', ''), 'zip', path)
        log.info(f"  [OK] {ref} -> {zip_name}")
        return True
    except Exception as e:
        log.warning(f"  [FAIL] Could not pack {path} into {zip_name}: {e}")
        return None


def download_dataset_1():
    """Download dataset_1 (ndisan/corn-leaf-disease) from Kaggle."""
    try:
        import kagglehub
    except ImportError:
        log.warning("  [SKIP] kagglehub not installed. Install: pip install kagglehub")
        return None
    return _download_kagglehub("ndisan/corn-leaf-disease", "dataset_1.zip")


def download_dataset_2():
    """Download dataset_2 (smaranjitghose/corn-or-maize-leaf-disease-dataset) from Kaggle."""
    try:
        import kagglehub
    except ImportError:
        log.warning("  [SKIP] kagglehub not installed. Install: pip install kagglehub")
        return None
    return _download_kagglehub("smaranjitghose/corn-or-maize-leaf-disease-dataset", "dataset_2.zip")


def download_dataset_3():
    """Download dataset_3 (SciDB China Agricultural Dataset).

    Attempt: Kaggle alternative host, then Google Drive, then warn.
    If all fail, user must download manually from SciDB.
    """
    # Try Kaggle alternative (if available)
    KAGGLE_DS3 = "disease-identification/corn-leaf-disease-chinese"  # not guaranteed
    try:
        import kagglehub
        path = kagglehub.dataset_download(KAGGLE_DS3)
        log.info(f"  [OK] dataset_3 downloaded from Kaggle mirror to {path}")
        return path
    except Exception:
        pass

    log.warning("  [SKIP] dataset_3 could not be downloaded automatically.")
    log.warning("  Please download manually from:")
    log.warning("    https://www.scidb.cn/en/detail?dataSetId=19536c73f6d74946a212719a94f53ab3")
    return None


def download_dataset(zip_name, download_fn):
    """Attempt auto-download if ZIP doesn't exist locally."""
    if os.path.exists(zip_name):
        log.info(f"  [CACHE] {zip_name} already exists, skipping download.")
        return True
    log.info(f"--- Downloading {zip_name} ---")
    result = download_fn()
    if not result:  # None or False
        return False
    return True


# ==========================================
# TAHAP 1: EKSTRAKSI DATASET
# ==========================================
def ekstrak_semua_zip():
    log.info("--- TAHAP 1: Mengekstrak File ZIP ---")
    for zip_file in DAFTAR_ZIP:
        if os.path.exists(zip_file):
            folder_name = os.path.splitext(zip_file)[0]
            os.makedirs(folder_name, exist_ok=True)
            try:
                with zipfile.ZipFile(zip_file, 'r') as zip_ref:
                    zip_ref.extractall(folder_name)
                log.info(f"  [OK] {zip_file} -> {folder_name}/")
            except zipfile.BadZipFile:
                log.error(f"  [ERROR] {zip_file} rusak.")
        else:
            log.warning(f"  [SKIP] File {zip_file} tidak ditemukan. Beberapa kelas mungkin kosong.")


# ==========================================
# TAHAP 2: GABUNGKAN DATASET 1 & 2
# ==========================================
def cari_folder_ds2(base_path, keywords):
    if not os.path.exists(base_path):
        return None
    for f in os.listdir(base_path):
        f_lower = f.lower()
        if any(k in f_lower for k in keywords):
            return os.path.join(base_path, f)
    return None


def gabungkan_dataset_1_dan_2():
    log.info("--- TAHAP 2: Menggabungkan Dataset 1 & 2 ---")
    os.makedirs(TARGET_DIR, exist_ok=True)

    # 1. Salin dari dataset_1
    folder_dari_ds1 = ["Bercak Daun", "Daun Sehat", "Hawar Daun"]
    for folder in folder_dari_ds1:
        src = os.path.join("dataset_1", folder)
        dst = os.path.join(TARGET_DIR, folder)
        if os.path.exists(src):
            shutil.copytree(src, dst, dirs_exist_ok=True)
            log.info(f"  [OK] Menyalin folder {src} ke {dst}")

    # 2. Dataset 2 — cari subfolder yang cocok
    if os.path.exists("dataset_2"):
        # Cari folder data/ atau folder langsung
        base_ds2 = "dataset_2"
        # Check for nested structure (Kaggle download structure varies)
        data_sub = os.path.join(base_ds2, "data")
        if os.path.exists(data_sub):
            base_ds2 = data_sub

        mapping_ds2 = {
            ("common_rust", "commont_rust"): "Karat Daun",
            ("healthy",): "Daun Sehat"
        }

        for keywords, target_subfolder in mapping_ds2.items():
            src_folder = cari_folder_ds2(base_ds2, keywords)
            dst_folder = os.path.join(TARGET_DIR, target_subfolder)
            os.makedirs(dst_folder, exist_ok=True)

            if src_folder and os.path.exists(src_folder):
                file_count = 0
                for file_name in os.listdir(src_folder):
                    full_file_name = os.path.join(src_folder, file_name)
                    if os.path.isfile(full_file_name):
                        shutil.copy(full_file_name, dst_folder)
                        file_count += 1
                log.info(f"  [OK] Menyalin {file_count} gambar dari {src_folder} ke {dst_folder}")
            else:
                log.warning(f"  [SKIP] Folder untuk '{target_subfolder}' tidak ditemukan di dataset_2")
    else:
        log.warning("  [SKIP] Folder dataset_2/ tidak ada, dataset_2 tidak diproses.")


# ==========================================
# TAHAP 3: GABUNGKAN DATASET 3 (JSON MAPPING)
# ==========================================
def cari_gambar_fleksibel(folder_sumber, nama_file_target):
    nama_file_target = nama_file_target.strip()
    path_langsung = os.path.join(folder_sumber, nama_file_target)
    if os.path.exists(path_langsung):
        return path_langsung

    target_lower = nama_file_target.lower()
    for f in os.listdir(folder_sumber):
        if (f.lower() == target_lower
                or os.path.splitext(f)[0].lower() == os.path.splitext(target_lower)[0]):
            return os.path.join(folder_sumber, f)
    return None


def gabungkan_dataset_3():
    log.info("--- TAHAP 3: Menggabungkan Dataset 3 berdasarkan JSON ---")
    folder_data = os.path.join("dataset_3", "data")
    file_json = os.path.join("dataset_3", "desc.json")

    if not os.path.exists(file_json):
        log.warning(f"  [SKIP] {file_json} tidak ditemukan. Dataset 3 dilewati.")
        return

    with open(file_json, 'r', encoding='utf-8') as f:
        data_label = json.load(f)

    berhasil = 0
    for item in data_label:
        image_name = item.get("image_name")
        label = item.get("label", "").strip()

        if image_name and label in PEMETAAN_KATEGORI:
            nama_folder_target = PEMETAAN_KATEGORI[label]
            folder_tujuan = os.path.join(TARGET_DIR, nama_folder_target)
            os.makedirs(folder_tujuan, exist_ok=True)

            path_sumber = cari_gambar_fleksibel(folder_data, image_name)
            if path_sumber:
                nama_asli = os.path.basename(path_sumber)
                shutil.copy(path_sumber, os.path.join(folder_tujuan, nama_asli))
                berhasil += 1

    log.info(f"  [OK] Berhasil merutekan {berhasil} gambar dari dataset_3 ke '{TARGET_DIR}'")


# ==========================================
# TAHAP 4: PEMBERSIHAN DATA (CLEANING)
# ==========================================
def bersihkan_dataset():
    log.info("--- TAHAP 4: Menghapus File Bermasalah ---")
    set_hapus = set(DAFTAR_FILE_HAPUS)
    terhapus = 0

    if os.path.exists(TARGET_DIR):
        for root, _, files in os.walk(TARGET_DIR):
            for nama_file in files:
                if nama_file in set_hapus:
                    path_lengkap = os.path.join(root, nama_file)
                    try:
                        os.remove(path_lengkap)
                        log.info(f"  [TERHAPUS] {path_lengkap}")
                        set_hapus.discard(nama_file)
                        terhapus += 1
                    except Exception as e:
                        log.warning(f"  [GAGAL] {path_lengkap} ({e})")

    log.info(f"  [OK] Total file spesifik dihapus: {terhapus}")
    if set_hapus:
        log.info(f"  [INFO] {len(set_hapus)} file tidak ditemukan (mungkin sudah terhapus sebelumnya)")
        for sisa in set_hapus:
            log.info(f"    - {sisa}")


# ==========================================
# TAHAP 5: HAPUS AUGMENTED DUPLICATES
# ==========================================
def hapus_augmented_duplicates():
    """Remove pre-augmented duplicates (augmented_* files)."""
    log.info("--- TAHAP 5: Menghapus Augmented Duplicates ---")
    removed = 0
    if not os.path.exists(TARGET_DIR):
        log.warning("  [SKIP] Dataset folder tidak ditemukan.")
        return

    for root, _, files in os.walk(TARGET_DIR):
        for nama_file in files:
            if nama_file.startswith("augmented_"):
                path_file = os.path.join(root, nama_file)
                try:
                    os.remove(path_file)
                    removed += 1
                except Exception as e:
                    log.warning(f"  [GAGAL] {path_file} ({e})")

    log.info(f"  [OK] {removed} augmented_* files dihapus.")


# ==========================================
# TAHAP 6: CORRUPT & INVALID IMAGE DETECTION
# ==========================================
def validasi_gambar():
    log.info("--- TAHAP 6: Validasi & Deteksi Gambar Rusak ---")
    dihapus_total = 0
    stat_count = {
        "too_small_file": 0,
        "cannot_open": 0,
        "too_small_dims": 0,
        "extreme_aspect": 0,
    }

    if not os.path.exists(TARGET_DIR):
        log.warning("  [SKIP] Dataset folder tidak ditemukan.")
        return

    for root, _, files in os.walk(TARGET_DIR):
        for nama_file in files:
            path_file = os.path.join(root, nama_file)

            try:
                file_size = os.path.getsize(path_file)
                if file_size < MIN_FILE_SIZE:
                    os.remove(path_file)
                    dihapus_total += 1
                    stat_count["too_small_file"] += 1
                    log.info(f"  [HAPUS-small] {path_file} ({file_size} bytes)")
                    continue
            except OSError:
                continue

            try:
                img = Image.open(path_file)
                img.verify()
            except (UnidentifiedImageError, OSError, SyntaxError):
                try:
                    os.remove(path_file)
                    dihapus_total += 1
                    stat_count["cannot_open"] += 1
                    log.info(f"  [HAPUS-corrupt] {path_file}")
                except OSError:
                    pass
                continue

            try:
                img = Image.open(path_file)
                w, h = img.size
                if w < MIN_WIDTH or h < MIN_HEIGHT:
                    os.remove(path_file)
                    dihapus_total += 1
                    stat_count["too_small_dims"] += 1
                    log.info(f"  [HAPUS-dims] {path_file} ({w}x{h})")
                    continue

                aspect = w / max(h, 1)
                if aspect > MAX_ASPECT_RATIO or aspect < (1.0 / MAX_ASPECT_RATIO):
                    os.remove(path_file)
                    dihapus_total += 1
                    stat_count["extreme_aspect"] += 1
                    log.info(f"  [HAPUS-aspect] {path_file} ({w}x{h}, ar={aspect:.2f})")
                    continue

                if img.mode not in ('RGB', 'RGBA'):
                    img = img.convert('RGB')
                    img.save(path_file)
            except Exception:
                try:
                    os.remove(path_file)
                    dihapus_total += 1
                    stat_count["cannot_open"] += 1
                    log.info(f"  [HAPUS-exc] {path_file}")
                except OSError:
                    pass

    log.info(f"  [OK] Total dihapus: {dihapus_total}")
    for reason, count in stat_count.items():
        if count > 0:
            log.info(f"    {reason}: {count}")


# ==========================================
# TAHAP 7: PERCEPTUAL HASH DEDUPLICATION
# ==========================================
def deteksi_duplikat_perceptual():
    try:
        import imagehash
    except ImportError:
        log.info("--- TAHAP 7: Deteksi Duplikat (SKIP - imagehash not installed) ---")
        log.info("  Install with: pip install imagehash")
        return

    log.info("--- TAHAP 7: Deteksi Duplikat Perceptual Hash ---")
    THRESHOLD = 5
    if not os.path.exists(TARGET_DIR):
        log.warning("  [SKIP] Dataset folder tidak ditemukan.")
        return

    seen_hashes = {}
    removed = 0
    scanned = 0

    for class_name in sorted(os.listdir(TARGET_DIR)):
        class_path = os.path.join(TARGET_DIR, class_name)
        if not os.path.isdir(class_path):
            continue
        for nama_file in sorted(os.listdir(class_path)):
            path_file = os.path.join(class_path, nama_file)
            if not os.path.isfile(path_file):
                continue
            scanned += 1
            try:
                img = Image.open(path_file).convert('RGB')
                ahash = imagehash.average_hash(img)
                ahash_hex = str(ahash)
                is_dup = False
                for seen_hex, (seen_path, seen_class) in seen_hashes.items():
                    seen_hash = imagehash.hex_to_hash(seen_hex)
                    if ahash - seen_hash <= THRESHOLD:
                        try:
                            os.remove(path_file)
                            removed += 1
                            is_dup = True
                            log.info(f"  [DUP] {path_file} ~ {seen_path} (dist={ahash - seen_hash})")
                            break
                        except OSError:
                            pass
                if not is_dup:
                    seen_hashes[ahash_hex] = (path_file, class_name)
            except Exception:
                pass

    log.info(f"  [OK] Scanned {scanned}, removed {removed} near-duplicates (threshold={THRESHOLD}).")


# ==========================================
# TAHAP 8: BUNGKUS KE ZIP
# ==========================================
def zip_dataset():
    log.info("--- TAHAP 8: Mengompresi Folder Dataset ---")
    if os.path.exists(TARGET_DIR):
        log.info(f"  Membuat file {TARGET_DIR}.zip, mohon tunggu sebentar...")
        shutil.make_archive(TARGET_DIR, 'zip', TARGET_DIR)
        log.info(f"  [OK] Berhasil! File '{TARGET_DIR}.zip' sudah siap.")
    else:
        log.error(f"  [ERROR] Folder '{TARGET_DIR}' tidak ditemukan, proses zip dibatalkan.")


# ==========================================
# MAIN EXECUTION
# ==========================================
if __name__ == "__main__":
    log.info("=== MEMULAI PREPROCESSING DATASET ===")

    # Auto-download if ZIPs missing
    download_dataset("dataset_1.zip", download_dataset_1)
    download_dataset("dataset_2.zip", download_dataset_2)
    download_dataset("dataset_3.zip", download_dataset_3)

    ekstrak_semua_zip()
    gabungkan_dataset_1_dan_2()
    gabungkan_dataset_3()
    bersihkan_dataset()
    hapus_augmented_duplicates()
    validasi_gambar()
    deteksi_duplikat_perceptual()
    zip_dataset()

    log.info("=== PREPROCESSING SELESAI ===")

    if os.path.exists(TARGET_DIR):
        total = 0
        for class_name in sorted(os.listdir(TARGET_DIR)):
            class_path = os.path.join(TARGET_DIR, class_name)
            if os.path.isdir(class_path):
                count = len([f for f in os.listdir(class_path) if os.path.isfile(os.path.join(class_path, f))])
                total += count
                log.info(f"  {class_name}: {count} images")
        log.info(f"  TOTAL: {total} images")
