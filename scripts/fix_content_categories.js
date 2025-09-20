/**
 * Fix Content Categories and Remove Remaining Academic Content
 *
 * Removes the remaining academic content and ensures units have appropriate content
 */

const { query } = require('../lib/database');

class ContentCategoryFixer {
    constructor() {
        this.academicItemsRemoved = 0;
        this.categoriesFixed = 0;
    }

    /**
     * Remove all remaining academic/morphological content
     */
    async removeAcademicContent() {
        console.log('🗑️  Removing remaining academic content...');

        // Find and remove explicitly academic content
        const academicContent = await query(`
            SELECT id, english_phrase, target_phrase
            FROM lesson_content
            WHERE
                english_phrase ILIKE '%morpholog%' OR
                english_phrase ILIKE '%comparative%' OR
                english_phrase ILIKE '%synthesiz%' OR
                english_phrase ILIKE '%theories%' OR
                english_phrase ILIKE '%linguistic%' OR
                target_phrase ILIKE '%morfologjik%' OR
                target_phrase ILIKE '%teorive%' OR
                cultural_context ILIKE '%morpholog%' OR
                cultural_context ILIKE '%linguistic%' OR
                cultural_context ILIKE '%comparative%'
        `);

        console.log(`Found ${academicContent.rows.length} academic content items to remove`);

        for (const item of academicContent.rows) {
            await query(`DELETE FROM lesson_content WHERE id = $1`, [item.id]);
            console.log(`✅ Removed: "${item.english_phrase}"`);
            this.academicItemsRemoved++;
        }

        console.log(`✅ Removed ${this.academicItemsRemoved} academic content items`);
    }

    /**
     * Add proper numbers content to Unit 2
     */
    async addProperNumbersContent() {
        console.log('🔢 Adding proper numbers content to Unit 2...');

        // Get Unit 2 Numbers & Time skills and lessons
        const unit2Lessons = await query(`
            SELECT l.id, l.name, s.name as skill_name
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            WHERE s.name LIKE '%Unit 2%Numbers%'
            AND l.is_active = true
            ORDER BY l.position
        `);

        const numbersContent = [
            { english: 'One', albanian: 'Një', pronunciation: 'Nyuh' },
            { english: 'Two', albanian: 'Dy', pronunciation: 'Dee' },
            { english: 'Three', albanian: 'Tre', pronunciation: 'Treh' },
            { english: 'Four', albanian: 'Katër', pronunciation: 'Kah-tur' },
            { english: 'Five', albanian: 'Pesë', pronunciation: 'Peh-suh' },
            { english: 'Six', albanian: 'Gjashtë', pronunciation: 'Gyah-shtu' },
            { english: 'Seven', albanian: 'Shtatë', pronunciation: 'Shta-tu' },
            { english: 'Eight', albanian: 'Tetë', pronunciation: 'Teh-tu' },
            { english: 'Nine', albanian: 'Nëntë', pronunciation: 'Nun-tu' },
            { english: 'Ten', albanian: 'Dhjetë', pronunciation: 'Thye-tu' }
        ];

        const timeContent = [
            { english: 'What time is it?', albanian: 'Sa është ora?', pronunciation: 'Sah esht OH-rah?' },
            { english: 'One o\'clock', albanian: 'Ora një', pronunciation: 'OH-rah nyuh' },
            { english: 'Two o\'clock', albanian: 'Ora dy', pronunciation: 'OH-rah dee' },
            { english: 'Half past one', albanian: 'Një e gjysmë', pronunciation: 'Nyuh eh GYEES-muh' },
            { english: 'Quarter past two', albanian: 'Dy e çerek', pronunciation: 'Dee eh CHEH-rek' }
        ];

        let contentAdded = 0;

        for (const lesson of unit2Lessons.rows) {
            // Add numbers to lessons that should have them
            if (lesson.name.toLowerCase().includes('number') || lesson.name.toLowerCase().includes('basic')) {
                for (const [index, num] of numbersContent.entries()) {
                    await query(`
                        INSERT INTO lesson_content
                        (lesson_id, english_phrase, target_phrase, pronunciation_guide,
                         word_type, grammar_category, content_section_type, content_order,
                         difficulty_progression, is_key_concept, learning_objective)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        ON CONFLICT DO NOTHING
                    `, [
                        lesson.id, num.english, num.albanian, num.pronunciation,
                        'noun', 'numbers', 'vocabulary', index + 1,
                        1, true, 'Learn basic Albanian numbers for counting and daily use'
                    ]);
                    contentAdded++;
                }
            }

            // Add time content to time-related lessons
            if (lesson.name.toLowerCase().includes('time') || lesson.name.toLowerCase().includes('plan')) {
                for (const [index, time] of timeContent.entries()) {
                    await query(`
                        INSERT INTO lesson_content
                        (lesson_id, english_phrase, target_phrase, pronunciation_guide,
                         word_type, grammar_category, content_section_type, content_order,
                         difficulty_progression, is_key_concept, learning_objective)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        ON CONFLICT DO NOTHING
                    `, [
                        lesson.id, time.english, time.albanian, time.pronunciation,
                        'phrase', 'time_expressions', 'vocabulary', index + 10,
                        1, true, 'Learn to ask about and tell time in Albanian'
                    ]);
                    contentAdded++;
                }
            }
        }

        console.log(`✅ Added ${contentAdded} proper numbers/time content items`);
    }

