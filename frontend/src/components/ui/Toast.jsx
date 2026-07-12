import React from 'react';

const Toast = ({
  message = '',
  type = 'info', // success, error, warning, info
  onClose,
  className = ''
}) => {
  let bgClass = 'bg-slate-800 text-white border-slate-700';
  
  if (type === 'success') {
    bgClass = 'bg-emerald-500/90 text-white border-emerald-400';
  } else if (type === 'error') {
    bgClass = 'bg-rose-500/90 text-white border-rose-400';
  } else if (type === 'warning') {
    bgClass = 'bg-amber-500/90 text-slate-900 border-amber-400';
  } else if (type === 'info') {
    bgClass = 'bg-sky-500/90 text-white border-sky-400';
  }

  return (
    <div
      className={`p-4 rounded-xl border shadow-lg backdrop-blur-md flex justify-between items-center transition-all duration-300 transform scale-100 ${bgClass} ${className}`}
    >
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 hover:opacity-75 focus:outline-none text-xs font-bold leading-none cursor-pointer"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Toast;
