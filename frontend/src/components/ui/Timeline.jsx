import React from 'react';
import Badge from './Badge';

const TimelineItem = ({
  date,
  title,
  description,
  badge = null,
  isLast = false
}) => {
  return (
    <div className="flex gap-4">
      {/* Date column (left) */}
      <div className="w-24 text-right shrink-0 py-1">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-500">
          {new Date(date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      </div>

      {/* Axis graphic line */}
      <div className="flex flex-col items-center shrink-0">
        <div className="h-4 w-4 rounded-full bg-indigo-500 dark:bg-indigo-600 border-4 border-slate-100 dark:border-slate-900 z-10 shadow-sm" />
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-800 -my-1" />}
      </div>

      {/* Content box (right) */}
      <div className="flex-1 pb-6 py-0.5">
        <div className="flex items-start gap-2 justify-between flex-wrap">
          <h5 className="font-semibold text-sm text-slate-800 dark:text-slate-200 leading-tight">
            {title}
          </h5>
          {badge && <Badge status={badge} className="mt-0.5" />}
        </div>
        {description && (
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

const Timeline = ({
  items = [], // Array of { date, title, description, badge }
  className = ''
}) => {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-500 dark:text-slate-500">
        No history records available
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {items.map((item, idx) => (
        <TimelineItem
          key={idx}
          date={item.date}
          title={item.title}
          description={item.description}
          badge={item.badge}
          isLast={idx === items.length - 1}
        />
      ))}
    </div>
  );
};

export default Timeline;
export { TimelineItem };
