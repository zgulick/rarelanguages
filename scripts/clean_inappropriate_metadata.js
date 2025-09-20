/**
 * Clean Inappropriate Cultural Context and Metadata
 *
 * Removes academic/complex cultural context from simple beginner phrases
 * and simplifies complex metadata for age-appropriate content
 */

const { query } = require('../lib/database');

class MetadataCleanup {
    constructor() {
        this.itemsCleaned = 0;
        this.contextsRemoved = 0;
        this.conjugationsRemoved = 0;
        this.examplesSimplified = 0;
    }

    /**
     * Remove inappropriate cultural context from simple phrases
     */
    async removeInappropriateCulturalContext() {
        console.log('🧹 Removing inappropriate cultural context...');

        // Remove academic/research cultural context from basic phrases
        const academicContextItems = await query(`
            SELECT id, english_phrase, cultural_context
            FROM lesson_content
            WHERE cultural_context IS NOT NULL
            AND (
                cultural_context ILIKE '%academic%' OR
                cultural_context ILIKE '%research%' OR
                cultural_context ILIKE '%analysis%' OR
                cultural_context ILIKE '%argument%' OR
                cultural_context ILIKE '%critical%' OR
                cultural_context ILIKE '%theoretical%' OR
                cultural_context ILIKE '%methodology%' OR
                cultural_context ILIKE '%hypothesis%' OR
                cultural_context ILIKE '%evidence%' OR
                cultural_context ILIKE '%scholarly%'
            )
        `);

        console.log(`Found ${academicContextItems.rows.length} items with academic cultural context`);

        for (const item of academicContextItems.rows) {
            // Remove the inappropriate context
            await query(`
                UPDATE lesson_content
                SET cultural_context = NULL
                WHERE id = $1
            `, [item.id]);

            this.contextsRemoved++;

            if (this.contextsRemoved <= 5) {
                console.log(`✅ Removed context from: "${item.english_phrase}"`);
            }
        }

        console.log(`✅ Removed ${this.contextsRemoved} inappropriate cultural contexts`);
    }

    /**
     * Remove conjugation data from simple phrases
     */
    async removeInappropriateConjugations() {
        console.log('🧹 Removing conjugations from simple phrases...');

        // Remove conjugation data from basic greetings and simple phrases
        const simplePhrasesWithConjugations = await query(`
            SELECT id, english_phrase, conjugation_data
            FROM lesson_content
            WHERE conjugation_data IS NOT NULL
            AND (
                english_phrase IN ('Hello', 'Thank you', 'Please', 'Good morning', 'Good afternoon', 'Good evening', 'Goodbye', 'How are you?', 'Nice to meet you') OR
                (LENGTH(english_phrase) < 20 AND word_type IN ('phrase', 'noun') AND grammar_category IN ('greetings', 'courtesy'))
            )
        `);

        console.log(`Found ${simplePhrasesWithConjugations.rows.length} simple phrases with conjugation data`);

        for (const item of simplePhrasesWithConjugations.rows) {
            await query(`
                UPDATE lesson_content
                SET conjugation_data = NULL
                WHERE id = $1
            `, [item.id]);

            this.conjugationsRemoved++;

            if (this.conjugationsRemoved <= 3) {
                console.log(`✅ Removed conjugation from: "${item.english_phrase}"`);
            }
        }

        console.log(`✅ Removed ${this.conjugationsRemoved} inappropriate conjugations`);
    }

    /**
     * Create appropriate beginner-friendly cultural context
     */
    async createBeginnerFriendlyCulturalContext() {
        console.log('✨ Adding beginner-friendly cultural context...');

        const contextMappings = [
            {
                phrases: ['Hello', 'Përshëndetje', 'Hi'],
                context: 'A friendly greeting used throughout Albania in both formal and casual situations.'
            },
            {
                phrases: ['Thank you', 'Faleminderit'],
                context: 'Expressing gratitude is very important in Albanian culture and shows good manners.'
            },
            {
                phrases: ['Please', 'Ju lutem'],
                context: 'Adding "ju lutem" (please) makes requests more polite in Albanian culture.'
            },
            {
                phrases: ['Good morning', 'Mirëmëngjes'],
                context: 'A warm morning greeting commonly used until around noon in Albania.'
            },
            {
                phrases: ['Good afternoon', 'Mirëdita'],
                context: 'Used from noon until evening as a polite greeting in Albanian.'
            },
            {
                phrases: ['How are you?', 'Si jeni?'],
                context: 'A common way to show interest in someone\'s wellbeing in Albanian culture.'
            }
        ];

        let contextsAdded = 0;

        for (const mapping of contextMappings) {
            // Only add context to items that don't have it or have inappropriate context
            const result = await query(`
                UPDATE lesson_content
                SET cultural_context = $1
                WHERE (
                    english_phrase = ANY($2) OR target_phrase = ANY($2)
                )
                AND (
                    cultural_context IS NULL OR
                    cultural_context ILIKE '%academic%' OR
                    cultural_context ILIKE '%research%'
                )
                AND grammar_category IN ('greetings', 'courtesy')
            `, [mapping.context, mapping.phrases]);

            contextsAdded += result.rowCount;
        }

        console.log(`✅ Added ${contextsAdded} beginner-friendly cultural contexts`);
    }

