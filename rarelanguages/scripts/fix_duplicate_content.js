/**
 * Fix Duplicate Content Issue
 *
 * Removes duplicate introduction content that's causing cards 2 & 3 to not work
 * Keeps only one copy of each introduction item per lesson
 */

const { query } = require('../lib/database');

class DuplicateContentFixer {
    constructor() {
        this.duplicatesRemoved = 0;
        this.lessonsFixed = 0;
    }

    /**
     * Find and remove duplicate content items
     */
    async removeDuplicates() {
        console.log('🔍 Finding duplicate content...');

        // Get all duplicate groups (same lesson_id, english_phrase, target_phrase)
        const duplicateGroups = await query(`
            SELECT
                lesson_id,
                english_phrase,
                target_phrase,
                content_section_type,
                array_agg(id ORDER BY content_order, id) as content_ids,
                COUNT(*) as duplicate_count
            FROM lesson_content
            WHERE lesson_id IN (SELECT id FROM lessons WHERE is_active = true)
            GROUP BY lesson_id, english_phrase, target_phrase, content_section_type
            HAVING COUNT(*) > 1
            ORDER BY COUNT(*) DESC
        `);

        console.log(`Found ${duplicateGroups.rows.length} duplicate groups`);

        for (const group of duplicateGroups.rows) {
            const contentIds = group.content_ids;
            const keepId = contentIds[0]; // Keep the first one
            const removeIds = contentIds.slice(1); // Remove the rest

            console.log(`📝 "${group.english_phrase}" - keeping ${keepId}, removing ${removeIds.length} duplicates`);

            // Remove the duplicate items
            if (removeIds.length > 0) {
                await query(`
                    DELETE FROM lesson_content
                    WHERE id = ANY($1)
                `, [removeIds]);

                this.duplicatesRemoved += removeIds.length;
            }
        }

        this.lessonsFixed = duplicateGroups.rows.length;
        console.log(`✅ Removed ${this.duplicatesRemoved} duplicate items from ${this.lessonsFixed} groups`);
    }

    /**
     * Fix content ordering after removing duplicates
     */
    async fixContentOrdering() {
        console.log('🔧 Fixing content ordering...');

        // Update content_order to be sequential within each lesson/section
        await query(`
            UPDATE lesson_content
            SET content_order = content_ranks.new_order
            FROM (
                SELECT id,
                       ROW_NUMBER() OVER (
                           PARTITION BY lesson_id, section_id
                           ORDER BY content_order, id
                       ) as new_order
                FROM lesson_content
                WHERE lesson_id IN (SELECT id FROM lessons WHERE is_active = true)
                AND section_id IS NOT NULL
            ) content_ranks
            WHERE lesson_content.id = content_ranks.id
        `);

        // Handle content without section_id separately
        await query(`
            UPDATE lesson_content
            SET content_order = content_ranks.new_order
            FROM (
                SELECT id,
                       ROW_NUMBER() OVER (
                           PARTITION BY lesson_id
                           ORDER BY content_order, id
                       ) as new_order
                FROM lesson_content
                WHERE lesson_id IN (SELECT id FROM lessons WHERE is_active = true)
                AND section_id IS NULL
            ) content_ranks
            WHERE lesson_content.id = content_ranks.id
        `);

        console.log('✅ Content ordering fixed');
    }

    /**
     * Verify fixes by checking for remaining duplicates
     */
    async verifyFixes() {
        console.log('🔍 Verifying fixes...');

        const remainingDuplicates = await query(`
            SELECT
                COUNT(*) as duplicate_groups
            FROM (
                SELECT lesson_id, english_phrase, target_phrase
                FROM lesson_content
                WHERE lesson_id IN (SELECT id FROM lessons WHERE is_active = true)
                GROUP BY lesson_id, english_phrase, target_phrase
                HAVING COUNT(*) > 1
            ) duplicates
        `);

        const duplicateCount = parseInt(remainingDuplicates.rows[0].duplicate_groups);

        if (duplicateCount === 0) {
            console.log('✅ All duplicates successfully removed!');
        } else {
            console.log(`⚠️  ${duplicateCount} duplicate groups still remain`);
        }

        // Check introduction content specifically
        const introStats = await query(`
            SELECT
                COUNT(DISTINCT lesson_id) as lessons_with_intro,
                AVG(intro_count) as avg_intro_per_lesson,
                MAX(intro_count) as max_intro_per_lesson
            FROM (
                SELECT
                    lesson_id,
                    COUNT(*) as intro_count
                FROM lesson_content
                WHERE content_section_type = 'intro'
                AND lesson_id IN (SELECT id FROM lessons WHERE is_active = true)
                GROUP BY lesson_id
            ) lesson_intro_counts
        `);

        const stats = introStats.rows[0];
        console.log(`📊 Introduction content stats:`);
        console.log(`   Lessons with intro: ${stats.lessons_with_intro}`);
        console.log(`   Average intro items per lesson: ${parseFloat(stats.avg_intro_per_lesson).toFixed(1)}`);
        console.log(`   Max intro items in any lesson: ${stats.max_intro_per_lesson}`);

        return duplicateCount === 0;
    }

    /**
     * Main execution function
     */
    async fixAllDuplicates() {
        console.log('🚀 Starting duplicate content cleanup...\n');

        try {
            // Step 1: Remove duplicates
            await this.removeDuplicates();

            // Step 2: Fix content ordering
            await this.fixContentOrdering();

            // Step 3: Verify fixes
            const success = await this.verifyFixes();

            console.log('\n🎉 Duplicate content cleanup completed!');
            console.log(`Duplicates removed: ${this.duplicatesRemoved}`);
            console.log(`Groups fixed: ${this.lessonsFixed}`);
            console.log(`Status: ${success ? 'SUCCESS' : 'NEEDS REVIEW'}`);

            return success;

        } catch (error) {
            console.error('❌ Error during duplicate cleanup:', error);
            throw error;
        }
    }
}

/**
 * Main execution
 */
async function main() {
    const fixer = new DuplicateContentFixer();
    const success = await fixer.fixAllDuplicates();
    process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = { DuplicateContentFixer };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}