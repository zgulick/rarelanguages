#!/usr/bin/env node

/**
 * Lesson Content Analysis Script
 * Analyzes existing lesson content to identify patterns for grammar classification
 * Part of Priority 2: Grammar Data Population
 */

const { query } = require('../lib/database');
const fs = require('fs').promises;
const path = require('path');

class ContentAnalyzer {
  constructor() {
    this.analysis = {
      totalContent: 0,
      grammarFieldsStatus: {},
      contentPatterns: {},
      englishPhraseCategories: {},
      targetPhrasePatterns: {},
      pronunciationCoverage: {},
      recommendations: []
    };
  }

  /**
   * Main analysis entry point
   */
  async analyzeContent() {
    console.log('🔍 Starting lesson content analysis...\n');

    try {
      // Step 1: Get overview statistics
      await this.getOverviewStats();

      // Step 2: Analyze grammar fields status
      await this.analyzeGrammarFields();

      // Step 3: Analyze content patterns
      await this.analyzeContentPatterns();

      // Step 4: Analyze English phrase categories
      await this.analyzeEnglishPhrases();

      // Step 5: Analyze Albanian patterns
      await this.analyzeTargetPhrases();

      // Step 6: Analyze pronunciation coverage
      await this.analyzePronunciation();

      // Step 7: Generate recommendations
      await this.generateRecommendations();

      // Step 8: Save analysis report
      await this.saveAnalysisReport();

      console.log('\n📊 Analysis complete! See analysis-report.json for details.');
      return this.analysis;

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Get basic overview statistics
   */
  async getOverviewStats() {
    console.log('📈 Gathering overview statistics...');

    const result = await query(`
      SELECT
        COUNT(*) as total_content,
        COUNT(DISTINCT lc.lesson_id) as total_lessons,
        COUNT(DISTINCT l.skill_id) as total_skills,
        AVG(LENGTH(lc.english_phrase)) as avg_english_length,
        AVG(LENGTH(lc.target_phrase)) as avg_target_length
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE l.is_active = true
    `);

    this.analysis.totalContent = parseInt(result.rows[0].total_content);
    this.analysis.totalLessons = parseInt(result.rows[0].total_lessons);
    this.analysis.totalSkills = parseInt(result.rows[0].total_skills);
    this.analysis.avgEnglishLength = parseFloat(result.rows[0].avg_english_length);
    this.analysis.avgTargetLength = parseFloat(result.rows[0].avg_target_length);

    console.log(`   📝 Total content items: ${this.analysis.totalContent}`);
    console.log(`   📚 Total lessons: ${this.analysis.totalLessons}`);
    console.log(`   🎯 Total skills: ${this.analysis.totalSkills}`);
  }

  /**
   * Analyze current status of grammar fields
   */
  async analyzeGrammarFields() {
    console.log('\n🏗️  Analyzing grammar fields status...');

    const grammarFields = [
      'word_type', 'verb_type', 'gender', 'stress_pattern',
      'conjugation_data', 'grammar_category', 'difficulty_notes', 'usage_examples'
    ];

    for (const field of grammarFields) {
      const result = await query(`
        SELECT
          COUNT(*) as total,
          COUNT(${field}) as populated,
          COUNT(*) - COUNT(${field}) as empty
        FROM lesson_content lc
        JOIN lessons l ON lc.lesson_id = l.id
        WHERE l.is_active = true
      `);

      const stats = result.rows[0];
      const populatedPercentage = (parseInt(stats.populated) / parseInt(stats.total) * 100).toFixed(1);

      this.analysis.grammarFieldsStatus[field] = {
        total: parseInt(stats.total),
        populated: parseInt(stats.populated),
        empty: parseInt(stats.empty),
        percentage: parseFloat(populatedPercentage)
      };

      console.log(`   ${field}: ${stats.populated}/${stats.total} (${populatedPercentage}%)`);
    }
  }

  /**
   * Analyze content patterns for auto-classification
   */
  async analyzeContentPatterns() {
    console.log('\n🔤 Analyzing content patterns...');

    // Analyze common English phrase patterns
    const patterns = [
      { name: 'greetings', pattern: '^(hello|hi|good morning|good evening|goodbye|bye)' },
      { name: 'family', pattern: '(mother|father|brother|sister|family|parent|child)' },
      { name: 'numbers', pattern: '^(one|two|three|four|five|six|seven|eight|nine|ten|\\d+)' },
      { name: 'questions', pattern: '(how are you|what is|where is|when|why|who)' },
      { name: 'verbs', pattern: '^(to |I |you |he |she |we |they ).*(run|walk|eat|drink|speak|learn)' },
      { name: 'adjectives', pattern: '^(big|small|good|bad|beautiful|ugly|hot|cold|new|old)$' },
      { name: 'courtesy', pattern: '(please|thank you|excuse me|sorry|pardon)' }
    ];

    for (const pattern of patterns) {
      const result = await query(`
        SELECT COUNT(*) as count
        FROM lesson_content lc
        JOIN lessons l ON lc.lesson_id = l.id
        WHERE l.is_active = true
          AND lc.english_phrase ~* $1
      `, [pattern.pattern]);

      this.analysis.contentPatterns[pattern.name] = parseInt(result.rows[0].count);
      console.log(`   ${pattern.name}: ${result.rows[0].count} matches`);
    }
  }

  /**
   * Analyze English phrases for categorization
   */
  async analyzeEnglishPhrases() {
    console.log('\n🏷️  Analyzing English phrase categories...');

    const result = await query(`
      SELECT
        lc.english_phrase,
        COUNT(*) as frequency,
        LENGTH(lc.english_phrase) as phrase_length,
        CASE
          WHEN lc.english_phrase ~* '^(hello|hi|good morning|good evening|goodbye|bye)' THEN 'greeting'
          WHEN lc.english_phrase ~* '(mother|father|brother|sister|family|parent|child)' THEN 'family'
          WHEN lc.english_phrase ~* '^(one|two|three|four|five|six|seven|eight|nine|ten|\\d+)' THEN 'number'
          WHEN lc.english_phrase ~* '\\?' THEN 'question'
          WHEN lc.english_phrase ~* '^to ' THEN 'infinitive_verb'
          WHEN lc.english_phrase ~* '^(please|thank you|excuse me|sorry|pardon)' THEN 'courtesy'
          WHEN lc.english_phrase ~* '^(I|you|he|she|we|they) ' THEN 'sentence'
          WHEN lc.english_phrase ~* '^(the|a|an) ' THEN 'noun_phrase'
          ELSE 'other'
        END as suggested_category
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE l.is_active = true
      GROUP BY lc.english_phrase
      ORDER BY frequency DESC, phrase_length ASC
      LIMIT 100
    `);

    // Group by suggested categories
    const categories = {};
    result.rows.forEach(row => {
      const category = row.suggested_category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push({
        phrase: row.english_phrase,
        frequency: parseInt(row.frequency),
        length: parseInt(row.phrase_length)
      });
    });

    this.analysis.englishPhraseCategories = categories;

    Object.keys(categories).forEach(category => {
      console.log(`   ${category}: ${categories[category].length} unique phrases`);
    });
  }

  /**
   * Analyze Albanian target phrases for patterns
   */
  async analyzeTargetPhrases() {
    console.log('\n🇦🇱 Analyzing Albanian target phrase patterns...');

    const result = await query(`
      SELECT
        lc.target_phrase,
        lc.english_phrase,
        LENGTH(lc.target_phrase) as phrase_length,
        CASE
          WHEN lc.target_phrase ~* 'ë$' THEN 'ends_with_e'
          WHEN lc.target_phrase ~* 'i$' THEN 'ends_with_i'
          WHEN lc.target_phrase ~* 'a$' THEN 'ends_with_a'
          WHEN lc.target_phrase ~* 'të ' THEN 'has_te_particle'
          WHEN lc.target_phrase ~* '^[A-Z]' THEN 'capitalized'
          ELSE 'other'
        END as pattern_type
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE l.is_active = true
        AND lc.target_phrase IS NOT NULL
        AND lc.target_phrase != ''
      ORDER BY phrase_length DESC
      LIMIT 50
    `);

    const patterns = {};
    result.rows.forEach(row => {
      const pattern = row.pattern_type;
      if (!patterns[pattern]) {
        patterns[pattern] = [];
      }
      patterns[pattern].push({
        albanian: row.target_phrase,
        english: row.english_phrase,
        length: parseInt(row.phrase_length)
      });
    });

    this.analysis.targetPhrasePatterns = patterns;

    Object.keys(patterns).forEach(pattern => {
      console.log(`   ${pattern}: ${patterns[pattern].length} examples`);
    });
  }

  /**
   * Analyze pronunciation coverage and quality
   */
  async analyzePronunciation() {
    console.log('\n🔊 Analyzing pronunciation coverage...');

    const result = await query(`
      SELECT
        COUNT(*) as total_items,
        COUNT(pronunciation_guide) as has_pronunciation,
        COUNT(stress_pattern) as has_stress_pattern,
        AVG(LENGTH(pronunciation_guide)) as avg_pronunciation_length
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE l.is_active = true
    `);

    const stats = result.rows[0];
    const pronunciationPercentage = (parseInt(stats.has_pronunciation) / parseInt(stats.total_items) * 100).toFixed(1);
    const stressPatternPercentage = (parseInt(stats.has_stress_pattern) / parseInt(stats.total_items) * 100).toFixed(1);

    this.analysis.pronunciationCoverage = {
      totalItems: parseInt(stats.total_items),
      hasPronunciation: parseInt(stats.has_pronunciation),
      hasStressPattern: parseInt(stats.has_stress_pattern),
      pronunciationPercentage: parseFloat(pronunciationPercentage),
      stressPatternPercentage: parseFloat(stressPatternPercentage),
      avgPronunciationLength: parseFloat(stats.avg_pronunciation_length || 0)
    };

    console.log(`   Pronunciation guides: ${stats.has_pronunciation}/${stats.total_items} (${pronunciationPercentage}%)`);
    console.log(`   Stress patterns: ${stats.has_stress_pattern}/${stats.total_items} (${stressPatternPercentage}%)`);
  }

  /**
   * Generate actionable recommendations
   */
  async generateRecommendations() {
    console.log('\n💡 Generating recommendations...');

    const recommendations = [];

    // Grammar field recommendations
    Object.keys(this.analysis.grammarFieldsStatus).forEach(field => {
      const stats = this.analysis.grammarFieldsStatus[field];
      if (stats.percentage < 10) {
        recommendations.push({
          priority: 'high',
          category: 'grammar_fields',
          field: field,
          message: `${field} is only ${stats.percentage}% populated (${stats.populated}/${stats.total}). Should be prioritized for population.`,
          estimatedWork: stats.empty < 50 ? 'low' : stats.empty < 200 ? 'medium' : 'high'
        });
      }
    });

    // Content pattern recommendations
    const categoryCount = Object.keys(this.analysis.englishPhraseCategories).length;
    recommendations.push({
      priority: 'medium',
      category: 'content_classification',
      message: `Found ${categoryCount} distinct content categories. Auto-classification can populate grammar_category field efficiently.`,
      estimatedWork: 'medium'
    });

    // Pronunciation recommendations
    if (this.analysis.pronunciationCoverage.pronunciationPercentage > 80 &&
        this.analysis.pronunciationCoverage.stressPatternPercentage < 20) {
      recommendations.push({
        priority: 'high',
        category: 'pronunciation',
        message: `Good pronunciation coverage (${this.analysis.pronunciationCoverage.pronunciationPercentage}%) but stress patterns need work (${this.analysis.pronunciationCoverage.stressPatternPercentage}%). Convert existing pronunciations to stress patterns.`,
        estimatedWork: 'low'
      });
    }

    this.analysis.recommendations = recommendations;

    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
    });
  }

  /**
   * Save comprehensive analysis report
   */
  async saveAnalysisReport() {
    const reportPath = path.join(__dirname, '..', 'data', 'analysis-report.json');

    // Ensure data directory exists
    await fs.mkdir(path.dirname(reportPath), { recursive: true });

    const report = {
      ...this.analysis,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Analysis report saved to: ${reportPath}`);
  }
}

/**
 * CLI interface
 */
async function main() {
  try {
    const analyzer = new ContentAnalyzer();
    const results = await analyzer.analyzeContent();

    console.log('\n✅ Content analysis completed successfully!');
    console.log(`📊 Total items analyzed: ${results.totalContent}`);
    console.log(`🎯 High priority recommendations: ${results.recommendations.filter(r => r.priority === 'high').length}`);

    process.exit(0);
  } catch (error) {
    console.error('\n💥 Analysis failed:', error.message);
    process.exit(1);
  }
}

// Export for testing and direct usage
module.exports = { ContentAnalyzer };

// Run if called directly
if (require.main === module) {
  main();
}