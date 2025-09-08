/**
 * Demo App - Test All Exercise Components
 * Comprehensive demonstration of Phase 2.2 components
 */

import React, { useState } from 'react';
import { LearningProvider } from './contexts/LearningContext';
import LessonContainer from './exercises/LessonContainer';
import FlashcardExercise from './exercises/FlashcardExercise';
import AudioExercise from './exercises/AudioExercise';
import ConversationExercise from './exercises/ConversationExercise';
import VisualExercise from './exercises/VisualExercise';
import { mockContent, mockLesson, conversationScenarios, visualContent } from '../lib/mockData';

const DemoApp = () => {
  const [currentDemo, setCurrentDemo] = useState('lesson');
  const [completedExercises, setCompletedExercises] = useState([]);
  
  const handleExerciseComplete = (results) => {
    console.log('Exercise completed:', results);
    setCompletedExercises(prev => [...prev, {
      type: results.exerciseType,
      timestamp: Date.now(),
      results
    }]);
  };
  
  const handleExerciseResponse = (response) => {
    console.log('Exercise response:', response);
  };
  
  const handleLessonComplete = (lessonResults) => {
    console.log('Lesson completed:', lessonResults);
    alert(`Lesson Complete!\nAccuracy: ${lessonResults.accuracy.toFixed(1)}%\nTime: ${lessonResults.totalTimeSpent} minutes`);
  };
  
  const demoOptions = [
    { key: 'lesson', label: '🎯 Full Lesson Flow', icon: '📖' },
    { key: 'flashcard', label: 'Flashcard Exercise', icon: '🃏' },
    { key: 'audio', label: 'Audio Exercise', icon: '🎧' },
    { key: 'conversation', label: 'Conversation Exercise', icon: '💬' },
    { key: 'visual', label: 'Visual Exercise', icon: '🖼️' }
  ];
  
  const renderDemo = () => {
    const exerciseProps = {
      onComplete: handleExerciseComplete,
      onResponse: handleExerciseResponse
    };
    
    switch (currentDemo) {
      case 'lesson':
        return (
          <LessonContainer 
            lesson={mockLesson}
            onLessonComplete={handleLessonComplete}
          />
        );
        
      case 'flashcard':
        return (
          <FlashcardExercise 
            content={mockContent.slice(0, 8)}
            {...exerciseProps}
          />
        );
        
      case 'audio':
        return (
          <AudioExercise 
            content={mockContent.slice(0, 5)}
            {...exerciseProps}
          />
        );
        
      case 'conversation':
        return (
          <ConversationExercise 
            scenarios={conversationScenarios}
            {...exerciseProps}
          />
        );
        
      case 'visual':
        return (
          <VisualExercise 
            content={visualContent}
            {...exerciseProps}
          />
        );
        
      default:
        return (
          <div className="text-center text-gray-500">
            Select a demo from the navigation above
          </div>
        );
    }
  };
  
  return (
    <LearningProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Demo Navigation */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              🇦🇱 Gheg Albanian Learning - Phase 2.2 Demo
            </h1>
            
            {/* Demo Selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              {demoOptions.map(option => (
                <button
                  key={option.key}
                  onClick={() => setCurrentDemo(option.key)}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-colors
                    flex items-center gap-2
                    ${currentDemo === option.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }
                  `}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
            
            {/* Exercise Completion Log */}
            {completedExercises.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h3 className="text-sm font-medium text-green-800 mb-2">
                  ✅ Completed Exercises ({completedExercises.length})
                </h3>
                <div className="text-xs text-green-700 space-y-1">
                  {completedExercises.slice(-3).map((exercise, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span>
                        {exercise.type === 'flashcard' && '🃏'}
                        {exercise.type === 'audio' && '🎧'}
                        {exercise.type === 'conversation' && '💬'}
                        {exercise.type === 'visual' && '🖼️'}
                      </span>
                      <span>{exercise.type} exercise completed</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Demo Content */}
        <div className="py-6">
          {renderDemo()}
        </div>
        
        {/* Instructions */}
        <div className="bg-blue-50 border-t border-blue-200 p-4">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-medium text-blue-900 mb-2">
              🎮 How to Test the Demo
            </h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Full Lesson:</strong> Experience the complete learning flow with all exercise types</p>
              <p><strong>Individual Exercises:</strong> Test each component separately</p>
              <p><strong>Mobile:</strong> Swipe gestures work on touch devices</p>
              <p><strong>Audio:</strong> Click audio buttons to hear Albanian pronunciation</p>
              <p><strong>Keyboard:</strong> Spacebar to flip cards, 1-4 for difficulty rating</p>
            </div>
          </div>
        </div>
      </div>
    </LearningProvider>
  );
};

export default DemoApp;