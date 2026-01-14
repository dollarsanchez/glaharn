'use client';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: 'violet' | 'rose' | 'amber' | 'blue';
  label?: string;
  showPercentage?: boolean;
}

export default function ProgressBar({
  value,
  max,
  color = 'violet',
  label,
  showPercentage = true,
}: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  const colorClasses = {
    violet: 'bg-violet-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
  };

  const bgColorClasses = {
    violet: 'bg-violet-100',
    rose: 'bg-rose-100',
    amber: 'bg-amber-100',
    blue: 'bg-blue-100',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-900">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className={`w-full h-2 rounded-full overflow-hidden ${bgColorClasses[color]}`}>
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
