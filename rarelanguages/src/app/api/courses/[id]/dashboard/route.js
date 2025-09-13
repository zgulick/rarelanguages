import { NextResponse } from 'next/server';
const { query } = require('../../../../../../lib/database');

/**
 * Course Dashboard API
 * GET /api/courses/[id]/dashboard?userId=uuid
 * Returns comprehensive course dashboard data for enrolled user
 */
export async function GET(request, { params }) {
    try {
        const { id: courseId } = params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId parameter', success: false },
                { status: 400 }
            );
        }

        // Check if user is enrolled in course
        const enrollmentResult = await query(`
            SELECT cp.*, c.name as course_name 
            FROM course_progress cp
            JOIN courses c ON cp.course_id = c.id
            WHERE cp.user_id = $1 AND cp.course_id = $2
        `, [userId, courseId]);

        if (enrollmentResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'User not enrolled in this course', success: false },
                { status: 403 }
            );
        }

        // Get comprehensive course information
        const courseResult = await query(`
            SELECT 
                c.*,
                l.name as language_name,
                l.code as language_code,
                l.native_name,
                COUNT(DISTINCT cs.skill_id) as total_skills,
                COUNT(DISTINCT cu.id) as total_units,
                COUNT(DISTINCT a.id) as total_assessments
            FROM courses c
            JOIN languages l ON c.language_id = l.id
            LEFT JOIN course_skills cs ON c.id = cs.course_id
            LEFT JOIN course_units cu ON c.id = cu.course_id
            LEFT JOIN assessments a ON c.id = a.course_id AND a.is_active = true
            WHERE c.id = $1
            GROUP BY c.id, l.name, l.code, l.native_name
        `, [courseId]);

        const course = courseResult.rows[0];
        const progress = enrollmentResult.rows[0];

        // Get user's detailed progress
        const progressDetailResult = await query(`
            SELECT 
                COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.skill_id END) as skills_completed,
                COUNT(DISTINCT up.lesson_id) as lessons_attempted,
                COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.lesson_id END) as lessons_completed,
                AVG(CASE WHEN up.success_rate > 0 THEN up.success_rate * 100 END) as avg_score,
                SUM(up.time_spent_minutes) / 60.0 as total_hours
            FROM user_progress up
            JOIN course_skills cs ON up.skill_id = cs.skill_id
            WHERE up.user_id = $1 AND cs.course_id = $2
        `, [userId, courseId]);

        const progressDetails = progressDetailResult.rows[0] || {};

        // Get next recommended lesson
        const nextLessonResult = await query(`
            SELECT DISTINCT
                l.id,
                l.name,
                l.difficulty_level,
                l.estimated_minutes,
                s.name as skill_name,
                s.position as skill_position,
                COALESCE(up.status, 'not_started') as progress_status
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            JOIN course_skills cs ON s.id = cs.skill_id
            LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
            WHERE cs.course_id = $2 
              AND s.is_active = true 
              AND l.is_active = true
              AND (up.status IS NULL OR up.status != 'completed')
            ORDER BY s.position ASC, l.position ASC
            LIMIT 1
        `, [userId, courseId]);

        const nextLesson = nextLessonResult.rows[0] || null;

        // Get upcoming assessments
        const assessmentsResult = await query(`
            SELECT 
                a.id,
                a.name,
                a.assessment_type,
                a.max_score,
                a.passing_score,
                a.time_limit_minutes,
                COALESCE(ua.passed, false) as already_passed
            FROM assessments a
            LEFT JOIN user_assessments ua ON a.id = ua.assessment_id AND ua.user_id = $1
            WHERE a.course_id = $2 
              AND a.is_active = true 
              AND (ua.passed IS NULL OR ua.passed = false)
            ORDER BY a.created_at
        `, [userId, courseId]);

        const upcomingAssessments = assessmentsResult.rows;

        // Get course units with progress
        const unitsResult = await query(`
            SELECT 
                cu.id,
                cu.name,
                cu.description,
                cu.position,
                cu.estimated_hours,
                COUNT(DISTINCT us.skill_id) as total_skills,
                COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN us.skill_id END) as skills_completed
            FROM course_units cu
            LEFT JOIN unit_skills us ON cu.id = us.unit_id
            LEFT JOIN user_progress up ON us.skill_id = up.skill_id AND up.user_id = $1
            WHERE cu.course_id = $2 AND cu.is_active = true
            GROUP BY cu.id, cu.name, cu.description, cu.position, cu.estimated_hours
            ORDER BY cu.position
        `, [userId, courseId]);

        const units = unitsResult.rows;

        // Calculate study streak (mock implementation - would need actual tracking)
        const studyStreak = 7; // Mock value

        // Prepare comprehensive dashboard response
        const dashboardData = {
            course: {
                ...course,
                language: {
                    name: course.language_name,
                    code: course.language_code,
                    nativeName: course.native_name
                }
            },
            progress: {
                ...progress,
                skillsCompleted: parseInt(progressDetails.skills_completed) || 0,
                lessonsAttempted: parseInt(progressDetails.lessons_attempted) || 0,
                lessonsCompleted: parseInt(progressDetails.lessons_completed) || 0,
                overallScore: Math.round(parseFloat(progressDetails.avg_score)) || 0,
                totalHoursSpent: Math.round(parseFloat(progressDetails.total_hours) * 10) / 10 || 0,
                studyStreak: studyStreak,
                lastAccessed: progress.last_accessed,
                enrollmentDate: progress.enrollment_date
            },
            nextLesson,
            upcomingAssessments: upcomingAssessments.map(assessment => ({
                ...assessment,
                timeLimit: assessment.time_limit_minutes
            })),
            units: units.map(unit => ({
                ...unit,
                skillsCompleted: parseInt(unit.skills_completed) || 0,
                totalSkills: parseInt(unit.total_skills) || 0
            })),
            success: true
        };

        return NextResponse.json(dashboardData);

    } catch (error) {
        console.error('❌ Course dashboard failed:', error);
        
        return NextResponse.json(
            { 
                error: 'Failed to load course dashboard',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}