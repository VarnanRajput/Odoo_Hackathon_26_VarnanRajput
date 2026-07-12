import React, { useState, useRef, useEffect } from 'react';

const Dropdown = ({
  trigger, // React node that triggers dropdown when clicked
  items = [], // Array of { label, onClick, icon: Icon, type: 'default'|'danger'|'divider' }
  align = 'right', // left, right
  className = ''
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignments = {
    left: 'left-0 mt-2 origin-top-left',
    right: 'right-0 mt-2 origin-top-right'
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          className={`absolute z-100 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xl backdrop-blur-md focus:outline-none overflow-hidden animate-slide-up ${alignments[align]}`}
        >
          <div className="py-1">
            {items.map((item, idx) => {
              if (item.type === 'divider') {
                return <div key={idx} className="h-px bg-slate-100 dark:bg-slate-800 my-1" />;
              }

              const Icon = item.icon || null;
              const isDanger = item.type === 'danger';

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setOpen(false);
                    if (item.onClick) item.onClick();
                  }}
                  className={`w-full px-4 py-2 text-sm flex items-center gap-2.5 transition-colors text-left font-medium focus:outline-none ${
                    isDanger
                      ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {Icon && <Icon size={16} className={isDanger ? 'text-rose-500' : 'text-slate-400'} />}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
