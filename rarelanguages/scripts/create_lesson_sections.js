/**
 * Create Lesson Sections and Reorganize Content
 *
 * Creates structured lesson sections and reorganizes existing content
 * according to pedagogical best practices
 */

const { query } = require('../lib/database');

class LessonStructureManager {
    constructor() {
        this.sectionTemplates = {
            'introduction': {
                title: 'Lesson Introduction',
                description: 'Overview of what you\'ll learn in this lesson',
                estimated_minutes: 2,
                order: 1
            },
            'vocabulary': {
                title: 'Core Vocabulary',
                description: 'Essential words and phrases for this lesson',
                estimated_minutes: 5,
                order: 2
            },
            'pronunciation': {
                title: 'Pronunciation Practice',
                description: 'Learn correct Albanian pronunciation',
                estimated_minutes: 4,
                order: 3
            },
            'grammar': {
                title: 'Grammar Basics',
                description: 'Simple grammar patterns and rules',
                estimated_minutes: 3,
                order: 4
            },
            'sentences': {
                title: 'Example Sentences',
                description: 'See vocabulary used in real contexts',
                estimated_minutes: 4,
                order: 5
            },
            'practice': {
                title: 'Practice & Review',
                description: 'Reinforce what you\'ve learned',
                estimated_minutes: 5,
                order: 6
            }
        };
    }

    /**
     * Create lesson sections for all active lessons
     */
    async createLessonSections() {
        console.log('🏗️  Creating lesson sections...');

        // Get all active lessons
        const lessonsResult = await query(`
            SELECT id, name, skill_id
            FROM lessons
            WHERE is_active = true
            ORDER BY position
        `);

        let sectionsCreated = 0;

        for (const lesson of lessonsResult.rows) {
            console.log(`Creating sections for lesson: ${lesson.name}`);

            for (const [sectionType, template] of Object.entries(this.sectionTemplates)) {
                try {
                    await query(`
                        INSERT INTO lesson_sections
                        (lesson_id, section_type, section_order, title, description, estimated_minutes)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT DO NOTHING
                    `, [
                        lesson.id,
                        sectionType,
                        template.order,
                        template.title,
                        template.description,
                        template.estimated_minutes
                    ]);
                    sectionsCreated++;
                } catch (error) {
                    console.warn(`Warning: Could not create section ${sectionType} for lesson ${lesson.name}:`, error.message);
                }
            }
        }

        console.log(`✅ Created ${sectionsCreated} lesson sections`);
        return sectionsCreated;
    }

    /**
     * Categorize existing content based on content analysis
     */
    async categorizeContent() {
        console.log('📋 Categorizing existing content...');

        // Update content categorization based on intelligent analysis
        await query(`
            UPDATE lesson_content SET
                content_section_type = CASE
                    WHEN grammar_category = 'greetings' AND word_type IN ('phrase', 'noun', 'pronoun') THEN 'vocabulary'
                    WHEN grammar_category = 'numbers' THEN 'vocabulary'
                    WHEN grammar_category = 'courtesy' THEN 'vocabulary'
                    WHEN word_type = 'verb' AND target_phrase NOT LIKE '%?%' THEN 'grammar'
                    WHEN target_phrase LIKE '%?%' THEN 'practice'
                    WHEN LENGTH(target_phrase) > 25 AND target_phrase LIKE '% %' THEN 'sentences'
                    ELSE 'vocabulary'
                END,
                difficulty_progression = CASE
                    WHEN word_type IN ('phrase', 'noun') AND LENGTH(target_phrase) <= 15 THEN 1
                    WHEN word_type = 'verb' AND LENGTH(target_phrase) <= 20 THEN 2
                    WHEN LENGTH(target_phrase) BETWEEN 21 AND 35 THEN 3
                    WHEN LENGTH(target_phrase) > 35 THEN 4
                    ELSE 1
                END,
                is_key_concept = CASE
                    WHEN grammar_category IN ('greetings', 'courtesy', 'numbers') THEN true
                    WHEN word_type = 'verb' AND grammar_category = 'general_vocabulary' THEN true
                    ELSE false
                END,
                learning_objective = CASE
                    WHEN grammar_category = 'greetings' THEN 'Learn essential Albanian greetings for daily communication'
                    WHEN grammar_category = 'numbers' THEN 'Master basic numbers for counting and describing quantities'
                    WHEN grammar_category = 'courtesy' THEN 'Use polite expressions to show respect in Albanian culture'
                    WHEN word_type = 'verb' THEN 'Understand basic Albanian verb usage and patterns'
                    WHEN content_section_type = 'sentences' THEN 'Practice using vocabulary in natural Albanian sentences'
                    ELSE 'Build fundamental Albanian vocabulary for everyday situations'
                END
        `);

        console.log('✅ Content categorization updated');
    }

