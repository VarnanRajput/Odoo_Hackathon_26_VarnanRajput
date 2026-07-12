import React from 'react';

const ProgressBar = ({
  value = 0, // 0 to 100
  max = 100,
  label = '',
  showPercent = true,
  className = '',
  color = 'indigo' // indigo, emerald, amber, rose, sky
}) => {
  const percentage = Math.min(Math.max(Math.round((value / max) * 100), 0), 100);

  const colors = {
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    sky: 'bg-sky-500'
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
          {label && <span>{label}</span>}
          {showPercent && <span>{percentage}%</span>}
        </div>
      )}
      <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${colors[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
