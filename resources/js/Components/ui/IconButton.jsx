import React from 'react';
import { cn } from '@/lib/utils';

const IconButton = ({ 
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  size = 'md',
  className,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    default: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500",
    primary: "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500",
    info: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500",
  };

  const sizes = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3"
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      title={label}
      {...props}
    >
      {Icon && <Icon className="h-5 w-5" />}
    </button>
  );
};

export default IconButton;