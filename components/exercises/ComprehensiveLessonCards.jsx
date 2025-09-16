import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { designSystem, getButtonClass, getCardClass, getTextGradient } from '../../styles/designSystem';

/**
 * Comprehensive Lesson Cards Component
 * Presents rich lesson content as interactive, focused cards
 */
const ComprehensiveLessonCards = ({ lessonData, onComplete, onExit }) => {
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (lessonData) {
            const generatedCards = generateLessonCards(lessonData);
            setCards(generatedCards);
            setLoading(false);
        }
    }, [lessonData]);

    const generateLessonCards = (data) => {
        const cards = [];

        // 1. Overview Card
        cards.push({
            id: 'overview',
            type: 'overview',
            title: data.topic,
            content: {
                subtitle: 'Comprehensive Lesson',
                studyTime: data.estimatedStudyTime,
                objectives: data.learningObjectives || [],
                vocabularyCount: data.vocabularySection?.totalCount || 0,
                verbCount: data.verbConjugations?.length || 0
            }
        });

        // 2. Grammar Focus Card
        if (data.verbConjugations?.length > 0 && data.verbConjugations[0].present_tense) {
            cards.push({
                id: 'grammar-focus',
                type: 'grammar',
                title: 'Grammar Focus: Possessive Pronouns',
                content: {
                    concept: 'Possessive Pronouns',
                    explanation: 'Possessive pronouns in Albanian indicate ownership and are used to show that something belongs to someone. They agree in gender and number with the noun they modify.',
                    patterns: data.patterns || '',
                    examples: [
                        'im/ime (my) - masculine/feminine',
                        'yt/jote (your) - masculine/feminine', 
                        'i tij/e tij (his)',
                        'e saj (her)',
                        'ynë/jonë (our)',
                        'i tyre/e tyre (their)'
                    ]
                }
            });
        }

        // 3. Core Vocabulary Cards (one per word)
        if (data.vocabularySection?.coreTerms) {
            data.vocabularySection.coreTerms.forEach((vocab, index) => {
                cards.push({
                    id: `vocab-core-${index}`,
                    type: 'vocabulary',
                    category: 'Core Vocabulary',
                    title: vocab.albanian_term,
                    content: {
                        albanian: vocab.albanian_term,
                        english: vocab.english_term,
                        pronunciation: vocab.pronunciation,
                        gender: vocab.gender,
                        exampleSentence: vocab.example_sentence,
                        exampleTranslation: vocab.english_translation,
                        difficulty: 'Core'
                    }
                });
            });
        }

        // 4. Verb Conjugation Cards (one per verb)
        if (data.verbConjugations) {
            data.verbConjugations.forEach((verb, index) => {
                cards.push({
                    id: `verb-${index}`,
                    type: 'verb',
                    title: `Verb: ${verb.infinitive}`,
                    content: {
                        infinitive: verb.infinitive,
                        english: verb.english,
                        type: verb.type,
                        conjugations: verb.present_tense,
                        examples: verb.usage_examples?.slice(0, 3) || []
                    }
                });
            });
        }

        // 5. Related Vocabulary Cards
        if (data.vocabularySection?.relatedTerms) {
            data.vocabularySection.relatedTerms.forEach((vocab, index) => {
                cards.push({
                    id: `vocab-related-${index}`,
                    type: 'vocabulary',
                    category: 'Related Vocabulary',
                    title: vocab.albanian_term,
                    content: {
                        albanian: vocab.albanian_term,
                        english: vocab.english_term,
                        pronunciation: vocab.pronunciation,
                        gender: vocab.gender,
                        exampleSentence: vocab.example_sentence,
                        exampleTranslation: vocab.english_translation,
                        difficulty: 'Related'
                    }
                });
            });
        }

        // 6. Sentence Pattern Cards
        if (data.sentencePatterns) {
            data.sentencePatterns.forEach((pattern, index) => {
                cards.push({
                    id: `pattern-${index}`,
                    type: 'pattern',
                    title: 'Sentence Pattern',
                    content: {
                        pattern: pattern.pattern,
                        explanation: pattern.explanation,
                        examples: pattern.examples || []
                    }
                });
            });
        }

        // 7. Cultural Context Card
        if (data.culturalExplanation) {
            cards.push({
                id: 'cultural',
                type: 'cultural',
                title: 'Cultural Context',
                content: {
                    explanation: data.culturalExplanation,
                    tips: data.culturalTips || [],
                    scenarios: data.culturalScenarios || []
                }
            });
        }

        // 8. Review Summary Card
        cards.push({
            id: 'review',
            type: 'review',
            title: 'Lesson Review',
            content: {
                keyVocabulary: data.reviewSummary?.key_vocabulary || [],
                keyGrammar: data.reviewSummary?.key_grammar || [],
                essentialPhrases: data.reviewSummary?.essential_phrases || [],
                nextLesson: data.reviewSummary?.next_lesson_prep || 'Continue with practice exercises',
                totalWords: data.vocabularySection?.totalCount || 0
            }
        });

        return cards;
    };

    const nextCard = () => {
        if (currentCardIndex < cards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
        } else {
            // Completed lesson
            onComplete?.();
        }
    };

    const prevCard = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(currentCardIndex - 1);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: designSystem.gradients.pageBackground }}>
                <div className="text-center">
                    <div className="relative mb-8">
                        <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-100/50 to-purple-100/50 animate-pulse"></div>
                    </div>
                    <p className="text-xl font-medium mb-2" style={{ color: designSystem.colors.text.primary }}>Preparing your lesson cards...</p>
                    <p className="text-sm" style={{ color: designSystem.colors.text.secondary }}>Creating your personalized learning experience</p>
                </div>
            </div>
        );
    }

    const currentCard = cards[currentCardIndex];

    return (
        <div className="min-h-screen" style={{ background: designSystem.gradients.pageBackground }}>
            {/* Header */}
            <header className="relative z-10 px-6 py-8 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                <div className="container mx-auto flex items-center justify-between">
                    <motion.button 
                        onClick={onExit}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={getButtonClass('secondary')}
                        style={{ minWidth: '140px' }}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Exit Lesson</span>
                    </motion.button>
                    
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${getTextGradient(['from-blue-600', 'via-purple-600', 'to-indigo-600'])}`}>
                            {lessonData?.topic}
                        </div>
                        <div className="text-slate-600 mt-2 font-medium">
                            Card {currentCardIndex + 1} of {cards.length}
                        </div>
                    </div>

                    <div className="w-36"></div> {/* Spacer for centered title */}
                </div>
            </header>

            {/* Progress Bar */}
            <div className="px-6 py-4">
                <div className="container mx-auto max-w-5xl">
                    <div className="bg-slate-200 rounded-full h-3 shadow-inner">
                        <motion.div 
                            className="h-3 rounded-full shadow-lg"
                            style={{ background: designSystem.gradients.primary }}
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentCardIndex + 1) / cards.length) * 100}%` }}
                            transition={{ duration: 0.4, ease: designSystem.animations.easings.out }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-600 font-medium">
                        <span>Progress</span>
                        <span>{Math.round(((currentCardIndex + 1) / cards.length) * 100)}%</span>
                    </div>
                </div>
            </div>

            {/* Main Card Content */}
            <main className="px-6 py-8 flex-1">
                <div className="container mx-auto max-w-5xl">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentCard?.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ 
                                duration: 0.4, 
                                ease: designSystem.animations.easings.out 
                            }}
                            className={`${getCardClass('primary')} p-10 min-h-[550px] relative overflow-hidden`}
                            style={{
                                background: designSystem.colors.surface.card,
                                border: `1px solid ${designSystem.colors.border.light}`,
                                boxShadow: designSystem.shadows.lg
                            }}
                        >
                            {/* Subtle background pattern */}
                            <div className="absolute inset-0 opacity-3" style={{
                                backgroundImage: 'radial-gradient(circle at 25% 25%, rgb(148, 163, 184) 1px, transparent 1px)',
                                backgroundSize: '24px 24px'
                            }}></div>
                            
                            <div className="relative z-10">
                                {renderCard(currentCard)}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Navigation */}
            <footer className="px-6 py-8 bg-white/80 backdrop-blur-lg border-t border-slate-200">
                <div className="container mx-auto max-w-5xl flex justify-between items-center">
                    <motion.button
                        onClick={prevCard}
                        disabled={currentCardIndex === 0}
                        whileHover={{ scale: currentCardIndex === 0 ? 1 : 1.02 }}
                        whileTap={{ scale: currentCardIndex === 0 ? 1 : 0.98 }}
                        className={currentCardIndex === 0 ? 
                            getButtonClass('secondary', 'md', true) : 
                            getButtonClass('secondary')
                        }
                        style={{ minWidth: '120px' }}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                    </motion.button>

                    <div className="text-center">
                        {currentCard?.category && (
                            <span className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium">
                                {currentCard.category}
                            </span>
                        )}
                    </div>

                    <motion.button
                        onClick={nextCard}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={getButtonClass('primary')}
                        style={{ 
                            minWidth: '120px'
                        }}
                    >
                        <span>{currentCardIndex === cards.length - 1 ? 'Complete' : 'Next'}</span>
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </motion.button>
                </div>
            </footer>
        </div>
    );

    function renderCard(card) {
        if (!card) return null;

        switch (card.type) {
            case 'overview':
                return <OverviewCard content={card.content} title={card.title} />;
            case 'grammar':
                return <GrammarCard content={card.content} title={card.title} />;
            case 'vocabulary':
                return <VocabularyCard content={card.content} title={card.title} />;
            case 'verb':
                return <VerbCard content={card.content} title={card.title} />;
            case 'pattern':
                return <PatternCard content={card.content} title={card.title} />;
            case 'cultural':
                return <CulturalCard content={card.content} title={card.title} />;
            case 'review':
                return <ReviewCard content={card.content} title={card.title} />;
            default:
                return <div>Unknown card type</div>;
        }
    }
};

