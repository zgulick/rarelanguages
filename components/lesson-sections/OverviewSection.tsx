'use client';

import React from 'react';

interface OverviewSectionProps {
  overview: {
    learning_objectives?: string[];
    prerequisites?: string[];
    estimated_minutes?: number;
    difficulty_level?: number;
    difficulty_justification?: string;
    key_takeaways?: string[];
  };
  title: string;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({ overview, title }) => {
  const getDifficultyColor = (level: number) => {
    if (level <= 1) return 'bg-green-100 text-green-800 border-green-300';
    if (level <= 2) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (level <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (level <= 4) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getDifficultyLabel = (level: number) => {
    if (level <= 1) return 'Beginner';
    if (level <= 2) return 'Elementary';
    if (level <= 3) return 'Intermediate';
    if (level <= 4) return 'Upper-Intermediate';
    return 'Advanced';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-sm font-bold mb-4">
          📚 Lesson Overview
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{overview.estimated_minutes || 15}m</div>
          <div className="text-sm text-blue-700 font-medium">Estimated Time</div>
        </div>
        <div className={`border rounded-lg p-4 text-center ${getDifficultyColor(overview.difficulty_level || 1)}`}>
          <div className="text-3xl font-bold">{getDifficultyLabel(overview.difficulty_level || 1)}</div>
          <div className="text-sm font-medium">Difficulty Level</div>
        </div>
      </div>

      {/* Learning Objectives */}
      {overview.learning_objectives && overview.learning_objectives.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">🎯</span>
            Learning Objectives
          </h3>
          <ul className="space-y-2">
            {overview.learning_objectives.map((objective, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span className="text-gray-700">{objective}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Prerequisites */}
      {overview.prerequisites && overview.prerequisites.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">📋</span>
            Prerequisites
          </h3>
          <ul className="space-y-2">
            {overview.prerequisites.map((prereq, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span className="text-gray-600 text-sm">{prereq}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Takeaways - Only show if they exist */}
      {overview.key_takeaways && overview.key_takeaways.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <span className="text-2xl mr-2">💡</span>
            Key Takeaways
          </h3>
          <ul className="space-y-2">
            {overview.key_takeaways.map((takeaway, index) => (
              <li key={index} className="flex items-start">
                <span className="text-amber-600 mr-2 font-bold">{index + 1}.</span>
                <span className="text-gray-700">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Difficulty Justification */}
      {overview.difficulty_justification && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 italic">
            <strong>About the difficulty:</strong> {overview.difficulty_justification}
          </p>
        </div>
      )}
    </div>
  );
};

export default OverviewSection;
