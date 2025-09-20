#!/usr/bin/env node

/**
 * Pronunciation Enhancement Script
 * Converts existing pronunciation guides to stress patterns and fills gaps
 * Part of Priority 2: Grammar Data Population - Phase 2
 */

const { query, transaction } = require('../lib/database');
const fs = require('fs').promises;
const path = require('path');

class PronunciationEnhancer {
  constructor() {
    this.stressPatterns = null;
    this.stats = {
      totalProcessed: 0,
      stressPatternsCreated: 0,
      pronunciationFixed: 0,
      pronunciationGenerated: 0,
      updates: [],
      errors: []
    };
  }

  /**
   * Load Albanian stress pattern rules
   */
  async loadStressPatterns() {
    // Create stress pattern rules if they don't exist
    const stressPatternRules = {
      version: "1.0.0",
      description: "Albanian stress pattern rules and conversion guidelines",
      default_stress: "penultimate", // Second to last syllable
      patterns: {
        vowel_combinations: {
          "ë": ["uh", "e"],
          "ç": ["ch"],
          "xh": ["j", "zh"],
          "gj": ["gy"],
          "nj": ["ny"],
          "rr": ["r"],
          "ll": ["l"],
          "th": ["th"],
          "sh": ["sh"],
          "zh": ["zh"],
          "dh": ["dh"]
        },
        stress_rules: {
          monosyllabic: "stress_only_syllable",
          disyllabic: "stress_first_syllable",
          polysyllabic: "stress_penultimate"
        },
        common_patterns: {
          "tion": "TION",
          "sion": "SION",
          "ë": "uh",
          "përshëndetje": "per-SHUHN-det-yeh",
          "faleminderit": "fah-leh-meen-DEH-reet",
          "mirupafshim": "mee-roo-PAHF-sheem"
        }
      }
    };

    this.stressPatterns = stressPatternRules;
    console.log('📋 Loaded Albanian stress pattern rules');
  }

  /**
   * Main enhancement entry point
   */
  async enhancePronunciation() {
    console.log('🔊 Starting pronunciation enhancement...\n');

    try {
      // Step 1: Load stress pattern rules
      await this.loadStressPatterns();

      // Step 2: Get all content with pronunciation needs
      const content = await this.getContentForPronunciation();
      console.log(`📝 Found ${content.length} items for pronunciation enhancement\n`);

      // Step 3: Process each content item
      for (const item of content) {
        await this.processContentItemPronunciation(item);
      }

      // Step 4: Apply all updates
      await this.applyPronunciationUpdates();

      // Step 5: Generate summary report
      await this.generatePronunciationReport();

      console.log('\n✅ Pronunciation enhancement completed successfully!');
      return this.stats;

    } catch (error) {
      console.error('❌ Pronunciation enhancement failed:', error);
      throw error;
    }
  }

  /**
   * Get content items that need pronunciation work
   */
  async getContentForPronunciation() {
    const result = await query(`
      SELECT
        lc.id,
        lc.english_phrase,
        lc.target_phrase,
        lc.pronunciation_guide,
        lc.stress_pattern
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE l.is_active = true
        AND lc.target_phrase IS NOT NULL
        AND lc.target_phrase != ''
      ORDER BY
        CASE WHEN lc.pronunciation_guide IS NOT NULL THEN 1 ELSE 2 END,
        lc.id ASC
    `);

    return result.rows;
  }

