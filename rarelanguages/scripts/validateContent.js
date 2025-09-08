/**
 * Content Validation Script
 * Phase 1.3: Quality check for generated content
 */

require('dotenv').config();
const { query } = require('../lib/database');
const config = require('../config/contentGeneration');

class ContentValidator {
  constructor() {
    this.validationResults = {
      translations: {},
      exercises: {},
      pronunciations: {},
      completeness: {},
      quality: {},
      errors: []
    };
  }

  async validateTranslations() {
    console.log('🔍 Validating translations...');
    
    const results = await query(`
      SELECT 
        COUNT(*) as total_phrases,
        COUNT(target_phrase) as translated_phrases,
        COUNT(CASE WHEN target_phrase IS NOT NULL AND LENGTH(target_phrase) > 0 THEN 1 END) as non_empty_translations,
        COUNT(cultural_context) as with_cultural_context,
        AVG(LENGTH(target_phrase)) as avg_translation_length,
        AVG(LENGTH(english_phrase)) as avg_english_length
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al'
    `);
    
    const stats = results.rows[0];
    
    // Check for problematic translations
    const problemCheck = await query(`
      SELECT 
        COUNT(CASE WHEN target_phrase = english_phrase THEN 1 END) as identical_translations,
        COUNT(CASE WHEN LENGTH(target_phrase) < 2 THEN 1 END) as too_short,
        COUNT(CASE WHEN LENGTH(target_phrase) > 200 THEN 1 END) as too_long,
        COUNT(CASE WHEN target_phrase ~ '^[a-zA-Z\s]*$' THEN 1 END) as english_only_chars
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al' AND target_phrase IS NOT NULL
    `);
    
    const problems = problemCheck.rows[0];
    
    const translationRate = (parseInt(stats.translated_phrases) / parseInt(stats.total_phrases)) * 100;
    const qualityScore = Math.max(0, 100 - 
      (parseInt(problems.identical_translations) * 10) - 
      (parseInt(problems.too_short) * 5) -
      (parseInt(problems.too_long) * 2) -
      (parseInt(problems.english_only_chars) * 3)
    );
    
    this.validationResults.translations = {
      totalPhrases: parseInt(stats.total_phrases),
      translatedPhrases: parseInt(stats.translated_phrases),
      translationRate: translationRate.toFixed(1),
      withCulturalContext: parseInt(stats.with_cultural_context),
      avgTranslationLength: parseFloat(stats.avg_translation_length).toFixed(1),
      avgEnglishLength: parseFloat(stats.avg_english_length).toFixed(1),
      problems: {
        identicalTranslations: parseInt(problems.identical_translations),
        tooShort: parseInt(problems.too_short),
        tooLong: parseInt(problems.too_long),
        englishOnlyChars: parseInt(problems.english_only_chars)
      },
      qualityScore: qualityScore.toFixed(1),
      passed: translationRate > 95 && qualityScore > 80
    };
    
    console.log(`  ✅ Translation rate: ${translationRate.toFixed(1)}%`);
    console.log(`  ✅ Quality score: ${qualityScore.toFixed(1)}%`);
    
    if (this.validationResults.translations.problems.identicalTranslations > 0) {
      this.validationResults.errors.push(`Found ${problems.identical_translations} identical English-Albanian pairs`);
    }
    
    return this.validationResults.translations;
  }

  async validateExercises() {
    console.log('🔍 Validating exercises...');
    
    const results = await query(`
      SELECT 
        COUNT(DISTINCT lc.id) as content_items,
        COUNT(DISTINCT ev.content_id) as content_with_exercises,
        COUNT(ev.id) as total_exercises,
        COUNT(DISTINCT ev.exercise_type) as unique_exercise_types
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      LEFT JOIN exercise_variations ev ON lc.id = ev.content_id
      WHERE lang.code = 'gheg-al' AND lc.target_phrase IS NOT NULL
    `);
    
    const stats = results.rows[0];
    
    // Check exercise type distribution
    const typeCheck = await query(`
      SELECT 
        ev.exercise_type,
        COUNT(*) as count,
        AVG(ev.difficulty_level) as avg_difficulty,
        AVG(ev.estimated_duration_seconds) as avg_duration
      FROM exercise_variations ev
      JOIN lesson_content lc ON ev.content_id = lc.id
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al'
      GROUP BY ev.exercise_type
      ORDER BY count DESC
    `);
    
    // Check for malformed JSON
    const jsonCheck = await query(`
      SELECT 
        COUNT(CASE WHEN exercise_data::text = '{}' THEN 1 END) as empty_data,
        COUNT(CASE WHEN jsonb_typeof(exercise_data) != 'object' THEN 1 END) as invalid_json
      FROM exercise_variations ev
      JOIN lesson_content lc ON ev.content_id = lc.id
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al'
    `);
    
    const jsonStats = jsonCheck.rows[0];
    const coverage = (parseInt(stats.content_with_exercises) / parseInt(stats.content_items)) * 100;
    const avgExercisesPerContent = parseInt(stats.total_exercises) / Math.max(1, parseInt(stats.content_with_exercises));
    
    this.validationResults.exercises = {
      contentItems: parseInt(stats.content_items),
      contentWithExercises: parseInt(stats.content_with_exercises),
      totalExercises: parseInt(stats.total_exercises),
      uniqueExerciseTypes: parseInt(stats.unique_exercise_types),
      coverage: coverage.toFixed(1),
      avgExercisesPerContent: avgExercisesPerContent.toFixed(1),
      exerciseTypes: typeCheck.rows.map(row => ({
        type: row.exercise_type,
        count: parseInt(row.count),
        avgDifficulty: parseFloat(row.avg_difficulty).toFixed(1),
        avgDuration: parseInt(row.avg_duration)
      })),
      dataQuality: {
        emptyData: parseInt(jsonStats.empty_data),
        invalidJson: parseInt(jsonStats.invalid_json)
      },
      passed: coverage > 90 && parseInt(stats.unique_exercise_types) >= 4
    };
    
    console.log(`  ✅ Exercise coverage: ${coverage.toFixed(1)}%`);
    console.log(`  ✅ Avg exercises per content: ${avgExercisesPerContent.toFixed(1)}`);
    console.log(`  ✅ Exercise types: ${stats.unique_exercise_types}`);
    
    if (parseInt(jsonStats.empty_data) > 0) {
      this.validationResults.errors.push(`Found ${jsonStats.empty_data} exercises with empty data`);
    }
    
    return this.validationResults.exercises;
  }

