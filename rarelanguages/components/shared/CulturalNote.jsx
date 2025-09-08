/**
 * CulturalNote Component
 * Displays cultural context and learning tips
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';

const CulturalNote = ({ 
  content, 
  title = "Cultural Context",
  variant = 'default', // 'default', 'tip', 'warning', 'highlight'
  collapsible = false,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  if (!content) return null;
  
  const variantStyles = {
    default: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: '🏛️',
      iconColor: 'text-blue-600'
    },
    tip: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: '💡',
      iconColor: 'text-green-600'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: '⚠️',
      iconColor: 'text-yellow-600'
    },
    highlight: {
      container: 'bg-purple-50 border-purple-200 text-purple-800',
      icon: '⭐',
      iconColor: 'text-purple-600'
    }
  };
  
  const styles = variantStyles[variant];
  
  const toggleExpanded = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };
  
  return (
    <div className={`
      ${styles.container} border rounded-lg p-3 transition-all duration-200
      ${collapsible ? 'cursor-pointer hover:shadow-sm' : ''}
    `}>
      {/* Header */}
      <div 
        className="flex items-center justify-between"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-hidden="true">
            {styles.icon}
          </span>
          <h4 className="font-medium text-sm">
            {title}
          </h4>
        </div>
        
        {collapsible && (
          <button
            className={`${styles.iconColor} hover:opacity-75 transition-opacity`}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <svg 
              className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 9l-7 7-7-7" 
              />
            </svg>
          </button>
        )}
      </div>
      
      {/* Content */}
      {(!collapsible || isExpanded) && (
        <div className="mt-2 text-sm leading-relaxed">
          {typeof content === 'string' ? (
            <p>{content}</p>
          ) : (
            content
          )}
        </div>
      )}
    </div>
  );
};

CulturalNote.propTypes = {
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  title: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'tip', 'warning', 'highlight']),
  collapsible: PropTypes.bool,
  defaultExpanded: PropTypes.bool
};

export default CulturalNote;