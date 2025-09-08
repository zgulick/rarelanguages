/**
 * DifficultyButtons Component
 * Anki-style difficulty rating for spaced repetition
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';

const DifficultyButtons = ({ 
  onSelect, 
  disabled = false, 
  variant = 'anki' // 'anki' or 'simple'
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  
  const ankiButtons = [
    { 
      level: 1, 
      label: 'Again', 
      color: 'bg-red-500 hover:bg-red-600', 
      description: 'I got this wrong',
      interval: 'Show again soon'
    },
    { 
      level: 2, 
      label: 'Hard', 
      color: 'bg-orange-500 hover:bg-orange-600', 
      description: 'I struggled with this',
      interval: 'Show in 1-2 days'
    },
    { 
      level: 3, 
      label: 'Good', 
      color: 'bg-blue-500 hover:bg-blue-600', 
      description: 'I got this right',
      interval: 'Show in 3-4 days'
    },
    { 
      level: 4, 
      label: 'Easy', 
      color: 'bg-green-500 hover:bg-green-600', 
      description: 'This was very easy',
      interval: 'Show in 1+ weeks'
    }
  ];
  
  const simpleButtons = [
    { 
      level: 1, 
      label: 'Incorrect', 
      color: 'bg-red-500 hover:bg-red-600', 
      description: 'Wrong answer'
    },
    { 
      level: 4, 
      label: 'Correct', 
      color: 'bg-green-500 hover:bg-green-600', 
      description: 'Right answer'
    }
  ];
  
  const buttons = variant === 'anki' ? ankiButtons : simpleButtons;
  
  const handleSelect = (level) => {
    setSelectedDifficulty(level);
    onSelect(level);
  };
  
  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (event) => {
      if (disabled) return;
      
      const key = parseInt(event.key);
      if (key >= 1 && key <= buttons.length) {
        const button = buttons.find(b => b.level === key);
        if (button) {
          handleSelect(button.level);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [disabled, buttons]);
  
  return (
    <div className="space-y-3">
      {variant === 'anki' && (
        <div className="text-center text-sm text-gray-600">
          How well did you know this?
        </div>
      )}
      
      <div className={`
        grid gap-2 
        ${variant === 'anki' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}
      `}>
        {buttons.map((button) => (
          <button
            key={button.level}
            onClick={() => handleSelect(button.level)}
            disabled={disabled}
            className={`
              ${button.color} text-white font-medium py-3 px-4 rounded-lg
              transition-all duration-200 transform
              hover:scale-105 focus:scale-105
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              ${selectedDifficulty === button.level ? 'ring-2 ring-offset-2 ring-white' : ''}
              touch-manipulation
            `}
            title={button.description}
          >
            <div className="text-center">
              <div className="font-bold">{button.label}</div>
              {variant === 'anki' && (
                <>
                  <div className="text-xs opacity-75 mt-1">
                    {button.level}
                  </div>
                  {button.interval && (
                    <div className="text-xs opacity-75 mt-1 hidden sm:block">
                      {button.interval}
                    </div>
                  )}
                </>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {variant === 'anki' && (
        <div className="text-center text-xs text-gray-500 mt-2">
          Press keys 1-4 for quick selection
        </div>
      )}
    </div>
  );
};

DifficultyButtons.propTypes = {
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['anki', 'simple'])
};

export default DifficultyButtons;