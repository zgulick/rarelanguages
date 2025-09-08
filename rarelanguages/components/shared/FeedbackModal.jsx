/**
 * FeedbackModal Component
 * Shows exercise results and explanations
 */

import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const FeedbackModal = ({ 
  isOpen, 
  onClose, 
  correct, 
  userAnswer, 
  correctAnswer, 
  explanation,
  culturalNote,
  pronunciation,
  autoCloseDelay = 3000
}) => {
  
  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);
  
  if (!isOpen) return null;
  
  const bgColor = correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  const iconColor = correct ? 'text-green-600' : 'text-red-600';
  const icon = correct ? '✅' : '❌';
  const title = correct ? 'Correct!' : 'Not quite right';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`
        max-w-md w-full ${bgColor} border-2 rounded-lg p-6 shadow-xl 
        transform transition-all duration-300 scale-100
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" role="img" aria-label={correct ? "Correct" : "Incorrect"}>
              {icon}
            </span>
            <h3 className={`text-lg font-semibold ${iconColor}`}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="space-y-4">
          {/* User's answer (if incorrect) */}
          {!correct && userAnswer && (
            <div className="p-3 bg-white rounded border">
              <p className="text-sm font-medium text-gray-600 mb-1">Your answer:</p>
              <p className="text-gray-800">{userAnswer}</p>
            </div>
          )}
          
          {/* Correct answer */}
          {correctAnswer && (
            <div className="p-3 bg-white rounded border">
              <p className="text-sm font-medium text-gray-600 mb-1">
                {correct ? "You said:" : "Correct answer:"}
              </p>
              <p className="text-gray-800 font-medium">{correctAnswer}</p>
              {pronunciation && (
                <p className="text-sm text-gray-500 italic mt-1">
                  /{pronunciation}/
                </p>
              )}
            </div>
          )}
          
          {/* Explanation */}
          {explanation && (
            <div className="p-3 bg-white rounded border">
              <p className="text-sm font-medium text-gray-600 mb-1">Explanation:</p>
              <p className="text-gray-700 text-sm">{explanation}</p>
            </div>
          )}
          
          {/* Cultural note */}
          {culturalNote && (
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-1">
                🏛️ Cultural Note:
              </p>
              <p className="text-blue-700 text-sm">{culturalNote}</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className={`
              px-6 py-2 rounded-lg font-medium transition-colors
              ${correct 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
              }
            `}
          >
            Continue
          </button>
        </div>
        
        {/* Auto-close indicator */}
        {autoCloseDelay > 0 && (
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              Auto-closing in {Math.ceil(autoCloseDelay / 1000)} seconds
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
              <div 
                className="bg-gray-400 h-1 rounded-full transition-all ease-linear"
                style={{ 
                  width: '100%',
                  animation: `shrink ${autoCloseDelay}ms linear`
                }}
              />
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

FeedbackModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  correct: PropTypes.bool.isRequired,
  userAnswer: PropTypes.string,
  correctAnswer: PropTypes.string,
  explanation: PropTypes.string,
  culturalNote: PropTypes.string,
  pronunciation: PropTypes.string,
  autoCloseDelay: PropTypes.number
};

export default FeedbackModal;