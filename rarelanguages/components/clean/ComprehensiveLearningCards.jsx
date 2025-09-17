// Clean Comprehensive Learning Cards - Database Driven
// File: components/clean/ComprehensiveLearningCards.jsx

import React, { useState, useEffect } from 'react';

const ComprehensiveLearningCards = ({ lesson, onComplete, onExit }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [cardResults, setCardResults] = useState([]);

  useEffect(() => {
    generateCardsFromLesson();
  }, [lesson]);

  const generateCardsFromLesson = async () => {
    try {
      setLoading(true);
      
      // Get comprehensive content for this lesson from database
      const response = await fetch(`/api/lessons/${lesson.id}/comprehensive-cards`);
      const data = await response.json();
      
      if (data.success) {
        setCards(data.cards);
      } else {
        // Fallback: generate cards from basic lesson content
        const basicCards = generateBasicCards(lesson.content);
        setCards(basicCards);
      }
    } catch (error) {
      console.error('Failed to load comprehensive cards:', error);
      // Generate from lesson content as fallback
      const basicCards = generateBasicCards(lesson.content);
      setCards(basicCards);
    } finally {
      setLoading(false);
    }
  };

  const generateBasicCards = (content) => {
    const cards = [];
    
    content.forEach(item => {
      // Vocabulary Card
      cards.push({
        id: `vocab_${item.id}`,
        type: 'vocabulary',
        content: item,
        front: item.english_phrase,
        back: {
          albanian: item.target_phrase,
          pronunciation: item.pronunciation_guide,
          cultural_context: item.cultural_context,
          example_sentence: `"${item.target_phrase}" - ${item.english_phrase}`,
          gender: extractGender(item.target_phrase),
          variations: generateVariations(item)
        }
      });

      // If it's a verb, add conjugation card
      if (isVerb(item.target_phrase)) {
        cards.push({
          id: `conjugation_${item.id}`,
          type: 'verb_conjugation',
          content: item,
          front: `Conjugate: ${item.target_phrase}`,
          back: {
            infinitive: item.target_phrase,
            pronunciation: item.pronunciation_guide,
            conjugations: generateConjugations(item.target_phrase),
            examples: generateVerbExamples(item.target_phrase)
          }
        });
      }
    });

    return cards;
  };

  const extractGender = (phrase) => {
    // Simple gender detection for Albanian nouns
    if (phrase.includes(' i ') || phrase.endsWith(' i')) return 'masculine';
    if (phrase.includes(' e ') || phrase.endsWith(' e')) return 'feminine';
    return null;
  };

  const generateVariations = (item) => {
    const variations = [];
    const albanian = item.target_phrase.toLowerCase();
    
    // Generate plural/singular variations
    if (albanian.includes('babai')) {
      variations.push({ form: 'definite', text: 'babai', translation: 'the father' });
      variations.push({ form: 'indefinite', text: 'baba', translation: 'father' });
    }
    
    if (albanian.includes('nëna')) {
      variations.push({ form: 'definite', text: 'nëna', translation: 'the mother' });
      variations.push({ form: 'indefinite', text: 'nënë', translation: 'mother' });
    }

    return variations;
  };

  const generateConjugations = (verb) => {
    // This would ideally come from your verbs table in the database
    // For now, basic pattern generation
    const root = verb.replace(/oj$|aj$|ej$/, '');
    
    return {
      present: {
        'unë': `${root}oj`,      // I
        'ti': `${root}on`,       // you (singular)
        'ai/ajo': `${root}on`,   // he/she
        'ne': `${root}ojmë`,     // we
        'ju': `${root}oni`,      // you (plural)
        'ata/ato': `${root}ojnë` // they
      }
    };
  };

  const generateVerbExamples = (verb) => {
    const examples = [
      { albanian: `Unë ${verb.replace(/oj$/, 'oj')} çdo ditë`, english: `I ${verb.replace(/oj$/, '')} every day` },
      { albanian: `A ${verb.replace(/oj$/, 'on')} ti?`, english: `Do you ${verb.replace(/oj$/, '')}?` }
    ];
    return examples;
  };

  const isVerb = (phrase) => {
    return phrase.endsWith('oj') || phrase.endsWith('aj') || phrase.endsWith('ej') || 
           phrase.includes('punoj') || phrase.includes('flas') || phrase.includes('shkoj');
  };

  const currentCard = cards[currentCardIndex];
  const progress = cards.length > 0 ? ((currentCardIndex + 1) / cards.length) * 100 : 0;

  const handleCardRating = (difficulty) => {
    const result = {
      card_id: currentCard.id,
      content_id: currentCard.content.id,
      difficulty_rating: difficulty,
      time_spent: Date.now() - cardStartTime,
      showed_answer: showAnswer
    };

    setCardResults(prev => [...prev, result]);

    if (currentCardIndex < cards.length - 1) {
      nextCard();
    } else {
      completeCardSession();
    }
  };

  const nextCard = () => {
    setCurrentCardIndex(prev => prev + 1);
    setShowAnswer(false);
    setCardStartTime(Date.now());
  };

  const completeCardSession = () => {
    const sessionResults = {
      lesson_id: lesson.id,
      cards_completed: cardResults.length,
      total_time: Date.now() - sessionStartTime,
      average_difficulty: cardResults.reduce((sum, r) => sum + r.difficulty_rating, 0) / cardResults.length,
      card_results: cardResults
    };

    onComplete(sessionResults);
  };

  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'sq';
      utterance.rate = 0.7;
      speechSynthesis.speak(utterance);
    }
  };

  const [cardStartTime, setCardStartTime] = useState(Date.now());
  const [sessionStartTime] = useState(Date.now());

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comprehensive lesson...</p>
        </div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No cards available for this lesson.</p>
          <button onClick={onExit} className="mt-4 bg-gray-600 text-white px-6 py-3 rounded-lg">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={onExit}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              ← Exit
            </button>
            <div className="text-center">
              <h1 className="text-lg font-bold text-gray-900">{lesson.name}</h1>
              <p className="text-sm text-gray-500">
                Card {currentCardIndex + 1} of {cards.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-indigo-600">
                {Math.round(progress)}%
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Card Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {/* Card Type Badge */}
          <div className="bg-indigo-600 text-white px-6 py-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">
                {currentCard.type === 'vocabulary' ? '📚 Vocabulary' : 
                 currentCard.type === 'verb_conjugation' ? '🔄 Verb Conjugation' :
                 '📖 Learning Card'}
              </span>
              <button 
                onClick={() => playAudio(currentCard.back?.albanian || currentCard.content.target_phrase)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded-lg text-sm"
              >
                🔊 Listen
              </button>
            </div>
          </div>

          {/* Card Front/Back */}
          <div className="p-8">
            {!showAnswer ? (
              // FRONT OF CARD
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-6">
                  {currentCard.front}
                </div>
                
                <button 
                  onClick={() => setShowAnswer(true)}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-indigo-700 transition-colors"
                >
                  Show Answer
                </button>
              </div>
            ) : (
              // BACK OF CARD - Rich Learning Content
              <div>
                {currentCard.type === 'vocabulary' && (
                  <VocabularyCardBack card={currentCard} playAudio={playAudio} />
                )}
                
                {currentCard.type === 'verb_conjugation' && (
                  <VerbConjugationCardBack card={currentCard} playAudio={playAudio} />
                )}

                {/* Difficulty Rating */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-center text-gray-600 mb-4 font-medium">
                    How well did you know this?
                  </p>
                  <div className="flex justify-center gap-3">
                    {[
                      { rating: 1, label: 'Again', color: 'bg-red-500 hover:bg-red-600', desc: 'Complete blackout' },
                      { rating: 2, label: 'Hard', color: 'bg-orange-500 hover:bg-orange-600', desc: 'Incorrect response; correct one remembered' },
                      { rating: 3, label: 'Good', color: 'bg-blue-500 hover:bg-blue-600', desc: 'Correct response after hesitation' },
                      { rating: 4, label: 'Easy', color: 'bg-green-500 hover:bg-green-600', desc: 'Perfect response' }
                    ].map(({ rating, label, color, desc }) => (
                      <button
                        key={rating}
                        onClick={() => handleCardRating(rating)}
                        className={`${color} text-white px-4 py-3 rounded-lg font-bold text-sm transition-colors`}
                        title={desc}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card Navigation */}
        {showAnswer && (
          <div className="mt-6 flex justify-between">
            <button 
              onClick={() => setShowAnswer(false)}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Hide Answer
            </button>
            
            <div className="text-sm text-gray-500">
              Use difficulty buttons above to continue
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Vocabulary Card Back Component
const VocabularyCardBack = ({ card, playAudio }) => {
  const { back } = card;
  
  return (
    <div className="space-y-6">
      {/* Main Translation */}
      <div className="text-center">
        <div className="text-4xl font-bold text-indigo-600 mb-2">
          {back.albanian}
        </div>
        {back.gender && (
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
            back.gender === 'masculine' ? 'bg-blue-100 text-blue-800' :
            back.gender === 'feminine' ? 'bg-pink-100 text-pink-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {back.gender}
          </span>
        )}
      </div>

      {/* Pronunciation */}
      {back.pronunciation && (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-sm font-medium mb-1">Pronunciation</p>
          <p className="text-lg font-mono text-gray-800">{back.pronunciation}</p>
        </div>
      )}

      {/* Example Sentence */}
      {back.example_sentence && (
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-800 font-medium mb-1">📝 Example</p>
          <p className="text-blue-700">{back.example_sentence}</p>
        </div>
      )}

      {/* Variations */}
      {back.variations && back.variations.length > 0 && (
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-green-800 font-medium mb-2">🔄 Variations</p>
          <div className="space-y-2">
            {back.variations.map((variation, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-green-700 font-medium">{variation.text}</span>
                <span className="text-green-600 text-sm">({variation.form}) {variation.translation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cultural Context */}
      {back.cultural_context && (
        <div className="bg-amber-50 rounded-lg p-4">
          <p className="text-amber-800 font-medium mb-1">💡 Cultural Note</p>
          <p className="text-amber-700 text-sm">{back.cultural_context}</p>
        </div>
      )}
    </div>
  );
};

// Verb Conjugation Card Back Component
const VerbConjugationCardBack = ({ card, playAudio }) => {
  const { back } = card;
  
  return (
    <div className="space-y-6">
      {/* Infinitive */}
      <div className="text-center">
        <div className="text-4xl font-bold text-purple-600 mb-2">
          {back.infinitive}
        </div>
        <p className="text-gray-600">Infinitive Form</p>
      </div>

      {/* Pronunciation */}
      {back.pronunciation && (
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-sm font-medium mb-1">Pronunciation</p>
          <p className="text-lg font-mono text-gray-800">{back.pronunciation}</p>
        </div>
      )}

      {/* Conjugation Table */}
      {back.conjugations && (
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-purple-800 font-bold mb-3 text-center">Present Tense</p>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(back.conjugations.present).map(([pronoun, conjugation]) => (
              <div key={pronoun} className="flex justify-between items-center bg-white rounded-lg p-3">
                <span className="font-medium text-gray-700">{pronoun}</span>
                <span className="font-bold text-purple-600">{conjugation}</span>
                <button 
                  onClick={() => playAudio(conjugation)}
                  className="text-purple-500 hover:text-purple-700 text-sm"
                >
                  🔊
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Example Sentences */}
      {back.examples && back.examples.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-800 font-medium mb-2">📝 Examples</p>
          <div className="space-y-2">
            {back.examples.map((example, index) => (
              <div key={index} className="bg-white rounded-lg p-3">
                <p className="text-blue-700 font-medium">{example.albanian}</p>
                <p className="text-blue-600 text-sm">{example.english}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprehensiveLearningCards;