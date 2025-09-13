import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Language Landing Experience - Dynamic for any language
 * Shows selected language course with sample phrases and cultural imagery
 */
const LanguageLanding = ({ 
    language = 'Albanian', 
    languageCode = 'sq',
    flag = '🇦🇱',
    courseData,
    onStartLearning, 
    onEnrollCourse,
    onSelectLanguage 
}) => {
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showCoursePreview, setShowCoursePreview] = useState(false);

    // Default sample phrases - would be replaced by courseData
    const defaultPhrases = [
        {
            target: "Si e ki emnin?",
            english: "What is your name?",
            pronunciation: "See eh kee em-neen?",
            cultural: "Essential for introductions in both formal and informal contexts"
        },
        {
            target: "Faleminderit shumë.",
            english: "Thank you very much.",
            pronunciation: "Fah-leh-meen-deh-reet shoom",
            cultural: "Widely used in both formal and informal settings"
        },
        {
            target: "Tung, qysh je?",
            english: "Hello, how are you?",
            pronunciation: "Toong, choosh yeh?",
            cultural: "Gheg Albanian greeting, more casual than standard Albanian"
        }
    ];

    const samplePhrases = courseData?.phrases || defaultPhrases;

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPhraseIndex((prev) => (prev + 1) % samplePhrases.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [samplePhrases.length]);

    const handlePlayPronunciation = () => {
        setIsPlaying(true);
        setTimeout(() => setIsPlaying(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-repeat bg-opacity-20" 
                     style={{backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\"><rect width=\"20\" height=\"20\" fill=\"none\"/><circle cx=\"10\" cy=\"10\" r=\"2\" fill=\"%23dc2626\" opacity=\"0.3\"/></svg>')"}}></div>
            </div>

            <div className="relative max-w-6xl mx-auto px-6 py-16">
                
                {/* Language Selector */}
                {onSelectLanguage && (
                    <div className="absolute top-8 right-6">
                        <button
                            onClick={() => onSelectLanguage()}
                            className="bg-white/80 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-lg hover:bg-white transition-colors shadow-sm"
                        >
                            Choose Language
                        </button>
                    </div>
                )}
                
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <span className="text-8xl">{flag}</span>
                            <div className="text-left">
                                <h1 className="text-5xl font-bold text-gray-900">
                                    Learn {language}
                                </h1>
                                <p className="text-xl text-gray-600 mt-2">
                                    Master a rare language with expert guidance
                                </p>
                            </div>
                        </div>

                        <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
                            Experience authentic {language} with university-level content. 
                            From basic conversations to cultural nuances, learn with proper pronunciation and context.
                        </p>
                    </motion.div>

                    {/* Live Phrase Demo */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg mb-12 max-w-4xl mx-auto"
                    >
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                            Experience {language} Right Now
                        </h2>
                        
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentPhraseIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="text-center"
                            >
                                <div className="text-3xl font-bold text-red-600 mb-3">
                                    {samplePhrases[currentPhraseIndex].target}
                                </div>
                                <div className="text-xl text-gray-700 mb-4">
                                    {samplePhrases[currentPhraseIndex].english}
                                </div>
                                <button
                                    onClick={handlePlayPronunciation}
                                    className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all mb-4 ${
                                        isPlaying 
                                            ? 'bg-green-100 text-green-700 scale-105' 
                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105'
                                    }`}
                                >
                                    <span className="text-xl">
                                        {isPlaying ? '🔊' : '🎵'}
                                    </span>
                                    <span>{samplePhrases[currentPhraseIndex].pronunciation}</span>
                                </button>
                                <div className="text-sm text-gray-600 bg-amber-50 rounded-lg p-4 border border-amber-200">
                                    <span className="font-medium">Cultural Note:</span> {samplePhrases[currentPhraseIndex].cultural}
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        <div className="flex justify-center space-x-2 mt-6">
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
                    </motion.div>

                    {/* Call to Action */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="space-y-6"
                    >
                        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                            <button
                                onClick={onStartLearning}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                            >
                                Start Learning {language} →
                            </button>
                        </div>
                        
                        <div className="text-center">
                            <button
                                onClick={() => setShowCoursePreview(!showCoursePreview)}
                                className="text-blue-600 hover:text-blue-700 font-medium underline"
                            >
                                {showCoursePreview ? 'Hide' : 'View'} Course Details
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Course Preview */}
                <AnimatePresence>
                    {showCoursePreview && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg overflow-hidden"
                        >
                            <div className="max-w-4xl mx-auto">
                                <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
                                    Course Overview
                                </h2>
                                
                                <div className="grid md:grid-cols-2 gap-8 mb-8">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4">📚 What You'll Learn</h3>
                                        <ul className="space-y-2 text-gray-700">
                                            <li>• Essential vocabulary and phrases</li>
                                            <li>• Proper pronunciation and accent</li>
                                            <li>• Grammar fundamentals</li>
                                            <li>• Cultural context and etiquette</li>
                                            <li>• Conversation skills</li>
                                        </ul>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4">⏱️ Course Details</h3>
                                        <ul className="space-y-2 text-gray-700">
                                            <li>• 11 comprehensive skills</li>
                                            <li>• 33 structured lessons</li>
                                            <li>• 264 phrases and expressions</li>
                                            <li>• University-level content</li>
                                            <li>• Self-paced learning</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <button
                                        onClick={onEnrollCourse}
                                        className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-10 py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                                    >
                                        Enroll in {language} Course
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LanguageLanding;