/**
 * Fix All Units Content Issues
 *
 * Fix content association issues across all units that have content without section_id
 */

const { query } = require('../lib/database');

class AllUnitsContentFixer {
    constructor() {
        this.totalFixed = 0;
        this.totalRemoved = 0;
        this.unitsFixed = [];
    }

    /**
     * Remove inappropriate content from all affected units
     */
    async removeInappropriateContent() {
        console.log('🗑️ Removing inappropriate content from all affected units...');

        // Remove academic, morphological, and inappropriate greetings content
        const removeResult = await query(`
            DELETE FROM lesson_content
            WHERE (
                english_phrase ILIKE '%morpholog%' OR
                english_phrase ILIKE '%inflectional%' OR
                english_phrase ILIKE '%linguistic%' OR
                english_phrase ILIKE '%theoretical%' OR
                english_phrase ILIKE '%analysis%' OR
                english_phrase ILIKE '%comparative%' OR
                english_phrase ILIKE '%synthesiz%' OR
                target_phrase ILIKE '%morfologjik%' OR
                target_phrase ILIKE '%teorive%' OR
                cultural_context ILIKE '%morpholog%' OR
                cultural_context ILIKE '%academic%' OR
                cultural_context ILIKE '%research%' OR
                -- Remove inappropriate content from greetings lessons
                (english_phrase ILIKE '%How are you%' AND grammar_category != 'greetings') OR
                (english_phrase ILIKE '%nice to meet%' AND lesson_id IN (
                    SELECT l.id FROM lessons l
                    JOIN skills s ON l.skill_id = s.id
                    WHERE s.name LIKE '%Unit 2%Numbers%'
                ))
            )
            AND english_phrase NOT ILIKE '%In this lesson%'
        `);

        this.totalRemoved = removeResult.rowCount;
        console.log(`✅ Removed ${this.totalRemoved} inappropriate items globally`);
    }

