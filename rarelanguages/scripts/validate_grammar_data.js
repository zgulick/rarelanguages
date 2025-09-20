#!/usr/bin/env node

/**
 * Grammar Data Validation Script
 * Validates data quality and consistency across all grammar fields
 * Part of Priority 2: Grammar Data Population - Phase 4
 */

const { query } = require('../lib/database');
const fs = require('fs').promises;
const path = require('path');

class GrammarDataValidator {
  constructor() {
    this.validationResults = {
      summary: {},
      issues: [],
      recommendations: [],
      qualityScore: 0
    };
  }

  /**
   * Main validation entry point
   */
  async validateGrammarData() {
    console.log('🔍 Starting grammar data validation...\n');

    try {
      // Step 1: Validate data completeness
      await this.validateDataCompleteness();

      // Step 2: Validate data consistency
      await this.validateDataConsistency();

      // Step 3: Validate data quality
      await this.validateDataQuality();

      // Step 4: Validate field relationships
      await this.validateFieldRelationships();

      // Step 5: Calculate quality score
      await this.calculateQualityScore();

      // Step 6: Generate recommendations
      await this.generateRecommendations();

      // Step 7: Save validation report
      await this.saveValidationReport();

      console.log('\n✅ Grammar data validation completed!');
      return this.validationResults;

    } catch (error) {
      console.error('❌ Grammar data validation failed:', error);
      throw error;
    }
  }

  /**
   * Validate data completeness across all grammar fields
   */
  async validateDataCompleteness() {
    console.log('📊 Validating data completeness...');

    const result = await query(`
      SELECT
        COUNT(*) as total_items,
        COUNT(word_type) as has_word_type,
        COUNT(grammar_category) as has_grammar_category,
        COUNT(gender) as has_gender,
        COUNT(verb_type) as has_verb_type,
        COUNT(stress_pattern) as has_stress_pattern,
        COUNT(pronunciation_guide) as has_pronunciation_guide,
        COUNT(conjugation_data) as has_conjugation_data,
        COUNT(usage_examples) as has_usage_examples,
        COUNT(difficulty_notes) as has_difficulty_notes,
        COUNT(cultural_context) as has_cultural_context
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE l.is_active = true
    `);

    const data = result.rows[0];
    const total = parseInt(data.total_items);

    const completeness = {
      word_type: { count: parseInt(data.has_word_type), percentage: (data.has_word_type / total * 100).toFixed(1) },
      grammar_category: { count: parseInt(data.has_grammar_category), percentage: (data.has_grammar_category / total * 100).toFixed(1) },
      gender: { count: parseInt(data.has_gender), percentage: (data.has_gender / total * 100).toFixed(1) },
      verb_type: { count: parseInt(data.has_verb_type), percentage: (data.has_verb_type / total * 100).toFixed(1) },
      stress_pattern: { count: parseInt(data.has_stress_pattern), percentage: (data.has_stress_pattern / total * 100).toFixed(1) },
      pronunciation_guide: { count: parseInt(data.has_pronunciation_guide), percentage: (data.has_pronunciation_guide / total * 100).toFixed(1) },
      conjugation_data: { count: parseInt(data.has_conjugation_data), percentage: (data.has_conjugation_data / total * 100).toFixed(1) },
      usage_examples: { count: parseInt(data.has_usage_examples), percentage: (data.has_usage_examples / total * 100).toFixed(1) },
      difficulty_notes: { count: parseInt(data.has_difficulty_notes), percentage: (data.has_difficulty_notes / total * 100).toFixed(1) },
      cultural_context: { count: parseInt(data.has_cultural_context), percentage: (data.has_cultural_context / total * 100).toFixed(1) }
    };

    this.validationResults.summary.completeness = completeness;
    this.validationResults.summary.total_items = total;

    console.log(`   Total items: ${total}`);
    Object.entries(completeness).forEach(([field, stats]) => {
      console.log(`   ${field}: ${stats.count}/${total} (${stats.percentage}%)`);

      if (parseFloat(stats.percentage) < 50 && ['word_type', 'grammar_category'].includes(field)) {
        this.validationResults.issues.push({
          type: 'completeness',
          severity: 'high',
          field: field,
          message: `${field} completeness is only ${stats.percentage}% - should be higher for basic classification`
        });
      }
    });
  }

