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
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-orange-100/20"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-3">
        <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
      </div>

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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
          <div className="text-center relative">
            {/* Floating Elements - Minimal */}
            <div className="absolute -top-8 left-1/4 w-2 h-2 bg-emerald-400 rounded-full animate-float opacity-10"></div>
            <div className="absolute top-16 right-1/3 w-1 h-1 bg-orange-400 rounded-full animate-float opacity-8" style={{animationDelay: '1s'}}></div>

            <div className="mb-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-emerald-700 text-sm font-medium mb-6 animate-fade-in-down">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                Next-generation language learning platform
              </div>
            </div>

            <h1 className="heading-display mb-6 animate-fade-in-up">
              Master{' '}
              <span className="relative">
                Rare Languages
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-orange-400 rounded-full transform scale-x-0 animate-scale-in" style={{animationDelay: '1s'}}></div>
              </span>
            </h1>

            <p className="body-large max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Discover and master the world's most fascinating languages with our immersive,
              AI-powered learning platform designed for the next generation of polyglots.
            </p>

            <div className="flex justify-center mb-12 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <button
                onClick={() => {
                  const languageSection = document.querySelector('#language-selection');
                  languageSection?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-primary px-8 py-4 shadow-glow-emerald flex items-center justify-center"
              >
                Explore Languages
                <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>

            {/* Stats Cards - Standardized */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <div className="glass-card text-center hover-lift">
                <div className="text-2xl font-bold gradient-text mb-1">{languages.length}</div>
                <div className="text-gray-600 font-medium text-sm">Rare Languages</div>
              </div>
              <div className="glass-card text-center hover-lift">
                <div className="text-2xl font-bold gradient-text mb-1">{courses.length}</div>
                <div className="text-gray-600 font-medium text-sm">Learning Courses</div>
              </div>
              <div className="glass-card text-center hover-lift">
                <div className="text-2xl font-bold gradient-text mb-1">∞</div>
                <div className="text-gray-600 font-medium text-sm">Possibilities</div>
              </div>
            </div>
          </div>
        </div>

        {/* Language Selection Section */}
        <div id="language-selection" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="text-center mb-12">
            <h2 className="heading-2 mb-4">Choose Your Language Adventure</h2>
            <p className="body-text max-w-2xl mx-auto">
              Each language opens a door to a new world of culture, history, and human connection.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-6"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-600 font-medium">Discovering rare languages...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
              {(() => {
                // Sort languages by lesson count (descending) to identify the featured one
                const sortedLanguages = [...languages].sort((a, b) => b.lesson_count - a.lesson_count);
                const featuredLanguageCode = sortedLanguages[0]?.code;

                return languages.map((language, index) => {
                  const languageCourses = coursesByLanguage[language.code] || [];
                  const totalCourses = languageCourses.length;
                  const totalLessons = language.lesson_count;
                  const isFeatured = language.code === featuredLanguageCode;

                  return (
                    <Link
                      key={language.code}
                      href={`/languages/${language.code}`}
                      className={`group ${isFeatured ? 'lg:col-start-2 lg:row-start-1' : ''}`}
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      <div className={`card-hover p-6 relative overflow-hidden group-hover:shadow-glow-emerald ${
                        isFeatured ? 'scale-105 shadow-lg ring-2 ring-emerald-200/50' : ''
                      }`}>
                      {/* Subtle Background Pattern - Reduced opacity */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-orange-50 rounded-full -translate-y-12 translate-x-12 opacity-20 group-hover:scale-110 transition-transform duration-500"></div>

                        <div className="relative z-10 flex flex-col h-full">
                          {/* Featured Badge */}
                          {isFeatured && (
                            <div className="absolute -top-3 -right-3 z-20">
                              <div className="badge-emerald text-xs font-bold px-3 py-1 shadow-lg">
                                Most Content
                              </div>
                            </div>
                          )}

                          {/* Language Flag/Icon */}
                          <div className="text-center mb-4">
                            <div className={`mb-3 group-hover:scale-105 transition-transform duration-300 ${
                              isFeatured ? 'text-6xl' : 'text-5xl'
                            }`}>
                              {language.flag}
                            </div>

                            {/* Language Names */}
                            <div className="space-y-1">
                              <h3 className={`font-bold text-gray-900 group-hover:gradient-text transition-all duration-300 ${
                                isFeatured ? 'text-2xl' : 'text-xl'
                              }`}>
                                {language.name}
                              </h3>
                              {language.native_name && language.native_name !== language.name && (
                                <p className={`text-gray-600 font-medium ${
                                  isFeatured ? 'text-lg' : 'text-base'
                                }`}>
                                  {language.native_name}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Enhanced Stats */}
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="text-center glass-card">
                              <div className="text-xl font-bold gradient-text mb-1">{totalCourses}</div>
                              <div className="text-xs text-gray-600 font-medium">
                                {totalCourses === 1 ? 'Course' : 'Courses'}
                              </div>
                            </div>
                            <div className="text-center glass-card">
                              <div className="text-xl font-bold gradient-text mb-1">{totalLessons}</div>
                              <div className="text-xs text-gray-600 font-medium">
                                {totalLessons === 1 ? 'Lesson' : 'Lessons'}
                              </div>
                            </div>
                          </div>

                          {/* Modern Action Button */}
                          <div className="mt-auto">
                            <div className="btn-primary w-full flex items-center justify-center text-sm">
                              Start Learning
                              <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* Enhanced Empty State */}
        {!loading && languages.length === 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
            <div className="text-center py-20">
              <div className="relative mb-8">
                <div className="glass-card w-32 h-32 rounded-3xl mx-auto flex items-center justify-center text-6xl animate-float">
                  📚
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-emerald-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>

              <h3 className="heading-3 mb-6">New Languages Coming Soon</h3>
              <p className="body-text max-w-lg mx-auto mb-8">
                We're carefully curating rare and fascinating languages to bring you the most authentic
                learning experience. Check back soon for exciting updates!
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="btn-secondary px-6 py-3">
                  Get Notified
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12" />
                  </svg>
                </button>
                <button className="btn-ghost px-6 py-3">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}