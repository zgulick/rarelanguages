/**
 * Simplify Basic Vocabulary Cards
 *
 * Removes complex grammar metadata from simple beginner vocabulary
 */

const { query } = require('../lib/database');

class BasicCardSimplifier {
    constructor() {
        this.cardsSimplified = 0;
        this.genderInfoRemoved = 0;
        this.usageExamplesRemoved = 0;
    }

    /**
     * Simplify basic greetings and numbers cards
     */
    async simplifyBasicCards() {
        console.log('🎯 Simplifying basic vocabulary cards...');

        // Remove gender, usage examples, and complex grammar notes from basic vocabulary
        const basicPhrases = [
            'Hello', 'Goodbye', 'Thank you', 'Please', 'Good morning', 'Good afternoon', 'Good evening',
            'How are you?', 'Nice to meet you', 'See you later',
            'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
            'What time is it?', 'One o\'clock', 'Two o\'clock'
        ];

        // Remove complex metadata from basic phrases
        for (const phrase of basicPhrases) {
            const result = await query(`
                UPDATE lesson_content
                SET
                    gender = NULL,
                    usage_examples = NULL,
                    difficulty_notes = NULL,
                    conjugation_data = NULL,
                    stress_pattern = NULL
                WHERE english_phrase = $1
                AND (
                    gender IS NOT NULL OR
                    usage_examples IS NOT NULL OR
                    difficulty_notes IS NOT NULL OR
                    conjugation_data IS NOT NULL OR
                    stress_pattern IS NOT NULL
                )
            `, [phrase]);

            if (result.rowCount > 0) {
                console.log(`✅ Simplified: "${phrase}" (${result.rowCount} items)`);
                this.cardsSimplified += result.rowCount;
            }
        }

        // Also simplify by grammar category
        const simplifyByCategory = await query(`
            UPDATE lesson_content
            SET
                gender = NULL,
                usage_examples = NULL,
                difficulty_notes = NULL,
                conjugation_data = NULL,
                stress_pattern = NULL
            WHERE grammar_category IN ('greetings', 'courtesy', 'numbers', 'time_expressions')
            AND LENGTH(english_phrase) < 25
            AND (
                gender IS NOT NULL OR
                usage_examples IS NOT NULL OR
                difficulty_notes IS NOT NULL OR
                conjugation_data IS NOT NULL OR
                stress_pattern IS NOT NULL
            )
        `);

        this.cardsSimplified += simplifyByCategory.rowCount;
        console.log(`✅ Simplified ${simplifyByCategory.rowCount} cards by category`);
    }

    /**
     * Remove "Remember to use appropriate articles" notes from basic cards
     */
    async removeArticleReminders() {
        console.log('📝 Checking for article reminders in cultural context...');

        // Check if these messages are in cultural_context instead
        const result = await query(`
            UPDATE lesson_content
            SET cultural_context = NULL
            WHERE cultural_context ILIKE '%appropriate articles%'
               OR cultural_context ILIKE '%adjective agreements%'
               OR cultural_context ILIKE '%remember to use%'
        `);

        console.log(`✅ Removed ${result.rowCount} article reminder notes from cultural context`);

        // Note: The "Remember to use appropriate articles" is likely hardcoded in the frontend React component
        console.log('ℹ️  Note: "Remember to use appropriate articles" text may be hardcoded in frontend');
    }

    /**
     * Keep only essential fields for basic vocabulary
     */
    async enforceSimplicity() {
        console.log('✨ Enforcing simplicity for beginner content...');

        // For very basic phrases, keep only: english_phrase, target_phrase, pronunciation_guide, and simple cultural_context
        const essentialFields = await query(`
            UPDATE lesson_content
            SET
                word_type = CASE WHEN word_type = 'phrase' THEN 'phrase' ELSE NULL END,
                verb_type = NULL,
                stress_pattern = NULL,
                difficulty_notes = NULL,
                usage_examples = NULL
            WHERE
                english_phrase IN ('Hello', 'Thank you', 'Please', 'Goodbye', 'Good morning') OR
                (grammar_category = 'numbers' AND LENGTH(english_phrase) < 10)
        `);

        console.log(`✅ Enforced simplicity on ${essentialFields.rowCount} basic items`);
    }

    /**
     * Verify the simplification
     */
    async verifySimplification() {
        console.log('\n📊 SIMPLIFICATION VERIFICATION:');

        // Check basic greetings
        const greetingsCheck = await query(`
            SELECT
                english_phrase,
                CASE WHEN gender IS NOT NULL THEN 1 ELSE 0 END as has_gender,
                CASE WHEN usage_examples IS NOT NULL THEN 1 ELSE 0 END as has_examples,
                CASE WHEN conjugation_data IS NOT NULL THEN 1 ELSE 0 END as has_conjugation
            FROM lesson_content
            WHERE english_phrase IN ('Hello', 'Thank you', 'Please', 'Good morning')
            ORDER BY english_phrase
        `);

        console.log('Basic greetings check:');
        greetingsCheck.rows.forEach(row => {
            const complex = row.has_gender || row.has_examples || row.has_conjugation;
            const status = complex ? '❌ Still complex' : '✅ Simplified';
            console.log(`  ${row.english_phrase}: ${status}`);
        });

        // Check numbers
        const numbersCheck = await query(`
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN gender IS NOT NULL THEN 1 ELSE 0 END) as with_gender,
                   SUM(CASE WHEN usage_examples IS NOT NULL THEN 1 ELSE 0 END) as with_examples
            FROM lesson_content
            WHERE grammar_category = 'numbers'
        `);

        const numbers = numbersCheck.rows[0];
        console.log(`\nNumbers content:`);
        console.log(`  Total: ${numbers.total}`);
        console.log(`  With gender info: ${numbers.with_gender} (should be 0)`);
        console.log(`  With usage examples: ${numbers.with_examples} (should be 0)`);

        return {
            basicGreetingsSimplified: greetingsCheck.rows.every(r => !r.has_gender && !r.has_examples && !r.has_conjugation),
            numbersSimplified: parseInt(numbers.with_gender) === 0 && parseInt(numbers.with_examples) === 0
        };
    }

    /**
     * Main execution function
     */
    async simplifyAllBasicCards() {
        console.log('🚀 Starting basic card simplification...\n');

        try {
            // Step 1: Simplify basic cards
            await this.simplifyBasicCards();

            // Step 2: Remove article reminders
            await this.removeArticleReminders();

            // Step 3: Enforce simplicity
            await this.enforceSimplicity();

            // Step 4: Verify simplification
            const verification = await this.verifySimplification();

            console.log('\n🎉 Basic card simplification completed!');
            console.log(`Cards simplified: ${this.cardsSimplified}`);

            const success = verification.basicGreetingsSimplified && verification.numbersSimplified;
            console.log(`Status: ${success ? 'SUCCESS' : 'NEEDS REVIEW'}`);

            return success;

        } catch (error) {
            console.error('❌ Error during basic card simplification:', error);
            throw error;
        }
    }
}

/**
 * Main execution
 */
async function main() {
    const simplifier = new BasicCardSimplifier();
    const success = await simplifier.simplifyAllBasicCards();
    process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = { BasicCardSimplifier };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}