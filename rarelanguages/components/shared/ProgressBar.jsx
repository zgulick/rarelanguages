/**
 * ProgressBar Component
 * Shows lesson progress and exercise completion status
 */

import React from 'react';
import PropTypes from 'prop-types';

const ProgressBar = ({ 
  current, 
  total, 
  label = "", 
  showPercentage = true, 
  size = "medium",
  color = "blue" 
}) => {
  const percentage = Math.round((current / total) * 100);
  
  const sizeClasses = {
    small: "h-2",
    medium: "h-3", 
    large: "h-4"
  };
  
  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-500",
    purple: "bg-purple-600",
    orange: "bg-orange-500"
  };
  
  return (
    <div className="w-full">
      {/* Label and stats */}
      <div className="flex justify-between items-center mb-2">
        {label && (
          <span className="text-sm font-medium text-gray-700">
            {label}
          </span>
        )}
        <div className="text-sm text-gray-600">
          <span className="font-medium">{current}</span>
          <span className="text-gray-400"> / </span>
          <span>{total}</span>
          {showPercentage && (
            <span className="ml-2 text-xs">({percentage}%)</span>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className={`w-full ${sizeClasses[size]} bg-gray-200 rounded-full overflow-hidden`}>
        <div 
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

ProgressBar.propTypes = {
  current: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  label: PropTypes.string,
  showPercentage: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['blue', 'green', 'purple', 'orange'])
};

export default ProgressBar;