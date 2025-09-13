import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PedagogicalLevels, 
  CulturalCompetencyFramework,
  determinePedagogicalLevel,
  generateMicroProgression,
  assessCulturalCompetency,
  AlbanianCulturalThemes
} from '../../lib/pedagogicalProgression';

/**
 * Enhanced Academic Lesson Structure - Phase 3 Integration
 * 4-phase university-style lesson with pedagogical micro-progressions and cultural competency
 * Phases: Grammar Instruction → Guided Practice → Cultural Context → Independent Application
 * Each phase now includes Recognition → Guided Practice → Independent Production → Cultural Integration
 */
const AcademicLesson = ({ lesson, courseId, currentUser, onComplete, onExit }) => {
    const [currentPhase, setCurrentPhase] = useState(0);
    const [phaseResults, setPhaseResults] = useState([]);
    const [lessonData, setLessonData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Phase 3 Enhancement: Pedagogical Progression State
    const [currentMicroStep, setCurrentMicroStep] = useState(0);
    const [pedagogicalLevel, setPedagogicalLevel] = useState(PedagogicalLevels.RECOGNITION);
    const [microProgression, setMicroProgression] = useState(null);
    const [culturalCompetencyLevel, setCulturalCompetencyLevel] = useState(CulturalCompetencyFramework.AWARENESS);
    const [culturalResponses, setCulturalResponses] = useState([]);
    const [userPerformanceHistory, setUserPerformanceHistory] = useState([]);

    const lessonPhases = [
        {
            type: 'grammar_introduction',
            component: GrammarInstruction,
            title: 'Grammar Instruction',
            description: 'Learn the rules and patterns',
            icon: '📚',
            color: 'blue',
            pedagogicalFocus: 'recognition_and_understanding',
            culturalIntegration: 'basic'
        },
        {
            type: 'guided_practice', 
            component: GuidedPractice,
            title: 'Guided Practice',
            description: 'Practice with immediate feedback',
            icon: '✏️',
            color: 'green',
            pedagogicalFocus: 'guided_application',
            culturalIntegration: 'moderate'
        },
        {
            type: 'cultural_context',
            component: CulturalContext,
            title: 'Cultural Context', 
            description: 'Understand cultural applications',
            icon: '🏛️',
            color: 'yellow',
            pedagogicalFocus: 'cultural_competency_development',
            culturalIntegration: 'high'
        },
        {
            type: 'independent_application',
            component: IndependentApplication,
            title: 'Apply Your Knowledge',
            description: 'Use what you learned in real scenarios',
            icon: '🎯',
            color: 'purple',
            pedagogicalFocus: 'independent_production',
            culturalIntegration: 'full'
        }
    ];

    useEffect(() => {
        if (lesson) {
            loadLessonData();
            initializePedagogicalProgression();
        }
    }, [lesson]);

    // Phase 3: Initialize pedagogical progression based on user performance
    const initializePedagogicalProgression = async () => {
        try {
            // Get user's performance history for this grammar concept
            const userPerformance = {
                recentScores: userPerformanceHistory.slice(-10),
                consistency: calculateConsistency(userPerformanceHistory),
                culturalCompetency: culturalCompetencyLevel.level
            };
            
            // Determine appropriate pedagogical level
            const appropriateLevel = determinePedagogicalLevel(userPerformance, lesson.grammar_concept);
            setPedagogicalLevel(appropriateLevel);
            
            // Generate micro-progression for current phase
            const currentPhaseConfig = lessonPhases[currentPhase];
            const progression = generateMicroProgression(
                appropriateLevel, 
                currentPhaseConfig.type,
                lesson.grammar_concept,
                lesson.cultural_context
            );
            setMicroProgression(progression);
            
        } catch (error) {
            console.error('Error initializing pedagogical progression:', error);
            // Fallback to recognition level
            setPedagogicalLevel(PedagogicalLevels.RECOGNITION);
        }
    };

    const calculateConsistency = (scores) => {
        if (scores.length < 2) return 0.5;
        const variance = scores.reduce((acc, score, i) => {
            if (i === 0) return 0;
            return acc + Math.abs(score - scores[i-1]);
        }, 0) / (scores.length - 1);
        return Math.max(0, 1 - (variance / 100)); // Normalize variance to consistency score
    };

    const loadLessonData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load comprehensive lesson data including content and context
            const response = await fetch(`/api/lessons/${lesson.id}/academic-content`);
            if (!response.ok) {
                throw new Error('Failed to load lesson content');
            }

            const data = await response.json();
            if (data.success) {
                setLessonData(data.lesson);
            } else {
                throw new Error(data.error || 'Failed to load lesson');
            }
        } catch (err) {
            console.error('Error loading lesson data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePhaseComplete = async (phaseData) => {
        // Phase 3 Enhancement: Track pedagogical progression and cultural competency
        const phaseConfig = lessonPhases[currentPhase];
        const enhancedPhaseData = {
            ...phaseData,
            pedagogicalLevel: pedagogicalLevel.name,
            culturalIntegration: phaseConfig.culturalIntegration,
            microProgressionCompleted: currentMicroStep,
            culturalCompetencyGained: phaseData.culturalCompetencyIndicators || {}
        };

        const newResults = [...phaseResults, {
            phase: currentPhase,
            type: phaseConfig.type,
            data: enhancedPhaseData,
            completedAt: new Date(),
            pedagogicalAnalysis: {
                level: pedagogicalLevel,
                progression: microProgression,
                culturalCompetency: culturalCompetencyLevel
            }
        }];
        
        setPhaseResults(newResults);

        // Update performance history
        if (phaseData.score) {
            setUserPerformanceHistory(prev => [...prev, phaseData.score].slice(-20)); // Keep last 20 scores
        }

        // Update cultural competency if cultural responses were provided
        if (phaseData.culturalResponses) {
            const newCulturalResponses = [...culturalResponses, ...phaseData.culturalResponses];
            setCulturalResponses(newCulturalResponses);
            
            // Reassess cultural competency level
            const newCompetencyLevel = assessCulturalCompetency(
                newCulturalResponses,
                lessonData?.culturalScenarios || [],
                culturalCompetencyLevel
            );
            setCulturalCompetencyLevel(newCompetencyLevel);
        }

        // Record enhanced phase completion
        await recordPhaseProgress(currentPhase, enhancedPhaseData);

        if (currentPhase < lessonPhases.length - 1) {
            // Move to next phase with updated progression
            setCurrentPhase(currentPhase + 1);
            setCurrentMicroStep(0); // Reset micro-step for new phase
            
            // Generate new micro-progression for next phase
            const nextPhaseConfig = lessonPhases[currentPhase + 1];
            const nextProgression = generateMicroProgression(
                pedagogicalLevel,
                nextPhaseConfig.type,
                lesson.grammar_concept,
                lesson.cultural_context
            );
            setMicroProgression(nextProgression);
        } else {
            // Lesson complete
            await handleLessonComplete(newResults);
        }
    };

    const recordPhaseProgress = async (phaseIndex, phaseData) => {
        try {
            await fetch('/api/lessons/phase-progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: currentUser?.id,
                    lessonId: lesson.id,
                    courseId: courseId,
                    phaseIndex,
                    phaseType: lessonPhases[phaseIndex].type,
                    phaseData,
                    timestamp: new Date().toISOString()
                }),
            });
        } catch (err) {
            console.error('Error recording phase progress:', err);
        }
    };

    const handleLessonComplete = async (allResults) => {
        try {
            // Calculate overall lesson performance
            const overallScore = calculateLessonScore(allResults);
            const timeSpent = Math.round(
                (new Date() - new Date(allResults[0]?.completedAt)) / (1000 * 60)
            );

            const completionData = {
                userId: currentUser?.id,
                lessonId: lesson.id,
                courseId: courseId,
                overallScore,
                timeSpentMinutes: timeSpent,
                phaseResults: allResults,
                completedAt: new Date().toISOString()
            };

            // Record lesson completion
            const response = await fetch('/api/lessons/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(completionData),
            });

            if (response.ok) {
                if (onComplete) {
                    onComplete(completionData);
                }
            } else {
                console.error('Failed to record lesson completion');
            }
        } catch (err) {
            console.error('Error completing lesson:', err);
        }
    };

    const calculateLessonScore = (results) => {
        if (results.length === 0) return 0;
        
        const scores = results
            .map(r => r.data?.score || 0)
            .filter(score => score > 0);
        
        return scores.length > 0 
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;
    };

    const handlePhaseNavigation = (phaseIndex) => {
        if (phaseIndex <= phaseResults.length) {
            setCurrentPhase(phaseIndex);
        }
    };

    const renderCurrentPhase = () => {
        const phase = lessonPhases[currentPhase];
        const PhaseComponent = phase.component;
        
        return (
            <PhaseComponent
                lesson={lessonData}
                courseId={courseId}
                currentUser={currentUser}
                phaseResults={phaseResults}
                onComplete={handlePhaseComplete}
                onExit={onExit}
                // Phase 3 Enhancement: Pass pedagogical progression data
                pedagogicalLevel={pedagogicalLevel}
                culturalCompetencyLevel={culturalCompetencyLevel}
                microProgression={microProgression}
                currentMicroStep={currentMicroStep}
                culturalThemes={AlbanianCulturalThemes}
                onMicroStepAdvance={(step) => setCurrentMicroStep(step)}
                onCulturalResponse={(response) => setCulturalResponses(prev => [...prev, response])}
            />
        );
    };

    // Phase 3 Enhancement: Render pedagogical progression indicator
    const renderPedagogicalProgressIndicator = () => {
        if (!microProgression) return null;

        const progressSteps = Object.keys(microProgression);
        const currentStep = progressSteps[currentMicroStep] || progressSteps[0];
        
        return (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                            pedagogicalLevel.name === 'Recognition' ? 'bg-blue-500' :
                            pedagogicalLevel.name === 'Guided Practice' ? 'bg-green-500' :
                            pedagogicalLevel.name === 'Independent Production' ? 'bg-orange-500' :
                            'bg-purple-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-700">
                            {pedagogicalLevel.name} Level
                        </span>
                        <span className="text-xs text-gray-500">
                            ({pedagogicalLevel.cognitiveLoad} cognitive load)
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Cultural:</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                            culturalCompetencyLevel.level === 1 ? 'bg-gray-100 text-gray-600' :
                            culturalCompetencyLevel.level === 2 ? 'bg-blue-100 text-blue-600' :
                            culturalCompetencyLevel.level === 3 ? 'bg-green-100 text-green-600' :
                            'bg-purple-100 text-purple-600'
                        }`}>
                            {culturalCompetencyLevel.name}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    {progressSteps.map((step, index) => (
                        <div key={step} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                index <= currentMicroStep 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-200 text-gray-500'
                            }`}>
                                {index + 1}
                            </div>
                            {index < progressSteps.length - 1 && (
                                <div className={`w-8 h-1 ${
                                    index < currentMicroStep ? 'bg-blue-500' : 'bg-gray-200'
                                }`}></div>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="mt-3">
                    <div className="text-sm font-medium text-gray-700 capitalize">
                        {currentStep?.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-500">
                        {microProgression[currentStep]?.description}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading lesson content...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Lesson</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={onExit}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Return to Course
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-4xl mx-auto px-4 py-6">
                
                {/* Lesson Header */}
                <AcademicLessonHeader 
                    lesson={lessonData}
                    currentPhase={currentPhase}
                    totalPhases={lessonPhases.length}
                    onExit={onExit}
                />

                {/* Phase Progress Navigation */}
                <PhaseProgress 
                    phases={lessonPhases}
                    currentPhase={currentPhase}
                    completedPhases={phaseResults.length}
                    onPhaseClick={handlePhaseNavigation}
                />

                {/* Phase 3 Enhancement: Pedagogical Progression Indicator */}
                {renderPedagogicalProgressIndicator()}

                {/* Current Phase Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPhase}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="phase-content"
                    >
                        {renderCurrentPhase()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

/**
 * Academic Lesson Header
 */
const AcademicLessonHeader = ({ lesson, currentPhase, totalPhases, onExit }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6 mb-6"
    >
        <div className="flex items-center justify-between">
            <div>
                <div className="flex items-center space-x-3 mb-2">
                    <button
                        onClick={onExit}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {lesson?.name || 'Academic Lesson'}
                    </h1>
                </div>
                <p className="text-gray-600">
                    {lesson?.description || 'University-style language instruction'}
                </p>
            </div>
            <div className="text-right">
                <div className="text-lg font-semibold text-blue-600">
                    Phase {currentPhase + 1} of {totalPhases}
                </div>
                <div className="text-sm text-gray-500">
                    ~{lesson?.estimatedMinutes || 20} minutes
                </div>
            </div>
        </div>
    </motion.div>
);

/**
 * Phase Progress Indicator
 */
const PhaseProgress = ({ phases, currentPhase, completedPhases, onPhaseClick }) => {
    const getPhaseStatus = (index) => {
        if (index < completedPhases) return 'completed';
        if (index === currentPhase) return 'active';
        return 'upcoming';
    };

    const getPhaseColor = (phase, status) => {
        if (status === 'completed') return 'bg-green-500 text-white';
        if (status === 'active') return `bg-${phase.color}-500 text-white`;
        return 'bg-gray-200 text-gray-400';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 mb-6"
        >
            <div className="flex items-center justify-between">
                {phases.map((phase, index) => {
                    const status = getPhaseStatus(index);
                    const isClickable = index <= completedPhases;
                    
                    return (
                        <div key={index} className="flex-1">
                            <div className="flex items-center">
                                <button
                                    onClick={() => isClickable && onPhaseClick(index)}
                                    disabled={!isClickable}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                                        getPhaseColor(phase, status)
                                    } ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}`}
                                >
                                    {status === 'completed' ? '✓' : phase.icon}
                                </button>
                                {index < phases.length - 1 && (
                                    <div className={`flex-1 h-1 mx-4 rounded ${
                                        index < completedPhases ? 'bg-green-500' : 'bg-gray-200'
                                    }`} />
                                )}
                            </div>
                            <div className="text-center mt-2">
                                <div className="text-sm font-medium text-gray-900">
                                    {phase.title}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {phase.description}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};

/**
 * Grammar Instruction Phase - Textbook-style teaching
 */
const GrammarInstruction = ({ lesson, onComplete }) => {
    const [currentSection, setCurrentSection] = useState(0);
    const [understood, setUnderstood] = useState(false);

    const grammarSections = [
        {
            type: 'explanation',
            title: 'Grammar Explanation',
            content: lesson?.grammarExplanation || 'This lesson covers essential grammar patterns and rules.'
        },
        {
            type: 'patterns',
            title: 'Pattern Recognition',
            content: lesson?.patterns || 'Notice the patterns in how this grammar works.'
        },
        {
            type: 'examples',
            title: 'Examples',
            content: lesson?.examples || 'Here are examples showing the grammar in use.'
        },
        {
            type: 'common_mistakes',
            title: 'Common Mistakes',
            content: lesson?.commonMistakes || 'Avoid these common errors when using this grammar.'
        }
    ];

    const handleSectionComplete = () => {
        if (currentSection < grammarSections.length - 1) {
            setCurrentSection(currentSection + 1);
        } else {
            setUnderstood(true);
        }
    };

    const handlePhaseComplete = () => {
        onComplete({
            type: 'grammar_instruction',
            sectionsCompleted: grammarSections.length,
            timeSpent: 5, // Mock timing
            score: 100 // Grammar instruction doesn't have a traditional score
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
                <div className="text-4xl mb-4">📚</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Grammar Instruction
                </h2>
                <p className="text-gray-600">
                    Learn the fundamental rules and patterns
                </p>
            </div>

            {!understood ? (
                <div className="max-w-2xl mx-auto">
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {grammarSections[currentSection].title}
                            </h3>
                            <span className="text-sm text-gray-500">
                                {currentSection + 1} of {grammarSections.length}
                            </span>
                        </div>
                        <div className="prose prose-lg max-w-none">
                            <p className="text-gray-700 leading-relaxed">
                                {grammarSections[currentSection].content}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={handleSectionComplete}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                        >
                            {currentSection < grammarSections.length - 1 ? 'Continue' : 'I Understand'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center max-w-md mx-auto">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Great! You've completed the grammar instruction.
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Now let's practice what you've learned with guided exercises.
                    </p>
                    <button
                        onClick={handlePhaseComplete}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                        Start Guided Practice
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * Guided Practice Phase - Practice with feedback
 */
const GuidedPractice = ({ lesson, onComplete }) => {
    const [currentExercise, setCurrentExercise] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showFeedback, setShowFeedback] = useState(false);
    const [score, setScore] = useState(0);

    // Mock exercises - in production, these would come from lesson data
    const exercises = lesson?.guidedExercises || [
        {
            type: 'multiple_choice',
            question: 'Choose the correct form:',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct: 0,
            explanation: 'This is the correct answer because...'
        },
        {
            type: 'fill_blank',
            question: 'Fill in the blank: "I ___ Albanian."',
            correct: 'speak',
            explanation: 'We use "speak" with languages.'
        },
        {
            type: 'translation',
            question: 'Translate: "Good morning"',
            correct: 'Mirëmëngjes',
            explanation: 'This is the standard Albanian greeting.'
        }
    ];

    const handleAnswer = (answer) => {
        setAnswers({ ...answers, [currentExercise]: answer });
        setShowFeedback(true);

        // Calculate if answer is correct
        const exercise = exercises[currentExercise];
        const isCorrect = exercise.correct === answer || 
                         (typeof exercise.correct === 'string' && 
                          exercise.correct.toLowerCase() === answer.toLowerCase());
        
        if (isCorrect) {
            setScore(score + 1);
        }
    };

    const handleNextExercise = () => {
        if (currentExercise < exercises.length - 1) {
            setCurrentExercise(currentExercise + 1);
            setShowFeedback(false);
        } else {
            handlePracticeComplete();
        }
    };

    const handlePracticeComplete = () => {
        const finalScore = Math.round((score / exercises.length) * 100);
        onComplete({
            type: 'guided_practice',
            exercisesCompleted: exercises.length,
            score: finalScore,
            timeSpent: 10, // Mock timing
            answers
        });
    };

    const currentEx = exercises[currentExercise];

    return (
        <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
                <div className="text-4xl mb-4">✏️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Guided Practice
                </h2>
                <p className="text-gray-600">
                    Practice with immediate feedback
                </p>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-gray-500">
                            Exercise {currentExercise + 1} of {exercises.length}
                        </span>
                        <span className="text-sm font-medium text-green-600">
                            Score: {score}/{exercises.length}
                        </span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {currentEx?.question}
                        </h3>

                        {currentEx?.type === 'multiple_choice' && (
                            <div className="space-y-2">
                                {currentEx.options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswer(index)}
                                        disabled={showFeedback}
                                        className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        )}

                        {currentEx?.type === 'fill_blank' && (
                            <input
                                type="text"
                                placeholder="Type your answer..."
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAnswer(e.target.value);
                                    }
                                }}
                                disabled={showFeedback}
                            />
                        )}
                    </div>

                    {showFeedback && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
                        >
                            <div className="flex items-center mb-2">
                                <span className="text-2xl mr-2">
                                    {score > currentExercise ? '✅' : '❌'}
                                </span>
                                <span className="font-medium">
                                    {score > currentExercise ? 'Correct!' : 'Not quite right'}
                                </span>
                            </div>
                            <p className="text-gray-700">
                                {currentEx?.explanation}
                            </p>
                        </motion.div>
                    )}

                    {showFeedback && (
                        <div className="text-center">
                            <button
                                onClick={handleNextExercise}
                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                            >
                                {currentExercise < exercises.length - 1 ? 'Next Exercise' : 'Complete Practice'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Cultural Context Phase - Cultural understanding
 */
const CulturalContext = ({ lesson, onComplete }) => {
    const [understood, setUnderstood] = useState(false);

    const culturalContent = {
        explanation: lesson?.culturalExplanation || 'Understanding the cultural context helps you use the language appropriately in real situations.',
        scenarios: lesson?.culturalScenarios || [
            'Family dinner conversations',
            'Greeting elders respectfully', 
            'Informal vs formal situations'
        ],
        tips: lesson?.culturalTips || [
            'Pay attention to formality levels',
            'Consider the relationship between speakers',
            'Cultural context affects word choice'
        ]
    };

    const handleComplete = () => {
        onComplete({
            type: 'cultural_context',
            sectionsViewed: 3,
            timeSpent: 5,
            score: 100
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
                <div className="text-4xl mb-4">🏛️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Cultural Context
                </h2>
                <p className="text-gray-600">
                    Understand how culture shapes language use
                </p>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="prose prose-lg max-w-none mb-8">
                    <p className="text-gray-700 leading-relaxed">
                        {culturalContent.explanation}
                    </p>

                    <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">
                        Cultural Scenarios
                    </h3>
                    <ul className="space-y-2">
                        {culturalContent.scenarios.map((scenario, index) => (
                            <li key={index} className="flex items-start">
                                <span className="text-yellow-500 mr-2 mt-1">•</span>
                                <span>{scenario}</span>
                            </li>
                        ))}
                    </ul>

                    <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-4">
                        Cultural Tips
                    </h3>
                    <ul className="space-y-2">
                        {culturalContent.tips.map((tip, index) => (
                            <li key={index} className="flex items-start">
                                <span className="text-blue-500 mr-2 mt-1">💡</span>
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="text-center">
                    <button
                        onClick={handleComplete}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                        Continue to Application
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Independent Application Phase - Real-world application
 */
const IndependentApplication = ({ lesson, onComplete }) => {
    const [currentScenario, setCurrentScenario] = useState(0);
    const [responses, setResponses] = useState({});
    const [completed, setCompleted] = useState(false);

    const scenarios = lesson?.applicationScenarios || [
        {
            situation: 'You meet your Albanian friend\'s grandmother for the first time.',
            prompt: 'How would you greet her respectfully?',
            type: 'open_response'
        },
        {
            situation: 'You\'re having dinner with an Albanian family.',
            prompt: 'How would you compliment the food?',
            type: 'open_response'
        }
    ];

    const handleResponse = (response) => {
        setResponses({ 
            ...responses, 
            [currentScenario]: response 
        });

        if (currentScenario < scenarios.length - 1) {
            setCurrentScenario(currentScenario + 1);
        } else {
            setCompleted(true);
        }
    };

    const handleComplete = () => {
        onComplete({
            type: 'independent_application',
            scenariosCompleted: scenarios.length,
            responses,
            score: 95, // Mock score based on participation
            timeSpent: 8
        });
    };

    const currentSc = scenarios[currentScenario];

    return (
        <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
                <div className="text-4xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Apply Your Knowledge
                </h2>
                <p className="text-gray-600">
                    Use what you've learned in real scenarios
                </p>
            </div>

            <div className="max-w-2xl mx-auto">
                {!completed ? (
                    <div>
                        <div className="mb-6">
                            <span className="text-sm text-gray-500">
                                Scenario {currentScenario + 1} of {scenarios.length}
                            </span>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Situation:
                            </h3>
                            <p className="text-gray-700 mb-6">
                                {currentSc?.situation}
                            </p>
                            
                            <h4 className="font-medium text-gray-900 mb-3">
                                {currentSc?.prompt}
                            </h4>
                            
                            <textarea
                                placeholder="Type your response in Albanian or English..."
                                rows={4}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                onBlur={(e) => {
                                    if (e.target.value.trim()) {
                                        handleResponse(e.target.value);
                                    }
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="text-6xl mb-6">🎉</div>
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                            Excellent Work!
                        </h3>
                        <p className="text-gray-600 mb-8">
                            You've completed all phases of this academic lesson. 
                            You're ready to move on to the next lesson!
                        </p>
                        <button
                            onClick={handleComplete}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-colors text-lg"
                        >
                            Complete Lesson
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AcademicLesson;