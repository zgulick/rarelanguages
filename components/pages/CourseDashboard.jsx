import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Course Dashboard - Individual course progress and navigation
 * University-style course homepage with progress tracking
 */
const CourseDashboard = ({ courseId, currentUser, onStartLesson, onStartAssessment, onBack }) => {
    const [course, setCourse] = useState(null);
    const [userProgress, setUserProgress] = useState(null);
    const [nextLesson, setNextLesson] = useState(null);
    const [upcomingAssessments, setUpcomingAssessments] = useState([]);
    const [courseUnits, setCourseUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (courseId && currentUser) {
            loadCourseDashboard();
        }
    }, [courseId, currentUser]);

    const loadCourseDashboard = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/courses/${courseId}/dashboard?userId=${currentUser.id}`);
            if (!response.ok) {
                throw new Error('Failed to load course dashboard');
            }

            const data = await response.json();
            if (data.success) {
                setCourse(data.course);
                setUserProgress(data.progress);
                setNextLesson(data.nextLesson);
                setUpcomingAssessments(data.upcomingAssessments || []);
                setCourseUnits(data.units || []);
            } else {
                throw new Error(data.error || 'Failed to load dashboard');
            }
        } catch (err) {
            console.error('Error loading course dashboard:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleContinueLesson = () => {
        if (nextLesson && onStartLesson) {
            onStartLesson(nextLesson.id, courseId);
        }
    };

    const handleStartAssessment = (assessmentId) => {
        if (onStartAssessment) {
            onStartAssessment(assessmentId, courseId);
        }
    };

    const handleUnitClick = (unitId) => {
        // Navigate to unit details - for now just show which unit was clicked
        console.log('Navigate to unit:', unitId);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading course dashboard...</p>
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
            <div className="max-w-7xl mx-auto px-4 py-8">
                
                {/* Header with Back Button */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to My Courses
                    </button>
                    <div className="text-sm text-gray-500">
                        Last accessed: {userProgress?.lastAccessed ? new Date(userProgress.lastAccessed).toLocaleDateString() : 'Never'}
                    </div>
                </div>

                {/* Course Header */}
                <CourseHeader course={course} progress={userProgress} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Continue Learning Section */}
                        <ContinueLearningSection 
                            nextLesson={nextLesson}
                            onContinue={handleContinueLesson}
                        />

                        {/* Course Progress Overview */}
                        <CourseProgressSection 
                            course={course}
                            progress={userProgress}
                        />

                        {/* Units Overview */}
                        <UnitsOverviewSection 
                            units={courseUnits}
                            userProgress={userProgress}
                            onUnitClick={handleUnitClick}
                        />

                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        
                        {/* Quick Stats */}
                        <QuickStatsPanel course={course} progress={userProgress} />

                        {/* Upcoming Assessments */}
                        {upcomingAssessments.length > 0 && (
                            <AssessmentsSection 
                                assessments={upcomingAssessments}
                                onStartAssessment={handleStartAssessment}
                            />
                        )}

                        {/* Achievement Panel */}
                        <AchievementPanel progress={userProgress} />

                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Course Header with Progress
 */
const CourseHeader = ({ course, progress }) => {
    const completionPercentage = Math.round(
        ((progress?.skillsCompleted || 0) / (progress?.skillsTotal || 1)) * 100
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-8 mb-8"
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {course.name}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-medium rounded-full">
                            {course.cefrLevel}
                        </span>
                        <span>{course.language?.nativeName}</span>
                        <span>Level {course.level}</span>
                    </div>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                        {completionPercentage}%
                    </div>
                    <div className="text-sm text-gray-500">Complete</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Course Progress</span>
                    <span>{progress?.skillsCompleted || 0} of {progress?.skillsTotal || 0} skills completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>
            </div>

            {/* Study Streak */}
            <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center text-orange-600">
                    <span className="mr-2">🔥</span>
                    <span>Study Streak: {progress?.studyStreak || 0} days</span>
                </div>
                <div className="flex items-center text-green-600">
                    <span className="mr-2">⏱️</span>
                    <span>Total Time: {progress?.totalHoursSpent || 0}h</span>
                </div>
                <div className="flex items-center text-purple-600">
                    <span className="mr-2">⭐</span>
                    <span>Avg Score: {progress?.overallScore || 0}%</span>
                </div>
            </div>
        </motion.div>
    );
};

/**
 * Continue Learning Section
 */
const ContinueLearningSection = ({ nextLesson, onContinue }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6"
    >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-green-500 mr-2">▶️</span>
            Continue Learning
        </h2>
        
        {nextLesson ? (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                            Next: {nextLesson.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                            {nextLesson.description || 'Continue with your next lesson'}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>⏱️ ~{nextLesson.estimatedMinutes || 15} min</span>
                            <span>📊 Level {nextLesson.difficultyLevel}/10</span>
                        </div>
                    </div>
                    <button
                        onClick={onContinue}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105"
                    >
                        Start Lesson
                    </button>
                </div>
            </div>
        ) : (
            <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="font-semibold mb-2">Course Complete!</h3>
                <p className="text-sm">You've completed all lessons in this course.</p>
            </div>
        )}
    </motion.div>
);

/**
 * Course Progress Section
 */
const CourseProgressSection = ({ course, progress }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm p-6"
    >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-blue-500 mr-2">📊</span>
            Progress Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                    {progress?.skillsCompleted || 0}
                </div>
                <div className="text-sm text-gray-600">Skills Completed</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                    {progress?.lessonsCompleted || 0}
                </div>
                <div className="text-sm text-gray-600">Lessons Done</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                    {progress?.assessmentsPassed || 0}
                </div>
                <div className="text-sm text-gray-600">Assessments Passed</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                    {progress?.totalHoursSpent || 0}h
                </div>
                <div className="text-sm text-gray-600">Time Invested</div>
            </div>
        </div>
    </motion.div>
);

/**
 * Units Overview Section
 */
const UnitsOverviewSection = ({ units, userProgress, onUnitClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6"
    >
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-purple-500 mr-2">🏗️</span>
            Course Units
        </h2>
        
        {units.length > 0 ? (
            <div className="space-y-4">
                {units.map((unit, index) => (
                    <div
                        key={unit.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => onUnitClick(unit.id)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                    {index + 1}
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">{unit.name}</h3>
                                    <p className="text-sm text-gray-500">{unit.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">
                                    {unit.skillsCompleted || 0}/{unit.totalSkills || 0}
                                </span>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{
                                            width: `${Math.round(((unit.skillsCompleted || 0) / (unit.totalSkills || 1)) * 100)}%`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-3">📚</div>
                <p>Course units will appear here as you progress.</p>
            </div>
        )}
    </motion.div>
);

/**
 * Quick Stats Panel
 */
const QuickStatsPanel = ({ course, progress }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-6"
    >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
        </h3>
        <div className="space-y-3 text-sm">
            <div className="flex justify-between">
                <span className="text-gray-600">Enrollment Date:</span>
                <span className="font-medium">
                    {progress?.enrollmentDate ? new Date(progress.enrollmentDate).toLocaleDateString() : 'N/A'}
                </span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">Current Status:</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                    progress?.status === 'completed' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                }`}>
                    {progress?.status?.replace('_', ' ').toUpperCase() || 'IN PROGRESS'}
                </span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">Average Score:</span>
                <span className="font-medium">{progress?.overallScore || 0}%</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">Study Streak:</span>
                <span className="font-medium">{progress?.studyStreak || 0} days</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-600">Time Invested:</span>
                <span className="font-medium">{progress?.totalHoursSpent || 0}h</span>
            </div>
        </div>
    </motion.div>
);

