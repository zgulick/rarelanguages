/**
 * Audit Skill/Lesson Name Alignment
 *
 * Checks if skill names match their actual content
 */

const { query } = require('../lib/database');

async function auditAlignment() {
    try {
        // Check skills that mention specific content vs actual content
        const alignment = await query(`
            SELECT
                s.name as skill_name,
                s.description,
                l.name as lesson_name,
                string_agg(DISTINCT lc.grammar_category, ', ' ORDER BY lc.grammar_category) as actual_categories,
                COUNT(lc.id) as content_count
            FROM skills s
            JOIN lessons l ON s.id = l.skill_id AND l.is_active = true
            LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
            WHERE s.is_active = true
            GROUP BY s.id, s.name, s.description, l.id, l.name
            ORDER BY s.position, l.position
        `);

        console.log('SKILL/CONTENT ALIGNMENT AUDIT:');
        let issues = 0;
        const problemSkills = [];

        alignment.rows.forEach(row => {
            const skillLower = row.skill_name.toLowerCase();
            const categories = row.actual_categories || '';

            // Check for misalignments
            let hasIssue = false;
            let issueType = '';

            if ((skillLower.includes('numbers') || skillLower.includes('time')) &&
                !categories.includes('numbers') && !categories.includes('time')) {
                hasIssue = true;
                issueType = 'Missing numbers/time content';
            }

            if ((skillLower.includes('family') || skillLower.includes('greet')) &&
                !categories.includes('greetings') && !categories.includes('family')) {
                hasIssue = true;
                issueType = 'Missing family/greeting content';
            }

            if (skillLower.includes('food') && !categories.includes('food')) {
                hasIssue = true;
                issueType = 'Missing food content';
            }

            // Check for generic skill names that could be more specific
            if (skillLower.includes('unit 1') && categories.includes('greetings')) {
                hasIssue = true;
                issueType = 'Generic name - should specify greetings content';
            }

            const status = hasIssue ? '❌' : '✅';
            console.log(`${status} ${row.skill_name}`);
            console.log(`   → ${row.lesson_name} (${row.content_count} items)`);
            console.log(`   → Categories: ${categories}`);
            if (hasIssue) {
                console.log(`   → Issue: ${issueType}`);
                issues++;
                problemSkills.push({
                    skill_name: row.skill_name,
                    lesson_name: row.lesson_name,
                    categories: categories,
                    issue: issueType
                });
            }
            console.log('');
        });

        console.log(`Total alignment issues: ${issues}`);

        if (problemSkills.length > 0) {
            console.log('\nRECOMMENDED FIXES:');
            problemSkills.forEach((skill, i) => {
                console.log(`${i + 1}. ${skill.skill_name}:`);
                if (skill.issue.includes('numbers/time')) {
                    console.log(`   → Rename to: "Basic Greetings & Conversations"`);
                    console.log(`   → Or add actual numbers/time content`);
                } else if (skill.issue.includes('family/greeting')) {
                    console.log(`   → Add family vocabulary or rename skill`);
                } else if (skill.issue.includes('Generic name')) {
                    console.log(`   → Rename to: "Greetings & Basic Phrases"`);
                }
            });
        }

        return problemSkills;

    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    auditAlignment()
        .then(result => {
            console.log(`\n✅ Audit complete. Found ${result.length} issues.`);
            process.exit(0);
        })
        .catch(console.error);
}

module.exports = { auditAlignment };