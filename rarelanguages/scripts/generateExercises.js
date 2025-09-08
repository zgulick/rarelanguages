/**
 * Exercise Generation Script
 * Phase 1.3: Generate multiple exercise types for translated content
 */

require('dotenv').config();
const { query } = require('../lib/database');
const { OpenAIClient } = require('../lib/openai');
const config = require('../config/contentGeneration');
const fs = require('fs').promises;
const path = require('path');

class ExerciseGenerator {
  constructor() {
    this.openaiClient = new OpenAIClient();
    this.progressFile = path.join(config.progress.progressDirectory, 'exercises.json');
    this.completedExercises = new Set();
  }

  async getTranslatedContent() {
    console.log('📝 Fetching translated content for exercise generation...');
    
    const result = await query(`
      SELECT lc.id, lc.english_phrase, lc.target_phrase, lc.cultural_context,
             l.name as lesson_name, s.name as skill_name, s.cefr_level,
             lc.difficulty_score, lc.exercise_types
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al' 
        AND lc.target_phrase IS NOT NULL
        AND lc.english_phrase IS NOT NULL
      ORDER BY s.position, l.position, lc.id
    `);
    
    console.log(`✅ Found ${result.rows.length} translated phrases ready for exercises`);
    return result.rows;
  }

  async getExistingExercises() {
    console.log('🔍 Checking existing exercises...');
    
    const result = await query(`
      SELECT DISTINCT content_id FROM exercise_variations
    `);
    
    const existingIds = new Set(result.rows.map(row => row.content_id));
    console.log(`📊 Found ${existingIds.size} content items with existing exercises`);
    
    return existingIds;
  }

  async saveProgress(exercises, step = 'exercises') {
    try {
      await fs.mkdir(config.progress.progressDirectory, { recursive: true });
      await fs.writeFile(
        this.progressFile,
        JSON.stringify({
          step,
          completed: exercises.length,
          exercises,
          timestamp: new Date().toISOString(),
          costSummary: this.openaiClient.getCostSummary()
        }, null, 2)
      );
    } catch (error) {
      console.error('⚠️  Failed to save progress:', error.message);
    }
  }

  async loadProgress() {
    try {
      const data = await fs.readFile(this.progressFile, 'utf8');
      const progress = JSON.parse(data);
      console.log(`📂 Loaded previous progress: ${progress.completed} exercises completed`);
      
      progress.exercises.forEach(ex => {
        this.completedExercises.add(ex.content_id);
      });
      
      return progress;
    } catch (error) {
      console.log('📋 No previous progress found, starting fresh');
      return null;
    }
  }

  determineExerciseTypes(content) {
    // Base exercise types for all content
    let exerciseTypes = ['flashcard', 'multiple_choice'];
    
    // Add exercise types based on content characteristics
    const phrase = content.english_phrase.toLowerCase();
    const cefr = content.cefr_level;
    
    // Conversation exercises for interactive phrases
    if (phrase.includes('how are you') || phrase.includes('hello') || 
        phrase.includes('thank you') || phrase.includes('excuse me')) {
      exerciseTypes.push('conversation');
    }
    
    // Fill in the blank for sentence-like content
    if (content.english_phrase.split(' ').length > 3) {
      exerciseTypes.push('fill_blank');
    }
    
    // Audio repeat for pronunciation practice (all content)
    exerciseTypes.push('audio_repeat');
    
    // Cultural notes for content with cultural context
    if (content.cultural_context && content.cultural_context.length > 10) {
      exerciseTypes.push('cultural_note');
    }
    
    // Advanced exercises for higher CEFR levels
    if (cefr === 'A2' || cefr === 'B1') {
      if (!exerciseTypes.includes('conversation')) {
        exerciseTypes.push('conversation');
      }
    }
    
    return exerciseTypes;
  }

