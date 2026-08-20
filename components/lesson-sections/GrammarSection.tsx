'use client';

import React from 'react';

interface GrammarSectionProps {
  section: {
    title: string;
    content: any;
    exercises?: any[];
  };
  onNext: () => void;
}

const GrammarSection: React.FC<GrammarSectionProps> = ({ section, onNext }) => {
  // Handle different content structures
  // If content has an 'explanation' object, use that, otherwise use content directly
  const grammarContent = section.content?.explanation || section.content;
  const grammarFocus = section.content?.focus;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="inline-block px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-bold mb-2">
          📖 Grammar Focus
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
        {grammarFocus && (
          <p className="text-gray-600 mt-2 italic">{grammarFocus}</p>
        )}
      </div>

      {/* String content */}
      {typeof grammarContent === 'string' && (
        <div className="prose max-w-none mb-8">
          <p className="text-gray-700 text-lg leading-relaxed">{grammarContent}</p>
        </div>
      )}

      {/* Rich grammar structure */}
      {typeof grammarContent === 'object' && grammarContent !== null && (
        <div className="space-y-6">
          {/* Simple Explanation */}
          {grammarContent.simple_explanation && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-3 text-lg">The Rule</h3>
              <p className="text-blue-800 leading-relaxed">{grammarContent.simple_explanation}</p>
            </div>
          )}

          {/* Detailed Explanation */}
          {grammarContent.detailed_explanation && grammarContent.detailed_explanation !== grammarContent.simple_explanation && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-bold text-purple-900 mb-3">Detailed Explanation</h3>
              <p className="text-purple-800 leading-relaxed whitespace-pre-line">{grammarContent.detailed_explanation}</p>
            </div>
          )}

          {/* Focus/Explanation from grammar engine */}
          {grammarContent.focus && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-bold text-green-900 mb-3">Grammar Focus</h3>
              <p className="text-green-800">{grammarContent.focus}</p>
              {grammarContent.explanation && (
                <p className="text-green-700 mt-2">{grammarContent.explanation}</p>
              )}
            </div>
          )}

          {/* Conjugations */}
          {grammarContent.conjugations && Array.isArray(grammarContent.conjugations) && grammarContent.conjugations.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
              <h3 className="font-bold text-emerald-900 mb-4 text-lg">Conjugation Tables</h3>
              {grammarContent.conjugations.map((conj: any, idx: number) => (
                <div key={idx} className="mb-6 last:mb-0">
                  <div className="font-semibold text-emerald-800 mb-2">
                    {conj.verb} ({conj.tense || 'Present'})
                    {conj.type && <span className="text-sm ml-2 text-emerald-600">• {conj.type}</span>}
                  </div>
                  {conj.conjugations && Array.isArray(conj.conjugations) && (
                    <div className="grid grid-cols-2 gap-2 bg-white rounded p-4">
                      {conj.conjugations.map((form: any, formIdx: number) => (
                        <div key={formIdx} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                          <span className="text-gray-600 text-sm">{form.person}:</span>
                          <span className="font-medium text-gray-900">{form.albanian}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {conj.pattern_notes && (
                    <div className="mt-2 text-sm text-emerald-700 italic">
                      Pattern: {conj.pattern_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Comparison with English */}
          {grammarContent.comparison_with_english && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start">
                <span className="text-2xl mr-3">🔄</span>
                <div>
                  <h3 className="font-bold text-yellow-900 mb-2">Comparison with English</h3>
                  <p className="text-yellow-800">{grammarContent.comparison_with_english}</p>
                </div>
              </div>
            </div>
          )}

          {/* Common Mistakes */}
          {grammarContent.common_mistakes && Array.isArray(grammarContent.common_mistakes) && grammarContent.common_mistakes.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-bold text-red-900 mb-4 flex items-center">
                <span className="mr-2">⚠️</span>
                Common Mistakes
              </h3>
              <div className="space-y-3">
                {grammarContent.common_mistakes.map((mistake: any, idx: number) => (
                  <div key={idx} className="bg-white rounded p-3">
                    <div className="flex items-start mb-1">
                      <span className="text-red-600 mr-2">❌</span>
                      <span className="text-red-700 line-through">{mistake.wrong}</span>
                    </div>
                    <div className="flex items-start mb-1">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-green-700 font-medium">{mistake.right}</span>
                    </div>
                    {mistake.explanation && (
                      <p className="text-gray-600 text-sm ml-6 mt-1">{mistake.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practice Sentences */}
          {grammarContent.practice_sentences && Array.isArray(grammarContent.practice_sentences) && grammarContent.practice_sentences.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h3 className="font-bold text-indigo-900 mb-4">Practice Examples</h3>
              <div className="space-y-3">
                {grammarContent.practice_sentences.map((sentence: any, idx: number) => (
                  <div key={idx} className="bg-white rounded p-4">
                    <div className="font-medium text-indigo-900 mb-1">{sentence.albanian}</div>
                    <div className="text-indigo-600 mb-1">{sentence.english}</div>
                    {sentence.grammar_highlight && (
                      <div className="text-xs text-indigo-500 italic">
                        → {sentence.grammar_highlight}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exercises */}
      {section.exercises && section.exercises.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Practice Exercises</h3>
          <div className="space-y-4">
            {section.exercises.map((exercise: any, idx: number) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="font-semibold text-gray-800 mb-2">{exercise.instruction}</div>
                <div className="text-sm text-gray-600">
                  Type: {exercise.type} • {exercise.items?.length || 0} items
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        className="mt-8 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-bold hover:from-purple-600 hover:to-indigo-700 transition-all"
      >
        Continue →
      </button>
    </div>
  );
};

export default GrammarSection;
