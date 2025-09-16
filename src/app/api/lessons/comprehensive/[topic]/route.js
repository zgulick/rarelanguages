import { NextResponse } from 'next/server';
const { query } = require('../../../../../../lib/database');

/**
 * Comprehensive Lesson Content API
 * GET /api/lessons/comprehensive/[topic]
 * Returns rich, textbook-quality lesson content from database
 */
export async function GET(request, { params }) {
    try {
        const { topic } = await params;
        
        console.log(`📚 Loading comprehensive lesson for topic: ${topic}`);

        // Get the comprehensive lesson from database
        const lessonResult = await query(`
            SELECT 
                id, topic, lesson_number, estimated_study_time,
                content_data, created_at
            FROM comprehensive_lessons 
            WHERE LOWER(topic) LIKE LOWER($1)
            ORDER BY created_at DESC
            LIMIT 1
        `, [`%${topic}%`]);

        if (lessonResult.rows.length === 0) {
            return NextResponse.json({
                error: `No comprehensive lesson found for topic: ${topic}`,
                success: false
            }, { status: 404 });
        }

        const lessonData = lessonResult.rows[0];
        const contentData = lessonData.content_data;

        // Get vocabulary from dedicated table
        const vocabularyResult = await query(`
            SELECT 
                albanian_term, english_term, pronunciation, gender,
                example_sentence, english_translation, difficulty_level
            FROM lesson_vocabulary
            WHERE lesson_id = $1
            ORDER BY difficulty_level, albanian_term
        `, [lessonData.id]);

        // Get example sentences
        const examplesResult = await query(`
            SELECT 
                albanian_sentence, english_translation, grammar_notes, example_type
            FROM lesson_examples
            WHERE lesson_id = $1
            ORDER BY created_at
        `, [lessonData.id]);

        // Get dialogues
        const dialoguesResult = await query(`
            SELECT title, dialogue_data
            FROM lesson_dialogues
            WHERE lesson_id = $1
            ORDER BY created_at
        `, [lessonData.id]);

        // Build comprehensive lesson structure
        const comprehensiveLesson = {
            id: lessonData.id,
            topic: lessonData.topic,
            lessonNumber: lessonData.lesson_number,
            estimatedStudyTime: lessonData.estimated_study_time,
            
            // Phase 1: Comprehensive Grammar Instruction
            grammarExplanation: buildGrammarExplanation(contentData, vocabularyResult.rows),
            patterns: buildPatternExplanation(contentData),
            examples: buildGrammarExamples(contentData, examplesResult.rows),
            commonMistakes: contentData.grammar_focus?.exceptions?.join(', ') || 'Focus on consistent practice and pattern recognition.',

            // Phase 2: Rich Vocabulary Section
            vocabularySection: buildVocabularySection(vocabularyResult.rows),
            
            // Phase 3: Verb Conjugations
            verbConjugations: contentData.verb_conjugations || [],
            
            // Phase 4: Sentence Patterns & Construction
            sentencePatterns: contentData.sentence_patterns || [],
            
            // Phase 5: Extensive Examples & Practice Prep
            extensiveExamples: buildExtensiveExamples(examplesResult.rows, dialoguesResult.rows, contentData),
            
            // Phase 6: Cultural Context
            culturalExplanation: contentData.cultural_context?.background || 'Understanding cultural context enhances language learning.',
            culturalScenarios: buildCulturalScenarios(contentData),
            culturalTips: buildCulturalTips(contentData),

            // Phase 7: Review & Practice Preparation
            reviewSummary: contentData.review_summary || {},
            
            // Guided Practice Exercises (simplified from comprehensive content)
            guidedExercises: buildGuidedExercises(vocabularyResult.rows, contentData),

            // Academic metadata
            learningObjectives: buildLearningObjectives(contentData),
            assessmentCriteria: buildAssessmentCriteria(contentData)
        };

        return NextResponse.json({
            lesson: comprehensiveLesson,
            success: true
        });

    } catch (error) {
        console.error('❌ Comprehensive lesson loading failed:', error);
        
        return NextResponse.json({
            error: 'Failed to load comprehensive lesson content',
            details: error.message,
            success: false
        }, { status: 500 });
    }
}