    /**
     * Add proper greetings content to Unit 1
     */
    async addProperGreetingsContent() {
        console.log('👋 Adding proper greetings content to Unit 1...');

        // Get Unit 1 Greetings lessons
        const unit1Lessons = await query(`
            SELECT l.id, l.name, s.name as skill_name
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            WHERE s.name LIKE '%Unit 1%Greet%'
            AND l.is_active = true
            ORDER BY l.position
        `);

        const greetingsContent = [
            { english: 'Hello', albanian: 'Përshëndetje', pronunciation: 'Per-shen-det-yeh', context: 'A friendly greeting used throughout Albania in both formal and casual situations.' },
            { english: 'Good morning', albanian: 'Mirëmëngjes', pronunciation: 'Mee-ruh-men-gyes', context: 'A warm morning greeting commonly used until around noon in Albania.' },
            { english: 'Good afternoon', albanian: 'Mirëdita', pronunciation: 'Mee-ruh-dee-tah', context: 'Used from noon until evening as a polite greeting in Albanian.' },
            { english: 'Good evening', albanian: 'Mirëmbrëma', pronunciation: 'Mee-ruh-bruh-mah', context: 'An evening greeting used after sunset in Albania.' },
            { english: 'Goodbye', albanian: 'Mirupafshim', pronunciation: 'Mee-roo-paf-shim', context: 'A polite way to say goodbye in Albanian.' },
            { english: 'Thank you', albanian: 'Faleminderit', pronunciation: 'Fah-leh-min-deh-rit', context: 'Expressing gratitude is very important in Albanian culture and shows good manners.' },
            { english: 'Please', albanian: 'Ju lutem', pronunciation: 'Yoo loo-tem', context: 'Adding "ju lutem" (please) makes requests more polite in Albanian culture.' },
            { english: 'How are you?', albanian: 'Si jeni?', pronunciation: 'See yeh-nee?', context: 'A common way to show interest in someone\'s wellbeing in Albanian culture.' }
        ];

        let contentAdded = 0;

        for (const lesson of unit1Lessons.rows) {
            // Add greetings to lessons that should have them
            if (lesson.name.toLowerCase().includes('greet') || lesson.name.toLowerCase().includes('basic')) {
                for (const [index, greeting] of greetingsContent.entries()) {
                    await query(`
                        INSERT INTO lesson_content
                        (lesson_id, english_phrase, target_phrase, pronunciation_guide,
                         word_type, grammar_category, content_section_type, content_order,
                         difficulty_progression, is_key_concept, learning_objective, cultural_context)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                        ON CONFLICT DO NOTHING
                    `, [
                        lesson.id, greeting.english, greeting.albanian, greeting.pronunciation,
                        'phrase', 'greetings', 'vocabulary', index + 1,
                        1, true, 'Learn essential Albanian greetings for daily communication', greeting.context
                    ]);
                    contentAdded++;
                }
            }
        }

        console.log(`✅ Added ${contentAdded} proper greetings content items`);
    }

