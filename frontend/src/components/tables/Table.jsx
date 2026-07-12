import React from 'react';
import SkeletonLoader from '../loading/SkeletonLoader';

const Table = ({
  columns = [], // Array of { key, header, render: (row) => node, sortable }
  data = [], // Array of rows
  loading = false,
  onRowClick = null,
  emptyMessage = 'No data available',
  className = ''
}) => {
  return (
    <div className={`w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md ${className}`}>
      <table className="w-full border-collapse text-left text-sm text-slate-800 dark:text-slate-200">
        <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-6 py-4">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
          {loading ? (
            // Skeleton loader state
            Array.from({ length: 4 }).map((_, rIdx) => (
              <tr key={rIdx}>
                {columns.map((_, cIdx) => (
                  <td key={cIdx} className="px-6 py-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded shimmer" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 dark:text-slate-500 font-semibold">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => (
              <tr
                key={row._id || rIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="px-6 py-4 text-xs md:text-sm whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
