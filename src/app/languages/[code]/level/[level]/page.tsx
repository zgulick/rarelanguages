'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import LessonSummaryCard from '../../../../../../components/exercises/LessonSummaryCard';

interface Lesson {
  id: string;
  name: string;
  description: string;
  duration: string;
  estimated_minutes: number;
  difficulty_level: number;
  completed: boolean;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  position: number;
  totalLessons: number;
  estimatedHours: number;
  courseName: string;
  courseId: string;
  lessons?: Lesson[];
}

export default function LevelPage() {
  const params = useParams();
  const languageCode = params.code as string;
  const level = parseInt(params.level as string);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [languageName, setLanguageName] = useState('');
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setError(null);
        const response = await fetch(`/api/languages/${languageCode}/level/${level}/skills`);

        if (!response.ok) {
          throw new Error(`Skills API failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Skills API returned an error');
        }

        // Set unconditionally: an empty level is a valid state, not a failure.
        setSkills(data.skills ?? []);
        setLanguageName(data.languageName ?? '');
      } catch (err) {
        console.error('Failed to fetch skills:', err);
        setError('We could not load this level. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (languageCode && !isNaN(level)) {
      fetchSkills();
    }
  }, [languageCode, level]);

  // The skills API already embeds each skill's lessons, so this is
  // purely an expand/collapse toggle.
  const toggleSkill = (skillId: string) => {
    setExpandedSkillId(current => (current === skillId ? null : skillId));
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-background via-primary-50/30 to-secondary-50/50"></div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-background via-primary-50/30 to-secondary-50/50 pointer-events-none"></div>

      {/* Navigation Bar */}
      <nav className="glass-nav sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="group flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                Rare Languages
              </span>
            </Link>
            <Link
              href={`/languages/${languageCode}`}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Levels
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {error ? (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-error-50 mx-auto mb-6 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Something went wrong
            </h1>
            <p className="text-lg text-gray-600 mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary px-6 py-3"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {languageName ? `${languageName} ` : ''}Level {level}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {skills.length > 0
              ? `Master ${skills.length} core skills to build your fluency.`
              : 'No skills have been published for this level yet.'}
          </p>
        </div>

        {/* Skills List */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${expandedSkillId === skill.id ? 'shadow-md ring-1 ring-primary-100' : 'hover:shadow-md'
                }`}
            >
              <div
                onClick={() => toggleSkill(skill.id)}
                className="p-6 cursor-pointer flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-2xl">
                  📚
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{skill.name}</h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500 font-medium">
                        {skill.totalLessons} Lessons • {skill.estimatedHours}h
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedSkillId === skill.id ? 'rotate-180' : ''
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <p className="text-gray-600 leading-relaxed mb-2">
                    {skill.description}
                  </p>
                </div>
              </div>

              {/* Lessons List (Expanded) */}
              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${expandedSkillId === skill.id ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
              >
                <div className="p-6 pt-0 bg-gray-50/50">
                  <div className="h-px bg-gray-100 w-full mb-6"></div>

                  {skill.lessons && skill.lessons.length > 0 ? (
                    <div className="space-y-3">
                      {skill.lessons.map((lesson, idx) => (
                        <LessonSummaryCard
                          key={lesson.id}
                          lesson={lesson}
                          index={idx}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No lessons available for this skill yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
          </>
        )}
      </main>
    </div>
  );
}