import { NextResponse } from 'next/server';
const { query } = require('../../../lib/database');

/**
 * Courses API
 * GET /api/courses - List all available courses
 * POST /api/courses - Create new course (admin only)
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const languageCode = searchParams.get('language');
        const level = searchParams.get('level');
        const userId = searchParams.get('userId');

        let queryText = `
            SELECT 
                c.*,
                l.name as language_name,
                l.code as language_code,
                l.native_name,
                COUNT(DISTINCT cs.skill_id) as total_skills,
                COUNT(DISTINCT cu.id) as total_units,
                COALESCE(cp.status, 'not_started') as enrollment_status,
                cp.completion_date,
                cp.total_hours_spent,
                cp.skills_completed,
                cp.overall_score
            FROM courses c
            JOIN languages l ON c.language_id = l.id
            LEFT JOIN course_skills cs ON c.id = cs.course_id
            LEFT JOIN course_units cu ON c.id = cu.course_id
            LEFT JOIN course_progress cp ON c.id = cp.course_id AND cp.user_id = $1
            WHERE c.is_active = true
        `;

        const params = [userId || null];
        let paramIndex = 2;

        if (languageCode) {
            queryText += ` AND l.code = $${paramIndex}`;
            params.push(languageCode);
            paramIndex++;
        }

        if (level) {
            queryText += ` AND c.level = $${paramIndex}`;
            params.push(parseInt(level));
            paramIndex++;
        }

        queryText += `
            GROUP BY c.id, l.name, l.code, l.native_name, cp.status, cp.completion_date, 
                     cp.total_hours_spent, cp.skills_completed, cp.overall_score
            ORDER BY l.name, c.level
        `;

        const result = await query(queryText, params);

        const courses = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            code: row.code,
            description: row.description,
            level: row.level,
            cefrLevel: row.cefr_level,
            language: {
                code: row.language_code,
                name: row.language_name,
                nativeName: row.native_name
            },
            learningObjectives: row.learning_objectives,
            estimatedHours: row.estimated_hours,
            totalSkills: row.total_skills || 0,
            totalUnits: row.total_units || 0,
            enrollmentStatus: row.enrollment_status,
            userProgress: userId ? {
                completionDate: row.completion_date,
                hoursSpent: row.total_hours_spent || 0,
                skillsCompleted: row.skills_completed || 0,
                overallScore: row.overall_score
            } : null
        }));

        return NextResponse.json({ 
            courses,
            total: courses.length,
            success: true 
        });

    } catch (error) {
        console.error('❌ Failed to fetch courses:', error);
        
        return NextResponse.json(
            { 
                error: 'Failed to fetch courses',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}

/**
 * Create new course (admin functionality)
 */
export async function POST(request) {
    try {
        const courseData = await request.json();
        
        // This would typically include authentication/authorization
        // For now, we'll allow course creation for testing
        
        const {
            languageId,
            name,
            code,
            description,
            level,
            cefrLevel,
            learningObjectives,
            estimatedHours
        } = courseData;

        const result = await query(`
            INSERT INTO courses (
                language_id, name, code, description, level, cefr_level,
                learning_objectives, estimated_hours, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            RETURNING *
        `, [
            languageId,
            name,
            code,
            description,
            level,
            cefrLevel,
            JSON.stringify(learningObjectives),
            estimatedHours
        ]);

        const course = result.rows[0];

        return NextResponse.json({ 
            course,
            success: true 
        }, { status: 201 });

    } catch (error) {
        console.error('❌ Failed to create course:', error);
        
        return NextResponse.json(
            { 
                error: 'Failed to create course',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}