  async validatePronunciations() {
    console.log('🔍 Validating pronunciations...');
    
    const results = await query(`
      SELECT 
        COUNT(*) as translated_content,
        COUNT(CASE WHEN pronunciation_guide IS NOT NULL AND pronunciation_guide != '' THEN 1 END) as with_pronunciation,
        COUNT(CASE WHEN pronunciation_guide IS NOT NULL AND pronunciation_guide != '' 
               AND jsonb_typeof(pronunciation_guide::jsonb) = 'object' THEN 1 END) as valid_json_format
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al' AND lc.target_phrase IS NOT NULL
    `);
    
    const stats = results.rows[0];
    
    // Sample pronunciation guides for structure validation
    const sampleCheck = await query(`
      SELECT pronunciation_guide
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al' 
        AND pronunciation_guide IS NOT NULL 
        AND pronunciation_guide != ''
      LIMIT 10
    `);
    
    let validStructureCount = 0;
    let missingFields = [];
    
    for (const row of sampleCheck.rows) {
      try {
        const guide = JSON.parse(row.pronunciation_guide);
        let valid = true;
        
        if (!guide.phonetic) { missingFields.push('phonetic'); valid = false; }
        if (!guide.syllables) { missingFields.push('syllables'); valid = false; }
        if (!guide.phrase) { missingFields.push('phrase'); valid = false; }
        
        if (valid) validStructureCount++;
      } catch (error) {
        // Invalid JSON
      }
    }
    
    const coverage = (parseInt(stats.with_pronunciation) / parseInt(stats.translated_content)) * 100;
    const structureValidation = sampleCheck.rows.length > 0 ? 
      (validStructureCount / sampleCheck.rows.length) * 100 : 0;
    
    this.validationResults.pronunciations = {
      translatedContent: parseInt(stats.translated_content),
      withPronunciation: parseInt(stats.with_pronunciation),
      validJsonFormat: parseInt(stats.valid_json_format),
      coverage: coverage.toFixed(1),
      structureValidation: structureValidation.toFixed(1),
      sampleSize: sampleCheck.rows.length,
      validSamples: validStructureCount,
      missingFields: [...new Set(missingFields)],
      passed: coverage > 85 && structureValidation > 80
    };
    
    console.log(`  ✅ Pronunciation coverage: ${coverage.toFixed(1)}%`);
    console.log(`  ✅ Structure validation: ${structureValidation.toFixed(1)}%`);
    
    if (missingFields.length > 0) {
      this.validationResults.errors.push(`Pronunciation guides missing fields: ${missingFields.join(', ')}`);
    }
    
    return this.validationResults.pronunciations;
  }

