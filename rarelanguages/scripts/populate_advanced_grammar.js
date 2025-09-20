#!/usr/bin/env node

/**
 * Advanced Grammar Data Population Script
 * Populates verb conjugations, usage examples, and difficulty notes
 * Part of Priority 2: Grammar Data Population - Phase 3
 */

const { query, transaction } = require('../lib/database');
const fs = require('fs').promises;
const path = require('path');

class AdvancedGrammarPopulator {
  constructor() {
    this.conjugationData = null;
    this.usageExamples = null;
    this.stats = {
      totalProcessed: 0,
      conjugationsAdded: 0,
      usageExamplesAdded: 0,
      difficultyNotesAdded: 0,
      updates: [],
      errors: []
    };
  }

  /**
   * Load Albanian grammar data
   */
  async loadGrammarData() {
    // Create Albanian verb conjugation data
    this.conjugationData = {
      "jam": {
        infinitive: "të jem",
        english: "to be",
        type: "irregular",
        present_tense: {
          first_singular: "unë jam",
          second_singular: "ti je",
          third_singular: "ai/ajo është",
          first_plural: "ne jemi",
          second_plural: "ju jeni",
          third_plural: "ata/ato janë"
        },
        pattern_notes: "Highly irregular verb - memorize forms individually"
      },
      "kam": {
        infinitive: "të kem",
        english: "to have",
        type: "irregular",
        present_tense: {
          first_singular: "unë kam",
          second_singular: "ti ke",
          third_singular: "ai/ajo ka",
          first_plural: "ne kemi",
          second_plural: "ju keni",
          third_plural: "ata/ato kanë"
        },
        pattern_notes: "Auxiliary verb - used to form perfect tenses"
      },
      "flas": {
        infinitive: "të flas",
        english: "to speak",
        type: "regular",
        present_tense: {
          first_singular: "unë flas",
          second_singular: "ti flet",
          third_singular: "ai/ajo flet",
          first_plural: "ne flasim",
          second_plural: "ju flisni",
          third_plural: "ata/ato flasin"
        },
        pattern_notes: "Regular -as verb pattern: drop -as, add endings"
      },
      "mësoj": {
        infinitive: "të mësoj",
        english: "to learn",
        type: "regular",
        present_tense: {
          first_singular: "unë mësoj",
          second_singular: "ti mëson",
          third_singular: "ai/ajo mëson",
          first_plural: "ne mësojmë",
          second_plural: "ju mësoni",
          third_plural: "ata/ato mësojnë"
        },
        pattern_notes: "Regular -oj verb pattern: drop -oj, add endings"
      },
      "shkoj": {
        infinitive: "të shkoj",
        english: "to go",
        type: "irregular",
        present_tense: {
          first_singular: "unë shkoj",
          second_singular: "ti shkon",
          third_singular: "ai/ajo shkon",
          first_plural: "ne shkojmë",
          second_plural: "ju shkoni",
          third_plural: "ata/ato shkojnë"
        },
        pattern_notes: "Irregular verb - note stem changes"
      },
      "vij": {
        infinitive: "të vij",
        english: "to come",
        type: "irregular",
        present_tense: {
          first_singular: "unë vij",
          second_singular: "ti vjen",
          third_singular: "ai/ajo vjen",
          first_plural: "ne vijmë",
          second_plural: "ju vini",
          third_plural: "ata/ato vijnë"
        },
        pattern_notes: "Irregular verb with stem change: vij → vjen"
      },
      "ha": {
        infinitive: "të ha",
        english: "to eat",
        type: "irregular",
        present_tense: {
          first_singular: "unë ha",
          second_singular: "ti ha",
          third_singular: "ai/ajo ha",
          first_plural: "ne hamë",
          second_plural: "ju hani",
          third_plural: "ata/ato hanë"
        },
        pattern_notes: "Irregular monosyllabic verb"
      }
    };

    // Create usage examples database
    this.usageExamples = {
      greetings: [
        { albanian: "Përshëndetje, si jeni?", english: "Hello, how are you?" },
        { albanian: "Mirë, faleminderit.", english: "Fine, thank you." }
      ],
      courtesy: [
        { albanian: "Ju lutem, më ndihmoni.", english: "Please, help me." },
        { albanian: "Faleminderit shumë.", english: "Thank you very much." },
        { albanian: "S'ka përse.", english: "You're welcome." }
      ],
      family_vocab: [
        { albanian: "Kjo është nëna ime.", english: "This is my mother." },
        { albanian: "Ku është vëllai yt?", english: "Where is your brother?" },
        { albanian: "Familja ime është e madhe.", english: "My family is big." }
      ],
      basic_verbs: [
        { albanian: "Unë flas shqip.", english: "I speak Albanian." },
        { albanian: "Ai mëson në shkollë.", english: "He learns at school." },
        { albanian: "Ne shkojmë në shtëpi.", english: "We go home." }
      ],
      numbers: [
        { albanian: "Kam dy vëllezër.", english: "I have two brothers." },
        { albanian: "Janë tre libra.", english: "There are three books." }
      ],
      time_expressions: [
        { albanian: "Sot është një ditë e bukur.", english: "Today is a beautiful day." },
        { albanian: "Nesër do të vijë.", english: "Tomorrow he/she will come." }
      ]
    };

    console.log('📋 Loaded advanced Albanian grammar data');
  }

