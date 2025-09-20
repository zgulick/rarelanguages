/**
 * Fix Pronunciation Guides
 *
 * Regenerates correct pronunciation guides for all Albanian content
 * to match the current beginner-appropriate phrases
 */

const { query } = require('../lib/database');

class PronunciationFixer {
    constructor() {
        // Albanian pronunciation rules for beginners
        this.albanianPronunciation = {
            // Vowels
            'a': 'ah',
            'e': 'eh',
            'ë': 'uh',
            'i': 'ee',
            'o': 'oh',
            'u': 'oo',
            'y': 'uu',

            // Consonants with special rules
            'c': 'ts',
            'ç': 'ch',
            'dh': 'th',
            'gj': 'gy',
            'j': 'y',
            'nj': 'ny',
            'q': 'ch',
            'rr': 'rr',
            'sh': 'sh',
            'th': 'th',
            'x': 'dz',
            'xh': 'j',
            'zh': 'zh'
        };
    }

    /**
     * Generate simple phonetic pronunciation for Albanian text
     */
    generatePronunciation(albanianText) {
        if (!albanianText) return '';

        // Common Albanian words with established pronunciations
        const commonWords = {
            'përshëndetje': 'Per-shen-det-yeh',
            'faleminderit': 'Fah-leh-min-deh-rit',
            'mirëmëngjes': 'Mee-ruh-men-gyes',
            'mirëdita': 'Mee-ruh-dee-tah',
            'mirupafshim': 'Mee-roo-paf-shim',
            'si jeni': 'See yeh-nee',
            'si je': 'See yeh',
            'unë quhem': 'Oo-nuh choo-hem',
            'ju lutem': 'Yoo loo-tem',
            'të lutem': 'Tuh loo-tem',
            'kjo është': 'Kyoh esht',
            'ky është': 'Kee esht',
            'unë jam': 'Oo-nuh yam',
            'ti je': 'Tee yeh',
            'ai është': 'Ah-ee esht',
            'ajo është': 'Ah-yoh esht',
            'nëna ime': 'Nuh-nah ee-meh',
            'babai im': 'Bah-bah-ee eem',
            'motra ime': 'Moh-trah ee-meh',
            'vëllai im': 'Vuh-lah-ee eem'
        };

        let text = albanianText.toLowerCase().trim();

        // Check for common words first
        if (commonWords[text]) {
            return commonWords[text];
        }

        // Handle multi-character combinations first
        text = text.replace(/dh/g, 'th');
        text = text.replace(/gj/g, 'gy');
        text = text.replace(/nj/g, 'ny');
        text = text.replace(/rr/g, 'r');
        text = text.replace(/sh/g, 'sh');
        text = text.replace(/th/g, 'th');
        text = text.replace(/xh/g, 'j');
        text = text.replace(/zh/g, 'zh');
        text = text.replace(/ç/g, 'ch');
        text = text.replace(/q/g, 'ch');
        text = text.replace(/x/g, 'dz');
        text = text.replace(/c/g, 'ts');

        // Handle vowels
        text = text.replace(/ë/g, 'uh');
        text = text.replace(/y/g, 'ee');

        // Handle j as 'y' sound
        text = text.replace(/j/g, 'y');

        // Clean up punctuation
        text = text.replace(/[.,!?;:]/g, '');

        // Split into words and apply basic syllable patterns
        const words = text.split(' ');
        const pronouncedWords = words.map(word => {
            if (word.length <= 3) return word;

            // Simple syllable breaking for common patterns
            word = word.replace(/([aeiou])([bcdfghjklmnpqrstvwxz])([aeiou])/g, '$1-$2$3');
            word = word.replace(/([aeiou])([bcdfghjklmnpqrstvwxz]{2})/g, '$1-$2');

            return word;
        });

        // Capitalize appropriately
        return pronouncedWords.map(word => {
            // Split by hyphens and capitalize each part
            return word.split('-').map(part =>
                part.charAt(0).toUpperCase() + part.slice(1)
            ).join('-');
        }).join(' ');
    }

