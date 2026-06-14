import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BookOpen,
  ShieldCheck,
  Pill,
  RefreshCcw,
  FlaskConical,
} from "lucide-react";
import { RiskBadge } from "./risk-badge";

type Props = {
  imageUrl: string;
  confidence: number; // contoh: 0.95
  diseaseName: string;
  scientificName: string;
  riskLevel: string;
  description: string;
  symptoms: string[];
  preventions: string[];
  medicines: string[];
  onRescan?: () => void;
};

export function DiagnosisResultView({
  imageUrl,
  confidence,
  diseaseName,
  scientificName,
  riskLevel,
  description,
  symptoms,
  preventions,
  medicines,
  onRescan,
}: Props) {
  const [openSection, setOpenSection] = useState<string>("detail");

  const getRiskLevelKey = (level: string): "low" | "medium" | "high" => {
    const normalized = level.toLowerCase();
    if (normalized.includes("rendah")) return "low";
    if (normalized.includes("tinggi")) return "high";
    return "medium";
  };

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? "" : section);
  };

  const confidencePercent = Math.round(confidence * 100);

  return (
    <div className="flex flex-col lg:flex-row gap-6 bg-[#FAFAF8] p-4 md:p-6 rounded-3xl">
      {/* Image Area & Result */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <img
            src={imageUrl}
            alt="Daun yang dianalisis"
            className="w-full h-48 md:h-64 object-cover rounded-xl"
          />
          <div className="mt-3 flex items-center gap-2 text-slate-500 text-sm px-1">
            <span className="w-4 h-4 bg-slate-200 rounded flex items-center justify-center text-[10px]">
              📷
            </span>
            Gambar yang dianalisis
          </div>
        </div>

        {/* Result Card */}
        <div className="bg-[#FCF9EE] border border-[#F2E5C5] p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-4">
            <AlertTriangle className="w-4 h-4" />
            HASIL DETEKSI ML
          </div>

          <h2 className="text-2xl font-extrabold text-[#D97706]">
            {diseaseName}
          </h2>
          <p className="text-slate-500 italic text-sm mb-6">{scientificName}</p>

          {/* Confidence Bar */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm font-bold text-slate-700">
              <span>Tingkat Keyakinan AI</span>
              <span className="text-emerald-600">{confidencePercent}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000"
                style={{ width: `${confidencePercent}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Di atas ambang batas minimum
              (75%)
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-amber-200/50">
            <span className="text-sm font-medium text-slate-600">
              Tingkat Keparahan:
            </span>
            <RiskBadge level={getRiskLevelKey(riskLevel ?? "medium")} />
          </div>
        </div>
      </div>

      {/* Education & References */}
      <div className="w-full lg:w-2/3 flex flex-col gap-4">
        {/* Rescan Button */}
        {onRescan && (
          <div className="flex justify-end mb-2">
            <button
              onClick={onRescan}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#214B11] text-[#214B11] rounded-full text-sm font-bold hover:bg-[#214B11] hover:text-white transition-all shadow-sm"
            >
              <RefreshCcw className="w-4 h-4" /> Scan Ulang
            </button>
          </div>
        )}

        {/* Detail Section */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div
            onClick={() => toggleSection("detail")}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
          >
            <div className="flex items-center gap-3 font-bold text-[#1E3A8A]">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-700" />
              </div>
              Detail Penyakit
            </div>
            {openSection === "detail" ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
          {openSection === "detail" && (
            <div className="p-4 pt-0 border-t border-slate-100 text-sm text-slate-600 leading-relaxed">
              <p className="mb-4">{description}</p>
              <h5 className="font-bold text-[#214B11] mb-2">Gejala Umum:</h5>
              <ul className="space-y-1 pl-4 list-disc marker:text-emerald-500">
                {symptoms.map((sym, i) => (
                  <li key={i}>{sym}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Prevention Section */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div
            onClick={() => toggleSection("cegah")}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
          >
            <div className="flex items-center gap-3 font-bold text-[#1E40AF]">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
              </div>
              Panduan Pencegahan
            </div>
            {openSection === "cegah" ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
          {openSection === "cegah" && (
            <div className="p-4 pt-0 border-t border-slate-100 text-sm text-slate-600">
              <ul className="space-y-2">
                {preventions.map((prev, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{" "}
                    <span>{prev}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Medicine Section */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div
            onClick={() => toggleSection("obat")}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50"
          >
            <div className="flex items-center gap-3 font-bold text-[#6B21A8]">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Pill className="w-4 h-4 text-purple-700" />
              </div>
              Rekomendasi Obat
            </div>
            {openSection === "obat" ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
          {openSection === "obat" && (
            <div className="p-4 pt-0 border-t border-slate-100 text-sm text-slate-600">
              <ul className="space-y-2">
                {medicines.map((med, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <FlaskConical className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />{" "}
                    <span>{med}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 mt-2">
          <div className="flex items-center gap-2 text-amber-600 font-bold mb-2">
            <AlertTriangle className="w-5 h-5" /> Disclaimer Penting
          </div>
          <p className="text-[13px] text-amber-900 leading-relaxed">
            ZeaVis Edu adalah <strong>alat bantu edukasi awal</strong>, bukan
            pengganti diagnosis profesional. Hasil ini tidak dapat dijadikan
            dasar keputusan agronomis tanpa konfirmasi dari{" "}
            <strong>
              ahli pertanian atau Petugas Pengamat Organisme Pengganggu Tanaman
              (POPT)
            </strong>{" "}
            yang berwenang.
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
