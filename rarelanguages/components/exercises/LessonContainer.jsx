/**
 * LessonContainer Component - Exercise Flow Orchestrator
 * Manages progression through different exercise types and tracks progress
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLearning } from '../contexts/LearningContext';
import FlashcardExercise from './FlashcardExercise';
import AudioExercise from './AudioExercise';
import ConversationExercise from './ConversationExercise';
import VisualExercise from './VisualExercise';
import ProgressBar from '../shared/ProgressBar';

const LessonContainer = ({ lesson, onLessonComplete }) => {
  const { state, actions, computed } = useLearning();
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useEffect(() => {
    // Initialize lesson when component mounts
    if (lesson && !state.currentLesson) {
      actions.setCurrentLesson(lesson);
      actions.startSession();
    }
  }, [lesson, state.currentLesson, actions]);
  
  useEffect(() => {
    // Update lesson if prop changes
    if (lesson && lesson.id !== state.currentLesson?.id) {
      actions.setCurrentLesson(lesson);
      actions.startSession();
    }
  }, [lesson, state.currentLesson, actions]);
  
  const currentExerciseConfig = computed.currentExerciseConfig;
  
  if (!lesson || !state.currentLesson) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading lesson...</p>
      </div>
    );
  }
  
  const handleExerciseComplete = (exerciseResults) => {
    console.log('Exercise completed:', exerciseResults);
    
    // Update overall progress
    actions.updateProgress({
      exercisesCompleted: state.sessionProgress.exercisesCompleted + 1
    });
    
    // Check if this was the last exercise
    if (computed.isLastExercise) {
      // Lesson complete
      handleLessonComplete();
    } else {
      // Move to next exercise
      transitionToNextExercise();
    }
  };
  
  const handleExerciseResponse = (response) => {
    // Record individual response for spaced repetition
    actions.recordResponse(response);
  };
  
  const transitionToNextExercise = () => {
    setIsTransitioning(true);
    
    setTimeout(() => {
      const nextIndex = state.currentExerciseIndex + 1;
      const nextExercise = lesson.exercise_flow[nextIndex];
      
      if (nextExercise) {
        actions.setCurrentExercise(nextIndex, nextExercise.component);
      }
      
      setIsTransitioning(false);
    }, 1000);
  };
  
  const handleLessonComplete = () => {
    actions.endSession();
    
    const lessonResults = {
      lessonId: lesson.id,
      totalTimeSpent: computed.sessionTimeMinutes,
      accuracy: computed.sessionAccuracy,
      exercisesCompleted: state.sessionProgress.exercisesCompleted + 1,
      totalExercises: lesson.exercise_flow.length,
      responses: state.responses,
      streak: state.sessionProgress.longestStreak
    };
    
    if (onLessonComplete) {
      onLessonComplete(lessonResults);
    }
  };
  
  const getExerciseContent = () => {
    if (!currentExerciseConfig) return [];
    
    const contentCount = currentExerciseConfig.content_count || lesson.content.length;
    return lesson.content.slice(0, contentCount);
  };
  
  const getConversationScenarios = () => {
    // For conversation exercises, we need scenarios instead of regular content
    // This would normally come from the lesson data or be generated
    return [
      {
        id: "scenario_1",
        category: "family_introductions",
        title: "Meeting Your Partner's Family",
        context: "You're at a family gathering and being introduced to relatives you haven't met before.",
        difficulty: 2,
        cultural_notes: "Always show respect for elders. Use formal greetings initially until invited to be more casual.",
        exchanges: [
          {
            speaker: "Aunt",
            text: "Kush është ky/kjo?",
            translation: "Who is this?",
            responses: [
              { text: "Unë jam partneri i saj/tij", translation: "I am her/his partner", correct: true },
              { text: "Unë jam miku i mirë", translation: "I am a good friend", correct: false },
              { text: "Nuk e di", translation: "I don't know", correct: false }
            ]
          }
        ]
      }
    ];
  };
  
  const getVisualContent = () => {
    // Convert regular content to visual format
    return lesson.content.slice(0, 6).map((item, index) => ({
      id: `visual_${item.id}`,
      phrase: item.target_phrase,
      pronunciation: item.pronunciation_guide,
      images: ["👨‍🦳", "👩‍🦳", "👦", "👧"], // Placeholder images
      correct: 0,
      category: "family",
      context: item.cultural_context
    }));
  };
  
  const renderCurrentExercise = () => {
    if (isTransitioning) {
      return (
        <div className="max-w-2xl mx-auto p-4 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <div className="text-4xl mb-4">🔄</div>
            <h2 className="text-xl font-bold text-blue-900 mb-2">
              Switching Exercise Types
            </h2>
            <p className="text-blue-700">
              Great job! Moving to the next learning method...
            </p>
          </div>
        </div>
      );
    }
    
    if (!currentExerciseConfig) {
      return (
        <div className="max-w-2xl mx-auto p-4 text-center">
          <div className="text-red-600">Exercise configuration error</div>
        </div>
      );
    }
    
    const exerciseProps = {
      onComplete: handleExerciseComplete,
      onResponse: handleExerciseResponse,
      showPronunciation: state.userPreferences.pronunciationShown,
      showCultural: state.userPreferences.culturalContextShown
    };
    
    switch (currentExerciseConfig.component) {
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
          <div className="max-w-2xl mx-auto p-4 text-center">
            <div className="text-red-600">
              Unknown exercise type: {currentExerciseConfig.component}
            </div>
          </div>
        );
    }
  };
  
  const getExerciseIcon = (exerciseType) => {
    const icons = {
      FlashcardExercise: '🃏',
      AudioExercise: '🎧',
      ConversationExercise: '💬',
      VisualExercise: '🖼️'
    };
    return icons[exerciseType] || '📚';
  };
  
  const getExerciseName = (exerciseType) => {
    const names = {
      FlashcardExercise: 'Flashcards',
      AudioExercise: 'Audio Practice',
      ConversationExercise: 'Conversations',
      VisualExercise: 'Visual Learning'
    };
    return names[exerciseType] || exerciseType;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Lesson Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Lesson Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="text-2xl">📖</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {lesson.title}
              </h1>
              <p className="text-sm text-gray-600">
                {lesson.description}
              </p>
            </div>
          </div>
          
          {/* Overall Progress */}
          <div className="space-y-3">
            <ProgressBar
              current={state.currentExerciseIndex + 1}
              total={lesson.exercise_flow.length}
              label="Lesson Progress"
              color="blue"
            />
            
            {/* Current Exercise Info */}
            {currentExerciseConfig && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-lg">
                    {getExerciseIcon(currentExerciseConfig.component)}
                  </span>
                  <span className="font-medium text-gray-700">
                    {getExerciseName(currentExerciseConfig.component)}
                  </span>
                  <span className="text-gray-500">
                    (~{currentExerciseConfig.duration} min)
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Accuracy: {computed.sessionAccuracy.toFixed(0)}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Exercise Content */}
      <div className="py-6">
        {renderCurrentExercise()}
      </div>
      
      {/* Session Stats Footer */}
      {computed.isSessionActive && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-2xl mx-auto flex justify-between items-center text-sm text-gray-600">
            <div>
              Time: {computed.sessionTimeMinutes} min
            </div>
            <div>
              Streak: {state.sessionProgress.streak}
            </div>
            <div>
              {state.sessionProgress.correctResponses}/{state.sessionProgress.totalResponses} correct
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

LessonContainer.propTypes = {
  lesson: PropTypes.object.isRequired,
  onLessonComplete: PropTypes.func
};

export default LessonContainer;