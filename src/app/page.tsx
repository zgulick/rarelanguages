'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Language {
  code: string;
  name: string;
  native_name: string;
  lesson_count: number;
  flag: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
  level: number;
  language: {
    code: string;
    name: string;
    nativeName: string;
  };
  totalSkills: number;
  estimatedHours: number;
}

export default function LandingPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLanguagesAndCourses = async () => {
      try {
        // Fetch both languages and courses
        const [languagesRes, coursesRes] = await Promise.all([
          fetch('/api/languages/available'),
          fetch('/api/courses')
        ]);

        if (languagesRes.ok) {
          const languagesData = await languagesRes.json();
          setLanguages(languagesData);
        }

        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData.courses || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguagesAndCourses();
  }, []);

  // Group courses by language
  const coursesByLanguage = courses.reduce((acc, course) => {
    const langCode = course.language.code;
    if (!acc[langCode]) {
      acc[langCode] = [];
    }
    acc[langCode].push(course);
    return acc;
  }, {} as Record<string, Course[]>);

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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
              Rare Languages!
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover and master the world's most fascinating languages with our immersive learning platform.
          </p>
        </div>

        {/* Language Selection */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading languages...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {languages.map((language) => {
              const languageCourses = coursesByLanguage[language.code] || [];
              const totalCourses = languageCourses.length;
              const totalLessons = language.lesson_count;

              return (
                <Link 
                  key={language.code} 
                  href={`/languages/${language.code}`}
                  className="group"
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-emerald-200">
                    {/* Language Flag/Icon */}
                    <div className="text-6xl mb-4 text-center">
                      {language.flag || '🌍'}
                    </div>
                    
                    {/* Language Names */}
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">
                        {language.name}
                      </h3>
                      {language.native_name && language.native_name !== language.name && (
                        <p className="text-lg text-gray-600 font-medium">
                          {language.native_name}
                        </p>
                      )}
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                        <div className="text-2xl font-bold text-emerald-700">{totalCourses}</div>
                        <div className="text-sm text-emerald-600 font-medium">
                          {totalCourses === 1 ? 'Course' : 'Courses'}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="text-2xl font-bold text-orange-700">{totalLessons}</div>
                        <div className="text-sm text-orange-600 font-medium">
                          {totalLessons === 1 ? 'Lesson' : 'Lessons'}
                        </div>
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
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && languages.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Languages Available</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We're working on adding more rare languages to our platform. Check back soon!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}