import React, { useState } from 'react';

const AccordionItem = ({
  title,
  children,
  isOpen,
  onClick
}) => {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 last:border-0">
      <button
        onClick={onClick}
        type="button"
        className="w-full py-4 px-5 flex justify-between items-center text-left font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200 focus:outline-none"
      >
        <span className="text-sm font-semibold">{title}</span>
        <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 border-t border-slate-100 dark:border-slate-800/50' : 'max-h-0'}`}
      >
        <div className="p-5 text-sm text-slate-600 dark:text-slate-400 bg-white/30 dark:bg-slate-900/10">
          {children}
        </div>
      </div>
    </div>
  );
};

const Accordion = ({
  items = [], // Array of { title, content }
  allowMultiple = false,
  className = ''
}) => {
  const [openIndexes, setOpenIndexes] = useState([]);

  const handleItemClick = (index) => {
    if (allowMultiple) {
      if (openIndexes.includes(index)) {
        setOpenIndexes(prev => prev.filter(i => i !== index));
      } else {
        setOpenIndexes(prev => [...prev, index]);
      }
    } else {
      if (openIndexes.includes(index)) {
        setOpenIndexes([]);
      } else {
        setOpenIndexes([index]);
      }
    }
  };

  return (
    <div className={`glass-panel rounded-2xl overflow-hidden ${className}`}>
      {items.map((item, idx) => (
        <AccordionItem
          key={idx}
          title={item.title}
          isOpen={openIndexes.includes(idx)}
          onClick={() => handleItemClick(idx)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
};

export default Accordion;
export { AccordionItem };
