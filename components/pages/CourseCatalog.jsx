import React, { useState, useEffect } from 'react';

const CourseCatalog = ({ onSelectCourse, currentUser }) => {
  const [courses, setCourses] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourseCatalog();
  }, [currentUser]);

  const loadCourseCatalog = async () => {
    try {
      setLoading(true);
      
      const userId = currentUser?.id;
      const url = userId ? `/api/courses/catalog?userId=${userId}` : '/api/courses/catalog';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.courses || []);
        setLanguages(data.languages || []);
      } else {
        setError(data.error || 'Failed to load courses');
      }
    } catch (err) {
      console.error('Error loading course catalog:', err);
      setError('Failed to connect to course catalog');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = selectedLanguage === 'all' 
    ? courses 
    : courses.filter(course => course.language_code === selectedLanguage);

  const getEnrollmentStatus = (course) => {
    return course.enrollmentStatus || 'not_started';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-700';
      case 'in_progress':
        return 'bg-primary-100 text-primary-700';
      case 'not_started':
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getActionButton = (course) => {
    const status = getEnrollmentStatus(course);
    
    switch (status) {
      case 'completed':
        return (
          <button 
            onClick={() => onSelectCourse(course.id, 'review')}
            className="btn btn-secondary w-full"
          >
            Review Course
          </button>
        );
      case 'in_progress':
        return (
          <button 
            onClick={() => onSelectCourse(course.id, 'continue')}
            className="btn bg-primary-500 text-white w-full"
          >
            Continue Course
          </button>
        );
      case 'not_started':
      default:
        return course.prerequisitesMet ? (
          <button 
            onClick={() => onSelectCourse(course.id, 'view')}
            className="btn bg-primary-500 text-white w-full"
          >
            View Course
          </button>
        ) : (
          <button 
            disabled
            className="btn bg-gray-300 text-gray-500 w-full cursor-not-allowed"
          >
            Prerequisites Required
          </button>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course catalog...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="heading-2 mb-2">Error Loading Catalog</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadCourseCatalog}
            className="btn bg-primary-500 text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="heading-1 text-4xl mb-4">Course Catalog</h1>
            <p className="body-text text-xl max-w-2xl mx-auto">
              Choose from our university-quality language courses. 
              Start with fundamentals and progress to advanced proficiency.
            </p>
          </div>

          {/* Language Filter */}
          <div className="flex justify-center">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedLanguage('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedLanguage === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Languages
              </button>
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => setSelectedLanguage(language.code)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedLanguage === language.code
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {language.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Course Grid */}
      <main className="container mx-auto px-4 py-12">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="heading-2 mb-2">No Courses Available</h2>
            <p className="text-gray-600">
              {selectedLanguage === 'all' 
                ? 'No courses are currently available.' 
                : 'No courses available for the selected language.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="card hover:shadow-lg transition-all group">
                
                {/* Course Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      course.cefrLevel === 'A1' ? 'bg-green-100 text-green-700' :
                      course.cefrLevel === 'A2' ? 'bg-blue-100 text-blue-700' :
                      course.cefrLevel === 'B1' ? 'bg-yellow-100 text-yellow-700' :
                      course.cefrLevel === 'B2' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      CEFR {course.cefrLevel}
                    </span>
                    
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      getStatusBadge(getEnrollmentStatus(course))
                    }`}>
                      {getEnrollmentStatus(course).replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                    {course.name}
                  </h3>
                  
                  <div className="text-sm text-gray-600 space-x-2">
                    <span>{course.code}</span>
                    <span>•</span>
                    <span>{course.estimatedHours}h</span>
                    <span>•</span>
                    <span>{course.totalSkills} skills</span>
                  </div>
                </div>

                {/* Course Description */}
                <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                  {course.description}
                </p>

                {/* Progress Bar (if enrolled) */}
                {getEnrollmentStatus(course) === 'in_progress' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round((course.skillsCompleted || 0) / course.totalSkills * 100)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${(course.skillsCompleted || 0) / course.totalSkills * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Prerequisites Info */}
                {!course.prerequisitesMet && course.prerequisites?.length > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-xs text-yellow-700 font-medium mb-1">
                      Prerequisites Required
                    </div>
                    <div className="text-xs text-yellow-600">
                      Complete previous level courses first
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="mt-auto">
                  {getActionButton(course)}
                </div>

                {/* Course Details Link */}
                <button 
                  onClick={() => onSelectCourse(course.id, 'view')}
                  className="text-primary-500 hover:text-primary-600 text-sm font-medium mt-2 block w-full text-center"
                >
                  View Details →
                </button>

              </div>
            ))}
          </div>
        )}
      </main>

      {/* Coming Soon Section */}
      <section className="bg-white border-t border-gray-200">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="heading-2 text-3xl mb-4">More Languages Coming Soon</h2>
            <p className="body-text text-lg max-w-2xl mx-auto">
              We're expanding our catalog with more rare and minority languages. 
              Join our waitlist to be notified when new courses launch.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {/* Coming Soon Language Cards */}
            {[
              { name: 'Welsh', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', code: 'cy' },
              { name: 'Scots Gaelic', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', code: 'gd' },
              { name: 'Basque', flag: '🟥🟢', code: 'eu' },
              { name: 'Catalan', flag: '🔴🟡', code: 'ca' }
            ].map((language) => (
              <div key={language.code} className="card border-dashed border-2 border-gray-300 text-center">
                <div className="text-4xl mb-4">{language.flag}</div>
                <h3 className="text-lg font-semibold mb-2">{language.name} Courses</h3>
                <p className="text-gray-600 text-sm mb-4">Coming 2025</p>
                <button className="btn btn-secondary text-sm w-full">
                  Join Waitlist
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseCatalog;