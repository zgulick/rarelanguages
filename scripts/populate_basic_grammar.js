#!/usr/bin/env node

/**
 * Basic Grammar Data Population Script
 * Auto-classifies word types and grammar categories using predefined rules
 * Part of Priority 2: Grammar Data Population
 */

const { query, transaction } = require('../lib/database');
const fs = require('fs').promises;
const path = require('path');

class BasicGrammarPopulator {
  constructor() {
    this.rules = null;
    this.stats = {
      totalProcessed: 0,
      wordTypePopulated: 0,
      grammarCategoryPopulated: 0,
      genderPopulated: 0,
      verbTypePopulated: 0,
      updates: [],
      errors: []
    };
  }

  /**
   * Load classification rules
   */
  async loadRules() {
    const rulesPath = path.join(__dirname, '..', 'data', 'grammar_classification_rules.json');
    const rulesContent = await fs.readFile(rulesPath, 'utf8');
    this.rules = JSON.parse(rulesContent);
    console.log(`📋 Loaded classification rules v${this.rules.version}`);
  }

  /**
   * Main population entry point
   */
  async populateBasicGrammar() {
    console.log('🚀 Starting basic grammar data population...\n');

    try {
      // Step 1: Load classification rules
      await this.loadRules();

      // Step 2: Get all lesson content
      const content = await this.getAllContent();
      console.log(`📝 Found ${content.length} content items to process\n`);

      // Step 3: Process each content item
      for (const item of content) {
        await this.processContentItem(item);
      }

      // Step 4: Apply all updates in batches
      await this.applyUpdates();

      // Step 5: Generate summary report
      await this.generateSummaryReport();

      console.log('\n✅ Basic grammar population completed successfully!');
      return this.stats;

    } catch (error) {
      console.error('❌ Grammar population failed:', error);
      throw error;
    }
  }

  /**
   * Get all content items that need grammar data
   */
  async getAllContent() {
    const result = await query(`
      SELECT
        lc.id,
        lc.english_phrase,
        lc.target_phrase,
        lc.pronunciation_guide,
        lc.cultural_context,
        lc.word_type,
        lc.grammar_category,
        lc.gender,
        lc.verb_type
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE l.is_active = true
        AND lc.english_phrase IS NOT NULL
        AND lc.target_phrase IS NOT NULL
      ORDER BY lc.id ASC
    `);

    return result.rows;
  }

  /**
   * Process a single content item and determine grammar data
   */
  async processContentItem(item) {
    this.stats.totalProcessed++;

    const updates = {
      id: item.id,
      word_type: item.word_type,
      grammar_category: item.grammar_category,
      gender: item.gender,
      verb_type: item.verb_type
    };

    let hasUpdates = false;

    // Classify word type if not already set
    if (!item.word_type) {
      const wordType = this.classifyWordType(item.english_phrase, item.target_phrase);
      if (wordType) {
        updates.word_type = wordType;
        hasUpdates = true;
        this.stats.wordTypePopulated++;
      }
    }

    // Classify grammar category if not already set
    if (!item.grammar_category) {
      const grammarCategory = this.classifyGrammarCategory(item.english_phrase, item.target_phrase);
      if (grammarCategory) {
        updates.grammar_category = grammarCategory;
        hasUpdates = true;
        this.stats.grammarCategoryPopulated++;
      }
    }

    // Determine gender for nouns
    if (!item.gender && (updates.word_type === 'noun' || item.word_type === 'noun')) {
      const gender = this.determineGender(item.target_phrase);
      if (gender) {
        updates.gender = gender;
        hasUpdates = true;
        this.stats.genderPopulated++;
      }
    }

    // Classify verb type for verbs
    if (!item.verb_type && (updates.word_type === 'verb' || item.word_type === 'verb')) {
      const verbType = this.classifyVerbType(item.target_phrase);
      if (verbType) {
        updates.verb_type = verbType;
        hasUpdates = true;
        this.stats.verbTypePopulated++;
      }
    }

    // Store updates if any were made
    if (hasUpdates) {
      this.stats.updates.push(updates);
    }

    // Log progress every 50 items
    if (this.stats.totalProcessed % 50 === 0) {
      console.log(`   Processed ${this.stats.totalProcessed} items...`);
    }
  }