  /**
   * Process a single content item for pronunciation enhancement
   */
  async processContentItemPronunciation(item) {
    this.stats.totalProcessed++;

    const updates = {
      id: item.id,
      stress_pattern: item.stress_pattern,
      pronunciation_guide: item.pronunciation_guide
    };

    let hasUpdates = false;

    // Convert existing pronunciation guide to stress pattern
    if (item.pronunciation_guide && !item.stress_pattern) {
      const stressPattern = this.convertToStressPattern(item.pronunciation_guide, item.target_phrase);
      if (stressPattern) {
        updates.stress_pattern = stressPattern;
        hasUpdates = true;
        this.stats.stressPatternsCreated++;
      }
    }

    // Fix/improve existing pronunciation guide
    if (item.pronunciation_guide) {
      const improvedPronunciation = this.improvePronunciationGuide(item.pronunciation_guide, item.target_phrase);
      if (improvedPronunciation && improvedPronunciation !== item.pronunciation_guide) {
        updates.pronunciation_guide = improvedPronunciation;
        hasUpdates = true;
        this.stats.pronunciationFixed++;
      }
    }

    // Generate pronunciation guide if missing
    if (!item.pronunciation_guide) {
      const generatedPronunciation = this.generatePronunciationGuide(item.target_phrase);
      if (generatedPronunciation) {
        updates.pronunciation_guide = generatedPronunciation;

        // Also create stress pattern for new pronunciation
        const stressPattern = this.convertToStressPattern(generatedPronunciation, item.target_phrase);
        if (stressPattern) {
          updates.stress_pattern = stressPattern;
        }

        hasUpdates = true;
        this.stats.pronunciationGenerated++;
        if (stressPattern) {
          this.stats.stressPatternsCreated++;
        }
      }
    }

    // Store updates if any were made
    if (hasUpdates) {
      this.stats.updates.push(updates);
    }

    // Log progress
    if (this.stats.totalProcessed % 25 === 0) {
      console.log(`   Processed ${this.stats.totalProcessed} items...`);
    }
  }

  /**
   * Convert pronunciation guide to stress pattern with CAPS for stressed syllables
   */
  convertToStressPattern(pronunciationGuide, albanianText) {
    if (!pronunciationGuide || pronunciationGuide.length === 0) {
      return null;
    }

    let stressPattern = pronunciationGuide.toLowerCase();

    // Handle common Albanian pronunciation patterns
    const conversions = {
      // Vowel combinations
      'uh': 'uh',
      'ee': 'ee',
      'ah': 'ah',
      'oh': 'oh',
      'oo': 'oo',

      // Consonant combinations
      'ch': 'ch',
      'sh': 'sh',
      'zh': 'zh',
      'th': 'th',
      'dh': 'dh',
      'rr': 'r',
      'll': 'l',

      // Common stress patterns
      'per-shuhn-det-yeh': 'per-SHUHN-det-yeh',
      'fah-leh-meen-deh-reet': 'fah-leh-meen-DEH-reet',
      'mee-roo-pahf-sheem': 'mee-roo-PAHF-sheem'
    };

    // Apply known conversions
    for (const [from, to] of Object.entries(conversions)) {
      if (stressPattern.includes(from)) {
        stressPattern = stressPattern.replace(new RegExp(from, 'g'), to);
      }
    }

    // Apply stress rules based on syllable count
    const syllables = stressPattern.split('-');

    if (syllables.length === 1) {
      // Monosyllabic - stress the only syllable
      stressPattern = syllables[0].toUpperCase();
    } else if (syllables.length === 2) {
      // Disyllabic - stress first syllable (common in Albanian)
      syllables[0] = syllables[0].toUpperCase();
      stressPattern = syllables.join('-');
    } else if (syllables.length >= 3) {
      // Polysyllabic - stress penultimate (second to last) syllable
      syllables[syllables.length - 2] = syllables[syllables.length - 2].toUpperCase();
      stressPattern = syllables.join('-');
    }

    return stressPattern;
  }

