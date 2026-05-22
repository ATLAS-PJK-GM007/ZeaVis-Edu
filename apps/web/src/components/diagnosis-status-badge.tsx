import type { DiagnosisStatus } from '@zeavis/shared';
import { cn } from '@/lib/utils';

const labels: Record<DiagnosisStatus, string> = {
  ai_verified: 'Terverifikasi AI',
  needs_review: 'Menunggu review pakar',
  expert_verified: 'Diverifikasi pakar',
  expert_corrected: 'Dikoreksi pakar',
  failed: 'Gagal diproses',
};

const styles: Record<DiagnosisStatus, string> = {
  ai_verified: 'bg-emerald-100 text-emerald-800',
  needs_review: 'bg-amber-100 text-amber-800',
  expert_verified: 'bg-blue-100 text-blue-800',
  expert_corrected: 'bg-purple-100 text-purple-800',
  failed: 'bg-red-100 text-red-800',
};

export function DiagnosisStatusBadge({ status, className }: { status: DiagnosisStatus; className?: string }) {
  return <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', styles[status], className)}>{labels[status]}</span>;
}
