import React from 'react';

const SkeletonLoader = ({
  type = 'line', // line, card, tableRow, circle
  count = 1,
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'circle':
        return (
          <div className={`rounded-full bg-slate-200 dark:bg-slate-800 shimmer ${className}`} />
        );
      case 'card':
        return (
          <div className={`p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 flex flex-col gap-3 ${className}`}>
            <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded shimmer" />
            <div className="h-8 w-1/2 bg-slate-200 dark:bg-slate-800 rounded shimmer mt-1" />
            <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded shimmer mt-2" />
          </div>
        );
      case 'tableRow':
        return (
          <div className={`py-4 border-b border-slate-100 dark:border-slate-850 flex gap-4 ${className}`}>
            <div className="h-5 flex-1 bg-slate-200 dark:bg-slate-800 rounded shimmer" />
            <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded shimmer" />
            <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 rounded shimmer" />
            <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded shimmer" />
          </div>
        );
      case 'line':
      default:
        return (
          <div className={`h-4 bg-slate-200 dark:bg-slate-800 rounded shimmer ${className}`} />
        );
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {Array.from({ length: count }).map((_, idx) => (
        <React.Fragment key={idx}>{renderSkeleton()}</React.Fragment>
      ))}
    </div>
  );
};

export default SkeletonLoader;
export { SkeletonLoader };
