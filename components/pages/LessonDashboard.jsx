/**
 * LessonDashboard Component - Main Learning Hub
 * Updated for Phase 4.1 with real API integration
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

const LessonDashboard = () => {
  const { 
    navigateTo, 
    getNextLesson, 
    completedLessons,
    getAppSummary,
    learnedTopics,
    currentUser,
    loading,
    error,
    clearError
  } = useApp();
  
  const [nextLesson, setNextLesson] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  const appSummary = getAppSummary();

  // Load next lesson when user is available
  useEffect(() => {
    const loadNextLesson = async () => {
      if (currentUser && !dashboardLoading) {
        try {
          setDashboardLoading(true);
          const lesson = await getNextLesson();
          setNextLesson(lesson);
        } catch (error) {
          console.error('Failed to load next lesson:', error);
        } finally {
          setDashboardLoading(false);
        }
      }
    };

    loadNextLesson();
  }, [currentUser, getNextLesson]);
  
  const handleContinueLesson = () => {
    if (nextLesson) {
      navigateTo('lesson', { lessonId: nextLesson.id });
    }
  };
  
  const handleStartFromBeginning = async () => {
    // For now, this would need to fetch the first available lesson from API
    // This is a placeholder implementation
    if (nextLesson) {
      navigateTo('lesson', { lessonId: nextLesson.id });
    }
  };
  
  const handlePracticeHub = () => {
    navigateTo('practice');
  };
  
  const getLessonStatusIcon = (lesson) => {
    if (completedLessons.has(lesson.id)) {
      return '✅';
    } else if (lesson.id === nextLesson?.id) {
      return '📖'; // Currently studying
    } else {
      return '⚪'; // Not started
    }
  };
  
  const canReview = completedLessons.size > 0;
  const canPractice = learnedTopics.size > 0;
  
  // Loading state for initial user setup
  if (!currentUser && loading) {
    return (
      <div className="pt-16 pb-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Setting up your learning session...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="pt-6 space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Connection Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => {
              clearError();
              window.location.reload();
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6 space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🇦🇱 Gheg Albanian
        </h1>
        <p className="text-gray-600">
          Ready to connect with your Albanian family
        </p>
        {currentUser && (
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {currentUser.preferredName}!
          </p>
        )}
      </div>
      
      {/* Continue Learning - Prominent CTA */}
      <div className="space-y-4">
        <button
          onClick={handleContinueLesson}
          disabled={dashboardLoading || !nextLesson}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-6 px-6 rounded-lg text-xl font-medium transition-colors shadow-sm"
        >
          <div className="space-y-1">
            <div>
              {dashboardLoading ? 'Loading...' : 'Continue Your Lesson'}
            </div>
            <div className="text-blue-100 text-base font-normal">
              {dashboardLoading ? 'Finding your next lesson' : (nextLesson?.title || 'Start Learning')}
            </div>
          </div>
        </button>
        
        {nextLesson && !dashboardLoading && (
          <div className="text-center text-sm text-gray-500">
            ~{nextLesson.estimated_minutes || nextLesson.estimatedMinutes} minutes • {nextLesson.description}
          </div>
        )}
      </div>
      
      {/* Progress Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="font-medium text-gray-900 mb-3">Your Progress</h2>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {appSummary.completedLessons}
            </div>
            <div className="text-sm text-gray-600">
              Lessons Completed
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {appSummary.learnedTopics}
            </div>
            <div className="text-sm text-gray-600">
              Topics Learned
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Options */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Other Options:</h2>
        
        <div className="space-y-3">
          {/* Start from Beginning */}
          <button
            onClick={handleStartFromBeginning}
            className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="text-xl">🚀</div>
              <div>
                <div className="font-medium text-gray-900">Start from Beginning</div>
                <div className="text-sm text-gray-500">Review all lessons from the start</div>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Review Words */}
          <button
            onClick={() => {/* TODO: Implement review algorithm */}}
            disabled={!canReview}
            className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors text-left ${
              canReview 
                ? 'bg-white border-gray-200 hover:bg-gray-50' 
                : 'bg-gray-50 border-gray-100 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="text-xl">🔄</div>
              <div>
                <div className={`font-medium ${canReview ? 'text-gray-900' : 'text-gray-400'}`}>
                  Review Words
                </div>
                <div className={`text-sm ${canReview ? 'text-gray-500' : 'text-gray-400'}`}>
                  {canReview ? 'Algorithm-driven spaced repetition' : 'Complete lessons to unlock'}
                </div>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {/* Practice by Topic */}
          <button
            onClick={handlePracticeHub}
            disabled={!canPractice}
            className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors text-left ${
              canPractice 
                ? 'bg-white border-gray-200 hover:bg-gray-50' 
                : 'bg-gray-50 border-gray-100 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="text-xl">🎯</div>
              <div>
                <div className={`font-medium ${canPractice ? 'text-gray-900' : 'text-gray-400'}`}>
                  Practice by Topic
                </div>
                <div className={`text-sm ${canPractice ? 'text-gray-500' : 'text-gray-400'}`}>
                  {canPractice ? 'Reinforce what you\'ve learned' : 'Complete lessons to unlock'}
                </div>
              </div>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Lesson List */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">All Lessons:</h2>
        
        <div className="space-y-2">
          {mockLessons.map((lesson, index) => (
            <button
              key={lesson.id}
              onClick={() => navigateTo('lesson', { lessonId: lesson.id })}
              className="w-full flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="text-xl">
                {getLessonStatusIcon(lesson)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {lesson.title}
                </div>
                <div className="text-sm text-gray-500">
                  {lesson.description}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  ~{lesson.estimatedMinutes} minutes • Difficulty {lesson.difficulty}/5
                </div>
              </div>
              <div className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Motivational Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <div className="text-blue-800 font-medium mb-1">
          🎯 Your Goal: Family Integration
        </div>
        <div className="text-blue-600 text-sm">
          Every lesson brings you closer to natural Albanian conversations
        </div>
      </div>
    </div>
  );
};

export default LessonDashboard;