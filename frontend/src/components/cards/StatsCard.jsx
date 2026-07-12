import React from 'react';
import Card from './Card';

const StatsCard = ({
  title = '',
  value = '0',
  subtext = '',
  trend = null, // { value: '+12%', isPositive: true }
  icon: Icon = null,
  iconBg = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  className = ''
}) => {
  return (
    <Card className={`flex items-start justify-between relative overflow-hidden ${className}`}>
      <div className="flex-1">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-500 tracking-wider uppercase">
          {title}
        </span>
        <h3 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mt-1.5">
          {value}
        </h3>
        
        {(subtext || trend) && (
          <div className="flex items-center gap-1.5 mt-2">
            {trend && (
              <span
                className={`text-xs font-bold ${
                  trend.isPositive ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {trend.value}
              </span>
            )}
            {subtext && (
              <span className="text-xs text-slate-500 dark:text-slate-500">
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>

      {Icon && (
        <div className={`p-3 rounded-xl shrink-0 ${iconBg}`}>
          <Icon size={24} />
        </div>
      )}
    </Card>
  );
};

export default StatsCard;
