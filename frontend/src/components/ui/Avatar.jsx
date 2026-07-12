import React from 'react';

const Avatar = ({
  name = '',
  src = null,
  size = 'md',
  className = ''
}) => {
  const getInitials = (n) => {
    if (!n) return '?';
    const parts = n.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-2xl'
  };

  // Generate deterministic gradient background based on name hash
  const getGradient = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % 5;
    const gradients = [
      'from-indigo-500 to-purple-600',
      'from-emerald-400 to-teal-600',
      'from-pink-500 to-rose-600',
      'from-amber-400 to-orange-500',
      'from-sky-400 to-blue-600'
    ];
    return gradients[colorIndex];
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 ${sizes[size]} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.target.src = ''; // Fallback to initials on error
          }}
        />
      ) : (
        <div
          className={`h-full w-full flex items-center justify-center font-bold text-white bg-gradient-to-br ${getGradient(name)}`}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

export default Avatar;