    /**
     * Remove inappropriate content from specific units
     */
    async removeInappropriateContent() {
        console.log('🧹 Removing content that doesn\'t belong in specific units...');

        // Remove weather content from Unit 1 Greetings
        const weatherInGreetings = await query(`
            DELETE FROM lesson_content
            WHERE lesson_id IN (
                SELECT l.id FROM lessons l
                JOIN skills s ON l.skill_id = s.id
                WHERE s.name LIKE '%Unit 1%Greet%'
            )
            AND (
                english_phrase ILIKE '%snow%' OR
                english_phrase ILIKE '%weather%' OR
                target_phrase ILIKE '%borë%' OR
                target_phrase ILIKE '%mot%'
            )
        `);

        // Remove time expressions from Unit 1 Greetings
        const timeInGreetings = await query(`
            DELETE FROM lesson_content
            WHERE lesson_id IN (
                SELECT l.id FROM lessons l
                JOIN skills s ON l.skill_id = s.id
                WHERE s.name LIKE '%Unit 1%Greet%'
            )
            AND grammar_category = 'time_expressions'
            AND english_phrase NOT IN ('Good morning', 'Good afternoon', 'Good evening')
        `);

        console.log(`✅ Removed ${weatherInGreetings.rowCount + timeInGreetings.rowCount} inappropriate items`);
    }

    /**
     * Generate verification report
     */
    async generateVerificationReport() {
        console.log('\n📊 VERIFICATION REPORT:');

        // Check Unit 2 content
        const unit2Check = await query(`
            SELECT COUNT(*) as count,
                   SUM(CASE WHEN grammar_category = 'numbers' THEN 1 ELSE 0 END) as numbers_count,
                   SUM(CASE WHEN grammar_category = 'time_expressions' THEN 1 ELSE 0 END) as time_count
            FROM lesson_content lc
            JOIN lessons l ON lc.lesson_id = l.id
            JOIN skills s ON l.skill_id = s.id
            WHERE s.name LIKE '%Unit 2%Numbers%'
        `);

        // Check Unit 1 content
        const unit1Check = await query(`
            SELECT COUNT(*) as count,
                   SUM(CASE WHEN grammar_category = 'greetings' THEN 1 ELSE 0 END) as greetings_count
            FROM lesson_content lc
            JOIN lessons l ON lc.lesson_id = l.id
            JOIN skills s ON l.skill_id = s.id
            WHERE s.name LIKE '%Unit 1%Greet%'
        `);

        // Check remaining academic content
        const academicCheck = await query(`
            SELECT COUNT(*) as count
            FROM lesson_content
            WHERE cultural_context ILIKE '%morpholog%' OR cultural_context ILIKE '%linguistic%'
        `);

        const unit2 = unit2Check.rows[0];
        const unit1 = unit1Check.rows[0];
        const academic = academicCheck.rows[0];

        console.log(`📈 Changes Made:`);
        console.log(`   Academic items removed: ${this.academicItemsRemoved}`);
        console.log(`   Categories fixed: ${this.categoriesFixed}`);

        console.log(`\n📊 Content Verification:`);
        console.log(`   Unit 2 Numbers & Time: ${unit2.count} total items`);
        console.log(`     - Numbers: ${unit2.numbers_count} items`);
        console.log(`     - Time: ${unit2.time_count} items`);
        console.log(`   Unit 1 Greetings: ${unit1.count} total items`);
        console.log(`     - Greetings: ${unit1.greetings_count} items`);
        console.log(`   Remaining academic contexts: ${academic.count}`);

        return {
            unit2HasNumbers: parseInt(unit2.numbers_count) > 0,
            unit2HasTime: parseInt(unit2.time_count) > 0,
            unit1HasGreetings: parseInt(unit1.greetings_count) > 0,
            academicRemaining: parseInt(academic.count)
        };
    }

    /**
     * Main execution function
     */
    async fixAllCategories() {
        console.log('🚀 Starting content category fixes...\n');

        try {
            // Step 1: Remove academic content
            await this.removeAcademicContent();

            // Step 2: Remove inappropriate content from units
            await this.removeInappropriateContent();

            // Step 3: Add proper numbers content
            await this.addProperNumbersContent();

            // Step 4: Add proper greetings content
            await this.addProperGreetingsContent();

            // Step 5: Verify fixes
            const verification = await this.generateVerificationReport();

            console.log('\n🎉 Content category fixes completed!');

            const success = verification.unit2HasNumbers && verification.unit1HasGreetings && verification.academicRemaining === 0;
            console.log(`Status: ${success ? 'SUCCESS' : 'NEEDS REVIEW'}`);

            return success;

        } catch (error) {
            console.error('❌ Error during content category fixes:', error);
            throw error;
        }
    }
}

/**
 * Main execution
 */
async function main() {
    const fixer = new ContentCategoryFixer();
    const success = await fixer.fixAllCategories();
    process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = { ContentCategoryFixer };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}