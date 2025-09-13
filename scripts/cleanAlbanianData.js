#!/usr/bin/env node

/**
 * Clean Albanian Course Data Script
 * Safely removes all existing Albanian course data to allow regeneration
 */

const { query } = require('../lib/database');

async function cleanAlbanianData() {
    console.log('🧹 Starting Albanian data cleanup...');
    
    try {
        // Get Albanian language ID first
        const languageResult = await query(`
            SELECT id FROM languages WHERE code = 'gheg-al'
        `);
        
        if (languageResult.rows.length === 0) {
            console.log('❌ No Albanian language found with code "gheg-al"');
            return;
        }
        
        const languageId = languageResult.rows[0].id;
        console.log(`🎯 Found Albanian language ID: ${languageId}`);

        // Delete in reverse dependency order to avoid foreign key violations
        console.log('🗑️  Deleting Albanian course data in safe order...');

        // 1. Delete spaced repetition data
        const spResult = await query(`
            DELETE FROM spaced_repetition WHERE content_id IN (
                SELECT lc.id FROM lesson_content lc
                JOIN lessons l ON lc.lesson_id = l.id
                JOIN skills s ON l.skill_id = s.id
                WHERE s.language_id = $1
            )
        `, [languageId]);
        console.log(`   ✅ Deleted ${spResult.rowCount} spaced repetition records`);

        // 2. Delete user assessments
        const uaResult = await query(`
            DELETE FROM user_assessments WHERE assessment_id IN (
                SELECT id FROM assessments WHERE course_id IN (
                    SELECT id FROM courses WHERE language_id = $1
                )
            )
        `, [languageId]);
        console.log(`   ✅ Deleted ${uaResult.rowCount} user assessment records`);

        // 3. Delete user progress
        const upResult = await query(`
            DELETE FROM user_progress WHERE course_id IN (
                SELECT id FROM courses WHERE language_id = $1
            )
        `, [languageId]);
        console.log(`   ✅ Deleted ${upResult.rowCount} user progress records`);

        // 4. Delete course progress
        const cpResult = await query(`
            DELETE FROM course_progress WHERE course_id IN (
                SELECT id FROM courses WHERE language_id = $1
            )
        `, [languageId]);
        console.log(`   ✅ Deleted ${cpResult.rowCount} course progress records`);

        // 5. Delete lesson content
        const lcResult = await query(`
            DELETE FROM lesson_content WHERE lesson_id IN (
                SELECT l.id FROM lessons l
                JOIN skills s ON l.skill_id = s.id
                WHERE s.language_id = $1
            )
        `, [languageId]);
        console.log(`   ✅ Deleted ${lcResult.rowCount} lesson content items`);

        // 6. Delete unit_skills relationships
        const usResult = await query(`
            DELETE FROM unit_skills WHERE unit_id IN (
                SELECT cu.id FROM course_units cu
                JOIN courses c ON cu.course_id = c.id
                WHERE c.language_id = $1
            )
        `, [languageId]);
        console.log(`   ✅ Deleted ${usResult.rowCount} unit-skill relationships`);

        // 7. Delete course_skills relationships
        const csResult = await query(`
            DELETE FROM course_skills WHERE course_id IN (
                SELECT id FROM courses WHERE language_id = $1
            )
        `, [languageId]);
        console.log(`   ✅ Deleted ${csResult.rowCount} course-skill relationships`);

        // 8. Delete assessments
        const aResult = await query(`
            DELETE FROM assessments WHERE course_id IN (
                SELECT id FROM courses WHERE language_id = $1
            )
        `, [languageId]);
        console.log(`   ✅ Deleted ${aResult.rowCount} assessment records`);

        // 9. Delete course units
        const cuResult = await query(`
            DELETE FROM course_units WHERE course_id IN (
                SELECT id FROM courses WHERE language_id = $1
            )
        `, [languageId]);
        console.log(`   ✅ Deleted ${cuResult.rowCount} course units`);

        // 10. Delete lessons
        const lResult = await query(`
            DELETE FROM lessons WHERE skill_id IN (
                SELECT id FROM skills WHERE language_id = $1
            )
        `, [languageId]);
        console.log(`   ✅ Deleted ${lResult.rowCount} lessons`);

        // 11. Delete skills
        const sResult = await query(`
            DELETE FROM skills WHERE language_id = $1
        `, [languageId]);
        console.log(`   ✅ Deleted ${sResult.rowCount} skills`);

        // 12. Delete courses
        const cResult = await query(`
            DELETE FROM courses WHERE language_id = $1
        `, [languageId]);
        console.log(`   ✅ Deleted ${cResult.rowCount} courses`);

        // Keep the language entry for regeneration
        console.log('   ℹ️  Keeping language entry for regeneration');

        console.log('🎉 Albanian data cleanup completed successfully!');
        console.log('📝 Ready to regenerate Albanian courses with new academic content');

    } catch (error) {
        console.error('❌ Albanian data cleanup failed:', error);
        throw error;
    }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
    cleanAlbanianData()
        .then(() => {
            console.log('✨ Cleanup script finished');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Cleanup script failed:', error);
            process.exit(1);
        });
}

module.exports = { cleanAlbanianData };