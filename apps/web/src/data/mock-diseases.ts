export const mockDiseases = [
  {
    id: "nlb",
    name: "Hawar Daun",
    slug: "hawar-daun",
    severity: "Tinggi",
    imageUrl: "https://via.placeholder.com/320x180?text=Hawar+Daun",
    pathogen: "Exserohilum turcicum",
    description:
      "Penyakit jamur yang menyebabkan lesi pada daun dan dapat menurunkan hasil panen.",
    symptoms: [
      "Lesi lonjong berbentuk cerutu, 2.5 - 15 cm",
      "Warna abu-kehijauan berkembang menjadi coklat -abu",
      "Nekrosis parah pada seluruh permukaan daun",
    ],
    prevention:
      "Gunakan varietas tahan, rotasi tanaman, dan hapus sisa tanaman terinfeksi.",
  },
  {
    id: "rust",
    name: "Karat Daun",
    slug: "karat-daun",
    imageUrl: "https://via.placeholder.com/320x180?text=Karat+Daun",
    pathogen: "Puccinia spp.",
    severity: "Sedang",
    description:
      "Pustulan oranye pada permukaan daun yang dapat mengurangi fotosintesis.",
    symptoms: [
      "Pustula oranye pada permukaan daun",
      "Daun menguning dan rontok pada serangan berat",
    ],
    prevention:
      "Hindari kelembapan tinggi, gunakan fungisida bila perlu, dan perbaiki sirkulasi udara.",
  },
  {
    id: "spot",
    name: "Bercak Abu-abu",
    slug: "bercak-abu-abu",
    imageUrl: "https://via.placeholder.com/320x180?text=Bercak+Abu-abu",
    pathogen: "Cercospora spp.",
    severity: "Rendah",
    description:
      "Bercak kecil berwarna abu-abu yang umumnya tidak menyebabkan kematian tanaman.",
    symptoms: [
      "Bercak kecil bundar hingga tidak beraturan",
      "Daun kering pada area bercak",
    ],
    prevention:
      "Praktek sanitasi, buang daun yang berat terinfeksi, dan pemantauan rutin.",
  },
  {
    id: "healthy",
    name: "Daun Sehat",
    slug: "daun-sehat",
    imageUrl: "https://via.placeholder.com/320x180?text=Daun+Sehat",
    severity: "Sehat",
    description: "Daun tanpa tanda penyakit.",
    symptoms: [],
    prevention: "-",
  },
];
