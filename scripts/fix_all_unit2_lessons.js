/**
 * Fix All Unit 2 Lessons Content and Navigation
 *
 * Clean up all Unit 2 lessons to have proper numbers/time content only
 */

const { query } = require('../lib/database');

class Unit2CompleteFixer {
    constructor() {
        this.totalFixed = 0;
        this.totalRemoved = 0;
        this.totalAdded = 0;
    }

    /**
     * Remove all inappropriate content from Unit 2 lessons
     */
    async removeInappropriateContent() {
        console.log('🗑️ Removing inappropriate content from all Unit 2 lessons...');

        // Remove greetings, school content, academic content from Unit 2
        const removeResult = await query(`
            DELETE FROM lesson_content
            WHERE lesson_id IN (
                SELECT l.id FROM lessons l
                JOIN skills s ON l.skill_id = s.id
                WHERE s.name LIKE '%Unit 2%Numbers%'
                AND l.is_active = true
            )
            AND (
                grammar_category IN ('greetings', 'general_vocabulary', 'courtesy') OR
                english_phrase ILIKE '%how are you%' OR
                english_phrase ILIKE '%nice to meet%' OR
                english_phrase ILIKE '%go to school%' OR
                english_phrase ILIKE '%classroom%' OR
                english_phrase ILIKE '%results%' OR
                english_phrase ILIKE '%unexpected%' OR
                english_phrase ILIKE '%summarize%' OR
                english_phrase ILIKE '%hello%my%name%' OR
                english_phrase ILIKE '%I am fifteen%' OR
                english_phrase ILIKE '%I am fourteen%'
            )
            AND english_phrase != 'In this lesson, you''ll learn numbers and time.'
        `);

        this.totalRemoved = removeResult.rowCount;
        console.log(`✅ Removed ${this.totalRemoved} inappropriate items from Unit 2`);
    }

    /**
     * Fix content ordering in all lessons
     */
    async fixContentOrdering() {
        console.log('🔧 Fixing content ordering in Unit 2 lessons...');

        // Get all Unit 2 lessons
        const lessons = await query(`
            SELECT l.id, l.name
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            WHERE s.name LIKE '%Unit 2%Numbers%'
            AND l.is_active = true
        `);

        for (const lesson of lessons.rows) {
            // Fix ordering: intro first, then numbers/time content
            await query(`
                UPDATE lesson_content
                SET content_order = content_ranks.new_order
                FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               ORDER BY
                                   CASE WHEN grammar_category = 'introduction' THEN 1
                                        WHEN grammar_category = 'numbers' THEN 2
                                        WHEN grammar_category = 'time_expressions' THEN 3
                                        ELSE 4 END,
                                   english_phrase
                           ) as new_order
                    FROM lesson_content
                    WHERE lesson_id = $1
                ) content_ranks
                WHERE lesson_content.id = content_ranks.id
            `, [lesson.id]);
        }

        console.log(`✅ Fixed content ordering in ${lessons.rows.length} lessons`);
    }

