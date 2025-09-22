'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Course {
  id: string;
  name: string;
  description: string;
  level: number;
  cefrLevel: string;
  language: {
    code: string;
    name: string;
    nativeName: string;
  };
  totalSkills: number;
  estimatedHours: number;
}

interface LevelGroup {
  level: number;
  courses: Course[];
  totalSkills: number;
  totalHours: number;
  cefrLevel?: string;
}

export default function LanguagePage() {
  const params = useParams();
  const languageCode = params.code as string;
  const [levels, setLevels] = useState<LevelGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [languageName, setLanguageName] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`/api/courses?language=${languageCode}`);
        
        if (!response.ok) {
          throw new Error(`API failed with status ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(`API returned error: ${data.error}`);
        }

        const courses = data.courses;
        
        if (!courses || courses.length === 0) {
          throw new Error(`No courses found for language code: ${languageCode}`);
        }

        // Set language name from first course
        setLanguageName(courses[0].language.name);

        // Group courses by level
        const coursesByLevel = courses.reduce((acc: { [key: number]: Course[] }, course: Course) => {
          if (!acc[course.level]) {
            acc[course.level] = [];
          }
          acc[course.level].push(course);
          return acc;
        }, {});

        // Create level groups
        const levelGroups: LevelGroup[] = Object.entries(coursesByLevel)
          .map(([level, levelCourses]) => ({
            level: parseInt(level),
            courses: levelCourses,
            totalSkills: levelCourses.reduce((sum, course) => sum + course.totalSkills, 0),
            totalHours: levelCourses.reduce((sum, course) => sum + course.estimatedHours, 0),
            cefrLevel: levelCourses[0]?.cefrLevel // Use CEFR level from first course in level
          }))
          .sort((a, b) => a.level - b.level);

        setLevels(levelGroups);
        setLoading(false);

      } catch (error) {
        console.error('Failed to fetch courses:', error);
        throw error; // Re-throw to crash the page
      }
    };

    if (languageCode) {
      fetchCourses();
    }
  }, [languageCode]);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Enhanced Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-orange-100/20"></div>

        {/* Modern Navigation */}
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

        {/* Enhanced Loading State */}
        <div className="relative z-10 flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="w-20 h-20 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" style={{animationDelay: '0.5s'}}></div>
            </div>
            <div className="glass-card px-8 py-6 rounded-3xl inline-block">
              <p className="text-gray-700 font-medium text-lg mb-2">Loading language levels...</p>
              <p className="text-gray-500 text-sm">Preparing your learning journey</p>
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

      {/* Modern Navigation Bar */}
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
              href="/"
              className="btn-ghost px-4 py-2 text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Languages
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="heading-1 mb-4 animate-fade-in-up" style={{color: '#f97316'}}>
            {languageName} Learning Levels
          </h1>
          <p className="body-large max-w-2xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Progress through structured levels designed to build your fluency step by step.
          </p>
        </div>

        {/* Modern Level Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {levels.map((levelGroup, index) => (
            <Link
              key={levelGroup.level}
              href={`/languages/${languageCode}/level/${levelGroup.level}`}
              className="group"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="card-hover p-6 relative overflow-hidden group-hover:shadow-glow-emerald">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-orange-50 rounded-full -translate-y-12 translate-x-12 opacity-20 group-hover:scale-110 transition-transform duration-500"></div>

                <div className="relative z-10 flex flex-col h-full">
                  {/* Enhanced Level Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="relative">
                      <div className="badge-emerald text-lg font-bold px-6 py-3 shadow-lg">
                        Level {levelGroup.level}
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                    </div>
                    {levelGroup.cefrLevel && (
                      <div className="badge-orange text-sm font-bold">
                        {levelGroup.cefrLevel}
                      </div>
                    )}
                  </div>

                  {/* Enhanced Level Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:gradient-text transition-all duration-300">
                    {languageName} Level {levelGroup.level}
                  </h3>

                  {/* Course Count with Icon */}
                  <div className="flex items-center space-x-2 mb-4">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-gray-600 font-medium">
                      {levelGroup.courses.length} {levelGroup.courses.length === 1 ? 'course' : 'courses'} available
                    </p>
                  </div>

                  {/* Enhanced Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="text-center glass-card">
                      <div className="text-xl font-bold gradient-text mb-1">{levelGroup.totalSkills}</div>
                      <div className="text-xs text-gray-600 font-medium">Skills</div>
                    </div>
                    <div className="text-center glass-card">
                      <div className="text-xl font-bold gradient-text mb-1">{levelGroup.totalHours}h</div>
                      <div className="text-xs text-gray-600 font-medium">Duration</div>
                    </div>
                  </div>

                  {/* Modern Action Button */}
                  <div className="mt-auto">
                    <div className="btn-primary w-full flex items-center justify-center text-sm">
                      Start Level {levelGroup.level}
                      <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
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