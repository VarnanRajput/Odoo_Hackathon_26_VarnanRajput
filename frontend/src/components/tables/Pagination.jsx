import React from 'react';

const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  className = ''
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className={`flex items-center justify-between px-6 py-4 flex-wrap gap-4 ${className}`}>
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-500">
        Showing Page {currentPage} of {totalPages} ({totalItems} items total)
      </span>

      <div className="flex gap-1.5 items-center">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none transition-colors"
        >
          Previous
        </button>

        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 focus:outline-none cursor-pointer ${
              currentPage === number
                ? 'bg-indigo-600 text-white shadow shadow-indigo-600/20'
                : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {number}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed select-none focus:outline-none transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
export { Pagination };
