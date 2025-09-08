'use client';

import { useState, useEffect } from 'react';

interface Lesson {
  id: number;
  english_phrase: string;
  target_phrase: string;
  cultural_context?: string;
}

export default function LearnPage() {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [lessonCount, setLessonCount] = useState(0);

  useEffect(() => {
    loadNextLesson();
  }, []);

  const loadNextLesson = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/lessons/next');
      
      if (response.ok) {
        const lesson = await response.json();
        setCurrentLesson(lesson);
        setShowAnswer(false);
        setLessonCount(prev => prev + 1);
      } else {
        console.error('Failed to load lesson');
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleNext = () => {
    loadNextLesson();
  };

  const handleKnowIt = async () => {
    // Update progress as correct
    if (currentLesson) {
      await updateProgress(currentLesson.id, true);
    }
    loadNextLesson();
  };

  const handleNeedPractice = async () => {
    // Update progress as needs practice
    if (currentLesson) {
      await updateProgress(currentLesson.id, false);
    }
    loadNextLesson();
  };

  const updateProgress = async (lessonId: number, correct: boolean) => {
    try {
      await fetch('/api/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          correct: correct,
          response_time: 5000 // placeholder
        }),
      });
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your Albanian lesson...</p>
        </div>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No lessons available
          </h2>
          <p className="text-gray-600 mb-6">
            It looks like the Albanian content is still being generated. Please check back in a few minutes!
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => window.location.href = '/'}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back
            </button>
            <div className="text-sm text-gray-600">
              Lesson #{lessonCount}
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            🇦🇱 Albanian Learning
          </h1>
        </div>

        {/* Lesson Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 mb-2">Translate to Albanian:</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              &ldquo;{currentLesson.english_phrase}&rdquo;
            </h2>

            {!showAnswer ? (
              <button
                onClick={handleShowAnswer}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Show Albanian Translation
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <p className="text-sm text-green-700 mb-2">Albanian (Gheg):</p>
                  <p className="text-2xl font-bold text-green-800">
                    &ldquo;{currentLesson.target_phrase}&rdquo;
                  </p>
                </div>

                {currentLesson.cultural_context && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700 mb-1">Cultural Context:</p>
                    <p className="text-blue-800">{currentLesson.cultural_context}</p>
                  </div>
                )}

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={handleKnowIt}
                    className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-200"
                  >
                    ✓ I knew it!
                  </button>
                  <button
                    onClick={handleNeedPractice}
                    className="flex-1 px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition duration-200"
                  >
                    ⭮ Need practice
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Learning Gheg Albanian • Family conversations
          </p>
        </div>
      </div>
    </div>
  );
}