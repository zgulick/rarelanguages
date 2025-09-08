#!/usr/bin/env node

/**
 * Test Content Generation Setup
 * Validates environment and tests a small batch before running full generation
 */

require('dotenv').config();
const { testConnection } = require('../lib/database');
const { ProgressTracker } = require('./progressTracker');
const { processBatch, getBatchStatistics } = require('./translationBatches');
const { OpenAIClient } = require('../lib/openai');

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    const connected = await testConnection();
    if (connected) {
      console.log('✅ Database connection successful');
      return true;
    } else {
      console.log('❌ Database connection failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection error:', error.message);
    return false;
  }
}

/**
 * Test OpenAI API connection
 */
async function testOpenAIConnection() {
  console.log('🤖 Testing OpenAI API connection...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OPENAI_API_KEY environment variable not found');
    return false;
  }
  
  try {
    const client = new OpenAIClient();
    
    // Test with a simple translation using the correct method
    const response = await client.makeRequest([{ 
      role: 'user', 
      content: 'Translate "Hello" to Albanian. Just return the Albanian word, nothing else.' 
    }], 'api_test', {
      max_tokens: 10,
      temperature: 0.3
    });
    
    const translation = response.content.trim();
    console.log(`✅ OpenAI API working - test translation: "Hello" → "${translation}"`);
    return true;
    
  } catch (error) {
    console.log('❌ OpenAI API error:', error.message);
    return false;
  }
}

/**
 * Test small batch translation
 */
async function testBatchTranslation() {
  console.log('📝 Testing batch translation with sample data...');
  
  const progress = new ProgressTracker();
  progress.setCurrentPhase('testing');
  
  // Small test batch
  const testBatch = {
    priority: 1,
    context: "Simple test phrases for verification",
    phrases: [
      "Hello",
      "Thank you",
      "Good morning"
    ]
  };
  
  try {
    const translations = await processBatch('test_batch', testBatch, progress);
    
    if (translations && translations.length === 3) {
      console.log('✅ Batch translation successful:');
      translations.forEach(t => {
        console.log(`   "${t.english}" → "${t.gheg || t.albanian}"`);
      });
      return true;
    } else {
      console.log('❌ Batch translation failed - incorrect response format');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Batch translation error:', error.message);
    return false;
  } finally {
    progress.cleanup();
  }
}

/**
 * Display generation statistics
 */
function displayGenerationStats() {
  console.log('📊 Content Generation Statistics:');
  console.log('═'.repeat(40));
  
  const stats = getBatchStatistics();
  
  console.log(`Total batches: ${stats.totalBatches}`);
  console.log(`Total phrases: ${stats.totalPhrases}`);
  console.log(`Priority batches: ${stats.priorityBatches}`);
  console.log(`Estimated cost: $${stats.estimatedCost.toFixed(2)}`);
  console.log(`Estimated time: ${stats.estimatedTime} minutes`);
  console.log('');
}

/**
 * Check environment configuration
 */
function checkEnvironmentConfig() {
  console.log('⚙️  Checking environment configuration...');
  
  const required = ['DATABASE_URL', 'OPENAI_API_KEY'];
  const optional = {
    'MAX_DAILY_COST': process.env.MAX_DAILY_COST || '20.00',
    'BATCH_SIZE': process.env.BATCH_SIZE || '25',
    'OPENAI_MODEL': process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
  };
  
  let allRequired = true;
  
  // Check required variables
  required.forEach(key => {
    if (process.env[key]) {
      console.log(`✅ ${key}: Set`);
    } else {
      console.log(`❌ ${key}: Missing (required)`);
      allRequired = false;
    }
  });
  
  // Show optional variables
  Object.entries(optional).forEach(([key, value]) => {
    console.log(`📋 ${key}: ${value}`);
  });
  
  console.log('');
  return allRequired;
}

/**
 * Main test runner
 */
async function runContentGenerationTests() {
  console.log('🧪 CONTENT GENERATION SETUP TEST');
  console.log('═'.repeat(50));
  console.log('');
  
  const tests = [
    { name: 'Environment Configuration', fn: checkEnvironmentConfig },
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'OpenAI API Connection', fn: testOpenAIConnection },
    { name: 'Batch Translation', fn: testBatchTranslation }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`🔍 Running: ${test.name}`);
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        console.log(`✅ ${test.name}: PASSED`);
      } else {
        failed++;
        console.log(`❌ ${test.name}: FAILED`);
      }
    } catch (error) {
      failed++;
      console.log(`❌ ${test.name}: ERROR - ${error.message}`);
    }
    console.log('');
  }
  
  // Display generation statistics
  displayGenerationStats();
  
  // Final results
  console.log('═'.repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('');
  
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('');
    console.log('🚀 Ready to run content generation:');
    console.log('   node scripts/runContentGeneration.js');
    console.log('');
    console.log('💡 Tips:');
    console.log('   - The process will take 30-45 minutes');
    console.log('   - Estimated cost: $8-15 total');
    console.log('   - Progress is auto-saved and resumable');
    console.log('   - Safe to run overnight');
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues above before running content generation.');
    console.log('');
    
    if (!process.env.DATABASE_URL) {
      console.log('💡 Set DATABASE_URL in your .env file');
    }
    if (!process.env.OPENAI_API_KEY) {
      console.log('💡 Set OPENAI_API_KEY in your .env file');
    }
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

// Run tests when script is executed directly
if (require.main === module) {
  runContentGenerationTests();
}

module.exports = {
  testDatabaseConnection,
  testOpenAIConnection,
  testBatchTranslation,
  runContentGenerationTests
};