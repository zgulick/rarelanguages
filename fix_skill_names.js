// Script to fix academic skill names to learner-friendly ones
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixSkillNames() {
  try {
    console.log('🔍 Checking current skill names...');
    
    // First, let's see what skills we have
    const currentSkills = await pool.query(`
      SELECT id, name, description, position 
      FROM skills 
      WHERE language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
      ORDER BY position
    `);
    
    console.log('Current skills:');
    currentSkills.rows.forEach(skill => {
      console.log(`${skill.position}: ${skill.name}`);
    });
    
    console.log('\n🔧 Updating skill names to learner-friendly versions...');
    
    // Update skill names to learner-friendly versions
    const updates = [
      {
        searchPattern: '%phonological%',
        newName: 'Albanian 1: Unit 1 - Family & Greetings',
        newDescription: 'Learn to introduce family members and greet people politely',
        position: 1
      },
      {
        searchPattern: '%lexical%',
        newName: 'Albanian 1: Unit 1 - Family & Greetings', 
        newDescription: 'Learn to introduce family members and greet people politely',
        position: 1
      },
      {
        searchPattern: '%morphosyntactic%',
        newName: 'Albanian 1: Unit 2 - Numbers & Time',
        newDescription: 'Count from 1-20 and talk about time and days',
        position: 2
      },
      {
        searchPattern: '%syntactic%',
        newName: 'Albanian 1: Unit 2 - Numbers & Time',
        newDescription: 'Count from 1-20 and talk about time and days', 
        position: 2
      },
      {
        searchPattern: '%pragmatic%',
        newName: 'Albanian 1: Unit 3 - Food & Drinks',
        newDescription: 'Order food, express preferences, and understand meal customs',
        position: 3
      },
      {
        searchPattern: '%cultural%',
        newName: 'Albanian 1: Unit 3 - Food & Drinks',
        newDescription: 'Order food, express preferences, and understand meal customs',
        position: 3
      },
      {
        searchPattern: '%discourse%',
        newName: 'Albanian 1: Unit 4 - Daily Activities',
        newDescription: 'Describe your daily routine and make plans',
        position: 4
      },
      {
        searchPattern: '%academic%',
        newName: 'Albanian 1: Unit 4 - Daily Activities',
        newDescription: 'Describe your daily routine and make plans',
        position: 4
      },
      {
        searchPattern: '%metalinguistic%',
        newName: 'Albanian 1: Unit 5 - Home & Places',
        newDescription: 'Talk about where you live and places in the city',
        position: 5
      },
      {
        searchPattern: '%cognitive%',
        newName: 'Albanian 1: Unit 6 - Past & Future',
        newDescription: 'Tell stories about the past and make future plans',
        position: 6
      }
    ];
    
    for (const update of updates) {
      const result = await pool.query(`
        UPDATE skills 
        SET name = $1, description = $2, position = $3
        WHERE name ILIKE $4 
        AND language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
      `, [update.newName, update.newDescription, update.position, update.searchPattern]);
      
      if (result.rowCount > 0) {
        console.log(`✅ Updated skill matching "${update.searchPattern}" to "${update.newName}"`);
      }
    }
    
    // Also update any remaining academic-sounding skills directly
    const directUpdates = [
      {
        oldName: 'Phonological and Lexical Foundations',
        newName: 'Albanian 1: Unit 1 - Family & Greetings',
        newDescription: 'Learn to introduce family members and greet people politely'
      },
      {
        oldName: 'Morphosyntactic Development and Communication Patterns', 
        newName: 'Albanian 1: Unit 2 - Numbers & Time',
        newDescription: 'Count from 1-20 and talk about time and days'
      },
      {
        oldName: 'Pragmatic Competence and Cultural Integration',
        newName: 'Albanian 1: Unit 3 - Food & Drinks', 
        newDescription: 'Order food, express preferences, and understand meal customs'
      },
      {
        oldName: 'Advanced Discourse and Academic Language Proficiency',
        newName: 'Albanian 1: Unit 4 - Daily Activities',
        newDescription: 'Describe your daily routine and make plans'
      }
    ];
    
    for (const update of directUpdates) {
      const result = await pool.query(`
        UPDATE skills 
        SET name = $1, description = $2
        WHERE name = $3
        AND language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
      `, [update.newName, update.newDescription, update.oldName]);
      
      if (result.rowCount > 0) {
        console.log(`✅ Updated "${update.oldName}" to "${update.newName}"`);
      }
    }
    
    console.log('\n🎯 Updated skill names! Checking results...');
    
    // Check the results
    const updatedSkills = await pool.query(`
      SELECT id, name, description, position 
      FROM skills 
      WHERE language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
      ORDER BY position
    `);
    
    console.log('\nUpdated skills:');
    updatedSkills.rows.forEach(skill => {
      console.log(`${skill.position}: ${skill.name}`);
      console.log(`   Description: ${skill.description}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing skill names:', error);
  } finally {
    await pool.end();
  }
}

fixSkillNames();