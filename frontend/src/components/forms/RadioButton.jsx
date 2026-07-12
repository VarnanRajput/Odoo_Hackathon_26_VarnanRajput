import React from 'react';

const RadioButton = ({
  label = '',
  name,
  value,
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
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
        {...props}
      />
      
      {/* Custom styled circle */}
      <div className="h-5 w-5 rounded-full border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 peer-checked:border-indigo-600 flex items-center justify-center transition-all duration-200 peer-focus:ring-2 peer-focus:ring-indigo-500/20">
        <div className="h-2.5 w-2.5 rounded-full bg-indigo-600 scale-0 peer-checked:scale-100 transition-transform duration-200" />
      </div>
      
      {label && <span>{label}</span>}
    </label>
  );
};

export default RadioButton;
export { RadioButton };
