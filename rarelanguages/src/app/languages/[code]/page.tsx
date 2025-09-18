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
          <p className="text-gray-600">Loading levels...</p>
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
              href="/"
              className="text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
            >
              ← Back to Languages
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {languageName} Levels
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your level to start learning.
          </p>
        </div>

        {/* Level Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {levels.map((levelGroup) => (
            <Link 
              key={levelGroup.level} 
              href={`/languages/${languageCode}/level/${levelGroup.level}`}
              className="group"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-emerald-200">
                {/* Level Badge */}
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-lg font-bold">
                    Level {levelGroup.level}
                  </div>
                  {levelGroup.cefrLevel && (
                    <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {levelGroup.cefrLevel}
                    </div>
                  )}
                </div>
                
                {/* Level Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-emerald-700 transition-colors">
                  {languageName} {levelGroup.level}
                </h3>
                
                {/* Course Count */}
                <p className="text-gray-600 mb-6">
                  {levelGroup.courses.length} {levelGroup.courses.length === 1 ? 'course' : 'courses'} available
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="text-2xl font-bold text-emerald-700">{levelGroup.totalSkills}</div>
                    <div className="text-sm text-emerald-600 font-medium">Total Skills</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="text-2xl font-bold text-orange-700">{levelGroup.totalHours}h</div>
                    <div className="text-sm text-orange-600 font-medium">Est. Time</div>
                  </div>
                </div>
                
                {/* Action */}
                <div className="text-center">
                  <div className="inline-flex items-center text-emerald-700 font-semibold group-hover:text-emerald-800 transition-colors">
                    Start Level {levelGroup.level}
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