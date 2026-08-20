'use client';

import React from 'react';

interface PatternSectionProps {
  section: {
    title: string;
    content: any;
    exercises?: any[];
  };
  onNext: () => void;
}

const PatternSection: React.FC<PatternSectionProps> = ({ section, onNext }) => {
  const patterns = Array.isArray(section.content) ? section.content : section.content?.patterns || [];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="inline-block px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 rounded-full text-sm font-bold mb-2">
          🎯 Pattern Recognition
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
      </div>

      {/* Patterns */}
      {patterns.length > 0 ? (
        <div className="space-y-6">
          {patterns.map((pattern: any, idx: number) => (
            <div key={idx} className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6">
              {/* Pattern Name */}
              <div className="flex items-start mb-4">
                <span className="text-3xl mr-3">🔍</span>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-orange-900 mb-2">
                    {pattern.pattern_name || `Pattern ${idx + 1}`}
                  </h3>
                  {pattern.explanation && (
                    <p className="text-orange-800 leading-relaxed">{pattern.explanation}</p>
                  )}
                </div>
              </div>

              {/* Visual Representation */}
              {pattern.visual && (
                <div className="bg-white border border-orange-200 rounded-lg p-4 mb-4">
                  <div className="font-semibold text-orange-900 mb-2 text-sm">Visual Pattern:</div>
                  <div className="text-gray-800 font-mono text-sm">{pattern.visual}</div>
                </div>
              )}

              {/* Examples */}
              {pattern.examples && Array.isArray(pattern.examples) && pattern.examples.length > 0 && (
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="font-semibold text-orange-900 mb-2 text-sm">Examples:</div>
                  <div className="space-y-1">
                    {pattern.examples.map((example: string, exIdx: number) => (
                      <div key={exIdx} className="flex items-start">
                        <span className="text-orange-500 mr-2">•</span>
                        <span className="text-gray-700">{example}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practice Tip */}
              {pattern.practice_tip && (
                <div className="bg-amber-100 border border-amber-300 rounded-lg p-4">
                  <div className="flex items-start">
                    <span className="text-xl mr-2">💡</span>
                    <div>
                      <div className="font-semibold text-amber-900 mb-1 text-sm">Practice Tip:</div>
                      <p className="text-amber-800 text-sm">{pattern.practice_tip}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <p>No pattern information available for this section.</p>
        </div>
      )}

      {/* Pattern Exercises */}
      {section.content?.pattern_exercises && Array.isArray(section.content.pattern_exercises) && section.content.pattern_exercises.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Pattern Practice</h3>
          <div className="space-y-4">
            {section.content.pattern_exercises.map((exercise: any, idx: number) => (
              <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="font-semibold text-orange-900 mb-2">{exercise.instruction}</div>
                <div className="text-sm text-orange-700">Type: {exercise.type}</div>
                {exercise.examples && exercise.examples.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {exercise.examples.slice(0, 3).map((ex: string, exIdx: number) => (
                      <div key={exIdx} className="text-sm text-gray-700">• {ex}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        className="mt-8 w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-bold hover:from-orange-600 hover:to-amber-700 transition-all"
      >
        Continue →
      </button>
    </div>
  );
};

export default PatternSection;
