import React from 'react';

const Loader = ({ 
  size = 'medium', 
  text = 'Loading...', 
  fullScreen = false,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
    xlarge: 'h-32 w-32'
  };

  const loaderElement = (
    <div className={`text-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4 ${sizeClasses[size]}`}></div>
      {text && <p className="text-gray-600">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {loaderElement}
      </div>
    );
  }

  return loaderElement;
};

export default Loader; 