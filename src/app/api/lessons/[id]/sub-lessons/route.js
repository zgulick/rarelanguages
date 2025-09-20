/**
 * Sub-Lessons API for Albanian Learning Experience
 * GET /api/lessons/[id]/sub-lessons - Get all sub-lessons for a parent lesson
 */
import { NextResponse } from 'next/server';
const { query } = require('../../../../../../lib/database');

export async function GET(request, { params }) {
    try {
        const parentLessonId = params.id;

        // First verify this is a valid parent lesson
        const parentResult = await query(`
            SELECT
                l.id,
                l.name,
                l.skill_id,
                l.is_sub_lesson,
                l.total_sub_lessons,
                l.lesson_group_name,
                s.name as skill_name,
                s.description as skill_description,
                s.cefr_level
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            WHERE l.id = $1
              AND l.is_active = true
              AND l.is_sub_lesson = FALSE
        `, [parentLessonId]);

        if (parentResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Parent lesson not found or not a valid parent lesson' },
                { status: 404 }
            );
        }

        const parentLesson = parentResult.rows[0];

        // If this lesson has no sub-lessons, return the parent lesson itself
        if (parentLesson.total_sub_lessons <= 1) {
            return NextResponse.json({
                success: true,
                parent_lesson: {
                    id: parentLesson.id,
                    name: parentLesson.name,
                    skill_name: parentLesson.skill_name,
                    skill_description: parentLesson.skill_description,
                    cefr_level: parentLesson.cefr_level,
                    is_split: false
                },
                sub_lessons: [{
                    id: parentLesson.id,
                    name: parentLesson.name,
                    sequence_number: 1,
                    estimated_minutes: null,
                    content_count: 0, // Will be filled by another query if needed
                    is_accessible: true,
                    completion_status: 'not_started'
                }],
                total_sub_lessons: 1,
                navigation: {
                    first_lesson_id: parentLesson.id,
                    current_lesson_id: null,
                    last_lesson_id: parentLesson.id
                }
            });
        }

        // Get all sub-lessons for this parent
        const subLessonsResult = await query(`
            SELECT
                l.id,
                l.name,
                l.sequence_number,
                l.estimated_minutes,
                l.cards_per_lesson,
                COUNT(lc.id) as content_count
            FROM lessons l
            LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
            WHERE l.parent_lesson_id = $1
              AND l.is_sub_lesson = TRUE
              AND l.is_active = true
            GROUP BY l.id, l.name, l.sequence_number, l.estimated_minutes, l.cards_per_lesson
            ORDER BY l.sequence_number ASC
        `, [parentLessonId]);

        const subLessons = subLessonsResult.rows.map((row, index) => ({
            id: row.id,
            name: row.name,
            sequence_number: row.sequence_number,
            estimated_minutes: row.estimated_minutes,
            content_count: parseInt(row.content_count) || 0,
            is_accessible: true, // For now, all lessons are accessible
            completion_status: 'not_started', // TODO: Integrate with user progress
            position_in_sequence: index + 1
        }));

        // Navigation helpers
        const navigation = {
            first_lesson_id: subLessons.length > 0 ? subLessons[0].id : null,
            current_lesson_id: null, // Will be set by UI based on user progress
            last_lesson_id: subLessons.length > 0 ? subLessons[subLessons.length - 1].id : null
        };

        return NextResponse.json({
            success: true,
            parent_lesson: {
                id: parentLesson.id,
                name: parentLesson.name,
                lesson_group_name: parentLesson.lesson_group_name,
                skill_id: parentLesson.skill_id,
                skill_name: parentLesson.skill_name,
                skill_description: parentLesson.skill_description,
                cefr_level: parentLesson.cefr_level,
                is_split: true,
                total_sub_lessons: parentLesson.total_sub_lessons
            },
            sub_lessons: subLessons,
            total_sub_lessons: subLessons.length,
            navigation: navigation,
            metadata: {
                total_content_count: subLessons.reduce((sum, lesson) => sum + lesson.content_count, 0),
                estimated_total_time: subLessons.reduce((sum, lesson) => sum + (lesson.estimated_minutes || 0), 0),
                average_cards_per_lesson: subLessons.length > 0 ?
                    Math.round(subLessons.reduce((sum, lesson) => sum + lesson.content_count, 0) / subLessons.length) : 0,
                completion_percentage: 0 // TODO: Calculate based on user progress
            }
        });

    } catch (error) {
        console.error('Sub-lessons API error:', error);
        return NextResponse.json(
            { success: false, error: `Failed to load sub-lessons: ${error.message}` },
            { status: 500 }
        );
    }
}