  async generateExercisesForContent(content) {
    const exerciseTypes = this.determineExerciseTypes(content);
    console.log(`🎯 Generating ${exerciseTypes.length} exercise types for: "${content.english_phrase}"`);
    
    try {
      const response = await this.openaiClient.generateExercises(
        content.english_phrase,
        content.target_phrase,
        exerciseTypes,
        'exercise_generation'
      );
      
      const exerciseData = JSON.parse(response.content);
      
      if (!exerciseData.exercises || !Array.isArray(exerciseData.exercises)) {
        throw new Error('Invalid exercise format returned from API');
      }
      
      // Process and store exercises
      const exercisesToStore = [];
      
      for (const exercise of exerciseData.exercises) {
        if (!exercise.type || !exercise.data) {
          console.log(`⚠️  Skipping invalid exercise: ${JSON.stringify(exercise)}`);
          continue;
        }
        
        exercisesToStore.push({
          content_id: content.id,
          exercise_type: exercise.type,
          exercise_data: exercise.data,
          difficulty_level: this.calculateDifficultyLevel(exercise, content),
          estimated_duration_seconds: this.estimateDuration(exercise.type),
          validated: false
        });
      }
      
      console.log(`✅ Generated ${exercisesToStore.length} valid exercises`);
      return exercisesToStore;
      
    } catch (error) {
      console.error(`❌ Failed to generate exercises for "${content.english_phrase}":`, error.message);
      throw error;
    }
  }

  calculateDifficultyLevel(exercise, content) {
    let difficulty = content.difficulty_score || 5;
    
    // Adjust based on exercise type
    const typeDifficulty = {
      'flashcard': 0,
      'multiple_choice': 1,
      'fill_blank': 2,
      'audio_repeat': 1,
      'conversation': 3,
      'cultural_note': 0
    };
    
    difficulty += typeDifficulty[exercise.type] || 0;
    
    // Adjust for CEFR level
    if (content.cefr_level === 'A1') difficulty -= 1;
    if (content.cefr_level === 'A2') difficulty += 0;
    if (content.cefr_level === 'B1') difficulty += 2;
    
    return Math.max(1, Math.min(10, difficulty));
  }

  estimateDuration(exerciseType) {
    const durations = {
      'flashcard': 15,
      'multiple_choice': 30,
      'fill_blank': 45,
      'audio_repeat': 60,
      'conversation': 90,
      'cultural_note': 30
    };
    
    return durations[exerciseType] || 30;
  }

