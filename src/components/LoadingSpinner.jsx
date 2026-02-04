// @ts-ignore;
import React from 'react';

export default function LoadingSpinner({
  size = 'md',
  color = 'primary'
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4'
  };
  const colorClasses = {
    primary: 'border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent',
    secondary: 'border-t-gray-500 border-r-transparent border-b-transparent border-l-transparent'
  };
  return <div className="flex justify-center items-center p-4">
      <div className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]}`} style={{
      animation: 'spin 1s linear infinite'
    }} />
    </div>;
}