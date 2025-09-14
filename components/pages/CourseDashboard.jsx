import React, { useState, useEffect } from 'react';

const CourseDashboard = ({ courseId, currentUser, onStartLesson, onBack }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (courseId && currentUser) {
      loadDashboard();
    }
  }, [courseId, currentUser]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/courses/${courseId}/dashboard?userId=${currentUser.id}`);
      const data = await response.json();

      if (data.success) {
        setDashboardData(data);
      } else {
        setError(data.error || 'Failed to load course dashboard');
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to connect to dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStartLesson = (lessonId) => {
    if (onStartLesson) {
      onStartLesson(lessonId, courseId);
    }
  };

  const getProgressPercentage = () => {
    if (!dashboardData?.progress) return 0;
    const { skillsCompleted } = dashboardData.progress;
    const totalSkills = dashboardData.course?.total_skills || 1;
    return Math.round((skillsCompleted / totalSkills) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={loadDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={onBack}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { course, progress, nextLesson, units } = dashboardData;
  const progressPercentage = getProgressPercentage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-800 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ← Back to Catalog
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
                <p className="text-gray-600">{course.code} • {course.language?.name}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Overall Progress</div>
              <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{progress?.skillsCompleted || 0} skills completed</span>
              <span>{course?.total_skills || 0} total skills</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Next Lesson & Units */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Continue Learning Card */}
            {nextLesson ? (
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-2">Continue Learning</h2>
                    <p className="text-blue-100 mb-1">{nextLesson.skill_name}</p>
                    <p className="text-lg font-semibold">{nextLesson.name}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-blue-100">
                      <span>🎯 Level {nextLesson.difficulty_level || 1}</span>
                      <span>⏱️ {nextLesson.estimated_minutes || 15} min</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartLesson(nextLesson.id)}
                    className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Start Lesson →
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎉</div>
                  <h2 className="text-xl font-bold text-green-800 mb-2">Course Completed!</h2>
                  <p className="text-green-700">Congratulations on finishing {course.name}</p>
                </div>
              </div>
            )}

            {/* Course Units */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Units</h3>
              
              {units && units.length > 0 ? (
                <div className="space-y-4">
                  {units.map((unit) => {
                    const unitProgress = unit.totalSkills > 0 
                      ? Math.round((unit.skillsCompleted / unit.totalSkills) * 100) 
                      : 0;
                    
                    return (
                      <div key={unit.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{unit.name}</h4>
                            <p className="text-sm text-gray-600">{unit.description}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            unitProgress === 100 
                              ? 'bg-green-100 text-green-700' 
                              : unitProgress > 0 
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {unitProgress}% Complete
                          </span>
                        </div>
                        
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${unitProgress}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{unit.skillsCompleted} of {unit.totalSkills} skills</span>
                            <span>~{unit.estimated_hours}h</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📚</div>
                  <p>Course units will appear here as content is added</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats & Information */}
          <div className="space-y-6">
            
            {/* Study Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Lessons Completed</span>
                  <span className="font-semibold">{progress?.lessonsCompleted || 0}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Study Time</span>
                  <span className="font-semibold">{progress?.totalHoursSpent || 0}h</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Average Score</span>
                  <span className="font-semibold">{progress?.overallScore || 0}%</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Study Streak</span>
                  <span className="font-semibold text-orange-600">{progress?.studyStreak || 0} days</span>
                </div>
              </div>
            </div>

            {/* Course Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Info</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">CEFR Level</div>
                  <div className="font-medium text-gray-900">{course.cefr_level || 'A1'}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Estimated Duration</div>
                  <div className="font-medium text-gray-900">{course.estimated_hours}+ hours</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Learning Objectives</div>
                  <div className="text-sm text-gray-700">
                    {course.learning_objectives && course.learning_objectives.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        {course.learning_objectives.slice(0, 3).map((objective, index) => (
                          <li key={index}>{objective}</li>
                        ))}
                      </ul>
                    ) : (
                      "Master essential vocabulary and grammar fundamentals"
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">Enrolled</div>
                  <div className="font-medium text-gray-900">
                    {new Date(progress?.enrollment_date || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button 
                  onClick={() => nextLesson && handleStartLesson(nextLesson.id)}
                  disabled={!nextLesson}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {nextLesson ? 'Continue Learning' : 'No lessons available'}
                </button>
                
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors">
                  Review Vocabulary
                </button>
                
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors">
                  Take Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CourseDashboard;