  async validateCompleteness() {
    console.log('🔍 Validating completeness...');
    
    // Check skill and lesson structure
    const structureCheck = await query(`
      SELECT 
        COUNT(DISTINCT s.id) as total_skills,
        COUNT(DISTINCT l.id) as total_lessons,
        COUNT(DISTINCT lc.id) as total_content,
        COUNT(DISTINCT CASE WHEN lc.target_phrase IS NOT NULL THEN s.id END) as skills_with_translations
      FROM skills s
      JOIN languages lang ON s.language_id = lang.id
      LEFT JOIN lessons l ON s.id = l.skill_id
      LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
      WHERE lang.code = 'gheg-al'
    `);
    
    const structure = structureCheck.rows[0];
    
    // Check CEFR distribution
    const cefrCheck = await query(`
      SELECT 
        cefr_level,
        COUNT(*) as skill_count,
        COUNT(DISTINCT l.id) as lesson_count,
        COUNT(DISTINCT lc.id) as content_count
      FROM skills s
      JOIN languages lang ON s.language_id = lang.id
      LEFT JOIN lessons l ON s.id = l.skill_id
      LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
      WHERE lang.code = 'gheg-al'
      GROUP BY cefr_level
      ORDER BY cefr_level
    `);
    
    this.validationResults.completeness = {
      structure: {
        totalSkills: parseInt(structure.total_skills),
        totalLessons: parseInt(structure.total_lessons),
        totalContent: parseInt(structure.total_content),
        skillsWithTranslations: parseInt(structure.skills_with_translations)
      },
      cefrDistribution: cefrCheck.rows.map(row => ({
        level: row.cefr_level,
        skillCount: parseInt(row.skill_count),
        lessonCount: parseInt(row.lesson_count),
        contentCount: parseInt(row.content_count)
      })),
      passed: parseInt(structure.total_skills) >= 15 && 
              parseInt(structure.total_lessons) >= 40 &&
              parseInt(structure.total_content) >= 100
    };
    
    console.log(`  ✅ Skills: ${structure.total_skills}`);
    console.log(`  ✅ Lessons: ${structure.total_lessons}`);
    console.log(`  ✅ Content items: ${structure.total_content}`);
    
    return this.validationResults.completeness;
  }

  async calculateOverallQuality() {
    console.log('🔍 Calculating overall quality score...');
    
    const weights = {
      translations: 0.4,
      exercises: 0.3,
      pronunciations: 0.2,
      completeness: 0.1
    };
    
    let weightedScore = 0;
    let totalWeight = 0;
    
    if (this.validationResults.translations.passed) {
      weightedScore += parseFloat(this.validationResults.translations.qualityScore) * weights.translations;
      totalWeight += weights.translations;
    }
    
    if (this.validationResults.exercises.passed) {
      const exerciseScore = parseFloat(this.validationResults.exercises.coverage);
      weightedScore += exerciseScore * weights.exercises;
      totalWeight += weights.exercises;
    }
    
    if (this.validationResults.pronunciations.passed) {
      const pronunciationScore = parseFloat(this.validationResults.pronunciations.coverage);
      weightedScore += pronunciationScore * weights.pronunciations;
      totalWeight += weights.pronunciations;
    }
    
    if (this.validationResults.completeness.passed) {
      weightedScore += 100 * weights.completeness;
      totalWeight += weights.completeness;
    }
    
    const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    this.validationResults.quality = {
      overallScore: overallScore.toFixed(1),
      passedComponents: {
        translations: this.validationResults.translations.passed,
        exercises: this.validationResults.exercises.passed,
        pronunciations: this.validationResults.pronunciations.passed,
        completeness: this.validationResults.completeness.passed
      },
      totalErrors: this.validationResults.errors.length,
      passed: overallScore > 90 && this.validationResults.errors.length < 5
    };
    
    console.log(`  ✅ Overall quality score: ${overallScore.toFixed(1)}%`);
    
    return this.validationResults.quality;
  }
}

async function validateContent() {
  const validator = new ContentValidator();
  
  console.log('🔍 Starting comprehensive content validation...');
  console.log('='.repeat(50));
  
  try {
    // Run all validation checks
    await validator.validateTranslations();
    await validator.validateExercises();
    await validator.validatePronunciations();
    await validator.validateCompleteness();
    await validator.calculateOverallQuality();
    
    // Display results
    console.log('\n📊 VALIDATION RESULTS SUMMARY:');
    console.log('='.repeat(50));
    
    const results = validator.validationResults;
    
    console.log(`🔤 Translations: ${results.translations.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Rate: ${results.translations.translationRate}% | Quality: ${results.translations.qualityScore}%`);
    
    console.log(`🎯 Exercises: ${results.exercises.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Coverage: ${results.exercises.coverage}% | Types: ${results.exercises.uniqueExerciseTypes}`);
    
    console.log(`🔊 Pronunciations: ${results.pronunciations.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Coverage: ${results.pronunciations.coverage}% | Structure: ${results.pronunciations.structureValidation}%`);
    
    console.log(`📚 Completeness: ${results.completeness.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Skills: ${results.completeness.structure.totalSkills} | Content: ${results.completeness.structure.totalContent}`);
    
    console.log(`\n🎯 OVERALL QUALITY: ${results.quality.overallScore}% ${results.quality.passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  VALIDATION ERRORS:');
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (results.quality.passed) {
      console.log('\n🎉 Content validation SUCCESSFUL - Ready for Phase 2.2!');
    } else {
      console.log('\n⚠️  Content validation needs attention before proceeding');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Content validation failed:', error);
    throw error;
  }
}

if (require.main === module) {
  validateContent()
    .then((results) => {
      console.log('🎯 Content validation completed');
      process.exit(results.quality.passed ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Content validation failed:', error);
      process.exit(1);
    });
}

module.exports = {
  validateContent,
  ContentValidator
};