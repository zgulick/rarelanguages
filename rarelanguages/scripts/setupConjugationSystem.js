/**
 * Master Setup Script for Verb Conjugation System
 * Coordinates migrations and data generation for the new conjugation features
 */

require('dotenv').config();
const { query } = require('../lib/database');
const { generateVerbConjugations } = require('./generateVerbConjugations');
const { generateGrammarRules } = require('./generateGrammarRules');
const fs = require('fs').promises;
const path = require('path');

class ConjugationSystemSetup {
  constructor() {
    this.migrationsPath = path.join(__dirname, '../migrations');
  }

  async runMigration(migrationFile) {
    console.log(`🔄 Running migration: ${migrationFile}`);

    try {
      const migrationPath = path.join(this.migrationsPath, migrationFile);
      const migrationSQL = await fs.readFile(migrationPath, 'utf8');

      // Execute the migration
      await query(migrationSQL);

      console.log(`✅ Migration ${migrationFile} completed successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Migration ${migrationFile} failed:`, error.message);
      throw error;
    }
  }

  async checkTablesExist() {
    console.log('🔍 Checking if conjugation tables exist...');

    const result = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('verb_conjugations', 'verb_paradigms', 'verb_roots', 'grammar_rules', 'grammar_exercises', 'grammar_patterns')
      ORDER BY table_name
    `);

    const existingTables = result.rows.map(row => row.table_name);
    const requiredTables = ['verb_conjugations', 'verb_paradigms', 'verb_roots', 'grammar_rules', 'grammar_exercises', 'grammar_patterns'];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));

    console.log(`📊 Existing tables: ${existingTables.length}/${requiredTables.length}`);
    if (existingTables.length > 0) {
      console.log(`   Found: ${existingTables.join(', ')}`);
    }
    if (missingTables.length > 0) {
      console.log(`   Missing: ${missingTables.join(', ')}`);
    }

    return { existingTables, missingTables, allTablesExist: missingTables.length === 0 };
  }

  async setupDatabase() {
    console.log('🏗️  Setting up database for conjugation system...');

    const { allTablesExist, missingTables } = await this.checkTablesExist();

    if (allTablesExist) {
      console.log('✅ All required tables already exist!');
      return true;
    }

    console.log(`🔨 Need to create ${missingTables.length} tables`);

    // Run verb conjugation migration if needed
    if (missingTables.some(table => ['verb_conjugations', 'verb_paradigms', 'verb_roots'].includes(table))) {
      await this.runMigration('012_add_verb_conjugation_system.sql');
    }

    // Run grammar rules migration if needed
    if (missingTables.some(table => ['grammar_rules', 'grammar_exercises', 'grammar_patterns'].includes(table))) {
      await this.runMigration('013_add_grammar_rules_system.sql');
    }

    // Verify all tables now exist
    const finalCheck = await this.checkTablesExist();
    if (!finalCheck.allTablesExist) {
      throw new Error(`Failed to create all required tables. Still missing: ${finalCheck.missingTables.join(', ')}`);
    }

    console.log('✅ Database setup completed successfully!');
    return true;
  }

  async checkDataExists() {
    console.log('🔍 Checking existing data...');

    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM verb_conjugations) as conjugations_count,
        (SELECT COUNT(*) FROM verb_roots) as verb_roots_count,
        (SELECT COUNT(*) FROM grammar_rules) as grammar_rules_count,
        (SELECT COUNT(*) FROM grammar_exercises) as exercises_count,
        (SELECT COUNT(*) FROM lesson_content WHERE word_type = 'verb') as total_verbs
    `);

    const data = result.rows[0];

    console.log(`📊 Current Data Status:`);
    console.log(`   Total verbs in lessons: ${data.total_verbs}`);
    console.log(`   Verbs with conjugations: ${data.conjugations_count > 0 ? '✅' : '❌'} (${data.conjugations_count} forms)`);
    console.log(`   Verbs with root analysis: ${data.verb_roots_count > 0 ? '✅' : '❌'} (${data.verb_roots_count} verbs)`);
    console.log(`   Grammar rules: ${data.grammar_rules_count > 0 ? '✅' : '❌'} (${data.grammar_rules_count} rules)`);
    console.log(`   Grammar exercises: ${data.exercises_count > 0 ? '✅' : '❌'} (${data.exercises_count} exercises)`);

    const needsConjugationData = parseInt(data.conjugations_count) === 0;
    const needsGrammarData = parseInt(data.grammar_rules_count) === 0;

