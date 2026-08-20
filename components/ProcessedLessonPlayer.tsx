'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import section components to avoid SSR issues
const OverviewSection = dynamic(() => import('./lesson-sections/OverviewSection'), { ssr: false });
const VocabularySection = dynamic(() => import('./lesson-sections/VocabularySection'), { ssr: false });
const GrammarSection = dynamic(() => import('./lesson-sections/GrammarSection'), { ssr: false });
const PatternSection = dynamic(() => import('./lesson-sections/PatternSection'), { ssr: false });
const ExerciseSection = dynamic(() => import('./lesson-sections/ExerciseSection'), { ssr: false });

interface ProcessedLesson {
  id: string;
  title: string;
  overview?: {
    learning_objectives?: string[];
    prerequisites?: string[];
    estimated_minutes?: number;
    difficulty_level?: number;
    difficulty_justification?: string;
    key_takeaways?: string[];
  };
  sections: LessonSection[];
}

interface LessonSection {
  type: string;
  title: string;
  content: any;
  exercises?: any[];
}

interface ProcessedLessonPlayerProps {
  lesson: ProcessedLesson;
  onComplete: () => void;
  onExit: () => void;
  lessonNumber?: number;
  totalLessons?: number;
}

const ProcessedLessonPlayer: React.FC<ProcessedLessonPlayerProps> = ({
  lesson,
  onComplete,
  onExit,
  lessonNumber = 1,
  totalLessons = 1
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [showOverview, setShowOverview] = useState(true);

  // Reset section index when lesson changes (new lesson loaded)
  React.useEffect(() => {
    setCurrentSectionIndex(0);
    setShowOverview(true);
  }, [lesson.id]);

  // Build full section list: overview + lesson sections
  const allSections = [
    ...(lesson.overview ? [{ type: 'overview', title: lesson.title, content: lesson.overview }] : []),
    ...lesson.sections
  ];

  const currentSection = showOverview && lesson.overview
    ? { type: 'overview', title: lesson.title, content: lesson.overview }
    : allSections[currentSectionIndex];

  const totalSections = allSections.length;

  const handleNext = () => {
    if (showOverview && lesson.overview) {
      setShowOverview(false);
      setCurrentSectionIndex(1); // Start at first real section (after overview)
    } else if (currentSectionIndex < allSections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setShowOverview(false);
    } else {
      // Completed all sections
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      if (currentSectionIndex === 1 && lesson.overview) {
        setShowOverview(true);
        setCurrentSectionIndex(0);
      } else {
        setCurrentSectionIndex(currentSectionIndex - 1);
      }
    }
  };

  const renderSection = () => {
    if (!currentSection) {
      return <div className="text-center text-gray-500">No content available</div>;
    }

    switch (currentSection.type) {
      case 'overview':
        return <OverviewSection overview={currentSection.content} title={lesson.title} />;

      case 'vocabulary':
      case 'vocabulary_intro':
        return (
          <VocabularySection
            section={currentSection}
            onNext={handleNext}
          />
        );

      case 'grammar':
      case 'grammar_focus':
        return (
          <GrammarSection
            section={currentSection}
            onNext={handleNext}
          />
        );

      case 'pattern_summary':
      case 'pattern_recognition':
        return (
          <PatternSection
            section={currentSection}
            onNext={handleNext}
          />
        );

      case 'practice':
      case 'practice_activities':
      case 'exercises':
        return (
          <ExerciseSection
            section={currentSection}
            onNext={handleNext}
          />
        );

      default:
        // Generic section renderer for unknown types
        return (
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentSection.title}</h2>
            <div className="text-gray-700">
              {typeof currentSection.content === 'string' ? (
                <p>{currentSection.content}</p>
              ) : (
                <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(currentSection.content, null, 2)}
                </pre>
              )}
            </div>
          </div>
        );
    }
  };

  const progressPercentage = ((currentSectionIndex + 1) / totalSections) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      {/* Header with progress */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
              <p className="text-sm text-gray-600">
                Lesson {lessonNumber} of {totalLessons} • Section {currentSectionIndex + 1} of {totalSections}
              </p>
            </div>
            <button
              onClick={onExit}
              className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ← Exit
            </button>
          </div>

          {/* Progress bar */}
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Section content */}
      <div className="max-w-4xl mx-auto">
        {renderSection()}
      </div>

      {/* Navigation */}
      <div className="max-w-4xl mx-auto mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentSectionIndex === 0 && !showOverview}
              className="px-6 py-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>

            <div className="text-sm text-gray-600">
              {currentSection?.type === 'overview' ? 'Overview' : `${currentSection?.title || 'Section'}`}
            </div>

            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-lg font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              {currentSectionIndex === allSections.length - 1 ? 'Complete Lesson →' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessedLessonPlayer;