  /**
   * Improve existing pronunciation guide
   */
  improvePronunciationGuide(currentPronunciation, albanianText) {
    if (!currentPronunciation) {
      return null;
    }

    let improved = currentPronunciation.trim();

    // Standardize format
    improved = improved.toLowerCase();

    // Fix common issues with regex patterns
    const regexFixes = [
      { pattern: /\s+/g, replacement: '-' },
      { pattern: /[,;]/g, replacement: '-' },
      { pattern: /--+/g, replacement: '-' },
      { pattern: /^-+|-+$/g, replacement: '' }
    ];

    // Apply regex fixes
    for (const fix of regexFixes) {
      improved = improved.replace(fix.pattern, fix.replacement);
    }

    // Albanian specific corrections
    const wordFixes = {
      'përshëndetje': 'per-shuhn-det-yeh',
      'faleminderit': 'fah-leh-meen-deh-reet',
      'mirupafshim': 'mee-roo-pahf-sheem',
      'si jeni': 'see yeh-nee',
      'unë quhem': 'oo-nuh choo-hem',
      'ju lutem': 'yoo loo-tem'
    };

    for (const [pattern, replacement] of Object.entries(wordFixes)) {
      improved = improved.replace(new RegExp(pattern, 'gi'), replacement);
    }

    // Ensure it's different enough to warrant an update
    if (improved === currentPronunciation || improved.length < 2) {
      return null;
    }

    return improved;
  }

  /**
   * Generate pronunciation guide for Albanian text
   */
  generatePronunciationGuide(albanianText) {
    if (!albanianText || albanianText.length === 0) {
      return null;
    }

    const text = albanianText.toLowerCase().trim();

    // Handle common Albanian words with known pronunciations
    const knownPronunciations = {
      'përshëndetje': 'per-shuhn-det-yeh',
      'faleminderit': 'fah-leh-meen-deh-reet',
      'mirupafshim': 'mee-roo-pahf-sheem',
      'si jeni': 'see yeh-nee',
      'si je': 'see yeh',
      'unë quhem': 'oo-nuh choo-hem',
      'ju lutem': 'yoo loo-tem',
      'më falni': 'muh fahl-nee',
      'po': 'poh',
      'jo': 'yoh',
      'po faleminderit': 'poh fah-leh-meen-deh-reet',
      's\'ka përse': 'skah per-seh',
      'nuk kuptoj': 'nook koop-toy',
      'nënë': 'nuh-nuh',
      'atë': 'ah-tuh',
      'vëlla': 'vuh-lah',
      'motër': 'moh-tur',
      'familje': 'fah-meel-yeh',
      'një': 'nyuh',
      'dy': 'dee',
      'tre': 'treh',
      'katër': 'kah-tur',
      'pesë': 'peh-suh',
      'gjashtë': 'gyahsh-tuh',
      'shtatë': 'shtah-tuh',
      'tetë': 'teh-tuh',
      'nëntë': 'nun-tuh',
      'dhjetë': 'dhy-eh-tuh'
    };

    // Check for exact matches first
    if (knownPronunciations[text]) {
      return knownPronunciations[text];
    }

    // Basic phonetic conversion for unknown words
    let pronunciation = text;

    // Albanian letter combinations to phonetic equivalents
    const phonetics = {
      'ë': 'uh',
      'ç': 'ch',
      'xh': 'zh',
      'gj': 'gy',
      'nj': 'ny',
      'rr': 'r',
      'll': 'l',
      'th': 'th',
      'sh': 'sh',
      'zh': 'zh',
      'dh': 'dh',
      'q': 'ch',
      'y': 'ee',
      'j': 'y'
    };

    // Apply phonetic conversions
    for (const [albanian, phonetic] of Object.entries(phonetics)) {
      pronunciation = pronunciation.replace(new RegExp(albanian, 'g'), phonetic);
    }

    // Create syllable breaks (basic heuristic)
    pronunciation = pronunciation.replace(/([aeiouuhahoheeoo])([bcdfghjklmnpqrstvwxz])/g, '$1-$2');

    // Clean up
    pronunciation = pronunciation.replace(/--+/g, '-').replace(/^-+|-+$/g, '');

    return pronunciation || null;
  }

