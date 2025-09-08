/**
 * VisualExercise Component - Rosetta Stone-style Visual Association
 * Learn through images without translation - direct association
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ProgressBar from '../shared/ProgressBar';
import AudioButton from '../shared/AudioButton';
import FeedbackModal from '../shared/FeedbackModal';

const VisualExercise = ({ 
  content = [], 
  onComplete, 
  onResponse,
  autoPlayDelay = 1500 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  
  const currentItem = content[currentIndex];
  const isComplete = currentIndex >= content.length;
  
  useEffect(() => {
    // Auto-play Albanian phrase when new item loads
    if (currentItem?.phrase) {
      const timer = setTimeout(() => {
        playPhrase();
      }, autoPlayDelay);
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, autoPlayDelay]);
  
  const playPhrase = async () => {
    if (!currentItem?.phrase) return;
    
    try {
      const utterance = new SpeechSynthesisUtterance(currentItem.phrase);
      utterance.lang = 'sq-AL';
      utterance.rate = 0.7; // Slower for learning
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Audio playback failed:', error);
    }
  };
  
  const handleImageSelect = (imageIndex) => {
    if (selectedImage !== null) return; // Already selected
    
    setSelectedImage(imageIndex);
    const isCorrect = imageIndex === currentItem.correct;
    
    // Update streaks
    if (isCorrect) {
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
      setMistakes(prev => prev + 1);
    }
    
    // Prepare feedback
    const feedback = {
      correct: isCorrect,
      userAnswer: currentItem.images[imageIndex],
      correctAnswer: currentItem.images[currentItem.correct],
      explanation: isCorrect 
        ? "Excellent! You're building direct associations between Albanian and meaning."
        : "Not quite. Listen again and look at the correct image.",
      culturalNote: isCorrect ? currentItem.context : null,
      pronunciation: currentItem.pronunciation
    };
    
    setCurrentFeedback(feedback);
    setShowFeedback(true);
    
    // Record response
    if (onResponse) {
      onResponse({
        contentId: currentItem.id,
        exerciseType: 'visual',
        selectedImage: imageIndex,
        correct: isCorrect,
        streak: streak,
        timeSpent: Date.now()
      });
    }
    
    // Auto-advance after feedback
    setTimeout(() => {
      setShowFeedback(false);
      nextItem();
    }, isCorrect ? 2000 : 3000);
  };
  
  const nextItem = () => {
    if (currentIndex < content.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedImage(null);
    }
  };
  
  const repeatPhrase = () => {
    playPhrase();
  };
  
  const getCategoryIcon = (category) => {
    const icons = {
      family: '👨‍👩‍👧‍👦',
      greetings: '👋',
      hospitality: '☕',
      food_appreciation: '😋',
      games: '🃏',
      emotions: '😊',
      default: '🖼️'
    };
    return icons[category] || icons.default;
  };
  
  const getStreakMessage = () => {
    if (streak === 0) return null;
    if (streak < 3) return `${streak} in a row! 🔥`;
    if (streak < 5) return `${streak} streak! Keep it up! 🚀`;
    if (streak < 10) return `Amazing ${streak} streak! 🌟`;
    return `Incredible ${streak} streak! You're on fire! 🔥🔥🔥`;
  };
  
  if (isComplete) {
    const accuracy = Math.round(((content.length - mistakes) / content.length) * 100);
    
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8">
          <div className="text-4xl mb-4">🎨</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Visual Learning Complete!
          </h2>
          <div className="space-y-2 text-green-600 mb-6">
            <p>You've completed {content.length} visual associations</p>
            <p className="text-lg font-medium">Accuracy: {accuracy}%</p>
            <p className="text-sm">Best streak: {streak}</p>
            <p className="text-sm">You're building direct Albanian-meaning connections!</p>
          </div>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setSelectedImage(null);
              setStreak(0);
              setMistakes(0);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg"
          >
            Practice Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!currentItem) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <div className="text-gray-500">No visual exercises available</div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Progress & Stats */}
      <div className="space-y-3">
        <ProgressBar 
          current={currentIndex + 1}
          total={content.length}
          label="Visual Learning Progress"
          color="purple"
        />
        
        {/* Streak & Stats */}
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            {getStreakMessage() && (
              <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                {getStreakMessage()}
              </div>
            )}
            <div className="text-gray-600">
              Mistakes: {mistakes}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>{getCategoryIcon(currentItem.category)}</span>
            <span className="text-gray-600 capitalize">
              {currentItem.category?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
      
      {/* Main Exercise */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6 space-y-6">
        {/* Instructions */}
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            🔊 Listen and select the correct image
          </h2>
          <p className="text-sm text-gray-600">
            No translation - learn through direct association
          </p>
        </div>
        
        {/* Albanian Phrase */}
        <div className="text-center space-y-3">
          <div className="text-2xl font-bold text-blue-900">
            {currentItem.phrase}
          </div>
          <div className="text-sm text-gray-500 italic">
            /{currentItem.pronunciation}/
          </div>
          <AudioButton 
            text={currentItem.phrase}
            language="sq-AL"
            mode="play"
            size="medium"
            variant="primary"
          />
        </div>
        
        {/* Image Grid */}
        <div className="grid grid-cols-2 gap-4">
          {currentItem.images.map((image, index) => (
            <button
              key={index}
              onClick={() => handleImageSelect(index)}
              disabled={selectedImage !== null}
              className={`
                relative aspect-square rounded-lg border-4 transition-all transform
                flex items-center justify-center text-6xl
                ${selectedImage === index
                  ? index === currentItem.correct
                    ? 'border-green-500 bg-green-50 scale-105'
                    : 'border-red-500 bg-red-50 scale-95'
                  : selectedImage !== null
                  ? index === currentItem.correct
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-100'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:scale-105'
                }
                ${selectedImage !== null ? 'cursor-not-allowed' : 'cursor-pointer'}
                touch-manipulation
              `}
            >
              {image}
              
              {/* Feedback overlay */}
              {selectedImage === index && (
                <div className={`
                  absolute inset-0 rounded-lg flex items-center justify-center
                  ${index === currentItem.correct 
                    ? 'bg-green-500 bg-opacity-20' 
                    : 'bg-red-500 bg-opacity-20'
                  }
                `}>
                  <span className="text-4xl">
                    {index === currentItem.correct ? '✅' : '❌'}
                  </span>
                </div>
              )}
              
              {/* Show correct answer after wrong selection */}
              {selectedImage !== null && selectedImage !== index && index === currentItem.correct && (
                <div className="absolute inset-0 rounded-lg flex items-center justify-center bg-green-500 bg-opacity-20">
                  <span className="text-4xl">✅</span>
                </div>
              )}
            </button>
          ))}
        </div>
        
        {/* Helper Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={repeatPhrase}
            className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center gap-1"
          >
            🔄 Repeat Audio
          </button>
        </div>
      </div>
      
      {/* Learning Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <div className="text-blue-800 text-sm">
          💡 <strong>Rosetta Stone Method:</strong> Don't think in English. 
          Connect the Albanian sound directly with the image meaning.
        </div>
      </div>
      
      {/* Feedback Modal */}
      {showFeedback && currentFeedback && (
        <FeedbackModal 
          isOpen={showFeedback}
          onClose={() => setShowFeedback(false)}
          correct={currentFeedback.correct}
          userAnswer={currentFeedback.userAnswer}
          correctAnswer={currentFeedback.correctAnswer}
          explanation={currentFeedback.explanation}
          culturalNote={currentFeedback.culturalNote}
          pronunciation={currentFeedback.pronunciation}
          autoCloseDelay={currentFeedback.correct ? 2000 : 3000}
        />
      )}
    </div>
  );
};

VisualExercise.propTypes = {
  content: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired,
  onResponse: PropTypes.func.isRequired,
  autoPlayDelay: PropTypes.number
};

export default VisualExercise;