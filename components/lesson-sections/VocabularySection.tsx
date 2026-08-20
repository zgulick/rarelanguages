'use client';

import React, { useState } from 'react';

interface VocabWord {
  // Rich structure from LessonGeneratorV2
  english?: string;
  target?: string;
  pronunciation?: {
    ipa?: string;
    sounds_like?: string;
    syllables?: string;
    stress?: string;
  };
  memory_aid?: string;
  usage_notes?: string;
  example_sentence?: {
    target: string;
    english: string;
    literal?: string;
  };
  related_words?: string[];
}

interface VocabularySectionProps {
  section: {
    title: string;
    content: any;
    exercises?: any[];
  };
  onNext: () => void;
}

const VocabularySection: React.FC<VocabularySectionProps> = ({ section, onNext }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showExercises, setShowExercises] = useState(false);

  // Extract vocabulary from different possible structures
  const vocabularyWords: VocabWord[] = (() => {
    // NEW Rich structure: section.content is an array of vocab objects
    if (Array.isArray(section.content)) {
      return section.content.map((item: any) => ({
        english: item.english_phrase || item.english,
        target: item.target_phrase || item.target,
        pronunciation: item.pronunciation || { sounds_like: item.pronunciation_guide },
        memory_aid: item.memory_aid,
        usage_notes: item.usage_notes,
        example_sentence: item.example_sentence,
        related_words: item.related_words
      }));
    }
    // Rich structure: section.content.words (from LessonGeneratorV2 - alternative format)
    if (section.content?.words && Array.isArray(section.content.words)) {
      return section.content.words;
    }
    // Simple structure: string content with exercises containing vocabulary
    if (typeof section.content === 'string' && section.exercises) {
      const flashcardExercise = section.exercises.find((ex: any) => ex.type === 'flashcard');
      if (flashcardExercise?.items) {
        return flashcardExercise.items.map((item: any) => ({
          // Handle both capitalized (old) and lowercase (new) keys
          english: item.English || item.english || item.term,
          target: item.Albanian || item.albanian || item.translation,
          pronunciation: {
            sounds_like: item.Pronunciation || item.pronunciation
          }
        }));
      }
    }
    return [];
  })();

  const currentWord = vocabularyWords[currentWordIndex];
  const hasMoreWords = currentWordIndex < vocabularyWords.length - 1;

  const handleNextWord = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (hasMoreWords) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else if (section.exercises && section.exercises.length > 0) {
      setShowExercises(true);
    } else {
      onNext();
    }
  };

  const handlePreviousWord = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  };

  if (!currentWord && !showExercises) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
        {typeof section.content === 'string' ? (
          <p className="text-gray-700">{section.content}</p>
        ) : (
          <p className="text-gray-500">No vocabulary content available</p>
        )}
      </div>
    );
  }

  if (showExercises) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Practice Exercises</h3>
        <div className="space-y-6">
          {section.exercises?.map((exercise: any, idx: number) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="font-semibold text-gray-800 mb-2">{exercise.instruction}</div>
              <div className="text-sm text-gray-600">Exercise type: {exercise.type}</div>
            </div>
          ))}
        </div>
        <button
          onClick={onNext}
          className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
        >
          Continue to Next Section →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-6">
        <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-bold mb-2">
          📚 Vocabulary • Word {currentWordIndex + 1} of {vocabularyWords.length}
        </div>
        <h2 className="text-xl font-bold text-gray-700">{section.title}</h2>
      </div>

      {/* Main Word Display */}
      <div className="text-center mb-8">
        <div className="mb-6">
          <div className="text-5xl font-bold text-blue-600 mb-3">
            {currentWord.target}
          </div>
          <div className="text-2xl text-gray-800 mb-2">
            {currentWord.english}
          </div>
        </div>

        {/* Pronunciation */}
        {currentWord.pronunciation && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <span className="text-lg font-bold text-emerald-800">Pronunciation</span>
            </div>
            <div className="space-y-2">
              {currentWord.pronunciation.sounds_like && (
                <div className="text-2xl font-bold text-emerald-700">
                  {currentWord.pronunciation.sounds_like}
                </div>
              )}
              {currentWord.pronunciation.ipa && currentWord.pronunciation.ipa !== currentWord.pronunciation.sounds_like && (
                <div className="text-gray-600 text-sm">
                  IPA: {currentWord.pronunciation.ipa}
                </div>
              )}
              {currentWord.pronunciation.syllables && (
                <div className="text-emerald-600 text-sm">
                  Syllables: {currentWord.pronunciation.syllables}
                </div>
              )}
              {currentWord.pronunciation.stress && (
                <div className="text-emerald-600 text-sm">
                  Stress: {currentWord.pronunciation.stress}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Memory Aid */}
      {currentWord.memory_aid && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">💡</span>
            <div>
              <div className="font-bold text-amber-800 mb-1">Memory Aid</div>
              <p className="text-amber-700">{currentWord.memory_aid}</p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Notes */}
      {currentWord.usage_notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">📝</span>
            <div>
              <div className="font-bold text-blue-800 mb-1">Usage Notes</div>
              <p className="text-blue-700">{currentWord.usage_notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Example Sentence */}
      {currentWord.example_sentence && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <span className="text-2xl mr-3">💬</span>
            <div className="flex-1">
              <div className="font-bold text-green-800 mb-2">Example</div>
              <div className="text-lg font-semibold text-green-700 mb-1">
                {currentWord.example_sentence.target}
              </div>
              <div className="text-green-600">
                {currentWord.example_sentence.english}
              </div>
              {currentWord.example_sentence.literal && currentWord.example_sentence.literal !== currentWord.example_sentence.english && (
                <div className="text-green-500 text-sm italic mt-1">
                  Literal: {currentWord.example_sentence.literal}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Related Words */}
      {currentWord.related_words && currentWord.related_words.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="font-bold text-purple-800 mb-2">Related Words</div>
          <div className="flex flex-wrap gap-2">
            {currentWord.related_words.map((word, idx) => (
              <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handlePreviousWord}
          disabled={currentWordIndex === 0}
          className="px-6 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous Word
        </button>
        <button
          onClick={handleNextWord}
          className="px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        >
          {hasMoreWords ? 'Next Word →' : section.exercises?.length ? 'Practice →' : 'Continue →'}
        </button>
      </div>
    </div>
  );
};

export default VocabularySection;
