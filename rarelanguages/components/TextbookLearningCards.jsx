// File: components/TextbookLearningCards.jsx
// Proper teach → practice → test flow like a real textbook

import React, { useState, useEffect } from 'react';

const TextbookLearningCards = ({ lesson, onComplete, onExit }) => {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('teaching');
  const [phaseProgress, setPhaseProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);

  // Lesson phases with clear expectations
  const phases = {
    teaching: {
      title: "📚 Learning New Material",
      description: "Just relax and absorb - no testing yet!",
      icon: "🎓",
      color: "blue",
      allowSkip: true,
      showAnswers: true
    },
    practice: {
      title: "🎯 Guided Practice", 
      description: "Try it out with hints and support",
      icon: "💪",
      color: "green",
      allowSkip: true,
      showHints: true
    },
    testing: {
      title: "🧠 Check Your Learning",
      description: "Show what you've learned (no hints!)",
      icon: "✨",
      color: "purple",
      allowSkip: false,
      showAnswers: false
    }
  };

  useEffect(() => {
    generateTextbookCards();
  }, [lesson]);

  const generateTextbookCards = async () => {
    try {
      setLoading(true);
      
      // Get lesson content from your database
      const response = await fetch(`/api/lessons/${lesson.id}/textbook-content`);
      const data = await response.json();
      
      if (data.success) {
        const generatedCards = createTextbookFlow(data.content);
        setCards(generatedCards);
        calculatePhaseProgress(generatedCards);
      } else {
        // Fallback: generate from basic lesson content
        const generatedCards = createBasicTextbookFlow(lesson.content);
        setCards(generatedCards);
        calculatePhaseProgress(generatedCards);
      }
    } catch (error) {
      console.error('Failed to load textbook content:', error);
      // Create minimal flow from existing content
      const generatedCards = createBasicTextbookFlow(lesson.content || []);
      setCards(generatedCards);
      calculatePhaseProgress(generatedCards);
    } finally {
      setLoading(false);
    }
  };

  const createTextbookFlow = (content) => {
    const cards = [];
    
    // PHASE 1: TEACHING - Show new material without pressure
    cards.push(createLessonOverviewCard(content));
    
    // Teach vocabulary (no testing)
    content.vocabulary?.slice(0, 8).forEach((word, index) => {
      cards.push(createVocabularyTeachingCard(word, index + 1));
    });
    
    // Teach grammar if available
    if (content.grammar) {
      cards.push(createGrammarTeachingCard(content.grammar));
    }
    
    // Show examples in context
    cards.push(createExamplesShowcase(content.examples || []));
    
    // PHASE 2: PRACTICE - Easy practice with hints
    cards.push(createPhaseTransitionCard('practice'));
    
    // Recognition practice (multiple choice)
    content.vocabulary?.slice(0, 6).forEach(word => {
      cards.push(createRecognitionPracticeCard(word, content.vocabulary));
    });
    
    // Pattern practice with grammar
    if (content.grammar) {
      cards.push(createPatternPracticeCard(content.grammar, content.vocabulary));
    }
    
    // Audio practice
    cards.push(createAudioPracticeCard(content.vocabulary?.slice(0, 5)));
    
    // PHASE 3: TESTING - Check understanding without hints
    cards.push(createPhaseTransitionCard('testing'));
    
    // Recall testing (type the answer)
    content.vocabulary?.slice(0, 5).forEach(word => {
      cards.push(createRecallTestCard(word));
    });
    
    // Conversation application
    cards.push(createConversationTestCard(content));
    
    // Final review
    cards.push(createLessonReviewCard(content));
    
    return cards;
  };

  const createBasicTextbookFlow = (basicContent) => {
    const cards = [];
    if (!basicContent || !Array.isArray(basicContent)) {
      console.error('Invalid basicContent provided to createBasicTextbookFlow:', basicContent);
      return cards;
    }
    const vocabulary = basicContent.slice(0, 8); // First 8 items
    
    // Teaching phase
    cards.push({
      id: 'overview',
      phase: 'teaching',
      type: 'overview',
      title: 'Lesson Overview',
      content: {
        title: lesson.name,
        description: lesson.description || 'Learn essential Albanian vocabulary',
        wordCount: vocabulary.length,
        estimatedMinutes: lesson.estimated_minutes || 15
      }
    });
    
    vocabulary.forEach((item, index) => {
      cards.push({
        id: `teach-${index}`,
        phase: 'teaching',
        type: 'vocabulary_teaching',
        title: `New Word ${index + 1}`,
        content: {
          albanian: item.target_phrase,
          english: item.english_phrase,
          pronunciation: item.pronunciation_guide,
          cultural_context: item.cultural_context,
          wordNumber: index + 1,
          totalWords: vocabulary.length
        }
      });
    });
    
    // Practice phase
    cards.push({
      id: 'practice-transition',
      phase: 'practice',
      type: 'phase_transition',
      title: 'Practice Time',
      content: {
        phase: 'practice',
        message: 'Great! Now let\'s practice what you just learned.',
        description: 'We\'ll start easy with hints and support.'
      }
    });
    
    vocabulary.slice(0, 5).forEach((item, index) => {
      cards.push({
        id: `practice-${index}`,
        phase: 'practice',
        type: 'recognition',
        title: 'Recognition Practice',
        content: {
          question: `Which word means "${item.english_phrase}"?`,
          correct: item.target_phrase,
          options: generateMultipleChoiceOptions(item.target_phrase, vocabulary),
          pronunciation: item.pronunciation_guide
        }
      });
    });
    
    // Testing phase  
    cards.push({
      id: 'test-transition',
      phase: 'testing',
      type: 'phase_transition',
      title: 'Check Your Learning',
      content: {
        phase: 'testing',
        message: 'Time to show what you\'ve learned!',
        description: 'No hints this time - you\'ve got this!'
      }
    });
    
    vocabulary.slice(0, 4).forEach((item, index) => {
      cards.push({
        id: `test-${index}`,
        phase: 'testing',
        type: 'recall',
        title: 'Recall Test',
        content: {
          question: `How do you say "${item.english_phrase}" in Albanian?`,
          correct: item.target_phrase,
          pronunciation: item.pronunciation_guide,
          cultural_context: item.cultural_context
        }
      });
    });
    
    cards.push({
      id: 'review',
      phase: 'testing',
      type: 'review',
      title: 'Lesson Complete!',
      content: {
        wordsLearned: vocabulary.length,
        keyPhrases: vocabulary.slice(0, 3).map(item => ({
          albanian: item.target_phrase,
          english: item.english_phrase
        })),
        nextSteps: 'Practice these words throughout the day!'
      }
    });
    
    return cards;
  };

  const calculatePhaseProgress = (allCards) => {
    const progress = {};
    Object.keys(phases).forEach(phase => {
      const phaseCards = allCards.filter(card => card.phase === phase);
      progress[phase] = {
        total: phaseCards.length,
        completed: 0
      };
    });
    setPhaseProgress(progress);
  };

  const getCurrentCard = () => cards[currentCardIndex];
  
  const nextCard = () => {
    // Clear any component-level state to prevent auto-answer bugs
    setSelectedAnswer(null);
    setShowResult(false);
    setIsAnswering(false);
    
    if (currentCardIndex < cards.length - 1) {
      const newIndex = currentCardIndex + 1;
      setCurrentCardIndex(newIndex);
      
      // Update phase if needed
      const newCard = cards[newIndex];
      if (newCard.phase !== currentPhase) {
        setCurrentPhase(newCard.phase);
      }
      
      // Update progress
      updatePhaseProgress();
    } else {
      completeLesson();
    }
  };

  const updatePhaseProgress = () => {
    const currentCard = getCurrentCard();
    if (currentCard) {
      setPhaseProgress(prev => ({
        ...prev,
        [currentCard.phase]: {
          ...prev[currentCard.phase],
          completed: prev[currentCard.phase].completed + 1
        }
      }));
    }
  };

  const completeLesson = () => {
    const results = {
      lesson_id: lesson.id,
      phases_completed: Object.keys(phases),
      total_cards: cards.length,
      completion_time: Date.now()
    };
    
    onComplete(results);
  };

  const renderCard = (card) => {
    if (!card) return null;

    const phaseInfo = phases[card.phase];
    
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto">
        {/* Phase Header */}
        <div className={`p-4 bg-gradient-to-r ${getPhaseGradient(card.phase)}`}>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{phaseInfo.icon}</span>
              <div>
                <h2 className="font-bold text-lg">{phaseInfo.title}</h2>
                <p className="text-sm opacity-90">{phaseInfo.description}</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="font-medium">
                Card {currentCardIndex + 1} of {cards.length}
              </div>
              <div className="opacity-80">
                Phase: {phaseProgress[card.phase]?.completed || 0} / {phaseProgress[card.phase]?.total || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-8">
          {renderCardContent(card)}
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <button 
              onClick={onExit}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Exit Lesson
            </button>
            
            <div className="flex gap-3">
              {phaseInfo.allowSkip && (
                <button 
                  onClick={nextCard}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Skip →
                </button>
              )}
              
              <button 
                onClick={nextCard}
                className={`px-6 py-3 rounded-lg font-bold text-white transition-colors ${
                  getPhaseButtonClass(card.phase)
                }`}
              >
                {currentCardIndex === cards.length - 1 ? 'Complete Lesson' : 'Continue →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCardContent = (card) => {
    switch (card.type) {
      case 'overview':
        return <OverviewCard content={card.content} />;
      case 'vocabulary_teaching':
        return <VocabularyTeachingCard content={card.content} />;
      case 'grammar_teaching':
        return <GrammarTeachingCard content={card.content} />;
      case 'phase_transition':
        return <PhaseTransitionCard content={card.content} />;
      case 'recognition':
        return <RecognitionPracticeCard content={card.content} onAnswer={nextCard} resetKey={currentCardIndex} />;
      case 'recall':
        return <RecallTestCard content={card.content} onAnswer={nextCard} resetKey={currentCardIndex} />;
      case 'review':
        return <ReviewCard content={card.content} />;
      case 'examples_showcase':
        return <ExamplesShowcaseCard content={card.content} />;
      case 'pattern_practice':
        return <PatternPracticeCard content={card.content} />;
      case 'audio_practice':
        return <AudioPracticeCard content={card.content} />;
      case 'conversation':
        return <ConversationTestCard content={card.content} />;
      default:
        return <div>Unknown card type: {card.type}</div>;
    }
  };

  // Helper functions
  const getPhaseGradient = (phase) => {
    const gradients = {
      teaching: 'from-blue-500 to-blue-600',
      practice: 'from-green-500 to-green-600', 
      testing: 'from-purple-500 to-purple-600'
    };
    return gradients[phase] || 'from-gray-500 to-gray-600';
  };

  const getPhaseButtonClass = (phase) => {
    const classes = {
      teaching: 'bg-blue-600 hover:bg-blue-700',
      practice: 'bg-green-600 hover:bg-green-700',
      testing: 'bg-purple-600 hover:bg-purple-700'
    };
    return classes[phase] || 'bg-gray-600 hover:bg-gray-700';
  };

  const generateMultipleChoiceOptions = (correct, allVocab) => {
    const incorrect = allVocab
      .filter(item => item.target_phrase !== correct)
      .slice(0, 3)
      .map(item => item.target_phrase);
    
    const options = [correct, ...incorrect];
    return options.sort(() => Math.random() - 0.5); // Shuffle
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      {renderCard(getCurrentCard())}
    </div>
  );
};

// Individual Card Components
const OverviewCard = ({ content }) => (
  <div className="text-center space-y-6">
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{content.title}</h1>
      <p className="text-xl text-gray-600">{content.description}</p>
    </div>
    
    <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="text-2xl font-bold text-blue-600">{content.wordCount}</div>
        <div className="text-sm text-blue-700">New Words</div>
      </div>
      <div className="bg-green-50 rounded-lg p-4">
        <div className="text-2xl font-bold text-green-600">{content.estimatedMinutes}m</div>
        <div className="text-sm text-green-700">Est. Time</div>
      </div>
      <div className="bg-purple-50 rounded-lg p-4">
        <div className="text-2xl font-bold text-purple-600">3</div>
        <div className="text-sm text-purple-700">Phases</div>
      </div>
    </div>
    
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 text-amber-800">
        <span>💡</span>
        <span className="font-medium">Study Tip</span>
      </div>
      <p className="text-amber-700 text-sm mt-1">
        First we'll teach you new words, then practice together, then test what you learned.
      </p>
    </div>
  </div>
);

const VocabularyTeachingCard = ({ content }) => (
  <div className="text-center space-y-8">
    <div className="mb-6">
      <div className="text-sm text-gray-500 mb-2">
        Word {content.wordNumber} of {content.totalWords}
      </div>
      <div className="text-5xl font-bold text-blue-600 mb-3">
        {content.albanian}
      </div>
      <div className="text-lg text-gray-500 mb-2">
        {content.pronunciation}
      </div>
      <div className="text-2xl text-gray-800">
        = {content.english}
      </div>
    </div>
    
    {content.cultural_context && (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
        <div className="flex items-start gap-2 text-amber-800">
          <span className="text-lg">🏛️</span>
          <div>
            <div className="font-medium text-sm">Cultural Context</div>
            <p className="text-amber-700 text-sm mt-1">{content.cultural_context}</p>
          </div>
        </div>
      </div>
    )}
    
    <button 
      onClick={() => {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(content.albanian);
          utterance.lang = 'sq';
          utterance.rate = 0.7;
          speechSynthesis.speak(utterance);
        }
      }}
      className="bg-blue-100 text-blue-700 px-6 py-3 rounded-lg hover:bg-blue-200 transition-colors"
    >
      🔊 Listen to Pronunciation
    </button>
  </div>
);

const PhaseTransitionCard = ({ content }) => (
  <div className="text-center space-y-6">
    <div className="text-6xl mb-4">
      {content.phase === 'practice' ? '🎯' : '🧠'}
    </div>
    <h2 className="text-3xl font-bold text-gray-900 mb-4">
      {content.message}
    </h2>
    <p className="text-xl text-gray-600 max-w-md mx-auto">
      {content.description}
    </p>
    
    {content.phase === 'practice' && (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
        <div className="text-green-800 text-sm">
          💡 <strong>Hint:</strong> Take your time and use the hints if you need them!
        </div>
      </div>
    )}
    
    {content.phase === 'testing' && (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md mx-auto">
        <div className="text-purple-800 text-sm">
          ✨ <strong>You've got this!</strong> Remember what you learned in the teaching phase.
        </div>
      </div>
    )}
  </div>
);

const RecognitionPracticeCard = ({ content, onAnswer, resetKey }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when card changes
  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setIsProcessing(false);
  }, [resetKey, content?.question]);

  const handleAnswer = (answer) => {
    if (isProcessing || showResult) return; // Prevent double-clicking
    
    setIsProcessing(true);
    setSelectedAnswer(answer);
    setShowResult(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      onAnswer();
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {content.question}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
        {content.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !showResult && !isProcessing && handleAnswer(option)}
            disabled={showResult || isProcessing}
            className={`p-4 text-left rounded-lg border-2 transition-all ${
              showResult
                ? option === content.correct
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : option === selectedAnswer
                  ? 'border-red-500 bg-red-50 text-red-800'
                  : 'border-gray-200 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="font-medium text-lg">{option}</div>
          </button>
        ))}
      </div>
      
      {showResult && (
        <div className="text-center">
          <div className={`text-2xl mb-2 ${
            selectedAnswer === content.correct ? 'text-green-600' : 'text-orange-600'
          }`}>
            {selectedAnswer === content.correct ? '✅ Correct!' : '💡 Keep Learning!'}
          </div>
          {selectedAnswer !== content.correct && (
            <div className="text-gray-700">
              Correct answer: <strong>{content.correct}</strong>
            </div>
          )}
          <div className="text-sm text-gray-500 mt-2">
            {content.pronunciation && `Pronunciation: ${content.pronunciation}`}
          </div>
        </div>
      )}
    </div>
  );
};

const RecallTestCard = ({ content, onAnswer, resetKey }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset state when card changes
  useEffect(() => {
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(false);
    setIsProcessing(false);
  }, [resetKey, content?.question]);

  const handleSubmit = () => {
    if (isProcessing || showResult || !userAnswer.trim()) return; // Prevent multiple submissions
    
    setIsProcessing(true);
    const correct = userAnswer.toLowerCase().trim() === content.correct.toLowerCase().trim();
    setIsCorrect(correct);
    setShowResult(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      onAnswer();
    }, 3000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && userAnswer.trim() && !showResult) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          {content.question}
        </h3>
      </div>
      
      <div className="max-w-md mx-auto">
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={showResult}
          placeholder="Type your answer..."
          className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none disabled:bg-gray-100"
        />
        
        {!showResult && (
          <button
            onClick={handleSubmit}
            disabled={!userAnswer.trim() || isProcessing || showResult}
            className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Check Answer
          </button>
        )}
      </div>
      
      {showResult && (
        <div className="text-center">
          <div className={`text-2xl mb-4 ${isCorrect ? 'text-green-600' : 'text-orange-600'}`}>
            {isCorrect ? '🎉 Excellent!' : '📚 Good try!'}
          </div>
          
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="text-lg font-bold text-gray-900 mb-2">
              {content.correct}
            </div>
            {content.pronunciation && (
              <div className="text-gray-600 mb-2">
                {content.pronunciation}
              </div>
            )}
            {content.cultural_context && (
              <div className="text-sm text-gray-500 mt-3 pt-3 border-t border-gray-100">
                💡 {content.cultural_context}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ReviewCard = ({ content }) => (
  <div className="text-center space-y-6">
    <div className="text-6xl mb-4">🎉</div>
    <h2 className="text-3xl font-bold text-gray-900 mb-4">
      Lesson Complete!
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="text-3xl font-bold text-blue-600">{content.wordsLearned}</div>
        <div className="text-blue-700 font-medium">Words Learned</div>
      </div>
      <div className="bg-green-50 rounded-lg p-4">
        <div className="text-3xl font-bold text-green-600">3</div>
        <div className="text-green-700 font-medium">Phases Completed</div>
      </div>
      <div className="bg-purple-50 rounded-lg p-4">
        <div className="text-3xl font-bold text-purple-600">✓</div>
        <div className="text-purple-700 font-medium">Ready for Next</div>
      </div>
    </div>
    
    <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md mx-auto">
      <h3 className="font-bold text-lg mb-4 text-gray-900">Key Phrases to Remember</h3>
      <div className="space-y-3">
        {content.keyPhrases?.map((phrase, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="font-medium text-gray-800">{phrase.albanian}</span>
            <span className="text-gray-600 text-sm">{phrase.english}</span>
          </div>
        ))}
      </div>
    </div>
    
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
      <div className="text-amber-800 text-sm">
        💡 <strong>Next Steps:</strong> {content.nextSteps}
      </div>
    </div>
  </div>
);

// Helper functions for creating specific card types
const createLessonOverviewCard = (content) => ({
  id: 'overview',
  phase: 'teaching',
  type: 'overview',
  title: 'Lesson Overview',
  content: {
    title: content.topic || 'Albanian Lesson',
    description: content.description || 'Learn essential vocabulary and grammar',
    wordCount: content.vocabulary?.length || 0,
    estimatedMinutes: content.estimatedMinutes || 15
  }
});

const createVocabularyTeachingCard = (word, index) => ({
  id: `teach-vocab-${index}`,
  phase: 'teaching',
  type: 'vocabulary_teaching',
  title: `New Word ${index}`,
  content: {
    albanian: word.albanian || word.target_phrase,
    english: word.english || word.english_phrase,
    pronunciation: word.pronunciation || word.pronunciation_guide,
    cultural_context: word.cultural_context,
    wordNumber: index,
    totalWords: word.totalWords || 8
  }
});

const createGrammarTeachingCard = (grammar) => ({
  id: 'grammar-teaching',
  phase: 'teaching',
  type: 'grammar_teaching',
  title: 'Grammar Focus',
  content: {
    concept: grammar.concept || 'Grammar Pattern',
    explanation: grammar.explanation,
    examples: grammar.examples || [],
    pattern: grammar.pattern
  }
});

const createExamplesShowcase = (examples) => ({
  id: 'examples-showcase',
  phase: 'teaching',
  type: 'examples_showcase',
  title: 'See It In Action',
  content: {
    examples: (examples || []).slice(0, 4),
    title: 'Common Phrases'
  }
});

const createPhaseTransitionCard = (phase) => ({
  id: `${phase}-transition`,
  phase: phase,
  type: 'phase_transition',
  title: phase === 'practice' ? 'Practice Time' : 'Test Yourself',
  content: {
    phase: phase,
    message: phase === 'practice' 
      ? 'Great! Now let\'s practice what you just learned.'
      : 'Time to show what you\'ve learned!',
    description: phase === 'practice'
      ? 'We\'ll start easy with hints and support.'
      : 'No hints this time - you\'ve got this!'
  }
});

const createRecognitionPracticeCard = (word, allVocabulary) => ({
  id: `practice-${word.id || Math.random()}`,
  phase: 'practice',
  type: 'recognition',
  title: 'Recognition Practice',
  content: {
    question: `Which word means "${word.english || word.english_phrase}"?`,
    correct: word.albanian || word.target_phrase,
    options: generateMultipleChoiceOptions(word.albanian || word.target_phrase, allVocabulary || []),
    pronunciation: word.pronunciation || word.pronunciation_guide
  }
});

const createPatternPracticeCard = (grammar, vocabulary) => ({
  id: 'pattern-practice',
  phase: 'practice',
  type: 'pattern_practice',
  title: 'Grammar Practice',
  content: {
    pattern: grammar.pattern,
    examples: grammar.examples,
    vocabulary: vocabulary
  }
});

const createAudioPracticeCard = (vocabulary) => ({
  id: 'audio-practice',
  phase: 'practice',
  type: 'audio_practice',
  title: 'Pronunciation Practice',
  content: {
    words: vocabulary.map(word => ({
      albanian: word.albanian || word.target_phrase,
      pronunciation: word.pronunciation || word.pronunciation_guide
    }))
  }
});

// Helper function to generate multiple choice options
const generateMultipleChoiceOptions = (correct, allVocabulary) => {
  if (!correct || !Array.isArray(allVocabulary)) {
    return [correct || 'Unknown'].filter(Boolean);
  }
  
  const options = [correct];
  const otherWords = allVocabulary
    .map(item => item.albanian || item.target_phrase)
    .filter(word => word && word !== correct)
    .slice(0, 3);
  
  options.push(...otherWords);
  
  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  
  return options.slice(0, 4); // Ensure we have max 4 options
};

const createRecallTestCard = (word) => ({
  id: `test-${word.id || Math.random()}`,
  phase: 'testing',
  type: 'recall',
  title: 'Recall Test',
  content: {
    question: `How do you say "${word.english || word.english_phrase}" in Albanian?`,
    correct: word.albanian || word.target_phrase,
    pronunciation: word.pronunciation || word.pronunciation_guide,
    cultural_context: word.cultural_context
  }
});

const createConversationTestCard = (content) => ({
  id: 'conversation-test',
  phase: 'testing',
  type: 'conversation',
  title: 'Use It In Conversation',
  content: {
    scenario: content.conversationScenario || 'Family introduction',
    dialogue: content.dialogue || [],
    vocabulary: content.vocabulary
  }
});

const createLessonReviewCard = (content) => ({
  id: 'lesson-review',
  phase: 'testing',
  type: 'review',
  title: 'Lesson Complete!',
  content: {
    wordsLearned: content.vocabulary?.length || 0,
    keyPhrases: (content.vocabulary || []).slice(0, 3).map(word => ({
      albanian: word.albanian || word.target_phrase,
      english: word.english || word.english_phrase
    })),
    nextSteps: content.nextSteps || 'Practice these words throughout the day!'
  }
});

// Missing card components
const ExamplesShowcaseCard = ({ content }) => (
  <div className="text-center space-y-6">
    <h3 className="text-2xl font-bold text-gray-900 mb-6">{content.title || 'Examples'}</h3>
    <div className="space-y-4 max-w-lg mx-auto">
      {(content.examples || []).map((example, index) => {
        // Handle both string and object examples
        if (typeof example === 'string') {
          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="font-medium text-gray-800">{example}</div>
            </div>
          );
        }
        
        return (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="font-medium text-gray-800">{example.albanian || example.phrase || 'Example'}</div>
            <div className="text-gray-600 text-sm">{example.english || example.translation || ''}</div>
          </div>
        );
      })}
    </div>
  </div>
);

const PatternPracticeCard = ({ content }) => (
  <div className="text-center space-y-6">
    <h3 className="text-2xl font-bold text-gray-900 mb-6">Grammar Practice</h3>
    <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
      <div className="font-medium text-blue-800">{content.pattern || 'Grammar Pattern'}</div>
    </div>
    <div className="space-y-3">
      {(content.examples || []).map((example, index) => (
        <div key={index} className="text-gray-700">
          {typeof example === 'string' ? example : example.text || example.albanian || 'Example'}
        </div>
      ))}
    </div>
  </div>
);

const AudioPracticeCard = ({ content }) => (
  <div className="text-center space-y-6">
    <h3 className="text-2xl font-bold text-gray-900 mb-6">Pronunciation Practice</h3>
    <div className="space-y-4 max-w-md mx-auto">
      {(content.words || []).map((word, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4">
          <div className="font-medium text-lg">{word.albanian}</div>
          <div className="text-gray-600 text-sm">{word.pronunciation}</div>
          <button 
            onClick={() => {
              if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(word.albanian);
                utterance.lang = 'sq';
                speechSynthesis.speak(utterance);
              }
            }}
            className="mt-2 text-blue-600 hover:text-blue-700"
          >
            🔊 Play
          </button>
        </div>
      ))}
    </div>
  </div>
);

const ConversationTestCard = ({ content }) => (
  <div className="text-center space-y-6">
    <h3 className="text-2xl font-bold text-gray-900 mb-6">Conversation Practice</h3>
    <div className="bg-purple-50 rounded-lg p-4 max-w-md mx-auto">
      <div className="text-purple-800">Scenario: {content.scenario || 'Practice conversation'}</div>
    </div>
    <div className="space-y-3">
      {(content.dialogue || []).map((line, index) => (
        <div key={index} className="text-gray-700">
          {typeof line === 'string' ? line : line.text || line.speaker + ': ' + line.message || 'Dialogue line'}
        </div>
      ))}
    </div>
  </div>
);

const GrammarTeachingCard = ({ content }) => (
  <div className="text-center space-y-6">
    <h3 className="text-2xl font-bold text-gray-900 mb-6">{content.concept || 'Grammar'}</h3>
    <div className="bg-green-50 rounded-lg p-4 max-w-md mx-auto">
      <div className="text-green-800">{content.explanation || 'Grammar explanation'}</div>
    </div>
    <div className="space-y-3">
      {(content.examples || []).map((example, index) => (
        <div key={index} className="text-gray-700">
          {typeof example === 'string' ? example : example.text || example.sentence || 'Example'}
        </div>
      ))}
    </div>
  </div>
);

export default TextbookLearningCards;