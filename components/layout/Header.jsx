/**
 * Header Component - App Navigation
 * Clean, minimal header with back navigation
 */

import React from 'react';
import { useApp } from '../../contexts/AppContext';

const Header = () => {
  const { currentPage, goBack, navigationHistory } = useApp();
  
  const getPageTitle = (page) => {
    const titles = {
      home: 'RareLanguages',
      dashboard: 'Gheg Albanian',
      lesson: 'Learning Session',
      practice: 'Practice Hub'
    };
    return titles[page] || 'RareLanguages';
  };
  
  const showBackButton = navigationHistory.length > 1 && currentPage !== 'home';
  
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Back button or logo */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <button
                onClick={goBack}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                aria-label="Go back"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 19l-7-7 7-7" 
                  />
                </svg>
              </button>
            ) : (
              <div className="w-2" /> // Spacer for alignment
            )}
            
            <h1 className="text-xl font-bold text-gray-900">
              {getPageTitle(currentPage)}
            </h1>
          </div>
          
          {/* Right side - Settings or actions */}
          <div className="flex items-center gap-2">
            {currentPage === 'dashboard' && (
              <button
                onClick={() => {/* TODO: Open settings */}}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                aria-label="Settings"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;