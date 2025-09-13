import { NextResponse } from 'next/server';
const { query } = require('../../../../../../lib/database');

/**
 * Academic Lesson Content API
 * GET /api/lessons/[id]/academic-content
 * Returns comprehensive lesson content for 4-phase academic structure
 */
export async function GET(request, { params }) {
    try {
        const { id: lessonId } = params;

        // Get lesson with skill and course context
        const lessonResult = await query(`
            SELECT 
                l.*,
                s.name as skill_name,
                s.position as skill_position,
                c.id as course_id,
                c.name as course_name,
                c.level as course_level,
                c.cefr_level as course_cefr_level,
                lang.name as language_name,
                lang.code as language_code,
                lang.native_name
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            JOIN course_skills cs ON s.id = cs.skill_id
            JOIN courses c ON cs.course_id = c.id
            JOIN languages lang ON c.language_id = lang.id
            WHERE l.id = $1 AND l.is_active = true
        `, [lessonId]);

        if (lessonResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Lesson not found or inactive', success: false },
                { status: 404 }
            );
        }

        const lesson = lessonResult.rows[0];

        // Get lesson exercises for guided practice
        const exercisesResult = await query(`
            SELECT 
                e.*,
                ec.exercise_content,
                ec.correct_answer,
                ec.explanation
            FROM exercises e
            LEFT JOIN exercise_content ec ON e.id = ec.exercise_id
            WHERE e.lesson_id = $1 AND e.is_active = true
            ORDER BY e.position
        `, [lessonId]);

        const exercises = exercisesResult.rows;

        // Generate academic content structure
        const academicContent = {
            id: lesson.id,
            name: lesson.name,
            description: lesson.description,
            difficultyLevel: lesson.difficulty_level,
            position: lesson.position,
            estimatedMinutes: lesson.estimated_minutes || 20,
            
            // Course context
            courseId: lesson.course_id,
            courseName: lesson.course_name,
            courseLevel: lesson.course_level,
            cefrLevel: lesson.course_cefr_level,
            
            // Skill context
            skillName: lesson.skill_name,
            skillPosition: lesson.skill_position,
            
            // Language context
            language: {
                name: lesson.language_name,
                code: lesson.language_code,
                nativeName: lesson.native_name
            },

            // Phase 1: Grammar Instruction Content
            grammarExplanation: generateGrammarExplanation(lesson, exercises),
            patterns: generateGrammarPatterns(lesson, exercises),
            examples: generateGrammarExamples(lesson, exercises),
            commonMistakes: generateCommonMistakes(lesson, exercises),

            // Phase 2: Guided Practice Exercises
            guidedExercises: transformExercisesForAcademic(exercises),

            // Phase 3: Cultural Context Content
            culturalExplanation: generateCulturalExplanation(lesson),
            culturalScenarios: generateCulturalScenarios(lesson),
            culturalTips: generateCulturalTips(lesson),

            // Phase 4: Independent Application Scenarios
            applicationScenarios: generateApplicationScenarios(lesson),

            // Academic metadata
            learningObjectives: generateLearningObjectives(lesson),
            prerequisites: [], // This would be populated by prerequisite check
            assessmentCriteria: generateAssessmentCriteria(lesson)
        };

        return NextResponse.json({
            lesson: academicContent,
            success: true
        });

    } catch (error) {
        console.error('❌ Academic lesson content loading failed:', error);
        
        return NextResponse.json(
            { 
                error: 'Failed to load academic lesson content',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}

/**
 * Generate grammar explanation content
 */
function generateGrammarExplanation(lesson, exercises) {
    const skillBasedExplanations = {
        'greetings': `Learning to greet people properly is fundamental in ${lesson.language_name || 'Albanian'}. Different situations require different levels of formality, and understanding these nuances will help you make a positive impression in social interactions.`,
        'pronouns': `Personal pronouns in ${lesson.language_name || 'Albanian'} follow specific patterns that differ from English. Understanding these patterns is crucial for constructing grammatically correct sentences.`,
        'family': `Family relationships and terms are central to ${lesson.language_name || 'Albanian'} culture. Learning these terms accurately will help you discuss family and understand social relationships.`,
        'present_tense': `The present tense forms the foundation of everyday communication. Master these patterns to express current actions, states, and habitual activities.`
    };

    const skillName = lesson.skill_name.toLowerCase();
    return skillBasedExplanations[skillName] || 
           `This lesson covers essential ${lesson.skill_name} concepts that are fundamental for ${lesson.course_cefr_level} level proficiency. Pay attention to the patterns and rules presented here.`;
}

/**
 * Generate grammar patterns
 */
function generateGrammarPatterns(lesson, exercises) {
    return `Notice how ${lesson.skill_name} follows consistent patterns in ${lesson.language_name}. These patterns will become automatic with practice and help you understand the underlying structure of the language.`;
}

/**
 * Generate grammar examples
 */
function generateGrammarExamples(lesson, exercises) {
    if (exercises.length > 0) {
        const exampleContent = exercises
            .filter(e => e.exercise_content)
            .slice(0, 3)
            .map(e => e.exercise_content)
            .join(', ');
        
        return `Here are key examples from this lesson: ${exampleContent}. These examples demonstrate the grammar concepts in practical contexts.`;
    }
    
    return `Examples will show you how ${lesson.skill_name} is used in real-world contexts. Pay attention to the structure and try to identify the patterns.`;
}

/**
 * Generate common mistakes
 */
function generateCommonMistakes(lesson, exercises) {
    const commonMistakePatterns = {
        'greetings': 'Avoid using informal greetings with elders or in professional settings. Always consider the social context.',
        'pronouns': 'Don\'t confuse subject and object pronouns. The word order in Albanian may differ from English.',
        'family': 'Remember that family terms can change based on your relationship to the person being discussed.',
        'present_tense': 'Watch out for irregular verbs that don\'t follow standard conjugation patterns.'
    };

    const skillName = lesson.skill_name.toLowerCase().replace(' ', '_');
    return commonMistakePatterns[skillName] || 
           `Common mistakes include overthinking the rules and not practicing enough. Focus on patterns rather than memorization.`;
}

/**
 * Transform exercises for academic structure
 */
function transformExercisesForAcademic(exercises) {
    if (exercises.length === 0) {
        return [
            {
                type: 'multiple_choice',
                question: 'Choose the correct form:',
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correct: 0,
                explanation: 'This demonstrates the concept learned in the grammar instruction.'
            }
        ];
    }

    return exercises.slice(0, 3).map((exercise, index) => ({
        type: exercise.exercise_type === 'multiple_choice' ? 'multiple_choice' : 'fill_blank',
        question: exercise.exercise_content || `Exercise ${index + 1}: Apply what you learned`,
        options: exercise.exercise_type === 'multiple_choice' 
            ? [exercise.correct_answer, 'Alternative 1', 'Alternative 2', 'Alternative 3']
            : undefined,
        correct: exercise.exercise_type === 'multiple_choice' ? 0 : exercise.correct_answer,
        explanation: exercise.explanation || 'This exercise reinforces the grammar patterns you just learned.'
    }));
}

/**
 * Generate cultural explanation
 */
function generateCulturalExplanation(lesson) {
    const culturalContexts = {
        'greetings': `In ${lesson.language_name} culture, greetings are important social rituals that show respect and establish relationships. The way you greet someone indicates your understanding of social hierarchy and cultural norms.`,
        'family': `Family is central to ${lesson.language_name} society. Understanding family relationships and appropriate terms helps you navigate social interactions and shows cultural awareness.`,
        'food': `Food culture in ${lesson.language_name} society is deeply connected to hospitality, family gatherings, and cultural identity. Learning food-related vocabulary opens doors to cultural experiences.`
    };

    const skillName = lesson.skill_name.toLowerCase();
    return culturalContexts[skillName] || 
           `Understanding the cultural context of ${lesson.skill_name} helps you use the language appropriately in real-world situations and shows respect for cultural norms.`;
}

/**
 * Generate cultural scenarios - Phase 3 Enhanced
 */
function generateCulturalScenarios(lesson) {
    const skillName = lesson.skill_name.toLowerCase();
    
    const culturalScenariosBySkill = {
        'greetings': [
            {
                id: `greeting_family_${lesson.id}`,
                scenario: 'Meeting your Albanian partner\'s grandmother for the first time',
                context: 'Family gatherings require special respect for elders',
                culturalElements: ['formal_address', 'hand_kissing_tradition', 'blessing_exchange'],
                competencyLevel: 'knowledge',
                learningObjective: 'Demonstrate appropriate respect through formal greetings'
            },
            {
                id: `greeting_religious_${lesson.id}`,
                scenario: 'Greeting neighbors during Bajram (Eid) celebration',
                context: 'Religious holidays have specific greeting customs',
                culturalElements: ['religious_greetings', 'holiday_wishes', 'community_respect'],
                competencyLevel: 'understanding',
                learningObjective: 'Show religious sensitivity and community awareness'
            }
        ],
        'family': [
            {
                id: `family_hierarchy_${lesson.id}`,
                scenario: 'Being introduced to extended family at a wedding',
                context: 'Understanding family hierarchy and proper introductions',
                culturalElements: ['family_titles', 'age_respect', 'relationship_mapping'],
                competencyLevel: 'awareness',
                learningObjective: 'Navigate family relationships with cultural sensitivity'
            },
            {
                id: `family_decision_${lesson.id}`,
                scenario: 'Participating in a family decision-making discussion',
                context: 'Family decisions often involve consultation with elders',
                culturalElements: ['elder_wisdom', 'collective_decision', 'respectful_participation'],
                competencyLevel: 'integration',
                learningObjective: 'Participate respectfully in family dynamics'
            }
        ],
        'hospitality': [
            {
                id: `hospitality_guest_${lesson.id}`,
                scenario: 'Being welcomed as a guest in an Albanian home',
                context: 'Albanian hospitality is legendary and has specific customs',
                culturalElements: ['guest_honor', 'food_offering', 'gift_exchange'],
                competencyLevel: 'knowledge',
                learningObjective: 'Accept hospitality gracefully while showing appreciation'
            }
        ]
    };
    
    return culturalScenariosBySkill[skillName] || [
        {
            id: `general_cultural_${lesson.id}`,
            scenario: 'Navigating social interactions in Albanian community settings',
            context: 'Understanding general cultural expectations and social norms',
            culturalElements: ['social_awareness', 'respectful_communication', 'cultural_adaptation'],
            competencyLevel: 'awareness',
            learningObjective: 'Demonstrate basic cultural awareness and respect'
        }
    ];
}

/**
 * Generate cultural tips - Phase 3 Enhanced
 */
function generateCulturalTips(lesson) {
    const skillName = lesson.skill_name.toLowerCase();
    
    const culturalTipsBySkill = {
        'greetings': [
            {
                tip: 'Always greet the eldest person first in group settings',
                importance: 'high',
                culturalReason: 'Shows respect for age and wisdom in Albanian culture',
                practicalApplication: 'Look for signs of age and defer to elders in introductions'
            },
            {
                tip: 'Use formal address (ju) until invited to use informal (ti)',
                importance: 'high',
                culturalReason: 'Formality shows respect and proper social boundaries',
                practicalApplication: 'Wait for explicit permission or family invitation to switch'
            },
            {
                tip: 'Physical greetings (handshakes, kisses) follow gender and age protocols',
                importance: 'medium',
                culturalReason: 'Traditional values influence physical contact customs',
                practicalApplication: 'Follow the lead of others and observe local customs'
            }
        ],
        'family': [
            {
                tip: 'Family titles are important - use them consistently',
                importance: 'high',
                culturalReason: 'Family hierarchy is central to Albanian social structure',
                practicalApplication: 'Learn and use appropriate titles like gjysh/gjyshe, dajë, etc.'
            },
            {
                tip: 'Children show respect by kissing elders\' hands during greetings',
                importance: 'medium',
                culturalReason: 'Traditional gesture showing respect and receiving blessings',
                practicalApplication: 'Understand this custom even if not expected from you as a foreigner'
            }
        ],
        'hospitality': [
            {
                tip: 'Always accept offered food/drink - refusal can be seen as rude',
                importance: 'high',
                culturalReason: 'Hospitality is a sacred duty and honor in Albanian culture',
                practicalApplication: 'Accept graciously even if just a small portion'
            },
            {
                tip: 'Compliment the home and cooking - it shows appreciation',
                importance: 'medium',
                culturalReason: 'Acknowledgment of hospitality strengthens relationships',
                practicalApplication: 'Use phrases like "Shumë e mirë" (very good) genuinely'
            }
        ]
    };
    
    const skillTips = culturalTipsBySkill[skillName] || [
        {
            tip: 'Observe and mirror respectful behavior in social settings',
            importance: 'high',
            culturalReason: 'Cultural sensitivity builds trust and relationships',
            practicalApplication: 'Watch how locals interact and follow their lead'
        }
    ];
    
    return skillTips.concat([
        {
            tip: 'Ask questions when unsure - Albanians appreciate genuine interest in their culture',
            importance: 'medium',
            culturalReason: 'Curiosity and respect for culture are valued traits',
            practicalApplication: 'Use phrases like "Si duhet të..." (How should I...)'
        }
    ]);
}

/**
 * Generate application scenarios
 */
function generateApplicationScenarios(lesson) {
    return [
        {
            situation: `You're meeting your ${lesson.language_name} host family for the first time.`,
            prompt: 'How would you introduce yourself and show respect?',
            type: 'open_response'
        },
        {
            situation: `You're at a family gathering and want to participate in conversations.`,
            prompt: 'How would you engage appropriately with different family members?',
            type: 'open_response'
        }
    ];
}

/**
 * Generate learning objectives
 */
function generateLearningObjectives(lesson) {
    return [
        `Master essential ${lesson.skill_name} vocabulary and grammar patterns`,
        `Apply ${lesson.skill_name} knowledge in cultural contexts`,
        `Demonstrate understanding through practical exercises`,
        `Use ${lesson.skill_name} appropriately in real-world scenarios`
    ];
}

/**
 * Generate assessment criteria
 */
function generateAssessmentCriteria(lesson) {
    return {
        grammarAccuracy: 'Correct use of grammar patterns and structures',
        culturalAwareness: 'Appropriate application of cultural knowledge',
        practicalApplication: 'Ability to use language in real-world contexts',
        comprehension: 'Understanding of key concepts and vocabulary'
    };
}