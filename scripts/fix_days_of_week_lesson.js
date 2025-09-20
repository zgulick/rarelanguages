/**
 * Fix Days of the Week Lesson Content
 *
 * Completely rebuild the Days of the Week lesson with proper content
 */

const { query } = require('../lib/database');

class DaysOfWeekFixer {
    constructor() {
        this.lessonId = '4626a9fd-2c08-4929-a425-b80151d12b37'; // Days of the Week lesson ID
        this.itemsRemoved = 0;
        this.itemsAdded = 0;
    }

    /**
     * Remove all inappropriate content from Days of the Week lesson
     */
    async removeInappropriateContent() {
        console.log('🗑️ Removing inappropriate content from Days of the Week lesson...');

        // Remove all content except the intro
        const removeResult = await query(`
            DELETE FROM lesson_content
            WHERE lesson_id = $1
            AND english_phrase != 'In this lesson, you''ll learn numbers and time.'
        `, [this.lessonId]);

        this.itemsRemoved = removeResult.rowCount;
        console.log(`✅ Removed ${this.itemsRemoved} inappropriate items`);
    }

    /**
     * Add proper Days of the Week content
     */
    async addProperDaysContent() {
        console.log('📅 Adding proper Days of the Week content...');

        const daysContent = [
            // Days of the week
            { english: 'Monday', albanian: 'E hënë', pronunciation: 'Eh HUH-nuh', order: 1 },
            { english: 'Tuesday', albanian: 'E martë', pronunciation: 'Eh MAR-tuh', order: 2 },
            { english: 'Wednesday', albanian: 'E mërkurë', pronunciation: 'Eh mur-KOO-ruh', order: 3 },
            { english: 'Thursday', albanian: 'E enjte', pronunciation: 'Eh EN-teh', order: 4 },
            { english: 'Friday', albanian: 'E premte', pronunciation: 'Eh PREM-teh', order: 5 },
            { english: 'Saturday', albanian: 'E shtunë', pronunciation: 'Eh SHTOO-nuh', order: 6 },
            { english: 'Sunday', albanian: 'E diel', pronunciation: 'Eh DEE-el', order: 7 },

            // Time-related phrases
            { english: 'What day is it?', albanian: 'Çfarë dite është?', pronunciation: 'CHFAH-ruh DEE-teh esht?', order: 8 },
            { english: 'Today is Monday', albanian: 'Sot është e hënë', pronunciation: 'Soht esht eh HUH-nuh', order: 9 },
            { english: 'Tomorrow is Tuesday', albanian: 'Nesër është e martë', pronunciation: 'Neh-SUR esht eh MAR-tuh', order: 10 },
            { english: 'Yesterday was Sunday', albanian: 'Dje ishte e diel', pronunciation: 'Dyeh EESH-teh eh DEE-el', order: 11 },
            { english: 'This week', albanian: 'Këtë javë', pronunciation: 'KUH-tuh YAH-vuh', order: 12 },
            { english: 'Next week', albanian: 'Javën tjetër', pronunciation: 'YAH-vun TYEH-tur', order: 13 },
            { english: 'Weekend', albanian: 'Fundjavë', pronunciation: 'Fund-YAH-vuh', order: 14 }
        ];

        for (const day of daysContent) {
            await query(`
                INSERT INTO lesson_content
                (lesson_id, english_phrase, target_phrase, pronunciation_guide,
                 word_type, grammar_category, content_section_type, content_order,
                 difficulty_progression, is_key_concept, learning_objective)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
                this.lessonId,
                day.english,
                day.albanian,
                day.pronunciation,
                'noun',
                'time_expressions',
                'vocabulary',
                day.order,
                1,
                day.order <= 7, // Days of week are key concepts
                day.order <= 7 ? 'Learn the seven days of the week in Albanian' : 'Use time expressions to talk about days and weeks'
            ]);

            this.itemsAdded++;
        }

        console.log(`✅ Added ${this.itemsAdded} proper days/time content items`);
    }

    /**
     * Add proper numbers content to other Unit 2 lessons
     */
    async addNumbersToOtherLessons() {
        console.log('🔢 Adding numbers content to other Unit 2 lessons...');

        // Get other Unit 2 lessons that need numbers
        const otherLessons = await query(`
            SELECT l.id, l.name
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            WHERE s.name LIKE '%Unit 2%Numbers%'
            AND l.id != $1
            AND l.is_active = true
        `, [this.lessonId]);

        const numbersContent = [
            { english: 'Eleven', albanian: 'Njëmbëdhjetë', pronunciation: 'Nyum-buh-THYE-tuh' },
            { english: 'Twelve', albanian: 'Dymbëdhjetë', pronunciation: 'Deem-buh-THYE-tuh' },
            { english: 'Thirteen', albanian: 'Trembëdhjetë', pronunciation: 'Trem-buh-THYE-tuh' },
            { english: 'Fourteen', albanian: 'Katërmbëdhjetë', pronunciation: 'Kah-tur-buh-THYE-tuh' },
            { english: 'Fifteen', albanian: 'Pesëmbëdhjetë', pronunciation: 'Peh-sum-buh-THYE-tuh' },
            { english: 'Twenty', albanian: 'Njëzet', pronunciation: 'Nyuh-ZET' },
            { english: 'Thirty', albanian: 'Tridhjetë', pronunciation: 'Tree-THYE-tuh' },
            { english: 'Forty', albanian: 'Dyzet', pronunciation: 'Dee-ZET' },
            { english: 'Fifty', albanian: 'Pesëdhjetë', pronunciation: 'Peh-suh-THYE-tuh' },
            { english: 'One hundred', albanian: 'Njëqind', pronunciation: 'Nyuh-CHEEND' }
        ];

        let numbersAdded = 0;

        for (const lesson of otherLessons.rows) {
            // Add a few numbers to each lesson
            const numbersToAdd = numbersContent.slice(0, 5); // First 5 numbers per lesson

            for (const [index, num] of numbersToAdd.entries()) {
                await query(`
                    INSERT INTO lesson_content
                    (lesson_id, english_phrase, target_phrase, pronunciation_guide,
                     word_type, grammar_category, content_section_type, content_order,
                     difficulty_progression, is_key_concept, learning_objective)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT DO NOTHING
                `, [
                    lesson.id, num.english, num.albanian, num.pronunciation,
                    'noun', 'numbers', 'vocabulary', index + 10,
                    1, true, 'Learn Albanian numbers for counting and daily use'
                ]);
                numbersAdded++;
            }
        }

        console.log(`✅ Added ${numbersAdded} numbers to other Unit 2 lessons`);
    }

    /**
     * Verify the fixes
     */
    async verifyFixes() {
        console.log('\n🔍 Verifying Days of the Week lesson fixes...');

        const verification = await query(`
            SELECT
                english_phrase, target_phrase, grammar_category,
                CASE WHEN conjugation_data IS NOT NULL THEN 1 ELSE 0 END as has_conjugation
            FROM lesson_content
            WHERE lesson_id = $1
            ORDER BY content_order
        `, [this.lessonId]);

        console.log(`📊 Days of the Week lesson now contains:`);
        console.log(`   Total items: ${verification.rows.length}`);

        const categories = {};
        let conjugationCount = 0;

        verification.rows.forEach(item => {
            categories[item.grammar_category] = (categories[item.grammar_category] || 0) + 1;
            conjugationCount += item.has_conjugation;
        });

        console.log('   Categories:');
        Object.entries(categories).forEach(([cat, count]) => {
            console.log(`     ${cat}: ${count} items`);
        });

        console.log(`   Items with conjugation data: ${conjugationCount} (should be 0 for basic lesson)`);

        console.log('\n✅ Sample content:');
        verification.rows.slice(0, 5).forEach((item, i) => {
            console.log(`   ${i + 1}. "${item.english_phrase}" -> "${item.target_phrase}" (${item.grammar_category})`);
        });

        const success = verification.rows.length >= 10 &&
                       categories.time_expressions >= 7 &&
                       conjugationCount === 0;

        return success;
    }

    /**
     * Main execution function
     */
    async fixDaysOfWeekLesson() {
        console.log('🚀 Starting Days of the Week lesson fix...\n');

        try {
            // Step 1: Remove inappropriate content
            await this.removeInappropriateContent();

            // Step 2: Add proper days content
            await this.addProperDaysContent();

            // Step 3: Add numbers to other lessons
            await this.addNumbersToOtherLessons();

            // Step 4: Verify fixes
            const success = await this.verifyFixes();

            console.log('\n🎉 Days of the Week lesson fix completed!');
            console.log(`Items removed: ${this.itemsRemoved}`);
            console.log(`Items added: ${this.itemsAdded}`);
            console.log(`Status: ${success ? 'SUCCESS' : 'NEEDS REVIEW'}`);

            return success;

        } catch (error) {
            console.error('❌ Error during Days of the Week fix:', error);
            throw error;
        }
    }
}

/**
 * Main execution
 */
async function main() {
    const fixer = new DaysOfWeekFixer();
    const success = await fixer.fixDaysOfWeekLesson();
    process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = { DaysOfWeekFixer };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}