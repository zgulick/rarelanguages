/**
 * PracticeHub Component - Organized Practice by Topic
 * Allows users to practice specific topics from completed lessons
 */

import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import FlashcardExercise from '../exercises/FlashcardExercise';
import AudioExercise from '../exercises/AudioExercise';

const PracticeHub = () => {
  const { 
    learnedTopics, 
    getPracticeContent, 
    getCompletedLessons,
    navigateTo,
    preferences 
  } = useApp();
  
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedExerciseType, setSelectedExerciseType] = useState(null);
  const [isActive, setIsActive] = useState(false);
  
  const availableTopics = Array.from(learnedTopics);
  const completedLessons = getCompletedLessons();
  
  const exerciseTypes = [
    {
      id: 'flashcards',
      name: 'Flashcards',
      icon: '🃏',
      description: 'Review vocabulary with spaced repetition',
      component: 'FlashcardExercise'
    },
    {
      id: 'audio',
      name: 'Audio Practice', 
      icon: '🎧',
      description: 'Practice pronunciation and listening',
      component: 'AudioExercise'
    }
  ];
  
  const getTopicIcon = (topic) => {
    const iconMap = {
      greetings: '👋',
      basics: '📚',
      family: '👨‍👩‍👧‍👦',
      introductions: '🤝',
      hospitality: '☕',
      food: '🥘'
    };
    return iconMap[topic] || '📖';
  };
  
  const getTopicStats = (topic) => {
    const content = getPracticeContent(topic);
    const lessonsWithTopic = completedLessons.filter(lesson => 
      lesson.topics.includes(topic)
    );
    
    return {
      phrases: content.length,
      lessons: lessonsWithTopic.length
    };
  };
  
  const handleStartPractice = (topic, exerciseType) => {
    setSelectedTopic(topic);
    setSelectedExerciseType(exerciseType);
    setIsActive(true);
  };
  
  const handlePracticeComplete = (results) => {
    console.log('Practice session completed:', results);
    setIsActive(false);
    setSelectedTopic(null);
    setSelectedExerciseType(null);
  };
  
  const handlePracticeResponse = (response) => {
    console.log('Practice response:', response);
  };
  
  const renderTopicSelection = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          🎯 Practice Hub
        </h1>
        <p className="text-gray-600">
          Reinforce what you've learned by topic
        </p>
      </div>
      
      {availableTopics.length === 0 ? (
        /* No Topics Available */
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">📚</div>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            No Topics Available Yet
          </h3>
          <p className="text-yellow-700 mb-4">
            Complete some lessons first to unlock practice topics!
          </p>
          <button
            onClick={() => navigateTo('dashboard')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg"
          >
            Continue Learning
          </button>
        </div>
      ) : (
        /* Topic List */
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">
            Choose a topic to practice:
          </h2>
          
          <div className="grid gap-3">
            {availableTopics.map((topic) => {
              const stats = getTopicStats(topic);
              
              return (
                <div
                  key={topic}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{getTopicIcon(topic)}</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 capitalize">
                        {topic.replace('_', ' ')}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {stats.phrases} phrases • {stats.lessons} lessons
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {exerciseTypes.map((exerciseType) => (
                      <button
                        key={exerciseType.id}
                        onClick={() => handleStartPractice(topic, exerciseType)}
                        className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors text-left"
                      >
                        <span className="text-lg">{exerciseType.icon}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {exerciseType.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {exerciseType.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Stats Summary */}
      {availableTopics.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Your Progress</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">
                {availableTopics.length}
              </div>
              <div className="text-sm text-blue-700">Topics Learned</div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-600">
                {completedLessons.length}
              </div>
              <div className="text-sm text-blue-700">Lessons Completed</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Tips */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">💡 Practice Tips</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Review topics regularly to strengthen memory</li>
          <li>• Focus on areas where you feel less confident</li>
          <li>• Audio practice helps with pronunciation</li>
          <li>• Flashcards use spaced repetition for optimal learning</li>
        </ul>
      </div>
    </div>
  );
  
  const renderActivePractice = () => {
    const content = getPracticeContent(selectedTopic);
    const exerciseType = exerciseTypes.find(e => e.id === selectedExerciseType.id);
    
    const exerciseProps = {
      content: content,
      onComplete: handlePracticeComplete,
      onResponse: handlePracticeResponse,
      showPronunciation: preferences.pronunciationShown,
      showCultural: preferences.culturalContextShown
    };
    
    return (
      <div className="space-y-4">
        {/* Practice Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getTopicIcon(selectedTopic)}</span>
              <div>
                <h2 className="font-bold text-gray-900 capitalize">
                  {selectedTopic.replace('_', ' ')} - {exerciseType.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {content.length} phrases to practice
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsActive(false)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
              aria-label="Exit practice"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Exercise Component */}
        <div>
          {exerciseType.component === 'FlashcardExercise' && (
            <FlashcardExercise {...exerciseProps} />
          )}
          
          {exerciseType.component === 'AudioExercise' && (
            <AudioExercise {...exerciseProps} />
          )}
        </div>
      </div>
    );
  };
  
  if (!availableTopics || availableTopics.length === 0) {
    return (
      <div className="pt-6">
        {renderTopicSelection()}
      </div>
    );
  }
  
  if (isActive && selectedTopic && selectedExerciseType) {
    return (
      <div className="pt-6">
        {renderActivePractice()}
      </div>
    );
  }
  
  return (
    <div className="pt-6">
      {renderTopicSelection()}
    </div>
  );
};

export default PracticeHub;