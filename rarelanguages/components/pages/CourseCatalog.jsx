import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Course Catalog - University-style course browsing and enrollment
 * Replaces skill tree with academic course selection
 */
const CourseCatalog = ({ onSelectCourse, onEnrollInCourse, currentUser }) => {
    const [availableCourses, setAvailableCourses] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('gheg-al');
    const [filterLevel, setFilterLevel] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const languages = [
        { code: 'gheg-al', name: 'Gheg Albanian', nativeName: 'Shqip (Gegë)', flag: '🇦🇱' },
        { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
        { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
        { code: 'mi', name: 'Māori', nativeName: 'Te Reo Māori', flag: '🇳🇿' },
    ];

    const levelFilters = [
        { value: 'all', label: 'All Levels', description: 'Show all available courses' },
        { value: '1', label: 'Level 1 (A1)', description: 'Beginner - Foundations' },
        { value: '2', label: 'Level 2 (A2)', description: 'Elementary - Development' },
        { value: '3', label: 'Level 3 (B1)', description: 'Intermediate - Fluency' },
        { value: '4', label: 'Level 4 (B2)', description: 'Upper-Intermediate - Mastery' },
    ];

    useEffect(() => {
        loadCoursesForLanguage(selectedLanguage);
    }, [selectedLanguage, filterLevel]);

    const loadCoursesForLanguage = async (languageCode) => {
        try {
            setLoading(true);
            setError(null);
            
            const params = new URLSearchParams({
                language: languageCode,
                userId: currentUser?.id || 'guest'
            });
            
            if (filterLevel !== 'all') {
                params.append('level', filterLevel);
            }

            const response = await fetch(`/api/courses?${params}`);
            
            if (!response.ok) {
                throw new Error('Failed to load courses');
            }

            const data = await response.json();
            
            if (data.success) {
                const enrolled = data.courses.filter(c => 
                    c.enrollmentStatus === 'in_progress' || c.enrollmentStatus === 'completed'
                );
                const available = data.courses.filter(c => 
                    c.enrollmentStatus === 'not_started'
                );
                
                setEnrolledCourses(enrolled);
                setAvailableCourses(available);
            } else {
                throw new Error(data.error || 'Failed to load courses');
            }
        } catch (err) {
            console.error('Error loading courses:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCourseEnroll = async (courseId) => {
        try {
            const response = await fetch(`/api/courses/${courseId}/enroll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: currentUser?.id
                }),
            });

            const data = await response.json();
            
            if (data.success) {
                // Refresh courses to show enrollment status change
                await loadCoursesForLanguage(selectedLanguage);
                
                if (onEnrollInCourse) {
                    onEnrollInCourse(courseId, data.course);
                }
            } else {
                alert(data.error || 'Failed to enroll in course');
            }
        } catch (err) {
            console.error('Enrollment failed:', err);
            alert('Enrollment failed: ' + err.message);
        }
    };

    const handleContinueCourse = (courseId) => {
        if (onSelectCourse) {
            onSelectCourse(courseId, 'continue');
        }
    };

    const getCurrentLanguage = () => {
        return languages.find(lang => lang.code === selectedLanguage);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading course catalog...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-7xl mx-auto px-4 py-8">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Course Catalog
                    </h1>
                    <p className="text-xl text-gray-600">
                        Choose your academic language learning journey
                    </p>
                </div>

                {/* Language & Filter Selection */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Language Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Select Language
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setSelectedLanguage(lang.code)}
                                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                                            selectedLanguage === lang.code
                                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <span className="text-2xl">{lang.flag}</span>
                                            <div>
                                                <div className="font-medium">{lang.name}</div>
                                                <div className="text-sm opacity-75">{lang.nativeName}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Level Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Filter by Level
                            </label>
                            <div className="space-y-2">
                                {levelFilters.map((filter) => (
                                    <button
                                        key={filter.value}
                                        onClick={() => setFilterLevel(filter.value)}
                                        className={`w-full p-3 rounded-lg border text-left transition-all ${
                                            filterLevel === filter.value
                                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="font-medium">{filter.label}</div>
                                        <div className="text-sm opacity-75">{filter.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex">
                            <div className="text-red-400 mr-3">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-red-800">
                                    Error Loading Courses
                                </h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Enrolled Courses Section */}
                {enrolledCourses.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="text-green-500 mr-2">📚</span>
                            My Courses
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrolledCourses.map((course) => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    enrollmentStatus={course.enrollmentStatus}
                                    onAction={() => handleContinueCourse(course.id)}
                                    currentUser={currentUser}
                                    actionType="continue"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Available Courses Section */}
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                        <span className="text-blue-500 mr-2">🎓</span>
                        Available Courses - {getCurrentLanguage()?.name}
                    </h2>
                    
                    {availableCourses.length === 0 && !loading && (
                        <div className="text-center py-12 bg-white rounded-xl">
                            <div className="text-6xl mb-4">🏗️</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                No courses available yet
                            </h3>
                            <p className="text-gray-600 mb-6">
                                Use the "Build My Course" feature to generate courses for {getCurrentLanguage()?.name}
                            </p>
                            <button
                                onClick={() => window.location.href = '/build-course'}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Generate Courses
                            </button>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableCourses.map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                enrollmentStatus={course.enrollmentStatus}
                                onAction={() => handleCourseEnroll(course.id)}
                                currentUser={currentUser}
                                actionType="enroll"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * University-style course card with academic information
 */
const CourseCard = ({ course, enrollmentStatus, onAction, currentUser, actionType }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-100';
            case 'in_progress': return 'text-blue-600 bg-blue-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getActionButton = () => {
        switch (actionType) {
            case 'continue':
                return {
                    text: enrollmentStatus === 'completed' ? 'Review Course' : 'Continue Learning',
                    className: 'bg-green-600 hover:bg-green-700 text-white',
                    icon: enrollmentStatus === 'completed' ? '✓' : '▶️'
                };
            case 'enroll':
                return {
                    text: 'Enroll in Course',
                    className: 'bg-blue-600 hover:bg-blue-700 text-white',
                    icon: '📝'
                };
            default:
                return {
                    text: 'View Details',
                    className: 'bg-gray-600 hover:bg-gray-700 text-white',
                    icon: '👁️'
                };
        }
    };

    const action = getActionButton();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-200"
        >
            {/* Course Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {course.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded">
                                {course.cefrLevel}
                            </span>
                            {course.language && (
                                <span className="text-sm text-gray-500">
                                    {course.language.nativeName}
                                </span>
                            )}
                        </div>
                    </div>
                    {enrollmentStatus && enrollmentStatus !== 'not_started' && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(enrollmentStatus)}`}>
                            {enrollmentStatus.replace('_', ' ').toUpperCase()}
                        </span>
                    )}
                </div>
                
                <p className="text-gray-600 text-sm line-clamp-2">
                    {course.description}
                </p>
            </div>

            {/* Course Details */}
            <div className="p-6 pt-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                            {course.totalSkills || 0}
                        </div>
                        <div className="text-xs text-gray-500">Skills</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                            {course.estimatedHours || 40}h
                        </div>
                        <div className="text-xs text-gray-500">Duration</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                            {course.level}
                        </div>
                        <div className="text-xs text-gray-500">Level</div>
                    </div>
                </div>

                {/* Learning Objectives Preview */}
                {course.learningObjectives && course.learningObjectives.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Learning Objectives:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            {course.learningObjectives.slice(0, 2).map((objective, index) => (
                                <li key={index} className="flex items-start">
                                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                                    {objective}
                                </li>
                            ))}
                            {course.learningObjectives.length > 2 && (
                                <li className="text-xs text-gray-500 italic">
                                    +{course.learningObjectives.length - 2} more objectives
                                </li>
                            )}
                        </ul>
                    </div>
                )}

                {/* Progress Bar for Enrolled Courses */}
                {course.userProgress && (
                    <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{course.userProgress.skillsCompleted || 0}/{course.totalSkills || 0}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{
                                    width: `${Math.round((course.userProgress.skillsCompleted || 0) / (course.totalSkills || 1) * 100)}%`
                                }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={onAction}
                    disabled={!currentUser}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                        !currentUser 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : action.className
                    }`}
                >
                    <span>{action.icon}</span>
                    <span>{action.text}</span>
                </button>
                
                {!currentUser && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                        Sign in to enroll in courses
                    </p>
                )}
            </div>
        </motion.div>
    );
};

export default CourseCatalog;