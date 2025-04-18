import React from 'react';

const LoadingSpinner = ({ size = 'medium', color = 'blue' }) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 'h-6 w-6';
      case 'large':
        return 'h-12 w-12';
      case 'medium':
      default:
        return 'h-8 w-8';
    }
  };

  const getColor = () => {
    switch (color) {
      case 'red':
        return 'text-red-500';
      case 'green':
        return 'text-green-500';
      case 'blue':
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className="flex justify-center items-center p-4 w-full">
      <div className={`animate-spin rounded-full border-b-2 border-t-2 ${getColor()} ${getSize()}`}></div>
    </div>
  );
};

export default LoadingSpinner; 