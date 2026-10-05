import React from 'react';

interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const MatchScorePill: React.FC<Props> = ({ score, size = 'md', showLabel = true }) => {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (score >= 85) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (score >= 70) {
    colorClasses = 'bg-brand-50 text-brand-700 border-brand-200';
  } else if (score >= 55) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : size === 'lg'
      ? 'px-3 py-1.5 text-sm font-semibold'
      : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${colorClasses} ${sizeClasses}`}
      title="Profile Match: Deterministic candidate-to-job requirement alignment score"
    >
      {showLabel && <span className="opacity-75 font-normal">Match:</span>}
      <span className="font-semibold">{score}%</span>
    </span>
  );
};
