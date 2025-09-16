#!/usr/bin/env node

require('dotenv').config();
const { OpenAIClient } = require('../lib/openai');
const db = require('../lib/database');

/**
 * Comprehensive Lesson Content Generator
 * Creates textbook-quality lessons with extensive vocabulary, grammar, examples, and patterns
 */

class ComprehensiveLessonGenerator {
    constructor() {
        this.openaiClient = new OpenAIClient();
        this.totalCost = 0;
    }

    async generateComprehensiveContent(topic, lessonNumber = 1) {
        console.log(`📚 Generating comprehensive lesson content for: ${topic}`);
        
        const prompt = `Create comprehensive textbook-quality Albanian language lesson content for: "${topic}"

This should be LESSON ${lessonNumber} level content - substantial, thorough, and rich like a university textbook chapter.

REQUIRED SECTIONS TO GENERATE:

1. VOCABULARY SECTION (30+ items):
   - Core vocabulary (15+ terms)
   - Related vocabulary (10+ terms) 
   - Advanced/contextual vocabulary (8+ terms)
   - Include pronunciation guides [phonetic]
   - Include gender markers (m/f)

2. GRAMMAR FOCUS:
   - Main grammar concept for this lesson
   - 5+ example sentences showing the pattern
   - Common variations and exceptions
   - Progressive difficulty examples

3. VERB CONJUGATIONS:
   - 3-5 key verbs related to the topic
   - Full present tense conjugations
   - Usage examples for each form
   - Regular vs irregular patterns

4. SENTENCE PATTERNS & STRUCTURES:
   - 10+ essential sentence patterns
   - Template sentences with substitution options
   - Building complexity gradually
   - Common mistakes to avoid

5. EXTENSIVE EXAMPLES:
   - 15+ example sentences with translations
   - Dialogue examples (3+ exchanges)
   - Real-world usage scenarios
   - Progressive complexity

6. CULTURAL CONTEXT:
   - Cultural background and context
   - Social customs and etiquette
   - Regional variations if relevant
   - Practical cultural tips

7. PRACTICE PREPARATION:
   - Review of key points
   - Patterns to remember
   - Common expressions to memorize
   - Transition phrases for conversations

FORMAT AS JSON:
{
  "topic": "${topic}",
  "lesson_number": ${lessonNumber},
  "estimated_study_time": "45-60 minutes",
  "vocabulary": {
    "core_terms": [
      {
        "albanian": "term",
        "english": "meaning",
        "pronunciation": "[phonetic]",
        "gender": "m/f/n",
        "example_sentence": "Albanian sentence",
        "english_translation": "English translation"
      }
    ],
    "related_terms": [...],
    "advanced_terms": [...]
  },
  "grammar_focus": {
    "concept": "Main grammar concept",
    "explanation": "Detailed explanation",
    "examples": [
      {
        "albanian": "example",
        "english": "translation",
        "explanation": "why this works"
      }
    ],
    "patterns": ["pattern 1", "pattern 2"],
    "exceptions": ["exception 1", "exception 2"]
  },
  "verb_conjugations": [
    {
      "infinitive": "verb",
      "english": "to do something",
      "type": "regular/irregular",
      "present_tense": {
        "une": "form",
        "ti": "form", 
        "ai_ajo": "form",
        "ne": "form",
        "ju": "form",
        "ata_ato": "form"
      },
      "usage_examples": [
        {"albanian": "sentence", "english": "translation"}
      ]
    }
  ],
  "sentence_patterns": [
    {
      "pattern": "Template with [SUBSTITUTION] slots",
      "explanation": "When to use this pattern",
      "examples": [
        {"albanian": "example", "english": "translation"}
      ]
    }
  ],
  "extensive_examples": {
    "basic_sentences": [
      {"albanian": "sentence", "english": "translation", "notes": "grammar note"}
    ],
    "dialogues": [
      {
        "title": "Dialogue title",
        "exchanges": [
          {"speaker": "A", "albanian": "line", "english": "translation"},
          {"speaker": "B", "albanian": "line", "english": "translation"}
        ]
      }
    ],
    "scenarios": [
      {
        "situation": "Real-world scenario",
        "examples": [
          {"albanian": "phrase", "english": "meaning", "context": "when to use"}
        ]
      }
    ]
  },
  "cultural_context": {
    "background": "Cultural background",
    "customs": ["custom 1", "custom 2"],
    "etiquette": ["tip 1", "tip 2"],
    "regional_notes": "Regional variations",
    "practical_tips": ["tip 1", "tip 2"]
  },
  "review_summary": {
    "key_vocabulary": ["term 1", "term 2"],
    "key_grammar": ["concept 1", "concept 2"],
    "essential_phrases": ["phrase 1", "phrase 2"],
    "next_lesson_prep": "What to expect next"
  }
}

IMPORTANT: 
- Generate 30+ vocabulary items total (manageable but comprehensive)
- Include 15+ example sentences minimum
- Provide comprehensive grammar explanations
- Make it feel like a rich textbook chapter
- Focus on practical, family-integration scenarios
- Include pronunciation guides for key terms
- Ensure cultural authenticity
- Keep JSON response under 5000 tokens for parsing

Generate comprehensive, rich content worthy of 45-60 minutes of study.`;

        try {
            console.log('🤖 Requesting comprehensive content from OpenAI...');
            const response = await this.openaiClient.makeRequest([
                { 
                    role: 'system', 
                    content: 'You are an expert Albanian language curriculum developer and textbook author. Create comprehensive, university-quality lesson content that provides extensive vocabulary, grammar, examples, and cultural context.' 
                },
                { role: 'user', content: prompt }
            ], 'comprehensive-lesson-generation');

            this.totalCost += 0.15; // Approximate cost for comprehensive generation

            // Parse the response
            let lessonContent;
            try {
                let cleanContent = response.content.trim();
                if (cleanContent.startsWith('```json')) {
                    cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
                }
                lessonContent = JSON.parse(cleanContent);
            } catch (parseError) {
                console.error('❌ Failed to parse OpenAI response:', parseError);
                console.error('Raw response:', response.content.substring(0, 1000));
                throw new Error('Invalid JSON response from OpenAI');
            }

            console.log(`✅ Generated comprehensive lesson content:`);
            console.log(`   📝 Vocabulary items: ${this.countVocabularyItems(lessonContent)}`);
            console.log(`   🔤 Grammar patterns: ${lessonContent.grammar_focus?.patterns?.length || 0}`);
            console.log(`   🗣️  Example sentences: ${this.countExampleSentences(lessonContent)}`);
            console.log(`   💰 Cost: $${this.totalCost.toFixed(3)}`);

            return lessonContent;

        } catch (error) {
            console.error('❌ Failed to generate comprehensive content:', error);
            throw error;
        }
    }

