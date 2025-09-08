/**
 * ConversationExercise Component - Babbel-style Conversation Practice
 * Realistic family scenarios with multiple choice responses
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import ProgressBar from '../shared/ProgressBar';
import AudioButton from '../shared/AudioButton';
import FeedbackModal from '../shared/FeedbackModal';
import CulturalNote from '../shared/CulturalNote';

const ConversationExercise = ({ 
  scenarios = [], 
  onComplete, 
  onResponse 
}) => {
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [currentExchangeIndex, setCurrentExchangeIndex] = useState(0);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [scenarioProgress, setScenarioProgress] = useState({});
  
  const currentScenario = scenarios[currentScenarioIndex];
  const currentExchange = currentScenario?.exchanges?.[currentExchangeIndex];
  const isComplete = currentScenarioIndex >= scenarios.length;
  
  useEffect(() => {
    // Auto-play Albanian audio when new exchange starts
    if (currentExchange?.text) {
      const timer = setTimeout(() => {
        playAlbanian(currentExchange.text);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [currentScenarioIndex, currentExchangeIndex]);
  
  const playAlbanian = async (text) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'sq-AL';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Audio playback failed:', error);
    }
  };
  
  const handleResponseSelect = (responseIndex) => {
    if (!currentExchange) return;
    
    setSelectedResponse(responseIndex);
    const selectedAnswer = currentExchange.responses[responseIndex];
    const isCorrect = selectedAnswer.correct;
    
    // Prepare feedback
    const feedback = {
      correct: isCorrect,
      userAnswer: selectedAnswer.text,
      correctAnswer: currentExchange.responses.find(r => r.correct)?.text,
      explanation: isCorrect 
        ? "Perfect! That's exactly how a family member would respond."
        : `Not quite. ${currentExchange.responses.find(r => r.correct)?.translation}`,
      culturalNote: isCorrect ? null : currentScenario.cultural_notes,
      pronunciation: selectedAnswer.text
    };
    
    setCurrentFeedback(feedback);
    setShowFeedback(true);
    
    // Record response
    if (onResponse) {
      onResponse({
        scenarioId: currentScenario.id,
        exchangeIndex: currentExchangeIndex,
        selectedResponse: responseIndex,
        correct: isCorrect,
        exerciseType: 'conversation',
        timeSpent: Date.now()
      });
    }
    
    // Auto-advance after feedback
    setTimeout(() => {
      setShowFeedback(false);
      advanceExercise(isCorrect);
    }, 3000);
  };
  
  const advanceExercise = (wasCorrect) => {
    // Update progress
    const progressKey = `${currentScenario.id}_${currentExchangeIndex}`;
    setScenarioProgress(prev => ({
      ...prev,
      [progressKey]: { completed: true, correct: wasCorrect }
    }));
    
    // Move to next exchange or scenario
    if (currentExchangeIndex < currentScenario.exchanges.length - 1) {
      // Next exchange in same scenario
      setCurrentExchangeIndex(prev => prev + 1);
      setSelectedResponse(null);
    } else if (currentScenarioIndex < scenarios.length - 1) {
      // Next scenario
      setCurrentScenarioIndex(prev => prev + 1);
      setCurrentExchangeIndex(0);
      setSelectedResponse(null);
    } else {
      // All scenarios complete
      if (onComplete) {
        onComplete({
          totalScenarios: scenarios.length,
          completionTime: Date.now(),
          exerciseType: 'conversation',
          progress: scenarioProgress
        });
      }
    }
  };
  
  const getTotalExchanges = () => {
    return scenarios.reduce((total, scenario) => total + scenario.exchanges.length, 0);
  };
  
  const getCurrentExchangeNumber = () => {
    let count = 0;
    for (let i = 0; i < currentScenarioIndex; i++) {
      count += scenarios[i].exchanges.length;
    }
    return count + currentExchangeIndex + 1;
  };
  
  const getScenarioIcon = (category) => {
    const icons = {
      family_introductions: '👨‍👩‍👧‍👦',
      card_game_banter: '🃏',
      daily_checkins: '📱',
      coffee_culture: '☕',
      food_appreciation: '🍽️',
      default: '💬'
    };
    return icons[category] || icons.default;
  };
  
  if (isComplete) {
    const totalExchanges = getTotalExchanges();
    const correctResponses = Object.values(scenarioProgress).filter(p => p.correct).length;
    const accuracy = Math.round((correctResponses / totalExchanges) * 100);
    
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8">
          <div className="text-4xl mb-4">🎭</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Conversation Practice Complete!
          </h2>
          <div className="space-y-2 text-green-600 mb-6">
            <p>You've completed {scenarios.length} conversation scenarios</p>
            <p className="text-lg font-medium">Accuracy: {accuracy}%</p>
            <p className="text-sm">You're ready for real family conversations!</p>
          </div>
          <button
            onClick={() => {
              setCurrentScenarioIndex(0);
              setCurrentExchangeIndex(0);
              setSelectedResponse(null);
              setScenarioProgress({});
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg"
          >
            Practice Again
          </button>
        </div>
      </div>
    );
  }
  
  if (!currentScenario || !currentExchange) {
    return (
      <div className="max-w-2xl mx-auto p-4 text-center">
        <div className="text-gray-500">No conversation scenarios available</div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Progress */}
      <ProgressBar 
        current={getCurrentExchangeNumber()}
        total={getTotalExchanges()}
        label="Conversation Progress"
        color="orange"
      />
      
      {/* Scenario Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl" role="img" aria-label="scenario">
            {getScenarioIcon(currentScenario.category)}
          </span>
          <div>
            <h2 className="text-lg font-bold text-blue-900">
              {currentScenario.title}
            </h2>
            <p className="text-sm text-blue-700">
              Difficulty: {currentScenario.difficulty}/5
            </p>
          </div>
        </div>
        <p className="text-blue-800 text-sm">
          {currentScenario.context}
        </p>
      </div>
      
      {/* Conversation Exchange */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6 space-y-4">
        {/* Speaker's Line */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              👤
            </div>
            {currentExchange.speaker}:
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="text-lg font-medium text-gray-900">
              {currentExchange.text}
            </div>
            <div className="text-sm text-gray-600 italic">
              ({currentExchange.translation})
            </div>
            <div className="flex justify-center">
              <AudioButton 
                text={currentExchange.text}
                language="sq-AL"
                mode="play"
                size="small"
                variant="secondary"
              />
            </div>
          </div>
        </div>
        
        {/* Response Options */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">
            🗣️ How do you respond?
          </div>
          
          <div className="space-y-2">
            {currentExchange.responses.map((response, index) => (
              <button
                key={index}
                onClick={() => handleResponseSelect(index)}
                disabled={selectedResponse !== null}
                className={`
                  w-full text-left p-4 rounded-lg border-2 transition-all
                  ${selectedResponse === index
                    ? response.correct
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : selectedResponse !== null
                    ? response.correct
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-gray-100'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }
                  ${selectedResponse !== null ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm
                    ${selectedResponse === index
                      ? response.correct
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-red-500 bg-red-500 text-white'
                      : selectedResponse !== null
                      ? response.correct
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300'
                      : 'border-gray-300'
                    }
                  `}>
                    {selectedResponse === index
                      ? response.correct ? '✓' : '✗'
                      : selectedResponse !== null && response.correct
                      ? '✓'
                      : String.fromCharCode(65 + index) // A, B, C...
                    }
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {response.text}
                    </div>
                    <div className="text-sm text-gray-600 italic">
                      ({response.translation})
                    </div>
                  </div>
                  <AudioButton 
                    text={response.text}
                    language="sq-AL"
                    mode="play"
                    size="small"
                    variant="secondary"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Cultural Context */}
      <CulturalNote 
        content={currentScenario.cultural_notes}
        title="Cultural Context"
        variant="highlight"
        collapsible={true}
        defaultExpanded={false}
      />
      
      {/* Navigation Info */}
      <div className="text-center text-sm text-gray-500">
        Scenario {currentScenarioIndex + 1} of {scenarios.length} • 
        Exchange {currentExchangeIndex + 1} of {currentScenario.exchanges.length}
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

ConversationExercise.propTypes = {
  scenarios: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired,
  onResponse: PropTypes.func.isRequired
};

export default ConversationExercise;