    /**
     * Get content that needs pronunciation fixes
     */
    async getContentNeedingFixes() {
        console.log('🔍 Finding content with mismatched pronunciation guides...');

        const result = await query(`
            SELECT
                id,
                english_phrase,
                target_phrase,
                pronunciation_guide,
                LENGTH(pronunciation_guide) as guide_length,
                LENGTH(target_phrase) as phrase_length
            FROM lesson_content
            WHERE target_phrase IS NOT NULL
            AND target_phrase != ''
            ORDER BY
                CASE WHEN pronunciation_guide IS NULL THEN 1 ELSE 0 END,
                ABS(LENGTH(pronunciation_guide) - LENGTH(target_phrase)) DESC
        `);

        console.log(`Found ${result.rows.length} content items to check`);
        return result.rows;
    }

    /**
     * Analyze pronunciation guide quality
     */
    analyzePronunciation(item) {
        const issues = [];

        if (!item.pronunciation_guide) {
            issues.push('Missing pronunciation guide');
            return { needsUpdate: true, issues, severity: 'high' };
        }

        const guide = item.pronunciation_guide.toLowerCase();
        const phrase = item.target_phrase.toLowerCase();

        // Check for major length mismatches (indicates wrong content)
        const lengthRatio = item.guide_length / item.phrase_length;
        if (lengthRatio > 2.5 || lengthRatio < 0.4) {
            issues.push('Length mismatch suggests wrong pronunciation');
        }

        // Check for academic/complex terms in pronunciation
        const academicTerms = ['morfologjik', 'analizë', 'hipotez', 'teori', 'metodologji'];
        if (academicTerms.some(term => guide.includes(term))) {
            issues.push('Contains academic terminology');
        }

        // Check if pronunciation is much more complex than the phrase
        const complexPatterns = /\[.*ˈ.*\]|\w+ˈ\w+|[ɛɔʃʒθð]/g;
        if (complexPatterns.test(guide) && item.phrase_length < 30) {
            issues.push('Overly complex phonetic notation for simple phrase');
        }

        const needsUpdate = issues.length > 0;
        const severity = issues.some(i => i.includes('academic') || i.includes('Length mismatch')) ? 'high' : 'medium';

        return { needsUpdate, issues, severity };
    }

    /**
     * Update pronunciation guides for problematic content
     */
    async updatePronunciationGuides(items) {
        console.log('🔧 Updating pronunciation guides...');

        let updatedCount = 0;
        let errorCount = 0;

        for (const item of items) {
            try {
                const analysis = this.analyzePronunciation(item);

                if (analysis.needsUpdate) {
                    const newPronunciation = this.generatePronunciation(item.target_phrase);

                    await query(`
                        UPDATE lesson_content
                        SET pronunciation_guide = $1
                        WHERE id = $2
                    `, [newPronunciation, item.id]);

                    updatedCount++;

                    if (updatedCount <= 5) { // Log first 5 examples
                        console.log(`✅ "${item.target_phrase}" → "${newPronunciation}"`);
                    }
                }
            } catch (error) {
                console.error(`❌ Error updating ${item.id}:`, error.message);
                errorCount++;
            }
        }

        console.log(`\n📊 Update Summary:`);
        console.log(`✅ Updated: ${updatedCount} pronunciation guides`);
        console.log(`❌ Errors: ${errorCount} items`);

        return { updatedCount, errorCount };
    }

