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
      <div className="min-h-screen relative overflow-hidden">
        {/* Enhanced Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-orange-100/20"></div>

        <nav className="glass-nav sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link href="/" className="group flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <span className="text-2xl font-bold gradient-text">
                  Rare Languages
                </span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" style={{animationDelay: '0.5s'}}></div>
            </div>
            <div className="glass-card px-6 py-4 rounded-3xl inline-block">
              <p className="text-gray-700 font-medium mb-1">Loading skills...</p>
              <p className="text-gray-500 text-sm">Preparing your learning path</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-orange-100/20"></div>

      {/* Navigation Bar */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="group flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-2xl font-bold gradient-text">
                Rare Languages
              </span>
            </Link>
            <Link
              href={`/languages/${languageCode}`}
              className="btn-ghost px-4 py-2 text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to {languageName} Levels
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="heading-1 mb-4 animate-fade-in-up" style={{color: '#f97316'}}>
            {languageName} Level {level}
          </h1>
          <p className="body-large max-w-2xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Choose a skill to start learning. ({skills.length} skills available)
          </p>
        </div>

        {/* Skills Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => (
            <Link 
              key={skill.id} 
              href={`/skills/${skill.id}/learn`}
              className="group"
            >
              <div className="card-hover p-6 hover:shadow-glow-emerald">
                <div className="flex flex-col h-full">
                  {/* Skill Icon/Position */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="badge-emerald text-sm font-bold">
                      Skill {skill.position}
                    </div>
                    <div className="text-3xl">
                      📚
                    </div>
                  </div>

                  {/* Skill Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:gradient-text transition-all duration-300">
                    {skill.name}
                  </h3>

                  {/* Skill Description */}
                  <p className="text-gray-600 mb-4 text-sm line-height-relaxed overflow-hidden" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {skill.description.length > 80 ? skill.description.substring(0, 80) + '...' : skill.description}
                  </p>

                  {/* Course Name */}
                  <p className="text-xs text-gray-500 mb-4">
                    From: {skill.courseName}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="text-center glass-card">
                      <div className="text-xl font-bold gradient-text mb-1">{skill.totalLessons}</div>
                      <div className="text-xs text-gray-600 font-medium">
                        {skill.totalLessons === 1 ? 'Lesson' : 'Lessons'}
                      </div>
                    </div>
                    <div className="text-center glass-card">
                      <div className="text-xl font-bold gradient-text mb-1">{skill.estimatedHours}h</div>
                      <div className="text-xs text-gray-600 font-medium">Est. Time</div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-auto">
                    <div className="btn-primary w-full flex items-center justify-center text-sm">
                      Start Learning
                      <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
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