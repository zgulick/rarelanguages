'use client';

import { useState } from 'react';

interface GrammarExample {
  albanian: string;
  english: string;
  explanation?: string;
}

interface GrammarExercise {
  exercise_id: string;
  exercise_type: string;
  question_data: any;
  correct_answer: any;
  explanation: string;
  difficulty_level: number;
  hints?: string[];
  common_mistakes?: any[];
  estimated_time_seconds: number;
}

interface GrammarRule {
  rule_id: string;
  rule_name: string;
  category: string;
  subcategory?: string;
  explanation: string;
  simple_explanation?: string;
  examples: GrammarExample[];
  difficulty_level: number;
  cefr_level?: string;
  usage_frequency: number;
  is_exception: boolean;
  parent_rule?: {
    id: string;
    name: string;
    explanation: string;
  };
  prerequisites: any[];
  exercises: GrammarExercise[];
  related_patterns: any[];
}

interface GrammarExplanationCardProps {
  rule: GrammarRule;
  showExercises?: boolean;
  showExamples?: boolean;
  className?: string;
}

export default function GrammarExplanationCard({
  rule,
  showExercises = true,
  showExamples = true,
  className = ''
}: GrammarExplanationCardProps) {
  const [showDetailedExplanation, setShowDetailedExplanation] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);

  // Get difficulty indicator
  const getDifficultyColor = (level: number) => {
    if (level <= 2) return 'bg-success-100 text-success-800';
    if (level <= 3) return 'bg-secondary-100 text-secondary-800';
    return 'bg-error-100 text-error-800';
  };

  const getDifficultyLabel = (level: number) => {
    const labels = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];
    return labels[level] || 'Unknown';
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const icons = {
      'noun_declension': '📚',
      'verb_conjugation': '🔄',
      'adjective_agreement': '🎯',
      'syntax': '🔗',
      'phonology': '🗣️',
      'articles': '📖',
      'pronouns': '👥',
      'prepositions': '➡️'
    };
    return icons[category] || '📝';
  };

  const handleExerciseSubmit = (exerciseIndex: number) => {
    setShowAnswer(true);
  };

  const resetExercise = () => {
    setUserAnswer('');
    setShowAnswer(false);
  };

  return (
    <div className={`bg-neutral-surface rounded-2xl shadow-xl border border-gray-200 p-8 max-w-4xl mx-auto ${className}`} style={{backgroundColor: '#ffffff'}}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getCategoryIcon(rule.category)}</span>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">{rule.rule_name}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-text-secondary capitalize">
                  {rule.category.replace('_', ' ')}
                  {rule.subcategory && ` • ${rule.subcategory.replace('_', ' ')}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {rule.cefr_level && (
              <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-sm font-medium">
                {rule.cefr_level}
              </span>
            )}
            <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(rule.difficulty_level)}`}>
              {getDifficultyLabel(rule.difficulty_level)}
            </span>
            {rule.is_exception && (
              <span className="bg-secondary-100 text-secondary-800 px-2 py-1 rounded text-sm font-medium">
                Exception
              </span>
            )}
          </div>
        </div>

        {/* Explanation */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
          <div className="space-y-3">
            {/* Simple explanation (always visible) */}
            {rule.simple_explanation && (
              <div>
                <h3 className="font-semibold text-primary-800 mb-2">Quick Overview</h3>
                <p className="text-primary-700">{rule.simple_explanation}</p>
              </div>
            )}

            {/* Detailed explanation (toggleable) */}
            {rule.explanation && rule.explanation !== rule.simple_explanation && (
              <div>
                <button
                  onClick={() => setShowDetailedExplanation(!showDetailedExplanation)}
                  className="flex items-center space-x-2 text-primary-800 font-medium hover:text-blue-900 transition-colors"
                >
                  <span>Detailed Explanation</span>
                  <span className="transform transition-transform">
                    {showDetailedExplanation ? '▼' : '▶'}
                  </span>
                </button>

                {showDetailedExplanation && (
                  <div className="mt-3 p-4 bg-blue-100 rounded-lg">
                    <p className="text-primary-800">{rule.explanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Parent rule (if this is an exception) */}
        {rule.parent_rule && (
          <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <span className="text-secondary-600 text-lg">⚠️</span>
              <div>
                <div className="font-medium text-secondary-800 text-sm">Exception to:</div>
                <div className="text-secondary-700 font-semibold">{rule.parent_rule.name}</div>
                {rule.parent_rule.explanation && (
                  <div className="text-secondary-600 text-sm mt-1">{rule.parent_rule.explanation}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prerequisites */}
        {rule.prerequisites.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="font-medium text-purple-800 text-sm mb-2">Prerequisites</div>
            <div className="text-purple-700 text-sm">
              Make sure you understand: {rule.prerequisites.map(p => p.rule_name).join(', ')}
            </div>
          </div>
        )}

        {/* Examples */}
        {showExamples && rule.examples && rule.examples.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Examples</h3>
            <div className="space-y-4">
              {rule.examples.slice(0, 3).map((example, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-gray-100">
                  <div className="text-lg font-medium text-gray-900 mb-1">
                    {example.albanian}
                  </div>
                  <div className="text-gray-600 mb-2">
                    {example.english}
                  </div>
                  {example.explanation && (
                    <div className="text-sm text-gray-500 italic">
                      {example.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exercises */}
        {showExercises && rule.exercises && rule.exercises.length > 0 && (
          <div className="bg-success-50 border border-success-200 rounded-lg p-6">
            <h3 className="font-semibold text-success-800 mb-4">Practice Exercises</h3>

            {selectedExerciseIndex === null ? (
              <div className="space-y-3">
                <div className="text-success-700 mb-3">
                  Choose an exercise to practice this grammar rule:
                </div>
                {rule.exercises.slice(0, 2).map((exercise, index) => (
                  <button
                    key={exercise.exercise_id}
                    onClick={() => {
                      setSelectedExerciseIndex(index);
                      resetExercise();
                    }}
                    className="w-full text-left bg-white rounded-lg p-4 border border-success-200 hover:border-success-300 hover:bg-success-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-success-800 capitalize">
                          {exercise.exercise_type.replace('_', ' ')} Exercise
                        </div>
                        <div className="text-sm text-green-600">
                          Difficulty: {getDifficultyLabel(exercise.difficulty_level)} •
                          ~{exercise.estimated_time_seconds}s
                        </div>
                      </div>
                      <span className="text-green-600">→</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-success-800">
                    Exercise {selectedExerciseIndex + 1}
                  </h4>
                  <button
                    onClick={() => setSelectedExerciseIndex(null)}
                    className="text-green-600 hover:text-success-800 text-sm"
                  >
                    ← Back to exercises
                  </button>
                </div>

                {/* Exercise content would be rendered here based on exercise type */}
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="text-gray-700 mb-3">
                    Exercise content will be rendered based on the exercise type and question data.
                  </div>
                  <div className="text-sm text-gray-500">
                    Exercise type: {rule.exercises[selectedExerciseIndex].exercise_type}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Usage frequency and patterns */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-indigo-800 text-sm">Usage Frequency</div>
              <div className="flex items-center space-x-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${
                      i < rule.usage_frequency / 2 ? 'text-indigo-600' : 'text-indigo-200'
                    }`}
                  >
                    ★
                  </span>
                ))}
                <span className="text-indigo-700 text-sm ml-2">
                  {rule.usage_frequency >= 8 ? 'Very Common' :
                   rule.usage_frequency >= 6 ? 'Common' :
                   rule.usage_frequency >= 4 ? 'Moderate' : 'Less Common'}
                </span>
              </div>
            </div>

            {rule.related_patterns.length > 0 && (
              <div className="text-right">
                <div className="font-medium text-indigo-800 text-sm">Related Patterns</div>
                <div className="text-indigo-700 text-sm">
                  {rule.related_patterns.length} pattern{rule.related_patterns.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}