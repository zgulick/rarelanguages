// Clean App Implementation - Database-First Components
// File: components/CleanApp.jsx

import React, { useState, useEffect, createContext, useContext } from 'react';

// ==============================================
// 1. CLEAN APP CONTEXT - Database Only
// ==============================================

const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [currentPage, setCurrentPage] = useState('loading');
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize app state from database
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      
      // Check if user exists in localStorage
      const savedUserId = localStorage.getItem('userId');
      
      if (savedUserId) {
        // Load existing user state
        const response = await fetch('/api/user/course-state', {
          headers: { 'Authorization': `Bearer ${savedUserId}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setCurrentCourse(data.course);
          setCurrentPage('dashboard');
        } else {
          // User doesn't exist, go to language selection
          setCurrentPage('language-selection');
        }
      } else {
        // New user, go to language selection
        setCurrentPage('language-selection');
      }
    } catch (error) {
      setError('Failed to load app. Please refresh.');
      setCurrentPage('error');
    } finally {
      setLoading(false);
    }
  };

  const selectLanguage = async (languageCode) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languageCode })
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setCurrentCourse(data.course);
        localStorage.setItem('userId', data.user.id);
        setCurrentPage('dashboard');
      } else {
        setError('Failed to create user. Please try again.');
      }
    } catch (error) {
      setError('Connection error. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  const startLesson = async (lessonId) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/lessons/${lessonId}`, {
        headers: { 'Authorization': `Bearer ${user.id}` }
      });
      
      if (response.ok) {
        const lessonData = await response.json();
        setCurrentLesson(lessonData);
        setCurrentPage('lesson');
      } else {
        setError('Failed to load lesson. Please try again.');
      }
    } catch (error) {
      setError('Connection error. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  const completeExercise = async (exerciseResults) => {
    try {
      const response = await fetch('/api/exercises/complete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify(exerciseResults)
      });
      
      if (response.ok) {
        // Update local progress
        const updatedCourse = await loadCourseProgress();
        setCurrentCourse(updatedCourse);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save progress:', error);
      return false;
    }
  };

  const loadCourseProgress = async () => {
    const response = await fetch(`/api/courses/${currentCourse.id}/progress`, {
      headers: { 'Authorization': `Bearer ${user.id}` }
    });
    
    if (response.ok) {
      return await response.json();
    }
    return currentCourse;
  };

  const goBack = () => {
    if (currentPage === 'lesson') {
      setCurrentPage('dashboard');
      setCurrentLesson(null);
    } else if (currentPage === 'practice') {
      setCurrentPage('dashboard');
    }
  };

  return (
    <AppContext.Provider value={{
      // State
      user,
      currentCourse,
      currentPage,
      currentLesson,
      loading,
      error,
      
      // Actions
      selectLanguage,
      startLesson,
      completeExercise,
      goBack,
      setCurrentPage,
      setError
    }}>
      {children}
    </AppContext.Provider>
  );
};

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// ==============================================
// 2. CLEAN UI COMPONENTS
// ==============================================

const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading your course...</p>
    </div>
  </div>
);

const ErrorScreen = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
    <div className="text-center max-w-md mx-auto px-4">
      <div className="text-red-600 text-6xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
      <p className="text-gray-600 mb-6">{error}</p>
      <button 
        onClick={onRetry}
        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

const LanguageSelectionPage = () => {
  const { selectLanguage, loading } = useApp();
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);

  useEffect(() => {
    loadAvailableLanguages();
  }, []);

  const loadAvailableLanguages = async () => {
    try {
      const response = await fetch('/api/languages/available');
      if (response.ok) {
        const languages = await response.json();
        setAvailableLanguages(languages);
      }
    } catch (error) {
      console.error('Failed to load languages:', error);
    } finally {
      setLoadingLanguages(false);
    }
  };

  if (loadingLanguages) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to RareLanguages
          </h1>
          <p className="text-xl text-gray-600">
            Choose your language to start learning
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {availableLanguages.map(language => (
            <div key={language.code} 
                 className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                 onClick={() => !loading && selectLanguage(language.code)}>
              <div className="text-center">
                <div className="text-4xl mb-4">{language.flag || '🌍'}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {language.name}
                </h3>
                <p className="text-gray-600 mb-4">{language.native_name}</p>
                <div className="text-sm text-indigo-600 font-medium">
                  {language.lesson_count} lessons available
                </div>
              </div>
              
              {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CourseDashboard = () => {
  const { user, currentCourse, startLesson, setCurrentPage } = useApp();
  const [skillTree, setSkillTree] = useState([]);
  const [nextLesson, setNextLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseData();
  }, [currentCourse]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      
      // Load skill tree with progress
      const skillResponse = await fetch(`/api/courses/${currentCourse.id}/skills`, {
        headers: { 'Authorization': `Bearer ${user.id}` }
      });
      
      if (skillResponse.ok) {
        const skills = await skillResponse.json();
        setSkillTree(skills);
      }

      // Load next lesson from spaced repetition
      const nextResponse = await fetch('/api/lessons/next', {
        headers: { 'Authorization': `Bearer ${user.id}` }
      });
      
      if (nextResponse.ok) {
        const next = await nextResponse.json();
        setNextLesson(next);
      }
      
    } catch (error) {
      console.error('Failed to load course data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentCourse.name}
              </h1>
              <p className="text-gray-600">
                {currentCourse.completed_skills} of {currentCourse.total_skills} skills completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">
                {Math.round(currentCourse.completion_percentage)}%
              </div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentCourse.completion_percentage}%` }}
            ></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Next Lesson Card */}
        {nextLesson && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white p-6">
              <h2 className="text-xl font-bold mb-2">Continue Learning</h2>
              <p className="text-indigo-100 mb-4">
                {nextLesson.skill_name} • Lesson {nextLesson.position}
              </p>
              <h3 className="text-2xl font-bold mb-4">{nextLesson.name}</h3>
              <button 
                onClick={() => startLesson(nextLesson.id)}
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                Start Lesson →
              </button>
            </div>
          </div>
        )}

        {/* Skill Tree */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Course Progress</h2>
          
          {skillTree.map((skill, index) => (
            <div key={skill.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      skill.status === 'completed' ? 'bg-green-500' :
                      skill.status === 'in_progress' ? 'bg-indigo-500' :
                      skill.available ? 'bg-gray-400' : 'bg-gray-300'
                    }`}>
                      {skill.status === 'completed' ? '✓' : index + 1}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{skill.name}</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{skill.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{skill.completed_lessons} / {skill.total_lessons} lessons</span>
                    <span>•</span>
                    <span>CEFR {skill.cefr_level}</span>
                    <span>•</span>
                    <span>{skill.estimated_hours} hours</span>
                  </div>
                </div>
                
                <div className="text-right">
                  {skill.available ? (
                    <button 
                      onClick={() => startLesson(skill.next_lesson_id)}
                      disabled={!skill.next_lesson_id}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        skill.next_lesson_id 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {skill.status === 'completed' ? 'Review' : 'Continue'}
                    </button>
                  ) : (
                    <div className="text-gray-400">
                      🔒 Locked
                    </div>
                  )}
                </div>
              </div>
              
              {/* Progress Bar for Skill */}
              <div className="mt-4 bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-indigo-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${skill.progress_percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Practice Hub Button */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => setCurrentPage('practice')}
            className="bg-gray-800 text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-900 transition-colors"
          >
            Practice Hub →
          </button>
        </div>
      </div>
    </div>
  );
};

const LessonPage = () => {
  const { user, currentLesson, completeExercise, goBack } = useApp();
  const [learningMode, setLearningMode] = useState(null); // 'comprehensive' or 'exercises'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Let user choose learning mode when lesson loads
    setLoading(false);
  }, [currentLesson]);

  if (!currentLesson) {
    return <LoadingScreen />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  // Mode selection screen
  if (!learningMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={goBack}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                ← Back
              </button>
              <div className="text-center">
                <h1 className="text-lg font-bold text-gray-900">{currentLesson.name}</h1>
                <p className="text-sm text-gray-500">Choose your learning style</p>
              </div>
              <div className="w-10"></div>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="space-y-6">
            {/* Comprehensive Cards Option */}
            <div 
              onClick={() => setLearningMode('comprehensive')}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-200"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🎓</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Deep Learning Cards
                </h2>
                <p className="text-gray-600 mb-4">
                  Rich, comprehensive cards with pronunciation, grammar, cultural context, and variations. 
                  Perfect for really understanding each word and phrase.
                </p>
                <div className="text-sm text-indigo-600 font-medium">
                  ✓ Pronunciation guides ✓ Gender & variations ✓ Cultural context ✓ Verb conjugations
                </div>
              </div>
            </div>

            {/* Quick Exercises Option */}
            <div 
              onClick={() => setLearningMode('exercises')}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-gray-200"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Quick Practice
                </h2>
                <p className="text-gray-600 mb-4">
                  Fast-paced exercises for review and reinforcement. 
                  Great for practicing what you've already learned.
                </p>
                <div className="text-sm text-gray-600 font-medium">
                  ✓ Multiple choice ✓ Translation practice ✓ Quick feedback
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the selected learning mode
  if (learningMode === 'comprehensive') {
    return (
      <ComprehensiveLearningCards 
        lesson={currentLesson}
        onComplete={completeExercise}
        onExit={goBack}
      />
    );
  }

  // Quick exercises mode (original implementation)
  return <QuickExercisesMode lesson={currentLesson} onComplete={completeExercise} onExit={goBack} />;
};

// Original exercise mode as separate component
const QuickExercisesMode = ({ lesson, onComplete, onExit }) => {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [exerciseResults, setExerciseResults] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');

  const exercises = lesson.content || [];
  const exercise = exercises[currentExercise];
  const isLastExercise = currentExercise === exercises.length - 1;

  const handleAnswer = async (answer, correct) => {
    setSelectedAnswer(answer);
    setShowResult(true);

    const result = {
      exercise_id: exercise.id,
      user_answer: answer,
      correct_answer: exercise.target_phrase,
      is_correct: correct,
      response_time: Date.now(),
      difficulty_rating: exercise.difficulty_score
    };

    setExerciseResults(prev => [...prev, result]);

    setTimeout(() => {
      if (isLastExercise) {
        completeLessonFlow();
      } else {
        nextExercise();
      }
    }, 2000);
  };

  const nextExercise = () => {
    setCurrentExercise(prev => prev + 1);
    setSelectedAnswer('');
    setShowResult(false);
  };

  const completeLessonFlow = async () => {
    const lessonResults = {
      lesson_id: lesson.id,
      exercises: exerciseResults,
      completion_time: Date.now(),
      accuracy: exerciseResults.filter(r => r.is_correct).length / exerciseResults.length
    };

    await onComplete(lessonResults);
    onExit();
  };

  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'sq';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={onExit}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              ← Back
            </button>
            <div className="text-center">
              <h1 className="text-lg font-bold text-gray-900">{lesson.name}</h1>
              <p className="text-sm text-gray-500">
                Exercise {currentExercise + 1} of {exercises.length}
              </p>
            </div>
            <div className="w-10"></div>
          </div>
          
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentExercise + 1) / exercises.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Exercise Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {exercise && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium mb-6">
              Translation Practice
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Translate this phrase:
              </h2>
              <div className="text-xl text-gray-700 mb-4">
                "{exercise.english_phrase}"
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {[
                exercise.target_phrase,
                exercise.target_phrase.replace(/\w+/, 'incorrect1'),
                exercise.target_phrase.replace(/\s\w+/, ' incorrect2')
              ].sort(() => Math.random() - 0.5).map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option, option === exercise.target_phrase)}
                  disabled={showResult}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedAnswer === option
                      ? showResult
                        ? option === exercise.target_phrase
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : 'border-red-500 bg-red-50 text-red-800'
                        : 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{option}</div>
                  {option === exercise.target_phrase && (
                    <div className="text-sm text-gray-500 mt-1">
                      {exercise.pronunciation_guide}
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="text-center mb-6">
              <button 
                onClick={() => playAudio(exercise.target_phrase)}
                className="bg-blue-100 text-blue-700 px-6 py-3 rounded-lg hover:bg-blue-200 transition-colors"
              >
                🔊 Listen
              </button>
            </div>

            {exercise.cultural_context && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600">💡</span>
                  <div>
                    <h4 className="font-medium text-amber-800 mb-1">Cultural Note</h4>
                    <p className="text-amber-700 text-sm">{exercise.cultural_context}</p>
                  </div>
                </div>
              </div>
            )}

            {showResult && (
              <div className={`mt-6 p-4 rounded-lg border-2 ${
                selectedAnswer === exercise.target_phrase
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
              }`}>
                <div className="text-center">
                  <div className={`text-2xl mb-2 ${
                    selectedAnswer === exercise.target_phrase ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedAnswer === exercise.target_phrase ? '✅ Correct!' : '❌ Incorrect'}
                  </div>
                  {selectedAnswer !== exercise.target_phrase && (
                    <div className="text-gray-700">
                      Correct answer: <strong>{exercise.target_phrase}</strong>
                    </div>
                  )}
                  <div className="text-sm text-gray-500 mt-2">
                    {isLastExercise ? 'Completing lesson...' : 'Next exercise loading...'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Import the comprehensive cards component
import ComprehensiveLearningCards from './ComprehensiveLearningCards';

const PracticeHub = () => {
  const { user, currentCourse, goBack } = useApp();
  const [reviewQueue, setReviewQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviewQueue();
  }, []);

  const loadReviewQueue = async () => {
    try {
      const response = await fetch('/api/practice/due-items', {
        headers: { 'Authorization': `Bearer ${user.id}` }
      });
      
      if (response.ok) {
        const items = await response.json();
        setReviewQueue(items);
      }
    } catch (error) {
      console.error('Failed to load review queue:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={goBack}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              ← Back to Course
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Practice Hub</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Review Summary */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl text-white p-6 mb-8">
          <h2 className="text-2xl font-bold mb-2">Ready for Review</h2>
          <p className="text-orange-100 mb-4">
            {reviewQueue.length} items need your attention
          </p>
          {reviewQueue.length > 0 && (
            <button className="bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
              Start Review Session →
            </button>
          )}
        </div>

        {/* Review Categories */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900">Review by Topic</h3>
          
          {reviewQueue.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">No items due for review right now.</p>
            </div>
          ) : (
            reviewQueue.map((topic, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{topic.skill_name}</h4>
                    <p className="text-gray-600 mb-2">
                      {topic.due_count} items • Last reviewed {topic.last_reviewed}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        topic.urgency === 'overdue' ? 'bg-red-100 text-red-800' :
                        topic.urgency === 'due' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {topic.urgency === 'overdue' ? '🔥 Overdue' :
                         topic.urgency === 'due' ? '⏰ Due Now' :
                         '📚 Review Available'}
                      </span>
                      <span className="text-gray-500">
                        Mastery: {Math.round(topic.mastery_percentage)}%
                      </span>
                    </div>
                  </div>
                  
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    Review ({topic.due_count})
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ==============================================
// 3. MAIN APP ROUTER
// ==============================================

const AppRouter = () => {
  const { currentPage, loading, error, setError } = useApp();

  if (loading) return <LoadingScreen />;
  
  if (error) return <ErrorScreen error={error} onRetry={() => setError(null)} />;

  switch (currentPage) {
    case 'language-selection':
      return <LanguageSelectionPage />;
    case 'dashboard':
      return <CourseDashboard />;
    case 'lesson':
      return <LessonPage />;
    case 'practice':
      return <PracticeHub />;
    default:
      return <LoadingScreen />;
  }
};

// ==============================================
// 4. ROOT APP COMPONENT
// ==============================================

const CleanApp = () => {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
};

export default CleanApp;