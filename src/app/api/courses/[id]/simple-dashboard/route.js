/**
 * Simplified Course Dashboard API for Albanian Learning Experience
 * GET /api/courses/[id]/simple-dashboard - Get course dashboard data (works with guests)
 */
import { NextResponse } from 'next/server';
const { query } = require('../../../../../../lib/database');

export async function GET(request, { params }) {
    try {
        const courseId = params.id;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        // Get course basic info
        const courseResult = await query(`
            SELECT c.*, l.name as language_name, l.native_name
            FROM courses c
            JOIN languages l ON c.language_id = l.id
            WHERE c.id = $1
        `, [courseId]);

        if (courseResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Course not found' },
                { status: 404 }
            );
        }

        const course = courseResult.rows[0];

        // Get skills for this course with lesson counts
        const skillsResult = await query(`
            SELECT s.*, cs.position, cs.estimated_hours,
                   COUNT(l.id) as total_lessons
            FROM skills s
            JOIN course_skills cs ON s.id = cs.skill_id
            LEFT JOIN lessons l ON s.id = l.skill_id
            WHERE cs.course_id = $1
            GROUP BY s.id, cs.position, cs.estimated_hours
            ORDER BY cs.position
        `, [courseId]);

        // Process skills - make first few active for demo
        const skills = skillsResult.rows.map((skill, index) => ({
            id: skill.id,
            name: skill.name,
            description: skill.description,
            position: skill.position,
            totalLessons: parseInt(skill.total_lessons) || 0,
            completedLessons: index < 2 ? parseInt(skill.total_lessons) || 0 : Math.floor(Math.random() * (parseInt(skill.total_lessons) || 8)), // Demo progress
            isCompleted: index < 2, // First 2 skills completed for demo
            isActive: index < 3, // First 3 skills active
            estimatedHours: skill.estimated_hours || 4
        }));

        // Find next lesson (first lesson of first uncompleted active skill)
        let nextLesson = null;
        const activeSkill = skills.find(skill => skill.isActive && !skill.isCompleted);
        if (activeSkill) {
            const lessonResult = await query(`
                SELECT * FROM lessons 
                WHERE skill_id = $1
                ORDER BY position 
                LIMIT 1
            `, [activeSkill.id]);
            
            if (lessonResult.rows.length > 0) {
                const lesson = lessonResult.rows[0];
                nextLesson = {
                    id: lesson.id,
                    name: lesson.name,
                    skillName: activeSkill.name,
                    estimatedMinutes: lesson.estimated_minutes || 15,
                    difficultyLevel: lesson.difficulty_level || 3,
                    description: `Continue your Albanian journey with ${activeSkill.name}`,
                    contentAreas: ['vocabulary', 'pronunciation', 'grammar']
                };
            }
        }

        // Get sample phrases for recent phrases section
        const phrasesResult = await query(`
            SELECT lc.english_phrase, lc.target_phrase, lc.pronunciation_guide
            FROM lesson_content lc
            JOIN lessons l ON lc.lesson_id = l.id
            JOIN skills s ON l.skill_id = s.id
            JOIN course_skills cs ON s.id = cs.skill_id
            WHERE cs.course_id = $1
            ORDER BY RANDOM()
            LIMIT 12
        `, [courseId]);

        const recentPhrases = phrasesResult.rows.map(phrase => ({
            englishPhrase: phrase.english_phrase,
            targetPhrase: phrase.target_phrase,
            pronunciationGuide: phrase.pronunciation_guide
        }));

        // Calculate demo progress
        const completedSkills = skills.filter(skill => skill.isCompleted).length;
        const totalSkills = skills.length;
        const totalContent = await query(`
            SELECT COUNT(*) as phrase_count
            FROM lesson_content lc
            JOIN lessons l ON lc.lesson_id = l.id
            JOIN skills s ON l.skill_id = s.id
            JOIN course_skills cs ON s.id = cs.skill_id
            WHERE cs.course_id = $1
        `, [courseId]);

        const totalPhrases = parseInt(totalContent.rows[0]?.phrase_count) || 264;
        const phrasesLearned = Math.floor(totalPhrases * (completedSkills / totalSkills));

        const progress = {
            completionPercentage: Math.round((completedSkills / totalSkills) * 100),
            skillsCompleted: completedSkills,
            totalSkills: totalSkills,
            phrasesLearned: phrasesLearned,
            totalPhrases: totalPhrases,
            streakDays: 5, // Demo streak
            totalHours: Math.round(completedSkills * 4.5), // Estimate based on completed skills
            lastActivity: new Date().toISOString()
        };

        return NextResponse.json({
            success: true,
            course: {
                id: course.id,
                name: course.name,
                description: course.description,
                level: course.level,
                cefr_level: course.cefr_level,
                language_name: course.language_name,
                native_name: course.native_name
            },
            skills,
            progress,
            nextLesson,
            recentPhrases,
            upcomingAssessments: [], // No assessments for now
            totalContent: {
                phrases: totalPhrases,
                lessons: skills.reduce((sum, skill) => sum + skill.totalLessons, 0),
                skills: totalSkills
            }
        });

    } catch (error) {
        console.error('Simple dashboard API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to load dashboard data' },
            { status: 500 }
        );
    }
}