const { query, db } = require('../lib/database');
const { v4: uuidv4 } = require('uuid');

// Initial Gheg Albanian Skills Data
const GHEG_ALBANIAN_SKILLS = [
  {
    name: "Greetings & Basics",
    description: "Essential greetings and basic conversational phrases",
    position: 1,
    cefr_level: "A1",
    prerequisites: []
  },
  {
    name: "Family Members", 
    description: "Learn to talk about family relationships",
    position: 2,
    cefr_level: "A1",
    prerequisites: [1] // Requires Greetings & Basics
  },
  {
    name: "Numbers 1-10",
    description: "Basic counting and numbers",
    position: 3,
    cefr_level: "A1", 
    prerequisites: [1] // Requires Greetings & Basics
  },
  {
    name: "Days of the Week",
    description: "Days, dates, and time expressions",
    position: 4,
    cefr_level: "A1",
    prerequisites: [3] // Requires Numbers 1-10
  },
  {
    name: "Telling Time",
    description: "Hours, minutes, and time-related conversations", 
    position: 5,
    cefr_level: "A1",
    prerequisites: [3, 4] // Requires Numbers and Days
  },
  {
    name: "Basic Conversation",
    description: "Simple question and answer patterns",
    position: 6,
    cefr_level: "A1",
    prerequisites: [1, 2] // Requires Greetings and Family
  }
];

// Sample lessons for first skill (Greetings & Basics)
const SAMPLE_LESSONS = [
  {
    name: "Hello and Goodbye",
    position: 1,
    difficulty_level: 1,
    estimated_minutes: 5
  },
  {
    name: "Please and Thank You", 
    position: 2,
    difficulty_level: 2,
    estimated_minutes: 8
  },
  {
    name: "How Are You?",
    position: 3, 
    difficulty_level: 3,
    estimated_minutes: 10
  }
];

// Sample lesson content for first lesson
const SAMPLE_LESSON_CONTENT = [
  {
    english_phrase: "Hello",
    target_phrase: "Tungjatjeta",
    pronunciation_guide: "toon-jah-tyeh-tah",
    cultural_context: "Formal greeting used throughout the day",
    difficulty_score: 2,
    exercise_types: ["flashcard", "audio", "conversation"]
  },
  {
    english_phrase: "Good morning", 
    target_phrase: "Mirëmëngjes",
    pronunciation_guide: "mee-ruh-men-gyes",
    cultural_context: "Used until around 11 AM",
    difficulty_score: 3,
    exercise_types: ["flashcard", "audio"]
  },
  {
    english_phrase: "Goodbye",
    target_phrase: "Mirupafshim", 
    pronunciation_guide: "mee-roo-pahf-sheem",
    cultural_context: "Formal farewell, literally means 'see you well'",
    difficulty_score: 4,
    exercise_types: ["flashcard", "conversation"]
  },
  {
    english_phrase: "See you later",
    target_phrase: "Shihemi më vonë",
    pronunciation_guide: "shee-heh-mee muh vo-nuh",
    cultural_context: "Casual way to say goodbye to friends",
    difficulty_score: 5,
    exercise_types: ["flashcard", "conversation"]
  }
];

