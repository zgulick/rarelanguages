import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Course Detail Page - University-style course information and enrollment
 * Shows syllabus, prerequisites, objectives, and enrollment interface
 */
const CourseDetail = ({ courseId, currentUser, onEnroll, onContinue, onBack }) => {
    const [course, setCourse] = useState(null);
    const [prerequisites, setPrerequisites] = useState([]);
    const [canEnroll, setCanEnroll] = useState(false);
    const [enrollmentCheck, setEnrollmentCheck] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrolling, setEnrolling] = useState(false);

    useEffect(() => {
        if (courseId) {
            loadCourseDetails();
            checkEnrollmentEligibility();
        }
    }, [courseId, currentUser]);

    const loadCourseDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/courses/${courseId}`);
            if (!response.ok) {
                throw new Error('Failed to load course details');
            }

            const data = await response.json();
            if (data.success) {
                setCourse(data.course);
            } else {
                throw new Error(data.error || 'Failed to load course');
            }
        } catch (err) {
            console.error('Error loading course:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const checkEnrollmentEligibility = async () => {
        if (!currentUser || !courseId) return;

        try {
            const response = await fetch(`/api/courses/${courseId}/enrollment-check?userId=${currentUser.id}`);
            if (response.ok) {
                const data = await response.json();
                setEnrollmentCheck(data);
                setCanEnroll(data.canEnroll);
                if (data.prerequisites) {
                    setPrerequisites(data.prerequisites);
                }
            }
        } catch (err) {
            console.error('Error checking enrollment eligibility:', err);
        }
    };

    const handleEnrollment = async () => {
        if (!canEnroll || !currentUser) return;

        try {
            setEnrolling(true);
            const response = await fetch(`/api/courses/${courseId}/enroll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: currentUser.id
                }),
            });

            const data = await response.json();
            if (data.success) {
                if (onEnroll) {
                    onEnroll(courseId, data.course);
                }
            } else {
                alert(data.error || 'Enrollment failed');
            }
        } catch (err) {
            console.error('Enrollment error:', err);
            alert('Enrollment failed: ' + err.message);
        } finally {
            setEnrolling(false);
        }
    };

    const handleContinue = () => {
        if (onContinue) {
            onContinue(courseId);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading course details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Course</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={onBack}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Back to Catalog
                    </button>
                </div>
            </div>
        );
    }

    if (!course) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="w-full px-8 py-8">
                
                {/* Header with Back Button */}
                <div className="flex items-center mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-4"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Catalog
                    </button>
                </div>

                {/* Course Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm p-8 mb-6"
                >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                        <div className="mb-4 md:mb-0">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {course.name}
                            </h1>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-medium rounded-full">
                                    {course.cefrLevel}
                                </span>
                                <span>{course.language?.nativeName}</span>
                                <span>Level {course.level}</span>
                                <span>{course.estimatedHours}h total</span>
                            </div>
                        </div>
                        
                        {/* Enrollment Status */}
                        {course.enrollmentStatus && course.enrollmentStatus !== 'not_started' && (
                            <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                    course.enrollmentStatus === 'completed' 
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {course.enrollmentStatus.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>

                    <p className="text-gray-700 text-lg leading-relaxed">
                        {course.description}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Course Syllabus */}
                        <CourseSyllabus course={course} />
                        
                        {/* Learning Objectives */}
                        <LearningObjectives objectives={course.learningObjectives} />
                        
                        {/* Course Structure */}
                        <CourseStructure course={course} />
                        
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        
                        {/* Enrollment Panel */}
                        <EnrollmentPanel
                            course={course}
                            currentUser={currentUser}
                            canEnroll={canEnroll}
                            enrollmentCheck={enrollmentCheck}
                            enrolling={enrolling}
                            onEnroll={handleEnrollment}
                            onContinue={handleContinue}
                        />

                        {/* Prerequisites */}
                        {prerequisites.length > 0 && (
                            <PrerequisitesPanel prerequisites={prerequisites} />
                        )}

                        {/* Quick Facts */}
                        <QuickFacts course={course} />
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Course Syllabus Section
 */
const CourseSyllabus = ({ course }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6"
    >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-blue-500 mr-2">📚</span>
            Course Syllabus
        </h2>
        <div className="prose prose-sm max-w-none">
            <p className="text-gray-600 mb-4">
                This course provides comprehensive instruction in {course.language?.name} at the {course.cefrLevel} level, 
                designed for learners seeking academic-quality language education with cultural integration.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center bg-gray-50 rounded-lg p-4">
                <div>
                    <div className="text-2xl font-bold text-blue-600">{course.totalSkills || 0}</div>
                    <div className="text-sm text-gray-600">Skills Covered</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-green-600">{course.estimatedHours}h</div>
                    <div className="text-sm text-gray-600">Study Time</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-purple-600">{course.totalAssessments || 0}</div>
                    <div className="text-sm text-gray-600">Assessments</div>
                </div>
            </div>
        </div>
    </motion.div>
);

/**
 * Learning Objectives Section
 */
const LearningObjectives = ({ objectives }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm p-6"
    >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-green-500 mr-2">🎯</span>
            Learning Objectives
        </h2>
        {objectives && objectives.length > 0 ? (
            <ul className="space-y-3">
                {objectives.map((objective, index) => (
                    <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1 text-sm">✓</span>
                        <span className="text-gray-700">{objective}</span>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-gray-500 italic">Learning objectives will be available once you enroll.</p>
        )}
    </motion.div>
);

/**
 * Course Structure Section
 */
const CourseStructure = ({ course }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6"
    >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-purple-500 mr-2">🏗️</span>
            Course Structure
        </h2>
        <div className="text-gray-600">
            <p className="mb-4">
                This course follows our proven 4-phase academic methodology:
            </p>
            <div className="space-y-3">
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                        1
                    </div>
                    <div>
                        <div className="font-medium">Grammar Instruction</div>
                        <div className="text-sm text-gray-500">Learn the rules and patterns</div>
                    </div>
                </div>
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                        2
                    </div>
                    <div>
                        <div className="font-medium">Guided Practice</div>
                        <div className="text-sm text-gray-500">Practice with immediate feedback</div>
                    </div>
                </div>
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                        3
                    </div>
                    <div>
                        <div className="font-medium">Cultural Context</div>
                        <div className="text-sm text-gray-500">Understand cultural applications</div>
                    </div>
                </div>
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                        4
                    </div>
                    <div>
                        <div className="font-medium">Independent Application</div>
                        <div className="text-sm text-gray-500">Apply knowledge in real scenarios</div>
                    </div>
                </div>
            </div>
        </div>
    </motion.div>
);

/**
 * Enrollment Panel
 */
const EnrollmentPanel = ({ 
    course, 
    currentUser, 
    canEnroll, 
    enrollmentCheck, 
    enrolling, 
    onEnroll, 
    onContinue 
}) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6 sticky top-6"
    >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Course Enrollment
        </h3>
        
        {!currentUser ? (
            <div className="text-center py-6">
                <div className="text-4xl mb-3">🔐</div>
                <p className="text-gray-600 mb-4">Sign in to enroll in this course</p>
                <button className="w-full bg-gray-400 text-white py-2 px-4 rounded-lg cursor-not-allowed">
                    Sign In Required
                </button>
            </div>
        ) : course.enrollmentStatus === 'in_progress' || course.enrollmentStatus === 'completed' ? (
            <div className="text-center py-6">
                <div className="text-4xl mb-3">
                    {course.enrollmentStatus === 'completed' ? '🎓' : '📚'}
                </div>
                <p className="text-gray-600 mb-4">
                    You are {course.enrollmentStatus === 'completed' ? 'completed' : 'enrolled'} in this course
                </p>
                <button
                    onClick={onContinue}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                    {course.enrollmentStatus === 'completed' ? 'Review Course' : 'Continue Learning'}
                </button>
            </div>
        ) : canEnroll ? (
            <div className="text-center py-6">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-gray-600 mb-4">You meet all requirements for this course</p>
                <button
                    onClick={onEnroll}
                    disabled={enrolling}
                    className={`w-full py-2 px-4 rounded-lg transition-colors ${
                        enrolling
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                >
                    {enrolling ? 'Enrolling...' : 'Enroll in Course'}
                </button>
            </div>
        ) : (
            <div className="text-center py-6">
                <div className="text-4xl mb-3">🔒</div>
                <p className="text-gray-600 mb-4">
                    {enrollmentCheck?.reason || 'Prerequisites not met'}
                </p>
                <button className="w-full bg-gray-400 text-white py-2 px-4 rounded-lg cursor-not-allowed">
                    Complete Prerequisites First
                </button>
            </div>
        )}
    </motion.div>
);

/**
 * Prerequisites Panel
 */
const PrerequisitesPanel = ({ prerequisites }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm p-6"
    >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-orange-500 mr-2">⚠️</span>
            Prerequisites
        </h3>
        <div className="space-y-2">
            {prerequisites.map((prereq, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">{prereq.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                        prereq.completed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                    }`}>
                        {prereq.completed ? 'Complete' : 'Required'}
                    </span>
                </div>
            ))}
        </div>
    </motion.div>
);

/**
 * Quick Facts Panel
 */
const QuickFacts = ({ course }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6"
    >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Facts
        </h3>
        <div className="space-y-3 text-sm">
            <div className="flex justify-between">
                <span className="text-gray-600">Course Level:</span>
                <span className="font-medium">{course.level}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">CEFR Level:</span>
                <span className="font-medium">{course.cefrLevel}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">Total Hours:</span>
                <span className="font-medium">{course.estimatedHours}h</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">Skills:</span>
                <span className="font-medium">{course.totalSkills || 0}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">Assessments:</span>
                <span className="font-medium">{course.totalAssessments || 0}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">Language:</span>
                <span className="font-medium">{course.language?.name}</span>
            </div>
        </div>
    </motion.div>
);

export default CourseDetail;