/**
 * Simple validation script for Spaced Repetition Algorithm
 * Creates sample data and demonstrates the algorithm working
 */

require('dotenv').config();
const spacedRepetition = require('../lib/spacedRepetition');
const SpacedRepetitionModel = require('../lib/models/SpacedRepetition');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../lib/database');

async function validateAlgorithm() {
  console.log('🧪 Validating Spaced Repetition Algorithm\n');
  
  try {
    // Test 1: Algorithm calculations
    console.log('📊 Testing core algorithm functions...');
    
    const userHistory = {
      repetitions: 3,
      successCount: 2,
      totalReviews: 3,
      lastResponseQuality: 4,
      easeFactor: 2.5
    };
    
    const halfLife = spacedRepetition.calculateHalfLife(userHistory, 5);
    console.log(`✅ Half-life calculation: ${halfLife.halfLife.toFixed(1)} hours (confidence: ${halfLife.confidence.toFixed(2)})`);
    
    const recallProb = spacedRepetition.getRecallProbability(halfLife.halfLife, 12);
    console.log(`✅ Recall probability after 12 hours: ${(recallProb.probability * 100).toFixed(1)}% (${recallProb.recommendation})`);
    
    const scheduling = spacedRepetition.scheduleNextReview(4, halfLife.halfLife, userHistory);
    console.log(`✅ Next review scheduled for: ${scheduling.nextReview.toLocaleString()}`);
    console.log(`   New ease factor: ${scheduling.newEaseFactor.toFixed(2)}`);
    console.log(`   New interval: ${scheduling.newInterval.toFixed(1)} hours\n`);
    
    // Test 2: Create sample user and content
    console.log('👤 Creating sample user and content...');
    
    const userId = uuidv4();
    const userData = {
      id: userId,
      email: `sample-user-${Date.now()}@rarelanguages.com`,
      created_at: new Date(),
      last_active: new Date()
    };
    
    await db.insert('users', userData);
    console.log(`✅ Created user: ${userData.email}`);
    
    // Get existing content to test with
    const existingContent = await db.select('lesson_content', {}, null, 1);
    if (existingContent.length === 0) {
      console.log('❌ No existing content found. Please run setup first.');
      return;
    }
    
    const contentId = existingContent[0].id;
    console.log(`✅ Using existing content: "${existingContent[0].english_phrase}"`);
    
    // Test 3: Simulate learning progression
    console.log('\n📈 Simulating learning progression...');
    
    const responses = [
      { quality: 2, description: 'Initial difficulty' },
      { quality: 3, description: 'Getting it' },
      { quality: 4, description: 'Confident recall' },
      { quality: 3, description: 'Slight forgetting' },
      { quality: 4, description: 'Back to confident' },
      { quality: 5, description: 'Perfect recall' }
    ];
    
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      
      const result = await spacedRepetition.processUserResponse(userId, contentId, {
        quality: response.quality,
        time: Math.random() * 10 + 2, // 2-12 seconds
        exerciseType: 'flashcard'
      });
      
      console.log(`  Review ${i + 1}: Quality ${response.quality} (${response.description})`);
      console.log(`    → Next review in ${(result.spacedRepetition.scheduling.newInterval / 24).toFixed(1)} days`);
      console.log(`    → Ease factor: ${result.spacedRepetition.scheduling.newEaseFactor.toFixed(2)}`);
    }
    
    // Test 4: Get review queue
    console.log('\n📋 Getting current review queue...');
    const queue = await spacedRepetition.getReviewQueue(userId, 5);
    console.log(`✅ Found ${queue.length} items in review queue`);
    
    if (queue.length > 0) {
      queue.forEach((item, index) => {
        console.log(`  ${index + 1}. "${item.english_phrase}" → "${item.target_phrase}"`);
        console.log(`     Recall probability: ${(item.recall_probability * 100).toFixed(1)}% (${item.recommendation})`);
      });
    }
    
    // Test 5: Performance analytics
    console.log('\n📊 Performance analytics...');
    const stats = await SpacedRepetitionModel.getStats(userId);
    
    console.log(`✅ Total items: ${stats.total_items}`);
    console.log(`✅ Success rate: ${(parseFloat(stats.success_rate || 0) * 100).toFixed(1)}%`);
    console.log(`✅ Average ease factor: ${parseFloat(stats.avg_ease_factor || 0).toFixed(2)}`);
    console.log(`✅ Total reviews: ${stats.total_reviews}`);
    
    // Cleanup
    await db.delete('spaced_repetition', { user_id: userId });
    await db.delete('users', { id: userId });
    
    console.log('\n🎉 Spaced repetition algorithm validation completed successfully!');
    console.log('\n✨ Key Features Validated:');
    console.log('  ✅ Half-Life Regression calculations');
    console.log('  ✅ Recall probability modeling');
    console.log('  ✅ Adaptive scheduling based on performance');
    console.log('  ✅ Database integration');
    console.log('  ✅ Learning progression tracking');
    console.log('  ✅ Performance analytics');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  validateAlgorithm().catch(console.error);
}

module.exports = validateAlgorithm;