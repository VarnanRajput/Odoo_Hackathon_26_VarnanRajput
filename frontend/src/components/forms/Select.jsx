import React from 'react';

const Select = ({
  label = '',
  options = [], // Array of { value, label } or simple strings
  value,
  onChange,
  error = '',
  helperText = '',
  disabled = false,
  required = false,
  className = '',
  placeholder = 'Select option',
  ...props
}) => {
  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 transition-all duration-200 outline-none text-sm cursor-pointer ${
          error
            ? 'border-rose-500 focus:ring-rose-400 focus:border-rose-500'
            : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-600'
        } focus:ring-4`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt, idx) => {
          const isObj = typeof opt === 'object';
          const val = isObj ? opt.value : opt;
          const lbl = isObj ? opt.label : opt;
          return (
            <option key={idx} value={val} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
              {lbl}
            </option>
          );
        })}
      </select>
      
      {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
      {!error && helperText && <span className="text-xs text-slate-500">{helperText}</span>}
    </div>
  );
};

export default Select;
