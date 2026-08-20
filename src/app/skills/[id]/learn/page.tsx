'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProcessedLessonPlayer from '../../../../../components/ProcessedLessonPlayer';

export default function SkillLearningPage() {
  const params = useParams();
  const router = useRouter();
  const skillId = params.id as string;

  const [processedLessons, setProcessedLessons] = useState<any[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [skillName, setSkillName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load processed lessons for this skill
  useEffect(() => {
    const loadLessons = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/skills/${skillId}/processed-lessons`);

        if (!response.ok) {
          throw new Error(`Failed to load lessons (Status: ${response.status})`);
        }

        const data = await response.json();

        if (!data.success || !data.lessons || data.lessons.length === 0) {
          throw new Error('No lessons available for this skill. Please generate lessons first.');
        }

        setProcessedLessons(data.lessons);
        setSkillName(data.skill.name);
        setLoading(false);
      } catch (err: any) {
        console.error('❌ Failed to load lessons:', err);
        setError(err.message || 'Failed to load lessons');
        setLoading(false);
      }
    };

    if (skillId) {
      loadLessons();
    }
  }, [skillId]);

  const handleLessonComplete = () => {
    // Move to next lesson
    if (currentLessonIndex < processedLessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    } else {
      // All lessons complete
      alert('🎉 Congratulations! You have completed all lessons in this skill!');
      router.push('/');
    }
  };

  const handleExit = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading your lesson...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Lessons</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (processedLessons.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Lessons Available</h2>
          <p className="text-gray-700 mb-6">
            This skill doesn't have any lessons yet. Please generate lessons using the lesson generator.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentLesson = processedLessons[currentLessonIndex];

  return (
    <ProcessedLessonPlayer
      lesson={currentLesson}
      onComplete={handleLessonComplete}
      onExit={handleExit}
      lessonNumber={currentLessonIndex + 1}
      totalLessons={processedLessons.length}
    />
  );
}