    /**
     * Fix content ordering in all lessons with section issues
     */
    async fixContentOrdering() {
        console.log('🔧 Fixing content ordering in all affected lessons...');

        // Get all lessons that have content without section_id
        const lessons = await query(`
            SELECT DISTINCT l.id, l.name, s.name as skill_name, s.position as skill_pos, l.position as lesson_pos
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            JOIN lesson_content lc ON l.id = lc.lesson_id
            WHERE lc.section_id IS NULL
            AND l.is_active = true
            ORDER BY s.position, l.position
        `);

        for (const lesson of lessons.rows) {
            console.log(`  Fixing: ${lesson.skill_name} - ${lesson.name}`);

            // Fix ordering: intro first, then by category, then alphabetically
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
                                        WHEN grammar_category = 'general_vocabulary' THEN 6
                                        ELSE 7 END,
                                   english_phrase
                           ) as new_order
                    FROM lesson_content
                    WHERE lesson_id = $1
                ) content_ranks
                WHERE lesson_content.id = content_ranks.id
            `, [lesson.id]);
        }

        console.log(`✅ Fixed content ordering in ${lessons.rows.length} lessons`);
        return lessons.rows.length;
    }

    /**
     * Add missing essential content to sparse lessons
     */
    async addEssentialContent() {
        console.log('📚 Adding essential content to sparse lessons...');

        // Get lessons with very little content (less than 5 items)
        const sparseLessons = await query(`
            SELECT l.id, l.name, s.name as skill_name, COUNT(lc.id) as content_count, s.position as skill_pos, l.position as lesson_pos
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
            WHERE l.is_active = true
            GROUP BY l.id, l.name, s.name, s.position, l.position
            HAVING COUNT(lc.id) < 5
            ORDER BY s.position, l.position
        `);

        let contentAdded = 0;

        for (const lesson of sparseLessons.rows) {
            console.log(`\n📝 Adding content to sparse lesson: ${lesson.skill_name} - ${lesson.name}`);

            // Add basic content based on lesson name
            const basicContent = this.getBasicContentForLesson(lesson.name, lesson.skill_name);

            for (const [index, item] of basicContent.entries()) {
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
                        item.word_type || 'phrase', item.category, 'vocabulary',
                        index + 10, 1, true, item.objective
                    ]);
                    contentAdded++;
                } catch (error) {
                    console.warn(`Warning: Could not add "${item.english}": ${error.message}`);
                }
            }

            console.log(`  ✅ Added ${basicContent.length} items to ${lesson.name}`);
        }

        console.log(`✅ Added ${contentAdded} total content items to sparse lessons`);
        return contentAdded;
    }

    /**
     * Get basic content for a lesson based on its name and skill
     */
    getBasicContentForLesson(lessonName, skillName) {
        const name = lessonName.toLowerCase();
        const skill = skillName.toLowerCase();

        if (name.includes('greetings') || name.includes('basic greetings')) {
            return [
                { english: 'Hello', albanian: 'Përshëndetje', pronunciation: 'Per-shen-DET-yeh', category: 'greetings', objective: 'Learn essential Albanian greetings' },
                { english: 'Good morning', albanian: 'Mirëmëngjes', pronunciation: 'Mee-ruh-MUN-gyes', category: 'greetings', objective: 'Use morning greetings appropriately' },
                { english: 'Good evening', albanian: 'Mirëmbrëma', pronunciation: 'Mee-ruh-BRUH-mah', category: 'greetings', objective: 'Use evening greetings appropriately' },
                { english: 'Goodbye', albanian: 'Mirupafshim', pronunciation: 'Mee-roo-PAHF-sheem', category: 'greetings', objective: 'Say goodbye politely' },
                { english: 'Thank you', albanian: 'Faleminderit', pronunciation: 'Fah-leh-min-deh-REET', category: 'courtesy', objective: 'Express gratitude appropriately' },
                { english: 'Please', albanian: 'Ju lutem', pronunciation: 'Yoo LOO-tem', category: 'courtesy', objective: 'Make polite requests' },
                { english: 'Excuse me', albanian: 'Më falni', pronunciation: 'Muh FAHL-nee', category: 'courtesy', objective: 'Get attention politely' }
            ];
        }

        if (name.includes('sounds') || name.includes('pronunciation')) {
            return [
                { english: 'A (ah)', albanian: 'A', pronunciation: 'Ah', category: 'pronunciation', objective: 'Learn Albanian vowel sounds', word_type: 'letter' },
                { english: 'E (eh)', albanian: 'E', pronunciation: 'Eh', category: 'pronunciation', objective: 'Learn Albanian vowel sounds', word_type: 'letter' },
                { english: 'I (ee)', albanian: 'I', pronunciation: 'Ee', category: 'pronunciation', objective: 'Learn Albanian vowel sounds', word_type: 'letter' },
                { english: 'O (oh)', albanian: 'O', pronunciation: 'Oh', category: 'pronunciation', objective: 'Learn Albanian vowel sounds', word_type: 'letter' },
                { english: 'U (oo)', albanian: 'U', pronunciation: 'Oo', category: 'pronunciation', objective: 'Learn Albanian vowel sounds', word_type: 'letter' }
            ];
        }

        // Default basic content
        return [
            { english: 'Yes', albanian: 'Po', pronunciation: 'Poh', category: 'general_vocabulary', objective: 'Express agreement' },
            { english: 'No', albanian: 'Jo', pronunciation: 'Yoh', category: 'general_vocabulary', objective: 'Express disagreement' }
        ];
    }

    /**
     * Verify all fixes across units
     */
    async verifyAllFixes() {
        console.log('\n🔍 Verifying fixes across all units...');

        const verification = await query(`
            SELECT
                s.name as skill_name,
                l.name as lesson_name,
                COUNT(lc.id) as content_count,
                COUNT(CASE WHEN lc.section_id IS NOT NULL THEN 1 END) as with_sections,
                COUNT(CASE WHEN lc.section_id IS NULL THEN 1 END) as without_sections,
                COUNT(CASE WHEN lc.grammar_category = 'greetings' THEN 1 END) as greetings,
                COUNT(CASE WHEN lc.grammar_category = 'numbers' THEN 1 END) as numbers,
                COUNT(CASE WHEN lc.grammar_category = 'time_expressions' THEN 1 END) as time_expr
            FROM skills s
            JOIN lessons l ON s.id = l.skill_id
            LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
            WHERE s.is_active = true AND l.is_active = true
            GROUP BY s.id, s.name, l.id, l.name, s.position, l.position
            HAVING COUNT(lc.id) > 0
            ORDER BY s.position, l.position
        `);

        console.log('📊 All Units Summary:');
        let currentSkill = '';
        let hasProblems = false;

        verification.rows.forEach(row => {
            if (row.skill_name !== currentSkill) {
                currentSkill = row.skill_name;
                console.log(`\n${currentSkill}:`);
            }

            const withoutSections = parseInt(row.without_sections);
            const totalContent = parseInt(row.content_count);
            const isProblematic = totalContent < 3 || withoutSections > totalContent * 0.8;

            if (isProblematic) hasProblems = true;

            console.log(`  ${row.lesson_name}: ${totalContent} items (${withoutSections} without sections)${isProblematic ? ' ⚠️' : ''}`);
        });

        return !hasProblems;
    }

    /**
     * Main execution function
     */
    async fixAllUnitsContent() {
        console.log('🚀 Starting comprehensive fixes for all units...\n');

        try {
            // Step 1: Remove inappropriate content
            await this.removeInappropriateContent();

            // Step 2: Fix content ordering
            const lessonsFixed = await this.fixContentOrdering();

            // Step 3: Add essential content to sparse lessons
            const contentAdded = await this.addEssentialContent();

            // Step 4: Verify fixes
            const success = await this.verifyAllFixes();

            console.log('\n🎉 All units comprehensive fix completed!');
            console.log(`Lessons fixed: ${lessonsFixed}`);
            console.log(`Items removed: ${this.totalRemoved}`);
            console.log(`Items added: ${contentAdded}`);
            console.log(`Status: ${success ? 'SUCCESS' : 'NEEDS REVIEW'}`);

            return success;

        } catch (error) {
            console.error('❌ Error during all units fix:', error);
            throw error;
        }
    }
}

/**
 * Main execution
 */
async function main() {
    const fixer = new AllUnitsContentFixer();
    const success = await fixer.fixAllUnitsContent();
    process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = { AllUnitsContentFixer };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}