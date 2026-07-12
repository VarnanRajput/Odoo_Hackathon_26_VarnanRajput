import React from 'react';

const Card = ({
  children,
  className = '',
  hoverEffect = true,
  onClick = null
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-panel rounded-2xl p-6 ${hoverEffect ? 'glass-panel-hover' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
