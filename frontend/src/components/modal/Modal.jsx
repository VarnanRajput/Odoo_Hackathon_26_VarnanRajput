import React, { useEffect } from 'react';

const Modal = ({
  children,
  isOpen = false,
  onClose,
  title = '',
  size = 'md', // sm, md, lg, xl
  className = ''
}) => {
  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-105 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`w-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl backdrop-blur-md overflow-hidden relative z-10 transform scale-100 transition-all duration-300 max-h-[90vh] flex flex-col ${sizes[size]} ${className} animate-slide-up`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
            {title}
          </h4>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold focus:outline-none transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
export { Modal };