    /**
     * Simplify complex usage examples
     */
    async simplifyUsageExamples() {
        console.log('🔧 Simplifying complex usage examples...');

        // Find items with overly complex usage examples for simple phrases
        const complexExamples = await query(`
            SELECT id, english_phrase, usage_examples
            FROM lesson_content
            WHERE usage_examples IS NOT NULL
            AND LENGTH(english_phrase) < 30
            AND word_type IN ('phrase', 'noun')
            AND grammar_category IN ('greetings', 'courtesy', 'numbers', 'basic_adjectives')
        `);

        let simplified = 0;

        for (const item of complexExamples.rows) {
            // For simple greetings, either remove examples or provide very simple ones
            const simplifiedExamples = this.createSimpleExamples(item.english_phrase);

            if (simplifiedExamples) {
                await query(`
                    UPDATE lesson_content
                    SET usage_examples = $1
                    WHERE id = $2
                `, [JSON.stringify(simplifiedExamples), item.id]);
                simplified++;
            } else {
                // Remove complex examples entirely for very basic phrases
                await query(`
                    UPDATE lesson_content
                    SET usage_examples = NULL
                    WHERE id = $1
                `, [item.id]);
                simplified++;
            }
        }

        this.examplesSimplified = simplified;
        console.log(`✅ Simplified ${simplified} usage examples`);
    }

    /**
     * Create simple, age-appropriate usage examples
     */
    createSimpleExamples(englishPhrase) {
        const simpleExampleMappings = {
            'Hello': [
                { english: 'Hello, how are you?', albanian: 'Përshëndetje, si jeni?' },
                { english: 'Hello everyone!', albanian: 'Përshëndetje të gjithëve!' }
            ],
            'Thank you': [
                { english: 'Thank you for your help.', albanian: 'Faleminderit për ndihmën.' }
            ],
            'Please': [
                { english: 'Water, please.', albanian: 'Ujë, ju lutem.' }
            ],
            'Good morning': [
                { english: 'Good morning, teacher.', albanian: 'Mirëmëngjes, mësues.' }
            ],
            'How are you?': [
                { english: 'Hello! How are you today?', albanian: 'Përshëndetje! Si jeni sot?' }
            ]
        };

        return simpleExampleMappings[englishPhrase] || null;
    }

    /**
     * Generate cleanup report
     */
    async generateCleanupReport() {
        console.log('\n📊 Cleanup Report:');

        // Check remaining inappropriate content
        const remainingAcademic = await query(`
            SELECT COUNT(*) as count
            FROM lesson_content
            WHERE cultural_context ILIKE '%academic%' OR cultural_context ILIKE '%research%'
        `);

        const remainingConjugations = await query(`
            SELECT COUNT(*) as count
            FROM lesson_content
            WHERE conjugation_data IS NOT NULL
            AND english_phrase IN ('Hello', 'Thank you', 'Please', 'Good morning')
        `);

        console.log(`📈 Academic contexts removed: ${this.contextsRemoved}`);
        console.log(`🔧 Conjugations removed: ${this.conjugationsRemoved}`);
        console.log(`✨ Examples simplified: ${this.examplesSimplified}`);
        console.log(`📝 Remaining academic contexts: ${remainingAcademic.rows[0].count}`);
        console.log(`⚙️  Remaining inappropriate conjugations: ${remainingConjugations.rows[0].count}`);

        return {
            contextsRemoved: this.contextsRemoved,
            conjugationsRemoved: this.conjugationsRemoved,
            examplesSimplified: this.examplesSimplified,
            remainingAcademic: parseInt(remainingAcademic.rows[0].count),
            remainingConjugations: parseInt(remainingConjugations.rows[0].count)
        };
    }

    /**
     * Main execution function
     */
    async cleanAllMetadata() {
        console.log('🚀 Starting metadata cleanup...\n');

        try {
            // Step 1: Remove inappropriate cultural contexts
            await this.removeInappropriateCulturalContext();

            // Step 2: Remove inappropriate conjugations
            await this.removeInappropriateConjugations();

            // Step 3: Add beginner-friendly cultural context
            await this.createBeginnerFriendlyCulturalContext();

            // Step 4: Simplify usage examples
            await this.simplifyUsageExamples();

            // Step 5: Generate report
            const report = await this.generateCleanupReport();

            console.log('\n🎉 Metadata cleanup completed!');

            const success = report.remainingAcademic < 10 && report.remainingConjugations === 0;
            console.log(`Status: ${success ? 'SUCCESS' : 'NEEDS REVIEW'}`);

            return success;

        } catch (error) {
            console.error('❌ Error during metadata cleanup:', error);
            throw error;
        }
    }
}

/**
 * Main execution
 */
async function main() {
    const cleaner = new MetadataCleanup();
    const success = await cleaner.cleanAllMetadata();
    process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = { MetadataCleanup };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}