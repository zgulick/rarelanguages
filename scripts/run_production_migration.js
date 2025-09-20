/**
 * Run Production Migration to Clean Academic Content
 *
 * This runs the database migration against the production database
 * to remove academic content and fix unit alignment
 */

const { query } = require('../lib/database');
const fs = require('fs');
const path = require('path');

async function runProductionMigration() {
    console.log('🚀 Running production migration to clean academic content...\n');

    try {
        // Read the migration SQL file
        const migrationPath = path.join(__dirname, '../migrations/011_clean_academic_content.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split the migration into individual statements (exclude BEGIN/COMMIT for Node.js)
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt && !stmt.toLowerCase().includes('begin') && !stmt.toLowerCase().includes('commit'));

        console.log(`📋 Executing ${statements.length} migration statements...\n`);

        let statementsExecuted = 0;
        let totalRowsAffected = 0;

        for (const [index, statement] of statements.entries()) {
            if (statement.trim()) {
                try {
                    console.log(`${index + 1}. Executing: ${statement.substring(0, 80)}...`);
                    const result = await query(statement);

                    if (result.rowCount !== undefined) {
                        console.log(`   ✅ Affected ${result.rowCount} rows`);
                        totalRowsAffected += result.rowCount;
                    } else {
                        console.log(`   ✅ Executed successfully`);
                    }
                    statementsExecuted++;
                } catch (error) {
                    console.error(`   ❌ Error: ${error.message}`);
                }
            }
        }

        console.log(`\n📊 Migration Summary:`);
        console.log(`   Statements executed: ${statementsExecuted}/${statements.length}`);
        console.log(`   Total rows affected: ${totalRowsAffected}`);

        // Verify the migration worked
        console.log('\n🔍 Verifying migration results...');

        const academicCheck = await query(`
            SELECT COUNT(*) as count
            FROM lesson_content
            WHERE cultural_context ILIKE '%academic%'
               OR cultural_context ILIKE '%morpholog%'
               OR english_phrase ILIKE '%inflection%'
        `);

        const numbersCheck = await query(`
            SELECT COUNT(*) as count
            FROM lesson_content
            WHERE grammar_category = 'numbers'
        `);

        const greetingsCheck = await query(`
            SELECT COUNT(*) as count
            FROM lesson_content
            WHERE grammar_category = 'greetings'
        `);

        console.log(`   Academic content remaining: ${academicCheck.rows[0].count} (should be 0)`);
        console.log(`   Numbers content: ${numbersCheck.rows[0].count}`);
        console.log(`   Greetings content: ${greetingsCheck.rows[0].count}`);

        const success = parseInt(academicCheck.rows[0].count) === 0;
        console.log(`\n🎉 Migration ${success ? 'SUCCESSFUL' : 'NEEDS REVIEW'}!`);

        if (success) {
            console.log('\n✅ The production database has been cleaned!');
            console.log('✅ Vercel should now serve clean content without academic jargon');
            console.log('✅ Try refreshing your browser to see the fixes');
        }

        return success;

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Main execution
if (require.main === module) {
    runProductionMigration()
        .then(success => {
            console.log(`\n🏁 Migration completed with status: ${success ? 'SUCCESS' : 'FAILED'}`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error.message);
            process.exit(1);
        });
}

module.exports = { runProductionMigration };