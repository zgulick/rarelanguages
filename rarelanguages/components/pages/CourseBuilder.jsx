import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * "Build My Course" Interface
 * Main UI for automated course generation
 */
const CourseBuilder = () => {
    const [formData, setFormData] = useState({
        languageCode: '',
        languageName: '',
        nativeName: '',
        level: 1
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const rareLanguages = [
        { code: 'gheg-al', name: 'Gheg Albanian', nativeName: 'Shqip (Gegë)' },
        { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },
        { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
        { code: 'mi', name: 'Māori', nativeName: 'Te Reo Māori' },
        { code: 'mt', name: 'Maltese', nativeName: 'Malti' },
        { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
        { code: 'fo', name: 'Faroese', nativeName: 'Føroyskt' },
        { code: 'gd', name: 'Scottish Gaelic', nativeName: 'Gàidhlig' },
        { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
        { code: 'kw', name: 'Cornish', nativeName: 'Kernewek' }
    ];

    const courseLevels = [
        { level: 1, name: 'Foundations', cefr: 'A1', description: 'Basic greetings, essential vocabulary, simple conversations' },
        { level: 2, name: 'Development', cefr: 'A2', description: 'Practical communication, past/future tenses, cultural context' },
        { level: 3, name: 'Fluency', cefr: 'B1', description: 'Complex conversations, opinions, cultural competency' },
        { level: 4, name: 'Mastery', cefr: 'B2', description: 'Advanced fluency, idioms, cultural nuances' }
    ];

    const handleLanguageSelect = (language) => {
        setFormData({
            ...formData,
            languageCode: language.code,
            languageName: language.name,
            nativeName: language.nativeName
        });
        setError(null);
        setResult(null);
    };

    const handleCustomLanguage = (field, value) => {
        setFormData({
            ...formData,
            [field]: value
        });
    };

    const generateCourse = async () => {
        if (!formData.languageCode || !formData.languageName || !formData.nativeName) {
            setError('Please fill in all language information');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setResult(null);
        setGenerationProgress({
            phase: 'starting',
            message: 'Initializing course generation...',
            progress: 0
        });

        try {
            // Simulate progress updates
            const progressUpdates = [
                { phase: 'planning', message: 'Creating curriculum structure...', progress: 20 },
                { phase: 'skills', message: 'Generating skills and lessons...', progress: 40 },
                { phase: 'content', message: 'Creating lesson content...', progress: 60 },
                { phase: 'assessments', message: 'Building assessments...', progress: 80 },
                { phase: 'finalizing', message: 'Finalizing course...', progress: 95 }
            ];

            let progressIndex = 0;
            const progressInterval = setInterval(() => {
                if (progressIndex < progressUpdates.length) {
                    setGenerationProgress(progressUpdates[progressIndex]);
                    progressIndex++;
                }
            }, 3000);

            const response = await fetch('/api/courses/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Course generation failed');
            }

            const result = await response.json();
            setResult(result);
            setGenerationProgress({
                phase: 'complete',
                message: 'Course generation completed!',
                progress: 100
            });

        } catch (err) {
            console.error('Generation error:', err);
            setError(err.message);
            setGenerationProgress(null);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Build My Course
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Create a complete academic language course in minutes. 
                        Select any rare language and our AI will generate a full curriculum 
                        with lessons, exercises, and cultural context.
                    </p>
                </div>

                {/* Main Interface */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                    
                    {/* Language Selection */}
                    <div className="p-8 border-b border-gray-200">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                            1. Choose Your Language
                        </h2>
                        
                        {/* Popular Rare Languages */}
                        <div className="mb-6">
                            <h3 className="text-lg font-medium text-gray-700 mb-4">Popular Rare Languages</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {rareLanguages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleLanguageSelect(lang)}
                                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                            formData.languageCode === lang.code
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                        }`}
                                    >
                                        <div className="font-semibold">{lang.name}</div>
                                        <div className="text-xs opacity-75">{lang.nativeName}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Language Input */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium text-gray-700 mb-4">Or Enter Custom Language</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Language Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., syr, bre, csb"
                                        value={formData.languageCode}
                                        onChange={(e) => handleCustomLanguage('languageCode', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        English Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Syriac, Breton, Kashubian"
                                        value={formData.languageName}
                                        onChange={(e) => handleCustomLanguage('languageName', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Native Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., ܣܘܪܝܝܐ, Brezhoneg, Kaszëbsczi"
                                        value={formData.nativeName}
                                        onChange={(e) => handleCustomLanguage('nativeName', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Course Level Selection */}
                    <div className="p-8 border-b border-gray-200">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                            2. Select Course Level
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {courseLevels.map((level) => (
                                <button
                                    key={level.level}
                                    onClick={() => setFormData({...formData, level: level.level})}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                                        formData.level === level.level
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="font-semibold text-lg text-gray-900">
                                        Level {level.level}: {level.name}
                                    </div>
                                    <div className="text-sm font-medium text-blue-600 mb-2">
                                        CEFR {level.cefr}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {level.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generation Section */}
                    <div className="p-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                            3. Generate Your Course
                        </h2>

                        {/* Course Preview */}
                        {formData.languageName && (
                            <div className="bg-gray-50 rounded-lg p-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Course Preview
                                </h3>
                                <div className="text-gray-700">
                                    <div className="font-medium text-xl mb-1">
                                        {formData.languageName} {formData.level}: {courseLevels[formData.level - 1]?.name}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Language: {formData.languageName} ({formData.nativeName}) • 
                                        Level: {formData.level} • 
                                        CEFR: {courseLevels[formData.level - 1]?.cefr}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Generation Button */}
                        <button
                            onClick={generateCourse}
                            disabled={isGenerating || !formData.languageCode || !formData.languageName}
                            className={`w-full py-4 px-8 rounded-lg text-white font-semibold text-lg transition-all ${
                                isGenerating || !formData.languageCode || !formData.languageName
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 transform hover:scale-105'
                            }`}
                        >
                            {isGenerating ? 'Generating Course...' : '🚀 Build My Course'}
                        </button>

                        {/* Progress Display */}
                        <AnimatePresence>
                            {generationProgress && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="mt-6 bg-blue-50 rounded-lg p-6"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-medium text-blue-900">
                                            {generationProgress.message}
                                        </span>
                                        <span className="text-sm text-blue-700">
                                            {generationProgress.progress}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2">
                                        <motion.div
                                            className="bg-blue-600 h-2 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${generationProgress.progress}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error Display */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4"
                            >
                                <div className="flex">
                                    <div className="text-red-400">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">
                                            Generation Failed
                                        </h3>
                                        <p className="mt-1 text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Success Result */}
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6"
                            >
                                <div className="flex items-center mb-4">
                                    <div className="text-green-400 mr-3">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-green-900">
                                        Course Generated Successfully! 🎉
                                    </h3>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="bg-white rounded-lg p-3 text-center">
                                        <div className="text-2xl font-bold text-green-600">{result.skills}</div>
                                        <div className="text-sm text-gray-600">Skills</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 text-center">
                                        <div className="text-2xl font-bold text-green-600">{result.lessons}</div>
                                        <div className="text-sm text-gray-600">Lessons</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 text-center">
                                        <div className="text-2xl font-bold text-green-600">{result.contentItems}</div>
                                        <div className="text-sm text-gray-600">Content Items</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 text-center">
                                        <div className="text-2xl font-bold text-green-600">{result.generationTimeSeconds}s</div>
                                        <div className="text-sm text-gray-600">Generation Time</div>
                                    </div>
                                </div>

                                <div className="text-sm text-green-700 mb-4">
                                    <strong>Course:</strong> {result.courseName}<br/>
                                    <strong>Estimated Cost:</strong> ${result.estimatedCost?.toFixed(4) || '0.05'}
                                </div>

                                <div className="flex space-x-4">
                                    <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                                        Start Learning
                                    </button>
                                    <button className="flex-1 bg-white text-green-600 border border-green-600 py-2 px-4 rounded-lg hover:bg-green-50 transition-colors">
                                        View Course Details
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseBuilder;