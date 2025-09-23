'use client';

import { useState, useEffect } from 'react';
import ConjugationTable from '../../components/ConjugationTable';
import GrammarExplanationCard from '../../components/GrammarExplanationCard';

interface VerbData {
  verb_id: string;
  english_phrase: string;
  target_phrase: string;
  pronunciation_guide?: string;
  conjugations: {
    by_tense: any;
    available_tenses: string[];
    total_forms: number;
  };
}

interface LessonData {
  lesson_id: string;
  verbs: VerbData[];
  summary: any;
}

export default function TestConjugationsPage() {
  const [lessonData, setLessonData] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [lessons, setLessons] = useState<any[]>([]);

  // Load available lessons
  useEffect(() => {
    const loadLessons = async () => {
      try {
        const response = await fetch('/api/skills');
        if (response.ok) {
          const skills = await response.json();
          const allLessons = skills.flatMap((skill: any) =>
            skill.lessons?.map((lesson: any) => ({
              ...lesson,
              skill_name: skill.name
            })) || []
          );
          setLessons(allLessons);
          if (allLessons.length > 0) {
            setSelectedLessonId(allLessons[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading lessons:', err);
      }
    };

    loadLessons();
  }, []);

  // Load conjugation data when lesson changes
  useEffect(() => {
    if (!selectedLessonId) return;

    const loadConjugationData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/lessons/${selectedLessonId}/conjugations`);

        if (!response.ok) {
          throw new Error(`Failed to load conjugations: ${response.status}`);
        }

        const data = await response.json();
        setLessonData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error loading conjugation data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConjugationData();
  }, [selectedLessonId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading conjugation data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-error-50 border border-error-200 rounded-lg p-6 max-w-md">
          <div className="text-error-600 font-medium mb-2">Error Loading Data</div>
          <div className="text-error-700 text-sm">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-error-600 text-white rounded hover:bg-error-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔄 Verb Conjugation Test Page
          </h1>
          <p className="text-gray-600 mb-6">
            Testing the Albanian verb conjugation system with real infinitive verbs.
          </p>

          {/* Lesson Selector */}
          <div className="mb-6">
            <label htmlFor="lesson-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select a lesson to test conjugations:
            </label>
            <select
              id="lesson-select"
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white min-w-[300px]"
            >
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.skill_name} - {lesson.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {lessonData ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-medium text-blue-800 mb-2">Lesson Summary</h2>
              <div className="text-blue-700 text-sm space-y-1">
                <div>Total verbs: {lessonData.summary?.total_verbs || 0}</div>
                <div>Total conjugations: {lessonData.summary?.total_conjugations || 0}</div>
                <div>Available tenses: {lessonData.summary?.available_tenses?.join(', ') || 'None'}</div>
                <div>Verb classes: {lessonData.summary?.verb_classes?.join(', ') || 'None'}</div>
              </div>
            </div>

            {/* Verb Conjugations */}
            {lessonData.verbs && lessonData.verbs.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Verb Conjugations ({lessonData.verbs.length} verbs)
                </h2>

                {lessonData.verbs.map((verb) => (
                  <div key={verb.verb_id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {verb.target_phrase}
                      </h3>
                      <p className="text-gray-600">{verb.english_phrase}</p>
                      {verb.pronunciation_guide && (
                        <p className="text-sm text-gray-500">[{verb.pronunciation_guide}]</p>
                      )}
                    </div>

                    {verb.conjugations?.available_tenses?.length > 0 ? (
                      <ConjugationTable
                        verbId={verb.verb_id}
                        targetPhrase={verb.target_phrase}
                        englishPhrase={verb.english_phrase}
                        conjugationsByTense={verb.conjugations.by_tense}
                        availableTenses={verb.conjugations.available_tenses}
                      />
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="text-yellow-800">
                          No conjugation data available for this verb yet.
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <div className="text-gray-600 mb-2">No verbs found in this lesson</div>
                <div className="text-sm text-gray-500">
                  Try selecting a different lesson or check if verbs have been added to this lesson.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            Select a lesson to view conjugation data
          </div>
        )}
      </div>
    </div>
  );
}