    countVocabularyItems(content) {
        const vocab = content.vocabulary || {};
        return (vocab.core_terms?.length || 0) + 
               (vocab.related_terms?.length || 0) + 
               (vocab.advanced_terms?.length || 0);
    }

    countExampleSentences(content) {
        const examples = content.extensive_examples || {};
        return (examples.basic_sentences?.length || 0) + 
               (examples.scenarios?.reduce((acc, scenario) => acc + (scenario.examples?.length || 0), 0) || 0);
    }

    async saveComprehensiveLessonContent(lessonContent, languageCode = 'gheg-al') {
        console.log(`💾 Saving comprehensive lesson content to database...`);

        try {
            // Get language ID
            const langResult = await db.query('SELECT id FROM languages WHERE code = $1', [languageCode]);
            if (langResult.rows.length === 0) {
                throw new Error(`Language ${languageCode} not found`);
            }
            const languageId = langResult.rows[0].id;

            // Save main lesson record
            const lessonResult = await db.query(`
                INSERT INTO comprehensive_lessons (
                    language_id, topic, lesson_number, estimated_study_time,
                    content_data, created_at
                ) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id
            `, [
                languageId,
                lessonContent.topic,
                lessonContent.lesson_number,
                lessonContent.estimated_study_time,
                JSON.stringify(lessonContent)
            ]);

            const lessonId = lessonResult.rows[0].id;

            // Save vocabulary items
            if (lessonContent.vocabulary) {
                const allVocab = [
                    ...(lessonContent.vocabulary.core_terms || []),
                    ...(lessonContent.vocabulary.related_terms || []),
                    ...(lessonContent.vocabulary.advanced_terms || [])
                ];

                for (const vocabItem of allVocab) {
                    await db.query(`
                        INSERT INTO lesson_vocabulary (
                            lesson_id, albanian_term, english_term, pronunciation,
                            gender, example_sentence, english_translation, difficulty_level
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    `, [
                        lessonId,
                        vocabItem.albanian,
                        vocabItem.english,
                        vocabItem.pronunciation,
                        vocabItem.gender,
                        vocabItem.example_sentence,
                        vocabItem.english_translation,
                        lessonContent.vocabulary.core_terms?.includes(vocabItem) ? 1 :
                        lessonContent.vocabulary.related_terms?.includes(vocabItem) ? 2 : 3
                    ]);
                }
            }

            // Save example sentences
            if (lessonContent.extensive_examples?.basic_sentences) {
                for (const example of lessonContent.extensive_examples.basic_sentences) {
                    await db.query(`
                        INSERT INTO lesson_examples (
                            lesson_id, albanian_sentence, english_translation,
                            grammar_notes, example_type
                        ) VALUES ($1, $2, $3, $4, $5)
                    `, [
                        lessonId,
                        example.albanian,
                        example.english,
                        example.notes,
                        'basic_sentence'
                    ]);
                }
            }

            // Save dialogues
            if (lessonContent.extensive_examples?.dialogues) {
                for (const dialogue of lessonContent.extensive_examples.dialogues) {
                    const dialogueResult = await db.query(`
                        INSERT INTO lesson_dialogues (
                            lesson_id, title, dialogue_data
                        ) VALUES ($1, $2, $3) RETURNING id
                    `, [
                        lessonId,
                        dialogue.title,
                        JSON.stringify(dialogue.exchanges)
                    ]);
                }
            }

            console.log(`✅ Saved comprehensive lesson content (ID: ${lessonId})`);
            return lessonId;

        } catch (error) {
            console.error('❌ Failed to save lesson content:', error);
            throw error;
        }
    }