    /**
     * Add comprehensive numbers and time content
     */
    async addComprehensiveContent() {
        console.log('📚 Adding comprehensive numbers and time content...');

        // Get Unit 2 lessons
        const lessons = await query(`
            SELECT l.id, l.name
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            WHERE s.name LIKE '%Unit 2%Numbers%'
            AND l.is_active = true
            ORDER BY l.position
        `);

        // Define content for each lesson
        const lessonContent = {
            'Making Plans': [
                // Time expressions for planning
                { english: 'What time is it?', albanian: 'Sa është ora?', pronunciation: 'Sah esht OH-rah?', category: 'time_expressions' },
                { english: 'One o\'clock', albanian: 'Ora një', pronunciation: 'OH-rah nyuh', category: 'time_expressions' },
                { english: 'Two o\'clock', albanian: 'Ora dy', pronunciation: 'OH-rah dee', category: 'time_expressions' },
                { english: 'Half past one', albanian: 'Një e gjysmë', pronunciation: 'Nyuh eh GYEES-muh', category: 'time_expressions' },
                { english: 'Quarter past two', albanian: 'Dy e çerek', pronunciation: 'Dee eh CHEH-rek', category: 'time_expressions' },
                { english: 'At three o\'clock', albanian: 'Në orën tre', pronunciation: 'Nuh OH-run treh', category: 'time_expressions' },
                { english: 'In the morning', albanian: 'Në mëngjes', pronunciation: 'Nuh MUN-gyes', category: 'time_expressions' },
                { english: 'In the afternoon', albanian: 'Në pasdite', pronunciation: 'Nuh pas-DEE-teh', category: 'time_expressions' }
            ],
            'Basic Interactions': [
                // Basic numbers 1-20
                { english: 'One', albanian: 'Një', pronunciation: 'Nyuh', category: 'numbers' },
                { english: 'Two', albanian: 'Dy', pronunciation: 'Dee', category: 'numbers' },
                { english: 'Three', albanian: 'Tre', pronunciation: 'Treh', category: 'numbers' },
                { english: 'Four', albanian: 'Katër', pronunciation: 'Kah-tur', category: 'numbers' },
                { english: 'Five', albanian: 'Pesë', pronunciation: 'Peh-suh', category: 'numbers' },
                { english: 'Six', albanian: 'Gjashtë', pronunciation: 'Gyah-shtu', category: 'numbers' },
                { english: 'Seven', albanian: 'Shtatë', pronunciation: 'Shta-tu', category: 'numbers' },
                { english: 'Eight', albanian: 'Tetë', pronunciation: 'Teh-tu', category: 'numbers' },
                { english: 'Nine', albanian: 'Nëntë', pronunciation: 'Nun-tu', category: 'numbers' },
                { english: 'Ten', albanian: 'Dhjetë', pronunciation: 'Thye-tu', category: 'numbers' },
                { english: 'Eleven', albanian: 'Njëmbëdhjetë', pronunciation: 'Nyum-buh-THYE-tuh', category: 'numbers' },
                { english: 'Twelve', albanian: 'Dymbëdhjetë', pronunciation: 'Deem-buh-THYE-tuh', category: 'numbers' },
                { english: 'Thirteen', albanian: 'Trembëdhjetë', pronunciation: 'Trem-buh-THYE-tuh', category: 'numbers' },
                { english: 'Fourteen', albanian: 'Katërmbëdhjetë', pronunciation: 'Kah-tur-buh-THYE-tuh', category: 'numbers' },
                { english: 'Fifteen', albanian: 'Pesëmbëdhjetë', pronunciation: 'Peh-sum-buh-THYE-tuh', category: 'numbers' },
                { english: 'Sixteen', albanian: 'Gjashtëmbëdhjetë', pronunciation: 'Gyah-shtu-buh-THYE-tuh', category: 'numbers' },
                { english: 'Seventeen', albanian: 'Shtatëmbëdhjetë', pronunciation: 'Shta-tu-buh-THYE-tuh', category: 'numbers' },
                { english: 'Eighteen', albanian: 'Tetëmbëdhjetë', pronunciation: 'Teh-tu-buh-THYE-tuh', category: 'numbers' },
                { english: 'Nineteen', albanian: 'Nëntëmbëdhjetë', pronunciation: 'Nun-tu-buh-THYE-tuh', category: 'numbers' },
                { english: 'Twenty', albanian: 'Njëzet', pronunciation: 'Nyuh-ZET', category: 'numbers' }
            ]
        };

        let contentAdded = 0;

        for (const lesson of lessons.rows) {
            const content = lessonContent[lesson.name];
            if (content) {
                console.log(`\n📝 Adding content to: ${lesson.name}`);

                for (const [index, item] of content.entries()) {
                    try {
                        await query(`
                            INSERT INTO lesson_content
                            (lesson_id, english_phrase, target_phrase, pronunciation_guide,
                             word_type, grammar_category, content_section_type, content_order,
                             difficulty_progression, is_key_concept, learning_objective)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                            ON CONFLICT DO NOTHING
                        `, [
                            lesson.id, item.english, item.albanian, item.pronunciation,
                            'noun', item.category, 'vocabulary', index + 10,
                            1, true,
                            item.category === 'numbers' ? 'Learn Albanian numbers for counting and daily use' : 'Learn time expressions for scheduling and daily activities'
                        ]);
                        contentAdded++;
                    } catch (error) {
                        console.warn(`Warning: Could not add "${item.english}": ${error.message}`);
                    }
                }

                console.log(`  ✅ Added ${content.length} items`);
            }
        }

        this.totalAdded = contentAdded;
        console.log(`✅ Added ${contentAdded} total content items to Unit 2`);
    }

    /**
     * Verify all fixes
     */
    async verifyAllFixes() {
        console.log('\n🔍 Verifying Unit 2 fixes...');

        const verification = await query(`
            SELECT
                l.name as lesson_name,
                COUNT(lc.id) as content_count,
                SUM(CASE WHEN lc.grammar_category = 'numbers' THEN 1 ELSE 0 END) as numbers_count,
                SUM(CASE WHEN lc.grammar_category = 'time_expressions' THEN 1 ELSE 0 END) as time_count,
                SUM(CASE WHEN lc.grammar_category = 'greetings' THEN 1 ELSE 0 END) as greetings_count
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
            WHERE s.name LIKE '%Unit 2%Numbers%'
            AND l.is_active = true
            GROUP BY l.id, l.name
            ORDER BY l.position
        `);

        console.log('📊 Unit 2 Lesson Summary:');
        verification.rows.forEach(row => {
            console.log(`\n${row.lesson_name}:`);
            console.log(`  Total: ${row.content_count} items`);
            console.log(`  Numbers: ${row.numbers_count}`);
            console.log(`  Time: ${row.time_count}`);
            console.log(`  Greetings: ${row.greetings_count} (should be 0)`);
        });

        const hasProblems = verification.rows.some(row =>
            parseInt(row.greetings_count) > 0 ||
            parseInt(row.content_count) < 5 ||
            (parseInt(row.numbers_count) === 0 && parseInt(row.time_count) === 0)
        );

        return !hasProblems;
    }

    /**
     * Main execution function
     */
    async fixAllUnit2Lessons() {
        console.log('🚀 Starting comprehensive Unit 2 fixes...\n');

        try {
            // Step 1: Remove inappropriate content
            await this.removeInappropriateContent();

            // Step 2: Fix content ordering
            await this.fixContentOrdering();

            // Step 3: Add comprehensive content
            await this.addComprehensiveContent();

            // Step 4: Verify fixes
            const success = await this.verifyAllFixes();

            console.log('\n🎉 Unit 2 comprehensive fix completed!');
            console.log(`Items removed: ${this.totalRemoved}`);
            console.log(`Items added: ${this.totalAdded}`);
            console.log(`Status: ${success ? 'SUCCESS' : 'NEEDS REVIEW'}`);

            return success;

        } catch (error) {
            console.error('❌ Error during Unit 2 fix:', error);
            throw error;
        }
    }
}

/**
 * Main execution
 */
async function main() {
    const fixer = new Unit2CompleteFixer();
    const success = await fixer.fixAllUnit2Lessons();
    process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = { Unit2CompleteFixer };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}