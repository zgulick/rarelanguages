import { NextResponse } from 'next/server';
const { query } = require('../../../../../../lib/database');

/**
 * Academic Lesson Content API
 * GET /api/lessons/[id]/academic-content
 * Returns comprehensive lesson content for 4-phase academic structure
 */
export async function GET(request, { params }) {
    try {
        const { id: lessonId } = await params;

        // Check if this is a comprehensive lesson first
        if (lessonId === '1' || lessonId === 'family' || lessonId.includes('family')) {
            console.log('Loading comprehensive family lesson...');
            try {
                const comprehensiveResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/lessons/comprehensive/family`, {
                    method: 'GET'
                });
                
                if (comprehensiveResponse.ok) {
                    const comprehensiveData = await comprehensiveResponse.json();
                    return NextResponse.json(comprehensiveData);
                }
            } catch (error) {
                console.log('Comprehensive lesson not available, falling back to demo...');
            }
        }
        
        // For real lesson UUIDs, try to load comprehensive content first
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(lessonId)) {
            console.log(`Loading comprehensive content for UUID lesson: ${lessonId}`);
            
            // Get lesson name to determine topic
            const lessonResult = await query(`
                SELECT l.name, s.name as skill_name
                FROM lessons l
                JOIN skills s ON l.skill_id = s.id
                WHERE l.id = $1
            `, [lessonId]);
            
            if (lessonResult.rows.length > 0) {
                const lessonInfo = lessonResult.rows[0];
                const lessonName = lessonInfo.name.toLowerCase();
                
                // Map lesson names to comprehensive topics
                let topic = 'family'; // default
                if (lessonName.includes('sound') || lessonName.includes('phoneme')) {
                    topic = 'sounds';
                } else if (lessonName.includes('grammar') || lessonName.includes('structure')) {
                    topic = 'grammar';
                } else if (lessonName.includes('vocabulary') || lessonName.includes('lexical')) {
                    topic = 'vocabulary';
                } else if (lessonName.includes('family')) {
                    topic = 'family';
                }
                
                try {
                    const comprehensiveResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/lessons/comprehensive/${topic}`, {
                        method: 'GET'
                    });
                    
                    if (comprehensiveResponse.ok) {
                        const comprehensiveData = await comprehensiveResponse.json();
                        console.log(`✅ Loaded comprehensive ${topic} lesson for ${lessonInfo.name}`);
                        return NextResponse.json(comprehensiveData);
                    }
                } catch (error) {
                    console.log(`Failed to load comprehensive ${topic} lesson, falling back...`);
                }
            }
        } else {
            console.log(`Non-UUID lesson ID: ${lessonId}, checking for comprehensive lessons...`);
            
            // Try to match with comprehensive lessons by lesson ID
            const comprehensiveTopics = {
                '2': 'greetings',
                '7': 'home',
                '8': 'daily'
            };
            
            if (comprehensiveTopics[lessonId]) {
                try {
                    const comprehensiveResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/lessons/comprehensive/${comprehensiveTopics[lessonId]}`, {
                        method: 'GET'
                    });
                    
                    if (comprehensiveResponse.ok) {
                        const comprehensiveData = await comprehensiveResponse.json();
                        return NextResponse.json(comprehensiveData);
                    }
                } catch (error) {
                    console.log('Comprehensive lesson not available, using demo...');
                }
            }
            
            return NextResponse.json({
                lesson: generateDemoLesson(lessonId),
                success: true
            });
        }

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

        // Get lesson exercises for guided practice (through lesson_content)
        const exercisesResult = await query(`
            SELECT DISTINCT
                ev.*,
                lc.english_phrase,
                lc.target_phrase,
                lc.difficulty_score as content_difficulty
            FROM lesson_content lc
            JOIN exercise_variations ev ON lc.id = ev.content_id
            WHERE lc.lesson_id = $1
            ORDER BY lc.difficulty_score, ev.difficulty_level
            LIMIT 10
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
 * Generate demo lesson content for invalid IDs
 */
function generateDemoLesson(lessonId) {
    return {
        id: `demo-lesson-${lessonId}`,
        name: 'Demo: Family Members',
        description: 'Learn essential vocabulary for Albanian family relationships',
        difficultyLevel: 1,
        position: 1,
        estimatedMinutes: 45,
        
        courseId: 'demo-course-1',
        courseName: 'Albanian 101: Fundamentals',
        courseLevel: 1,
        cefrLevel: 'A1',
        
        skillName: 'Family Vocabulary',
        skillPosition: 1,
        
        language: {
            name: 'Albanian (Gheg)',
            code: 'gheg-al',
            nativeName: 'Shqip (Gegë)'
        },

        // Phase 1: Grammar instruction
        grammarExplanation: `
## Albanian Family Vocabulary & Relationships - Comprehensive Lesson

**What You'll Master in This 45-Minute Lesson:**
- 25+ family member terms including extended family
- Possessive pronouns (im/ime/tanë) with gender agreement
- Basic sentence construction for family introductions
- Numbers 1-10 for describing family size
- Cultural context for Albanian family structures

**Core Family Vocabulary (Immediate Family):**
- **babai** [BAH-bye] - father
- **nëna** [NUH-na] - mother  
- **djali** [JAH-lee] - son/boy
- **vajza** [VYE-za] - daughter/girl
- **vëllai** [VUHL-lye] - brother
- **motra** [MO-tra] - sister

**Extended Family Terms:**
- **gjyshi** [JISH-ee] - grandfather
- **gjyshja** [JISH-ya] - grandmother
- **daja** [DAH-ya] - maternal uncle
- **teta** [TEH-ta] - aunt
- **kushëriri** [koo-shuh-REE-ree] - male cousin
- **kushërira** [koo-shuh-REE-ra] - female cousin
- **nipëri** [nee-PUH-ree] - nephew
- **mbesa** [m-BEH-sa] - niece

**Possessive Pronouns & Gender Agreement:**
- **im** (masculine): babai im, vëllai im, gjyshi im
- **ime** (feminine): nëna ime, motra ime, gjyshja ime
- **tanë** (our/plural): familja jonë, shtëpia jonë

**Essential Sentence Patterns:**
1. **Introductions:** 
   - "Ky është babai im" (This is my father)
   - "Kjo është motra ime" (This is my sister)
   
2. **Family Size:**
   - "Kam dy vëllezër" (I have two brothers)
   - "Kam një motër" (I have one sister)
   
3. **Descriptions:**
   - "Babai im punon si mësues" (My father works as a teacher)
   - "Nëna ime është mjeke" (My mother is a doctor)

**Numbers 1-10 for Family:**
- një (1), dy (2), tre (3), katër (4), pesë (5)
- gjashtë (6), shtatë (7), tetë (8), nëntë (9), dhjetë (10)
        `,
        
        patterns: `
## Family Vocabulary Patterns

**Pattern 1: Possession**
- Add "im/ime" to show "my"
- "babai im" (my father) - masculine
- "nëna ime" (my mother) - feminine

**Pattern 2: Introduction**
- "Ky është..." (This is...) for males
- "Kjo është..." (This is...) for females
        `,

        examples: `Here are key family terms: "babai" (father), "nëna" (mother), "djali" (son), "vajza" (daughter)`,
        
        commonMistakes: `Remember that Albanian has gender - use "im" for masculine family members and "ime" for feminine ones.`,

        // Phase 2: Guided practice
        guidedExercises: [
            {
                type: 'multiple_choice',
                question: 'How do you say "mother" in Albanian?',
                options: ['nëna', 'babai', 'djali', 'vajza'],
                correct: 0,
                explanation: 'The correct answer is "nëna" - this is how you say mother in Albanian.'
            },
            {
                type: 'fill_blank',
                question: 'Complete: "Ky është _____ im" (This is my father)',
                correct: 'babai',
                explanation: 'The correct answer is "babai" (father). Notice we use "im" because father is masculine.'
            },
            {
                type: 'multiple_choice',
                question: 'Which possessive pronoun goes with "motra" (sister)?',
                options: ['ime', 'im', 'tanë', 'e'],
                correct: 0,
                explanation: '"Motra" is feminine, so we use "ime": "motra ime" (my sister).'
            },
            {
                type: 'fill_blank',
                question: 'How do you say "I have two brothers"? Kam _____ vëllezër.',
                correct: 'dy',
                explanation: '"Dy" means "two" in Albanian. The full sentence is "Kam dy vëllezër".'
            },
            {
                type: 'multiple_choice',
                question: 'What is the Albanian word for "grandfather"?',
                options: ['gjyshi', 'gjyshja', 'daja', 'teta'],
                correct: 0,
                explanation: '"Gjyshi" is grandfather. "Gjyshja" is grandmother, "daja" is uncle, "teta" is aunt.'
            },
            {
                type: 'fill_blank',
                question: 'Complete the introduction: "Kjo është _____ ime" (This is my sister)',
                correct: 'motra',
                explanation: '"Motra" means sister. We use "kjo" (this/feminine) and "ime" (my/feminine) with feminine nouns.'
            },
            {
                type: 'multiple_choice',
                question: 'How would you say "My father works as a teacher"?',
                options: ['Babai im punon si mësues', 'Nëna ime punon si mësuese', 'Vëllai im është student', 'Motra ime është mjeke'],
                correct: 0,
                explanation: '"Babai im punon si mësues" = "My father works as a teacher". "Punon" means "works" and "mësues" means "teacher".'
            },
            {
                type: 'fill_blank',
                question: 'What number comes after "tre" (three)? një, dy, tre, _____',
                correct: 'katër',
                explanation: '"Katër" means "four". The sequence is: një (1), dy (2), tre (3), katër (4).'
            }
        ],

        // Phase 3: Cultural context
        culturalExplanation: `Family is extremely important in Albanian culture! Extended families often live together or nearby, and respect for elders is very important.`,
        
        culturalScenarios: [
            {
                id: 'demo_family_dinner',
                scenario: 'Meeting your Albanian friend\'s family for dinner',
                context: 'You should greet the elders first and show respect',
                culturalElements: ['family_respect', 'elder_greeting', 'dinner_customs'],
                competencyLevel: 'awareness',
                learningObjective: 'Show proper respect when meeting Albanian families'
            }
        ],

        culturalTips: [
            {
                tip: 'Always greet grandparents first when entering a room',
                importance: 'high',
                culturalReason: 'Respect for elders is fundamental in Albanian culture',
                practicalApplication: 'Say "Tungjatjeta" to gjyshi and gjyshja before greeting your friends'
            }
        ],

        // Phase 4: Application scenarios  
        applicationScenarios: [
            {
                situation: 'You\'re introducing your own family to Albanian friends',
                prompt: 'How would you present your family members using what you\'ve learned?',
                type: 'open_response'
            }
        ],

        learningObjectives: [
            'Learn basic Albanian family vocabulary',
            'Understand family relationships in Albanian culture', 
            'Practice pronunciation of family terms',
            'Feel confident talking about family with Albanian speakers'
        ],

        assessmentCriteria: {
            grammarAccuracy: 'Can use basic family vocabulary correctly',
            culturalAwareness: 'Shows understanding of Albanian family values',
            practicalApplication: 'Can introduce family members appropriately', 
            comprehension: 'Understands main family vocabulary terms'
        }
    };
}

/**
 * Generate comprehensive grammar explanation content with actual lesson data
 */
function generateGrammarExplanation(lesson, exercises) {
    // Extract actual phrases from exercises for concrete examples
    const phraseExamples = exercises
        .filter(e => e.english_phrase && e.target_phrase)
        .slice(0, 3)
        .map(e => ({ english: e.english_phrase, albanian: e.target_phrase }));
    
    // Generate skill-specific grammar instruction
    const skillName = lesson.skill_name.toLowerCase();
    let grammarInstruction = '';
    
    if (skillName.includes('phonological') || skillName.includes('sound')) {
        grammarInstruction = `
## Albanian Pronunciation and Sounds

**What You'll Learn:**
- How to pronounce Albanian letters correctly
- Which sounds are different from English
- Tips for better pronunciation
- Practice with common sound patterns

**Albanian Alphabet Basics:**
Albanian has 36 letters, including some that don't exist in English. Here are the tricky ones:

**Special Vowels:**
- **ë**: Like the "a" in "about" - very common in Albanian
- **y**: Like the "u" in French "tu" - round your lips and say "ee"

**Special Consonants:**
- **q**: Sounds like "ch" in "chair"
- **x**: Sounds like "ds" said quickly together  
- **xh**: Sounds like "j" in "judge"
- **gj**: A soft "g" sound, like "g" + "y" together
- **nj**: Sounds like "ny" in "canyon"
- **rr**: Roll your "r" like in Spanish
- **th**: Sounds like "th" in "think"
- **dh**: Sounds like "th" in "this"

**Pronunciation Tips:**
- Albanian is mostly pronounced as it's written (unlike English!)
- Stress usually falls on the second-to-last syllable
- Practice rolling your r's - it takes time but makes you sound more natural
        `;
    } else if (skillName.includes('greet')) {
        grammarInstruction = `
## Albanian Greetings - Being Polite and Friendly

**What You'll Learn:**
- Basic greetings for different times of day
- How to be polite vs. casual with different people
- Common questions people ask when meeting
- How to respond appropriately

**Polite vs. Casual Speech:**
Albanian has two ways to say "you" - kind of like Spanish:
- **ju** (formal): Use with adults you don't know well, teachers, older people
- **ti** (casual): Use with friends, family, people your age

**Basic Greeting Pattern:**
1. Say hello + ask how they are
2. They respond + ask you back  
3. You respond
4. Optional: Ask their name or where they're from

**When to Use Each:**
- **Formal (ju)**: Meeting parents, at school with teachers, with older neighbors
- **Casual (ti)**: With friends, siblings, classmates you know well
        `;
    } else {
        grammarInstruction = `
## ${lesson.skill_name} - Let's Learn the Basics

**What You'll Learn:**
- Essential vocabulary for ${lesson.skill_name}
- How to make simple sentences
- Pronunciation tips for new words
- Common patterns to remember

**Albanian Sentence Basics:**
Albanian sentences work a lot like English:
- **Subject + Verb + Object** (like "I eat pizza")
- The main difference: some words change their endings depending on their role
- Don't worry about memorizing all the rules - focus on patterns!
        `;
    }

    // Add concrete examples from lesson content
    if (phraseExamples.length > 0) {
        grammarInstruction += `
**Examples You'll Learn:**
${phraseExamples.map(ex => `- "${ex.english}" → **${ex.albanian}**`).join('\n')}

**Study Tips:**
Look at these examples and try to spot the patterns. Don't worry if it seems confusing at first - that's normal! You'll practice these phrases step by step in the exercises.
        `;
    }

    return grammarInstruction;
}

/**
 * Generate detailed grammar patterns with actual examples
 */
function generateGrammarPatterns(lesson, exercises) {
    const phraseExamples = exercises.filter(e => e.english_phrase && e.target_phrase);
    
    let patterns = `## Patterns You'll Notice\n\n`;
    
    // Analyze patterns based on the actual phrases
    if (phraseExamples.length > 0) {
        patterns += `**Look for These Patterns:**\n`;
        patterns += `As you study Albanian, you'll start noticing how the language works. Here's what to watch for:\n\n`;
        
        phraseExamples.slice(0, 4).forEach((ex, i) => {
            const analysis = analyzePhraseLinguistically(ex.english_phrase, ex.target_phrase);
            patterns += `${i + 1}. **${ex.english_phrase}** → **${ex.target_phrase}**\n`;
            patterns += `   💡 ${analysis}\n\n`;
        });
        
        patterns += `**Common Albanian Patterns:**\n\n`;
        patterns += `**Making Negative Statements:**\n`;
        patterns += `- Put "nuk" before the verb to make it negative\n`;
        patterns += `- Example: "E di" (I know) → "Nuk e di" (I don't know)\n\n`;
        
        patterns += `**Asking Questions:**\n`;
        patterns += `- Your voice goes up at the end for yes/no questions\n`;
        patterns += `- For "what, who, where" questions, put the question word first\n`;
        patterns += `- Example: "Ku jeton?" (Where do you live?)\n\n`;
        
        patterns += `**Describing Things:**\n`;
        patterns += `- Use "jam/je/është" (am/are/is) like in English\n`;
        patterns += `- Example: "Jam student" (I am a student)\n`;
    } else {
        patterns += `Study how Albanian expresses ${lesson.skill_name}. Look for consistent patterns in word order, verb forms, and sentence structure.`;
    }
    
    return patterns;
}

/**
 * Linguistic analysis helper for phrase patterns
 */
function analyzePhraseLinguistically(englishPhrase, albanianPhrase) {
    const analyses = {
        "I don't understand": "Notice 'nuk' comes before the verb to make it negative, and 'po' shows it's happening right now",
        "I am a student": "Simple pattern: 'Jam' (I am) + what you are. No need for 'a' like in English",
        "Can you help me": "Polite question - 'A mundesh' (can you) + action. The 'A' makes it extra polite",
        "What is your name": "Question word 'Si' comes first, then the rest follows normal word order",
        "Hello, how are you": "'Tungjatjeta' or 'Tung' for hello, then 'si je' (how are you) - just like English order",
        "Thank you very much": "'Faleminderit' is thank you, add 'shumë' (very) to make it stronger",
        "Where are you from": "'Prej kah' means 'from where' - the question word comes first",
        "Please speak slowly": "'Fol' (speak) + 'ngadalë' (slowly). Add 'të lutem' (please) to be polite"
    };
    
    const key = Object.keys(analyses).find(k => englishPhrase.toLowerCase().includes(k.toLowerCase()));
    return key ? analyses[key] : "This follows common Albanian sentence patterns - you'll get the hang of it with practice!";
}

/**
 * Generate grammar examples
 */
function generateGrammarExamples(lesson, exercises) {
    if (exercises.length > 0) {
        const exampleContent = exercises
            .filter(e => e.english_phrase && e.target_phrase)
            .slice(0, 3)
            .map(e => `"${e.english_phrase}" → "${e.target_phrase}"`)
            .join(', ');
        
        if (exampleContent) {
            return `Here are some key examples from this lesson: ${exampleContent}. These show you how the grammar works in real conversations.`;
        }
    }
    
    return `You'll see examples of how ${lesson.skill_name} is used in everyday situations. Focus on understanding the patterns rather than memorizing every detail.`;
}

/**
 * Generate common mistakes
 */
function generateCommonMistakes(lesson, exercises) {
    const commonMistakePatterns = {
        'greetings': 'Remember to use formal speech (ju) with adults you don\'t know well. It\'s better to be too polite than not polite enough!',
        'pronouns': 'Don\'t worry if you mix up word order at first - Albanian is a bit different from English. Practice makes perfect!',
        'family': 'Family terms can be tricky because they change based on who you\'re talking to. Start with the basics and build up.',
        'present_tense': 'Some verbs are irregular - they don\'t follow the normal patterns. Learn the most common ones first.'
    };

    const skillName = lesson.skill_name.toLowerCase().replace(' ', '_');
    return commonMistakePatterns[skillName] || 
           `Don't stress about making mistakes - that's how you learn! Focus on communication first, perfect grammar comes with time.`;
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

    // Use all available exercises but organize by difficulty
    const sortedExercises = exercises.sort((a, b) => (a.difficulty_level || 1) - (b.difficulty_level || 1));
    
    return sortedExercises.map((exercise, index) => {
        const exerciseData = exercise.exercise_data || {};
        
        if (exercise.exercise_type === 'multiple_choice') {
            const options = exerciseData.options || [];
            const correctAnswer = exerciseData.correct_answer || exercise.target_phrase || 'Correct Answer';
            
            return {
                type: 'multiple_choice',
                question: exerciseData.question || `Translate: "${exercise.english_phrase}"`,
                options: options.length > 0 ? options : [correctAnswer, 'Alternative 1', 'Alternative 2', 'Alternative 3'],
                correct: 0, // Assume correct answer is first
                explanation: exerciseData.explanation || `The correct translation is "${correctAnswer}".`
            };
        } else if (exercise.exercise_type === 'fill_blank') {
            return {
                type: 'fill_blank',
                question: exerciseData.question || `How do you say "${exercise.english_phrase}"?`,
                correct: exerciseData.correct_answer || exercise.target_phrase || 'correct answer',
                explanation: exerciseData.explanation || `The correct answer is "${exercise.target_phrase}".`
            };
        } else {
            // Convert other exercise types to fill_blank for academic structure
            return {
                type: 'fill_blank',
                question: `Translate: "${exercise.english_phrase}"`,
                correct: exercise.target_phrase || 'correct answer',
                explanation: `The correct translation is "${exercise.target_phrase}".`
            };
        }
    });
}

/**
 * Generate cultural explanation
 */
function generateCulturalExplanation(lesson) {
    const culturalContexts = {
        'greetings': `In Albanian culture, how you greet someone is really important! It shows you understand when to be formal vs. casual, and Albanians appreciate when you make the effort to greet properly.`,
        'family': `Family is super important in Albanian culture. Learning the right words for family members and how to talk about them respectfully will help you connect with Albanian people and understand their values.`,
        'food': `Food brings Albanian families together! Understanding food culture helps you participate in meals and social gatherings, which are central to Albanian social life.`
    };

    const skillName = lesson.skill_name.toLowerCase();
    return culturalContexts[skillName] || 
           `Learning about Albanian culture alongside the language helps you understand why people say things certain ways and makes your conversations more natural and respectful.`;
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
                scenario: 'Meeting your Albanian friend\'s parents for the first time',
                context: 'When meeting parents, you should be respectful and formal',
                culturalElements: ['formal_address', 'polite_conversation', 'showing_respect'],
                competencyLevel: 'knowledge',
                learningObjective: 'Use formal greetings to show respect to elders'
            },
            {
                id: `greeting_school_${lesson.id}`,
                scenario: 'Starting at a new school with Albanian classmates',
                context: 'School greetings can be casual with peers but formal with teachers',
                culturalElements: ['peer_greetings', 'teacher_respect', 'making_friends'],
                competencyLevel: 'understanding',
                learningObjective: 'Know when to use formal vs casual greetings'
            }
        ],
        'family': [
            {
                id: `family_hierarchy_${lesson.id}`,
                scenario: 'Going to your Albanian friend\'s family dinner',
                context: 'Albanian families often eat together and you should know how to talk to everyone',
                culturalElements: ['family_titles', 'dinner_conversation', 'showing_interest'],
                competencyLevel: 'awareness',
                learningObjective: 'Use proper family terms and show interest in the family'
            },
            {
                id: `family_celebration_${lesson.id}`,
                scenario: 'Attending a family birthday party',
                context: 'Family celebrations are important and everyone participates',
                culturalElements: ['celebration_participation', 'gift_giving', 'family_bonding'],
                competencyLevel: 'integration',
                learningObjective: 'Participate appropriately in family celebrations'
            }
        ],
        'hospitality': [
            {
                id: `hospitality_guest_${lesson.id}`,
                scenario: 'Having dinner at your Albanian friend\'s house',
                context: 'Albanian families love to share food and will offer you lots to eat!',
                culturalElements: ['accepting_food', 'complimenting_cooking', 'showing_gratitude'],
                competencyLevel: 'knowledge',
                learningObjective: 'Accept hospitality politely and show appreciation for the food and kindness'
            }
        ]
    };
    
    return culturalScenariosBySkill[skillName] || [
        {
            id: `general_cultural_${lesson.id}`,
            scenario: 'Hanging out with Albanian friends in your community',
            context: 'Understanding how to interact respectfully and make good impressions',
            culturalElements: ['being_respectful', 'friendly_conversation', 'cultural_curiosity'],
            competencyLevel: 'awareness',
            learningObjective: 'Show respect and interest in Albanian culture while making friends'
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
                tip: 'Always greet older people first when entering a room',
                importance: 'high',
                culturalReason: 'Albanians really respect their elders and appreciate when young people show this respect',
                practicalApplication: 'Say hello to parents, grandparents, and teachers before greeting your friends'
            },
            {
                tip: 'Use "ju" (formal you) with adults until they tell you it\'s okay to use "ti"',
                importance: 'high',
                culturalReason: 'Being formal shows you have good manners and were raised well',
                practicalApplication: 'Start formal with your friends\' parents - they might invite you to be casual later'
            },
            {
                tip: 'A handshake or small wave is usually good for greetings',
                importance: 'medium',
                culturalReason: 'Albanian greeting customs can vary by family and region',
                practicalApplication: 'Watch what others do and follow their lead - when in doubt, a friendly handshake works'
            }
        ],
        'family': [
            {
                tip: 'Learn the family titles and use them - like "gjysh" for grandpa',
                importance: 'high',
                culturalReason: 'Albanian families are tight-knit and using the right titles shows you respect family bonds',
                practicalApplication: 'Ask your friends what to call their family members - they\'ll appreciate that you care'
            },
            {
                tip: 'Show interest in the family - ask about siblings, parents, grandparents',
                importance: 'medium',
                culturalReason: 'Family is everything in Albanian culture, so showing interest in family shows you understand what\'s important',
                practicalApplication: 'Ask questions like "How is your grandmother?" or "Do you have brothers and sisters?"'
            }
        ],
        'hospitality': [
            {
                tip: 'Always try the food they offer you - even if it\'s just a little bit',
                importance: 'high',
                culturalReason: 'Albanian families love to feed people and it shows love and care - saying no can hurt feelings',
                practicalApplication: 'Even if you\'re not hungry, take a small taste and say "Faleminderit" (thank you)'
            },
            {
                tip: 'Compliment the food and say how nice their home is',
                importance: 'medium',
                culturalReason: 'Albanians take pride in their cooking and homes - compliments make them happy',
                practicalApplication: 'Say things like "Shumë e mirë!" (Very good!) about the food or "Sa e bukur!" (How beautiful!) about their home'
            }
        ]
    };
    
    const skillTips = culturalTipsBySkill[skillName] || [
        {
            tip: 'Watch what other people do and copy their behavior',
            importance: 'high',
            culturalReason: 'Showing that you want to fit in and be respectful makes people like you',
            practicalApplication: 'If you\'re not sure what to do, just watch your friends and do what they do'
        }
    ];
    
    return skillTips.concat([
        {
            tip: 'Don\'t be afraid to ask questions - Albanians love when you\'re interested in their culture',
            importance: 'medium',
            culturalReason: 'People are happy when you want to learn about their culture and traditions',
            practicalApplication: 'Ask things like "How should I do this?" or "What does this mean?" - people will be happy to explain'
        }
    ]);
}

/**
 * Generate application scenarios
 */
function generateApplicationScenarios(lesson) {
    return [
        {
            situation: `You're meeting your Albanian friend's family for the first time.`,
            prompt: 'How would you introduce yourself and make a good impression?',
            type: 'open_response'
        },
        {
            situation: `You're hanging out with Albanian friends and their families.`,
            prompt: 'How would you join conversations and show that you respect their culture?',
            type: 'open_response'
        }
    ];
}

/**
 * Generate learning objectives
 */
function generateLearningObjectives(lesson) {
    return [
        `Learn key ${lesson.skill_name} vocabulary and basic patterns`,
        `Understand how to use ${lesson.skill_name} in Albanian culture`,
        `Practice what you've learned through exercises`,
        `Feel confident using ${lesson.skill_name} with Albanian friends and families`
    ];
}

/**
 * Generate assessment criteria
 */
function generateAssessmentCriteria(lesson) {
    return {
        grammarAccuracy: 'Can use basic grammar patterns correctly most of the time',
        culturalAwareness: 'Shows understanding of Albanian cultural values and customs',
        practicalApplication: 'Can use what they learned in real conversations and situations',
        comprehension: 'Understands the main vocabulary and concepts from the lesson'
    };
}