async function seedGhegAlbanian() {
  console.log('🌱 Starting Gheg Albanian data seeding...');
  
  try {
    // Get Gheg Albanian language ID
    const languageResult = await query(`
      SELECT id FROM languages WHERE code = 'gheg-al'
    `);
    
    if (languageResult.rows.length === 0) {
      throw new Error('Gheg Albanian language not found. Run database setup first.');
    }
    
    const languageId = languageResult.rows[0].id;
    console.log('✅ Found Gheg Albanian language:', languageId);
    
    // Insert skills
    console.log('📚 Inserting skills...');
    const skillIds = new Map(); // position -> id mapping
    
    for (const skill of GHEG_ALBANIAN_SKILLS) {
      // Convert prerequisite positions to UUIDs
      const prerequisiteIds = skill.prerequisites.map(pos => skillIds.get(pos)).filter(Boolean);
      
      const skillData = {
        id: uuidv4(),
        language_id: languageId,
        name: skill.name,
        description: skill.description,
        position: skill.position,
        prerequisites: JSON.stringify(prerequisiteIds),
        cefr_level: skill.cefr_level,
        is_active: true
      };
      
      const insertedSkill = await db.insert('skills', skillData);
      skillIds.set(skill.position, insertedSkill.id);
      
      console.log(`  ✅ Created skill: ${skill.name}`);
    }
    
    // Insert sample lessons for first skill (Greetings & Basics)
    console.log('📖 Inserting sample lessons...');
    const firstSkillId = skillIds.get(1);
    const lessonIds = [];
    
    for (const lesson of SAMPLE_LESSONS) {
      const lessonData = {
        id: uuidv4(),
        skill_id: firstSkillId,
        name: lesson.name,
        position: lesson.position,
        difficulty_level: lesson.difficulty_level,
        estimated_minutes: lesson.estimated_minutes,
        prerequisites: JSON.stringify([]), // No lesson prerequisites for now
        is_active: true
      };
      
      const insertedLesson = await db.insert('lessons', lessonData);
      lessonIds.push(insertedLesson.id);
      
      console.log(`  ✅ Created lesson: ${lesson.name}`);
    }
    
    // Insert sample content for first lesson
    console.log('📝 Inserting sample lesson content...');
    const firstLessonId = lessonIds[0];
    
    for (const content of SAMPLE_LESSON_CONTENT) {
      const contentData = {
        id: uuidv4(),
        lesson_id: firstLessonId,
        english_phrase: content.english_phrase,
        target_phrase: content.target_phrase,
        pronunciation_guide: content.pronunciation_guide,
        cultural_context: content.cultural_context,
        difficulty_score: content.difficulty_score,
        exercise_types: JSON.stringify(content.exercise_types)
      };
      
      await db.insert('lesson_content', contentData);
      console.log(`  ✅ Created content: ${content.english_phrase} → ${content.target_phrase}`);
    }
    
    console.log('🎉 Gheg Albanian data seeding completed successfully!');
    
    // Display summary
    const summary = await getSeedingSummary(languageId);
    console.log('\n📊 Seeding Summary:');
    console.log(`  Languages: 1 (Gheg Albanian)`);
    console.log(`  Skills: ${summary.skills}`);
    console.log(`  Lessons: ${summary.lessons}`);
    console.log(`  Content Items: ${summary.content}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

async function getSeedingSummary(languageId) {
  const skillsResult = await query(`
    SELECT COUNT(*) as count FROM skills WHERE language_id = $1
  `, [languageId]);
  
  const lessonsResult = await query(`
    SELECT COUNT(*) as count FROM lessons l
    JOIN skills s ON l.skill_id = s.id 
    WHERE s.language_id = $1
  `, [languageId]);
  
  const contentResult = await query(`
    SELECT COUNT(*) as count FROM lesson_content lc
    JOIN lessons l ON lc.lesson_id = l.id
    JOIN skills s ON l.skill_id = s.id
    WHERE s.language_id = $1
  `, [languageId]);
  
  return {
    skills: skillsResult.rows[0].count,
    lessons: lessonsResult.rows[0].count,
    content: contentResult.rows[0].count
  };
}

// Create a test user for development
async function createTestUser() {
  console.log('👤 Creating test user...');
  
  try {
    // Get Gheg Albanian language ID
    const languageResult = await query(`
      SELECT id FROM languages WHERE code = 'gheg-al'
    `);
    
    if (languageResult.rows.length === 0) {
      throw new Error('Gheg Albanian language not found');
    }
    
    const languageId = languageResult.rows[0].id;
    
    // Create test user
    const userData = {
      id: uuidv4(),
      email: 'test@rarelanguages.com',
      username: 'testuser',
      current_language: languageId,
      preferences: JSON.stringify({
        learning_style: 'visual',
        daily_goal_minutes: 20,
        audio_enabled: true
      })
    };
    
    const existingUser = await query(`
      SELECT id FROM users WHERE email = $1
    `, [userData.email]);
    
    if (existingUser.rows.length > 0) {
      console.log('  ℹ️  Test user already exists');
      return existingUser.rows[0].id;
    }
    
    const user = await db.insert('users', userData);
    console.log(`  ✅ Created test user: ${user.email}`);
    
    return user.id;
    
  } catch (error) {
    console.error('❌ Test user creation failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'gheg':
        await seedGhegAlbanian();
        break;
        
      case 'testuser':
        await createTestUser();
        break;
        
      case 'all':
        await seedGhegAlbanian();
        await createTestUser();
        break;
        
      default:
        console.log(`
Usage: node seedData.js <command>

Commands:
  gheg      - Seed Gheg Albanian skills and sample content
  testuser  - Create a test user for development
  all       - Run all seeding operations

Example:
  node scripts/seedData.js all
        `);
        break;
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Seeding failed:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = {
  seedGhegAlbanian,
  createTestUser
};

// Run if called directly
if (require.main === module) {
  main();
}