    /**
     * Generate quality report
     */
    async generateQualityReport(items) {
        console.log('\n📋 Pronunciation Quality Report:');

        const categories = {
            missing: 0,
            lengthMismatch: 0,
            academic: 0,
            complex: 0,
            good: 0
        };

        const examples = {
            problematic: [],
            fixed: []
        };

        for (const item of items) {
            const analysis = this.analyzePronunciation(item);

            if (!item.pronunciation_guide) {
                categories.missing++;
            } else if (analysis.issues.some(i => i.includes('Length mismatch'))) {
                categories.lengthMismatch++;
                if (examples.problematic.length < 3) {
                    examples.problematic.push({
                        phrase: item.target_phrase,
                        guide: item.pronunciation_guide,
                        issue: 'Length mismatch'
                    });
                }
            } else if (analysis.issues.some(i => i.includes('academic'))) {
                categories.academic++;
                if (examples.problematic.length < 3) {
                    examples.problematic.push({
                        phrase: item.target_phrase,
                        guide: item.pronunciation_guide,
                        issue: 'Academic terminology'
                    });
                }
            } else if (analysis.issues.some(i => i.includes('complex'))) {
                categories.complex++;
            } else {
                categories.good++;
                if (examples.fixed.length < 3) {
                    examples.fixed.push({
                        phrase: item.target_phrase,
                        guide: item.pronunciation_guide
                    });
                }
            }
        }

        console.log(`📊 Categories:`);
        console.log(`   Missing: ${categories.missing}`);
        console.log(`   Length Mismatch: ${categories.lengthMismatch}`);
        console.log(`   Academic Terms: ${categories.academic}`);
        console.log(`   Too Complex: ${categories.complex}`);
        console.log(`   Good Quality: ${categories.good}`);

        if (examples.problematic.length > 0) {
            console.log(`\n❌ Problem Examples:`);
            examples.problematic.forEach((ex, i) => {
                console.log(`   ${i + 1}. "${ex.phrase}" → "${ex.guide}" (${ex.issue})`);
            });
        }

        if (examples.fixed.length > 0) {
            console.log(`\n✅ Good Examples:`);
            examples.fixed.forEach((ex, i) => {
                console.log(`   ${i + 1}. "${ex.phrase}" → "${ex.guide}"`);
            });
        }

        return categories;
    }

    /**
     * Main execution function
     */
    async fixAllPronunciations() {
        console.log('🚀 Starting pronunciation guide repair...\n');

        try {
            // Step 1: Get all content
            const items = await this.getContentNeedingFixes();

            // Step 2: Generate quality report
            await this.generateQualityReport(items);

            // Step 3: Update problematic pronunciations
            const results = await this.updatePronunciationGuides(items);

            console.log('\n🎉 Pronunciation guide repair completed!');
            console.log(`Total items processed: ${items.length}`);
            console.log(`Successfully updated: ${results.updatedCount}`);
            console.log(`Success rate: ${((results.updatedCount / items.length) * 100).toFixed(1)}%`);

        } catch (error) {
            console.error('❌ Error during pronunciation repair:', error);
            throw error;
        }
    }

    /**
     * Test pronunciation generation
     */
    testPronunciation() {
        const testPhrases = [
            'Përshëndetje',
            'Faleminderit',
            'Si jeni?',
            'Unë quhem Maria',
            'Mirëmëngjes',
            'Ju lutem',
            'Kjo është nëna ime',
            'Unë jam pesëmbëdhjetë vjeç'
        ];

        console.log('🧪 Testing pronunciation generation:');
        testPhrases.forEach(phrase => {
            const pronunciation = this.generatePronunciation(phrase);
            console.log(`"${phrase}" → "${pronunciation}"`);
        });
    }
}

/**
 * Main execution
 */
async function main() {
    const command = process.argv[2] || 'fix';
    const fixer = new PronunciationFixer();

    try {
        switch (command) {
            case 'test':
                fixer.testPronunciation();
                break;
            case 'report':
                const items = await fixer.getContentNeedingFixes();
                await fixer.generateQualityReport(items);
                break;
            case 'fix':
                await fixer.fixAllPronunciations();
                break;
            default:
                console.log('Usage: node fix_pronunciation_guides.js [test|report|fix]');
                break;
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = { PronunciationFixer };

// Run if called directly
if (require.main === module) {
    main();
}