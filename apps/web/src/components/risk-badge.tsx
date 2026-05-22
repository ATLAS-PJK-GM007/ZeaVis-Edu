import type { RiskLevel } from '@zeavis/shared';
import { cn } from '@/lib/utils';

const riskLevelConfig: Record<RiskLevel, { label: string; className: string }> = {
  low: {
    label: 'Risiko Rendah',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  medium: {
    label: 'Risiko Sedang',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  high: {
    label: 'Risiko Tinggi',
    className: 'bg-red-100 text-red-800 border-red-300',
  },
};

export interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const config = riskLevelConfig[level];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
