/**
 * Run Content Replacement on Production
 *
 * Apply the content replacement to production database for Vercel
 */

const { ContentReplacer } = require('./replace_inappropriate_content');

async function runProductionContentReplacement() {
    console.log('🚀 Running content replacement on PRODUCTION database for Vercel...\n');

    try {
        const replacer = new ContentReplacer();
        const success = await replacer.replaceAllContent();

        if (success) {
            console.log('\n✅ Production content replacement completed successfully!');
            console.log('✅ Your Vercel app should now show appropriate beginner content');
            console.log('✅ Units 1-8 should have proper content for high school freshmen');
            console.log('✅ No more academic jargon - just simple, practical Albanian!');
        } else {
            console.log('\n⚠️ Content replacement completed but may need review');
        }

        return success;

    } catch (error) {
        console.error('❌ Production content replacement failed:', error);
        throw error;
    }
}

// Main execution
if (require.main === module) {
    runProductionContentReplacement()
        .then(success => {
            console.log(`\n🏁 Production content replacement completed: ${success ? 'SUCCESS' : 'FAILED'}`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error.message);
            process.exit(1);
        });
}

module.exports = { runProductionContentReplacement };