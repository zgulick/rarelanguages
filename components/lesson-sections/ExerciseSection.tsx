'use client';

import React, { useState, useEffect } from 'react';

interface ExerciseSectionProps {
  section: {
    title: string;
    content: any;
    exercises?: any[];
  };
  onNext: () => void;
}

const ExerciseSection: React.FC<ExerciseSectionProps> = ({ section, onNext }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Reset exercise index when section changes (new lesson loaded)
  useEffect(() => {
    setCurrentExerciseIndex(0);
    setCurrentItemIndex(0);
    setUserAnswer('');
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsCorrect(false);
  }, [section]);

  // Extract exercises from different possible structures
  const exercises = (() => {
    // New structure: exercises is an object with categories
    if (section.exercises && typeof section.exercises === 'object' && !Array.isArray(section.exercises)) {
      // Bind to a local so the narrowing survives inside the callback below.
      const grouped = section.exercises as Record<string, any>;
      const allExercises: any[] = [];

      // Flatten all exercise categories into a single array
      // Priority order: guided_practice, recognition, production, real_world, assessment
      const categories = ['guided_practice', 'recognition', 'production', 'real_world', 'assessment'];

      categories.forEach(category => {
        const items = grouped[category];
        if (Array.isArray(items)) {
          allExercises.push(...items.map((ex: any) => ({
            ...ex,
            category // Add category for context
          })));
        }
      });

      return allExercises;
    }

    // Old structure: exercises is already an array
    if (Array.isArray(section.exercises)) {
      return section.exercises;
    }

    return [];
  })();

  const currentExercise = exercises[currentExerciseIndex];

  // For new structure, exercises don't have items - they ARE the item
  // For old structure, exercises have items array
  const currentItem = currentExercise?.items?.[currentItemIndex] || currentExercise;

  const handleMultipleChoice = (option: string) => {
    setSelectedAnswer(option);
    const correct = option === currentItem.correct || option === currentItem.answer;
    setIsCorrect(correct);
    setShowFeedback(true);

    setTimeout(() => {
      handleNextItem();
    }, 2000);
  };

  const handleFillBlank = () => {
    if (!userAnswer.trim()) return;

    const correctAnswer = currentItem.correct || currentItem.answer;
    const correct = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowFeedback(true);

    setTimeout(() => {
      handleNextItem();
    }, 2500);
  };

  const handleNextItem = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowFeedback(false);
    setUserAnswer('');
    setSelectedAnswer(null);

    // Check if there are items in the current exercise (old structure)
    if (currentExercise?.items && currentItemIndex < currentExercise.items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    } else if (currentExerciseIndex < exercises.length - 1) {
      // Move to next exercise
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentItemIndex(0);
    } else {
      // All exercises complete
      onNext();
    }
  };

  const renderExercise = () => {
    if (!currentExercise || !currentItem) {
      return (
        <div className="text-center text-gray-500 py-8">
          <p>No exercises available for this section.</p>
        </div>
      );
    }

    switch (currentExercise.type) {
      case 'flashcard':
      case 'flashcard_review':
        return (
          <div className="text-center">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-12 mb-6">
              <div className="text-lg text-gray-700 mb-4">
                {currentItem.front || currentItem.English || currentItem.english || currentItem.term}
              </div>
              <div className="text-3xl font-bold text-blue-900 mb-3">
                {currentItem.back || currentItem.Albanian || currentItem.albanian || currentItem.translation}
              </div>
              {(currentItem.pronunciation || currentItem.Pronunciation) && (
                <div className="text-blue-700 italic">
                  {currentItem.pronunciation || currentItem.Pronunciation}
                </div>
              )}
              {currentItem.memory_aid && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    <span className="font-semibold">💡 Memory Aid:</span> {currentItem.memory_aid}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleNextItem}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
            >
              Next →
            </button>
          </div>
        );

      case 'multiple_choice':
        return (
          <div>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{currentItem.question}</h3>
              {currentItem.instruction && (
                <p className="text-gray-600 text-sm">{currentItem.instruction}</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
              {currentItem.options.map((option: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => !showFeedback && handleMultipleChoice(option)}
                  disabled={showFeedback}
                  className={`p-4 text-left rounded-lg border-2 transition-all ${
                    showFeedback
                      ? option === (currentItem.correct || currentItem.answer)
                        ? 'border-green-500 bg-green-50 text-green-900'
                        : option === selectedAnswer
                        ? 'border-red-500 bg-red-50 text-red-900'
                        : 'border-gray-200 bg-gray-50 text-gray-400'
                      : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {showFeedback && (
              <div className="text-center mt-6">
                <div className={`text-xl font-bold mb-2 ${isCorrect ? 'text-green-600' : 'text-orange-600'}`}>
                  {isCorrect ? '✓ Correct!' : '→ Keep practicing!'}
                </div>
                {currentItem.feedback && (
                  <p className="text-gray-700 text-sm">
                    {isCorrect ? currentItem.feedback.correct : currentItem.feedback.incorrect}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 'quick_translation':
        return (
          <div>
            <div className="text-center mb-8">
              <h3 className="text-xl font-medium text-gray-700 mb-6">Translate to Albanian:</h3>
              <div className="text-2xl font-medium text-gray-900 mb-6">
                {currentItem.question}
              </div>
            </div>
            <div className="max-w-md mx-auto">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !showFeedback && handleFillBlank()}
                disabled={showFeedback}
                placeholder="Type your answer..."
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
              />
              {!showFeedback && (
                <button
                  onClick={handleFillBlank}
                  disabled={!userAnswer.trim()}
                  className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Check Answer
                </button>
              )}
            </div>
            {showFeedback && (
              <div className="text-center mt-6">
                <div className={`text-xl font-bold mb-2 ${isCorrect ? 'text-green-600' : 'text-orange-600'}`}>
                  {isCorrect ? '🎉 Perfect!' : '📚 Good try!'}
                </div>
                {!isCorrect && (
                  <div className="text-gray-700">
                    Correct answer: <strong>{currentItem.answer || currentItem.correct}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'fill_blank':
        return (
          <div>
            <div className="text-center mb-8">
              <h3 className="text-xl font-medium text-gray-700 mb-6">{currentExercise.instruction}</h3>
              <div className="text-2xl font-medium text-gray-900 mb-6">
                {currentItem.sentence}
              </div>
            </div>
            <div className="max-w-md mx-auto">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !showFeedback && handleFillBlank()}
                disabled={showFeedback}
                placeholder="Type your answer..."
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
              />
              {!showFeedback && (
                <button
                  onClick={handleFillBlank}
                  disabled={!userAnswer.trim()}
                  className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Check Answer
                </button>
              )}
            </div>
            {showFeedback && (
              <div className="text-center mt-6">
                <div className={`text-xl font-bold mb-2 ${isCorrect ? 'text-green-600' : 'text-orange-600'}`}>
                  {isCorrect ? '🎉 Perfect!' : '📚 Good try!'}
                </div>
                {!isCorrect && (
                  <div className="text-gray-700">
                    Correct answer: <strong>{currentItem.answer}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'audio_recognition':
        // Audio recognition - simplified to just show the word since we don't have audio files
        return (
          <div className="text-center">
            <h3 className="text-xl font-medium text-gray-700 mb-6">Pronunciation Recognition</h3>
            <div className="bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl p-8 mb-6 max-w-lg mx-auto">
              <div className="text-4xl mb-6">🗣️</div>
              <div className="text-sm text-gray-600 mb-4">If you heard this word:</div>
              <div className="text-3xl font-bold text-indigo-900 mb-2">
                "{currentItem.audio_text}"
              </div>
              <div className="text-lg text-indigo-700 mb-6">
                (sounds like: "{currentItem.audio_pronunciation}")
              </div>
              <p className="text-sm text-gray-600 italic">
                What does it mean in English?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              {currentItem.options.map((option: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => !showFeedback && handleMultipleChoice(option)}
                  disabled={showFeedback}
                  className={`p-4 text-center rounded-lg border-2 transition-all ${
                    showFeedback
                      ? option === currentItem.correct
                        ? 'border-green-500 bg-green-50 text-green-900 font-bold'
                        : option === selectedAnswer
                        ? 'border-red-500 bg-red-50 text-red-900'
                        : 'border-gray-200 bg-gray-50 text-gray-400'
                      : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {showFeedback && (
              <div className="text-center mt-6">
                <div className={`text-xl font-bold mb-2 ${isCorrect ? 'text-green-600' : 'text-orange-600'}`}>
                  {isCorrect ? '🎉 Perfect!' : '🔊 Listen again!'}
                </div>
                <p className="text-gray-700">
                  {isCorrect ? currentItem.feedback?.correct : currentItem.feedback?.incorrect}
                </p>
              </div>
            )}
          </div>
        );

      case 'grammar_application':
      case 'grammar_rule_application':
        return (
          <div className="text-center">
            <h3 className="text-xl font-medium text-gray-700 mb-6">{currentItem.prompt}</h3>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-6 mb-6 max-w-lg mx-auto">
              <div className="text-sm text-purple-700 font-semibold mb-2">Grammar Rule:</div>
              <div className="text-lg text-purple-900 font-medium mb-4">{currentItem.rule}</div>

              {currentItem.evaluation_criteria && (
                <div className="text-left mt-4 p-4 bg-white rounded-lg">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Your sentence should:</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {currentItem.evaluation_criteria.map((criterion: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-purple-500 mr-2">•</span>
                        <span>{criterion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="max-w-md mx-auto mb-4">
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={showFeedback}
                placeholder="Write your sentence here..."
                rows={3}
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none disabled:bg-gray-100"
              />
            </div>

            <button
              onClick={handleNextItem}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700"
            >
              {userAnswer.trim() ? 'Continue →' : 'Skip →'}
            </button>
          </div>
        );

      case 'scenario_response':
        return (
          <div className="text-center">
            <h3 className="text-xl font-medium text-gray-700 mb-6">{currentItem.instruction}</h3>

            <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-6 mb-6 max-w-lg mx-auto">
              <div className="text-3xl mb-4">🏪</div>
              <div className="text-lg text-gray-800 mb-4 italic">"{currentItem.scenario}"</div>

              {currentItem.cultural_note && (
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <div className="text-sm text-amber-800">
                    <span className="font-semibold">💡 Cultural Note:</span> {currentItem.cultural_note}
                  </div>
                </div>
              )}
            </div>

            {currentItem.correct_responses && (
              <div className="max-w-md mx-auto mb-6">
                <div className="text-sm font-semibold text-gray-700 mb-3">Example responses:</div>
                <div className="space-y-2">
                  {currentItem.correct_responses.map((response: string, idx: number) => (
                    <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800">
                      "{response}"
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleNextItem}
              className="px-8 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700"
            >
              Continue →
            </button>
          </div>
        );

      case 'production':
      case 'guided_conversation':
      case 'real_world_application':
      case 'role_play':
        return (
          <div className="text-center">
            <h3 className="text-xl font-medium text-gray-700 mb-6">{currentExercise.instruction}</h3>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 mb-6 max-w-lg mx-auto">
              <div className="text-lg text-gray-800 mb-4">
                {currentItem.scenario || currentItem.sentence || currentItem.prompt || currentItem.answer}
              </div>
              {currentItem.answer && currentItem.sentence && (
                <div className="text-purple-900 font-semibold mt-4 pt-4 border-t border-purple-200">
                  {currentItem.answer}
                </div>
              )}
            </div>
            <button
              onClick={handleNextItem}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700"
            >
              Next →
            </button>
          </div>
        );

      case 'lesson_assessment':
        // Assessment overview - this is informational, complete the lesson and move to next
        return (
          <div className="text-center">
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8 mb-6 max-w-2xl mx-auto">
              <div className="text-5xl mb-4">🎓</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Lesson Complete!</h3>
              <p className="text-gray-700 mb-6">
                Great work! You've completed all practice exercises for this lesson.
              </p>

              <div className="bg-white rounded-lg p-6 mb-4">
                <h4 className="font-bold text-gray-900 mb-3">What You've Mastered:</h4>
                {currentItem.sections && (
                  <div className="space-y-3">
                    {currentItem.sections.map((section: any, idx: number) => (
                      <div key={idx} className="text-left flex items-start">
                        <span className="text-green-500 mr-2 mt-1">✓</span>
                        <div>
                          <div className="font-semibold text-gray-800">{section.name}</div>
                          <div className="text-sm text-gray-600">
                            {section.exercises?.length || 0} exercise{section.exercises?.length !== 1 ? 's' : ''} completed
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-green-800">
                  <strong>🌟 Ready for the next lesson!</strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onNext}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
            >
              Continue to Next Lesson →
            </button>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <div className="bg-gray-100 rounded-lg p-6 mb-4">
              <div className="font-medium text-gray-800 mb-2">{currentExercise.instruction}</div>
              <div className="text-sm text-gray-600">Exercise type: {currentExercise.type}</div>
              <pre className="mt-4 text-left text-sm overflow-auto">
                {JSON.stringify(currentItem, null, 2)}
              </pre>
            </div>
            <button
              onClick={handleNextItem}
              className="px-8 py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700"
            >
              Next →
            </button>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="inline-block px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-sm font-bold mb-2">
          ✏️ Practice Exercises
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h2>
        {exercises.length > 0 && (
          <p className="text-sm text-gray-600">
            Exercise {currentExerciseIndex + 1} of {exercises.length}
            {currentExercise?.items && currentExercise.items.length > 1 && (
              <> • Item {currentItemIndex + 1} of {currentExercise.items.length}</>
            )}
          </p>
        )}
      </div>

      {/* Exercise Content */}
      {renderExercise()}
    </div>
  );
};

export default ExerciseSection;