    /**
     * Assign content to appropriate lesson sections
     */
    async assignContentToSections() {
        console.log('🔗 Assigning content to lesson sections...');

        // First, map content section types to lesson section types
        const sectionMapping = {
            'vocabulary': 'vocabulary',
            'grammar': 'grammar',
            'sentences': 'sentences',
            'practice': 'practice',
            'pronunciation': 'pronunciation'
        };

        let assignmentsUpdated = 0;

        for (const [contentType, sectionType] of Object.entries(sectionMapping)) {
            // First assign section_id
            const sectionResult = await query(`
                UPDATE lesson_content lc SET section_id = ls.id
                FROM lesson_sections ls
                WHERE lc.lesson_id = ls.lesson_id
                AND ls.section_type = $1
                AND lc.content_section_type = $2
                AND lc.section_id IS NULL
            `, [sectionType, contentType]);

            // Then update content_order using a separate query
            await query(`
                UPDATE lesson_content SET content_order = content_ranks.new_order
                FROM (
                    SELECT id,
                           ROW_NUMBER() OVER (
                               PARTITION BY lesson_id, content_section_type
                               ORDER BY difficulty_progression,
                                        CASE WHEN is_key_concept THEN 0 ELSE 1 END,
                                        id
                           ) as new_order
                    FROM lesson_content
                    WHERE content_section_type = $1
                    AND section_id IS NOT NULL
                ) content_ranks
                WHERE lesson_content.id = content_ranks.id
            `, [contentType]);

            assignmentsUpdated += sectionResult.rowCount || 0;
        }

        console.log(`✅ Updated ${assignmentsUpdated} content assignments`);
        return assignmentsUpdated;
    }

    /**
     * Create introduction content for each lesson
     */
    async createIntroductionContent() {
        console.log('📝 Creating introduction content...');

        // Get lessons that need introduction content
        const lessonsResult = await query(`
            SELECT l.id, l.name, l.position, s.name as skill_name, ls.id as intro_section_id
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            JOIN lesson_sections ls ON l.id = ls.lesson_id
            WHERE l.is_active = true
            AND ls.section_type = 'introduction'
            AND NOT EXISTS (
                SELECT 1 FROM lesson_content lc
                WHERE lc.section_id = ls.id
            )
            ORDER BY l.position
        `);

        let introContentCreated = 0;

        for (const lesson of lessonsResult.rows) {
            // Generate appropriate introduction based on lesson context
            const introText = this.generateIntroductionText(lesson.name, lesson.skill_name);

            try {
                await query(`
                    INSERT INTO lesson_content
                    (lesson_id, section_id, english_phrase, target_phrase, pronunciation_guide,
                     content_section_type, content_order, difficulty_progression, is_key_concept,
                     learning_objective, word_type, grammar_category)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `, [
                    lesson.id,
                    lesson.intro_section_id,
                    introText.english,
                    introText.albanian,
                    introText.pronunciation,
                    'intro',
                    1,
                    1,
                    true,
                    introText.objective,
                    'phrase',
                    'introduction'
                ]);

                introContentCreated++;
            } catch (error) {
                console.warn(`Warning: Could not create intro content for ${lesson.name}:`, error.message);
            }
        }

        console.log(`✅ Created ${introContentCreated} introduction items`);
        return introContentCreated;
    }