  /**
   * Validate data consistency
   */
  async validateDataConsistency() {
    console.log('\n🔧 Validating data consistency...');

    // Check verb-related consistency
    const verbConsistency = await query(`
      SELECT
        COUNT(*) as total_verbs,
        COUNT(verb_type) as verbs_with_type,
        COUNT(conjugation_data) as verbs_with_conjugation
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE l.is_active = true AND lc.word_type = 'verb'
    `);

    const verbData = verbConsistency.rows[0];
    let verbTypePercentage = '0';
    let verbConjugationPercentage = '0';

    if (parseInt(verbData.total_verbs) > 0) {
      verbTypePercentage = (verbData.verbs_with_type / verbData.total_verbs * 100).toFixed(1);
      verbConjugationPercentage = (verbData.verbs_with_conjugation / verbData.total_verbs * 100).toFixed(1);

      console.log(`   Verbs with type: ${verbData.verbs_with_type}/${verbData.total_verbs} (${verbTypePercentage}%)`);
      console.log(`   Verbs with conjugation: ${verbData.verbs_with_conjugation}/${verbData.total_verbs} (${verbConjugationPercentage}%)`);

      if (parseFloat(verbTypePercentage) < 80) {
        this.validationResults.issues.push({
          type: 'consistency',
          severity: 'medium',
          field: 'verb_type',
          message: `Only ${verbTypePercentage}% of verbs have verb_type specified`
        });
      }
    }

    // Check noun-gender consistency
    const nounConsistency = await query(`
      SELECT
        COUNT(*) as total_nouns,
        COUNT(gender) as nouns_with_gender
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE l.is_active = true AND lc.word_type = 'noun'
    `);

    const nounData = nounConsistency.rows[0];
    let nounGenderPercentage = '0';

    if (parseInt(nounData.total_nouns) > 0) {
      nounGenderPercentage = (nounData.nouns_with_gender / nounData.total_nouns * 100).toFixed(1);
      console.log(`   Nouns with gender: ${nounData.nouns_with_gender}/${nounData.total_nouns} (${nounGenderPercentage}%)`);

      if (parseFloat(nounGenderPercentage) < 60) {
        this.validationResults.issues.push({
          type: 'consistency',
          severity: 'medium',
          field: 'gender',
          message: `Only ${nounGenderPercentage}% of nouns have gender specified`
        });
      }
    }

    // Check grammar category distribution
    const categoryDistribution = await query(`
      SELECT
        grammar_category,
        COUNT(*) as count
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE l.is_active = true AND lc.grammar_category IS NOT NULL
      GROUP BY grammar_category
      ORDER BY count DESC
    `);

    console.log(`   Grammar categories found: ${categoryDistribution.rows.length}`);
    const categories = categoryDistribution.rows.map(row => `${row.grammar_category} (${row.count})`);
    console.log(`   Distribution: ${categories.slice(0, 5).join(', ')}${categories.length > 5 ? '...' : ''}`);

    this.validationResults.summary.consistency = {
      verb_type_coverage: parseFloat(verbTypePercentage || 0),
      noun_gender_coverage: parseFloat(nounGenderPercentage || 0),
      grammar_categories: categoryDistribution.rows.length
    };
  }

