import React from 'react';

const Alert = ({
  children,
  type = 'info', // success, warning, error, info
  title = '',
  className = '',
  onClose = null
}) => {
  const styles = {
    success: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50',
    warning: 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50',
    error: 'bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50',
    info: 'bg-sky-50 dark:bg-sky-950/20 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-900/50'
  };

  const icons = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ'
  };

  return (
    <div
      className={`p-4 rounded-xl border flex gap-3 ${styles[type]} ${className}`}
      role="alert"
    >
      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-current font-bold text-xs shrink-0 select-none">
        {icons[type]}
      </div>
      <div className="flex-1">
        {title && <h5 className="font-semibold text-sm leading-5 mb-1">{title}</h5>}
        <div className="text-sm leading-5 opacity-90">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-xs hover:opacity-75 focus:outline-none ml-2 leading-none cursor-pointer self-start"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Alert;
