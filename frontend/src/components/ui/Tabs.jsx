import React from 'react';

const Tabs = ({
  tabs = [], // Array of { id, label, icon: Icon }
  activeTab,
  onChange,
  className = ''
}) => {
  return (
    <div className={`border-b border-slate-200 dark:border-slate-800 flex gap-4 ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon || null;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`py-3 px-1 border-b-2 flex items-center gap-2 font-semibold text-sm transition-all duration-200 focus:outline-none cursor-pointer -mb-[2px] ${
              isActive
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {Icon && <Icon size={16} />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
