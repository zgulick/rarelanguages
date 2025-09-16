#!/usr/bin/env node

/**
 * Gheg Albanian Content Generation Runner
 * Background-safe script for populating database with real Albanian translations
 * 
 * Usage: node scripts/runContentGeneration.js
 * 
 * Features:
 * - Progress tracking with resume capability
 * - Cost monitoring and safety limits
 * - Real-time progress display
 * - Error recovery and retry logic
 * - Safe to run overnight
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { ProgressTracker } = require('./progressTracker');
const { processBatch, getTranslationBatches } = require('./translationBatches');
const { populateDatabase } = require('./databasePopulator');
const { GrammarEngineGenerator } = require('./grammarEngine');
// const { generatePronunciationGuides } = require('./generatePronunciation');
// const { generateExerciseVariations } = require('./generateExercises');
const { testConnection } = require('../lib/database');

const RESUME_STATE_FILE = path.join(__dirname, 'resumeState.json');
const MAX_DAILY_COST = parseFloat(process.env.MAX_DAILY_COST) || 20.00;

/**
 * Load previous progress state for resume capability
 */
async function loadResumeState() {
  try {
    const stateData = await fs.readFile(RESUME_STATE_FILE, 'utf8');
    const state = JSON.parse(stateData);
    console.log('🔄 Found previous progress state - resuming...');
    return state;
  } catch (error) {
    console.log('🚀 Starting fresh content generation...');
    return {};
  }
}

/**
 * Clean up resume state after successful completion
 */
async function cleanupResumeState() {
  try {
    await fs.unlink(RESUME_STATE_FILE);
  } catch (error) {
    // File doesn't exist or can't be deleted - that's fine
  }
}

/**
 * Execute with retry logic and error handling
 */