/**
 * Assessments Section
 */
const AssessmentsSection = ({ assessments, onStartAssessment }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm p-6"
    >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-orange-500 mr-2">📝</span>
            Upcoming Assessments
        </h3>
        <div className="space-y-3">
            {assessments.map((assessment) => (
                <div key={assessment.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-gray-900">{assessment.name}</h4>
                            <p className="text-sm text-gray-500">
                                {assessment.timeLimit ? `${assessment.timeLimit} min` : 'No time limit'}
                            </p>
                        </div>
                        <button
                            onClick={() => onStartAssessment(assessment.id)}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                            Start
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </motion.div>
);

/**
 * Achievement Panel
 */
const AchievementPanel = ({ progress }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm p-6"
    >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-yellow-500 mr-2">🏆</span>
            Achievements
        </h3>
        <div className="space-y-2">
            {/* Mock achievements - replace with real data */}
            <div className="flex items-center space-x-2">
                <span className="text-lg">🎯</span>
                <span className="text-sm text-gray-600">First Lesson Complete</span>
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-lg">🔥</span>
                <span className="text-sm text-gray-600">7-Day Study Streak</span>
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-lg">⭐</span>
                <span className="text-sm text-gray-600">Perfect Score</span>
            </div>
        </div>
    </motion.div>
);

export default CourseDashboard;