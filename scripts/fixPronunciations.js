#!/usr/bin/env node

require('dotenv').config();
const { OpenAIClient } = require('../lib/openai');
const db = require('../lib/database');

/**
 * Fix Pronunciations Script
 * Converts complex phonetic pronunciations to simple, English-readable ones
 */

class PronunciationFixer {
    constructor() {
        this.openaiClient = new OpenAIClient();
        this.totalCost = 0;
    }

    async fixAllPronunciations() {
        console.log('🔧 Fixing all pronunciations to be readable by normal humans...');

        try {
            // Get all vocabulary with complex pronunciations
            const result = await db.query(`
                SELECT id, albanian_term, english_term, pronunciation
                FROM lesson_vocabulary 
                WHERE pronunciation IS NOT NULL 
                AND pronunciation LIKE '%[%'
                ORDER BY albanian_term
            `);

            console.log(`📝 Found ${result.rows.length} vocabulary items with complex pronunciations`);

            const batchSize = 10;
            const batches = [];
            for (let i = 0; i < result.rows.length; i += batchSize) {
                batches.push(result.rows.slice(i, i + batchSize));
            }

            let fixedCount = 0;
            for (let i = 0; i < batches.length; i++) {
                console.log(`⚡ Processing batch ${i + 1}/${batches.length}...`);
                
                const batchWords = batches[i];
                const simplePronunciations = await this.generateSimplePronunciations(batchWords);
                
                // Update database
                for (let j = 0; j < batchWords.length; j++) {
                    const word = batchWords[j];
                    const newPronunciation = simplePronunciations[j];
                    
                    if (newPronunciation) {
                        await db.query(`
                            UPDATE lesson_vocabulary 
                            SET pronunciation = $1 
                            WHERE id = $2
                        `, [newPronunciation, word.id]);
                        
                        console.log(`✅ ${word.albanian_term}: ${word.pronunciation} → ${newPronunciation}`);
                        fixedCount++;
                    }
                }
                
                // Brief pause between batches
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log(`\n🎉 Fixed ${fixedCount} pronunciations!`);
            console.log(`💰 Total cost: $${this.totalCost.toFixed(3)}`);

        } catch (error) {
            console.error('❌ Failed to fix pronunciations:', error);
            throw error;
        }
    }

    async generateSimplePronunciations(words) {
        const prompt = `Convert these Albanian pronunciations to simple, intuitive English-readable format that normal people can understand and use.

CURRENT COMPLEX PRONUNCIATIONS:
${words.map(w => `${w.albanian_term} (${w.english_term}): ${w.pronunciation}`).join('\n')}

RULES FOR SIMPLE PRONUNCIATIONS:
1. Use only regular English letters and common sounds
2. Use hyphens to separate syllables: "bah-bye"
3. Use capital letters for stressed syllables: "bah-BYE"
4. Use familiar English sound patterns:
   - "ah" for the 'a' sound in "father"
   - "ay" for the 'a' sound in "day"
   - "ee" for the 'i' sound in "see"
   - "oo" for the 'u' sound in "moon"
   - "oh" for the 'o' sound in "phone"
   - "uh" for unstressed vowels
5. For consonants, use intuitive English combinations:
   - "j" sound = just write "j"
   - "sh" sound = write "sh"
   - "ch" sound = write "ch"
   - "th" sound = write "th"
6. Make it so someone could read it out loud and sound reasonably close

EXAMPLES:
- gjysh (grandfather) should be "JEESH" not [ɟyʃ]
- babai (father) should be "bah-BYE" not [baˈbai]
- nëna (mother) should be "NUH-nah" not [ˈnəna]

Return ONLY the simple pronunciations, one per line, in the same order:`;

        try {
            console.log('🤖 Generating simple pronunciations...');
            const response = await this.openaiClient.makeRequest([
                { 
                    role: 'system', 
                    content: 'You are an expert in making foreign language pronunciations accessible to English speakers. Create simple, readable pronunciation guides using only familiar English letters and sounds.' 
                },
                { role: 'user', content: prompt }
            ], 'pronunciation-simplification');

            this.totalCost += 0.02; // Approximate cost

            // Parse response into array
            const pronunciations = response.content.trim().split('\n').map(p => p.trim());
            
            if (pronunciations.length !== words.length) {
                console.warn(`⚠️ Expected ${words.length} pronunciations, got ${pronunciations.length}`);
            }

            return pronunciations;

        } catch (error) {
            console.error('❌ Failed to generate simple pronunciations:', error);
            return words.map(() => null); // Return nulls on error
        }
    }

    async testSingleWord(albanianWord, complexPronunciation) {
        console.log(`🧪 Testing pronunciation fix for: ${albanianWord}`);
        
        const result = await this.generateSimplePronunciations([{
            albanian_term: albanianWord,
            english_term: 'test',
            pronunciation: complexPronunciation
        }]);

        console.log(`📝 ${albanianWord}: ${complexPronunciation} → ${result[0]}`);
        return result[0];
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
🔧 Pronunciation Fixer

Converts complex phonetic pronunciations like [ɟyʃ] to simple English-readable ones like "JEESH"

Usage:
  node scripts/fixPronunciations.js --fix-all
  node scripts/fixPronunciations.js --test "gjysh" "[ɟyʃ]"

Options:
  --fix-all                Fix all pronunciations in database
  --test <word> <pron>     Test pronunciation fix for single word
        `);
        process.exit(0);
    }

    try {
        const fixer = new PronunciationFixer();
        
        if (args.includes('--fix-all')) {
            await fixer.fixAllPronunciations();
            return;
        }
        
        const testIndex = args.indexOf('--test');
        if (testIndex !== -1 && testIndex + 2 < args.length) {
            const word = args[testIndex + 1];
            const pronunciation = args[testIndex + 2];
            await fixer.testSingleWord(word, pronunciation);
            return;
        }
        
        console.error('❌ Please provide a valid option');
        process.exit(1);
        
    } catch (error) {
        console.error('❌ Fix failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { PronunciationFixer };