/**
 * Build rich grammar explanation with vocabulary integration
 */
function buildGrammarExplanation(contentData, vocabulary) {
    const grammarFocus = contentData.grammar_focus || {};
    const coreVocab = vocabulary.filter(v => v.difficulty_level === 1).slice(0, 10);
    
    let explanation = `## ${contentData.topic} - Comprehensive Lesson\n\n`;
    
    explanation += `**What You'll Master in This ${contentData.estimated_study_time || '45-60 minute'} Lesson:**\n`;
    explanation += `- ${vocabulary.length} essential vocabulary terms with pronunciation guides\n`;
    explanation += `- ${grammarFocus.concept || 'Core grammar patterns'}\n`;
    explanation += `- Practical sentence construction and usage\n`;
    explanation += `- Cultural context and authentic expressions\n\n`;
    
    if (grammarFocus.explanation) {
        explanation += `**Grammar Focus: ${grammarFocus.concept}**\n`;
        explanation += `${grammarFocus.explanation}\n\n`;
    }
    
    explanation += `**Core Vocabulary Preview:**\n`;
    coreVocab.forEach(vocab => {
        explanation += `- **${vocab.albanian_term}** ${vocab.pronunciation || ''} - ${vocab.english_term}\n`;
        if (vocab.example_sentence) {
            explanation += `  *${vocab.example_sentence}* (${vocab.english_translation})\n`;
        }
    });
    
    return explanation;
}

/**
 * Build pattern explanation
 */
function buildPatternExplanation(contentData) {
    const patterns = contentData.grammar_focus?.patterns || [];
    
    let patternText = `## Key Patterns You'll Learn\n\n`;
    
    patterns.forEach((pattern, i) => {
        patternText += `**Pattern ${i + 1}:** ${pattern}\n`;
    });
    
    if (contentData.sentence_patterns) {
        patternText += `\n**Sentence Construction Patterns:**\n`;
        contentData.sentence_patterns.slice(0, 3).forEach(sp => {
            patternText += `- ${sp.pattern}: ${sp.explanation}\n`;
        });
    }
    
    return patternText;
}

/**
 * Build grammar examples from database content
 */
function buildGrammarExamples(contentData, examples) {
    if (examples.length === 0) {
        return 'You\'ll practice with extensive examples throughout the lesson.';
    }
    
    let exampleText = 'Here are key examples from this lesson: ';
    const examplePairs = examples.slice(0, 3).map(ex => 
        `"${ex.albanian_sentence}" → "${ex.english_translation}"`
    );
    
    return exampleText + examplePairs.join(', ') + '. These demonstrate the grammar patterns in practical use.';
}

/**
 * Build comprehensive vocabulary section
 */
function buildVocabularySection(vocabulary) {
    const coreTerms = vocabulary.filter(v => v.difficulty_level === 1);
    const relatedTerms = vocabulary.filter(v => v.difficulty_level === 2);
    const advancedTerms = vocabulary.filter(v => v.difficulty_level === 3);
    
    return {
        coreTerms,
        relatedTerms, 
        advancedTerms,
        totalCount: vocabulary.length,
        summary: `This lesson includes ${vocabulary.length} vocabulary items: ${coreTerms.length} core terms, ${relatedTerms.length} related terms, and ${advancedTerms.length} advanced terms.`
    };
}

/**
 * Build extensive examples section
 */
function buildExtensiveExamples(examples, dialogues, contentData) {
    return {
        basicSentences: examples.map(ex => ({
            albanian: ex.albanian_sentence,
            english: ex.english_translation,
            notes: ex.grammar_notes,
            type: ex.example_type
        })),
        dialogues: dialogues.map(d => ({
            title: d.title,
            exchanges: d.dialogue_data
        })),
        scenarios: contentData.extensive_examples?.scenarios || [],
        totalExamples: examples.length + (dialogues.length * 3) // Estimate dialogue exchanges
    };
}

