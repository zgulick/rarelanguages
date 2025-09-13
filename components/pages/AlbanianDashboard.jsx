import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Albanian Learning Dashboard - Main learning hub with progress and motivation
 * Provides smooth user journey with clear next steps and achievements
 */
const AlbanianDashboard = ({ courseId, currentUser, onStartLesson, onBack }) => {
    const [course, setCourse] = useState(null);
    const [skills, setSkills] = useState([]);
    const [userProgress, setUserProgress] = useState(null);
    const [nextLesson, setNextLesson] = useState(null);
    const [recentPhrases, setRecentPhrases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationData, setCelebrationData] = useState(null);

    useEffect(() => {
        if (courseId) {
            loadDashboardData();
        }
    }, [courseId]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load course data with progress - use simplified API that works with guests
            const response = await fetch(`/api/courses/${courseId}/simple-dashboard?userId=${currentUser?.id || 'guest'}`);
            const data = await response.json();

            if (data.success) {
                setCourse(data.course);
                setSkills(data.skills || []);
                setUserProgress(data.progress || {});
                setNextLesson(data.nextLesson);
                setRecentPhrases(data.recentPhrases || []);
            } else {
                console.error('Failed to load dashboard:', data.error);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleContinueLearning = () => {
        if (nextLesson && onStartLesson) {
            onStartLesson(nextLesson.id, courseId);
        }
    };
    
    // Refresh dashboard data when returning from lesson
    const refreshDashboard = () => {
        if (courseId) {
            loadDashboardData();
        }
    };
    
    // Listen for lesson completion to refresh data and show celebration
    useEffect(() => {
        const handleLessonComplete = (event) => {
            if (event.detail?.courseId === courseId) {
                // Show celebration with lesson data
                setCelebrationData(event.detail.completionData);
                setShowCelebration(true);
                
                // Hide celebration after 3 seconds and refresh dashboard
                setTimeout(() => {
                    setShowCelebration(false);
                    setCelebrationData(null);
                    refreshDashboard();
                }, 3000);
            }
        };
        
        window.addEventListener('lessonComplete', handleLessonComplete);
        return () => window.removeEventListener('lessonComplete', handleLessonComplete);
    }, [courseId]);

    const getProgressPercentage = () => {
        if (!skills.length) return 0;
        const completedSkills = skills.filter(skill => skill.isCompleted).length;
        return Math.round((completedSkills / skills.length) * 100);
    };

    const getStreakDays = () => {
        return userProgress?.streakDays || 0;
    };

    const getTotalPhrasesLearned = () => {
        return userProgress?.phrasesLearned || 0;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your Albanian journey...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-6 py-8">
                
                {/* Header with greeting and progress */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                                🇦🇱 Gheg Albanian Learning Journey
                            </h1>
                            <p className="text-xl text-gray-600">
                                Mirë se erdhe! Welcome back to your Albanian studies
                            </p>
                        </div>
                        
                        {onBack && (
                            <button
                                onClick={onBack}
                                className="text-gray-600 hover:text-gray-800 flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white"
                            >
                                <span>←</span>
                                <span>Course Catalog</span>
                            </button>
                        )}
                    </div>

                    {/* Progress Overview */}
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Your Progress</h2>
                            <div className="text-3xl font-bold text-red-600">
                                {getProgressPercentage()}%
                            </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${getProgressPercentage()}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="bg-gradient-to-r from-red-500 to-red-600 h-4 rounded-full"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {skills.filter(s => s.isCompleted).length} / {skills.length}
                                </div>
                                <div className="text-sm text-gray-600">Skills Completed</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {getTotalPhrasesLearned()} / 264
                                </div>
                                <div className="text-sm text-gray-600">Phrases Learned</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                                    {getStreakDays()} <span className="text-orange-500 ml-1">🔥</span>
                                </div>
                                <div className="text-sm text-gray-600">Day Streak</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {userProgress?.totalHours || 0}h
                                </div>
                                <div className="text-sm text-gray-600">Study Time</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Continue Learning Section */}
                {nextLesson && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-8"
                    >
                        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg p-8 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold mb-2">📚 Continue Learning</h2>
                                    <h3 className="text-xl mb-2">{nextLesson.name}</h3>
                                    <p className="text-red-100 mb-4">
                                        {nextLesson.description || `Ready for your next Albanian lesson? Let's learn some new phrases!`}
                                    </p>
                                    <div className="flex items-center text-red-100 text-sm mb-6">
                                        <span className="mr-4">⏱️ ~{nextLesson.estimatedMinutes || 15} minutes</span>
                                        <span className="mr-4">📈 Level {nextLesson.difficultyLevel || 3}/10</span>
                                        <span>🎯 {nextLesson.contentAreas?.join(', ') || 'Vocabulary, Grammar'}</span>
                                    </div>
                                </div>
                                
                                <div className="ml-8">
                                    <button
                                        onClick={handleContinueLearning}
                                        className="bg-white text-red-600 font-bold text-lg px-8 py-4 rounded-xl hover:bg-red-50 transition-all transform hover:scale-105 shadow-lg"
                                    >
                                        ▶️ Start Lesson
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Skills Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-8"
                >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        🏆 Your Albanian Skills
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {skills.map((skill, index) => (
                            <SkillCard 
                                key={skill.id} 
                                skill={skill} 
                                index={index}
                                onSelectSkill={(skillId) => console.log('Navigate to skill:', skillId)}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Recent Phrases Section */}
                {recentPhrases.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">💬 Recent Phrases Learned</h2>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {recentPhrases.slice(0, 8).map((phrase, index) => (
                                <PhraseCard key={index} phrase={phrase} />
                            ))}
                        </div>
                    </motion.div>
                )}
                
                {/* Lesson Completion Celebration Overlay */}
                <AnimatePresence>
                    {showCelebration && celebrationData && (
                        <LessonCompletionCelebration 
                            completionData={celebrationData}
                            onClose={() => setShowCelebration(false)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

/**
 * Individual Skill Card Component
 */
const SkillCard = ({ skill, index, onSelectSkill }) => {
    const getSkillIcon = (skillName) => {
        if (skillName.includes('Phonological')) return '🔤';
        if (skillName.includes('Grammar')) return '📝';
        if (skillName.includes('Vocabulary')) return '💬';
        if (skillName.includes('Complex')) return '🔗';
        if (skillName.includes('Academic')) return '🎓';
        if (skillName.includes('Register')) return '🎭';
        if (skillName.includes('Discourse')) return '🔄';
        if (skillName.includes('Pragmatic')) return '🤝';
        if (skillName.includes('Morphosyntactic')) return '⚙️';
        if (skillName.includes('Critical')) return '🧠';
        if (skillName.includes('Independent')) return '🎯';
        return '📚';
    };

    const getStatusColor = () => {
        if (skill.isCompleted) return 'from-green-500 to-green-600';
        if (skill.isActive) return 'from-blue-500 to-blue-600';
        return 'from-gray-400 to-gray-500';
    };

    const getStatusText = () => {
        if (skill.isCompleted) return 'Completed ✓';
        if (skill.isActive) return `${skill.completedLessons || 0}/${skill.totalLessons || 8} lessons`;
        return 'Locked 🔒';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all border-2 ${
                skill.isActive ? 'border-blue-200' : 'border-gray-200'
            } ${skill.isCompleted ? 'bg-green-50' : ''}`}
        >
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{getSkillIcon(skill.name)}</span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r text-white ${getStatusColor()}`}>
                        {getStatusText()}
                    </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {skill.name}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {skill.description}
                </p>

                {skill.isActive && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{skill.completedLessons || 0}/{skill.totalLessons || 8}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${((skill.completedLessons || 0) / (skill.totalLessons || 8)) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                <button
                    onClick={() => onSelectSkill(skill.id)}
                    disabled={!skill.isActive && !skill.isCompleted}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                        skill.isCompleted
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : skill.isActive
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {skill.isCompleted ? 'Review Skill' : skill.isActive ? 'Continue' : 'Locked'}
                </button>
            </div>
        </motion.div>
    );
};

/**
 * Individual Phrase Card Component
 */
const PhraseCard = ({ phrase }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <motion.div
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
            whileHover={{ scale: 1.02 }}
        >
            <div className="p-4">
                <AnimatePresence mode="wait">
                    {!isFlipped ? (
                        <motion.div
                            key="albanian"
                            initial={{ opacity: 0, rotateY: 90 }}
                            animate={{ opacity: 1, rotateY: 0 }}
                            exit={{ opacity: 0, rotateY: -90 }}
                            className="text-center"
                        >
                            <div className="text-lg font-semibold text-red-600 mb-2">
                                {phrase.targetPhrase}
                            </div>
                            <div className="text-xs text-gray-500">Click to see English</div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="english"
                            initial={{ opacity: 0, rotateY: 90 }}
                            animate={{ opacity: 1, rotateY: 0 }}
                            exit={{ opacity: 0, rotateY: -90 }}
                            className="text-center"
                        >
                            <div className="text-lg font-semibold text-gray-900 mb-2">
                                {phrase.englishPhrase}
                            </div>
                            <div className="text-xs text-blue-600">
                                {phrase.pronunciationGuide}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

/**
 * Lesson Completion Celebration Component
 */
const LessonCompletionCelebration = ({ completionData, onClose }) => {
    const { totalScore, progress } = completionData;
    
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-2xl p-12 text-center max-w-2xl mx-4 shadow-2xl"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="text-6xl mb-4"
                >
                    {totalScore >= 90 ? '🎉' : totalScore >= 80 ? '🌟' : totalScore >= 70 ? '👏' : '💪'}
                </motion.div>
                <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-bold text-gray-900 mb-4"
                >
                    Përgëzime! 
                </motion.h2>
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-lg text-gray-600 mb-6"
                >
                    You completed your Albanian lesson!
                </motion.p>
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-r from-red-50 to-blue-50 rounded-xl p-6 mb-6"
                >
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-red-600">{totalScore}%</div>
                            <div className="text-sm text-gray-600">Final Score</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-600">
                                {progress?.phrasesLearned?.length || 5}
                            </div>
                            <div className="text-sm text-gray-600">Phrases Learned</div>
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.0 }}
                    className="text-center"
                >
                    <div className="text-gray-600 mb-4">
                        {totalScore >= 90 ? 'Outstanding work! You\'re mastering Albanian!' :
                         totalScore >= 80 ? 'Excellent progress! Keep it up!' :
                         totalScore >= 70 ? 'Good job! You\'re learning well!' :
                         'Great effort! Every lesson makes you stronger!'}
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Continue Learning →
                    </button>
                </motion.div>
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ 
                                x: Math.random() * 400,
                                y: 400,
                                opacity: 0,
                                rotate: 0
                            }}
                            animate={{ 
                                y: -100,
                                opacity: [0, 1, 0],
                                rotate: 360
                            }}
                            transition={{ 
                                duration: 3,
                                delay: i * 0.2,
                                ease: "easeOut"
                            }}
                            className="absolute text-2xl"
                        >
                            {['🎉', '⭐', '🏆', '💫', '🎊'][i % 5]}
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AlbanianDashboard;