#!/usr/bin/env node

require('dotenv').config();
const CourseGeneration = require('../lib/models/CourseGeneration');

/**
 * Test Complete Albanian 1-4 Curriculum Generation
 * This tests the full automated course generation system
 */

async function testAlbanianCourseGeneration() {
    console.log('🇦🇱 Testing Albanian 1-4 Course Generation System');
    console.log('=' .repeat(60));
    
    const generator = new CourseGeneration();
    const results = [];
    
    // Test Albanian courses levels 2, 3, 4 (Level 1 already exists)
    const testLevels = [2, 3, 4];
    
    for (const level of testLevels) {
        console.log(`\n🎯 Generating Albanian Level ${level}...`);
        
        try {
            const result = await generator.generateFullCourse(
                'gheg-al',
                'Gheg Albanian', 
                'Shqip (Gegë)',
                level
            );
            
            results.push({ level, result, success: true });
            console.log(`✅ Albanian ${level} completed successfully`);
            
            // Brief pause between generations
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.error(`❌ Albanian ${level} failed:`, error.message);
            results.push({ level, error: error.message, success: false });
        }
    }
    
    // Generate summary report
    console.log(`\n${'=' .repeat(60)}`);
    console.log('📊 ALBANIAN COURSE GENERATION SUMMARY');
    console.log(`${'=' .repeat(60)}`);
    
    let totalSuccess = 0;
    let totalSkills = 0;
    let totalLessons = 0;
    let totalContent = 0;
    let totalTime = 0;
    let totalCost = 0;
    
    results.forEach(({ level, result, success, error }) => {
        if (success) {
            totalSuccess++;
            totalSkills += result.skills;
            totalLessons += result.lessons;
            totalContent += result.contentItems;
            totalTime += result.generationTimeSeconds;
            totalCost += result.estimatedCost || 0;
            
            console.log(`✅ Albanian ${level}: ${result.skills} skills, ${result.lessons} lessons, ${result.contentItems} items`);
        } else {
            console.log(`❌ Albanian ${level}: ${error}`);
        }
    });
    
    console.log(`\n📈 Overall Statistics:`);
    console.log(`   Success Rate: ${totalSuccess}/${testLevels.length} (${Math.round(totalSuccess/testLevels.length*100)}%)`);
    console.log(`   Total Skills: ${totalSkills}`);
    console.log(`   Total Lessons: ${totalLessons}`);
    console.log(`   Total Content Items: ${totalContent}`);
    console.log(`   Total Generation Time: ${totalTime} seconds`);
    console.log(`   Total Estimated Cost: $${totalCost.toFixed(4)}`);
    
    // Verify course progression logic
    console.log(`\n🎓 Testing Course Progression Logic...`);
    await testCourseProgression();
    
    console.log(`\n🎉 Albanian Course Generation Test Complete!`);
}

async function testCourseProgression() {
    try {
        const db = require('../lib/database');
        
        // Get all Albanian courses
        const coursesResult = await db.query(`
            SELECT c.*, l.name as language_name
            FROM courses c 
            JOIN languages l ON c.language_id = l.id 
            WHERE l.code = 'gheg-al' 
            ORDER BY c.level
        `);
        
        const courses = coursesResult.rows;
        console.log(`   Found ${courses.length} Albanian courses`);
        
        // Verify prerequisite chain
        for (const course of courses) {
            console.log(`   ${course.name} (Level ${course.level}):`);
            
            if (course.level === 1) {
                console.log(`     ✅ No prerequisites (foundation course)`);
            } else {
                const prereqs = course.prerequisites || [];
                if (prereqs.length > 0) {
                    console.log(`     ✅ Prerequisites: ${prereqs.length} course(s)`);
                } else {
                    console.log(`     ⚠️  No prerequisites found (should have previous level)`);
                }
            }
            
            // Check course content completeness
            const skillsResult = await db.query(`
                SELECT COUNT(*) as count 
                FROM course_skills cs 
                WHERE cs.course_id = $1
            `, [course.id]);
            
            const lessonsResult = await db.query(`
                SELECT COUNT(*) as count 
                FROM lessons l
                JOIN course_skills cs ON l.skill_id = cs.skill_id
                WHERE cs.course_id = $1
            `, [course.id]);
            
            const contentResult = await db.query(`
                SELECT COUNT(*) as count 
                FROM lesson_content lc
                JOIN lessons l ON lc.lesson_id = l.id
                JOIN course_skills cs ON l.skill_id = cs.skill_id
                WHERE cs.course_id = $1
            `, [course.id]);
            
            const skills = parseInt(skillsResult.rows[0].count);
            const lessons = parseInt(lessonsResult.rows[0].count);
            const content = parseInt(contentResult.rows[0].count);
            
            console.log(`     Content: ${skills} skills, ${lessons} lessons, ${content} items`);
            
            if (skills > 0 && lessons > 0 && content > 0) {
                console.log(`     ✅ Course complete and ready`);
            } else {
                console.log(`     ⚠️  Course incomplete`);
            }
        }
        
        console.log(`   ✅ Course progression verification complete`);
        
    } catch (error) {
        console.error(`   ❌ Course progression test failed:`, error.message);
    }
}

// Run the test
if (require.main === module) {
    testAlbanianCourseGeneration()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testAlbanianCourseGeneration };