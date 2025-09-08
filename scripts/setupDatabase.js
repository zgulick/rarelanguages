const fs = require('fs').promises;
const path = require('path');
const { query, testConnection } = require('../lib/database');

// Migration runner
async function runMigrations() {
  console.log('🚀 Starting database setup...');
  
  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot connect to database. Please check your environment variables.');
    process.exit(1);
  }
  
  console.log('✅ Database connection successful');
  
  try {
    // Run table creation migration
    console.log('📋 Creating database tables...');
    const createTablesSQL = await fs.readFile(
      path.join(__dirname, '../migrations/001_create_tables.sql'),
      'utf8'
    );
    
    await query(createTablesSQL);
    console.log('✅ Database tables created successfully');
    
    // Run initial data seeding
    console.log('🌱 Seeding initial data...');
    const seedDataSQL = await fs.readFile(
      path.join(__dirname, '../migrations/002_seed_initial_data.sql'),
      'utf8'
    );
    
    await query(seedDataSQL);
    console.log('✅ Initial data seeded successfully');
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

// Verify setup by checking tables exist
async function verifySetup() {
  console.log('🔍 Verifying database setup...');
  
  try {
    // Check if tables exist
    const tables = [
      'languages', 'users', 'skills', 'lessons', 
      'lesson_content', 'user_progress', 'spaced_repetition', 'user_sessions'
    ];
    
    for (const table of tables) {
      const result = await query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = $1
      `, [table]);
      
      if (result.rows[0].count === '0') {
        throw new Error(`Table ${table} does not exist`);
      }
    }
    
    // Check if initial language data exists
    const languageResult = await query(`
      SELECT COUNT(*) as count FROM languages WHERE code = 'gheg-al'
    `);
    
    if (languageResult.rows[0].count === '0') {
      throw new Error('Initial Gheg Albanian language data not found');
    }
    
    console.log('✅ Database verification successful');
    console.log(`📊 Found ${tables.length} tables and initial language data`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    return false;
  }
}

// Reset database (development only)
async function resetDatabase() {
  console.log('⚠️  Resetting database (this will delete all data)...');
  
  try {
    // Drop tables in reverse dependency order
    const dropTablesSQL = `
      DROP TABLE IF EXISTS user_sessions CASCADE;
      DROP TABLE IF EXISTS spaced_repetition CASCADE;
      DROP TABLE IF EXISTS user_progress CASCADE;
      DROP TABLE IF EXISTS lesson_content CASCADE;
      DROP TABLE IF EXISTS lessons CASCADE;
      DROP TABLE IF EXISTS skills CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS languages CASCADE;
    `;
    
    await query(dropTablesSQL);
    console.log('✅ Database reset completed');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'setup':
        await runMigrations();
        await verifySetup();
        break;
        
      case 'verify':
        await verifySetup();
        break;
        
      case 'reset':
        if (process.env.NODE_ENV === 'production') {
          console.error('❌ Cannot reset database in production environment');
          process.exit(1);
        }
        await resetDatabase();
        break;
        
      default:
        console.log(`
Usage: node setupDatabase.js <command>

Commands:
  setup   - Create tables and seed initial data
  verify  - Check database setup is correct
  reset   - Reset database (development only)

Example:
  node scripts/setupDatabase.js setup
        `);
        break;
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = {
  runMigrations,
  verifySetup,
  resetDatabase
};

// Run if called directly
if (require.main === module) {
  main();
}