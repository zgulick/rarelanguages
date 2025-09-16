import { NextResponse } from 'next/server';
const { query } = require('../../../../../lib/database');

/**
 * Course Catalog API
 * GET /api/courses/catalog?userId=uuid (optional)
 * Returns all available courses with enrollment status
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        
        // Skip user-specific queries for guest users
        const isGuestUser = userId && userId.startsWith('guest-user-');

        // Get all active languages
        const languagesResult = await query(`
            SELECT id, code, name, native_name
            FROM languages 
            WHERE active = true
            ORDER BY name
        `);

        const languages = languagesResult.rows;

        // Get all courses with language information
        let coursesQuery = `
            SELECT 
                c.id,
                c.name,
                c.code,
                c.description,
                c.level,
                c.cefr_level,
                c.estimated_hours,
                c.learning_objectives,
                c.prerequisites,
                l.name as language_name,
                l.code as language_code,
                l.native_name,
                COUNT(DISTINCT cs.skill_id) as total_skills,
                COUNT(DISTINCT cu.id) as total_units,
                COUNT(DISTINCT a.id) as total_assessments
        `;

        let fromClause = `
            FROM courses c
            JOIN languages l ON c.language_id = l.id
            LEFT JOIN course_skills cs ON c.id = cs.course_id
            LEFT JOIN course_units cu ON c.id = cu.course_id
            LEFT JOIN assessments a ON c.id = a.course_id AND a.is_active = true
        `;

        let whereClause = `WHERE c.is_active = true`;
        let params = [];

        // Add user enrollment status if userId provided (but not for guest users)
        if (userId && !isGuestUser) {
            coursesQuery += `, 
                COALESCE(cp.status, 'not_started') as enrollment_status,
                cp.completion_date,
                cp.overall_score,
                cp.skills_completed,
                cp.total_hours_spent
            `;
            
            fromClause += ` LEFT JOIN course_progress cp ON c.id = cp.course_id AND cp.user_id = $1 `;
            params.push(userId);
        }

        let groupByClause = `
            GROUP BY c.id, c.name, c.code, c.description, c.level, c.cefr_level, 
                     c.estimated_hours, c.learning_objectives, c.prerequisites,
                     l.name, l.code, l.native_name
        `;

        // Add user enrollment fields to GROUP BY if needed (but not for guest users)
        if (userId && !isGuestUser) {
            groupByClause += `, cp.status, cp.completion_date, cp.overall_score, cp.skills_completed, cp.total_hours_spent`;
        }

        const orderByClause = ` ORDER BY l.name, c.level`;

        const fullQuery = coursesQuery + fromClause + whereClause + groupByClause + orderByClause;
        var coursesResult = await query(fullQuery, params);

        // Process courses to check prerequisites
        const courses = await Promise.all(coursesResult.rows.map(async (course) => {
            // Check if prerequisites are met
            let prerequisitesMet = true;
            
            if (course.prerequisites && course.prerequisites.length > 0 && userId && !isGuestUser) {
                const prerequisiteIds = course.prerequisites;
                
                const prereqResult = await query(`
                    SELECT COUNT(*) as completed_count
                    FROM course_progress cp
                    WHERE cp.user_id = $1 
                      AND cp.course_id = ANY($2::uuid[])
                      AND cp.status = 'completed'
                `, [userId, prerequisiteIds]);
                
                prerequisitesMet = parseInt(prereqResult.rows[0].completed_count) === prerequisiteIds.length;
            }

            return {
                ...course,
                prerequisitesMet,
                totalSkills: parseInt(course.total_skills) || 0,
                totalUnits: parseInt(course.total_units) || 0,
                totalAssessments: parseInt(course.total_assessments) || 0,
                skillsCompleted: parseInt(course.skills_completed) || 0,
                totalHoursSpent: parseFloat(course.total_hours_spent) || 0,
                overallScore: Math.round(parseFloat(course.overall_score)) || 0
            };
        }));

        return NextResponse.json({
            courses,
            languages,
            success: true
        });

    } catch (error) {
        console.error('❌ Course catalog failed:', error);
        
        return NextResponse.json(
            { 
                error: 'Failed to load course catalog',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}