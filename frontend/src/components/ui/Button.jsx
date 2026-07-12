import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  icon: Icon = null,
  iconPosition = 'left',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 shadow-md shadow-indigo-600/10 hover:shadow-lg hover:shadow-indigo-600/20 active:scale-98',
    secondary: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 focus:ring-slate-500',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-md shadow-rose-600/10 hover:shadow-lg hover:shadow-rose-600/20 active:scale-98',
    outline: 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 focus:ring-indigo-500',
    ghost: 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 focus:ring-indigo-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5'
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      
      {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
    </button>
  );
};

export default Button;
