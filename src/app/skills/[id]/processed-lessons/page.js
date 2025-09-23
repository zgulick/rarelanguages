'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function ProcessedLessonsPage() {
  const params = useParams();
  const skillId = params.id;

  const [skillData, setSkillData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

  useEffect(() => {
    loadProcessedLessons();
  }, [skillId]);

  const loadProcessedLessons = async () => {
    try {
      const response = await fetch(`/api/skills/${skillId}/processed-lessons`);
      const data = await response.json();

      if (response.ok) {
        setSkillData(data.skill);
        setLessons(data.lessons);
        setSelectedLesson(data.lessons[0]); // Auto-select first lesson
      } else {
        setError(data.error || 'Failed to load processed lessons');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading processed lessons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Lessons Not Available</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <a
              href="/lesson-generation"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Generate Lessons
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">{skillData?.name}</h1>
            <p className="mt-2 text-gray-600">{skillData?.description}</p>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <span>Course: {skillData?.courseName}</span>
              <span>Level: {skillData?.courseLevel}</span>
              <span>{lessons.length} Lessons</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lesson List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Lessons</h3>
              </div>
              <div className="p-2">
                {lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full text-left p-3 rounded-md mb-2 transition-colors ${
                      selectedLesson?.id === lesson.id
                        ? 'bg-blue-50 border border-blue-200 text-blue-800'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{lesson.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {lesson.overview?.estimated_minutes || 0} min •
                      Level {lesson.overview?.difficulty_level || 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lesson Content */}
          <div className="lg:col-span-3">
            {selectedLesson ? (
              <LessonViewer lesson={selectedLesson} />
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
                Select a lesson to view its content
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LessonViewer({ lesson }) {
  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Lesson Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">{lesson.title}</h2>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Difficulty:</span>
            <span className="ml-2">{lesson.overview?.difficulty_level || 1}/5</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Duration:</span>
            <span className="ml-2">{lesson.overview?.estimated_minutes || 0} minutes</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Content Items:</span>
            <span className="ml-2">{lesson.sourceContentCount}</span>
          </div>
        </div>

        {lesson.overview?.learning_objectives && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">Learning Objectives:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {lesson.overview.learning_objectives.map((objective, idx) => (
                <li key={idx}>{objective}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Lesson Sections */}
      <div className="p-6">
        {lesson.sections?.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-8 last:mb-0">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {section.title || `Section ${sectionIdx + 1}`}
            </h3>

            {section.content && (
              <div className="prose max-w-none mb-4">
                <p className="text-gray-700">{section.content}</p>
              </div>
            )}

            {/* Section Exercises */}
            {section.exercises && section.exercises.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Exercises:</h4>
                {section.exercises.map((exercise, exerciseIdx) => (
                  <div key={exerciseIdx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 uppercase">
                        {exercise.type?.replace('_', ' ') || 'Exercise'}
                      </span>
                    </div>

                    {exercise.instruction && (
                      <p className="text-gray-700 mb-3">{exercise.instruction}</p>
                    )}

                    {exercise.items && (
                      <div className="space-y-2">
                        {exercise.items.slice(0, 3).map((item, itemIdx) => (
                          <div key={itemIdx} className="text-sm text-gray-600 bg-white p-2 rounded">
                            {typeof item === 'string' ? item : JSON.stringify(item)}
                          </div>
                        ))}
                        {exercise.items.length > 3 && (
                          <div className="text-sm text-gray-500">
                            ... and {exercise.items.length - 3} more items
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Assessment Section */}
        {lesson.assessment && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Assessment</h3>

            {lesson.assessment.formative && lesson.assessment.formative.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">Formative Assessment:</h4>
                <div className="text-gray-600 text-sm">
                  {lesson.assessment.formative.length} quick check exercises
                </div>
              </div>
            )}

            {lesson.assessment.summative && lesson.assessment.summative.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Summative Assessment:</h4>
                <div className="text-gray-600 text-sm">
                  {lesson.assessment.summative.length} completion exercises
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}