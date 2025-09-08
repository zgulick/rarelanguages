/**
 * Updated App Context - Real API Integration for Phase 4.1
 * Replaces mock data with real backend API calls
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import apiClient, { apiHelpers, apiErrors } from '../lib/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Core app state
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Progress tracking (now managed by backend)
  const [lessonProgress, setLessonProgress] = useState({});
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [learnedTopics, setLearnedTopics] = useState(new Set());
  
  // Navigation state
  const [currentPage, setCurrentPage] = useState('home');
  const [navigationHistory, setNavigationHistory] = useState(['home']);
  
  // User preferences (now synced with backend)
  const [preferences, setPreferences] = useState({
    audioEnabled: true,
    pronunciationShown: true,
    culturalContextShown: true,
    sessionLength: 10 // minutes
  });

  // Initialize user on app load
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        
        // Load saved language preference
        const savedLanguage = localStorage.getItem('selectedLanguage');
        if (savedLanguage) {
          setSelectedLanguage(savedLanguage);
        }

        // Initialize user (guest or returning user)
        const user = await apiHelpers.initializeUser();
        setCurrentUser(user);
        
        // Update preferences from backend
        if (user.preferences) {
          setPreferences({
            audioEnabled: true,
            pronunciationShown: user.preferences.pronunciationShown,
            culturalContextShown: user.preferences.culturalContextShown,
            sessionLength: 10
          });
        }

      } catch (error) {
        console.error('Failed to initialize app:', error);
        setError(apiErrors.getUserFriendlyMessage(error));
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Save preferences when they change
  useEffect(() => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }, [preferences]);

  // Navigation methods
  const navigateTo = async (page, params = {}) => {
    setNavigationHistory(prev => [...prev, currentPage]);
    setCurrentPage(page);
    
    // Handle page-specific logic with real API calls
    if (page === 'lesson' && params.lessonId && currentUser) {
      try {
        setLoading(true);
        const lessonData = await apiClient.lessons.getLessonContent(params.lessonId);
        setCurrentLesson(lessonData.lesson);
      } catch (error) {
        console.error('Failed to load lesson:', error);
        setError(apiErrors.getUserFriendlyMessage(error));
      } finally {
        setLoading(false);
      }
    }
  };

  const goBack = () => {
    if (navigationHistory.length > 1) {
      const previousPage = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      setCurrentPage(previousPage);
      
      // Clear current lesson if leaving lesson page
      if (currentPage === 'lesson') {
        setCurrentLesson(null);
      }
    }
  };

  // Lesson management with real API
  const getNextLesson = async () => {
    if (!currentUser) return null;
    
    try {
      setLoading(true);
      const response = await apiClient.lessons.getNextLesson(currentUser.userId);
      return response.lesson;
    } catch (error) {
      console.error('Error getting next lesson:', error);
      setError(apiErrors.getUserFriendlyMessage(error));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLessonProgress = () => {
    if (!currentLesson) return null;
    
    // Return cached progress or default
    return lessonProgress[currentLesson.id] || {
      completed: false,
      exercisesCompleted: 0,
      totalExercises: 4,
      accuracy: 0,
      timeSpent: 0
    };
  };

  const updateLessonProgress = async (lessonId, exerciseData) => {
    if (!currentUser) return;

    try {
      const progressData = {
        userId: currentUser.userId,
        contentId: exerciseData.contentId,
        lessonId: lessonId,
        exerciseType: exerciseData.exerciseType || 'flashcard',
        responseQuality: exerciseData.responseQuality || 3,
        timeSpent: exerciseData.timeSpent || 0,
        correct: exerciseData.correct || false
      };

      const result = await apiClient.progress.updateProgress(progressData);
      
      // Update local state with API response
      setLessonProgress(prev => ({
        ...prev,
        [lessonId]: {
          completed: result.lessonProgress.completed,
          exercisesCompleted: result.lessonProgress.exercisesCompleted,
          totalExercises: result.lessonProgress.totalExercises,
          accuracy: result.lessonProgress.accuracy,
          timeSpent: (prev[lessonId]?.timeSpent || 0) + (exerciseData.timeSpent || 0)
        }
      }));

      // Update completed lessons set if lesson is now complete
      if (result.lessonProgress.completed) {
        setCompletedLessons(prev => new Set([...prev, lessonId]));
        
        // Add topics to learned topics (this would ideally come from the API)
        if (currentLesson && currentLesson.topics) {
          setLearnedTopics(prev => new Set([...prev, ...currentLesson.topics]));
        }
      }

      return result;
    } catch (error) {
      console.error('Error updating progress:', error);
      setError(apiErrors.getUserFriendlyMessage(error));
    }
  };

  const getCompletedLessons = () => {
    // In a full implementation, this would be fetched from the API
    // For now, we'll use the local state
    return Array.from(completedLessons).map(lessonId => ({
      id: lessonId,
      // These would be fetched from API in production
      title: `Lesson ${lessonId}`,
      topics: []
    }));
  };

  const getPracticeContent = async (topic) => {
    if (!currentUser) return [];
    
    try {
      const response = await apiClient.practice.getPracticeContent(currentUser.userId, topic);
      return response.content || [];
    } catch (error) {
      console.error('Error getting practice content:', error);
      setError(apiErrors.getUserFriendlyMessage(error));
      return [];
    }
  };

  const getReviewQueue = async (limit = 20) => {
    if (!currentUser) return [];
    
    try {
      const response = await apiClient.review.getReviewQueue(currentUser.userId, limit);
      return response.reviewItems || [];
    } catch (error) {
      console.error('Error getting review queue:', error);
      setError(apiErrors.getUserFriendlyMessage(error));
      return [];
    }
  };

  const updatePreferences = (newPreferences) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
  };

  // App state summary with real data
  const getAppSummary = () => {
    return {
      totalLessons: currentUser?.progress?.totalLessonsCompleted || 0,
      completedLessons: completedLessons.size,
      learnedTopics: learnedTopics.size,
      currentStreak: currentUser?.progress?.currentStreak || 0,
      nextLesson: null // This will be fetched when needed
    };
  };

  // Error handling utilities
  const clearError = () => setError(null);

  const value = {
    // State
    currentUser,
    selectedLanguage,
    currentLesson,
    lessonProgress,
    completedLessons,
    learnedTopics,
    currentPage,
    navigationHistory,
    preferences,
    loading,
    error,
    
    // Navigation
    navigateTo,
    goBack,
    
    // Lesson management (now with real API)
    getNextLesson,
    getCurrentLessonProgress,
    updateLessonProgress,
    getCompletedLessons,
    getPracticeContent,
    getReviewQueue,
    
    // Settings
    updatePreferences,
    setSelectedLanguage,
    
    // Helpers
    getAppSummary,
    clearError,
    
    // API helpers for direct use
    apiClient,
    apiHelpers
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook to use app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;