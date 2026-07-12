import React from 'react';

const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search by tag, serial number, location...',
  className = '',
  filterComponent = null
}) => {
  return (
    <div className={`w-full flex flex-col md:flex-row gap-3 items-center ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex-1 w-full">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 select-none pointer-events-none">
          🔍
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 transition-all duration-200 outline-none text-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-600"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Optional Filters */}
      {filterComponent && (
        <div className="w-full md:w-auto shrink-0 flex items-center gap-2">
          {filterComponent}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
export { SearchBar };
