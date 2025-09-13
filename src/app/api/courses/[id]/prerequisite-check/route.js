import { NextResponse } from 'next/server';
const { query } = require('../../../../../../lib/database');

/**
 * Course Prerequisite Check API
 * GET /api/courses/[id]/prerequisite-check?userId=uuid
 * Checks if user meets all prerequisites for course access
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

        // Get course information with prerequisites
        const courseResult = await query(`
            SELECT 
                c.*,
                l.name as language_name,
                l.code as language_code
            FROM courses c
            JOIN languages l ON c.language_id = l.id
            WHERE c.id = $1
        `, [courseId]);

        if (courseResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Course not found', success: false },
                { status: 404 }
            );
        }

        const course = courseResult.rows[0];

        // Check if user is already enrolled
        const enrollmentResult = await query(`
            SELECT * FROM course_progress 
            WHERE user_id = $1 AND course_id = $2
        `, [userId, courseId]);

        const isEnrolled = enrollmentResult.rows.length > 0;

        // Get course prerequisites
        const prerequisitesResult = await query(`
            SELECT 
                cp.id,
                c.name,
                c.level,
                c.cefr_level,
                c.description,
                c.estimated_hours,
                CASE 
                    WHEN up.status = 'completed' THEN true 
                    ELSE false 
                END as completed
            FROM course_prerequisites cp
            JOIN courses c ON cp.prerequisite_course_id = c.id
            LEFT JOIN course_progress up ON c.id = up.course_id AND up.user_id = $1
            WHERE cp.course_id = $2
            ORDER BY c.level
        `, [userId, courseId]);

        const prerequisites = prerequisitesResult.rows;
        const missingPrerequisites = prerequisites.filter(p => !p.completed);
        const completedPrerequisites = prerequisites.filter(p => p.completed);

        // Check CEFR level progression
        const userProgressResult = await query(`
            SELECT 
                MAX(c.level) as highest_completed_level,
                c.language_id
            FROM course_progress cp
            JOIN courses c ON cp.course_id = c.id
            WHERE cp.user_id = $1 
              AND c.language_id = $2 
              AND cp.status = 'completed'
            GROUP BY c.language_id
        `, [userId, course.language_id]);

        const userProgress = userProgressResult.rows[0];
        const highestCompletedLevel = userProgress?.highest_completed_level || 0;

        // Check if user can access this course level
        const levelRequirementMet = course.level <= (highestCompletedLevel + 1);

        // Check minimum academic requirements
        const academicRequirements = await checkAcademicRequirements(userId, courseId, course);

        // Determine access status
        const accessGranted = 
            missingPrerequisites.length === 0 && 
            levelRequirementMet &&
            academicRequirements.allMet;

        let message = '';
        if (!accessGranted) {
            if (missingPrerequisites.length > 0) {
                message = `Complete ${missingPrerequisites.length} prerequisite course(s) first.`;
            } else if (!levelRequirementMet) {
                message = `Complete Level ${course.level - 1} before accessing Level ${course.level}.`;
            } else if (!academicRequirements.allMet) {
                message = 'Academic requirements not met for this course.';
            }
        } else {
            message = isEnrolled 
                ? 'You are enrolled and can access this course.'
                : 'All prerequisites met. You can enroll in this course.';
        }

        const checkResult = {
            accessGranted,
            canEnroll: accessGranted && !isEnrolled,
            isEnrolled,
            message,
            course: {
                id: course.id,
                name: course.name,
                level: course.level,
                cefrLevel: course.cefr_level
            },
            prerequisites: {
                total: prerequisites.length,
                completed: completedPrerequisites.length,
                missing: missingPrerequisites.length
            },
            missingPrerequisites,
            completedPrerequisites,
            levelRequirement: {
                required: course.level,
                userHighest: highestCompletedLevel,
                met: levelRequirementMet
            },
            academicRequirements: academicRequirements.requirements,
            success: true
        };

        return NextResponse.json(checkResult);

    } catch (error) {
        console.error('❌ Course prerequisite check failed:', error);
        
        return NextResponse.json(
            { 
                error: 'Failed to check course prerequisites',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}

/**
 * Check academic requirements for course access
 */
async function checkAcademicRequirements(userId, courseId, course) {
    try {
        // Check minimum assessment scores for previous courses
        const assessmentResult = await query(`
            SELECT 
                AVG(ua.score) as avg_score,
                COUNT(ua.id) as total_assessments
            FROM user_assessments ua
            JOIN assessments a ON ua.assessment_id = a.id
            JOIN courses c ON a.course_id = c.id
            WHERE ua.user_id = $1 
              AND c.language_id = $2 
              AND c.level < $3
              AND ua.passed = true
        `, [userId, course.language_id, course.level]);

        const assessmentData = assessmentResult.rows[0];
        const avgScore = parseFloat(assessmentData.avg_score) || 0;
        const totalAssessments = parseInt(assessmentData.total_assessments) || 0;

        // Check study time requirements for previous level
        const studyTimeResult = await query(`
            SELECT SUM(up.time_spent_minutes) / 60.0 as total_hours
            FROM user_progress up
            JOIN course_skills cs ON up.skill_id = cs.skill_id
            JOIN courses c ON cs.course_id = c.id
            WHERE up.user_id = $1 
              AND c.language_id = $2 
              AND c.level < $3
        `, [userId, course.language_id, course.level]);

        const studyTimeData = studyTimeResult.rows[0];
        const totalHours = parseFloat(studyTimeData.total_hours) || 0;

        // Define requirements based on course level
        const requirements = {
            minimumScore: {
                required: course.level > 1 ? 70 : 0,
                current: Math.round(avgScore),
                met: course.level === 1 || avgScore >= 70,
                description: 'Average assessment score from previous courses'
            },
            minimumAssessments: {
                required: course.level > 1 ? 2 : 0,
                current: totalAssessments,
                met: course.level === 1 || totalAssessments >= 2,
                description: 'Passed assessments from prerequisite courses'
            },
            studyTime: {
                required: course.level > 1 ? (course.level - 1) * 25 : 0,
                current: Math.round(totalHours),
                met: course.level === 1 || totalHours >= ((course.level - 1) * 25),
                description: 'Total study time in previous courses'
            }
        };

        const allMet = Object.values(requirements).every(req => req.met);

        return { requirements, allMet };

    } catch (error) {
        console.error('Error checking academic requirements:', error);
        return { 
            requirements: {}, 
            allMet: true // Default to allowing access if requirements check fails
        };
    }
}