import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import ComprehensiveLessonCards from './ComprehensiveLessonCards';

/**
 * Professional Academic Lesson Component
 * Clean, modern design with consistent visual hierarchy
 */
const AcademicLesson = ({ lessonId, courseId, currentUser, onComplete, onExit }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [currentPhase, setCurrentPhase] = useState(0);
    const [lessonData, setLessonData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const phases = [
        {
            id: 'grammar',
            title: 'Learn',
            description: 'Core concepts and patterns',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            component: GrammarInstruction
        },
        {
            id: 'practice',
            title: 'Practice',
            description: 'Apply what you learned',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            ),
            component: GuidedPractice
        },
        {
            id: 'culture',
            title: 'Context',
            description: 'Cultural understanding',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            component: CulturalContext
        },
        {
            id: 'apply',
            title: 'Apply',
            description: 'Real-world scenarios',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
            ),
            component: IndependentApplication
        }
    ];

    // Load lesson data once on mount and when lessonId changes
    useEffect(() => {
        if (lessonId) {
            loadLessonData();
        }
    }, [lessonId]);

    // Initialize phase from URL only once on mount
    useEffect(() => {
        const urlPhase = searchParams.get('phase');
        if (urlPhase) {
            const phaseIndex = phases.findIndex(p => p.id === urlPhase);
            if (phaseIndex !== -1) {
                setCurrentPhase(phaseIndex);
            }
        }
    }, []); // Empty dependency array - only run once on mount

    const loadLessonData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // If no lesson ID provided, use demo/fallback content
            if (!lessonId) {
                console.log('No lesson ID provided, using demo content');
                setLessonData(generateDemoLesson());
                setLoading(false);
                return;
            }
            
            const response = await fetch(`/api/lessons/${lessonId}/academic-content`);
            if (!response.ok) {
                console.log('API call failed, using demo content');
                setLessonData(generateDemoLesson());
                setLoading(false);
                return;
            }
            
            const data = await response.json();
            if (!data.success) {
                console.log('API returned error, using demo content');
                setLessonData(generateDemoLesson());
                setLoading(false);
                return;
            }
            
            setLessonData(data.lesson);
            
        } catch (err) {
            console.log('Error loading lesson data, using demo content:', err);
            setLessonData(generateDemoLesson());
            setError(null); // Clear error since we have fallback
        } finally {
            setLoading(false);
        }
    };

    const generateDemoLesson = () => {
        return {
            id: 'demo-lesson-1',
            title: 'Family Members',
            subtitle: 'Anëtarët e Familjes',
            description: 'Learn essential vocabulary for Albanian family relationships',
            content: {
                grammar: {
                    title: 'Grammar Focus: Family Vocabulary',
                    content: 'In Albanian, family relationships are expressed with specific terms...',
                    examples: [
                        { albanian: 'babai', english: 'father' },
                        { albanian: 'nëna', english: 'mother' },
                        { albanian: 'djali', english: 'son' },
                        { albanian: 'vajza', english: 'daughter' }
                    ]
                }
            }
        };
    };

    const handlePhaseComplete = async (phaseData) => {
        try {
            // Record phase progress
            await fetch('/api/lessons/phase-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser?.id || 'anonymous',
                    lessonId,
                    courseId,
                    phaseIndex: currentPhase,
                    phaseType: phases[currentPhase].id,
                    phaseData,
                    timestamp: new Date().toISOString()
                })
            });

            if (currentPhase < phases.length - 1) {
                setCurrentPhase(currentPhase + 1);
            } else {
                // Lesson complete
                onComplete?.({
                    lessonId,
                    completedAt: new Date().toISOString(),
                    phases: phases.length
                });
            }
        } catch (err) {
            console.error('Error recording phase progress:', err);
            // Continue anyway
            if (currentPhase < phases.length - 1) {
                setCurrentPhase(currentPhase + 1);
            } else {
                onComplete?.({ lessonId });
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="max-w-4xl mx-auto pt-20">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">Loading lesson</h2>
                        <p className="text-slate-600">Preparing your Albanian lesson...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Check if this is a comprehensive lesson with rich content
    const isComprehensiveLesson = lessonData && (
        lessonData.vocabularySection || 
        lessonData.verbConjugations?.length > 0 ||
        lessonData.sentencePatterns?.length > 0
    );

    // If comprehensive lesson, use card-based interface
    if (isComprehensiveLesson) {
        return (
            <ComprehensiveLessonCards 
                lessonData={lessonData}
                onComplete={() => onComplete?.({ lessonId })}
                onExit={onExit}
            />
        );
    }

    const progress = ((currentPhase + 1) / phases.length) * 100;
    const CurrentPhaseComponent = phases[currentPhase].component;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={onExit}
                                className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span className="font-medium">Back</span>
                            </button>
                            <div className="h-6 border-l border-slate-300"></div>
                            <div>
                                <h1 className="font-semibold text-slate-900">{lessonData?.name}</h1>
                                <div className="flex items-center space-x-2 text-sm text-slate-600">
                                    <span>{lessonData?.courseName}</span>
                                    <span>•</span>
                                    <span>{phases[currentPhase].title}</span>
                                    {searchParams.get('section') && (
                                        <>
                                            <span>•</span>
                                            <span>Section {parseInt(searchParams.get('section')) + 1}</span>
                                        </>
                                    )}
                                    {searchParams.get('exercise') && (
                                        <>
                                            <span>•</span>
                                            <span>Exercise {parseInt(searchParams.get('exercise')) + 1}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-6">
                            {/* Progress indicators */}
                            <div className="hidden sm:flex items-center space-x-3">
                                {phases.map((phase, index) => (
                                    <div
                                        key={phase.id}
                                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            index === currentPhase
                                                ? 'bg-blue-100 text-blue-700'
                                                : index < currentPhase
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        <div className="flex-shrink-0">
                                            {index < currentPhase ? (
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                phase.icon
                                            )}
                                        </div>
                                        <span>{phase.title}</span>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Mobile progress */}
                            <div className="sm:hidden">
                                <div className="text-sm font-medium text-slate-900">
                                    {currentPhase + 1} of {phases.length}
                                </div>
                                <div className="text-xs text-slate-600">
                                    {phases[currentPhase].title}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="h-1 bg-slate-200">
                        <div 
                            className="h-1 bg-blue-600 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPhase}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <CurrentPhaseComponent
                            lesson={lessonData}
                            onComplete={handlePhaseComplete}
                            phase={phases[currentPhase]}
                        />
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

/**
 * Grammar Instruction Phase
 */
const GrammarInstruction = ({ lesson, onComplete, phase }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [currentSection, setCurrentSection] = useState(0);
    const [isReady, setIsReady] = useState(false);

    // Initialize section from URL only once on mount
    useEffect(() => {
        const sectionParam = searchParams.get('section');
        if (sectionParam) {
            const sectionIndex = parseInt(sectionParam);
            if (!isNaN(sectionIndex) && sectionIndex >= 0 && sectionIndex < 3) {
                setCurrentSection(sectionIndex);
            }
        }
    }, []); // Empty dependency array - only run once on mount

    const sections = [
        {
            title: 'Grammar Concepts',
            content: lesson?.grammarExplanation,
            type: 'explanation'
        },
        {
            title: 'Patterns & Rules',
            content: lesson?.patterns,
            type: 'patterns'
        },
        {
            title: 'Common Mistakes',
            content: lesson?.commonMistakes,
            type: 'mistakes'
        }
    ];

    const handleComplete = () => {
        onComplete({
            phase: 'grammar',
            sectionsCompleted: sections.length,
            timeSpent: Date.now(),
            understood: isReady
        });
    };

    const formatContent = (content) => {
        if (!content) return '';
        
        return content
            .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-slate-900 mb-4">$1</h2>')
            .replace(/^\*\*(.+?)\*\*$/gm, '<h3 class="text-lg font-semibold text-slate-800 mb-3">$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
            .replace(/^- (.+)$/gm, '<div class="flex items-start mb-2"><span class="text-blue-600 mr-3 mt-1">•</span><span class="text-slate-700">$1</span></div>')
            .replace(/\n\n/g, '<div class="mb-4"></div>')
            .replace(/\n/g, ' ');
    };

    return (
        <div className="space-y-8">
            {/* Phase header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                    {phase.icon}
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">{phase.title}</h2>
                <p className="text-lg text-slate-600">{phase.description}</p>
            </div>

            {/* Content sections */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {/* Section navigation */}
                <div className="border-b border-slate-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        {sections.map((section, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSection(index)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    currentSection === index
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                            >
                                {section.title}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Section content */}
                <div className="p-6">
                    <div className="prose prose-slate max-w-none">
                        <motion.div 
                            key={currentSection}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            dangerouslySetInnerHTML={{ 
                                __html: formatContent(sections[currentSection].content) 
                            }} 
                        />
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    {currentSection > 0 && (
                        <button
                            onClick={() => setCurrentSection(currentSection - 1)}
                            className="inline-flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Previous
                        </button>
                    )}
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="ready-check"
                            checked={isReady}
                            onChange={(e) => setIsReady(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <label htmlFor="ready-check" className="text-sm text-slate-700">
                            I understand these concepts
                        </label>
                    </div>

                    {currentSection < sections.length - 1 ? (
                        <button
                            onClick={() => setCurrentSection(currentSection + 1)}
                            className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            Next
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={handleComplete}
                            disabled={!isReady}
                            className="inline-flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                        >
                            Start Practice
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Guided Practice Phase
 */
const GuidedPractice = ({ lesson, onComplete, phase }) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [currentExercise, setCurrentExercise] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [score, setScore] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);

    const exercises = lesson?.guidedExercises || [];

    // Initialize exercise from URL only once when exercises are loaded
    useEffect(() => {
        if (exercises.length > 0) {
            const exerciseParam = searchParams.get('exercise');
            if (exerciseParam) {
                const exerciseIndex = parseInt(exerciseParam);
                if (!isNaN(exerciseIndex) && exerciseIndex >= 0 && exerciseIndex < exercises.length) {
                    setCurrentExercise(exerciseIndex);
                }
            }
        }
    }, [exercises.length]); // Only run when exercises are loaded

    const exercise = exercises[currentExercise];

    const handleAnswer = () => {
        if (!exercise) return;

        const isCorrect = exercise.type === 'multiple_choice'
            ? userAnswer === exercise.correct.toString()
            : userAnswer.toLowerCase().trim() === exercise.correct.toLowerCase().trim();

        const feedbackData = {
            correct: isCorrect,
            explanation: exercise.explanation,
            correctAnswer: exercise.correct
        };

        setFeedback(feedbackData);
        setShowFeedback(true);

        if (isCorrect) {
            setScore(score + 1);
        }
    };

    const handleNext = () => {
        if (currentExercise < exercises.length - 1) {
            setCurrentExercise(currentExercise + 1);
            setUserAnswer('');
            setFeedback(null);
            setShowFeedback(false);
        } else {
            onComplete({
                phase: 'practice',
                score,
                totalExercises: exercises.length,
                accuracy: Math.round((score / exercises.length) * 100)
            });
        }
    };

    if (!exercise) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-600 mb-4">No practice exercises available.</p>
                <button
                    onClick={() => onComplete({ phase: 'practice', score: 0 })}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Continue
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Phase header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                    {phase.icon}
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">{phase.title}</h2>
                <p className="text-lg text-slate-600">{phase.description}</p>
            </div>

            {/* Exercise counter */}
            <div className="text-center">
                <span className="text-sm font-medium text-slate-600">
                    Exercise {currentExercise + 1} of {exercises.length}
                </span>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentExercise + 1) / exercises.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Exercise */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-6">
                    {exercise.question}
                </h3>

                {exercise.type === 'multiple_choice' ? (
                    <div className="space-y-3">
                        {exercise.options?.map((option, index) => (
                            <label
                                key={index}
                                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                    userAnswer === index.toString()
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="answer"
                                    value={index}
                                    checked={userAnswer === index.toString()}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="ml-3 text-slate-900">{option}</span>
                            </label>
                        ))}
                    </div>
                ) : (
                    <input
                        type="text"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                )}

                {showFeedback && feedback && (
                    <div className={`mt-6 p-4 rounded-lg ${
                        feedback.correct 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-red-50 border border-red-200'
                    }`}>
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                {feedback.correct ? (
                                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <div className="ml-3">
                                <h4 className={`font-medium ${
                                    feedback.correct ? 'text-green-800' : 'text-red-800'
                                }`}>
                                    {feedback.correct ? 'Correct!' : 'Not quite right'}
                                </h4>
                                <p className={`text-sm mt-1 ${
                                    feedback.correct ? 'text-green-700' : 'text-red-700'
                                }`}>
                                    {feedback.explanation}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
                <div className="text-sm text-slate-600">
                    Score: {score}/{currentExercise + (showFeedback ? 1 : 0)}
                </div>
                
                <div className="space-x-3">
                    {!showFeedback ? (
                        <button
                            onClick={handleAnswer}
                            disabled={!userAnswer}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                        >
                            Check Answer
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                        >
                            {currentExercise < exercises.length - 1 ? 'Next Exercise' : 'Continue'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Cultural Context Phase
 */
const CulturalContext = ({ lesson, onComplete, phase }) => {
    const [completedSections, setCompletedSections] = useState([]);

    const sections = [
        {
            id: 'explanation',
            title: 'Cultural Background',
            content: lesson?.culturalExplanation,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            id: 'tips',
            title: 'Cultural Tips',
            content: lesson?.culturalTips,
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            )
        }
    ];

    const handleSectionComplete = (sectionId) => {
        if (!completedSections.includes(sectionId)) {
            setCompletedSections([...completedSections, sectionId]);
        }
    };

    const handleComplete = () => {
        onComplete({
            phase: 'culture',
            sectionsCompleted: completedSections.length,
            totalSections: sections.length
        });
    };

    const renderTips = (tips) => {
        if (!Array.isArray(tips)) return null;
        
        return tips.map((tip, index) => (
            <div key={index} className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                            tip.importance === 'high' ? 'bg-red-500' : 'bg-amber-500'
                        }`}></div>
                    </div>
                    <div className="ml-3">
                        <h4 className="font-medium text-amber-900 mb-1">{tip.tip}</h4>
                        <p className="text-sm text-amber-800 mb-2">{tip.culturalReason}</p>
                        <p className="text-sm text-amber-700">{tip.practicalApplication}</p>
                    </div>
                </div>
            </div>
        ));
    };

    return (
        <div className="space-y-8">
            {/* Phase header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-4">
                    {phase.icon}
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">{phase.title}</h2>
                <p className="text-lg text-slate-600">{phase.description}</p>
            </div>

            {/* Content sections */}
            <div className="space-y-6">
                {sections.map((section) => (
                    <div key={section.id} className="bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                                    {section.icon}
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    {section.title}
                                </h3>
                            </div>
                            
                            <div className="prose prose-slate max-w-none mb-6">
                                {section.id === 'tips' ? (
                                    renderTips(lesson?.culturalTips)
                                ) : (
                                    <p className="text-slate-700">{section.content}</p>
                                )}
                            </div>
                            
                            <button
                                onClick={() => handleSectionComplete(section.id)}
                                disabled={completedSections.includes(section.id)}
                                className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                                    completedSections.includes(section.id)
                                        ? 'bg-green-100 text-green-700 cursor-default'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                            >
                                {completedSections.includes(section.id) ? (
                                    <>
                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Complete
                                    </>
                                ) : (
                                    'Mark as Read'
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-end">
                <button
                    onClick={handleComplete}
                    disabled={completedSections.length < sections.length}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                    Continue to Application
                </button>
            </div>
        </div>
    );
};

/**
 * Independent Application Phase
 */
const IndependentApplication = ({ lesson, onComplete, phase }) => {
    const [responses, setResponses] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const scenarios = lesson?.applicationScenarios || [];

    const handleResponseChange = (scenarioIndex, value) => {
        setResponses({
            ...responses,
            [scenarioIndex]: value
        });
    };

    const handleSubmit = () => {
        setSubmitted(true);
        onComplete({
            phase: 'application',
            responses,
            scenariosCompleted: Object.keys(responses).length,
            totalScenarios: scenarios.length
        });
    };

    return (
        <div className="space-y-8">
            {/* Phase header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                    {phase.icon}
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-2">{phase.title}</h2>
                <p className="text-lg text-slate-600">{phase.description}</p>
            </div>

            {/* Scenarios */}
            <div className="space-y-6">
                {scenarios.map((scenario, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                Scenario {index + 1}
                            </h3>
                            <p className="text-slate-700 mb-4">{scenario.situation}</p>
                            <p className="text-slate-800 font-medium">{scenario.prompt}</p>
                        </div>
                        
                        <textarea
                            value={responses[index] || ''}
                            onChange={(e) => handleResponseChange(index, e.target.value)}
                            placeholder="Write your response here..."
                            rows="4"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                ))}
            </div>

            {/* Submit */}
            <div className="text-center">
                <button
                    onClick={handleSubmit}
                    disabled={Object.keys(responses).length === 0 || submitted}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                    {submitted ? 'Completed!' : 'Complete Lesson'}
                </button>
            </div>
        </div>
    );
};

export default AcademicLesson;