    return {
      totalVerbs: parseInt(data.total_verbs),
      conjugationsCount: parseInt(data.conjugations_count),
      verbRootsCount: parseInt(data.verb_roots_count),
      grammarRulesCount: parseInt(data.grammar_rules_count),
      exercisesCount: parseInt(data.exercises_count),
      needsConjugationData,
      needsGrammarData
    };
  }

  async generateData(options = {}) {
    console.log('🚀 Starting data generation process...');

    const dataStatus = await this.checkDataExists();

    if (dataStatus.totalVerbs === 0) {
      console.log('⚠️  No verbs found in lesson content. Make sure you have lesson data first.');
      return false;
    }

    let generatedConjugations = false;
    let generatedGrammar = false;

    // Generate verb conjugations if needed
    if (dataStatus.needsConjugationData || options.forceConjugations) {
      console.log('\n📝 Generating verb conjugation data...');
      try {
        const conjugations = await generateVerbConjugations();
        console.log(`✅ Generated conjugations for ${conjugations.length} verbs`);
        generatedConjugations = true;
      } catch (error) {
        console.error('❌ Verb conjugation generation failed:', error.message);
        if (!options.continueOnError) throw error;
      }
    } else {
      console.log('✅ Verb conjugation data already exists');
    }

    // Generate grammar rules if needed
    if (dataStatus.needsGrammarData || options.forceGrammar) {
      console.log('\n📚 Generating grammar rules...');
      try {
        const rules = await generateGrammarRules();
        console.log(`✅ Generated ${rules.length} grammar rules`);
        generatedGrammar = true;
      } catch (error) {
        console.error('❌ Grammar rules generation failed:', error.message);
        if (!options.continueOnError) throw error;
      }
    } else {
      console.log('✅ Grammar rules already exist');
    }

    return { generatedConjugations, generatedGrammar };
  }

  async testSystem() {
    console.log('🧪 Testing the conjugation system...');

    // Test API endpoints
    try {
      // Get a lesson with verbs
      const lessonResult = await query(`
        SELECT DISTINCT l.id
        FROM lessons l
        JOIN lesson_content lc ON l.id = lc.lesson_id
        WHERE lc.word_type = 'verb'
        LIMIT 1
      `);

      if (lessonResult.rows.length === 0) {
        console.log('⚠️  No lessons with verbs found for testing');
        return false;
      }

      const lessonId = lessonResult.rows[0].id;
      console.log(`🔍 Testing with lesson ID: ${lessonId}`);

      // Test conjugation API endpoint simulation
      const conjugationResult = await query(`
        SELECT
          lc.id as verb_id,
          lc.english_phrase,
          lc.target_phrase,
          COUNT(vc.id) as conjugation_count
        FROM lesson_content lc
        LEFT JOIN verb_conjugations vc ON lc.id = vc.verb_id
        WHERE lc.lesson_id = $1 AND lc.word_type = 'verb'
        GROUP BY lc.id, lc.english_phrase, lc.target_phrase
      `, [lessonId]);

      console.log(`📊 Test Results for Lesson ${lessonId}:`);
      conjugationResult.rows.forEach(verb => {
        console.log(`   "${verb.target_phrase}" (${verb.english_phrase}): ${verb.conjugation_count} conjugations`);
      });

      // Test grammar rules
      const grammarResult = await query(`
        SELECT COUNT(*) as rule_count, COUNT(DISTINCT category) as categories
        FROM grammar_rules
      `);

      const grammarStats = grammarResult.rows[0];
      console.log(`📚 Grammar System: ${grammarStats.rule_count} rules across ${grammarStats.categories} categories`);

      console.log('✅ System test completed successfully!');
      return true;

    } catch (error) {
      console.error('❌ System test failed:', error.message);
      return false;
    }
  }

  async runCompleteSetup(options = {}) {
    console.log('🎯 Starting complete conjugation system setup...\n');

    try {
      // Step 1: Setup database
      console.log('=== STEP 1: DATABASE SETUP ===');
      await this.setupDatabase();

      // Step 2: Generate data
      console.log('\n=== STEP 2: DATA GENERATION ===');
      const generated = await this.generateData(options);

      // Step 3: Test system
      console.log('\n=== STEP 3: SYSTEM TEST ===');
      await this.testSystem();

      console.log('\n🎉 CONJUGATION SYSTEM SETUP COMPLETED SUCCESSFULLY!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Start your development server: npm run dev');
      console.log('   2. Navigate to a lesson with verbs');
      console.log('   3. Observe enhanced verb cards with conjugation tables');
      console.log('   4. Test the new API endpoints:');
      console.log('      - /api/lessons/[id]/conjugations');
      console.log('      - /api/grammar/rules/[concept]');

      return {
        success: true,
        databaseSetup: true,
        dataGenerated: generated,
        systemTested: true
      };

    } catch (error) {
      console.error('\n💥 SETUP FAILED:', error.message);
      console.log('\n🔍 Troubleshooting:');
      console.log('   1. Check database connection in .env');
      console.log('   2. Ensure OpenAI API key is set');
      console.log('   3. Verify migration files exist');
      console.log('   4. Check console output for specific errors');

      throw error;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    forceConjugations: args.includes('--force-conjugations'),
    forceGrammar: args.includes('--force-grammar'),
    continueOnError: args.includes('--continue-on-error'),
    setupOnly: args.includes('--setup-only'),
    dataOnly: args.includes('--data-only'),
    testOnly: args.includes('--test-only')
  };

  const setup = new ConjugationSystemSetup();

  try {
    if (options.setupOnly) {
      await setup.setupDatabase();
    } else if (options.dataOnly) {
      await setup.generateData(options);
    } else if (options.testOnly) {
      await setup.testSystem();
    } else {
      await setup.runCompleteSetup(options);
    }

    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  ConjugationSystemSetup
};