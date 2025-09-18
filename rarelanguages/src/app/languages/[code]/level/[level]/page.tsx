'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Skill {
  id: string;
  name: string;
  description: string;
  position: number;
  totalLessons: number;
  estimatedHours: number;
  courseName: string;
  courseId: string;
}

export default function LevelPage() {
  const params = useParams();
  const languageCode = params.code as string;
  const level = parseInt(params.level as string);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [languageName, setLanguageName] = useState('');

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        // Use the new dedicated API endpoint
        const response = await fetch(`/api/languages/${languageCode}/level/${level}/skills`);
        
        if (!response.ok) {
          throw new Error(`Skills API failed with status ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(`Skills API error: ${data.error}`);
        }

        if (!data.skills || data.skills.length === 0) {
          throw new Error(`No skills found for ${languageCode} level ${level}`);
        }

        // Set language name (extract from first skill's course or use code)
        setLanguageName(languageCode.charAt(0).toUpperCase() + languageCode.slice(1));

        // Skills should already be ordered by position from the API
        console.log('Skills from API:', data.skills.map(s => ({ name: s.name, position: s.position })));
        
        setSkills(data.skills);
        setLoading(false);

      } catch (error) {
        console.error('Failed to fetch skills:', error);
        throw error; // Re-throw to crash the page
      }
    };

    if (languageCode && !isNaN(level)) {
      fetchSkills();
    }
  }, [languageCode, level]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-stone-50 to-orange-50">
        <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
                  Rare Languages
                </span>
              </Link>
            </div>
          </div>
        </nav>
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading skills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-stone-50 to-orange-50">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
                Rare Languages
              </span>
            </Link>
            <Link 
              href={`/languages/${languageCode}`}
              className="text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
            >
              ← Back to {languageName} Levels
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {languageName} Level {level}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose a skill to start learning. ({skills.length} skills available)
          </p>
        </div>

        {/* Debug Info */}
        <div className="mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>Debug:</strong> Found {skills.length} skills with positions: {' '}
            {skills.map(s => s.position).join(', ')}
          </p>
        </div>

        {/* Skills Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skills.map((skill) => (
            <Link 
              key={skill.id} 
              href={`/skills/${skill.id}/learn`}
              className="group"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-emerald-200">
                {/* Skill Icon/Position */}
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold">
                    Skill {skill.position}
                  </div>
                  <div className="text-3xl">
                    📚
                  </div>
                </div>
                
                {/* Skill Name */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-emerald-700 transition-colors">
                  {skill.name}
                </h3>
                
                {/* Skill Description */}
                <p className="text-gray-600 mb-6 line-clamp-3">
                  {skill.description}
                </p>
                
                {/* Course Name */}
                <p className="text-sm text-gray-500 mb-4">
                  From: {skill.courseName}
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="text-2xl font-bold text-emerald-700">{skill.totalLessons}</div>
                    <div className="text-sm text-emerald-600 font-medium">
                      {skill.totalLessons === 1 ? 'Lesson' : 'Lessons'}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="text-2xl font-bold text-orange-700">{skill.estimatedHours}h</div>
                    <div className="text-sm text-orange-600 font-medium">Est. Time</div>
                  </div>
                </div>
                
                {/* Action */}
                <div className="text-center">
                  <div className="inline-flex items-center text-emerald-700 font-semibold group-hover:text-emerald-800 transition-colors">
                    Start Learning
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}