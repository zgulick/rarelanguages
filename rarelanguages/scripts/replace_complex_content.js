/**
 * Complex Content Replacement Script
 *
 * Identifies and replaces overly complex content with freshman-appropriate alternatives
 * Based on the audit results and using the content generator
 */

const { query } = require('../lib/database');
const { FreshmanContentGenerator } = require('./generate_freshman_content');

class ContentReplacer {
    constructor() {
        this.generator = new FreshmanContentGenerator();
        this.replacementLog = [];
        this.errors = [];
    }

    /**
     * Find all problematic content that needs replacement
     */
    async findProblematicContent() {
        console.log('🔍 Scanning database for problematic content...');

        const result = await query(`
            SELECT
                id,
                english_phrase,
                target_phrase,
                lesson_id,
                word_type,
                grammar_category
            FROM lesson_content
            WHERE english_phrase IS NOT NULL
            AND target_phrase IS NOT NULL
            ORDER BY lesson_id, id
        `);

        const problematicItems = [];

        for (const row of result.rows) {
            const validation = this.generator.validateContent(row.english_phrase, row.target_phrase);

            if (!validation.isValid) {
                problematicItems.push({
                    ...row,
                    validation_issues: validation.issues,
                    validation_score: validation.score
                });
            }
        }

        console.log(`Found ${problematicItems.length} items needing replacement out of ${result.rows.length} total items`);
        return problematicItems;
    }

    /**
     * Get lesson information to determine appropriate unit for replacements
     */
    async getLessonInfo(lessonId) {
        const result = await query(`
            SELECT
                l.name as lesson_name,
                s.name as skill_name,
                s.cefr_level
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            WHERE l.id = $1
        `, [lessonId]);

        return result.rows[0] || null;
    }

    /**
     * Determine appropriate unit based on lesson context
     */
    determineTargetUnit(lessonInfo, originalEnglish) {
        if (!lessonInfo) return 1;

        const lessonName = lessonInfo.lesson_name.toLowerCase();
        const skillName = lessonInfo.skill_name.toLowerCase();

        // Map lesson names to curriculum units
        if (lessonName.includes('greeting') || lessonName.includes('introduction') || lessonName.includes('hello')) {
            return 1; // Greetings & Self-Introduction
        }
        if (lessonName.includes('family') || skillName.includes('family')) {
            return 2; // Family & Relationships
        }
        if (lessonName.includes('school') || lessonName.includes('education') || skillName.includes('school')) {
            return 3; // School Life
        }
        if (lessonName.includes('home') || lessonName.includes('house') || lessonName.includes('daily')) {
            return 4; // Home & Daily Life
        }
        if (lessonName.includes('food') || lessonName.includes('eat') || lessonName.includes('drink')) {
            return 5; // Food & Eating
        }
        if (lessonName.includes('weather') || lessonName.includes('season') || lessonName.includes('climate')) {
            return 6; // Weather & Seasons
        }
        if (lessonName.includes('hobby') || lessonName.includes('sport') || lessonName.includes('free time')) {
            return 7; // Free Time & Hobbies
        }
        if (lessonName.includes('future') || lessonName.includes('plan') || lessonName.includes('dream')) {
            return 8; // Future Plans & Dreams
        }

        // Use content analysis as fallback
        return this.generator.determineAppropriateUnit(originalEnglish);
    }

    /**
     * Replace a single content item
     */
    async replaceContentItem(item) {
        try {
            const lessonInfo = await this.getLessonInfo(item.lesson_id);
            const targetUnit = this.determineTargetUnit(lessonInfo, item.english_phrase);

            console.log(`📝 Replacing content ID ${item.id} (Unit ${targetUnit}): "${item.english_phrase.substring(0, 50)}..."`);

            // Generate replacement content
            const replacement = await this.generator.generateReplacementContent(
                item.english_phrase,
                item.target_phrase,
                targetUnit
            );

            // Update database
            await query(`
                UPDATE lesson_content
                SET
                    english_phrase = $1,
                    target_phrase = $2
                WHERE id = $3
            `, [replacement.english, replacement.albanian, item.id]);

            const logEntry = {
                id: item.id,
                lesson_id: item.lesson_id,
                lesson_info: lessonInfo,
                target_unit: targetUnit,
                original: {
                    english: item.english_phrase,
                    albanian: item.target_phrase,
                    issues: item.validation_issues
                },
                replacement: {
                    english: replacement.english,
                    albanian: replacement.albanian,
                    validation_score: replacement.validation_score
                },
                timestamp: new Date().toISOString()
            };

            this.replacementLog.push(logEntry);
            console.log(`✅ Replaced: "${replacement.english}" / "${replacement.albanian}"`);

            return true;

        } catch (error) {
            console.error(`❌ Failed to replace content ID ${item.id}:`, error.message);
            this.errors.push({
                id: item.id,
                error: error.message,
                original_text: item.english_phrase
            });
            return false;
        }
    }

