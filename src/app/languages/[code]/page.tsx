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

export default function LanguagePage() {
  const params = useParams();
  const languageCode = params.code as string;
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [languageName, setLanguageName] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch(`/api/courses?language=${languageCode}`);
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses || []);
          if (data.courses?.length > 0) {
            setLanguageName(data.courses[0].language.name);
          }
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };

    if (languageCode) {
      fetchCourses();
    }
  }, [languageCode]);

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
            {languageName || 'Loading...'} Courses
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose a course to begin your language learning journey.
          </p>
        </div>

        {/* Course Selection */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading courses...</p>
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Link 
                key={course.id} 
                href={`/courses/${course.id}`}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-emerald-200">
                  {/* Course Level Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold">
                      Level {course.level}
                    </div>
                    {course.cefrLevel && (
                      <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {course.cefrLevel}
                      </div>
                    )}
                  </div>
                  
                  {/* Course Name */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-emerald-700 transition-colors">
                    {course.name}
                  </h3>
                  
                  {/* Course Description */}
                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {course.description}
                  </p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div className="text-xl font-bold text-emerald-700">{course.totalSkills}</div>
                      <div className="text-xs text-emerald-600 font-medium">Skills</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="text-xl font-bold text-orange-700">{course.estimatedHours}h</div>
                      <div className="text-xs text-orange-600 font-medium">Est. Time</div>
                    </div>
                  </div>
                  
                  {/* Action */}
                  <div className="text-center">
                    <div className="inline-flex items-center text-emerald-700 font-semibold group-hover:text-emerald-800 transition-colors">
                      Start Course
                      <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Courses Available</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We're working on adding courses for this language. Check back soon!
            </p>
            <Link 
              href="/"
              className="inline-block mt-6 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Browse Other Languages
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}