  /**
   * Apply all pronunciation updates to the database
   */
  async applyPronunciationUpdates() {
    if (this.stats.updates.length === 0) {
      console.log('⚠️  No pronunciation updates to apply');
      return;
    }

    console.log(`\n💾 Applying ${this.stats.updates.length} pronunciation updates...`);

    const batchSize = 50;
    let processed = 0;

    for (let i = 0; i < this.stats.updates.length; i += batchSize) {
      const batch = this.stats.updates.slice(i, i + batchSize);
      const queries = [];

      for (const update of batch) {
        const setParts = [];
        const params = [update.id];
        let paramIndex = 2;

        if (update.stress_pattern) {
          setParts.push(`stress_pattern = $${paramIndex++}`);
          params.push(update.stress_pattern);
        }
        if (update.pronunciation_guide) {
          setParts.push(`pronunciation_guide = $${paramIndex++}`);
          params.push(update.pronunciation_guide);
        }

        if (setParts.length > 0) {
          queries.push({
            text: `UPDATE lesson_content SET ${setParts.join(', ')} WHERE id = $1`,
            params: params
          });
        }
      }

      if (queries.length > 0) {
        try {
          await transaction(queries);
          processed += batch.length;
          console.log(`   Updated ${processed}/${this.stats.updates.length} items...`);
        } catch (error) {
          console.error(`   ❌ Batch update failed:`, error.message);
          this.stats.errors.push(`Pronunciation batch update failed: ${error.message}`);
        }
      }
    }

    console.log(`✅ Pronunciation updates completed`);
  }

  /**
   * Generate pronunciation enhancement report
   */
  async generatePronunciationReport() {
    console.log('\n📊 Generating pronunciation report...');

    // Verify updates in database
    const verificationResult = await query(`
      SELECT
        COUNT(*) as total_items,
        COUNT(pronunciation_guide) as has_pronunciation,
        COUNT(stress_pattern) as has_stress_pattern,
        AVG(LENGTH(pronunciation_guide)) as avg_pronunciation_length,
        AVG(LENGTH(stress_pattern)) as avg_stress_length
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE l.is_active = true
    `);

    const verification = verificationResult.rows[0];

    const report = {
      timestamp: new Date().toISOString(),
      processing_stats: this.stats,
      verification: {
        total_items: parseInt(verification.total_items),
        pronunciation_coverage: `${verification.has_pronunciation}/${verification.total_items} (${(verification.has_pronunciation / verification.total_items * 100).toFixed(1)}%)`,
        stress_pattern_coverage: `${verification.has_stress_pattern}/${verification.total_items} (${(verification.has_stress_pattern / verification.total_items * 100).toFixed(1)}%)`,
        avg_pronunciation_length: parseFloat(verification.avg_pronunciation_length || 0),
        avg_stress_length: parseFloat(verification.avg_stress_length || 0)
      }
    };

    // Save report
    const reportPath = path.join(__dirname, '..', 'data', 'pronunciation-enhancement-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📈 Pronunciation Enhancement Summary:');
    console.log(`   Total processed: ${this.stats.totalProcessed}`);
    console.log(`   Stress patterns created: ${this.stats.stressPatternsCreated}`);
    console.log(`   Pronunciations fixed: ${this.stats.pronunciationFixed}`);
    console.log(`   Pronunciations generated: ${this.stats.pronunciationGenerated}`);
    console.log(`   Errors: ${this.stats.errors.length}`);

    console.log('\n📊 Current Coverage:');
    console.log(`   Pronunciation: ${report.verification.pronunciation_coverage}`);
    console.log(`   Stress patterns: ${report.verification.stress_pattern_coverage}`);

    console.log(`\n📄 Full report saved to: ${reportPath}`);
  }
}

/**
 * CLI interface
 */
async function main() {
  try {
    const enhancer = new PronunciationEnhancer();
    const stats = await enhancer.enhancePronunciation();

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.forEach(error => console.log(`   - ${error}`));
      process.exit(1);
    }

    console.log('\n🎉 Pronunciation enhancement completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Export for testing and direct usage
module.exports = { PronunciationEnhancer };

// Run if called directly
if (require.main === module) {
  main();
}