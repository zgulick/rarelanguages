/**
 * Fix Skill/Lesson Name Alignment Issues
 *
 * Updates skill and lesson names to match their actual content
 */

const { query } = require('../lib/database');

class SkillAlignmentFixer {
    constructor() {
        this.fixesApplied = 0;
    }

    /**
     * Fix the most critical naming misalignments
     */
    async fixMajorMisalignments() {
        console.log('🔧 Fixing major skill/lesson name misalignments...');

        const fixes = [
            // Fix "Unit 1 - Family & Greetings" to be more accurate
            {
                old_name: 'Albanian 1: Unit 1 - Family & Greetings',
                new_name: 'Albanian 1: Unit 1 - Greetings & Basic Phrases',
                reason: 'Content is primarily greetings and basic phrases, not family-focused'
            },

            // Fix "Numbers & Time" lessons that don't have numbers/time
            {
                lesson_name: 'Numbers 1-10',
                new_name: 'Basic Interactions',
                reason: 'Lesson contains greetings/courtesy, not numbers'
            },

            // Fix "Food & Drinks" lessons that don't have food content
            {
                lesson_name: 'Food Vocabulary',
                new_name: 'Basic Vocabulary',
                reason: 'Lesson contains general greetings, not food vocabulary'
            },

            {
                lesson_name: 'Ordering Food',
                new_name: 'Social Phrases',
                reason: 'Lesson contains courtesy phrases, not food ordering'
            },

            // Fix "Greetings & Basics" that only have introduction
            {
                skill_name: 'Greetings & Basics',
                lesson_name: 'Everyday Conversations',
                new_lesson_name: 'Lesson Introduction',
                reason: 'Only contains introduction content'
            },

            {
                skill_name: 'Greetings & Basics',
                lesson_name: 'Social Interactions',
                new_lesson_name: 'Getting Started',
                reason: 'Only contains introduction content'
            }
        ];

        for (const fix of fixes) {
            try {
                if (fix.old_name && fix.new_name) {
                    // Update skill name
                    const result = await query(`
                        UPDATE skills
                        SET name = $1
                        WHERE name = $2 AND is_active = true
                    `, [fix.new_name, fix.old_name]);

                    if (result.rowCount > 0) {
                        console.log(`✅ Updated skill: "${fix.old_name}" → "${fix.new_name}"`);
                        console.log(`   Reason: ${fix.reason}`);
                        this.fixesApplied++;
                    }
                } else if (fix.lesson_name && fix.new_name) {
                    // Update lesson name
                    const result = await query(`
                        UPDATE lessons
                        SET name = $1
                        WHERE name = $2 AND is_active = true
                    `, [fix.new_name, fix.lesson_name]);

                    if (result.rowCount > 0) {
                        console.log(`✅ Updated lesson: "${fix.lesson_name}" → "${fix.new_name}"`);
                        console.log(`   Reason: ${fix.reason}`);
                        this.fixesApplied++;
                    }
                } else if (fix.skill_name && fix.lesson_name && fix.new_lesson_name) {
                    // Update specific lesson within a skill
                    const result = await query(`
                        UPDATE lessons
                        SET name = $1
                        FROM skills s
                        WHERE lessons.skill_id = s.id
                        AND s.name = $2
                        AND lessons.name = $3
                        AND lessons.is_active = true
                    `, [fix.new_lesson_name, fix.skill_name, fix.lesson_name]);

                    if (result.rowCount > 0) {
                        console.log(`✅ Updated lesson: "${fix.skill_name}" > "${fix.lesson_name}" → "${fix.new_lesson_name}"`);
                        console.log(`   Reason: ${fix.reason}`);
                        this.fixesApplied++;
                    }
                }
            } catch (error) {
                console.warn(`⚠️  Could not apply fix: ${fix.reason}`);
                console.warn(`   Error: ${error.message}`);
            }
        }

        console.log(`✅ Applied ${this.fixesApplied} naming fixes`);
    }

    /**
     * Update skill descriptions to match actual content
     */
    async updateSkillDescriptions() {
        console.log('📝 Updating skill descriptions...');

        const descriptionUpdates = [
            {
                name: 'Albanian 1: Unit 1 - Greetings & Basic Phrases',
                new_description: 'Learn essential Albanian greetings, basic phrases, and fundamental vocabulary for everyday conversations'
            },
            {
                name: 'Albanian 1: Unit 2 - Numbers & Time',
                new_description: 'Master Albanian numbers, time expressions, and planning vocabulary for daily activities'
            },
            {
                name: 'Albanian 1: Unit 3 - Food & Drinks',
                new_description: 'Learn basic social phrases and courtesy expressions used in Albanian culture'
            }
        ];

        let descriptionsUpdated = 0;

        for (const update of descriptionUpdates) {
            try {
                const result = await query(`
                    UPDATE skills
                    SET description = $1
                    WHERE name = $2 AND is_active = true
                `, [update.new_description, update.name]);

                if (result.rowCount > 0) {
                    console.log(`✅ Updated description for: "${update.name}"`);
                    descriptionsUpdated++;
                }
            } catch (error) {
                console.warn(`⚠️  Could not update description for: "${update.name}"`);
            }
        }

        console.log(`✅ Updated ${descriptionsUpdated} skill descriptions`);
    }

    /**
     * Verify the fixes by checking alignment again
     */
    async verifyFixes() {
        console.log('🔍 Verifying alignment fixes...');

        // Get updated skill/lesson data
        const verification = await query(`
            SELECT
                s.name as skill_name,
                l.name as lesson_name,
                string_agg(DISTINCT lc.grammar_category, ', ' ORDER BY lc.grammar_category) as actual_categories
            FROM skills s
            JOIN lessons l ON s.id = l.skill_id AND l.is_active = true
            LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
            WHERE s.is_active = true
            AND (s.name LIKE '%Numbers%' OR s.name LIKE '%Food%' OR l.name LIKE '%Numbers%' OR l.name LIKE '%Food%')
            GROUP BY s.id, s.name, l.id, l.name
            ORDER BY s.position, l.position
        `);

        console.log('📊 Key skills/lessons after fixes:');
        verification.rows.forEach(row => {
            const categories = row.actual_categories || 'No content';
            console.log(`   ${row.skill_name}`);
            console.log(`   → ${row.lesson_name}: ${categories}`);
        });

        return verification.rows;
    }

    /**
     * Main execution function
     */
    async fixAllAlignments() {
        console.log('🚀 Starting skill/lesson alignment fixes...\n');

        try {
            // Step 1: Fix major misalignments
            await this.fixMajorMisalignments();

            // Step 2: Update descriptions
            await this.updateSkillDescriptions();

            // Step 3: Verify fixes
            await this.verifyFixes();

            console.log('\n🎉 Skill alignment fixes completed!');
            console.log(`Total fixes applied: ${this.fixesApplied}`);

            return true;

        } catch (error) {
            console.error('❌ Error during skill alignment fixes:', error);
            throw error;
        }
    }
}

/**
 * Main execution
 */
async function main() {
    const fixer = new SkillAlignmentFixer();
    const success = await fixer.fixAllAlignments();
    process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = { SkillAlignmentFixer };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}