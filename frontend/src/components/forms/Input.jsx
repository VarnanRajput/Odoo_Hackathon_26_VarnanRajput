import React from 'react';

const Input = ({
  label = '',
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  helperText = '',
  icon: Icon = null,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition-all duration-200 outline-none text-sm ${
            Icon ? 'pl-11' : ''
          } ${
            error
              ? 'border-rose-500 focus:ring-rose-400 focus:border-rose-500'
              : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-600'
          } focus:ring-4`}
          {...props}
        />
      </div>
      
      {error && <span className="text-xs font-medium text-rose-500">{error}</span>}
      {!error && helperText && <span className="text-xs text-slate-500">{helperText}</span>}
    </div>
  );
};

export default Input;
