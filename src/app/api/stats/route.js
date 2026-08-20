import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/database');

/**
 * Platform Statistics API
 * GET /api/stats - Get platform-wide statistics
 */
export async function GET() {
    try {
        // Get all platform statistics in parallel
        const [languagesResult, coursesResult, skillsResult, lessonsResult] = await Promise.all([
            // Total active languages
            query(`
                SELECT COUNT(*) as count
                FROM languages
                WHERE active = true
            `),

            // Total courses and estimated hours
            query(`
                SELECT
                    COUNT(*) as count,
                    COALESCE(SUM(estimated_hours), 0) as total_hours
                FROM courses
                WHERE is_active = true
            `),

            // Total skills
            query(`
                SELECT COUNT(*) as count
                FROM skills
            `),

            // Total lessons (from processed_lessons table)
            query(`
                SELECT COUNT(*) as count
                FROM processed_lessons
            `)
        ]);

        const stats = {
            totalLanguages: parseInt(languagesResult.rows[0].count),
            totalCourses: parseInt(coursesResult.rows[0].count),
            totalSkills: parseInt(skillsResult.rows[0].count),
            totalLessons: parseInt(lessonsResult.rows[0].count),
            totalHours: parseInt(coursesResult.rows[0].total_hours || 0),
            success: true
        };

        return NextResponse.json(stats);

    } catch (error) {
        console.error('❌ Failed to fetch platform stats:', error);

        // Return a real error status. Returning 200 here made uptime
        // monitoring report the API as healthy during a database outage.
        return NextResponse.json({
            totalLanguages: 0,
            totalCourses: 0,
            totalSkills: 0,
            totalLessons: 0,
            totalHours: 0,
            success: false,
            error: 'Failed to fetch platform stats'
        }, { status: 500 });
    }
}