  /**
   * Classify word type based on English and Albanian patterns
   */
  classifyWordType(englishPhrase, albanianPhrase) {
    const english = englishPhrase.toLowerCase().trim();
    const albanian = albanianPhrase.toLowerCase().trim();

    // Check each word type against patterns
    for (const [wordType, rules] of Object.entries(this.rules.word_type_rules)) {
      // Check English patterns
      for (const pattern of rules.english_patterns) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(english)) {
          return wordType;
        }
      }

      // Check Albanian patterns
      for (const pattern of rules.albanian_patterns) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(albanian)) {
          return wordType;
        }
      }
    }

    // Default classification based on length and structure
    if (english.length <= 3) {
      return 'pronoun';
    }
    if (english.includes('?')) {
      return 'phrase';
    }
    if (english.split(' ').length > 3) {
      return 'phrase';
    }

    return 'noun'; // Default fallback
  }

  /**
   * Classify grammar category based on content
   */
  classifyGrammarCategory(englishPhrase, albanianPhrase) {
    const english = englishPhrase.toLowerCase().trim();
    const albanian = albanianPhrase.toLowerCase().trim();

    for (const [category, rules] of Object.entries(this.rules.grammar_category_rules)) {
      // Check English keywords
      for (const keyword of rules.english_keywords) {
        if (english.includes(keyword.toLowerCase())) {
          return category;
        }
      }

      // Check Albanian keywords
      for (const keyword of rules.albanian_keywords) {
        if (albanian.includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }

    // Default category based on word type patterns
    if (english.includes('?')) {
      return 'questions';
    }
    if (english.match(/^(hello|hi|good|bye)/i)) {
      return 'greetings';
    }
    if (english.match(/^(thank|please|sorry|excuse)/i)) {
      return 'courtesy';
    }

    return 'general_vocabulary';
  }

  /**
   * Determine gender for Albanian nouns
   */
  determineGender(albanianPhrase) {
    const albanian = albanianPhrase.toLowerCase().trim();

    // Check irregular genders first
    for (const [word, gender] of Object.entries(this.rules.albanian_gender_rules.irregular_genders)) {
      if (albanian.includes(word.toLowerCase())) {
        return gender;
      }
    }

    // Check gender indicators (adjective agreements)
    for (const indicator of this.rules.albanian_gender_rules.masculine_indicators) {
      if (albanian.includes(indicator.toLowerCase())) {
        return 'masculine';
      }
    }

    for (const indicator of this.rules.albanian_gender_rules.feminine_indicators) {
      if (albanian.includes(indicator.toLowerCase())) {
        return 'feminine';
      }
    }

    // Check word endings (less reliable but helpful)
    const words = albanian.split(' ');
    const mainWord = words[words.length - 1]; // Get the main noun

    for (const ending of this.rules.albanian_gender_rules.masculine_endings) {
      if (mainWord.endsWith(ending)) {
        return 'masculine';
      }
    }

    for (const ending of this.rules.albanian_gender_rules.feminine_endings) {
      if (mainWord.endsWith(ending)) {
        return 'feminine';
      }
    }

    return null; // Cannot determine
  }

  /**
   * Classify verb type for Albanian verbs
   */
  classifyVerbType(albanianPhrase) {
    const albanian = albanianPhrase.toLowerCase().trim();

    // Check for regular verbs
    for (const verb of this.rules.verb_classification.regular_verbs) {
      if (albanian.includes(verb)) {
        return 'regular';
      }
    }

    // Check for irregular verbs
    for (const verb of this.rules.verb_classification.irregular_verbs) {
      if (albanian.includes(verb)) {
        return 'irregular';
      }
    }

    // Check for modal verbs
    for (const verb of this.rules.verb_classification.modal_verbs) {
      if (albanian.includes(verb)) {
        return 'modal';
      }
    }

    // Check for auxiliary verbs
    for (const verb of this.rules.verb_classification.auxiliary_verbs) {
      if (albanian.includes(verb)) {
        return 'auxiliary';
      }
    }

    return 'regular'; // Default for verbs
  }

  /**
   * Apply all updates to the database in batches
   */
  async applyUpdates() {
    if (this.stats.updates.length === 0) {
      console.log('⚠️  No updates to apply');
      return;
    }

    console.log(`\n💾 Applying ${this.stats.updates.length} updates to database...`);

    const batchSize = 50;
    let processed = 0;

    for (let i = 0; i < this.stats.updates.length; i += batchSize) {
      const batch = this.stats.updates.slice(i, i + batchSize);
      const queries = [];

      for (const update of batch) {
        const setParts = [];
        const params = [update.id];
        let paramIndex = 2;

        if (update.word_type) {
          setParts.push(`word_type = $${paramIndex++}`);
          params.push(update.word_type);
        }
        if (update.grammar_category) {
          setParts.push(`grammar_category = $${paramIndex++}`);
          params.push(update.grammar_category);
        }
        if (update.gender) {
          setParts.push(`gender = $${paramIndex++}`);
          params.push(update.gender);
        }
        if (update.verb_type) {
          setParts.push(`verb_type = $${paramIndex++}`);
          params.push(update.verb_type);
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
          this.stats.errors.push(`Batch update failed: ${error.message}`);
        }
      }
    }

    console.log(`✅ Database updates completed`);
  }

  /**
   * Generate summary report
   */
  async generateSummaryReport() {
    console.log('\n📊 Generating summary report...');

    // Verify updates in database
    const verificationResult = await query(`
      SELECT
        COUNT(*) as total_items,
        COUNT(word_type) as has_word_type,
        COUNT(grammar_category) as has_grammar_category,
        COUNT(gender) as has_gender,
        COUNT(verb_type) as has_verb_type
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
        word_type_coverage: `${verification.has_word_type}/${verification.total_items} (${(verification.has_word_type / verification.total_items * 100).toFixed(1)}%)`,
        grammar_category_coverage: `${verification.has_grammar_category}/${verification.total_items} (${(verification.has_grammar_category / verification.total_items * 100).toFixed(1)}%)`,
        gender_coverage: `${verification.has_gender}/${verification.total_items} (${(verification.has_gender / verification.total_items * 100).toFixed(1)}%)`,
        verb_type_coverage: `${verification.has_verb_type}/${verification.total_items} (${(verification.has_verb_type / verification.total_items * 100).toFixed(1)}%)`
      }
    };

    // Save report
    const reportPath = path.join(__dirname, '..', 'data', 'basic-grammar-population-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📈 Population Summary:');
    console.log(`   Total processed: ${this.stats.totalProcessed}`);
    console.log(`   Word types populated: ${this.stats.wordTypePopulated}`);
    console.log(`   Grammar categories populated: ${this.stats.grammarCategoryPopulated}`);
    console.log(`   Genders populated: ${this.stats.genderPopulated}`);
    console.log(`   Verb types populated: ${this.stats.verbTypePopulated}`);
    console.log(`   Errors: ${this.stats.errors.length}`);

    console.log('\n📊 Current Coverage:');
    console.log(`   Word type: ${report.verification.word_type_coverage}`);
    console.log(`   Grammar category: ${report.verification.grammar_category_coverage}`);
    console.log(`   Gender: ${report.verification.gender_coverage}`);
    console.log(`   Verb type: ${report.verification.verb_type_coverage}`);

    console.log(`\n📄 Full report saved to: ${reportPath}`);
  }
}

/**
 * CLI interface
 */
async function main() {
  try {
    const populator = new BasicGrammarPopulator();
    const stats = await populator.populateBasicGrammar();

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.forEach(error => console.log(`   - ${error}`));
      process.exit(1);
    }

    console.log('\n🎉 Basic grammar population completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Export for testing and direct usage
module.exports = { BasicGrammarPopulator };

// Run if called directly
if (require.main === module) {
  main();
}