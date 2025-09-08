/**
 * HomePage Component - Entry Point & Language Selection
 * Clean welcome screen with direct entry to learning
 */

import React from 'react';
import { useApp } from '../../contexts/AppContext';

const HomePage = () => {
  const { navigateTo, setSelectedLanguage, selectedLanguage } = useApp();
  
  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    // Save selection to localStorage
    try {
      localStorage.setItem('selectedLanguage', language);
    } catch (error) {
      console.error('Failed to save language selection:', error);
    }
  };
  
  const handleGetStarted = () => {
    if (selectedLanguage) {
      navigateTo('dashboard');
    }
  };
  
  // Auto-navigate if language already selected
  React.useEffect(() => {
    if (selectedLanguage) {
      // Small delay to show the selection, then navigate
      const timer = setTimeout(() => {
        navigateTo('dashboard');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedLanguage, navigateTo]);
  
  return (
    <div className="pt-16 pb-8">
      <div className="text-center space-y-8">
        {/* App Branding */}
        <div className="space-y-4">
          <div className="text-4xl font-bold text-gray-900">
            RareLanguages
          </div>
          <p className="text-xl text-gray-600">
            Learn Rare Languages
          </p>
          <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
            Master languages that bring you closer to family and culture
          </p>
        </div>
        
        {/* Language Selection */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-gray-700">
              Choose your language:
            </h2>
            
            {/* Language Options */}
            <div className="space-y-3">
              <button
                onClick={() => handleLanguageSelect('gheg-albanian')}
                className={`
                  w-full max-w-xs mx-auto flex items-center justify-center gap-3 
                  p-4 rounded-lg border-2 transition-all
                  ${selectedLanguage === 'gheg-albanian'
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-2xl">🇦🇱</span>
                <div className="text-left">
                  <div className="font-medium">Gheg Albanian</div>
                  <div className="text-sm opacity-75">Kosovo dialect</div>
                </div>
                {selectedLanguage === 'gheg-albanian' && (
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              {/* Placeholder for future languages */}
              <div className="w-full max-w-xs mx-auto flex items-center justify-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-200 text-gray-400">
                <span className="text-2xl">🌍</span>
                <div className="text-left">
                  <div className="font-medium">More languages</div>
                  <div className="text-sm">Coming soon...</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Get Started Button */}
          {selectedLanguage && (
            <div className="space-y-3">
              <button
                onClick={handleGetStarted}
                className="w-full max-w-xs mx-auto bg-blue-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
              </button>
              
              <p className="text-sm text-gray-500">
                Perfect for connecting with Albanian family
              </p>
            </div>
          )}
        </div>
        
        {/* Value Proposition */}
        <div className="pt-8 space-y-6 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="space-y-2">
              <div className="text-3xl">👨‍👩‍👧‍👦</div>
              <div className="font-medium text-gray-700">Family Focused</div>
              <div className="text-sm text-gray-500">Learn phrases for real family conversations</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl">🎧</div>
              <div className="font-medium text-gray-700">Audio First</div>
              <div className="text-sm text-gray-500">Hear native pronunciation from day one</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl">🏛️</div>
              <div className="font-medium text-gray-700">Cultural Context</div>
              <div className="text-sm text-gray-500">Understand when and how to use phrases</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;