// Individual Card Components
const OverviewCard = ({ content, title }) => (
    <div className="text-center space-y-6">
        <div className="mb-8">
            <h1 className={`text-5xl font-bold mb-4 ${getTextGradient(['from-blue-600', 'via-purple-600', 'to-indigo-600'])}`}>
                {title}
            </h1>
            <p className="text-xl font-medium" style={{ color: designSystem.colors.text.secondary }}>{content.subtitle}</p>
        </div>
        
        <div className={`${getCardClass('lesson')} p-8 mb-8`} style={{
            background: designSystem.gradients.accentBlue,
            border: `1px solid ${designSystem.colors.border.light}`
        }}>
            <h3 className="font-bold text-lg mb-6 text-center" style={{ color: designSystem.colors.text.primary }}>What You'll Master in This {content.studyTime} Lesson</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
                {content.objectives.map((objective, i) => (
                    <div key={i} className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mt-3 flex-shrink-0"></div>
                        <span className="leading-relaxed" style={{ color: designSystem.colors.text.secondary }}>{objective}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            <div className={`${getCardClass('lesson')} p-8 text-center`} style={{
                background: designSystem.gradients.accentGreen,
                border: `1px solid ${designSystem.colors.success[200]}`
            }}>
                <div className="text-4xl font-bold text-emerald-600 mb-3">{content.vocabularyCount}</div>
                <div className="text-emerald-700 font-medium">Vocabulary Terms</div>
                <div className="w-12 h-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mx-auto mt-3"></div>
            </div>
            <div className={`${getCardClass('lesson')} p-8 text-center`} style={{
                background: designSystem.gradients.accentBlue,
                border: `1px solid ${designSystem.colors.primary[200]}`
            }}>
                <div className="text-4xl font-bold text-blue-600 mb-3">{content.verbCount}</div>
                <div className="text-blue-700 font-medium">Verb Conjugations</div>
                <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto mt-3"></div>
            </div>
        </div>
    </div>
);

const GrammarCard = ({ content, title }) => (
    <div className="space-y-8">
        <div className="text-center">
            <h2 className={`text-4xl font-bold mb-4 ${getTextGradient(['from-purple-600', 'to-blue-600'])}`}>{title}</h2>
        </div>
        
        <div className={`${getCardClass('lesson')} p-8`} style={{
            background: designSystem.gradients.accentPurple,
            border: `1px solid ${designSystem.colors.border.light}`
        }}>
            <h3 className="text-purple-700 font-bold text-lg mb-4 text-center">Concept: {content.concept}</h3>
            <p className="leading-relaxed text-center" style={{ color: designSystem.colors.text.secondary }}>{content.explanation}</p>
        </div>

        <div>
            <h4 className="font-bold text-lg mb-6 text-center" style={{ color: designSystem.colors.text.primary }}>Key Patterns</h4>
            <div className="space-y-4">
                {content.examples.map((example, i) => (
                    <div key={i} className={`${getCardClass('lesson')} p-6`} style={{
                        background: designSystem.colors.background.secondary,
                        border: `1px solid ${designSystem.colors.border.light}`
                    }}>
                        <span className="text-blue-700 font-mono text-lg">{example}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const VocabularyCard = ({ content, title }) => (
    <div className="text-center space-y-6">
        <div className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-bold mb-6 ${
            content.difficulty === 'Core' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
            content.difficulty === 'Related' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
            'bg-purple-100 text-purple-800 border border-purple-300'
        }`}>
            {content.difficulty} Vocabulary
        </div>
        
        <div className="mb-8">
            <h2 className="text-6xl font-bold mb-4" style={{ color: designSystem.colors.text.primary }}>{content.albanian}</h2>
        
            {content.pronunciation && (
                <p className="text-blue-600 text-2xl mb-4 font-medium">{content.pronunciation}</p>
            )}
            
            <p className="text-3xl mb-6 font-semibold" style={{ color: designSystem.colors.text.secondary }}>{content.english}</p>
        </div>
        
        {content.gender && (
            <div className={`inline-block ${getCardClass('lesson')} px-6 py-3 mb-8`} style={{
                background: designSystem.colors.background.secondary,
                border: `1px solid ${designSystem.colors.border.light}`
            }}>
                <span className="text-sm font-medium" style={{ color: designSystem.colors.text.tertiary }}>Gender: </span>
                <span className="font-bold" style={{ color: designSystem.colors.text.primary }}>{content.gender === 'm' ? 'Masculine' : content.gender === 'f' ? 'Feminine' : 'Neuter'}</span>
            </div>
        )}
        
        {content.exampleSentence && (
            <div className={`${getCardClass('lesson')} p-8`} style={{
                background: designSystem.gradients.accentBlue,
                border: `1px solid ${designSystem.colors.border.light}`
            }}>
                <h4 className="text-blue-700 font-bold text-lg mb-4 text-center">Example Usage</h4>
                <p className="text-xl italic mb-4 leading-relaxed" style={{ color: designSystem.colors.text.primary }}>"{content.exampleSentence}"</p>
                <p className="text-lg leading-relaxed" style={{ color: designSystem.colors.text.secondary }}>"{content.exampleTranslation}"</p>
            </div>
        )}
    </div>
);

const VerbCard = ({ content, title }) => (
    <div className="space-y-8">
        <div className="text-center">
            <h2 className={`text-4xl font-bold mb-3 ${getTextGradient(['from-indigo-600', 'to-purple-600'])}`}>{title}</h2>
            <p className="text-xl font-medium" style={{ color: designSystem.colors.text.secondary }}>{content.english}</p>
        </div>
        
        <div className="text-center mb-8">
            <div className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-bold ${
                content.type === 'irregular' ? 'bg-red-100 text-red-800 border border-red-300' :
                'bg-green-100 text-green-800 border border-green-300'
            }`}>
                {content.type === 'irregular' ? 'Irregular Verb' : 'Regular Verb'}
            </div>
        </div>

        <div className={`${getCardClass('lesson')} p-8 mb-8`} style={{
            background: designSystem.gradients.accentPurple,
            border: `1px solid ${designSystem.colors.border.light}`
        }}>
            <h3 className="text-indigo-700 font-bold text-lg mb-6 text-center">Present Tense Conjugation</h3>
            <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(content.conjugations || {}).map(([person, form]) => (
                    <div key={person} className={`flex justify-between ${getCardClass('lesson')} p-4`} style={{
                        background: designSystem.colors.background.secondary,
                        border: `1px solid ${designSystem.colors.border.light}`
                    }}>
                        <span className="capitalize font-medium" style={{ color: designSystem.colors.text.tertiary }}>{person.replace('_', '/')}: </span>
                        <span className="font-bold" style={{ color: designSystem.colors.text.primary }}>{form}</span>
                    </div>
                ))}
            </div>
        </div>

        {content.examples && content.examples.length > 0 && (
            <div>
                <h4 className="font-bold text-lg mb-6 text-center" style={{ color: designSystem.colors.text.primary }}>Usage Examples</h4>
                <div className="space-y-4">
                    {content.examples.map((example, i) => (
                        <div key={i} className={`${getCardClass('lesson')} p-6`} style={{
                            background: designSystem.colors.background.secondary,
                            border: `1px solid ${designSystem.colors.border.light}`
                        }}>
                            <p className="italic mb-2 text-lg" style={{ color: designSystem.colors.text.primary }}>"{example.albanian}"</p>
                            <p style={{ color: designSystem.colors.text.secondary }}>"{example.english}"</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const PatternCard = ({ content, title }) => (
    <div className="space-y-8">
        <div className="text-center">
            <h2 className={`text-4xl font-bold mb-6 ${getTextGradient(['from-orange-600', 'to-red-600'])}`}>{title}</h2>
        </div>
        
        <div className={`${getCardClass('lesson')} p-8 mb-8`} style={{
            background: designSystem.gradients.accentOrange,
            border: `1px solid ${designSystem.colors.border.light}`
        }}>
            <h3 className="text-orange-700 font-bold text-lg mb-4 text-center">Pattern</h3>
            <p className="text-2xl font-mono mb-6 text-center rounded-lg p-4" style={{ 
                color: designSystem.colors.text.primary,
                background: designSystem.colors.background.secondary
            }}>{content.pattern}</p>
            <p className="leading-relaxed text-center" style={{ color: designSystem.colors.text.secondary }}>{content.explanation}</p>
        </div>

        {content.examples && content.examples.length > 0 && (
            <div>
                <h4 className="font-bold text-lg mb-6 text-center" style={{ color: designSystem.colors.text.primary }}>Examples</h4>
                <div className="space-y-4">
                    {content.examples.map((example, i) => (
                        <div key={i} className={`${getCardClass('lesson')} p-6`} style={{
                            background: designSystem.colors.background.secondary,
                            border: `1px solid ${designSystem.colors.border.light}`
                        }}>
                            <p className="italic mb-2 text-lg" style={{ color: designSystem.colors.text.primary }}>"{example.albanian}"</p>
                            <p style={{ color: designSystem.colors.text.secondary }}>"{example.english}"</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const CulturalCard = ({ content, title }) => (
    <div className="space-y-8">
        <div className="text-center">
            <div className="text-6xl mb-4">🏛️</div>
            <h2 className={`text-4xl font-bold ${getTextGradient(['from-purple-600', 'to-pink-600'])}`}>
                {title}
            </h2>
        </div>
        
        <div className={`${getCardClass('lesson')} p-8 mb-8`} style={{
            background: designSystem.gradients.accentPurple,
            border: `1px solid ${designSystem.colors.border.light}`
        }}>
            <p className="leading-relaxed text-xl text-center" style={{ color: designSystem.colors.text.primary }}>{content.explanation}</p>
        </div>

        {content.tips && content.tips.length > 0 && (
            <div>
                <h4 className="font-bold text-lg mb-6 text-center" style={{ color: designSystem.colors.text.primary }}>Cultural Tips</h4>
                <div className="space-y-4">
                    {content.tips.map((tip, i) => (
                        <div key={i} className={`${getCardClass('lesson')} p-6`} style={{
                            background: designSystem.colors.background.secondary,
                            border: `1px solid ${designSystem.colors.border.light}`
                        }}>
                            <p className="text-purple-700 font-bold mb-3 flex items-center">
                                <span className="text-xl mr-3">💡</span>
                                {tip.tip}
                            </p>
                            <p className="leading-relaxed" style={{ color: designSystem.colors.text.secondary }}>{tip.practicalApplication}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const ReviewCard = ({ content, title }) => (
    <div className="text-center space-y-8">
        <div className="text-center">
            <div className="text-6xl mb-4">🎓</div>
            <h2 className={`text-4xl font-bold ${getTextGradient(['from-emerald-600', 'to-blue-600'])}`}>{title}</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className={`${getCardClass('lesson')} p-8`} style={{
                background: designSystem.gradients.accentGreen,
                border: `1px solid ${designSystem.colors.success[200]}`
            }}>
                <div className="text-4xl font-bold text-emerald-600 mb-3">{content.totalWords}</div>
                <div className="text-emerald-700 font-medium">Words Learned</div>
                <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full mx-auto mt-4"></div>
            </div>
            <div className={`${getCardClass('lesson')} p-8`} style={{
                background: designSystem.gradients.accentBlue,
                border: `1px solid ${designSystem.colors.primary[200]}`
            }}>
                <div className="text-4xl font-bold text-blue-600 mb-3">✓</div>
                <div className="text-blue-700 font-medium">Lesson Complete</div>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mx-auto mt-4"></div>
            </div>
        </div>

        <div className={`${getCardClass('lesson')} p-8 mb-8`} style={{
            background: designSystem.gradients.accentBlue,
            border: `1px solid ${designSystem.colors.border.light}`
        }}>
            <h3 className="text-blue-700 font-bold text-lg mb-6 text-center">Key Takeaways</h3>
            <div className="text-left space-y-3">
                {content.essentialPhrases?.map((phrase, i) => (
                    <div key={i} className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mt-3 flex-shrink-0"></div>
                        <span className="italic text-lg" style={{ color: designSystem.colors.text.primary }}>"{phrase}"</span>
                    </div>
                ))}
            </div>
        </div>

        <div className={`${getCardClass('lesson')} p-6`} style={{
            background: designSystem.colors.background.secondary,
            border: `1px solid ${designSystem.colors.border.light}`
        }}>
            <p className="text-lg leading-relaxed" style={{ color: designSystem.colors.text.secondary }}>
                {content.nextLesson}
            </p>
        </div>
    </div>
);

export default ComprehensiveLessonCards;