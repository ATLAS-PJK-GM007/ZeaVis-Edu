export const diseaseLabels = ['Bercak Daun', 'Hawar Daun', 'Karat Daun', 'Daun Sehat'] as const;
export type DiseaseLabel = (typeof diseaseLabels)[number];

export const diseaseSlugs = ['bercak-daun', 'hawar-daun', 'karat-daun', 'daun-sehat'] as const;
export type DiseaseSlug = (typeof diseaseSlugs)[number];

export const riskLevels = ['low', 'medium', 'high'] as const;
export type RiskLevel = (typeof riskLevels)[number];

export type DiseaseCatalogItem = {
  slug: DiseaseSlug;
  label: DiseaseLabel;
  commonName: string;
  summary: string;
  description: string;
  symptoms: string[];
  recommendations: string[];
  riskLevel: RiskLevel;
  accentColor: string;
  displayOrder: number;
};

export const diseaseCatalogSeed: DiseaseCatalogItem[] = [
  {
    slug: 'bercak-daun',
    label: 'Bercak Daun',
    commonName: 'Gray Leaf Spot',
    summary: 'Penyakit jamur yang menyebabkan bercak abu-abu pada daun jagung.',
    description:
      'Bercak Daun adalah penyakit jamur yang disebabkan oleh Cercospora zeae-maydis. Penyakit ini ditandai dengan munculnya bercak berbentuk persegi panjang berwarna abu-abu dengan tepi coklat pada daun jagung. Penyakit ini berkembang pesat dalam kondisi lembab dan dapat mengurangi hasil panen secara signifikan.',
    symptoms: [
      'Bercak berbentuk persegi panjang berwarna abu-abu',
      'Tepi bercak berwarna coklat atau merah',
      'Bercak biasanya muncul pada daun bagian bawah terlebih dahulu',
      'Dalam kondisi lembab, bercak dapat berkembang dengan cepat',
    ],
    recommendations: [
      'Gunakan varietas jagung yang tahan terhadap penyakit ini',
      'Terapkan rotasi tanaman dengan tanaman non-inang',
      'Kurangi kelembaban dengan meningkatkan jarak tanam',
      'Aplikasikan fungisida jika diperlukan',
      'Buang sisa tanaman yang terinfeksi setelah panen',
    ],
    riskLevel: 'high',
    accentColor: '#9CA3AF',
    displayOrder: 1,
  },
  {
    slug: 'hawar-daun',
    label: 'Hawar Daun',
    commonName: 'Northern/Southern Leaf Blight',
    summary: 'Penyakit jamur yang menyebabkan hawar pada daun jagung dengan gejala bercak memanjang.',
    description:
      'Hawar Daun adalah penyakit jamur yang disebabkan oleh Exserohilum turcicum (Northern Leaf Blight) atau Bipolaris maydis (Southern Leaf Blight). Penyakit ini ditandai dengan munculnya bercak memanjang berwarna coklat atau abu-abu pada daun jagung. Penyakit ini dapat menyebabkan kerusakan daun yang parah dan mengurangi hasil panen.',
    symptoms: [
      'Bercak memanjang berwarna coklat atau abu-abu',
      'Bercak dapat mencapai panjang 10-15 cm',
      'Tepi bercak sering berwarna lebih gelap',
      'Dalam kondisi lembab, bercak dapat berkembang dengan cepat',
      'Daun dapat mati jika terinfeksi parah',
    ],
    recommendations: [
      'Gunakan varietas jagung yang tahan terhadap penyakit ini',
      'Terapkan rotasi tanaman dengan tanaman non-inang',
      'Kurangi kelembaban dengan meningkatkan jarak tanam',
      'Aplikasikan fungisida jika diperlukan',
      'Buang sisa tanaman yang terinfeksi setelah panen',
    ],
    riskLevel: 'high',
    accentColor: '#8B4513',
    displayOrder: 2,
  },
  {
    slug: 'karat-daun',
    label: 'Karat Daun',
    commonName: 'Common Rust',
    summary: 'Penyakit jamur yang menyebabkan pustula berwarna coklat kemerahan pada daun jagung.',
    description:
      'Karat Daun adalah penyakit jamur yang disebabkan oleh Puccinia sorghi. Penyakit ini ditandai dengan munculnya pustula kecil berwarna coklat kemerahan pada permukaan daun jagung. Penyakit ini berkembang dalam kondisi lembab dan dapat mengurangi hasil panen jika tidak dikendalikan.',
    symptoms: [
      'Pustula kecil berwarna coklat kemerahan pada permukaan daun',
      'Pustula biasanya muncul pada daun bagian bawah terlebih dahulu',
      'Dalam kondisi lembab, pustula dapat berkembang dengan cepat',
      'Daun dapat menjadi kuning dan mati jika terinfeksi parah',
    ],
    recommendations: [
      'Gunakan varietas jagung yang tahan terhadap penyakit ini',
      'Terapkan rotasi tanaman dengan tanaman non-inang',
      'Kurangi kelembaban dengan meningkatkan jarak tanam',
      'Aplikasikan fungisida jika diperlukan',
      'Buang sisa tanaman yang terinfeksi setelah panen',
    ],
    riskLevel: 'medium',
    accentColor: '#DC2626',
    displayOrder: 3,
  },
  {
    slug: 'daun-sehat',
    label: 'Daun Sehat',
    commonName: 'Healthy Leaf',
    summary: 'Daun jagung yang sehat tanpa tanda-tanda penyakit atau kerusakan.',
    description:
      'Daun Sehat menunjukkan kondisi daun jagung yang optimal tanpa adanya gejala penyakit jamur atau kerusakan lainnya. Daun yang sehat memiliki warna hijau cerah, tekstur normal, dan tidak menunjukkan bercak, pustula, atau tanda-tanda kerusakan lainnya.',
    symptoms: [
      'Warna daun hijau cerah dan seragam',
      'Tekstur daun normal dan tidak ada bercak',
      'Tidak ada pustula atau tanda-tanda penyakit lainnya',
      'Daun terlihat kuat dan tidak layu',
    ],
    recommendations: [
      'Pertahankan praktik budidaya yang baik',
      'Lakukan monitoring rutin untuk mendeteksi penyakit sejak dini',
      'Terapkan rotasi tanaman untuk menjaga kesehatan tanah',
      'Berikan nutrisi yang cukup untuk pertumbuhan optimal',
      'Jaga kelembaban tanah yang sesuai',
    ],
    riskLevel: 'low',
    accentColor: '#22C55E',
    displayOrder: 4,
  },
];

export function isDiseaseSlug(value: string): value is DiseaseSlug {
  return diseaseSlugs.includes(value as DiseaseSlug);
}

export function getDiseaseBySlug(slug: string): DiseaseCatalogItem | undefined {
  return diseaseCatalogSeed.find((item) => item.slug === slug);
}
