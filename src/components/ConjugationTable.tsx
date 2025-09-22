'use client';

import { useState } from 'react';

interface ConjugationForm {
  form: string;
  pronunciation?: string;
  usage_notes?: string;
  is_irregular?: boolean;
  frequency_rank?: number;
}

interface ConjugationsByTense {
  [tense: string]: {
    [personNumber: string]: ConjugationForm;
  };
}

interface ConjugationTableProps {
  verbId: string;
  targetPhrase: string;
  englishPhrase: string;
  conjugationsByTense: ConjugationsByTense;
  availableTenses: string[];
  className?: string;
}

export default function ConjugationTable({
  verbId,
  targetPhrase,
  englishPhrase,
  conjugationsByTense,
  availableTenses,
  className = ''
}: ConjugationTableProps) {
  const [selectedTense, setSelectedTense] = useState<string>(
    availableTenses.includes('present') ? 'present' : availableTenses[0]
  );

  // Person/number combinations in order for display
  const personNumberOrder = [
    'first_singular',
    'second_singular',
    'third_singular',
    'first_plural',
    'second_plural',
    'third_plural'
  ];

  // Display labels for person/number combinations
  const personNumberLabels = {
    'first_singular': 'I',
    'second_singular': 'you (singular)',
    'third_singular': 'he/she/it',
    'first_plural': 'we',
    'second_plural': 'you (plural)',
    'third_plural': 'they'
  };

  // Display labels for tenses
  const tenseLabels = {
    'present': 'Present',
    'past': 'Past',
    'future': 'Future',
    'perfect': 'Perfect',
    'conditional': 'Conditional',
    'subjunctive': 'Subjunctive',
    'imperative': 'Imperative'
  };

  if (!availableTenses.length || !conjugationsByTense[selectedTense]) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="text-green-800 text-center">
          <div className="font-medium mb-2">Conjugation Table</div>
          <div className="text-sm text-green-700">
            No conjugation data available for this verb yet.
          </div>
        </div>
      </div>
    );
  }

  const currentConjugations = conjugationsByTense[selectedTense];

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="font-bold text-green-800 mb-2">Verb Conjugation</h3>
        <div className="text-sm text-green-700 mb-3">
          <span className="font-medium">{targetPhrase}</span> ({englishPhrase})
        </div>

        {/* Tense selector */}
        {availableTenses.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {availableTenses.map(tense => (
              <button
                key={tense}
                onClick={() => setSelectedTense(tense)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTense === tense
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {tenseLabels[tense] || tense}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conjugation table */}
      <div className="space-y-2">
        <div className="font-semibold text-green-700 mb-3">
          {tenseLabels[selectedTense] || selectedTense} Tense
        </div>

        <div className="grid gap-2">
          {personNumberOrder.map(personNumber => {
            const conjugation = currentConjugations[personNumber];

            if (!conjugation) return null;

            return (
              <div
                key={personNumber}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-100"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 font-medium min-w-[120px]">
                      {personNumberLabels[personNumber]}:
                    </span>
                    <span className="font-semibold text-green-800 text-lg">
                      {conjugation.form}
                    </span>
                    {conjugation.is_irregular && (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                        irregular
                      </span>
                    )}
                  </div>

                  {/* Pronunciation guide */}
                  {conjugation.pronunciation && (
                    <div className="mt-1 text-sm text-green-600 ml-[123px]">
                      [{conjugation.pronunciation}]
                    </div>
                  )}

                  {/* Usage notes */}
                  {conjugation.usage_notes && (
                    <div className="mt-1 text-xs text-green-600 ml-[123px] italic">
                      {conjugation.usage_notes}
                    </div>
                  )}
                </div>

                {/* Frequency indicator */}
                {conjugation.frequency_rank && (
                  <div className="flex items-center gap-1 ml-2">
                    <div className="text-xs text-green-600">
                      {conjugation.frequency_rank >= 8 ? '★★★' :
                       conjugation.frequency_rank >= 6 ? '★★☆' :
                       conjugation.frequency_rank >= 4 ? '★☆☆' : '☆☆☆'}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Show available forms count */}
        <div className="mt-3 text-xs text-green-600 text-center">
          Showing {Object.keys(currentConjugations).length} conjugated forms
          {availableTenses.length > 1 && ` • ${availableTenses.length} tenses available`}
        </div>
      </div>
    </div>
  );
}