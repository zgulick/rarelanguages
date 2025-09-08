/**
 * App Context - Simple Global State Management
 * Handles navigation, lesson progress, and user preferences
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { mockLesson, mockContent } from '../lib/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Core app state
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  
  // Progress tracking
  const [lessonProgress, setLessonProgress] = useState({});
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [learnedTopics, setLearnedTopics] = useState(new Set());
  
  // Navigation state
  const [currentPage, setCurrentPage] = useState('home');
  const [navigationHistory, setNavigationHistory] = useState(['home']);
  
  // User preferences
  const [preferences, setPreferences] = useState({
    audioEnabled: true,
    pronunciationShown: true,
    culturalContextShown: true,
    sessionLength: 10 // minutes
  });
  
  // Load saved data on mount
  useEffect(() => {
    try {
      const savedPrefs = localStorage.getItem('userPreferences');
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
      
      const savedProgress = localStorage.getItem('lessonProgress');
      if (savedProgress) {
        setLessonProgress(JSON.parse(savedProgress));
      }
      
      const savedLanguage = localStorage.getItem('selectedLanguage');
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  }, []);
  
  // Save preferences when they change
  useEffect(() => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }, [preferences]);
  
  // Save progress when it changes
  useEffect(() => {
    try {
      localStorage.setItem('lessonProgress', JSON.stringify(lessonProgress));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [lessonProgress]);
  
  // Mock lessons data (would come from API in Phase 4)
  const mockLessons = [
    {
      id: 'lesson_1',
      title: 'Greetings & Basics',
      description: 'Essential greetings for family interactions',
      difficulty: 1,
      estimatedMinutes: 8,
      content: mockContent.slice(0, 5),
      completed: false,
      topics: ['greetings', 'basics']
    },
    {
      id: 'lesson_2', 
      title: 'Family Members',
      description: 'Introduce and talk about family',
      difficulty: 2,
      estimatedMinutes: 10,
      content: mockContent.slice(5, 10),
      completed: false,
      topics: ['family', 'introductions']
    },
    {
      id: 'lesson_3',
      title: 'Coffee & Hospitality', 
      description: 'Albanian coffee culture and politeness',
      difficulty: 2,
      estimatedMinutes: 12,
      content: mockContent.slice(10, 15),
      completed: false,
      topics: ['hospitality', 'food']
    }
  ];
  
  // Navigation methods
  const navigateTo = (page, params = {}) => {
    setNavigationHistory(prev => [...prev, currentPage]);
    setCurrentPage(page);
    
    // Handle page-specific logic
    if (page === 'lesson' && params.lessonId) {
      const lesson = mockLessons.find(l => l.id === params.lessonId);
      setCurrentLesson(lesson);
    }
  };
  
  const goBack = () => {
    if (navigationHistory.length > 1) {
      const previousPage = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      setCurrentPage(previousPage);
    }
  };
  
  // Lesson management
  const getNextLesson = () => {
    // Simple algorithm - would be replaced with spaced repetition in Phase 4
    const uncompletedLessons = mockLessons.filter(lesson => 
      !completedLessons.has(lesson.id)
    );
    
    if (uncompletedLessons.length > 0) {
      return uncompletedLessons[0];
    }
    
    // All lessons completed, return first for review
    return mockLessons[0];
  };
  
  const getCurrentLessonProgress = () => {
    if (!currentLesson) return null;
    
    return lessonProgress[currentLesson.id] || {
      completed: false,
      exercisesCompleted: 0,
      totalExercises: 4, // FlashCard, Audio, Visual, Conversation
      accuracy: 0,
      timeSpent: 0
    };
  };
  
  const updateLessonProgress = (lessonId, progress) => {
    setLessonProgress(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        ...progress,
        lastUpdated: Date.now()
      }
    }));
    
    // Mark lesson as completed if all exercises done
    if (progress.exercisesCompleted >= 4) {
      setCompletedLessons(prev => new Set([...prev, lessonId]));
      
      // Add topics to learned topics
      const lesson = mockLessons.find(l => l.id === lessonId);
      if (lesson) {
        setLearnedTopics(prev => new Set([...prev, ...lesson.topics]));
      }
    }
  };
  
  const getCompletedLessons = () => {
    return mockLessons.filter(lesson => completedLessons.has(lesson.id));
  };
  
  const getPracticeContent = (topic) => {
    // Get content from completed lessons for this topic
    const completedLessonsList = getCompletedLessons();
    const topicContent = [];
    
    completedLessonsList.forEach(lesson => {
      if (lesson.topics.includes(topic)) {
        topicContent.push(...lesson.content);
      }
    });
    
    return topicContent;
  };
  
  const updatePreferences = (newPreferences) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
  };
  
  // App state summary
  const getAppSummary = () => {
    return {
      totalLessons: mockLessons.length,
      completedLessons: completedLessons.size,
      learnedTopics: learnedTopics.size,
      currentStreak: 0, // Would be calculated from progress data
      nextLesson: getNextLesson()
    };
  };
  
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
    mockLessons,
    
    // Navigation
    navigateTo,
    goBack,
    
    // Lesson management
    getNextLesson,
    getCurrentLessonProgress,
    updateLessonProgress,
    getCompletedLessons,
    getPracticeContent,
    
    // Settings
    updatePreferences,
    setSelectedLanguage,
    
    // Helpers
    getAppSummary
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