  async storeExercises(exercises) {
    console.log(`💾 Storing ${exercises.length} exercises in database...`);
    
    let stored = 0;
    for (const exercise of exercises) {
      try {
        await query(`
          INSERT INTO exercise_variations 
          (content_id, exercise_type, exercise_data, difficulty_level, estimated_duration_seconds, validated)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          exercise.content_id,
          exercise.exercise_type,
          JSON.stringify(exercise.exercise_data),
          exercise.difficulty_level,
          exercise.estimated_duration_seconds,
          exercise.validated
        ]);
        
        stored++;
      } catch (error) {
        console.error(`⚠️  Failed to store exercise:`, error.message);
      }
    }
    
    console.log(`✅ Stored ${stored}/${exercises.length} exercises`);
    return stored;
  }

  async processAllExercises() {
    console.log('🚀 Starting exercise generation process...');
    
    // Load previous progress
    const previousProgress = await this.loadProgress();
    let allExercises = previousProgress ? previousProgress.exercises : [];
    
    // Get translated content
    const allContent = await this.getTranslatedContent();
    const existingExercises = await this.getExistingExercises();
    
    // Filter content that needs exercises
    const remainingContent = allContent.filter(content => 
      !existingExercises.has(content.id) && 
      !this.completedExercises.has(content.id)
    );
    
    if (remainingContent.length === 0) {
      console.log('🎉 All content already has exercises!');
      return allExercises;
    }
    
    console.log(`📝 Processing ${remainingContent.length} content items for exercise generation`);
    
    // Process in batches to manage API costs
    const batchSize = Math.min(10, config.batchConfig.translationBatchSize / 2); // Smaller batches for exercises
    
    for (let i = 0; i < remainingContent.length; i += batchSize) {
      const batch = remainingContent.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(remainingContent.length/batchSize)} (${batch.length} items)`);
      
      const batchExercises = [];
      
      for (const content of batch) {
        try {
          const exercises = await this.generateExercisesForContent(content);
          await this.storeExercises(exercises);
          
          batchExercises.push({
            content_id: content.id,
            english_phrase: content.english_phrase,
            exercise_count: exercises.length,
            exercises: exercises
          });
          
          // Small delay between individual items
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`❌ Failed to process "${content.english_phrase}":`, error.message);
          // Continue with other content items
        }
      }
      
      allExercises = allExercises.concat(batchExercises);
      
      // Save progress periodically
      await this.saveProgress(allExercises);
      
      // Check budget
      const costSummary = this.openaiClient.getCostSummary();
      console.log(`💰 Current cost: $${costSummary.totalCost.toFixed(2)}`);
      
      if (costSummary.totalCost > config.generation.maxDailyCost * 0.9) {
        console.log(`⚠️  Approaching budget limit, stopping exercise generation`);
        break;
      }
    }
    
    // Final save
    await this.saveProgress(allExercises, 'completed');
    
    console.log('\n🎉 Exercise generation completed!');
    console.log(`✅ Total content items processed: ${allExercises.length}`);
    
    const costSummary = this.openaiClient.getCostSummary();
    console.log(`💰 Total cost: $${costSummary.totalCost.toFixed(2)}`);
    
    return allExercises;
  }
}

async function generateExercises() {
  const generator = new ExerciseGenerator();
  
  try {
    const exercises = await generator.processAllExercises();
    
    // Validate results
    const validation = await validateExercises();
    console.log(`✨ Validation: ${validation.contentWithExercises} content items have exercises`);
    
    return exercises;
    
  } catch (error) {
    console.error('❌ Exercise generation failed:', error);
    throw error;
  }
}

async function validateExercises() {
  console.log('🔍 Validating exercise generation results...');
  
  const result = await query(`
    SELECT 
      COUNT(DISTINCT lc.id) as total_content,
      COUNT(DISTINCT ev.content_id) as content_with_exercises,
      COUNT(ev.id) as total_exercises,
      COUNT(DISTINCT ev.exercise_type) as exercise_types
    FROM lesson_content lc
    JOIN lessons l ON lc.lesson_id = l.id
    JOIN skills s ON l.skill_id = s.id
    JOIN languages lang ON s.language_id = lang.id
    LEFT JOIN exercise_variations ev ON lc.id = ev.content_id
    WHERE lang.code = 'gheg-al' AND lc.target_phrase IS NOT NULL
  `);
  
  const stats = result.rows[0];
  const coverage = (parseInt(stats.content_with_exercises) / parseInt(stats.total_content)) * 100;
  
  console.log(`📊 Exercise Statistics:`);
  console.log(`  Total translated content: ${stats.total_content}`);
  console.log(`  Content with exercises: ${stats.content_with_exercises}`);
  console.log(`  Total exercises: ${stats.total_exercises}`);
  console.log(`  Unique exercise types: ${stats.exercise_types}`);
  console.log(`  Coverage: ${coverage.toFixed(1)}%`);
  
  return {
    totalContent: parseInt(stats.total_content),
    contentWithExercises: parseInt(stats.content_with_exercises),
    totalExercises: parseInt(stats.total_exercises),
    exerciseTypes: parseInt(stats.exercise_types),
    coverage: coverage.toFixed(1)
  };
}

if (require.main === module) {
  generateExercises()
    .then((exercises) => {
      console.log('🎯 Exercise generation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Exercise generation failed:', error);
      process.exit(1);
    });
}

module.exports = {
  generateExercises,
  validateExercises,
  ExerciseGenerator
};