  /**
   * Main advanced grammar population entry point
   */
  async populateAdvancedGrammar() {
    console.log('🎓 Starting advanced grammar data population...\n');

    try {
      // Step 1: Load grammar data
      await this.loadGrammarData();

      // Step 2: Get content that needs advanced grammar data
      const content = await this.getContentForAdvancedGrammar();
      console.log(`📝 Found ${content.length} items for advanced grammar processing\n`);

      // Step 3: Process each content item
      for (const item of content) {
        await this.processAdvancedGrammarItem(item);
      }

      // Step 4: Apply all updates
      await this.applyAdvancedGrammarUpdates();

      // Step 5: Generate summary report
      await this.generateAdvancedGrammarReport();

      console.log('\n✅ Advanced grammar population completed successfully!');
      return this.stats;

    } catch (error) {
      console.error('❌ Advanced grammar population failed:', error);
      throw error;
    }
  }

  /**
   * Get content items that need advanced grammar data
   */
  async getContentForAdvancedGrammar() {
    const result = await query(`
      SELECT
        lc.id,
        lc.english_phrase,
        lc.target_phrase,
        lc.word_type,
        lc.verb_type,
        lc.grammar_category,
        lc.conjugation_data,
        lc.usage_examples,
        lc.difficulty_notes
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE l.is_active = true
        AND lc.word_type IS NOT NULL
      ORDER BY
        CASE lc.word_type WHEN 'verb' THEN 1 ELSE 2 END,
        lc.id ASC
    `);

    return result.rows;
  }

