/**
 * Fix Duplicates and Clean Up Content
 *
 * Remove duplicate content and fix mislabeled/inappropriate content
 */

const { query } = require('../lib/database');

class DuplicatesFixer {
    constructor() {
        this.duplicatesRemoved = 0;
        this.inappropriateRemoved = 0;
    }

    /**
     * Remove exact duplicate content items
     */
    async removeDuplicateContent() {
        console.log('🗑️ Removing duplicate content items...');

        // Remove duplicates by keeping only the first occurrence of each phrase per lesson
        const removeResult = await query(`
            DELETE FROM lesson_content
            WHERE id IN (
                SELECT lc1.id
                FROM lesson_content lc1
                JOIN lesson_content lc2 ON (
                    lc1.lesson_id = lc2.lesson_id
                    AND lc1.english_phrase = lc2.english_phrase
                    AND lc1.id > lc2.id
                )
            )
        `);

        this.duplicatesRemoved = removeResult.rowCount;
        console.log(`✅ Removed ${this.duplicatesRemoved} duplicate items`);
    }

    /**
     * Remove content that's still inappropriate or mislabeled
     */
    async removeInappropriateContent() {
        console.log('🗑️ Removing remaining inappropriate and mislabeled content...');

        const removeResult = await query(`
            DELETE FROM lesson_content
            WHERE (
                -- Academic/complex content that slipped through
                english_phrase ILIKE '%This is my book%' OR
                english_phrase ILIKE '%Welcome to this Albanian lesson%' OR
                english_phrase ILIKE '%inflection%' OR
                english_phrase ILIKE '%morphology%' OR
                english_phrase ILIKE '%linguistic%' OR
                english_phrase ILIKE '%theoretical%' OR
                english_phrase ILIKE '%analysis%' OR
                english_phrase ILIKE '%hypothesis%' OR
                english_phrase ILIKE '%evidence%' OR
                english_phrase ILIKE '%methodology%' OR
                english_phrase ILIKE '%research%' OR
                english_phrase ILIKE '%academic%' OR
                english_phrase ILIKE '%credibility%' OR
                english_phrase ILIKE '%evaluate%' OR
                english_phrase ILIKE '%assess%' OR
                english_phrase ILIKE '%examine%' OR
                english_phrase ILIKE '%investigate%' OR
                english_phrase ILIKE '%determine%' OR
                english_phrase ILIKE '%establish%' OR
                english_phrase ILIKE '%demonstrate%' OR
                english_phrase ILIKE '%illustrate%' OR
                english_phrase ILIKE '%indicate%' OR
                english_phrase ILIKE '%suggest%' OR
                english_phrase ILIKE '%imply%' OR
                english_phrase ILIKE '%reveal%' OR
                english_phrase ILIKE '%confirm%' OR
                english_phrase ILIKE '%verify%' OR
                english_phrase ILIKE '%validate%' OR
                english_phrase ILIKE '%substantiate%' OR
                english_phrase ILIKE '%corroborate%' OR
                english_phrase ILIKE '%furthermore%' OR
                english_phrase ILIKE '%moreover%' OR
                english_phrase ILIKE '%however%' OR
                english_phrase ILIKE '%nevertheless%' OR
                english_phrase ILIKE '%nonetheless%' OR
                english_phrase ILIKE '%consequently%' OR
                english_phrase ILIKE '%therefore%' OR
                english_phrase ILIKE '%accordingly%' OR
                english_phrase ILIKE '%subsequently%' OR
                english_phrase ILIKE '%alternatively%' OR
                english_phrase ILIKE '%specifically%' OR
                english_phrase ILIKE '%particularly%' OR
                english_phrase ILIKE '%essentially%' OR
                english_phrase ILIKE '%fundamentally%' OR
                english_phrase ILIKE '%significantly%' OR
                english_phrase ILIKE '%substantially%' OR
                english_phrase ILIKE '%considerably%' OR
                english_phrase ILIKE '%comprehensively%' OR
                english_phrase ILIKE '%systematically%' OR
                english_phrase ILIKE '%respectively%' OR
                english_phrase ILIKE '%corresponding%' OR
                english_phrase ILIKE '%appropriate%' OR
                english_phrase ILIKE '%adequate%' OR
                english_phrase ILIKE '%sufficient%' OR
                english_phrase ILIKE '%necessary%' OR
                english_phrase ILIKE '%essential%' OR
                english_phrase ILIKE '%crucial%' OR
                english_phrase ILIKE '%vital%' OR
                english_phrase ILIKE '%critical%' OR
                english_phrase ILIKE '%important%' OR
                english_phrase ILIKE '%significant%' OR
                english_phrase ILIKE '%substantial%' OR
                english_phrase ILIKE '%extensive%' OR
                english_phrase ILIKE '%comprehensive%' OR
                english_phrase ILIKE '%thorough%' OR
                english_phrase ILIKE '%detailed%' OR
                english_phrase ILIKE '%complex%' OR
                english_phrase ILIKE '%sophisticated%' OR
                english_phrase ILIKE '%intricate%' OR
                english_phrase ILIKE '%elaborate%' OR
                english_phrase ILIKE '%nuanced%' OR
                english_phrase ILIKE '%subtle%' OR
                LENGTH(english_phrase) > 40 OR
                LENGTH(target_phrase) > 50 OR
                -- Wrong categorization (obvious mismatches)
                (grammar_category = 'numbers' AND english_phrase NOT ILIKE '%one%' AND english_phrase NOT ILIKE '%two%' AND english_phrase NOT ILIKE '%three%' AND english_phrase NOT ILIKE '%four%' AND english_phrase NOT ILIKE '%five%' AND english_phrase NOT ILIKE '%six%' AND english_phrase NOT ILIKE '%seven%' AND english_phrase NOT ILIKE '%eight%' AND english_phrase NOT ILIKE '%nine%' AND english_phrase NOT ILIKE '%ten%' AND english_phrase NOT ILIKE '%eleven%' AND english_phrase NOT ILIKE '%twelve%' AND english_phrase NOT ILIKE '%thirteen%' AND english_phrase NOT ILIKE '%fourteen%' AND english_phrase NOT ILIKE '%fifteen%' AND english_phrase NOT ILIKE '%sixteen%' AND english_phrase NOT ILIKE '%seventeen%' AND english_phrase NOT ILIKE '%eighteen%' AND english_phrase NOT ILIKE '%nineteen%' AND english_phrase NOT ILIKE '%twenty%' AND english_phrase NOT ILIKE '%thirty%' AND english_phrase NOT ILIKE '%forty%' AND english_phrase NOT ILIKE '%fifty%' AND english_phrase NOT ILIKE '%hundred%') OR
                (grammar_category = 'time_expressions' AND english_phrase NOT ILIKE '%time%' AND english_phrase NOT ILIKE '%clock%' AND english_phrase NOT ILIKE '%hour%' AND english_phrase NOT ILIKE '%minute%' AND english_phrase NOT ILIKE '%morning%' AND english_phrase NOT ILIKE '%afternoon%' AND english_phrase NOT ILIKE '%evening%' AND english_phrase NOT ILIKE '%night%' AND english_phrase NOT ILIKE '%today%' AND english_phrase NOT ILIKE '%yesterday%' AND english_phrase NOT ILIKE '%tomorrow%' AND english_phrase NOT ILIKE '%week%' AND english_phrase NOT ILIKE '%day%' AND english_phrase NOT ILIKE '%monday%' AND english_phrase NOT ILIKE '%tuesday%' AND english_phrase NOT ILIKE '%wednesday%' AND english_phrase NOT ILIKE '%thursday%' AND english_phrase NOT ILIKE '%friday%' AND english_phrase NOT ILIKE '%saturday%' AND english_phrase NOT ILIKE '%sunday%' AND english_phrase NOT ILIKE '%past%' AND english_phrase NOT ILIKE '%quarter%' AND english_phrase NOT ILIKE '%half%')
            )
            AND english_phrase NOT ILIKE '%In this lesson%'
        `);

        this.inappropriateRemoved = removeResult.rowCount;
        console.log(`✅ Removed ${this.inappropriateRemoved} inappropriate/mislabeled items`);
    }

