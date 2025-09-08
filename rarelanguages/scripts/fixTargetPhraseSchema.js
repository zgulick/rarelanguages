/**
 * Fix Database Schema for Phase 2.1
 * Allow NULL target_phrase for English-only content creation
 */

require('dotenv').config();
const { query } = require('../lib/database');

async function fixTargetPhraseSchema() {
  console.log('🔧 Fixing lesson_content schema to allow NULL target_phrase...');
  
  try {
    // Make target_phrase nullable
    await query(`
      ALTER TABLE lesson_content 
      ALTER COLUMN target_phrase DROP NOT NULL
    `);
    
    console.log('✅ Schema updated: target_phrase can now be NULL');
    console.log('📝 This allows Phase 2.1 to create English-only content');
    console.log('📝 Phase 1.3 will populate target_phrase with AI translations');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  fixTargetPhraseSchema().catch(console.error);
}

module.exports = fixTargetPhraseSchema;