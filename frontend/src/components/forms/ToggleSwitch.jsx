import React from 'react';

const ToggleSwitch = ({
  label = '',
  checked = false,
  onChange,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <label
      className={`inline-flex items-center justify-between cursor-pointer select-none text-sm font-semibold text-slate-700 dark:text-slate-300 gap-3 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {label && <span>{label}</span>}
      
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        
        {/* Toggle bar background */}
        <div className="w-10 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
      </div>
    </label>
  );
};

export default ToggleSwitch;
export { ToggleSwitch };