async function executeWithRetry(operation, operationName, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.log(`⚠️  ${operationName} attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === maxRetries) {
        throw new Error(`${operationName} failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Retrying ${operationName} in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Translate core vocabulary (Phase 1)
 */
async function translateVocabulary(progress) {
  progress.setCurrentPhase('vocabulary_translation');
  console.log('📝 Phase 1: Translating core vocabulary...');

  const batches = getTranslationBatches();
  const priorityBatches = Object.entries(batches)
    .sort(([,a], [,b]) => (a.priority || 10) - (b.priority || 10))
    .slice(0, 3); // Process top 3 priority batches first

  for (const [batchName, batchData] of priorityBatches) {
    console.log(`🔄 Processing ${batchName} (${batchData.phrases.length} phrases)...`);
    
    const translations = await executeWithRetry(
      () => processBatch(batchName, batchData, progress),
      `translation batch ${batchName}`
    );

    progress.logBatchComplete(batchName, translations);
    
    // Cost check
    if (progress.getTotalCost() > MAX_DAILY_COST * 0.5) {
      console.log('⚠️  Reached 50% of daily cost limit during vocabulary phase');
      break;
    }
  }

  console.log('✅ Vocabulary translation complete');
}

/**
 * Generate lesson content (Phase 2)
 */
async function generateLessonContent(progress) {
  progress.setCurrentPhase('lesson_content');
  console.log('📚 Phase 2: Generating lesson content...');

  // Get all remaining batches
  const batches = getTranslationBatches();
  const remainingBatches = Object.entries(batches)
    .filter(([batchName]) => !progress.isBatchCompleted(batchName));

  for (const [batchName, batchData] of remainingBatches) {
    console.log(`🔄 Processing lesson batch ${batchName}...`);
    
    const translations = await executeWithRetry(
      () => processBatch(batchName, batchData, progress),
      `lesson batch ${batchName}`
    );

    progress.logBatchComplete(batchName, translations);

    // Cost monitoring
    if (progress.getTotalCost() > MAX_DAILY_COST * 0.8) {
      console.log('⚠️  Reached 80% of daily cost limit - stopping lesson generation');
      break;
    }
  }

  console.log('✅ Lesson content generation complete');
}

/**
 * Create exercise variations (Phase 3)
 */
async function generateExerciseVariations(progress) {
  progress.setCurrentPhase('exercise_generation');
  console.log('🎯 Phase 3: Creating exercise variations...');

  // This integrates with your existing generateExercises.js
  await executeWithRetry(
    async () => {
      const { ExerciseGenerator } = require('./generateExercises');
      const generator = new ExerciseGenerator();
      
      // Get some Albanian topics to generate exercises for
      const topicsResult = await require('../lib/database').query(`
        SELECT id FROM topics 
        WHERE language_id = (SELECT id FROM languages WHERE code = 'gheg-al') 
        AND is_active = true 
        LIMIT 3
      `);
      
      for (const topic of topicsResult.rows) {
        await generator.generateExercisesForTopic(topic.id, 5); // Generate 5 exercises per topic
      }
    },
    'exercise generation'
  );

  console.log('✅ Exercise variations complete');
}

/**
 * Generate grammar engine (Phase 4)
 */
async function generateGrammarEngine(progress) {
  progress.setCurrentPhase('grammar_engine');
  console.log('🔧 Phase 4: Generating grammar engine...');

  await executeWithRetry(
    async () => {
      const generator = new GrammarEngineGenerator();
      await generator.generateGrammarEngine('gheg-al', progress);
    },
    'grammar engine generation'
  );

  console.log('✅ Grammar engine complete');
}

/**
 * Generate pronunciation guides (Phase 5)
 */
async function generatePronunciationGuides(progress) {
  progress.setCurrentPhase('pronunciation_guides');
  console.log('🗣️  Phase 5: Generating pronunciation guides...');

  await executeWithRetry(
    async () => {
      const { generatePronunciations } = require('./generatePronunciation');
      await generatePronunciations();
    },
    'pronunciation generation'
  );

  console.log('✅ Pronunciation guides complete');
}

/**
 * Main pipeline execution
 */
async function executeGenerationPipeline(progress) {
  // Phase 1: Translate core vocabulary (15 minutes)
  if (!progress.isCompleted('vocabulary_translation')) {
    await translateVocabulary(progress);
    progress.markCompleted('vocabulary_translation');
  } else {
    console.log('✅ Vocabulary translation already complete - skipping');
  }
  
  // Phase 2: Generate lesson content (20 minutes)  
  if (!progress.isCompleted('lesson_content')) {
    await generateLessonContent(progress);
    progress.markCompleted('lesson_content');
  } else {
    console.log('✅ Lesson content already complete - skipping');
  }
  
  // Phase 3: Create exercise variations (15 minutes)
  if (!progress.isCompleted('exercise_generation')) {
    await generateExerciseVariations(progress);
    progress.markCompleted('exercise_generation');
  } else {
    console.log('✅ Exercise generation already complete - skipping');
  }
  
  // Phase 4: Generate grammar engine (10 minutes)
  if (!progress.isCompleted('grammar_engine')) {
    await generateGrammarEngine(progress);
    progress.markCompleted('grammar_engine');
  } else {
    console.log('✅ Grammar engine already complete - skipping');
  }
  
  // Phase 5: Generate pronunciation guides (5 minutes)
  if (!progress.isCompleted('pronunciation_guides')) {
    await generatePronunciationGuides(progress);
    progress.markCompleted('pronunciation_guides');
  } else {
    console.log('✅ Pronunciation guides already complete - skipping');
  }
  
  // Phase 6: Populate database (2 minutes)
  if (!progress.isCompleted('database_population')) {
    await populateDatabase(progress);
    progress.markCompleted('database_population');
  } else {
    console.log('✅ Database population already complete - skipping');
  }
}

/**
 * Main content generation runner
 */
async function runContentGeneration() {
  console.log('🇦🇱 GHEG ALBANIAN CONTENT GENERATION');
  console.log('═'.repeat(50));
  console.log('📝 This will take 30-45 minutes and cost ~$8-15');
  console.log('💤 Safe to run overnight - progress is saved automatically');
  console.log('🔄 Resumable if interrupted');
  console.log('');

  try {
    // Check database connection
    console.log('🔌 Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed. Check your DATABASE_URL environment variable.');
    }
    console.log('✅ Database connection successful');
    console.log('');

    // Check OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    console.log('✅ OpenAI API key found');
    console.log('');

    // 1. Check for previous progress
    const resumeState = await loadResumeState();
    
    // 2. Initialize progress tracker
    const progress = new ProgressTracker(resumeState);
    
    // 3. Run generation pipeline
    await executeGenerationPipeline(progress);
    
    // 4. Completion cleanup and notification
    await cleanupResumeState();
    progress.cleanup();
    
    console.clear();
    console.log('🎉 CONTENT GENERATION COMPLETE!');
    console.log('═'.repeat(50));
    console.log('✅ Your RareLanguages app is now ready with real Albanian content!');
    console.log('💰 Total cost: $' + progress.getTotalCost().toFixed(2));
    console.log('⏱️  Total time: ' + Math.floor((Date.now() - progress.getStartTime()) / 1000 / 60) + ' minutes');
    console.log('📝 Translations completed: ' + progress.getTranslationCount());
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Start your app: npm run dev');
    console.log('   2. Visit http://localhost:3000');
    console.log('   3. Click "Continue Your Lesson" to see real Albanian content!');
    console.log('');
    console.log('🇦🇱 Ready to connect with your Albanian family through language!');
    
  } catch (error) {
    console.error('❌ Content generation failed:', error.message);
    console.log('');
    console.log('📄 Progress has been saved automatically');
    console.log('🔄 Run the same command to resume: node scripts/runContentGeneration.js');
    console.log('');
    
    if (error.message.includes('cost')) {
      console.log('💡 Cost limit reached - adjust MAX_DAILY_COST in .env if needed');
    } else if (error.message.includes('database')) {
      console.log('💡 Check your DATABASE_URL and database connection');
    } else if (error.message.includes('OpenAI') || error.message.includes('API')) {
      console.log('💡 Check your OPENAI_API_KEY and API limits');
    }
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Process interrupted - progress has been saved');
  console.log('🔄 Run again to resume: node scripts/runContentGeneration.js');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Process terminated - progress has been saved');
  console.log('🔄 Run again to resume: node scripts/runContentGeneration.js');
  process.exit(0);
});

// Run immediately when script is executed
if (require.main === module) {
  runContentGeneration();
}

module.exports = { runContentGeneration, executeGenerationPipeline };