/**
 * Learning Context - Global State Management for Exercise Flow
 * Manages lesson progress, user preferences, and session data
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';

// Initial state
const initialState = {
  // Current lesson data
  currentLesson: null,
  currentExerciseIndex: 0,
  currentExerciseType: null,
  
  // Session progress
  sessionProgress: {
    startTime: null,
    totalTimeSpent: 0,
    exercisesCompleted: 0,
    correctResponses: 0,
    totalResponses: 0,
    streak: 0,
    longestStreak: 0
  },
  
  // Phase 3 Enhancement: Pedagogical progression tracking
  pedagogicalProgress: {
    currentLevel: 'recognition', // recognition, guided_practice, independent_production, cultural_integration
    microStepsCompleted: 0,
    totalMicroSteps: 0,
    levelProgress: 0, // percentage within current level
    culturalCompetencyLevel: 'awareness', // awareness, knowledge, understanding, integration
    culturalResponses: [],
    performanceHistory: []
  },
  
  // User preferences
  userPreferences: {
    audioEnabled: true,
    pronunciationShown: true,
    culturalContextShown: true,
    difficultyAutoAdjust: true,
    speechRecognitionEnabled: true,
    preferredExerciseTypes: ['flashcard', 'conversation', 'audio_repeat'],
    sessionLength: 10, // minutes
    autoAdvance: false,
    darkMode: false
  },
  
  // Exercise responses for spaced repetition
  responses: [],
  
  // UI state
  isLoading: false,
  error: null,
  showSettings: false
};

// Action types
const actionTypes = {
  SET_CURRENT_LESSON: 'SET_CURRENT_LESSON',
  SET_CURRENT_EXERCISE: 'SET_CURRENT_EXERCISE',
  START_SESSION: 'START_SESSION',
  END_SESSION: 'END_SESSION',
  RECORD_RESPONSE: 'RECORD_RESPONSE',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  TOGGLE_SETTINGS: 'TOGGLE_SETTINGS',
  RESET_SESSION: 'RESET_SESSION',
  // Phase 3 Enhancement: Pedagogical progression actions
  UPDATE_PEDAGOGICAL_LEVEL: 'UPDATE_PEDAGOGICAL_LEVEL',
  ADVANCE_MICRO_STEP: 'ADVANCE_MICRO_STEP',
  RECORD_CULTURAL_RESPONSE: 'RECORD_CULTURAL_RESPONSE',
  UPDATE_CULTURAL_COMPETENCY: 'UPDATE_CULTURAL_COMPETENCY',
  RECORD_PERFORMANCE: 'RECORD_PERFORMANCE'
};

// Reducer function
const learningReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_CURRENT_LESSON:
      return {
        ...state,
        currentLesson: action.payload,
        currentExerciseIndex: 0,
        currentExerciseType: action.payload?.exercise_flow?.[0]?.component || null
      };
      
    case actionTypes.SET_CURRENT_EXERCISE:
      return {
        ...state,
        currentExerciseIndex: action.payload.index,
        currentExerciseType: action.payload.type
      };
      
    case actionTypes.START_SESSION:
      return {
        ...state,
        sessionProgress: {
          ...state.sessionProgress,
          startTime: Date.now(),
          totalTimeSpent: 0,
          exercisesCompleted: 0,
          correctResponses: 0,
          totalResponses: 0,
          streak: 0
        },
        responses: []
      };
      
    case actionTypes.END_SESSION:
      const endTime = Date.now();
      const totalTime = state.sessionProgress.startTime 
        ? endTime - state.sessionProgress.startTime 
        : 0;
      
      return {
        ...state,
        sessionProgress: {
          ...state.sessionProgress,
          totalTimeSpent: totalTime
        }
      };
      
    case actionTypes.RECORD_RESPONSE:
      const response = action.payload;
      const newCorrectCount = response.correct 
        ? state.sessionProgress.correctResponses + 1
        : state.sessionProgress.correctResponses;
      
      const newStreak = response.correct 
        ? state.sessionProgress.streak + 1
        : 0;
      
      const newLongestStreak = Math.max(newStreak, state.sessionProgress.longestStreak);
      
      return {
        ...state,
        sessionProgress: {
          ...state.sessionProgress,
          totalResponses: state.sessionProgress.totalResponses + 1,
          correctResponses: newCorrectCount,
          streak: newStreak,
          longestStreak: newLongestStreak
        },
        responses: [...state.responses, {
          ...response,
          timestamp: Date.now(),
          sessionId: state.sessionProgress.startTime
        }]
      };
      
    case actionTypes.UPDATE_PROGRESS:
      return {
        ...state,
        sessionProgress: {
          ...state.sessionProgress,
          ...action.payload
        }
      };
      
    case actionTypes.UPDATE_PREFERENCES:
      const updatedPreferences = {
        ...state.userPreferences,
        ...action.payload
      };
      
      // Persist to localStorage
      try {
        localStorage.setItem('learningPreferences', JSON.stringify(updatedPreferences));
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
      
      return {
        ...state,
        userPreferences: updatedPreferences
      };
      
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
      
    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
      
    case actionTypes.TOGGLE_SETTINGS:
      return {
        ...state,
        showSettings: !state.showSettings
      };
      
    case actionTypes.RESET_SESSION:
      return {
        ...state,
        currentExerciseIndex: 0,
        currentExerciseType: state.currentLesson?.exercise_flow?.[0]?.component || null,
        sessionProgress: {
          startTime: null,
          totalTimeSpent: 0,
          exercisesCompleted: 0,
          correctResponses: 0,
          totalResponses: 0,
          streak: 0,
          longestStreak: state.sessionProgress.longestStreak // Preserve best streak
        },
        responses: [],
        error: null
      };
      
    // Phase 3 Enhancement: Pedagogical progression reducers
    case actionTypes.UPDATE_PEDAGOGICAL_LEVEL:
      return {
        ...state,
        pedagogicalProgress: {
          ...state.pedagogicalProgress,
          currentLevel: action.payload.level,
          levelProgress: action.payload.progress || 0,
          microStepsCompleted: 0, // Reset micro-steps for new level
          totalMicroSteps: action.payload.totalMicroSteps || 5
        }
      };
      
    case actionTypes.ADVANCE_MICRO_STEP:
      const newMicroStepsCompleted = state.pedagogicalProgress.microStepsCompleted + 1;
      const newLevelProgress = (newMicroStepsCompleted / state.pedagogicalProgress.totalMicroSteps) * 100;
      
      return {
        ...state,
        pedagogicalProgress: {
          ...state.pedagogicalProgress,
          microStepsCompleted: newMicroStepsCompleted,
          levelProgress: Math.min(newLevelProgress, 100)
        }
      };
      
    case actionTypes.RECORD_CULTURAL_RESPONSE:
      return {
        ...state,
        pedagogicalProgress: {
          ...state.pedagogicalProgress,
          culturalResponses: [...state.pedagogicalProgress.culturalResponses, {
            ...action.payload,
            timestamp: Date.now()
          }]
        }
      };
      
    case actionTypes.UPDATE_CULTURAL_COMPETENCY:
      return {
        ...state,
        pedagogicalProgress: {
          ...state.pedagogicalProgress,
          culturalCompetencyLevel: action.payload.level
        }
      };
      
    case actionTypes.RECORD_PERFORMANCE:
      const updatedPerformanceHistory = [
        ...state.pedagogicalProgress.performanceHistory,
        {
          ...action.payload,
          timestamp: Date.now()
        }
      ].slice(-50); // Keep last 50 performance records
      
      return {
        ...state,
        pedagogicalProgress: {
          ...state.pedagogicalProgress,
          performanceHistory: updatedPerformanceHistory
        }
      };
      
    default:
      return state;
  }
};

// Create context
const LearningContext = createContext();

// Context provider component
export const LearningProvider = ({ children }) => {
  const [state, dispatch] = useReducer(learningReducer, initialState);
  
  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('learningPreferences');
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        dispatch({
          type: actionTypes.UPDATE_PREFERENCES,
          payload: preferences
        });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, []);
  
  // Action creators
  const actions = {
    setCurrentLesson: (lesson) => {
      dispatch({
        type: actionTypes.SET_CURRENT_LESSON,
        payload: lesson
      });
    },
    
    setCurrentExercise: (index, type) => {
      dispatch({
        type: actionTypes.SET_CURRENT_EXERCISE,
        payload: { index, type }
      });
    },
    
    startSession: () => {
      dispatch({ type: actionTypes.START_SESSION });
    },
    
    endSession: () => {
      dispatch({ type: actionTypes.END_SESSION });
    },
    
    recordResponse: (response) => {
      dispatch({
        type: actionTypes.RECORD_RESPONSE,
        payload: response
      });
    },
    
    updateProgress: (progress) => {
      dispatch({
        type: actionTypes.UPDATE_PROGRESS,
        payload: progress
      });
    },
    
    updatePreferences: (preferences) => {
      dispatch({
        type: actionTypes.UPDATE_PREFERENCES,
        payload: preferences
      });
    },
    
    setLoading: (loading) => {
      dispatch({
        type: actionTypes.SET_LOADING,
        payload: loading
      });
    },
    
    setError: (error) => {
      dispatch({
        type: actionTypes.SET_ERROR,
        payload: error
      });
    },
    
    toggleSettings: () => {
      dispatch({ type: actionTypes.TOGGLE_SETTINGS });
    },
    
    resetSession: () => {
      dispatch({ type: actionTypes.RESET_SESSION });
    },
    
    // Phase 3 Enhancement: Pedagogical progression actions
    updatePedagogicalLevel: (level, progress, totalMicroSteps) => {
      dispatch({
        type: actionTypes.UPDATE_PEDAGOGICAL_LEVEL,
        payload: { level, progress, totalMicroSteps }
      });
    },
    
    advanceMicroStep: () => {
      dispatch({ type: actionTypes.ADVANCE_MICRO_STEP });
    },
    
    recordCulturalResponse: (response) => {
      dispatch({
        type: actionTypes.RECORD_CULTURAL_RESPONSE,
        payload: response
      });
    },
    
    updateCulturalCompetency: (level) => {
      dispatch({
        type: actionTypes.UPDATE_CULTURAL_COMPETENCY,
        payload: { level }
      });
    },
    
    recordPerformance: (performance) => {
      dispatch({
        type: actionTypes.RECORD_PERFORMANCE,
        payload: performance
      });
    }
  };
  
  // Computed values
  const computed = {
    sessionAccuracy: state.sessionProgress.totalResponses > 0 
      ? (state.sessionProgress.correctResponses / state.sessionProgress.totalResponses) * 100
      : 0,
    
    isSessionActive: state.sessionProgress.startTime !== null,
    
    currentExerciseConfig: state.currentLesson?.exercise_flow?.[state.currentExerciseIndex] || null,
    
    isLastExercise: state.currentLesson?.exercise_flow 
      ? state.currentExerciseIndex >= state.currentLesson.exercise_flow.length - 1
      : true,
    
    sessionTimeMinutes: state.sessionProgress.totalTimeSpent 
      ? Math.floor(state.sessionProgress.totalTimeSpent / 60000)
      : 0,
    
    // Phase 3 Enhancement: Pedagogical progression computed values
    currentPedagogicalLevel: state.pedagogicalProgress.currentLevel,
    
    pedagogicalProgress: state.pedagogicalProgress.levelProgress,
    
    culturalCompetencyLevel: state.pedagogicalProgress.culturalCompetencyLevel,
    
    recentPerformance: state.pedagogicalProgress.performanceHistory.slice(-10),
    
    culturalResponseCount: state.pedagogicalProgress.culturalResponses.length,
    
    averagePerformanceScore: state.pedagogicalProgress.performanceHistory.length > 0
      ? state.pedagogicalProgress.performanceHistory
          .filter(p => p.score !== undefined)
          .reduce((sum, p) => sum + p.score, 0) / 
          state.pedagogicalProgress.performanceHistory.filter(p => p.score !== undefined).length
      : 0,
    
    isReadyForNextLevel: state.pedagogicalProgress.levelProgress >= 85 && 
                        state.pedagogicalProgress.microStepsCompleted >= Math.floor(state.pedagogicalProgress.totalMicroSteps * 0.8),
    
    culturalCompetencyProgress: {
      awareness: state.pedagogicalProgress.culturalResponses.filter(r => r.recognizedCulturalElement).length,
      knowledge: state.pedagogicalProgress.culturalResponses.filter(r => r.appliedCulturalKnowledge).length,
      understanding: state.pedagogicalProgress.culturalResponses.filter(r => r.explainedCulturalReasoning).length,
      integration: state.pedagogicalProgress.culturalResponses.filter(r => r.adaptedBehaviorNaturally).length
    }
  };
  
  const value = {
    state,
    actions,
    computed
  };
  
  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  );
};

LearningProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook to use learning context
export const useLearning = () => {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
};

export default LearningContext;