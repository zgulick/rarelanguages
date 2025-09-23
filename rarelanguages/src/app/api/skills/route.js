/**
 * Skills API - Get all skills with their lessons
 * GET /api/skills - Get all skills with associated lessons
 */
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/database');

export async function GET() {
    try {
        // Get all active skills with their lessons
        const result = await query(`
            SELECT
                s.id as skill_id,
                s.name as skill_name,
                s.description as skill_description,
                s.position as skill_position,
                s.cefr_level,
                l.id as lesson_id,
                l.name as lesson_name,
                l.position as lesson_position,
                l.difficulty_level,
                l.estimated_minutes,
                lang.code as language_code,
                lang.name as language_name
            FROM skills s
            JOIN languages lang ON s.language_id = lang.id
            LEFT JOIN lessons l ON s.id = l.skill_id AND l.is_active = true
            WHERE s.is_active = true
            AND lang.code = 'gheg-al'
            ORDER BY s.position, l.position
        `);

        // Group lessons by skill
        const skillsMap = new Map();

        result.rows.forEach(row => {
            if (!skillsMap.has(row.skill_id)) {
                skillsMap.set(row.skill_id, {
                    id: row.skill_id,
                    name: row.skill_name,
                    description: row.skill_description,
                    position: row.skill_position,
                    cefr_level: row.cefr_level,
                    language: {
                        code: row.language_code,
                        name: row.language_name
                    },
                    lessons: []
                });
            }

            // Add lesson if it exists
            if (row.lesson_id) {
                skillsMap.get(row.skill_id).lessons.push({
                    id: row.lesson_id,
                    name: row.lesson_name,
                    position: row.lesson_position,
                    difficulty_level: row.difficulty_level,
                    estimated_minutes: row.estimated_minutes
                });
            }
        });

        const skills = Array.from(skillsMap.values());

        return NextResponse.json(skills);

    } catch (error) {
        console.error('Skills API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: `Failed to load skills: ${error.message}`
            },
            { status: 500 }
        );
    }
}