// Final cleanup of remaining academic lesson names
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function finalCleanup() {
  try {
    console.log('🔧 Final cleanup of lesson names...');
    
    // Map remaining academic terms to friendly names
    const cleanupUpdates = [
      // Family & Greetings
      { old: 'Phoneme Discrimination Practice', new: 'Basic Greetings' },
      { old: 'Sound-Symbol Mapping', new: 'Family Members' },
      { old: 'Introduction to Gheg Albanian Sounds', new: 'Hello & Goodbye' },
      
      // Numbers & Time  
      { old: 'Complex Syntax', new: 'Days of the Week' },
      { old: 'Basic Sentence Structure', new: 'Telling Time' },
      { old: 'Introduction to Morphology', new: 'Numbers 11-20' },
      { old: 'Simple Sentence Construction', new: 'Time Expressions' },
      
      // Food & Drinks
      { old: 'Professional Communication', new: 'Ordering Food' },
      { old: 'Pragmatic Role-plays', new: 'Meal Customs' },
      
      // Daily Activities  
      { old: 'Using Cohesive Devices', new: 'Making Plans' },
      { old: 'Discourse Practice', new: 'Describing Activities' },
      
      // Home & Places
      { old: 'Introduction to Complex Sentences', new: 'Home Vocabulary' },
      { old: 'Using Subordinating Conjunctions', new: 'Places in Town' },
      { old: 'Complex Sentence Practice', new: 'Giving Directions' },
      
      // Past & Future
      { old: 'Formal vs. Informal Language', new: 'Past Tense' },
      { old: 'Register in Context', new: 'Future Plans' },
      { old: 'Register Awareness Practice', new: 'Storytelling' },
      
      // Opinions & Feelings
      { old: 'Analyzing Texts', new: 'Expressing Opinions' },
      { old: 'Evaluating Arguments', new: 'Talking About Feelings' },
      { old: 'Critical Analysis Practice', new: 'Agreeing & Disagreeing' },
      
      // Travel & Directions
      { old: 'Independent Practice', new: 'Travel Vocabulary' },
      { old: 'Self Assessment', new: 'Asking for Help' },
      { old: 'Language Portfolio', new: 'Transportation' }
    ];
    
    for (const update of cleanupUpdates) {
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
    
    // Remove any remaining duplicates with same names in same skill
    console.log('\n🔧 Removing duplicate lessons within same skills...');
    
    const duplicateCheck = await pool.query(`
      SELECT skill_id, name, array_agg(id) as lesson_ids, count(*) as count
      FROM lessons l
      WHERE skill_id IN (
        SELECT id FROM skills 
        WHERE language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
      )
      GROUP BY skill_id, name
      HAVING count(*) > 1
    `);
    
    for (const duplicate of duplicateCheck.rows) {
      // Keep the first lesson, delete the rest
      const idsToDelete = duplicate.lesson_ids.slice(1);
      for (const lessonId of idsToDelete) {
        await pool.query('DELETE FROM lessons WHERE id = $1', [lessonId]);
        console.log(`🗑️  Deleted duplicate lesson: ${duplicate.name}`);
      }
    }
    
    console.log('\n🎯 Final lesson structure:');
    
    // Show final results
    const finalLessons = await pool.query(`
      SELECT l.id, l.name, s.name as skill_name, l.position
      FROM lessons l
      JOIN skills s ON l.skill_id = s.id
      WHERE s.language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
      ORDER BY s.position, l.position
    `);
    
    let currentSkill = '';
    finalLessons.rows.forEach(lesson => {
      if (lesson.skill_name !== currentSkill) {
        console.log(`\n📚 ${lesson.skill_name}:`);
        currentSkill = lesson.skill_name;
      }
      console.log(`   ${lesson.position}: ${lesson.name}`);
    });
    
    console.log('\n✅ All lesson names updated to learner-friendly format!');
    
  } catch (error) {
    console.error('❌ Error in final cleanup:', error);
  } finally {
    await pool.end();
  }
}

finalCleanup();