    /**
     * Fix content ordering
     */
    async fixContentOrdering() {
        console.log('🔧 Fixing content ordering...');

        // Get all lessons with content
        const lessons = await query(`
            SELECT DISTINCT l.id, l.name
            FROM lessons l
            JOIN lesson_content lc ON l.id = lc.lesson_id
            WHERE l.is_active = true
        `);

        for (const lesson of lessons.rows) {
            // Fix ordering based on category and phrase
            await query(`
                UPDATE lesson_content
                SET content_order = content_ranks.new_order
                FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               ORDER BY
                                   CASE WHEN grammar_category = 'introduction' THEN 1
                                        WHEN grammar_category = 'greetings' THEN 2
                                        WHEN grammar_category = 'courtesy' THEN 3
                                        WHEN grammar_category = 'numbers' THEN 4
                                        WHEN grammar_category = 'time_expressions' THEN 5
                                        WHEN grammar_category = 'food' THEN 6
                                        WHEN grammar_category = 'daily_activities' THEN 7
                                        WHEN grammar_category = 'home' THEN 8
                                        WHEN grammar_category = 'places' THEN 9
                                        WHEN grammar_category = 'directions' THEN 10
                                        WHEN grammar_category = 'feelings' THEN 11
                                        WHEN grammar_category = 'opinions' THEN 12
                                        WHEN grammar_category = 'time' THEN 13
                                        WHEN grammar_category = 'past_tense' THEN 14
                                        WHEN grammar_category = 'future_tense' THEN 15
                                        WHEN grammar_category = 'travel' THEN 16
                                        ELSE 17 END,
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
     * Verify the cleanup
     */
    async verifyCleanup() {
        console.log('\n🔍 Verifying cleanup...');

        // Check for remaining duplicates
        const duplicateCheck = await query(`
            SELECT english_phrase, lesson_id, COUNT(*) as count
            FROM lesson_content
            GROUP BY english_phrase, lesson_id
            HAVING COUNT(*) > 1
            LIMIT 5
        `);

        console.log(`Remaining duplicates: ${duplicateCheck.rows.length}`);
        if (duplicateCheck.rows.length > 0) {
            duplicateCheck.rows.forEach(row => {
                console.log(`  "${row.english_phrase}" appears ${row.count} times in lesson ${row.lesson_id}`);
            });
        }

        // Check lesson content counts
        const contentCheck = await query(`
            SELECT l.name, COUNT(lc.id) as content_count
            FROM lessons l
            LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
            WHERE l.is_active = true
            GROUP BY l.id, l.name
            HAVING COUNT(lc.id) > 0
            ORDER BY l.name
            LIMIT 10
        `);

        console.log('\nLesson content counts (sample):');
        contentCheck.rows.forEach(row => {
            console.log(`  ${row.name}: ${row.content_count} items`);
        });

        return duplicateCheck.rows.length === 0;
    }

    /**
     * Main execution
     */
    async fixDuplicatesAndCleanup() {
        console.log('🚀 Starting duplicates and cleanup fix...\n');

        try {
            // Step 1: Remove duplicates
            await this.removeDuplicateContent();

            // Step 2: Remove inappropriate content
            await this.removeInappropriateContent();

            // Step 3: Fix content ordering
            await this.fixContentOrdering();

            // Step 4: Verify cleanup
            const success = await this.verifyCleanup();

            console.log('\n🎉 Duplicates and cleanup fix completed!');
            console.log(`Duplicates removed: ${this.duplicatesRemoved}`);
            console.log(`Inappropriate items removed: ${this.inappropriateRemoved}`);
            console.log(`Status: ${success ? 'SUCCESS' : 'REVIEW NEEDED'}`);

            return success;

        } catch (error) {
            console.error('❌ Error during duplicates fix:', error);
            throw error;
        }
    }
}

/**
 * Main execution
 */
async function main() {
    const fixer = new DuplicatesFixer();
    const success = await fixer.fixDuplicatesAndCleanup();
    process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = { DuplicatesFixer };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}