    /**
     * Generate introduction text based on lesson context
     */
    generateIntroductionText(lessonName, skillName) {
        const lessonContext = lessonName.toLowerCase();

        // Unit-specific introductions
        if (skillName.includes('Unit 1') || lessonContext.includes('greeting')) {
            return {
                english: 'Welcome to Albanian! Let\'s start with basic greetings.',
                albanian: 'Mirë se vini në shqip! Le të fillojmë me përshëndetje bazike.',
                pronunciation: 'MEE-ruh seh VEE-nee nuh shkeep! Leh tuh fee-LOH-yumm meh pur-shuhn-DET-yeh bah-ZEE-keh.',
                objective: 'Learn to greet people and introduce yourself in Albanian'
            };
        } else if (skillName.includes('Unit 2') || lessonContext.includes('number')) {
            return {
                english: 'In this lesson, you\'ll learn numbers and time.',
                albanian: 'Në këtë mësim, do të mësoni numrat dhe kohën.',
                pronunciation: 'Nuh KUH-tuh MUH-seem, doh tuh muh-SOH-nee NUM-rat dheh KOH-an.',
                objective: 'Master Albanian numbers and basic time expressions'
            };
        } else if (skillName.includes('Unit 3') || lessonContext.includes('food')) {
            return {
                english: 'Today we\'ll explore Albanian food vocabulary.',
                albanian: 'Sot do të eksplorjmë fjalësinë shqipe të ushqimit.',
                pronunciation: 'Soht doh tuh ehk-splo-RYU-muh fyah-luh-SEE-an SHKEE-peh tuh oosh-KEE-meet.',
                objective: 'Learn essential food and dining vocabulary in Albanian'
            };
        } else if (skillName.includes('Unit 4') || lessonContext.includes('daily')) {
            return {
                english: 'Let\'s learn about daily activities in Albanian.',
                albanian: 'Le të mësojmë për aktivitetet e përditshme në shqip.',
                pronunciation: 'Leh tuh muh-SOH-yumm pur ahk-tee-vee-TEH-teht eh pur-DEESH-meh nuh shkeep.',
                objective: 'Describe your daily routine using Albanian vocabulary'
            };
        } else if (skillName.includes('Unit 5') || lessonContext.includes('home')) {
            return {
                english: 'Discover vocabulary for home and places.',
                albanian: 'Zbuloni fjalësinë për shtëpinë dhe vendet.',
                pronunciation: 'Zboo-LOH-nee fyah-luh-SEE-an pur SHTUH-pee-an dheh VEN-deht.',
                objective: 'Learn to describe your home and navigate places in Albanian'
            };
        }

        // Default introduction
        return {
            english: 'Welcome to this Albanian lesson!',
            albanian: 'Mirë se vini në këtë mësim shqip!',
            pronunciation: 'MEE-ruh seh VEE-nee nuh KUH-tuh MUH-seem shkeep!',
            objective: 'Build your Albanian language skills step by step'
        };
    }

    /**
     * Generate summary report of lesson structure
     */
    async generateStructureReport() {
        const report = await query(`
            SELECT
                s.name as skill_name,
                COUNT(DISTINCT l.id) as lessons_count,
                COUNT(DISTINCT ls.id) as sections_count,
                COUNT(lc.id) as content_items,
                ARRAY_AGG(DISTINCT ls.section_type ORDER BY ls.section_type) as section_types,
                AVG(lc.difficulty_progression) as avg_difficulty
            FROM skills s
            JOIN lessons l ON s.id = l.skill_id
            LEFT JOIN lesson_sections ls ON l.id = ls.lesson_id
            LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
            WHERE l.is_active = true
            GROUP BY s.id, s.name
            ORDER BY s.name
        `);

        return report.rows;
    }

    /**
     * Main execution function
     */
    async restructureLessons() {
        console.log('🚀 Starting lesson structure reorganization...\n');

        try {
            // Step 1: Create lesson sections
            await this.createLessonSections();

            // Step 2: Categorize existing content
            await this.categorizeContent();

            // Step 3: Assign content to sections
            await this.assignContentToSections();

            // Step 4: Create introduction content
            await this.createIntroductionContent();

            // Step 5: Generate report
            console.log('\n📊 Lesson Structure Summary:');
            const report = await this.generateStructureReport();

            report.forEach((row, index) => {
                console.log(`${index + 1}. ${row.skill_name}`);
                console.log(`   📚 ${row.lessons_count} lessons, ${row.sections_count} sections, ${row.content_items} content items`);
                console.log(`   📋 Sections: ${row.section_types?.join(', ') || 'None'}`);
                console.log(`   📈 Avg Difficulty: ${row.avg_difficulty ? parseFloat(row.avg_difficulty).toFixed(1) : 'N/A'}\n`);
            });

            console.log('✅ Lesson structure reorganization completed successfully!');

        } catch (error) {
            console.error('❌ Error during lesson restructuring:', error);
            throw error;
        }
    }
}

/**
 * Main execution
 */
async function main() {
    if (process.argv[2] === 'report') {
        const manager = new LessonStructureManager();
        const report = await manager.generateStructureReport();
        console.log(JSON.stringify(report, null, 2));
        return;
    }

    const manager = new LessonStructureManager();
    await manager.restructureLessons();
}

// Export for use as module
module.exports = { LessonStructureManager };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}