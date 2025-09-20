/**
 * Run Duplicates Fix on Production
 */

const { DuplicatesFixer } = require('./fix_duplicates_and_cleanup');

async function runProductionDuplicatesFix() {
    console.log('🚀 Running duplicates fix on PRODUCTION database for Vercel...\n');

    try {
        const fixer = new DuplicatesFixer();
        const success = await fixer.fixDuplicatesAndCleanup();

        if (success) {
            console.log('\n✅ Production duplicates fix completed successfully!');
            console.log('✅ No more duplicate cards - clean progression through lessons!');
            console.log('✅ No more inappropriate academic content!');
            console.log('✅ Proper categorization and ordering!');
        }

        return success;

    } catch (error) {
        console.error('❌ Production duplicates fix failed:', error);
        throw error;
    }
}

// Main execution
if (require.main === module) {
    runProductionDuplicatesFix()
        .then(success => {
            console.log(`\n🏁 Production duplicates fix completed: ${success ? 'SUCCESS' : 'FAILED'}`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error.message);
            process.exit(1);
        });
}

module.exports = { runProductionDuplicatesFix };