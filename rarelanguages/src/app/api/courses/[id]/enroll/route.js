import { NextResponse } from 'next/server';
const { query, db } = require('../../../../../../lib/database');

/**
 * Course Enrollment API
 * POST /api/courses/[id]/enroll - Enroll user in course
 * DELETE /api/courses/[id]/enroll - Unenroll user from course
 */
export async function POST(request, { params }) {
    try {
        const { id: courseId } = params;
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId', success: false },
                { status: 400 }
            );
        }

        // Check if course exists and get details
        const courseResult = await query(`
            SELECT c.*, l.name as language_name 
            FROM courses c 
            JOIN languages l ON c.language_id = l.id 
            WHERE c.id = $1 AND c.is_active = true
        `, [courseId]);

        if (courseResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Course not found', success: false },
                { status: 404 }
            );
        }

        const course = courseResult.rows[0];

        // Check prerequisites if this is not level 1
        if (course.level > 1 && course.prerequisites && course.prerequisites.length > 0) {
            const prerequisiteCheck = await query(`
                SELECT COUNT(*) as completed_prerequisites
                FROM course_progress cp
                WHERE cp.user_id = $1 
                  AND cp.course_id = ANY($2::uuid[])
                  AND cp.status = 'completed'
            `, [userId, course.prerequisites]);

            const completedPrereqs = parseInt(prerequisiteCheck.rows[0].completed_prerequisites);
            if (completedPrereqs < course.prerequisites.length) {
                return NextResponse.json(
                    { 
                        error: 'Prerequisites not completed',
                        details: `This course requires completion of ${course.prerequisites.length} prerequisite course(s)`,
                        success: false 
                    },
                    { status: 400 }
                );
            }
        }

        // Check if already enrolled
        const existingEnrollment = await query(`
            SELECT * FROM course_progress 
            WHERE user_id = $1 AND course_id = $2
        `, [userId, courseId]);

        if (existingEnrollment.rows.length > 0) {
            const enrollment = existingEnrollment.rows[0];
            return NextResponse.json({
                message: 'Already enrolled in course',
                enrollment: {
                    status: enrollment.status,
                    enrollmentDate: enrollment.enrollment_date,
                    startDate: enrollment.start_date
                },
                success: true
            });
        }

        // Get total skills for this course
        const skillsResult = await query(`
            SELECT COUNT(*) as total_skills 
            FROM course_skills 
            WHERE course_id = $1
        `, [courseId]);

        const totalSkills = parseInt(skillsResult.rows[0].total_skills);

        // Create enrollment record
        const enrollment = await db.insert('course_progress', {
            user_id: userId,
            course_id: courseId,
            status: 'not_started',
            skills_total: totalSkills,
            skills_completed: 0,
            total_hours_spent: 0
        });

        console.log(`✅ User ${userId} enrolled in course: ${course.name}`);

        return NextResponse.json({
            message: 'Successfully enrolled in course',
            course: {
                id: course.id,
                name: course.name,
                code: course.code,
                level: course.level,
                language: course.language_name
            },
            enrollment: {
                id: enrollment.id,
                status: enrollment.status,
                enrollmentDate: enrollment.enrollment_date,
                totalSkills: totalSkills
            },
            success: true
        });

    } catch (error) {
        console.error('❌ Course enrollment failed:', error);
        
        return NextResponse.json(
            { 
                error: 'Course enrollment failed',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}

/**
 * Unenroll from course
 */
export async function DELETE(request, { params }) {
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

        // Check if enrolled
        const enrollment = await query(`
            SELECT * FROM course_progress 
            WHERE user_id = $1 AND course_id = $2
        `, [userId, courseId]);

        if (enrollment.rows.length === 0) {
            return NextResponse.json(
                { error: 'Not enrolled in this course', success: false },
                { status: 404 }
            );
        }

        // Delete enrollment (this will also cascade delete related progress)
        await query(`
            DELETE FROM course_progress 
            WHERE user_id = $1 AND course_id = $2
        `, [userId, courseId]);

        console.log(`✅ User ${userId} unenrolled from course: ${courseId}`);

        return NextResponse.json({
            message: 'Successfully unenrolled from course',
            success: true
        });

    } catch (error) {
        console.error('❌ Course unenrollment failed:', error);
        
        return NextResponse.json(
            { 
                error: 'Course unenrollment failed',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}