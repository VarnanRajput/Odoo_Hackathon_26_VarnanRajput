import React, { useState } from 'react';

const Tooltip = ({
  children,
  content = '',
  position = 'top', // top, bottom, left, right
  className = ''
}) => {
  const [visible, setVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          className={`absolute z-120 px-2.5 py-1.5 text-xs text-white bg-slate-900/95 dark:bg-slate-950/95 border border-slate-800 rounded-lg shadow-md whitespace-nowrap pointer-events-none fade-in ${positions[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
