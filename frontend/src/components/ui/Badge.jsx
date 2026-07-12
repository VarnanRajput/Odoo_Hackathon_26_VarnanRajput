import React from 'react';

const Badge = ({
  children,
  type = 'default', // success, info, warning, danger, primary, purple
  className = '',
  status = null // will map status keywords automatically if provided
}) => {
  let selectedType = type;

  if (status) {
    const s = status.toLowerCase();
    if (['available', 'active', 'verified', 'completed', 'resolved', 'green'].includes(s)) {
      selectedType = 'success';
    } else if (['allocated', 'approved', 'ongoing', 'blue', 'employee'].includes(s)) {
      selectedType = 'info';
    } else if (['reserved', 'upcoming', 'pending', 'yellow', 'warning', 'department head', 'asset manager'].includes(s)) {
      selectedType = 'warning';
    } else if (['under maintenance', 'in progress', 'purple'].includes(s)) {
      selectedType = 'purple';
    } else if (['lost', 'damaged', 'rejected', 'inactive', 'cancelled', 'red', 'danger', 'critical', 'poor'].includes(s)) {
      selectedType = 'danger';
    } else if (['admin'].includes(s)) {
      selectedType = 'indigo';
    } else {
      selectedType = 'default';
    }
  }

  const styles = {
    default: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    info: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    purple: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20',
    indigo: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[selectedType]} ${className}`}
    >
      {status || children}
    </span>
  );
};

export default Badge;
