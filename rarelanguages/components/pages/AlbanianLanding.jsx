import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Albanian Landing Experience - Immediate Value & Smooth Onboarding
 * Shows Albanian course with sample phrases and beautiful cultural imagery
 */
const AlbanianLanding = ({ onStartLearning, onEnrollCourse }) => {
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showCoursePreview, setShowCoursePreview] = useState(false);

    // Sample phrases from our actual Albanian content
    const samplePhrases = [
        {
            albanian: "Si e ki emnin?",
            english: "What is your name?",
            pronunciation: "See eh kee em-neen?",
            cultural: "Essential for introductions in both formal and informal contexts"
        },
        {
            albanian: "Faleminderit shumë.",
            english: "Thank you very much.",
            pronunciation: "Fah-leh-meen-deh-reet shoom",
            cultural: "Widely used in both formal and informal settings"
        },
        {
            albanian: "Tung, qysh je?",
            english: "Hello, how are you?",
            pronunciation: "Toong, choosh yeh?",
            cultural: "Used in informal settings, important for initial interactions"
        },
        {
            albanian: "Prej kah je?",
            english: "Where are you from?",
            pronunciation: "Prey kah yeh?",
            cultural: "Important for cultural exchanges and introductions"
        }
    ];

    // Auto-cycle through sample phrases
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPhraseIndex((prev) => (prev + 1) % samplePhrases.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const handlePlayPronunciation = () => {
        setIsPlaying(true);
        // Simulate audio playback
        setTimeout(() => setIsPlaying(false), 2000);
    };

    const handleBeginLearning = () => {
        setShowCoursePreview(true);
    };

    const handleStartFreeTrial = () => {
        if (onStartLearning) {
            onStartLearning();
        }
    };

    if (showCoursePreview) {
        return <CoursePreview onEnroll={handleStartFreeTrial} onBack={() => setShowCoursePreview(false)} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
            {/* Albanian Cultural Header Pattern */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-red-600 to-red-800 opacity-10">
                <div className="absolute inset-0 bg-repeat bg-opacity-20" 
                     style={{backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\"><rect width=\"20\" height=\"20\" fill=\"none\"/><circle cx=\"10\" cy=\"10\" r=\"2\" fill=\"%23dc2626\" opacity=\"0.3\"/></svg>')"}}></div>
            </div>

            <div className="relative w-full mx-auto px-8 py-12">
                
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center justify-center mb-6">
                            <span className="text-6xl mr-4">🇦🇱</span>
                            <div>
                                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-2">
                                    Learn Gheg Albanian
                                </h1>
                                <p className="text-2xl text-red-600 font-medium">
                                    Mëso Shqip Gegë
                                </p>
                            </div>
                        </div>

                        <p className="text-xl text-gray-600 max-w-5xl mx-auto mb-8">
                            Master the authentic Gheg dialect spoken in Kosovo with university-level content. 
                            From basic greetings to complex conversations, learn with cultural context and proper pronunciation.
                        </p>

                        <div className="flex items-center justify-center space-x-8 text-gray-700 mb-8">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-600">264</div>
                                <div className="text-sm">Phrases</div>
                            </div>
                            <div className="w-1 h-8 bg-gray-300"></div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-600">11</div>
                                <div className="text-sm">Skills</div>
                            </div>
                            <div className="w-1 h-8 bg-gray-300"></div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-600">33</div>
                                <div className="text-sm">Lessons</div>
                            </div>
                            <div className="w-1 h-8 bg-gray-300"></div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-600">A1</div>
                                <div className="text-sm">CEFR Level</div>
                            </div>
                        </div>

                        <motion.button
                            onClick={handleBeginLearning}
                            className="bg-red-600 hover:bg-red-700 text-white text-xl font-semibold px-12 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Begin Learning Albanian
                        </motion.button>

                        <p className="text-sm text-gray-500 mt-4">
                            Try 3 lessons free • No signup required
                        </p>
                    </motion.div>
                </div>

                {/* Live Phrase Demo */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="max-w-6xl mx-auto"
                >
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
                        See What You'll Learn
                    </h2>

                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentPhraseIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-red-600 mb-4">
                                        {samplePhrases[currentPhraseIndex].albanian}
                                    </div>
                                    
                                    <div className="text-2xl text-gray-700 mb-4">
                                        {samplePhrases[currentPhraseIndex].english}
                                    </div>

                                    <button
                                        onClick={handlePlayPronunciation}
                                        className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
                                            isPlaying 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        }`}
                                    >
                                        <span className="text-lg">
                                            {isPlaying ? '🔊' : '🎵'}
                                        </span>
                                        <span className="font-medium">
                                            {samplePhrases[currentPhraseIndex].pronunciation}
                                        </span>
                                    </button>

                                    <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                        <div className="flex items-start space-x-2">
                                            <span className="text-amber-600 text-lg">💡</span>
                                            <div>
                                                <div className="font-medium text-amber-800 mb-1">Cultural Context</div>
                                                <div className="text-amber-700 text-sm">
                                                    {samplePhrases[currentPhraseIndex].cultural}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Phrase navigation dots */}
                        <div className="flex justify-center space-x-2 mt-8">
                            {samplePhrases.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentPhraseIndex(index)}
                                    className={`w-3 h-3 rounded-full transition-all ${
                                        index === currentPhraseIndex 
                                            ? 'bg-red-600 scale-125' 
                                            : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Learning Features */}
                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <div className="text-center">
                            <div className="text-4xl mb-4">🎯</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Kosovo Gheg Focus
                            </h3>
                            <p className="text-gray-600">
                                Learn authentic Gheg Albanian as spoken in Kosovo, with proper cultural context and regional variations.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="text-4xl mb-4">🎓</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                University Level
                            </h3>
                            <p className="text-gray-600">
                                Academic-quality content following CEFR standards with proper linguistic progression and theory.
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="text-4xl mb-4">🗣️</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Pronunciation Guide
                            </h3>
                            <p className="text-gray-600">
                                Every phrase includes detailed pronunciation guidance and cultural usage notes.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

/**
 * Course Preview Component - Detailed course overview with enrollment
 */
const CoursePreview = ({ onEnroll, onBack }) => {
    const [selectedSkill, setSelectedSkill] = useState(0);

    const skillsPreview = [
        {
            name: "Phonological Awareness",
            description: "Master Albanian sounds and pronunciation patterns",
            lessons: 8,
            difficulty: "Beginner",
            icon: "🔤"
        },
        {
            name: "Core Grammar Structures", 
            description: "Learn essential grammar patterns and sentence construction",
            lessons: 8,
            difficulty: "Beginner",
            icon: "📝"
        },
        {
            name: "High-Frequency Vocabulary",
            description: "Build your foundation with the most common 1000 words",
            lessons: 8,
            difficulty: "Beginner",
            icon: "💬"
        },
        {
            name: "Complex Sentences",
            description: "Construct sophisticated sentences with subordination",
            lessons: 8,
            difficulty: "Intermediate",
            icon: "🔗"
        }
    ];

    const learningObjectives = [
        "Understand and use familiar everyday expressions and basic phrases",
        "Introduce yourself and others, ask and answer personal questions",
        "Interact in a simple way with native speakers",
        "Read and understand simple texts and signs",
        "Write short, simple postcards and fill out forms",
        "Demonstrate cultural awareness in Albanian-speaking contexts"
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
        >
            <div className="w-full mx-auto px-8 py-8">
                
                {/* Header with back button */}
                <div className="flex items-center mb-8">
                    <button
                        onClick={onBack}
                        className="text-gray-600 hover:text-gray-800 flex items-center space-x-2"
                    >
                        <span>←</span>
                        <span>Back</span>
                    </button>
                </div>

                {/* Course Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        🇦🇱 Gheg Albanian 1: Intensive Academic Introduction
                    </h1>
                    <p className="text-xl text-gray-600 max-w-6xl mx-auto mb-6">
                        This course provides an intensive introduction to Gheg Albanian, focusing on foundational 
                        linguistic and communicative competencies. Students will engage with authentic materials 
                        to develop basic proficiency while gaining cultural insights.
                    </p>
                    <div className="flex justify-center items-center space-x-4 text-lg">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">CEFR A1</span>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">11 Skills</span>
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">33 Lessons</span>
                        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">~40 Hours</span>
                    </div>
                </div>

                {/* Skills Preview Grid */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Skills</h2>
                        <div className="space-y-3">
                            {skillsPreview.map((skill, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedSkill(index)}
                                    className={`w-full p-4 rounded-lg text-left transition-all ${
                                        selectedSkill === index
                                            ? 'bg-blue-100 border-2 border-blue-500'
                                            : 'bg-white border-2 border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">{skill.icon}</span>
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-900">{skill.name}</div>
                                            <div className="text-sm text-gray-600">{skill.lessons} lessons • {skill.difficulty}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                            <div className="text-center py-4 text-gray-500 text-sm">
                                + 7 more advanced skills
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Objectives</h2>
                        <div className="bg-white rounded-xl p-6">
                            <div className="space-y-4">
                                {learningObjectives.map((objective, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                        <span className="text-green-500 mt-1">✓</span>
                                        <span className="text-gray-700">{objective}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enrollment CTA */}
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Ready to Start Your Albanian Journey?
                    </h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Join thousands learning authentic Gheg Albanian with our university-level curriculum
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={onEnroll}
                            className="bg-red-600 hover:bg-red-700 text-white text-xl font-semibold px-12 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                        >
                            🚀 Start Learning Now - Free Trial
                        </button>
                        
                        <p className="text-sm text-gray-500">
                            No credit card required • Cancel anytime • Start with 3 free lessons
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AlbanianLanding;