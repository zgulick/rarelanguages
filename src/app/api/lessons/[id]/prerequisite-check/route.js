import { NextResponse } from 'next/server';
const { query } = require('../../../../../../lib/database');

/**
 * Lesson Prerequisite Check API
 * GET /api/lessons/[id]/prerequisite-check?userId=uuid
 * Checks if user meets all prerequisites for lesson access
 */
export async function GET(request, { params }) {
    try {
        const { id: lessonId } = params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId parameter', success: false },
                { status: 400 }
            );
        }

        // Get lesson information with course context
        const lessonResult = await query(`
            SELECT 
                l.*,
                s.name as skill_name,
                s.position as skill_position,
                c.id as course_id,
                c.name as course_name,
                c.level as course_level,
                c.cefr_level as course_cefr_level,
                lang.name as language_name
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            JOIN course_skills cs ON s.id = cs.skill_id
            JOIN courses c ON cs.course_id = c.id
            JOIN languages lang ON c.language_id = lang.id
            WHERE l.id = $1
        `, [lessonId]);

        if (lessonResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Lesson not found', success: false },
                { status: 404 }
            );
        }

        const lesson = lessonResult.rows[0];

        // Check if user is enrolled in the course
        const enrollmentResult = await query(`
            SELECT * FROM course_progress 
            WHERE user_id = $1 AND course_id = $2
        `, [userId, lesson.course_id]);

        if (enrollmentResult.rows.length === 0) {
            return NextResponse.json({
                accessGranted: false,
                message: `You must enroll in ${lesson.course_name} to access this lesson.`,
                reason: 'not_enrolled',
                courseId: lesson.course_id,
                courseName: lesson.course_name,
                success: true
            });
        }

        // Check if previous lessons in the skill are completed
        const previousLessonsResult = await query(`
            SELECT 
                l.id,
                l.name,
                l.position,
                COALESCE(up.status, 'not_started') as status
            FROM lessons l
            LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
            WHERE l.skill_id = $2 
              AND l.position < $3
              AND l.is_active = true
            ORDER BY l.position
        `, [userId, lesson.skill_id, lesson.position]);

        const previousLessons = previousLessonsResult.rows;
        const incompletePreviousLessons = previousLessons.filter(l => l.status !== 'completed');

        // Check if previous skills in the course are completed (for skill-level prerequisites)
        const previousSkillsResult = await query(`
            SELECT 
                s.id,
                s.name,
                s.position,
                COUNT(l.id) as total_lessons,
                COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed_lessons
            FROM skills s
            JOIN course_skills cs ON s.id = cs.skill_id
            LEFT JOIN lessons l ON s.id = l.skill_id AND l.is_active = true
            LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
            WHERE cs.course_id = $2 
              AND s.position < $3
              AND s.is_active = true
            GROUP BY s.id, s.name, s.position
            ORDER BY s.position
        `, [userId, lesson.course_id, lesson.skill_position]);

        const previousSkills = previousSkillsResult.rows;
        const incompleteSkills = previousSkills.filter(s => 
            s.total_lessons > 0 && s.completed_lessons < s.total_lessons
        );

        // Check lesson-specific prerequisites (if any)
        const lessonPrereqResult = await query(`
            SELECT 
                lp.id,
                l.name as lesson_name,
                s.name as skill_name,
                COALESCE(up.status, 'not_started') as status
            FROM lesson_prerequisites lp
            JOIN lessons l ON lp.prerequisite_lesson_id = l.id
            JOIN skills s ON l.skill_id = s.id
            LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
            WHERE lp.lesson_id = $2
        `, [userId, lessonId]);

        const lessonPrerequisites = lessonPrereqResult.rows;
        const incompleteLessonPrereqs = lessonPrerequisites.filter(p => p.status !== 'completed');

        // Check if user has minimum skill completion rate for advanced lessons
        if (lesson.difficulty_level >= 7) {
            const skillProgressResult = await query(`
                SELECT 
                    COUNT(l.id) as total_lessons,
                    COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed_lessons,
                    AVG(CASE WHEN up.success_rate > 0 THEN up.success_rate * 100 END) as avg_score
                FROM lessons l
                LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
                WHERE l.skill_id = $2 
                  AND l.position < $3
                  AND l.is_active = true
            `, [userId, lesson.skill_id, lesson.position]);

            const skillProgress = skillProgressResult.rows[0];
            const completionRate = skillProgress.total_lessons > 0 
                ? (skillProgress.completed_lessons / skillProgress.total_lessons) * 100 
                : 0;
            const avgScore = parseFloat(skillProgress.avg_score) || 0;

            if (completionRate < 80 || (avgScore > 0 && avgScore < 75)) {
                return NextResponse.json({
                    accessGranted: false,
                    message: 'Complete more lessons in this skill with better scores before accessing advanced content.',
                    reason: 'skill_mastery_required',
                    skillProgress: {
                        completionRate: Math.round(completionRate),
                        averageScore: Math.round(avgScore),
                        requiredCompletion: 80,
                        requiredScore: 75
                    },
                    success: true
                });
            }
        }

        // Determine overall access status
        const accessGranted = 
            incompletePreviousLessons.length === 0 &&
            incompleteSkills.length === 0 &&
            incompleteLessonPrereqs.length === 0;

        let message = '';
        let blockingIssues = [];

        if (!accessGranted) {
            if (incompletePreviousLessons.length > 0) {
                message = `Complete ${incompletePreviousLessons.length} previous lesson(s) in this skill first.`;
                blockingIssues.push({
                    type: 'previous_lessons',
                    count: incompletePreviousLessons.length,
                    items: incompletePreviousLessons
                });
            }
            
            if (incompleteSkills.length > 0) {
                message = message ? message + ' ' : '';
                message += `Complete ${incompleteSkills.length} previous skill(s) in this course.`;
                blockingIssues.push({
                    type: 'previous_skills',
                    count: incompleteSkills.length,
                    items: incompleteSkills
                });
            }
            
            if (incompleteLessonPrereqs.length > 0) {
                message = message ? message + ' ' : '';
                message += `Complete ${incompleteLessonPrereqs.length} specific prerequisite lesson(s).`;
                blockingIssues.push({
                    type: 'lesson_prerequisites',
                    count: incompleteLessonPrereqs.length,
                    items: incompleteLessonPrereqs
                });
            }
        } else {
            message = 'All prerequisites met. You can access this lesson.';
        }

        const checkResult = {
            accessGranted,
            message,
            lesson: {
                id: lesson.id,
                name: lesson.name,
                position: lesson.position,
                difficultyLevel: lesson.difficulty_level,
                skillName: lesson.skill_name,
                courseName: lesson.course_name
            },
            blockingIssues,
            courseEnrolled: true,
            academicProgression: {
                currentSkillPosition: lesson.skill_position,
                currentLessonPosition: lesson.position,
                totalPreviousLessons: previousLessons.length,
                completedPreviousLessons: previousLessons.length - incompletePreviousLessons.length
            },
            success: true
        };

        return NextResponse.json(checkResult);

    } catch (error) {
        console.error('❌ Lesson prerequisite check failed:', error);
        
        return NextResponse.json(
            { 
                error: 'Failed to check lesson prerequisites',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}