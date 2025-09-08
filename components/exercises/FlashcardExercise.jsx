/**
 * FlashcardExercise Component - Anki-style Spaced Repetition
 * Mobile-first flashcard learning with cultural context
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ProgressBar from '../shared/ProgressBar';
import AudioButton from '../shared/AudioButton';
import DifficultyButtons from '../shared/DifficultyButtons';
import CulturalNote from '../shared/CulturalNote';
import { gestureUtils, CardAnimationUtils } from '../../lib/gestureUtils';

const FlashcardExercise = ({ 
  content = [], 
  onComplete, 
  onResponse, 
  showPronunciation = true,
  showCultural = true,
  autoAdvance = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDifficultyButtons, setShowDifficultyButtons] = useState(false);
  const cardRef = useRef(null);
  const cleanupRef = useRef(null);
  
  const currentCard = content[currentIndex];
  const isComplete = currentIndex >= content.length;
  
  useEffect(() => {
    // Set up gesture detection
    if (cardRef.current) {
      cleanupRef.current = gestureUtils.setupSwipeDetection(cardRef.current, {
        onSwipeLeft: handleSwipeLeft,
        onSwipeRight: handleSwipeRight,
        onSwipeUp: handleSwipeUp,
        onSwipeDown: handleSwipeDown,
        onTouchStart: (e) => {
          // Add visual feedback for touch
          e.target.style.transform = 'scale(0.98)';
        },
        onTouchEnd: (e) => {
          // Remove visual feedback
          e.target.style.transform = '';
        }
      });
    }
    
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [currentIndex]);
  
  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyPress = (event) => {
      if (isComplete) return;
      
      switch (event.key) {
        case ' ': // Spacebar to flip
          event.preventDefault();
          handleCardFlip();
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          if (showDifficultyButtons) {
            event.preventDefault();
            handleDifficultySelect(parseInt(event.key));
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (showDifficultyButtons) {
            handleDifficultySelect(3); // Default "Good"
          } else {
            handleCardFlip();
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (currentIndex > 0) {
            goToPreviousCard();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isComplete, showDifficultyButtons, currentIndex]);
  
  // Handle completion
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete({
        totalCards: content.length,
        completionTime: Date.now(),
        exerciseType: 'flashcard'
      });
    }
  }, [isComplete, content.length, onComplete]);
  
  const handleCardFlip = async () => {
    if (!cardRef.current) return;
    
    try {
      await CardAnimationUtils.flipCard(cardRef.current);
      setIsFlipped(!isFlipped);
      
      if (!isFlipped) {
        // Just flipped to show answer - show difficulty buttons
        setShowDifficultyButtons(true);
      }
    } catch (error) {
      console.error('Card flip animation failed:', error);
      setIsFlipped(!isFlipped);
      if (!isFlipped) {
        setShowDifficultyButtons(true);
      }
    }
  };
  
  const handleDifficultySelect = (difficulty) => {
    if (!currentCard || !onResponse) return;
    
    // Record response
    onResponse({
      contentId: currentCard.id,
      exerciseType: 'flashcard',
      difficulty: difficulty,
      timeSpent: Date.now(),
      correct: difficulty >= 2 // Difficulty 2+ means they knew it
    });
    
    // Move to next card
    nextCard();
  };
  
  const nextCard = () => {
    if (currentIndex < content.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetCardState();
    }
  };
  
  const goToPreviousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetCardState();
    }
  };
  
  const resetCardState = () => {
    setIsFlipped(false);
    setShowDifficultyButtons(false);
    if (cardRef.current) {
      CardAnimationUtils.resetCard(cardRef.current);
    }
  };
  
  // Gesture handlers
  const handleSwipeLeft = () => {
    if (showDifficultyButtons) {
      handleDifficultySelect(2); // "Hard"
    } else {
      handleCardFlip();
    }
  };
  
  const handleSwipeRight = () => {
    if (showDifficultyButtons) {
      handleDifficultySelect(3); // "Good"
    } else {
      handleCardFlip();
    }
  };
  
  const handleSwipeUp = () => {
    if (showDifficultyButtons) {
      handleDifficultySelect(4); // "Easy"
    }
  };
  
  const handleSwipeDown = () => {
    if (showDifficultyButtons) {
      handleDifficultySelect(1); // "Again"
    }
  };
  
  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Flashcard Session Complete!
          </h2>
          <p className="text-green-600 mb-4">
            You've completed all {content.length} flashcards
          </p>
          <button
            onClick={() => {
              setCurrentIndex(0);
              resetCardState();
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg"
          >
            Review Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!currentCard) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <div className="text-gray-500">No flashcards available</div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Progress */}
      <ProgressBar 
        current={currentIndex + 1}
        total={content.length}
        label="Flashcard Progress"
        color="blue"
      />
      
      {/* Main Card */}
      <div className="relative">
        <div
          ref={cardRef}
          className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-8 min-h-64 cursor-pointer transform transition-transform hover:scale-105 active:scale-95 touch-manipulation"
          onClick={handleCardFlip}
          style={{ perspective: '1000px' }}
        >
          {/* Card Front (English) */}
          {!isFlipped ? (
            <div className="text-center space-y-4">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                English
              </div>
              <div className="text-2xl md:text-3xl font-medium text-gray-900 leading-relaxed">
                {currentCard.english_phrase}
              </div>
              <div className="text-gray-400 text-sm mt-8">
                Tap to reveal Albanian translation
              </div>
            </div>
          ) : (
            /* Card Back (Albanian) */
            <div className="text-center space-y-4">
              <div className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                Gheg Albanian
              </div>
              <div className="text-2xl md:text-3xl font-bold text-blue-900 leading-relaxed">
                {currentCard.target_phrase}
              </div>
              
              {/* Pronunciation */}
              {showPronunciation && currentCard.pronunciation_guide && (
                <div className="text-lg text-gray-600 italic">
                  /{currentCard.pronunciation_guide}/
                </div>
              )}
              
              {/* Audio button */}
              <div className="flex justify-center mt-4">
                <AudioButton 
                  text={currentCard.target_phrase}
                  language="sq-AL"
                  mode="play"
                  size="medium"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Swipe indicators */}
        {isFlipped && showDifficultyButtons && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 left-2 text-xs text-gray-400 bg-white bg-opacity-75 rounded px-2 py-1">
              ⬅️ Hard
            </div>
            <div className="absolute top-2 right-2 text-xs text-gray-400 bg-white bg-opacity-75 rounded px-2 py-1">
              Good ➡️
            </div>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 bg-white bg-opacity-75 rounded px-2 py-1">
              ⬇️ Again
            </div>
          </div>
        )}
      </div>
      
      {/* Cultural Context */}
      {showCultural && currentCard.cultural_context && isFlipped && (
        <CulturalNote 
          content={currentCard.cultural_context}
          variant="default"
          collapsible={true}
          defaultExpanded={false}
        />
      )}
      
      {/* Difficulty Rating */}
      {showDifficultyButtons && (
        <div className="space-y-4">
          <DifficultyButtons 
            onSelect={handleDifficultySelect}
            variant="anki"
          />
        </div>
      )}
      
      {/* Navigation Hints */}
      <div className="text-center text-sm text-gray-500 space-y-1">
        <div>Press spacebar to flip • Keys 1-4 for difficulty</div>
        <div>Swipe: ⬅️ Hard • ➡️ Good • ⬆️ Easy • ⬇️ Again</div>
        {currentIndex > 0 && (
          <button
            onClick={goToPreviousCard}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ← Previous Card
          </button>
        )}
      </div>
    </div>
  );
};

FlashcardExercise.propTypes = {
  content: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired,
  onResponse: PropTypes.func.isRequired,
  showPronunciation: PropTypes.bool,
  showCultural: PropTypes.bool,
  autoAdvance: PropTypes.bool
};

export default FlashcardExercise;