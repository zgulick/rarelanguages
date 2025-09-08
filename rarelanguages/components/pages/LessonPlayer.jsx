/**
 * LessonPlayer Component - Exercise Orchestrator
 * Simplified lesson flow that integrates with AppContext and Phase 2.2 exercises
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import FlashcardExercise from '../exercises/FlashcardExercise';
import AudioExercise from '../exercises/AudioExercise';
import ConversationExercise from '../exercises/ConversationExercise';
import VisualExercise from '../exercises/VisualExercise';

const LessonPlayer = () => {
  const { 
    currentLesson, 
    getCurrentLessonProgress, 
    updateLessonProgress,
    navigateTo,
    preferences 
  } = useApp();
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [responses, setResponses] = useState([]);
  
  // Exercise flow configuration - matches Phase 2.2 structure
  const exerciseFlow = [
    {
      component: 'FlashcardExercise',
      name: 'Flashcards',
      icon: '🃏',
      duration: 3,
      description: 'Learn new vocabulary'
    },
    {
      component: 'AudioExercise', 
      name: 'Audio Practice',
      icon: '🎧',
      duration: 3,
      description: 'Practice pronunciation'
    },
    {
      component: 'VisualExercise',
      name: 'Visual Learning', 
      icon: '🖼️',
      duration: 2,
      description: 'Visual recognition'
    },
    {
      component: 'ConversationExercise',
      name: 'Conversations',
      icon: '💬', 
      duration: 3,
      description: 'Apply in context'
    }
  ];
  
  const currentExercise = exerciseFlow[currentExerciseIndex];
  const isLastExercise = currentExerciseIndex >= exerciseFlow.length - 1;
  
  useEffect(() => {
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }
  }, [sessionStartTime]);
  
  useEffect(() => {
    // Load existing progress if resuming
    const progress = getCurrentLessonProgress();
    if (progress && progress.exercisesCompleted > 0) {
      setCurrentExerciseIndex(Math.min(progress.exercisesCompleted, exerciseFlow.length - 1));
    }
  }, [getCurrentLessonProgress]);
  
  if (!currentLesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Lesson Selected</h2>
          <p className="text-gray-600 mb-4">Please select a lesson to begin learning.</p>
          <button
            onClick={() => navigateTo('dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  const handleExerciseComplete = (exerciseResults) => {
    console.log('Exercise completed:', exerciseResults);
    
    // Update progress
    const newProgress = {
      exercisesCompleted: currentExerciseIndex + 1,
      totalExercises: exerciseFlow.length,
      timeSpent: sessionStartTime ? Date.now() - sessionStartTime : 0,
      accuracy: calculateAccuracy()
    };
    
    updateLessonProgress(currentLesson.id, newProgress);
    
    if (isLastExercise) {
      // Lesson complete - show completion screen
      handleLessonComplete();
    } else {
      // Move to next exercise
      transitionToNextExercise();
    }
  };
  
  const handleExerciseResponse = (response) => {
    setResponses(prev => [...prev, {
      ...response,
      timestamp: Date.now(),
      exerciseIndex: currentExerciseIndex,
      exerciseType: currentExercise.component
    }]);
  };
  
  const transitionToNextExercise = () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentExerciseIndex(prev => prev + 1);
      setIsTransitioning(false);
    }, 1500);
  };
  
  const handleLessonComplete = () => {
    // Navigate to completion screen or back to dashboard
    setTimeout(() => {
      navigateTo('dashboard');
    }, 2000);
  };
  
  const calculateAccuracy = () => {
    if (responses.length === 0) return 0;
    
    const correctResponses = responses.filter(r => r.correct).length;
    return Math.round((correctResponses / responses.length) * 100);
  };
  
  const getExerciseContent = () => {
    if (!currentLesson || !currentLesson.content) return [];
    
    // For different exercises, we might want different content amounts
    const contentLimits = {
      FlashcardExercise: 8,
      AudioExercise: 6, 
      VisualExercise: 5,
      ConversationExercise: 3
    };
    
    const limit = contentLimits[currentExercise.component] || currentLesson.content.length;
    return currentLesson.content.slice(0, limit);
  };
  
  const getConversationScenarios = () => {
    // Generate conversation scenarios based on lesson content
    return [
      {
        id: `scenario_${currentLesson.id}`,
        category: currentLesson.topics?.[0] || 'general',
        title: `${currentLesson.title} Conversation`,
        context: `Practice using phrases from: ${currentLesson.title}`,
        difficulty: currentLesson.difficulty || 2,
        cultural_notes: "Remember Albanian family values and show respect in your interactions.",
        exchanges: currentLesson.content.slice(0, 3).map((item, idx) => ({
          id: `exchange_${idx}`,
          speaker: idx % 2 === 0 ? "Family Member" : "You",
          text: item.target_phrase,
          translation: item.english_phrase,
          responses: [
            { 
              text: item.target_phrase, 
              translation: item.english_phrase, 
              correct: true 
            },
            { 
              text: "Nuk kuptoj", 
              translation: "I don't understand", 
              correct: false 
            },
            { 
              text: "Më fal", 
              translation: "Excuse me", 
              correct: false 
            }
          ]
        }))
      }
    ];
  };
  
  const getVisualContent = () => {
    // Convert lesson content to visual format
    return currentLesson.content.slice(0, 5).map((item, index) => ({
      id: `visual_${item.id}`,
      phrase: item.target_phrase,
      pronunciation: item.pronunciation_guide,
      images: getVisualImages(currentLesson.topics?.[0] || 'family'),
      correct: 0,
      category: currentLesson.topics?.[0] || 'family',
      context: item.cultural_context
    }));
  };
  
  const getVisualImages = (category) => {
    const imageMap = {
      greetings: ["👋", "🤝", "😊", "👨‍👩‍👧‍👦"],
      family: ["👨‍🦳", "👩‍🦳", "👦", "👧"], 
      hospitality: ["☕", "🍰", "🏠", "🪑"],
      food: ["🥘", "🍞", "🧀", "🍷"],
      default: ["🏠", "👥", "💬", "❤️"]
    };
    
    return imageMap[category] || imageMap.default;
  };
  
  const renderTransition = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-5xl mb-4">🔄</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Great Progress!
          </h2>
          <p className="text-gray-600 mb-4">
            Moving to {currentExercise.name}...
          </p>
          <div className="flex items-center gap-2 justify-center text-sm text-gray-500">
            <span className="text-lg">{currentExercise.icon}</span>
            <span>{currentExercise.description}</span>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderLessonComplete = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-green-800 mb-2">
            Lesson Complete!
          </h2>
          <p className="text-gray-600 mb-4">
            You've completed "{currentLesson.title}"
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="text-sm text-green-800">
              <div className="flex justify-between mb-1">
                <span>Accuracy:</span>
                <span className="font-medium">{calculateAccuracy()}%</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Time:</span>
                <span className="font-medium">
                  {sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 60000) : 0} min
                </span>
              </div>
              <div className="flex justify-between">
                <span>Exercises:</span>
                <span className="font-medium">{exerciseFlow.length}/{exerciseFlow.length}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Returning to dashboard...
          </p>
        </div>
      </div>
    </div>
  );
  
  const renderCurrentExercise = () => {
    const exerciseProps = {
      onComplete: handleExerciseComplete,
      onResponse: handleExerciseResponse,
      showPronunciation: preferences.pronunciationShown,
      showCultural: preferences.culturalContextShown
    };
    
    switch (currentExercise.component) {
      case 'FlashcardExercise':
        return (
          <FlashcardExercise
            content={getExerciseContent()}
            {...exerciseProps}
          />
        );
        
      case 'AudioExercise':
        return (
          <AudioExercise
            content={getExerciseContent()}
            {...exerciseProps}
          />
        );
        
      case 'ConversationExercise':
        return (
          <ConversationExercise
            scenarios={getConversationScenarios()}
            {...exerciseProps}
          />
        );
        
      case 'VisualExercise':
        return (
          <VisualExercise
            content={getVisualContent()}
            {...exerciseProps}
          />
        );
        
      default:
        return (
          <div className="text-center text-red-600">
            Unknown exercise type: {currentExercise.component}
          </div>
        );
    }
  };
  
  if (isTransitioning) {
    return renderTransition();
  }
  
  if (isLastExercise && responses.length > 0) {
    // Show completion after last exercise is done
    return renderLessonComplete();
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Lesson Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Lesson Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">📖</div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {currentLesson.title}
              </h1>
              <p className="text-sm text-gray-600">
                {currentLesson.description}
              </p>
            </div>
            {/* Exit Button */}
            <button
              onClick={() => navigateTo('dashboard')}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
              aria-label="Exit lesson"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Lesson Progress</span>
              <span>{currentExerciseIndex + 1} of {exerciseFlow.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${((currentExerciseIndex + 1) / exerciseFlow.length) * 100}%` 
                }}
              />
            </div>
            
            {/* Current Exercise Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg">{currentExercise.icon}</span>
                <span className="font-medium text-gray-700">
                  {currentExercise.name}
                </span>
                <span className="text-gray-500">
                  (~{currentExercise.duration} min)
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Accuracy: {calculateAccuracy()}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Exercise Content */}
      <div className="py-6">
        {renderCurrentExercise()}
      </div>
      
      {/* Session Stats Footer */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center text-sm text-gray-600">
          <div>
            Time: {sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 60000) : 0} min
          </div>
          <div>
            Responses: {responses.length}
          </div>
          <div>
            {responses.filter(r => r.correct).length}/{responses.length} correct
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;