const { testConnection } = require('../lib/database');
const User = require('../lib/models/User');
const Curriculum = require('../lib/models/Curriculum');
const Progress = require('../lib/models/Progress');
const SpacedRepetition = require('../lib/models/SpacedRepetition');

// Test database functionality
async function runTests() {
  console.log('🧪 Starting database functionality tests...\n');

  try {
    // Test 1: Database connection
    console.log('Test 1: Database Connection');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connection successful\n');

    // Test 2: Language and curriculum data
    console.log('Test 2: Curriculum Data');
    const languages = await Curriculum.getLanguages();
    console.log(`✅ Found ${languages.length} languages`);
    
    if (languages.length > 0) {
      const ghegAlbanian = languages.find(lang => lang.code === 'gheg-al');
      if (!ghegAlbanian) {
        throw new Error('Gheg Albanian language not found');
      }
      console.log(`✅ Gheg Albanian language found: ${ghegAlbanian.name}`);

      const skills = await Curriculum.getSkillsByLanguage(ghegAlbanian.id);
      console.log(`✅ Found ${skills.length} skills for Gheg Albanian`);

      if (skills.length > 0) {
        const firstSkill = skills[0];
        const lessons = await Curriculum.getLessonsBySkill(firstSkill.id);
        console.log(`✅ Found ${lessons.length} lessons in first skill: ${firstSkill.name}`);

        if (lessons.length > 0) {
          const firstLesson = await Curriculum.getLessonById(lessons[0].id);
          console.log(`✅ Loaded lesson details: ${firstLesson.name}`);
          console.log(`✅ Found ${firstLesson.content.length} content items in first lesson`);
        }
      }
    }
    console.log();

    // Test 3: User creation and management
    console.log('Test 3: User Management');
    
    // Create test user
    const testUserData = {
      email: 'test-script@rarelanguages.com',
      username: 'test-script-user',
      current_language: languages[0]?.id,
      preferences: {
        daily_goal: 20,
        difficulty_preference: 'medium'
      }
    };

    // Check if user already exists
    let testUser = await User.findByEmail(testUserData.email);
    if (!testUser) {
      testUser = await User.create(testUserData);
      console.log(`✅ Created test user: ${testUser.email}`);
    } else {
      console.log(`✅ Found existing test user: ${testUser.email}`);
    }

    // Test user methods
    await testUser.updateLastActive();
    console.log('✅ Updated user last active timestamp');

    const progressSummary = await testUser.getProgressSummary();
    console.log(`✅ Got user progress summary - Lessons completed: ${progressSummary.lessons_completed}`);

    const nextLesson = await testUser.getNextLesson();
    if (nextLesson) {
      console.log(`✅ Found next lesson: ${nextLesson.lesson_name || nextLesson.name}`);
    }
    console.log();

    // Test 4: Progress tracking
    console.log('Test 4: Progress Tracking');
    
    if (languages.length > 0 && skills.length > 0) {
      const ghegAlbanian = languages.find(lang => lang.code === 'gheg-al');
      const skillProgress = await Progress.getSkillProgress(testUser.id, skills[0].id);
      console.log(`✅ Got skill progress for ${skills[0].name}: ${skillProgress?.completion_percentage || 0}% complete`);

      const languageProgress = await Progress.getLanguageProgress(testUser.id, ghegAlbanian.id);
      console.log(`✅ Got language progress - ${languageProgress.length} skills tracked`);

      // Test lesson progress if we have lessons
      const firstSkillLessons = await Curriculum.getLessonsBySkill(skills[0].id);
      if (firstSkillLessons.length > 0) {
        const lessonId = firstSkillLessons[0].id;
        
        // Start a lesson
        await Progress.startLesson(testUser.id, lessonId);
        console.log(`✅ Started lesson: ${firstSkillLessons[0].name}`);

        // Update progress
        await Progress.updateLessonProgress(testUser.id, lessonId, {
          total_attempts: 5,
          success_rate: 0.8,
          time_spent_minutes: 10
        });
        console.log('✅ Updated lesson progress');

        const lessonStats = await Progress.getLessonStats(testUser.id, lessonId);
        console.log(`✅ Retrieved lesson stats - Success rate: ${lessonStats.success_rate}`);
      }
    }
    console.log();

    // Test 5: Spaced Repetition
    console.log('Test 5: Spaced Repetition');
    
    if (languages.length > 0 && skills.length > 0) {
      const firstSkillLessons = await Curriculum.getLessonsBySkill(skills[0].id);
      if (firstSkillLessons.length > 0) {
        const lessonContent = await Curriculum.getContentByLesson(firstSkillLessons[0].id);
        if (lessonContent.length > 0) {
          const contentIds = lessonContent.map(content => content.id);
          
          // Initialize spaced repetition for content
          const initialized = await SpacedRepetition.initializeContent(testUser.id, contentIds);
          console.log(`✅ Initialized ${initialized} new spaced repetition items`);

          // Get items due for review
          const dueItems = await SpacedRepetition.getDueItems(testUser.id, 5);
          console.log(`✅ Found ${dueItems.length} items due for review`);

          // Record a review if items are available
          if (dueItems.length > 0) {
            await SpacedRepetition.recordReview(testUser.id, dueItems[0].content_id, 4); // Good performance
            console.log('✅ Recorded spaced repetition review');
          }

          // Get spaced repetition stats
          const srStats = await SpacedRepetition.getStats(testUser.id);
          console.log(`✅ Spaced repetition stats - Total items: ${srStats.total_items}, Due now: ${srStats.due_now}`);
        }
      }
    }
    console.log();

    // Test 6: Search functionality
    console.log('Test 6: Search Functionality');
    
    const searchResults = await Curriculum.searchContent('hello', languages[0]?.id, 5);
    console.log(`✅ Search for 'hello' returned ${searchResults.length} results`);
    
    if (searchResults.length > 0) {
      console.log(`   Example: "${searchResults[0].english_phrase}" → "${searchResults[0].target_phrase}"`);
    }
    console.log();

    // Test 7: Achievements and statistics
    console.log('Test 7: User Statistics');
    
    const achievements = await Progress.getAchievements(testUser.id);
    console.log(`✅ User has ${achievements.achievements.length} achievements`);
    if (achievements.achievements.length > 0) {
      console.log(`   Recent achievement: ${achievements.achievements[0].name}`);
    }

    const weeklyStats = await Progress.getTimeBasedStats(testUser.id, 'week');
    console.log(`✅ Weekly stats - Lessons studied: ${weeklyStats.lessons_studied}, Time: ${weeklyStats.total_time} min`);
    console.log();

    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Database connection');
    console.log('✅ Curriculum data loading');
    console.log('✅ User management');
    console.log('✅ Progress tracking');
    console.log('✅ Spaced repetition');
    console.log('✅ Search functionality');
    console.log('✅ Statistics and achievements');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Clean up test data
async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    const { query } = require('../lib/database');
    
    // Remove test user and related data
    await query(`
      DELETE FROM spaced_repetition WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE '%test-script%'
      )
    `);
    
    await query(`
      DELETE FROM user_progress WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE '%test-script%'
      )
    `);
    
    await query(`
      DELETE FROM user_sessions WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE '%test-script%'
      )
    `);
    
    await query(`
      DELETE FROM users WHERE email LIKE '%test-script%'
    `);
    
    console.log('✅ Test data cleanup completed');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'run':
        const success = await runTests();
        process.exit(success ? 0 : 1);
        break;
        
      case 'cleanup':
        await cleanupTestData();
        process.exit(0);
        break;
        
      case 'full':
        const testSuccess = await runTests();
        if (testSuccess) {
          await cleanupTestData();
        }
        process.exit(testSuccess ? 0 : 1);
        break;
        
      default:
        console.log(`
Usage: node testDatabase.js <command>

Commands:
  run     - Run all database tests
  cleanup - Clean up test data
  full    - Run tests and cleanup

Example:
  node scripts/testDatabase.js run
        `);
        break;
    }
    
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runTests, cleanupTestData };