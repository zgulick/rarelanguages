/**
 * AudioExercise Component - Pimsleur-style Audio Learning
 * Listen, repeat, and graduated interval practice
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ProgressBar from '../shared/ProgressBar';
import AudioButton from '../shared/AudioButton';
import FeedbackModal from '../shared/FeedbackModal';
import CulturalNote from '../shared/CulturalNote';
import { audioUtils, pimsleurIntervals } from '../../lib/audioUtils';

const AudioExercise = ({ 
  content = [], 
  onComplete, 
  onResponse,
  autoPlayDelay = 2000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState('listen'); // 'listen', 'respond_english', 'respond_albanian', 'feedback'
  const [userResponse, setUserResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [intervalSchedule, setIntervalSchedule] = useState({});
  const [completedItems, setCompletedItems] = useState(new Set());
  
  const currentItem = content[currentIndex];
  const isComplete = completedItems.size >= content.length;
  
  useEffect(() => {
    // Auto-play Albanian when starting new item
    if (currentItem && phase === 'listen') {
      const timer = setTimeout(() => {
        playAlbanian();
      }, autoPlayDelay);
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, phase, autoPlayDelay]);
  
  useEffect(() => {
    // Clean up intervals on component unmount
    return () => {
      pimsleurIntervals.clearAll();
    };
  }, []);
  
  const playAlbanian = async () => {
    if (!currentItem?.target_phrase) return;
    
    try {
      await audioUtils.speak(currentItem.target_phrase, { 
        language: 'sq-AL',
        rate: 0.7 // Slower for learning
      });
    } catch (error) {
      console.error('Albanian audio playback failed:', error);
    }
  };
  
  const startListening = async (expectedLanguage = 'en-US') => {
    if (!audioUtils.isSupported.recognition) {
      alert('Speech recognition is not supported in your browser');
      return;
    }
    
    try {
      setIsListening(true);
      
      const results = await audioUtils.startListening({ 
        language: expectedLanguage,
        continuous: false,
        interimResults: false
      });
      
      if (results && results.length > 0) {
        const transcript = results[0].transcript;
        const confidence = results[0].confidence;
        
        setUserResponse(transcript);
        handleUserResponse(transcript, confidence, expectedLanguage);
      }
      
    } catch (error) {
      console.error('Speech recognition failed:', error);
      alert('Speech recognition failed. Please try again.');
    } finally {
      setIsListening(false);
    }
  };
  
  const handleUserResponse = (transcript, confidence, language) => {
    const isEnglishPhase = phase === 'respond_english';
    const expectedAnswer = isEnglishPhase ? currentItem.english_phrase : currentItem.target_phrase;
    
    // Calculate similarity
    const similarity = audioUtils.comparePhrases(transcript, expectedAnswer);
    const isCorrect = similarity > 0.7; // 70% similarity threshold
    
    // Prepare feedback
    const feedback = {
      correct: isCorrect,
      userAnswer: transcript,
      correctAnswer: expectedAnswer,
      confidence: confidence,
      similarity: similarity,
      explanation: isCorrect 
        ? 'Great job! Your pronunciation is good.' 
        : `Try again. Listen carefully to the pronunciation.`,
      culturalNote: currentItem.cultural_context,
      pronunciation: isEnglishPhase ? null : currentItem.pronunciation_guide
    };
    
    setCurrentFeedback(feedback);
    setShowFeedback(true);
    
    // Record response for spaced repetition
    if (onResponse) {
      onResponse({
        contentId: currentItem.id,
        exerciseType: 'audio',
        phase: phase,
        correct: isCorrect,
        confidence: confidence,
        similarity: similarity,
        userResponse: transcript,
        timeSpent: Date.now()
      });
    }
    
    // Schedule next phase or advancement
    setTimeout(() => {
      setShowFeedback(false);
      advancePhase(isCorrect);
    }, 3000);
  };
  
  const advancePhase = (wasCorrect) => {
    switch (phase) {
      case 'listen':
        setPhase('respond_english');
        break;
        
      case 'respond_english':
        if (wasCorrect) {
          setPhase('respond_albanian');
        } else {
          // If English response was wrong, replay and try again
          setPhase('listen');
          setTimeout(playAlbanian, 1000);
        }
        break;
        
      case 'respond_albanian':
        if (wasCorrect) {
          completeItem();
        } else {
          // If Albanian response was wrong, go back to listening
          setPhase('listen');
          setTimeout(playAlbanian, 1000);
        }
        break;
    }
  };
  
  const completeItem = () => {
    // Mark item as completed
    setCompletedItems(prev => new Set([...prev, currentItem.id]));
    
    // Schedule for spaced repetition
    scheduleSpacedRepetition();
    
    // Move to next item or complete exercise
    if (currentIndex < content.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setPhase('listen');
      setUserResponse('');
    } else {
      // All items completed initially, check for scheduled reviews
      checkForScheduledReviews();
    }
  };
  
  const scheduleSpacedRepetition = () => {
    const intervals = ['immediate', 'short', 'medium', 'long'];
    const currentInterval = intervalSchedule[currentItem.id] || 'immediate';
    
    // Schedule next review based on Pimsleur intervals
    pimsleurIntervals.scheduleReview(currentItem.id, currentInterval, (itemId) => {
      // Item due for review - add back to queue
      const itemToReview = content.find(item => item.id === itemId);
      if (itemToReview) {
        reviewItem(itemToReview);
      }
    });
    
    // Update interval schedule
    const nextInterval = intervals[Math.min(intervals.indexOf(currentInterval) + 1, intervals.length - 1)];
    setIntervalSchedule(prev => ({
      ...prev,
      [currentItem.id]: nextInterval
    }));
  };
  
  const reviewItem = (item) => {
    // Add item back to review queue
    const itemIndex = content.findIndex(c => c.id === item.id);
    if (itemIndex !== -1) {
      setCurrentIndex(itemIndex);
      setPhase('listen');
      setUserResponse('');
      // Remove from completed to allow re-review
      setCompletedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };
  
  const checkForScheduledReviews = () => {
    if (pimsleurIntervals.scheduledItems.size === 0) {
      // No more scheduled reviews - exercise is complete
      if (onComplete) {
        onComplete({
          totalItems: content.length,
          completionTime: Date.now(),
          exerciseType: 'audio_pimsleur'
        });
      }
    }
  };
  
  const skipItem = () => {
    if (currentIndex < content.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setPhase('listen');
      setUserResponse('');
    }
  };
  
  const repeatAudio = () => {
    playAlbanian();
  };
  
  const getPhaseInstructions = () => {
    switch (phase) {
      case 'listen':
        return {
          title: '🔊 Listen Carefully',
          instruction: 'Listen to the Albanian phrase and try to understand its meaning',
          action: 'Tap "Continue" when ready to respond'
        };
      case 'respond_english':
        return {
          title: '🗣️ Say in English',
          instruction: `What does "${currentItem?.target_phrase}" mean in English?`,
          action: 'Hold the microphone button and speak'
        };
      case 'respond_albanian':
        return {
          title: '🇦🇱 Now Say in Albanian',
          instruction: `How do you say "${currentItem?.english_phrase}" in Albanian?`,
          action: 'Hold the microphone button and speak'
        };
      default:
        return {
          title: '',
          instruction: '',
          action: ''
        };
    }
  };
  
  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Audio Exercise Complete!
          </h2>
          <p className="text-green-600 mb-4">
            You've completed all {content.length} audio exercises with spaced repetition
          </p>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setPhase('listen');
              setCompletedItems(new Set());
              setIntervalSchedule({});
              pimsleurIntervals.clearAll();
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
        <div className="text-gray-500">No audio exercises available</div>
      </div>
    );
  }
  
  const instructions = getPhaseInstructions();
  
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Progress */}
      <ProgressBar 
        current={completedItems.size}
        total={content.length}
        label="Audio Exercise Progress"
        color="purple"
      />
      
      {/* Main Exercise Area */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6 space-y-6">
        {/* Phase Header */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-gray-900">
            {instructions.title}
          </h2>
          <p className="text-gray-600">
            {instructions.instruction}
          </p>
        </div>
        
        {/* Audio Controls */}
        {phase === 'listen' && (
          <div className="text-center space-y-4">
            <div className="text-lg font-medium text-blue-900">
              {currentItem.target_phrase}
            </div>
            <div className="text-sm text-gray-500 italic">
              (Listen and try to understand)
            </div>
            <div className="flex justify-center gap-4">
              <AudioButton 
                text={currentItem.target_phrase}
                language="sq-AL"
                mode="play"
                size="large"
                variant="primary"
              />
              <button
                onClick={() => setPhase('respond_english')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg"
              >
                Continue
              </button>
            </div>
          </div>
        )}
        
        {/* Response Phase */}
        {(phase === 'respond_english' || phase === 'respond_albanian') && (
          <div className="text-center space-y-4">
            <div className="text-lg font-medium text-gray-700">
              {instructions.action}
            </div>
            
            {/* Microphone Button */}
            <div className="flex justify-center">
              <AudioButton 
                mode="record"
                language={phase === 'respond_english' ? 'en-US' : 'sq-AL'}
                onRecordingComplete={(result) => {
                  setUserResponse(result.transcript);
                  handleUserResponse(result.transcript, result.confidence, 
                    phase === 'respond_english' ? 'en-US' : 'sq-AL');
                }}
                size="large"
                variant="success"
                disabled={isListening}
              />
            </div>
            
            {/* Helper Actions */}
            <div className="flex justify-center gap-2">
              <button
                onClick={repeatAudio}
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                🔄 Replay Audio
              </button>
              <button
                onClick={skipItem}
                className="text-gray-600 hover:text-gray-800 underline text-sm"
              >
                ⏭️ Skip
              </button>
            </div>
            
            {/* User's Last Response */}
            {userResponse && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">You said:</div>
                <div className="text-gray-900">{userResponse}</div>
              </div>
            )}
          </div>
        )}
        
        {/* Cultural Context */}
        {currentItem.cultural_context && (
          <CulturalNote 
            content={currentItem.cultural_context}
            variant="tip"
            collapsible={true}
            defaultExpanded={false}
          />
        )}
      </div>
      
      {/* Pimsleur Schedule Status */}
      {pimsleurIntervals.scheduledItems.size > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-sm text-blue-800">
            📅 {pimsleurIntervals.scheduledItems.size} items scheduled for spaced review
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="text-center text-sm text-gray-500 space-y-1">
        <div>🎯 Pimsleur Method: Listen → Understand → Speak</div>
        <div>Items will return for review at increasing intervals</div>
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
          autoCloseDelay={3000}
        />
      )}
    </div>
  );
};

AudioExercise.propTypes = {
  content: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired,
  onResponse: PropTypes.func.isRequired,
  autoPlayDelay: PropTypes.number
};

export default AudioExercise;