  /**
   * Validate data quality
   */
  async validateDataQuality() {
    console.log('\n✨ Validating data quality...');

    // Check for empty or invalid values
    const qualityIssues = await query(`
      SELECT
        lc.id,
        lc.english_phrase,
        lc.target_phrase,
        lc.word_type,
        lc.grammar_category,
        CASE
          WHEN lc.english_phrase IS NULL OR TRIM(lc.english_phrase) = '' THEN 'empty_english_phrase'
          WHEN lc.target_phrase IS NULL OR TRIM(lc.target_phrase) = '' THEN 'empty_target_phrase'
          WHEN lc.word_type IS NULL OR TRIM(lc.word_type) = '' THEN 'empty_word_type'
          WHEN LENGTH(lc.english_phrase) < 2 THEN 'too_short_english'
          WHEN LENGTH(lc.target_phrase) < 2 THEN 'too_short_target'
          WHEN lc.english_phrase = lc.target_phrase THEN 'identical_phrases'
          ELSE 'valid'
        END as quality_issue
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE l.is_active = true
    `);

    const qualityStats = {};
    qualityIssues.rows.forEach(row => {
      const issue = row.quality_issue;
      if (!qualityStats[issue]) {
        qualityStats[issue] = 0;
      }
      qualityStats[issue]++;

      if (issue !== 'valid') {
        this.validationResults.issues.push({
          type: 'quality',
          severity: issue.includes('empty') ? 'high' : 'medium',
          field: 'content',
          message: `Content item ${row.id}: ${issue}`,
          details: {
            english: row.english_phrase,
            albanian: row.target_phrase,
            word_type: row.word_type
          }
        });
      }
    });

    console.log(`   Quality issues found:`);
    Object.entries(qualityStats).forEach(([issue, count]) => {
      if (issue !== 'valid') {
        console.log(`     ${issue}: ${count} items`);
      }
    });

    const validCount = qualityStats.valid || 0;
    const totalCount = qualityIssues.rows.length;
    const qualityPercentage = (validCount / totalCount * 100).toFixed(1);
    console.log(`   Overall data quality: ${validCount}/${totalCount} (${qualityPercentage}%) items are valid`);

    this.validationResults.summary.quality = {
      valid_items: validCount,
      total_items: totalCount,
      quality_percentage: parseFloat(qualityPercentage),
      quality_issues: qualityStats
    };
  }