  /**
   * Process a single content item for advanced grammar data
   */
  async processAdvancedGrammarItem(item) {
    this.stats.totalProcessed++;

    const updates = {
      id: item.id,
      conjugation_data: item.conjugation_data,
      usage_examples: item.usage_examples,
      difficulty_notes: item.difficulty_notes
    };

    let hasUpdates = false;

    // Add conjugation data for verbs
    if (item.word_type === 'verb' && !item.conjugation_data) {
      const conjugationData = this.getConjugationData(item.target_phrase, item.english_phrase);
      if (conjugationData) {
        updates.conjugation_data = conjugationData;
        hasUpdates = true;
        this.stats.conjugationsAdded++;
      }
    }

    // Add usage examples based on grammar category
    if (!item.usage_examples && item.grammar_category) {
      const usageExamples = this.getUsageExamples(item.grammar_category, item.target_phrase);
      if (usageExamples && usageExamples.length > 0) {
        updates.usage_examples = usageExamples;
        hasUpdates = true;
        this.stats.usageExamplesAdded++;
      }
    }

    // Add difficulty notes based on word type and patterns
    if (!item.difficulty_notes) {
      const difficultyNotes = this.getDifficultyNotes(item);
      if (difficultyNotes) {
        updates.difficulty_notes = difficultyNotes;
        hasUpdates = true;
        this.stats.difficultyNotesAdded++;
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
   * Get conjugation data for Albanian verbs
   */
  getConjugationData(albanianPhrase, englishPhrase) {
    const albanian = albanianPhrase.toLowerCase().trim();
    const english = englishPhrase.toLowerCase().trim();

    // Check for exact verb matches
    for (const [verb, data] of Object.entries(this.conjugationData)) {
      if (albanian.includes(verb) || english.includes(data.english.replace('to ', ''))) {
        return data;
      }
    }

    // Check for infinitive patterns
    if (albanian.startsWith('të ')) {
      const verbRoot = albanian.replace('të ', '');

      // Create basic conjugation for regular verbs
      if (verbRoot.endsWith('oj')) {
        const stem = verbRoot.slice(0, -2);
        return {
          infinitive: albanian,
          english: english,
          type: "regular",
          present_tense: {
            first_singular: `unë ${verbRoot}`,
            second_singular: `ti ${stem}on`,
            third_singular: `ai/ajo ${stem}on`,
            first_plural: `ne ${stem}ojmë`,
            second_plural: `ju ${stem}oni`,
            third_plural: `ata/ato ${stem}ojnë`
          },
          pattern_notes: "Regular -oj verb: drop -oj and add present tense endings"
        };
      }

      if (verbRoot.endsWith('as')) {
        const stem = verbRoot.slice(0, -2);
        return {
          infinitive: albanian,
          english: english,
          type: "regular",
          present_tense: {
            first_singular: `unë ${verbRoot}`,
            second_singular: `ti ${stem}et`,
            third_singular: `ai/ajo ${stem}et`,
            first_plural: `ne ${stem}asim`,
            second_plural: `ju ${stem}isni`,
            third_plural: `ata/ato ${stem}asin`
          },
          pattern_notes: "Regular -as verb: drop -as and add present tense endings"
        };
      }
    }

    return null;
  }

  /**
   * Get usage examples for a grammar category
   */
  getUsageExamples(grammarCategory, targetPhrase) {
    const examples = this.usageExamples[grammarCategory];
    if (!examples || examples.length === 0) {
      return null;
    }

    // Return up to 2 relevant examples
    let relevantExamples = examples.slice(0, 2);

    // If the target phrase appears in examples, prioritize those
    const matchingExamples = examples.filter(ex =>
      ex.albanian.toLowerCase().includes(targetPhrase.toLowerCase())
    );

    if (matchingExamples.length > 0) {
      relevantExamples = matchingExamples.slice(0, 2);
    }

    return relevantExamples;
  }

  /**
   * Generate difficulty notes based on content characteristics
   */
  getDifficultyNotes(item) {
    const notes = [];

    // Word type specific notes
    switch (item.word_type) {
      case 'verb':
        if (item.verb_type === 'irregular') {
          notes.push('Irregular verb - memorize individual forms');
        } else if (item.verb_type === 'regular') {
          notes.push('Regular verb - follows standard conjugation pattern');
        }
        if (item.target_phrase.includes('të ')) {
          notes.push('Infinitive form - used with modal verbs');
        }
        break;

      case 'noun':
        if (item.target_phrase.length > 10) {
          notes.push('Long noun - practice pronunciation carefully');
        }
        break;

      case 'adjective':
        notes.push('Remember gender agreement with nouns');
        break;

      case 'phrase':
        if (item.target_phrase.split(' ').length > 3) {
          notes.push('Multi-word phrase - practice as a unit');
        }
        break;
    }

    // Grammar category specific notes
    switch (item.grammar_category) {
      case 'greetings':
        notes.push('Essential for daily conversation');
        break;
      case 'courtesy':
        notes.push('Important for polite interaction');
        break;
      case 'family_vocab':
        notes.push('Basic vocabulary - high frequency usage');
        break;
      case 'numbers':
        notes.push('Foundation for counting and quantities');
        break;
      case 'questions':
        notes.push('Essential for asking for information');
        break;
    }

    // Pronunciation difficulty
    if (item.target_phrase.includes('ë') || item.target_phrase.includes('ç')) {
      notes.push('Contains Albanian-specific letters - practice pronunciation');
    }

    // Return the most relevant note
    return notes.length > 0 ? notes[0] : null;
  }

  /**
   * Apply all advanced grammar updates to the database
   */
  async applyAdvancedGrammarUpdates() {
    if (this.stats.updates.length === 0) {
      console.log('⚠️  No advanced grammar updates to apply');
      return;
    }

    console.log(`\n💾 Applying ${this.stats.updates.length} advanced grammar updates...`);

    const batchSize = 25; // Smaller batches for complex data
    let processed = 0;

    for (let i = 0; i < this.stats.updates.length; i += batchSize) {
      const batch = this.stats.updates.slice(i, i + batchSize);
      const queries = [];

      for (const update of batch) {
        const setParts = [];
        const params = [update.id];
        let paramIndex = 2;

        if (update.conjugation_data) {
          setParts.push(`conjugation_data = $${paramIndex++}`);
          params.push(JSON.stringify(update.conjugation_data));
        }
        if (update.usage_examples) {
          setParts.push(`usage_examples = $${paramIndex++}`);
          params.push(JSON.stringify(update.usage_examples));
        }
        if (update.difficulty_notes) {
          setParts.push(`difficulty_notes = $${paramIndex++}`);
          params.push(update.difficulty_notes);
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
          this.stats.errors.push(`Advanced grammar batch update failed: ${error.message}`);
        }
      }
    }

    console.log(`✅ Advanced grammar updates completed`);
  }

  /**
   * Generate advanced grammar enhancement report
   */
  async generateAdvancedGrammarReport() {
    console.log('\n📊 Generating advanced grammar report...');

    // Verify updates in database
    const verificationResult = await query(`
      SELECT
        COUNT(*) as total_items,
        COUNT(conjugation_data) as has_conjugation_data,
        COUNT(usage_examples) as has_usage_examples,
        COUNT(difficulty_notes) as has_difficulty_notes,
        COUNT(*) FILTER (WHERE word_type = 'verb') as total_verbs,
        COUNT(conjugation_data) FILTER (WHERE word_type = 'verb') as verbs_with_conjugation
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
        conjugation_data_coverage: `${verification.has_conjugation_data}/${verification.total_items} (${(verification.has_conjugation_data / verification.total_items * 100).toFixed(1)}%)`,
        usage_examples_coverage: `${verification.has_usage_examples}/${verification.total_items} (${(verification.has_usage_examples / verification.total_items * 100).toFixed(1)}%)`,
        difficulty_notes_coverage: `${verification.has_difficulty_notes}/${verification.total_items} (${(verification.has_difficulty_notes / verification.total_items * 100).toFixed(1)}%)`,
        verb_conjugation_coverage: `${verification.verbs_with_conjugation}/${verification.total_verbs} (${verification.total_verbs > 0 ? (verification.verbs_with_conjugation / verification.total_verbs * 100).toFixed(1) : 0}%)`
      }
    };

    // Save report
    const reportPath = path.join(__dirname, '..', 'data', 'advanced-grammar-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📈 Advanced Grammar Population Summary:');
    console.log(`   Total processed: ${this.stats.totalProcessed}`);
    console.log(`   Conjugations added: ${this.stats.conjugationsAdded}`);
    console.log(`   Usage examples added: ${this.stats.usageExamplesAdded}`);
    console.log(`   Difficulty notes added: ${this.stats.difficultyNotesAdded}`);
    console.log(`   Errors: ${this.stats.errors.length}`);

    console.log('\n📊 Current Coverage:');
    console.log(`   Conjugation data: ${report.verification.conjugation_data_coverage}`);
    console.log(`   Usage examples: ${report.verification.usage_examples_coverage}`);
    console.log(`   Difficulty notes: ${report.verification.difficulty_notes_coverage}`);
    console.log(`   Verb conjugations: ${report.verification.verb_conjugation_coverage}`);

    console.log(`\n📄 Full report saved to: ${reportPath}`);
  }
}

/**
 * CLI interface
 */
async function main() {
  try {
    const populator = new AdvancedGrammarPopulator();
    const stats = await populator.populateAdvancedGrammar();

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.forEach(error => console.log(`   - ${error}`));
      process.exit(1);
    }

    console.log('\n🎉 Advanced grammar population completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Export for testing and direct usage
module.exports = { AdvancedGrammarPopulator };

// Run if called directly
if (require.main === module) {
  main();
}