/**
 * Build cultural scenarios
 */
function buildCulturalScenarios(contentData) {
    const cultural = contentData.cultural_context || {};
    
    return [{
        id: `${contentData.topic.toLowerCase().replace(/\s+/g, '_')}_cultural`,
        scenario: `Engaging with Albanian culture through ${contentData.topic.toLowerCase()}`,
        context: cultural.background || 'Understanding cultural context enhances communication',
        culturalElements: cultural.customs || ['respect', 'tradition', 'family_values'],
        competencyLevel: 'awareness',
        learningObjective: `Apply ${contentData.topic.toLowerCase()} knowledge in culturally appropriate ways`
    }];
}

/**
 * Build cultural tips
 */
function buildCulturalTips(contentData) {
    const cultural = contentData.cultural_context || {};
    
    const tips = cultural.practical_tips || ['Observe and learn from native speakers', 'Ask questions to understand cultural context'];
    
    return tips.map(tip => ({
        tip,
        importance: 'medium',
        culturalReason: 'Cultural awareness improves communication effectiveness',
        practicalApplication: 'Apply this understanding in real conversations'
    }));
}

/**
 * Build guided exercises from vocabulary
 */
function buildGuidedExercises(vocabulary, contentData) {
    const exercises = [];
    
    // Vocabulary exercises
    const coreVocab = vocabulary.filter(v => v.difficulty_level === 1).slice(0, 5);
    coreVocab.forEach(vocab => {
        exercises.push({
            type: 'fill_blank',
            question: `How do you say "${vocab.english_term}" in Albanian?`,
            correct: vocab.albanian_term,
            explanation: `The correct answer is "${vocab.albanian_term}"${vocab.pronunciation ? ` ${vocab.pronunciation}` : ''}.`
        });
    });
    
    // Grammar exercises from verb conjugations
    if (contentData.verb_conjugations) {
        contentData.verb_conjugations.slice(0, 2).forEach(verb => {
            exercises.push({
                type: 'multiple_choice',
                question: `What is the "I" form of "${verb.infinitive}" (${verb.english})?`,
                options: [
                    verb.present_tense?.une || 'form1',
                    'incorrect1',
                    'incorrect2', 
                    'incorrect3'
                ],
                correct: 0,
                explanation: `The first person singular form is "${verb.present_tense?.une || 'correct form'}".`
            });
        });
    }
    
    return exercises;
}

/**
 * Build learning objectives
 */
function buildLearningObjectives(contentData) {
    const objectives = [];
    
    if (contentData.vocabulary) {
        const totalVocab = (contentData.vocabulary.core_terms?.length || 0) + 
                          (contentData.vocabulary.related_terms?.length || 0) + 
                          (contentData.vocabulary.advanced_terms?.length || 0);
        objectives.push(`Master ${totalVocab}+ vocabulary terms for ${contentData.topic.toLowerCase()}`);
    }
    
    if (contentData.grammar_focus?.concept) {
        objectives.push(`Understand and apply ${contentData.grammar_focus.concept.toLowerCase()}`);
    }
    
    objectives.push(`Use vocabulary in practical, culturally appropriate contexts`);
    objectives.push(`Build confidence for real conversations about ${contentData.topic.toLowerCase()}`);
    
    return objectives;
}

/**
 * Build assessment criteria
 */
function buildAssessmentCriteria(contentData) {
    return {
        vocabularyMastery: `Can use key ${contentData.topic.toLowerCase()} vocabulary correctly`,
        grammarAccuracy: `Demonstrates understanding of lesson grammar concepts`,
        culturalAwareness: `Shows awareness of cultural context and appropriate usage`,
        practicalApplication: `Can apply knowledge in realistic conversation scenarios`
    };
}