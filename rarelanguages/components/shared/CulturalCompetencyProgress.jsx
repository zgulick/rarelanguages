/**
 * Cultural Competency Progress Visualization Component
 * Phase 3 Enhancement: Tracks and displays cultural competency development
 */

import React from 'react';
import PropTypes from 'prop-types';
import { CulturalCompetencyFramework, AlbanianCulturalThemes } from '../../lib/pedagogicalProgression';

const CulturalCompetencyProgress = ({ 
  currentLevel = CulturalCompetencyFramework.AWARENESS,
  culturalResponses = [],
  competencyProgress = {},
  showDetails = false,
  variant = 'compact' // 'compact', 'detailed', 'dashboard'
}) => {
  
  const competencyLevels = Object.values(CulturalCompetencyFramework);
  const culturalThemes = Object.values(AlbanianCulturalThemes);
  
  // Calculate progress for each competency level
  const calculateLevelProgress = (level) => {
    const totalPossible = culturalResponses.length;
    if (totalPossible === 0) return 0;
    
    const levelAchieved = competencyProgress[level.name.toLowerCase()] || 0;
    return Math.min((levelAchieved / totalPossible) * 100, 100);
  };
  
  // Get theme-specific progress
  const getThemeProgress = (theme) => {
    const themeResponses = culturalResponses.filter(r => 
      r.culturalTheme === theme.name || 
      theme.scenarios.some(scenario => r.scenarioId?.includes(scenario))
    );
    
    return {
      total: themeResponses.length,
      successful: themeResponses.filter(r => r.recognizedCulturalElement || r.appliedCulturalKnowledge).length,
      percentage: themeResponses.length > 0 
        ? (themeResponses.filter(r => r.recognizedCulturalElement || r.appliedCulturalKnowledge).length / themeResponses.length) * 100
        : 0
    };
  };
  
  // Compact version for lesson interface
  if (variant === 'compact') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Cultural Competency</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${
            currentLevel.level === 1 ? 'bg-gray-100 text-gray-600' :
            currentLevel.level === 2 ? 'bg-blue-100 text-blue-600' :
            currentLevel.level === 3 ? 'bg-green-100 text-green-600' :
            'bg-purple-100 text-purple-600'
          }`}>
            {currentLevel.name}
          </span>
        </div>
        
        <div className="space-y-2">
          {competencyLevels.map((level, index) => {
            const progress = calculateLevelProgress(level);
            const isActive = level.level <= currentLevel.level;
            const isCurrent = level.level === currentLevel.level;
            
            return (
              <div key={level.name} className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  isActive ? 'bg-blue-500' : 'bg-gray-200'
                } ${isCurrent ? 'ring-2 ring-blue-300' : ''}`}></div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${
                      isActive ? 'text-blue-900' : 'text-gray-500'
                    }`}>
                      {level.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isActive ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  // Detailed version for cultural competency focus
  if (variant === 'detailed') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Cultural Competency Development
          </h2>
          <p className="text-sm text-gray-600">
            Your progress in understanding and integrating Albanian cultural knowledge
          </p>
        </div>
        
        {/* Current Level Overview */}
        <div className={`border-l-4 pl-4 mb-6 ${
          currentLevel.level === 1 ? 'border-gray-400' :
          currentLevel.level === 2 ? 'border-blue-400' :
          currentLevel.level === 3 ? 'border-green-400' :
          'border-purple-400'
        }`}>
          <h3 className="font-medium text-gray-900">{currentLevel.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{currentLevel.description}</p>
          
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Key Indicators:</h4>
            <ul className="space-y-1">
              {currentLevel.indicators.map((indicator, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                  {indicator.replace(/_/g, ' ')}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Cultural Themes Progress */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Albanian Cultural Themes</h3>
          <div className="space-y-4">
            {culturalThemes.map((theme) => {
              const themeProgress = getThemeProgress(theme);
              
              return (
                <div key={theme.name} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{theme.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      theme.importance === 'critical' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {theme.importance}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3">{theme.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${themeProgress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {themeProgress.successful}/{themeProgress.total} interactions
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Competency Level Progress */}
        <div>
          <h3 className="font-medium text-gray-900 mb-4">Competency Levels</h3>
          <div className="space-y-3">
            {competencyLevels.map((level) => {
              const progress = calculateLevelProgress(level);
              const isActive = level.level <= currentLevel.level;
              const isCurrent = level.level === currentLevel.level;
              
              return (
                <div key={level.name} className={`border rounded-lg p-4 ${
                  isCurrent ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        isActive ? 'bg-blue-500' : 'bg-gray-300'
                      } ${isCurrent ? 'ring-2 ring-blue-300' : ''}`}></div>
                      <span className={`font-medium ${
                        isActive ? 'text-blue-900' : 'text-gray-500'
                      }`}>
                        Level {level.level}: {level.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isActive ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-sm text-gray-600">{level.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  
  // Dashboard version for overview
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Current Level</h3>
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${
            currentLevel.level === 1 ? 'bg-gray-100' :
            currentLevel.level === 2 ? 'bg-blue-100' :
            currentLevel.level === 3 ? 'bg-green-100' :
            'bg-purple-100'
          }`}>
            <span className={`text-xl font-bold ${
              currentLevel.level === 1 ? 'text-gray-600' :
              currentLevel.level === 2 ? 'text-blue-600' :
              currentLevel.level === 3 ? 'text-green-600' :
              'text-purple-600'
            }`}>
              {currentLevel.level}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-900">{currentLevel.name}</p>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Cultural Interactions</h3>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {culturalResponses.length}
          </div>
          <p className="text-xs text-gray-500">Total interactions</p>
          <div className="text-sm font-medium text-green-600 mt-1">
            {culturalResponses.filter(r => r.recognizedCulturalElement).length} successful
          </div>
        </div>
      </div>
    </div>
  );
};

CulturalCompetencyProgress.propTypes = {
  currentLevel: PropTypes.object,
  culturalResponses: PropTypes.array,
  competencyProgress: PropTypes.object,
  showDetails: PropTypes.bool,
  variant: PropTypes.oneOf(['compact', 'detailed', 'dashboard'])
};

export default CulturalCompetencyProgress;