import os
import shutil
import zipfile
import json

# ==========================================
# KONFIGURASI DAN MAPPING
# ==========================================
DAFTAR_ZIP = ['dataset_1.zip', 'dataset_2.zip', 'dataset_3.zip']
TARGET_DIR = "dataset"

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

DAFTAR_FILE_HAPUS = [
    "CBS28.jpg",
    "Corn_Common_Rust (1275).jpg",
    "Corn_Common_Rust (1289).jpg",
    "Corn_Common_Rust (1295).jpg",
    "Corn_Gray_Spot (1).jpg"
]

# ==========================================
# TAHAP 1: EKSTRAKSI DATASET
# ==========================================
def ekstrak_semua_zip():
    print("--- TAHAP 1: Mengekstrak File ZIP ---")
    for zip_file in DAFTAR_ZIP:
        if os.path.exists(zip_file):
            folder_name = os.path.splitext(zip_file)[0]
            os.makedirs(folder_name, exist_ok=True)
            try:
                with zipfile.ZipFile(zip_file, 'r') as zip_ref:
                    zip_ref.extractall(folder_name)
                print(f"  [OK] {zip_file} -> {folder_name}/")
            except zipfile.BadZipFile:
                print(f"  [ERROR] {zip_file} rusak.")
        else:
            print(f"  [SKIP] File {zip_file} tidak ditemukan.")
    print("\n")

# ==========================================
# TAHAP 2: GABUNGKAN DATASET 1 & 2
# ==========================================
def cari_folder_ds2(base_path, keywords):
    if not os.path.exists(base_path): return None
    for f in os.listdir(base_path):
        f_lower = f.lower()
        if any(k in f_lower for k in keywords):
            return os.path.join(base_path, f)
    return None

def gabungkan_dataset_1_dan_2():
    print("--- TAHAP 2: Menggabungkan Dataset 1 & 2 ---")
    os.makedirs(TARGET_DIR, exist_ok=True)

    # 1. Salin dari dataset_1 
    folder_dari_ds1 = ["Bercak Daun", "Daun Sehat", "Hawar Daun"]
    for folder in folder_dari_ds1:
        src = os.path.join("dataset_1", folder)
        dst = os.path.join(TARGET_DIR, folder)
        if os.path.exists(src):
            shutil.copytree(src, dst, dirs_exist_ok=True)
            print(f"  [OK] Menyalin folder {src} ke {dst}")

    # 2. Salin gambar dari dataset_2
    base_ds2 = os.path.join("dataset_2", "data")
    mapping_ds2 = {
        ("common_rust", "commont_rust"): "Karat Daun",
        ("healthy",): "Daun Sehat"
    }

    if os.path.exists(base_ds2):
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
                print(f"  [OK] Menyalin {file_count} gambar dari {src_folder} ke {dst_folder}")
            else:
                print(f"  [SKIP] Folder untuk '{target_subfolder}' tidak ditemukan di {base_ds2}")
    print("\n")

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
        if f.lower() == target_lower or os.path.splitext(f)[0].lower() == os.path.splitext(target_lower)[0]:
            return os.path.join(folder_sumber, f)
    return None

def gabungkan_dataset_3():
    print("--- TAHAP 3: Menggabungkan Dataset 3 berdasarkan JSON ---")
    folder_data = os.path.join("dataset_3", "data")
    file_json = os.path.join("dataset_3", "desc.json")

    if not os.path.exists(file_json):
        print(f"  [SKIP] {file_json} tidak ditemukan.\n")
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

    print(f"  [OK] Berhasil merutekan {berhasil} gambar dari dataset_3 ke '{TARGET_DIR}'\n")

# ==========================================
# TAHAP 4: PEMBERSIHAN DATA (CLEANING)
# ==========================================
def bersihkan_dataset():
    print("--- TAHAP 4: Menghapus File Spesifik ---")
    set_hapus = set(DAFTAR_FILE_HAPUS)
    terhapus = 0

    if os.path.exists(TARGET_DIR):
        for root, _, files in os.walk(TARGET_DIR):
            for nama_file in files:
                if nama_file in set_hapus:
                    path_lengkap = os.path.join(root, nama_file)
                    try:
                        os.remove(path_lengkap)
                        print(f"  [TERHAPUS] {path_lengkap}")
                        set_hapus.remove(nama_file)
                        terhapus += 1
                    except Exception as e:
                        print(f"  [GAGAL] {path_lengkap} ({e})")
    
    print(f"  [OK] Total file dihapus: {terhapus}")
    if set_hapus:
        print(f"  [INFO] {len(set_hapus)} file tidak ditemukan (mungkin sudah terhapus sebelumnya):")
        for sisa in set_hapus:
            print(f"    - {sisa}")
    print("\n")

# ==========================================
# TAHAP 5: BUNGKUS KE ZIP
# ==========================================
def zip_dataset():
    print("--- TAHAP 5: Mengompresi Folder Dataset ---")
    if os.path.exists(TARGET_DIR):
        print(f"  Membuat file {TARGET_DIR}.zip, mohon tunggu sebentar...")
        # shutil.make_archive(nama_output_tanpa_ext, format, folder_yang_dizip)
        shutil.make_archive(TARGET_DIR, 'zip', TARGET_DIR)
        print(f"  [OK] Berhasil! File '{TARGET_DIR}.zip' sudah siap.\n")
    else:
        print(f"  [ERROR] Folder '{TARGET_DIR}' tidak ditemukan, proses zip dibatalkan.\n")


# ==========================================
# MAIN EXECUTION
# ==========================================
if __name__ == "__main__":
    print("=== MEMULAI PREPROCESSING DATASET ===\n")
    ekstrak_semua_zip()
    gabungkan_dataset_1_dan_2()
    gabungkan_dataset_3()
    bersihkan_dataset()
    zip_dataset()
    print("=== PREPROCESSING SELESAI ===")
    print(f"Dataset akhir Anda kini siap digunakan di dalam folder '{TARGET_DIR}' dan '{TARGET_DIR}.zip'.")