    async createDatabaseTables() {
        console.log('🔧 Creating comprehensive lesson database tables...');

        const tables = [
            `CREATE TABLE IF NOT EXISTS comprehensive_lessons (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                language_id UUID REFERENCES languages(id),
                topic VARCHAR(255) NOT NULL,
                lesson_number INTEGER NOT NULL,
                estimated_study_time VARCHAR(50),
                content_data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )`,
            
            `CREATE TABLE IF NOT EXISTS lesson_vocabulary (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                lesson_id UUID REFERENCES comprehensive_lessons(id),
                albanian_term VARCHAR(255) NOT NULL,
                english_term VARCHAR(255) NOT NULL,
                pronunciation VARCHAR(255),
                gender VARCHAR(10),
                example_sentence TEXT,
                english_translation TEXT,
                difficulty_level INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            
            `CREATE TABLE IF NOT EXISTS lesson_examples (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                lesson_id UUID REFERENCES comprehensive_lessons(id),
                albanian_sentence TEXT NOT NULL,
                english_translation TEXT NOT NULL,
                grammar_notes TEXT,
                example_type VARCHAR(50) DEFAULT 'basic_sentence',
                created_at TIMESTAMP DEFAULT NOW()
            )`,
            
            `CREATE TABLE IF NOT EXISTS lesson_dialogues (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                lesson_id UUID REFERENCES comprehensive_lessons(id),
                title VARCHAR(255) NOT NULL,
                dialogue_data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )`
        ];

        for (const table of tables) {
            try {
                await db.query(table);
                console.log('✅ Table created/verified');
            } catch (error) {
                console.error('❌ Failed to create table:', error);
            }
        }
    }

    async generateFullCurriculum() {
        console.log('🎓 Generating full comprehensive curriculum...');

        await this.createDatabaseTables();

        const topics = [
            'Family Members and Relationships',
            'Home and Household Items', 
            'Daily Routines and Activities',
            'Food and Meals',
            'Basic Greetings and Introductions',
            'Numbers, Time, and Dates',
            'Clothing and Personal Items',
            'Weather and Seasons',
            'Transportation and Directions',
            'Shopping and Money'
        ];

        for (let i = 0; i < topics.length; i++) {
            const topic = topics[i];
            console.log(`\n📖 Generating lesson ${i + 1}/${topics.length}: ${topic}`);
            
            try {
                const content = await this.generateComprehensiveContent(topic, i + 1);
                await this.saveComprehensiveLessonContent(content);
                
                console.log(`✅ Completed lesson ${i + 1}: ${topic}`);
                
                // Brief pause to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`❌ Failed to generate lesson ${i + 1}: ${topic}`, error);
                // Continue with next lesson
            }
        }

        console.log(`\n🎉 Curriculum generation complete!`);
        console.log(`💰 Total cost: $${this.totalCost.toFixed(2)}`);
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
🎓 Comprehensive Lesson Generator

This will create textbook-quality Albanian lessons with:
- 50+ vocabulary items per lesson
- Extensive grammar explanations
- 20+ example sentences  
- Verb conjugations
- Cultural context
- Dialogues and scenarios

Usage:
  node scripts/generateComprehensiveLessons.js --full-curriculum
  node scripts/generateComprehensiveLessons.js --topic "Family Members"
  node scripts/generateComprehensiveLessons.js --setup-tables

Options:
  --full-curriculum    Generate complete 10-lesson curriculum (~$15-20)
  --topic <name>       Generate single comprehensive lesson (~$1.50)
  --setup-tables       Create database tables only
        `);
        process.exit(0);
    }

    try {
        const generator = new ComprehensiveLessonGenerator();
        
        if (args.includes('--setup-tables')) {
            await generator.createDatabaseTables();
            return;
        }
        
        if (args.includes('--full-curriculum')) {
            console.log('🚀 Starting full curriculum generation...');
            console.log('💰 Estimated cost: $15-20');
            console.log('⏱️  Estimated time: 20-30 minutes');
            console.log('');
            
            await generator.generateFullCurriculum();
            return;
        }
        
        const topicIndex = args.indexOf('--topic');
        if (topicIndex !== -1 && topicIndex + 1 < args.length) {
            const topic = args[topicIndex + 1];
            const content = await generator.generateComprehensiveContent(topic);
            await generator.saveComprehensiveLessonContent(content);
            return;
        }
        
        console.error('❌ Please provide a valid option');
        process.exit(1);
        
    } catch (error) {
        console.error('❌ Generation failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { ComprehensiveLessonGenerator };