// Script to fix academic lesson names to learner-friendly ones
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixLessonNames() {
  try {
    console.log('🔍 Checking current lesson names...');
    
    // First, let's see what lessons we have
    const currentLessons = await pool.query(`
      SELECT l.id, l.name, s.name as skill_name, l.position
      FROM lessons l
      JOIN skills s ON l.skill_id = s.id
      WHERE s.language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
      ORDER BY s.position, l.position
      LIMIT 20
    `);
    
    console.log('Current lessons:');
    currentLessons.rows.forEach(lesson => {
      console.log(`${lesson.skill_name} - ${lesson.name}`);
    });
    
    console.log('\n🔧 Updating lesson names to learner-friendly versions...');
    
    // Delete one duplicate Numbers & Time skill first
    await pool.query(`
      DELETE FROM skills 
      WHERE name = 'Albanian 1: Unit 2 - Numbers & Time' 
      AND position = 3
      AND language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
    `);
    console.log('🗑️  Deleted duplicate Numbers & Time skill');
    
    // Update positions again
    const skills = await pool.query(`
      SELECT id, position 
      FROM skills 
      WHERE language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
      ORDER BY position, id
    `);
    
    for (let i = 0; i < skills.rows.length; i++) {
      const newPosition = i + 1;
      await pool.query(`
        UPDATE skills 
        SET position = $1 
        WHERE id = $2
      `, [newPosition, skills.rows[i].id]);
    }
    
    // Update lesson names based on patterns
    const lessonUpdates = [
      // Family & Greetings lessons
      { pattern: '%morphophonemic%', new: 'Family Vocabulary' },
      { pattern: '%phonological%', new: 'Basic Greetings' },
      { pattern: '%lexical%', new: 'Polite Expressions' },
      { pattern: '%foundation%', new: 'Family Members' },
      { pattern: '%sound%', new: 'Albanian Sounds' },
      
      // Numbers & Time lessons  
      { pattern: '%morphosyntactic%', new: 'Numbers 1-10' },
      { pattern: '%syntactic%', new: 'Days of the Week' },
      { pattern: '%grammatical%', new: 'Telling Time' },
      { pattern: '%structural%', new: 'Basic Grammar' },
      
      // Food & Drinks lessons
      { pattern: '%pragmatic%', new: 'Food Vocabulary' },
      { pattern: '%competence%', new: 'Ordering Food' },
      { pattern: '%cultural%', new: 'Meal Customs' },
      { pattern: '%integration%', new: 'Albanian Cuisine' },
      
      // Daily Activities lessons
      { pattern: '%discourse%', new: 'Daily Routines' },
      { pattern: '%advanced%', new: 'Making Plans' },
      { pattern: '%academic%', new: 'Describing Activities' },
      { pattern: '%proficiency%', new: 'Time Expressions' },
      
      // General academic terms
      { pattern: '%metalinguistic%', new: 'Language Awareness' },
      { pattern: '%cognitive%', new: 'Thinking Skills' },
      { pattern: '%monitoring%', new: 'Self Assessment' }
    ];
    
    for (const update of lessonUpdates) {
      const result = await pool.query(`
        UPDATE lessons 
        SET name = $1 
        WHERE name ILIKE $2
        AND skill_id IN (
          SELECT id FROM skills 
          WHERE language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
        )
      `, [update.new, update.pattern]);
      
      if (result.rowCount > 0) {
        console.log(`✅ Updated lessons matching "${update.pattern}" to "${update.new}"`);
      }
    }
    
    // Also update based on current academic names
    const directUpdates = [
      { old: 'Morphophonemic Processing and Lexical Access', new: 'Family Vocabulary' },
      { old: 'Phonological Awareness and Sound Mapping', new: 'Basic Greetings' },
      { old: 'Lexical Acquisition and Semantic Networks', new: 'Polite Expressions' },
      { old: 'Morphosyntactic Rule Application', new: 'Numbers 1-10' },
      { old: 'Syntactic Processing and Sentence Construction', new: 'Days of the Week' },
      { old: 'Grammatical Morpheme Acquisition', new: 'Telling Time' },
      { old: 'Pragmatic Inference and Context Integration', new: 'Food Vocabulary' },
      { old: 'Cultural Schema Activation', new: 'Meal Customs' },
      { old: 'Discourse Coherence and Textual Organization', new: 'Daily Routines' },
      { old: 'Academic Register and Formal Language Use', new: 'Making Plans' },
      { old: 'Metalinguistic Awareness Development', new: 'Language Awareness' },
      { old: 'Cognitive-Academic Language Proficiency', new: 'Thinking Skills' }
    ];
    
    for (const update of directUpdates) {
      const result = await pool.query(`
        UPDATE lessons 
        SET name = $1 
        WHERE name = $2
        AND skill_id IN (
          SELECT id FROM skills 
          WHERE language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
        )
      `, [update.new, update.old]);
      
      if (result.rowCount > 0) {
        console.log(`✅ Updated "${update.old}" to "${update.new}"`);
      }
    }
    
    console.log('\n🎯 Updated lesson names! Checking results...');
    
    // Check the results
    const updatedLessons = await pool.query(`
      SELECT l.id, l.name, s.name as skill_name, l.position
      FROM lessons l
      JOIN skills s ON l.skill_id = s.id
      WHERE s.language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
      ORDER BY s.position, l.position
      LIMIT 20
    `);
    
    console.log('\nUpdated lessons:');
    let currentSkill = '';
    updatedLessons.rows.forEach(lesson => {
      if (lesson.skill_name !== currentSkill) {
        console.log(`\n📚 ${lesson.skill_name}:`);
        currentSkill = lesson.skill_name;
      }
      console.log(`   ${lesson.position}: ${lesson.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing lesson names:', error);
  } finally {
    await pool.end();
  }
}

fixLessonNames();