  /**
   * Validate field relationships and dependencies
   */
  async validateFieldRelationships() {
    console.log('\n🔗 Validating field relationships...');

    // Check pronunciation-stress pattern relationship
    const pronunciationStressResult = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE pronunciation_guide IS NOT NULL AND stress_pattern IS NOT NULL) as both_present,
        COUNT(*) FILTER (WHERE pronunciation_guide IS NOT NULL AND stress_pattern IS NULL) as pronunciation_only,
        COUNT(*) FILTER (WHERE pronunciation_guide IS NULL AND stress_pattern IS NOT NULL) as stress_only,
        COUNT(*) FILTER (WHERE pronunciation_guide IS NULL AND stress_pattern IS NULL) as neither_present
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE l.is_active = true
    `);

    const pronData = pronunciationStressResult.rows[0];
    console.log(`   Pronunciation-Stress Pattern relationship:`);
    console.log(`     Both present: ${pronData.both_present}`);
    console.log(`     Pronunciation only: ${pronData.pronunciation_only}`);
    console.log(`     Stress pattern only: ${pronData.stress_only}`);
    console.log(`     Neither present: ${pronData.neither_present}`);

    // Check word type-specific field relationships
    const wordTypeFieldsResult = await query(`
      SELECT
        word_type,
        COUNT(*) as total,
        COUNT(conjugation_data) FILTER (WHERE word_type = 'verb') as verb_conjugations,
        COUNT(gender) FILTER (WHERE word_type = 'noun') as noun_genders,
        COUNT(usage_examples) as has_examples,
        COUNT(difficulty_notes) as has_notes
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      WHERE l.is_active = true AND lc.word_type IS NOT NULL
      GROUP BY word_type
      ORDER BY total DESC
    `);

    console.log(`   Word type-specific field coverage:`);
    wordTypeFieldsResult.rows.forEach(row => {
      console.log(`     ${row.word_type} (${row.total} items):`);
      if (row.word_type === 'verb' && row.verb_conjugations) {
        console.log(`       Conjugations: ${row.verb_conjugations}/${row.total}`);
      }
      if (row.word_type === 'noun' && row.noun_genders) {
        console.log(`       Genders: ${row.noun_genders}/${row.total}`);
      }
      console.log(`       Examples: ${row.has_examples}/${row.total}`);
      console.log(`       Notes: ${row.has_notes}/${row.total}`);
    });

    this.validationResults.summary.relationships = {
      pronunciation_stress_coverage: parseFloat((pronData.both_present / pronData.total * 100).toFixed(1)),
      word_type_coverage: wordTypeFieldsResult.rows
    };
  }

  /**
   * Calculate overall quality score
   */
  async calculateQualityScore() {
    console.log('\n📊 Calculating quality score...');

    const summary = this.validationResults.summary;
    let totalScore = 0;
    let maxScore = 0;

    // Completeness score (40% of total)
    const completenessFields = ['word_type', 'grammar_category', 'pronunciation_guide', 'difficulty_notes'];
    let completenessScore = 0;
    completenessFields.forEach(field => {
      if (summary.completeness[field]) {
        completenessScore += parseFloat(summary.completeness[field].percentage);
      }
    });
    completenessScore = (completenessScore / completenessFields.length) * 0.4;
    totalScore += completenessScore;
    maxScore += 40;

    // Quality score (30% of total)
    const qualityScore = summary.quality ? (summary.quality.quality_percentage * 0.3) : 0;
    totalScore += qualityScore;
    maxScore += 30;

    // Consistency score (20% of total)
    const consistencyScore = summary.consistency ?
      ((summary.consistency.verb_type_coverage + summary.consistency.noun_gender_coverage) / 2) * 0.2 : 0;
    totalScore += consistencyScore;
    maxScore += 20;

    // Relationships score (10% of total)
    const relationshipsScore = summary.relationships ?
      (summary.relationships.pronunciation_stress_coverage * 0.1) : 0;
    totalScore += relationshipsScore;
    maxScore += 10;

    this.validationResults.qualityScore = Math.round(totalScore);

    console.log(`   Quality Score Breakdown:`);
    console.log(`     Completeness (40%): ${completenessScore.toFixed(1)}/40`);
    console.log(`     Quality (30%): ${qualityScore.toFixed(1)}/30`);
    console.log(`     Consistency (20%): ${consistencyScore.toFixed(1)}/20`);
    console.log(`     Relationships (10%): ${relationshipsScore.toFixed(1)}/10`);
    console.log(`   Overall Quality Score: ${this.validationResults.qualityScore}/100`);
  }

  /**
   * Generate actionable recommendations
   */
  async generateRecommendations() {
    console.log('\n💡 Generating recommendations...');

    const recommendations = [];

    // High priority issues
    const highPriorityIssues = this.validationResults.issues.filter(issue => issue.severity === 'high');
    if (highPriorityIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'data_quality',
        message: `Fix ${highPriorityIssues.length} high-priority data quality issues`,
        action: 'Review and correct empty or invalid content items'
      });
    }

    // Completeness recommendations
    const completeness = this.validationResults.summary.completeness;
    Object.entries(completeness).forEach(([field, stats]) => {
      const percentage = parseFloat(stats.percentage);
      if (percentage < 70) {
        const priority = percentage < 50 ? 'high' : 'medium';
        recommendations.push({
          priority: priority,
          category: 'completeness',
          field: field,
          message: `${field} coverage is ${stats.percentage}% (${stats.count} items)`,
          action: `Populate ${field} for remaining items to improve coverage`
        });
      }
    });

    // Grammar-specific recommendations
    if (this.validationResults.summary.consistency) {
      const consistency = this.validationResults.summary.consistency;
      if (consistency.verb_type_coverage < 80) {
        recommendations.push({
          priority: 'medium',
          category: 'consistency',
          field: 'verb_type',
          message: `Verb type coverage is ${consistency.verb_type_coverage}%`,
          action: 'Classify remaining verbs as regular/irregular'
        });
      }
    }

    this.validationResults.recommendations = recommendations;

    console.log(`   Generated ${recommendations.length} recommendations:`);
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
    });
  }

  /**
   * Save comprehensive validation report
   */
  async saveValidationReport() {
    const reportPath = path.join(__dirname, '..', 'data', 'grammar-validation-report.json');

    const report = {
      ...this.validationResults,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Validation report saved to: ${reportPath}`);
  }
}

/**
 * CLI interface
 */
async function main() {
  try {
    const validator = new GrammarDataValidator();
    const results = await validator.validateGrammarData();

    console.log(`\n✅ Validation completed with quality score: ${results.qualityScore}/100`);
    console.log(`🔍 Found ${results.issues.length} issues`);
    console.log(`💡 Generated ${results.recommendations.length} recommendations`);

    if (results.qualityScore < 70) {
      console.log('\n⚠️  Quality score is below 70 - consider addressing recommendations');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n💥 Validation failed:', error.message);
    process.exit(1);
  }
}

// Export for testing and direct usage
module.exports = { GrammarDataValidator };

// Run if called directly
if (require.main === module) {
  main();
}