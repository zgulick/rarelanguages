/**
 * Phase 1.3 Pipeline Test Script
 * Test the content generation pipeline step by step
 */

require('dotenv').config();
const { query } = require('../lib/database');

async function testPipelineReadiness() {
  console.log('🧪 Testing Phase 1.3 Content Generation Pipeline');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Database Connection
    console.log('\n🔍 Test 1: Database Connection');
    await query('SELECT 1 as test');
    console.log('✅ Database connection successful');
    
    // Test 2: Check OpenAI Configuration
    console.log('\n🔍 Test 2: OpenAI Configuration');
    if (process.env.OPENAI_API_KEY) {
      console.log('✅ OpenAI API key configured');
    } else {
      console.log('❌ OpenAI API key missing');
      return false;
    }
    
    // Test 3: Check English Content Availability
    console.log('\n🔍 Test 3: English Content Availability');
    const contentResult = await query(`
      SELECT COUNT(*) as count 
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al' AND lc.english_phrase IS NOT NULL
    `);
    
    const contentCount = parseInt(contentResult.rows[0].count);
    console.log(`✅ Found ${contentCount} English phrases ready for translation`);
    
    // Test 4: Check Current Translation Status
    console.log('\n🔍 Test 4: Current Translation Status');
    const translationResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(target_phrase) as translated
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al'
    `);
    
    const stats = translationResult.rows[0];
    const translationRate = (parseInt(stats.translated) / parseInt(stats.total)) * 100;
    console.log(`📊 Translation progress: ${stats.translated}/${stats.total} (${translationRate.toFixed(1)}%)`);
    
    // Test 5: Check Exercise Variations Table
    console.log('\n🔍 Test 5: Exercise Variations Table');
    try {
      const exerciseResult = await query('SELECT COUNT(*) as count FROM exercise_variations');
      console.log(`✅ Exercise variations table exists with ${exerciseResult.rows[0].count} records`);
    } catch (error) {
      console.log('❌ Exercise variations table issue:', error.message);
    }
    
    // Test 6: Check Content Generation Progress Directory
    console.log('\n🔍 Test 6: Progress Directory');
    const fs = require('fs').promises;
    try {
      await fs.access('./progress');
      console.log('✅ Progress directory exists');
    } catch (error) {
      console.log('⚠️  Progress directory missing, will be created');
    }
    
    // Test 7: Test OpenAI Client Initialization
    console.log('\n🔍 Test 7: OpenAI Client Initialization');
    try {
      const { OpenAIClient } = require('../lib/openai');
      const client = new OpenAIClient();
      console.log('✅ OpenAI client initialized successfully');
    } catch (error) {
      console.log('❌ OpenAI client initialization failed:', error.message);
      return false;
    }
    
    // Summary
    console.log('\n📋 Pipeline Readiness Summary:');
    console.log('='.repeat(40));
    console.log(`✅ Database: Connected`);
    console.log(`✅ OpenAI: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Missing'}`);
    console.log(`📝 English Content: ${contentCount} phrases`);
    console.log(`🔤 Translations: ${translationRate.toFixed(1)}% complete`);
    console.log(`🏗️  Infrastructure: Ready`);
    
    if (translationRate < 100) {
      console.log('\n🚀 Ready to run: node scripts/generateTranslations.js');
    } else {
      console.log('\n🎯 Ready for exercises: node scripts/generateExercises.js');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Pipeline test failed:', error);
    return false;
  }
}

async function showContentSample() {
  console.log('\n📝 Sample Content (English -> Albanian):');
  console.log('-'.repeat(50));
  
  try {
    const sampleResult = await query(`
      SELECT lc.english_phrase, lc.target_phrase, s.name as skill_name
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al'
      ORDER BY s.position, l.position
      LIMIT 10
    `);
    
    sampleResult.rows.forEach((row, index) => {
      const translation = row.target_phrase || '[Not translated yet]';
      console.log(`${index + 1}. "${row.english_phrase}" -> "${translation}"`);
      console.log(`   Skill: ${row.skill_name}`);
    });
    
  } catch (error) {
    console.error('Error fetching sample content:', error);
  }
}

if (require.main === module) {
  testPipelineReadiness()
    .then(async (success) => {
      if (success) {
        await showContentSample();
        console.log('\n🎉 Pipeline test completed successfully');
        process.exit(0);
      } else {
        console.log('\n⚠️  Pipeline test revealed issues to address');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Pipeline test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPipelineReadiness };