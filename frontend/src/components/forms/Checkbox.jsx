import React from 'react';

const Checkbox = ({
  label = '',
  checked = false,
  onChange,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <label
      className={`inline-flex items-center gap-2.5 cursor-pointer text-sm font-semibold select-none text-slate-700 dark:text-slate-300 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
        {...props}
      />
      
      {/* Custom styled box using Peer utilities */}
      <div className="h-5 w-5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center transition-all duration-200 peer-focus:ring-2 peer-focus:ring-indigo-500/20">
        <svg
          className="h-3 w-3 text-white scale-0 peer-checked:scale-100 transition-transform duration-200"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      {label && <span>{label}</span>}
    </label>
  );
};

export default Checkbox;
export { Checkbox };