    /**
     * Process all problematic content
     */
    async replaceAllProblematicContent(limit = null) {
        const problematicItems = await this.findProblematicContent();

        if (problematicItems.length === 0) {
            console.log('🎉 No problematic content found! All content meets quality criteria.');
            return;
        }

        const itemsToProcess = limit ? problematicItems.slice(0, limit) : problematicItems;
        console.log(`🔄 Processing ${itemsToProcess.length} items...`);

        let successCount = 0;
        let failureCount = 0;

        for (let i = 0; i < itemsToProcess.length; i++) {
            const item = itemsToProcess[i];
            console.log(`\n[${i + 1}/${itemsToProcess.length}] Processing item ${item.id}...`);

            const success = await this.replaceContentItem(item);
            if (success) {
                successCount++;
            } else {
                failureCount++;
            }

            // Add small delay to avoid overwhelming the system
            if (i < itemsToProcess.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        console.log(`\n📊 Replacement Summary:`);
        console.log(`✅ Successfully replaced: ${successCount} items`);
        console.log(`❌ Failed to replace: ${failureCount} items`);
        console.log(`📝 Total processed: ${itemsToProcess.length} items`);

        return {
            success_count: successCount,
            failure_count: failureCount,
            total_processed: itemsToProcess.length,
            replacement_log: this.replacementLog,
            errors: this.errors
        };
    }

    /**
     * Generate replacement report
     */
    generateReport() {
        const report = {
            generated_at: new Date().toISOString(),
            summary: {
                total_replacements: this.replacementLog.length,
                total_errors: this.errors.length,
                success_rate: this.replacementLog.length / (this.replacementLog.length + this.errors.length) * 100
            },
            replacements_by_unit: {},
            replacement_log: this.replacementLog,
            errors: this.errors
        };

        // Group by target unit
        this.replacementLog.forEach(entry => {
            const unit = entry.target_unit;
            if (!report.replacements_by_unit[unit]) {
                report.replacements_by_unit[unit] = 0;
            }
            report.replacements_by_unit[unit]++;
        });

        return report;
    }

    /**
     * Save replacement report to file
     */
    saveReport(filename = 'content_replacement_report.json') {
        const fs = require('fs');
        const path = require('path');
        const report = this.generateReport();

        const reportPath = path.join(__dirname, '..', 'data', filename);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log(`📋 Report saved to: ${reportPath}`);
        return reportPath;
    }
}

/**
 * Main execution function
 */
async function main() {
    const replacer = new ContentReplacer();

    const command = process.argv[2] || 'replace';
    const limit = process.argv[3] ? parseInt(process.argv[3]) : null;

    try {
        switch (command) {
            case 'scan':
                console.log('🔍 Scanning for problematic content...');
                const problematic = await replacer.findProblematicContent();
                console.log(`\nFound ${problematic.length} problematic items:`);
                problematic.slice(0, 10).forEach((item, i) => {
                    console.log(`${i + 1}. ID ${item.id}: "${item.english_phrase.substring(0, 60)}..."`);
                    console.log(`   Issues: ${item.validation_issues.join(', ')}`);
                });
                if (problematic.length > 10) {
                    console.log(`   ... and ${problematic.length - 10} more items`);
                }
                break;

            case 'replace':
                console.log('🔄 Starting content replacement...');
                const results = await replacer.replaceAllProblematicContent(limit);
                const reportPath = replacer.saveReport();

                console.log('\n🎉 Content replacement completed!');
                console.log(`📋 Detailed report saved to: ${reportPath}`);

                if (results.failure_count > 0) {
                    console.log(`⚠️  ${results.failure_count} items failed to replace. Check the report for details.`);
                }
                break;

            case 'test':
                console.log('🧪 Testing content replacement (dry run)...');
                const testItems = await replacer.findProblematicContent();
                if (testItems.length > 0) {
                    const testItem = testItems[0];
                    console.log(`\nTesting replacement for: "${testItem.english_phrase}"`);
                    console.log(`Issues: ${testItem.validation_issues.join(', ')}`);

                    const lessonInfo = await replacer.getLessonInfo(testItem.lesson_id);
                    const targetUnit = replacer.determineTargetUnit(lessonInfo, testItem.english_phrase);
                    const replacement = await replacer.generator.generateReplacementContent(
                        testItem.english_phrase,
                        testItem.target_phrase,
                        targetUnit
                    );

                    console.log(`\nGenerated replacement (Unit ${targetUnit}):`);
                    console.log(`English: "${replacement.english}"`);
                    console.log(`Albanian: "${replacement.albanian}"`);
                    console.log(`Validation Score: ${replacement.validation_score}/100`);
                } else {
                    console.log('No problematic content found to test with.');
                }
                break;

            default:
                console.log('Usage: node replace_complex_content.js <command> [limit]');
                console.log('Commands:');
                console.log('  scan - Find and list problematic content');
                console.log('  replace [limit] - Replace problematic content (optional limit)');
                console.log('  test - Test replacement generation (dry run)');
                break;
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Export for use as module
module.exports = { ContentReplacer };

// Run if called directly
if (require.main === module) {
    main();
}