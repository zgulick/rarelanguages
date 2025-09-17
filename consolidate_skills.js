// Script to consolidate and clean up skills
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function consolidateSkills() {
  try {
    console.log('🔍 Consolidating and cleaning up skills...');
    
    // Delete duplicate "Albanian 1: Unit 1 - Family & Greetings" skills, keeping only the first one
    const familySkills = await pool.query(`
      SELECT id FROM skills 
      WHERE name = 'Albanian 1: Unit 1 - Family & Greetings'
      AND language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
      ORDER BY id
    `);
    
    if (familySkills.rows.length > 1) {
      // Keep the first one, delete the rest
      const skillsToDelete = familySkills.rows.slice(1).map(row => row.id);
      
      for (const skillId of skillsToDelete) {
        await pool.query('DELETE FROM skills WHERE id = $1', [skillId]);
        console.log(`🗑️  Deleted duplicate Family & Greetings skill (ID: ${skillId})`);
      }
    }
    
    // Delete duplicate "Albanian 1: Unit 4 - Daily Activities" skills
    const dailySkills = await pool.query(`
      SELECT id FROM skills 
      WHERE name = 'Albanian 1: Unit 4 - Daily Activities'
      AND language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
      ORDER BY id
    `);
    
    if (dailySkills.rows.length > 1) {
      const skillsToDelete = dailySkills.rows.slice(1).map(row => row.id);
      
      for (const skillId of skillsToDelete) {
        await pool.query('DELETE FROM skills WHERE id = $1', [skillId]);
        console.log(`🗑️  Deleted duplicate Daily Activities skill (ID: ${skillId})`);
      }
    }
    
    // Update remaining academic skills to friendly names
    const remainingUpdates = [
      {
        searchName: 'Core Grammatical Structures',
        newName: 'Albanian 1: Unit 2 - Numbers & Time',
        newDescription: 'Count from 1-20 and talk about time and days',
        position: 2
      },
      {
        searchName: 'Complex Sentence Structures and Subordination',
        newName: 'Albanian 1: Unit 5 - Home & Places', 
        newDescription: 'Talk about where you live and places in the city',
        position: 5
      },
      {
        searchName: 'Register Awareness',
        newName: 'Albanian 1: Unit 6 - Past & Future',
        newDescription: 'Tell stories about the past and make future plans',
        position: 6
      },
      {
        searchName: 'Critical Thinking through Target Language',
        newName: 'Albanian 1: Unit 7 - Opinions & Feelings',
        newDescription: 'Express your opinions and talk about emotions',
        position: 7
      },
      {
        searchName: 'Independent Language Use and Self-Monitoring',
        newName: 'Albanian 1: Unit 8 - Travel & Directions',
        newDescription: 'Ask for directions and talk about travel plans',
        position: 8
      }
    ];
    
    for (const update of remainingUpdates) {
      const result = await pool.query(`
        UPDATE skills 
        SET name = $1, description = $2, position = $3
        WHERE name = $4
        AND language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
      `, [update.newName, update.newDescription, update.position, update.searchName]);
      
      if (result.rowCount > 0) {
        console.log(`✅ Updated "${update.searchName}" to "${update.newName}"`);
      }
    }
    
    // Fix positions to be sequential 
    console.log('\n🔧 Fixing skill positions to be sequential...');
    
    const skills = await pool.query(`
      SELECT id, name, position 
      FROM skills 
      WHERE language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
      ORDER BY position, id
    `);
    
    for (let i = 0; i < skills.rows.length; i++) {
      const newPosition = i + 1;
      if (skills.rows[i].position !== newPosition) {
        await pool.query(`
          UPDATE skills 
          SET position = $1 
          WHERE id = $2
        `, [newPosition, skills.rows[i].id]);
        console.log(`📍 Updated position for "${skills.rows[i].name}" to ${newPosition}`);
      }
    }
    
    console.log('\n🎯 Final skill structure:');
    
    // Show final results
    const finalSkills = await pool.query(`
      SELECT id, name, description, position 
      FROM skills 
      WHERE language_id = (SELECT id FROM languages WHERE code = 'gheg-al')
      ORDER BY position
    `);
    
    finalSkills.rows.forEach(skill => {
      console.log(`${skill.position}: ${skill.name}`);
      console.log(`   Description: ${skill.description}\n`);
    });
    
    console.log('✅ Skills successfully updated to learner-friendly format!');
    
  } catch (error) {
    console.error('❌ Error consolidating skills:', error);
  } finally {
    await pool.end();
  }
}

consolidateSkills();