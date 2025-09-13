import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Albanian Lesson Experience - 3-Phase Learning Flow
 * Phase A: Introduction (2-3 minutes)
 * Phase B: Practice (5-7 minutes)  
 * Phase C: Mastery Check (3-5 minutes)
 */
const AlbanianLesson = ({ lessonId, courseId, onComplete, onExit }) => {
    const [lesson, setLesson] = useState(null);
    const [phrases, setPhrases] = useState([]);
    const [currentPhase, setCurrentPhase] = useState('introduction'); // introduction, practice, mastery
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [userProgress, setUserProgress] = useState({
        phrasesLearned: [],
        pronunciationScores: {},
        practiceResults: {},
        masteryScore: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (lessonId) {
            loadLessonData();
        }
    }, [lessonId]);

    const loadLessonData = async () => {
        try {
            setLoading(true);
            
            // Load lesson content
            const response = await fetch(`/api/lessons/${lessonId}/content`);
            const data = await response.json();
            
            if (data.success) {
                setLesson(data.lesson);
                setPhrases(data.content || []);
            } else {
                console.error('Failed to load lesson:', data.error);
            }
        } catch (error) {
            console.error('Error loading lesson:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhaseComplete = (phaseData) => {
        setUserProgress(prev => ({
            ...prev,
            ...phaseData
        }));

        // Move to next phase
        if (currentPhase === 'introduction') {
            setCurrentPhase('practice');
            setCurrentPhraseIndex(0);
        } else if (currentPhase === 'practice') {
            setCurrentPhase('mastery');
            setCurrentPhraseIndex(0);
        } else {
            // Lesson complete
            handleLessonComplete();
        }
    };

    const handleLessonComplete = () => {
        const completionData = {
            lessonId,
            courseId,
            progress: userProgress,
            totalScore: calculateOverallScore(),
            timeSpent: Date.now(), // Simplified time tracking
            completed: true
        };

        // Dispatch custom event for dashboard refresh
        window.dispatchEvent(new CustomEvent('lessonComplete', { 
            detail: { courseId, lessonId, completionData } 
        }));

        if (onComplete) {
            onComplete(completionData);
        }
    };

    const calculateOverallScore = () => {
        const scores = Object.values(userProgress.pronunciationScores);
        const practiceScores = Object.values(userProgress.practiceResults);
        const allScores = [...scores, ...practiceScores, userProgress.masteryScore];
        return allScores.length > 0 
            ? Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length)
            : 0;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading Albanian lesson...</p>
                </div>
            </div>
        );
    }

    if (!lesson || !phrases.length) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Lesson Not Available</h2>
                    <p className="text-gray-600 mb-4">This lesson content is not ready yet.</p>
                    <button
                        onClick={onExit}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50">
            <div className="max-w-5xl mx-auto px-6 py-8">
                
                {/* Lesson Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {lesson.name}
                            </h1>
                            <p className="text-lg text-gray-600">
                                {lesson.skill_name} • Lesson {lesson.position || 1}
                            </p>
                        </div>
                        
                        <button
                            onClick={onExit}
                            className="text-gray-600 hover:text-gray-800 flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white"
                        >
                            <span>✕</span>
                            <span>Exit</span>
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Lesson Progress</span>
                            <span className="text-sm text-gray-500">
                                Phase {currentPhase === 'introduction' ? '1' : currentPhase === 'practice' ? '2' : '3'} of 3
                            </span>
                        </div>
                        <div className="flex space-x-2">
                            <div className={`flex-1 h-2 rounded ${
                                currentPhase !== 'introduction' ? 'bg-green-500' : 'bg-blue-500'
                            }`} />
                            <div className={`flex-1 h-2 rounded ${
                                currentPhase === 'mastery' ? 'bg-green-500' : 
                                currentPhase === 'practice' ? 'bg-blue-500' : 'bg-gray-300'
                            }`} />
                            <div className={`flex-1 h-2 rounded ${
                                currentPhase === 'mastery' ? 'bg-blue-500' : 'bg-gray-300'
                            }`} />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Introduction</span>
                            <span>Practice</span>
                            <span>Mastery Check</span>
                        </div>
                    </div>
                </motion.div>

                {/* Phase Content */}
                <AnimatePresence mode="wait">
                    {currentPhase === 'introduction' && (
                        <IntroductionPhase
                            key="introduction"
                            phrases={phrases}
                            onComplete={handlePhaseComplete}
                        />
                    )}
                    {currentPhase === 'practice' && (
                        <PracticePhase
                            key="practice"
                            phrases={phrases}
                            onComplete={handlePhaseComplete}
                        />
                    )}
                    {currentPhase === 'mastery' && (
                        <MasteryPhase
                            key="mastery"
                            phrases={phrases}
                            onComplete={handlePhaseComplete}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

/**
 * Phase A: Introduction - Present new phrases with context and audio
 */
const IntroductionPhase = ({ phrases, onComplete }) => {
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [phrasesLearned, setPhrasesLearned] = useState([]);

    const currentPhrase = phrases[currentPhraseIndex];

    const handlePlayPronunciation = () => {
        setIsPlaying(true);
        // Simulate audio playback
        setTimeout(() => setIsPlaying(false), 2000);
    };

    const handleNextPhrase = () => {
        if (!phrasesLearned.includes(currentPhrase.id)) {
            setPhrasesLearned(prev => [...prev, currentPhrase.id]);
        }

        if (currentPhraseIndex < phrases.length - 1) {
            setCurrentPhraseIndex(currentPhraseIndex + 1);
        } else {
            // Introduction phase complete
            onComplete({ phrasesLearned });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white rounded-2xl shadow-lg p-8"
        >
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    📚 Introduction
                </h2>
                <p className="text-gray-600">
                    Learn {phrases.length} new Albanian phrases with pronunciation and cultural context
                </p>
                <div className="mt-4 text-sm text-gray-500">
                    Phrase {currentPhraseIndex + 1} of {phrases.length}
                </div>
            </div>

            <div className="max-w-3xl mx-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPhraseIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center"
                    >
                        {/* Albanian Phrase */}
                        <div className="text-4xl font-bold text-red-600 mb-4">
                            {currentPhrase.target_phrase}
                        </div>
                        
                        {/* English Translation */}
                        <div className="text-2xl text-gray-700 mb-6">
                            {currentPhrase.english_phrase}
                        </div>

                        {/* Pronunciation Button */}
                        <button
                            onClick={handlePlayPronunciation}
                            className={`inline-flex items-center space-x-3 px-8 py-4 rounded-xl text-lg font-medium transition-all mb-6 ${
                                isPlaying 
                                    ? 'bg-green-100 text-green-700 scale-105' 
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105'
                            }`}
                        >
                            <span className="text-2xl">
                                {isPlaying ? '🔊' : '🎵'}
                            </span>
                            <span>{currentPhrase.pronunciation_guide}</span>
                        </button>

                        {/* Cultural Context */}
                        {currentPhrase.cultural_context && (
                            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 mb-8">
                                <div className="flex items-start space-x-3">
                                    <span className="text-amber-600 text-xl">💡</span>
                                    <div className="text-left">
                                        <div className="font-semibold text-amber-800 mb-2">Cultural Context</div>
                                        <div className="text-amber-700">
                                            {currentPhrase.cultural_context}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Next Button */}
                        <button
                            onClick={handleNextPhrase}
                            className="bg-red-600 hover:bg-red-700 text-white text-lg font-semibold px-8 py-3 rounded-xl transition-all transform hover:scale-105"
                        >
                            {currentPhraseIndex < phrases.length - 1 ? 'Next Phrase →' : 'Start Practice →'}
                        </button>
                    </motion.div>
                </AnimatePresence>

                {/* Progress Dots */}
                <div className="flex justify-center space-x-2 mt-8">
                    {phrases.map((_, index) => (
                        <div
                            key={index}
                            className={`w-3 h-3 rounded-full transition-all ${
                                index <= currentPhraseIndex 
                                    ? 'bg-red-600 scale-125' 
                                    : 'bg-gray-300'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

/**
 * Phase B: Practice - Interactive exercises with the phrases
 */
const PracticePhase = ({ phrases, onComplete }) => {
    const [currentExercise, setCurrentExercise] = useState(0);
    const [practiceResults, setPracticeResults] = useState({});
    const [showResult, setShowResult] = useState(false);
    const [userAnswer, setUserAnswer] = useState('');

    const exercises = [
        { type: 'translation', name: 'English to Albanian' },
        { type: 'pronunciation', name: 'Pronunciation Practice' },
        { type: 'context', name: 'Cultural Context' },
        { type: 'listening', name: 'Albanian to English' }
    ];

    const handleExerciseComplete = (score) => {
        const exerciseType = exercises[currentExercise].type;
        setPracticeResults(prev => ({
            ...prev,
            [exerciseType]: score
        }));

        setShowResult(true);
        setTimeout(() => {
            if (currentExercise < exercises.length - 1) {
                setCurrentExercise(currentExercise + 1);
                setShowResult(false);
                setUserAnswer('');
            } else {
                // Practice phase complete
                onComplete({ practiceResults: { ...practiceResults, [exerciseType]: score } });
            }
        }, 2000);
    };

    const currentExerciseType = exercises[currentExercise];

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white rounded-2xl shadow-lg p-8"
        >
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    🎯 Practice Time
                </h2>
                <p className="text-gray-600">
                    {currentExerciseType.name} • Exercise {currentExercise + 1} of {exercises.length}
                </p>
            </div>

            <div className="max-w-3xl mx-auto">
                {currentExerciseType.type === 'translation' && (
                    <TranslationExercise 
                        phrases={phrases} 
                        onComplete={handleExerciseComplete}
                        showResult={showResult}
                    />
                )}
                {currentExerciseType.type === 'pronunciation' && (
                    <PronunciationExercise 
                        phrases={phrases} 
                        onComplete={handleExerciseComplete}
                        showResult={showResult}
                    />
                )}
                {currentExerciseType.type === 'context' && (
                    <ContextExercise 
                        phrases={phrases} 
                        onComplete={handleExerciseComplete}
                        showResult={showResult}
                    />
                )}
                {currentExerciseType.type === 'listening' && (
                    <ListeningExercise 
                        phrases={phrases} 
                        onComplete={handleExerciseComplete}
                        showResult={showResult}
                    />
                )}
            </div>
        </motion.div>
    );
};

/**
 * Phase C: Mastery Check - Final assessment
 */
const MasteryPhase = ({ phrases, onComplete }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResult, setShowResult] = useState(false);
    const [masteryScore, setMasteryScore] = useState(0);

    // Create mastery questions from phrases
    const questions = phrases.slice(0, 5).map((phrase, index) => ({
        id: index,
        question: `What does "${phrase.english_phrase}" mean in Albanian?`,
        options: [
            phrase.target_phrase,
            phrases[(index + 1) % phrases.length]?.target_phrase || "Mirë",
            phrases[(index + 2) % phrases.length]?.target_phrase || "Faleminderit",
            phrases[(index + 3) % phrases.length]?.target_phrase || "Përshëndetje"
        ].sort(() => Math.random() - 0.5),
        correct: phrase.target_phrase
    }));

    const handleAnswer = (answer) => {
        const newAnswers = { ...answers, [currentQuestion]: answer };
        setAnswers(newAnswers);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            // Calculate final score
            const correct = questions.reduce((count, question, index) => {
                return count + (newAnswers[index] === question.correct ? 1 : 0);
            }, 0);
            const finalScore = Math.round((correct / questions.length) * 100);
            setMasteryScore(finalScore);
            setShowResult(true);
            
            setTimeout(() => {
                onComplete({ masteryScore: finalScore });
            }, 3000);
        }
    };

    if (showResult) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-lg p-8 text-center"
            >
                <div className="text-6xl mb-4">
                    {masteryScore >= 80 ? '🎉' : masteryScore >= 60 ? '👍' : '📚'}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Lesson Complete!
                </h2>
                <div className="text-xl text-gray-600 mb-6">
                    Your mastery score: <span className="font-bold text-red-600">{masteryScore}%</span>
                </div>
                <div className="text-gray-600">
                    {masteryScore >= 80 ? 'Excellent work! You\'ve mastered these phrases.' :
                     masteryScore >= 60 ? 'Good job! Keep practicing to improve.' :
                     'Keep practicing! Review the phrases and try again.'}
                </div>
            </motion.div>
        );
    }

    const currentQ = questions[currentQuestion];

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="bg-white rounded-2xl shadow-lg p-8"
        >
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    ✅ Mastery Check
                </h2>
                <p className="text-gray-600">
                    Question {currentQuestion + 1} of {questions.length}
                </p>
            </div>

            <div className="max-w-3xl mx-auto">
                <div className="text-xl text-gray-900 mb-8 text-center">
                    {currentQ.question}
                </div>

                <div className="space-y-4">
                    {currentQ.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleAnswer(option)}
                            className="w-full p-4 text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all"
                        >
                            <span className="font-medium text-red-600">{option}</span>
                        </button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// Exercise Components (simplified versions)
const TranslationExercise = ({ phrases, onComplete, showResult }) => {
    const [selectedPhrase] = useState(phrases[Math.floor(Math.random() * phrases.length)]);
    const [userInput, setUserInput] = useState('');

    const handleSubmit = () => {
        const similarity = userInput.toLowerCase().trim() === selectedPhrase.target_phrase.toLowerCase().trim();
        onComplete(similarity ? 95 : 70);
    };

    if (showResult) {
        return (
            <div className="text-center">
                <div className="text-4xl mb-4">✓</div>
                <div className="text-lg text-green-600">Great work on translation!</div>
            </div>
        );
    }

    return (
        <div className="text-center">
            <div className="text-xl mb-6">Translate to Albanian:</div>
            <div className="text-2xl font-semibold text-gray-900 mb-6">
                {selectedPhrase.english_phrase}
            </div>
            <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full p-3 text-center border border-gray-300 rounded-lg text-lg mb-6"
                placeholder="Type the Albanian translation..."
            />
            <button
                onClick={handleSubmit}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700"
            >
                Check Answer
            </button>
        </div>
    );
};

const PronunciationExercise = ({ phrases, onComplete, showResult }) => {
    const handlePronunciation = () => {
        // Simulate pronunciation scoring
        onComplete(Math.floor(Math.random() * 20) + 80);
    };

    if (showResult) {
        return (
            <div className="text-center">
                <div className="text-4xl mb-4">🔊</div>
                <div className="text-lg text-green-600">Excellent pronunciation!</div>
            </div>
        );
    }

    return (
        <div className="text-center">
            <div className="text-xl mb-6">Practice pronunciation:</div>
            <div className="text-3xl font-bold text-red-600 mb-4">
                {phrases[0].target_phrase}
            </div>
            <div className="text-lg text-blue-600 mb-6">
                {phrases[0].pronunciation_guide}
            </div>
            <button
                onClick={handlePronunciation}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700"
            >
                🎤 Record Pronunciation
            </button>
        </div>
    );
};

const ContextExercise = ({ phrases, onComplete, showResult }) => {
    if (showResult) {
        return (
            <div className="text-center">
                <div className="text-4xl mb-4">💡</div>
                <div className="text-lg text-green-600">You understand the cultural context!</div>
            </div>
        );
    }

    return (
        <div className="text-center">
            <div className="text-xl mb-6">Cultural Understanding:</div>
            <div className="text-lg text-gray-700 mb-6">
                When would you use: <strong>"{phrases[0].target_phrase}"</strong>?
            </div>
            <div className="space-y-3">
                <button 
                    onClick={() => onComplete(90)}
                    className="w-full p-3 bg-gray-50 hover:bg-blue-50 border rounded-lg"
                >
                    In formal situations
                </button>
                <button 
                    onClick={() => onComplete(90)}
                    className="w-full p-3 bg-gray-50 hover:bg-blue-50 border rounded-lg"
                >
                    In informal situations
                </button>
            </div>
        </div>
    );
};

const ListeningExercise = ({ phrases, onComplete, showResult }) => {
    const handleListen = () => {
        onComplete(Math.floor(Math.random() * 15) + 85);
    };

    if (showResult) {
        return (
            <div className="text-center">
                <div className="text-4xl mb-4">👂</div>
                <div className="text-lg text-green-600">Perfect listening comprehension!</div>
            </div>
        );
    }

    return (
        <div className="text-center">
            <div className="text-xl mb-6">Listen and identify:</div>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg mb-6">
                🔊 Play Audio
            </button>
            <div className="space-y-3">
                {phrases.slice(0, 3).map((phrase, index) => (
                    <button
                        key={index}
                        onClick={handleListen}
                        className="w-full p-3 bg-gray-50 hover:bg-blue-50 border rounded-lg"
                    >
                        {phrase.english_phrase}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AlbanianLesson;