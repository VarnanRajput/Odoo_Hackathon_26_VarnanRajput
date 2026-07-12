import React from 'react';

const Loader = ({
  size = 'md', // sm, md, lg
  className = '',
  text = ''
}) => {
  const sizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <div
        className={`rounded-full border-t-indigo-600 border-indigo-200/40 animate-spin ${sizes[size]}`}
      />
      {text && <p className="mt-3 text-xs font-semibold text-slate-500 tracking-wide">{text}</p>}
    </div>
  );
};

export default Loader;
