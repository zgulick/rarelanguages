/**
 * Lesson Content API for Albanian Learning Experience
 * GET /api/lessons/[id]/content - Get lesson content with phrases and metadata
 */
import { NextResponse } from 'next/server';
const { query } = require('../../../../../../lib/database');

export async function GET(request, { params }) {
    try {
        const lessonId = params.id;

        // Get lesson basic info with skill details and sub-lesson navigation
        const lessonResult = await query(`
            SELECT
                l.*,
                s.name as skill_name,
                s.description as skill_description,
                s.cefr_level,
                -- Parent lesson info (if this is a sub-lesson)
                parent.id as parent_lesson_id,
                parent.name as parent_lesson_name,
                parent.total_sub_lessons,
                -- Sub-lesson navigation
                CASE
                    WHEN l.is_sub_lesson = TRUE THEN l.sequence_number
                    ELSE 1
                END as current_sub_lesson,
                CASE
                    WHEN l.is_sub_lesson = TRUE THEN parent.total_sub_lessons
                    WHEN l.total_sub_lessons > 1 THEN l.total_sub_lessons
                    ELSE 1
                END as total_sub_lessons_actual
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            LEFT JOIN lessons parent ON l.parent_lesson_id = parent.id
            WHERE l.id = $1 AND l.is_active = true
        `, [lessonId]);

        if (lessonResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Lesson not found or inactive' },
                { status: 404 }
            );
        }

        const lesson = lessonResult.rows[0];

        // Get lesson content (phrases) with all necessary fields including new grammar fields
        const contentResult = await query(`
            SELECT 
                lc.id,
                lc.english_phrase,
                lc.target_phrase,
                lc.pronunciation_guide,
                lc.cultural_context,
                lc.word_type,
                lc.verb_type,
                lc.gender,
                lc.stress_pattern,
                lc.conjugation_data,
                lc.grammar_category,
                lc.difficulty_notes,
                lc.usage_examples
            FROM lesson_content lc
            WHERE lc.lesson_id = $1
            ORDER BY lc.id ASC
        `, [lessonId]);

        const content = contentResult.rows.map(item => ({
            id: item.id,
            english_phrase: item.english_phrase,
            target_phrase: item.target_phrase,
            pronunciation_guide: item.pronunciation_guide,
            difficulty_level: 1, // Default value since column doesn't exist
            content_type: 'phrase', // Default value since column doesn't exist
            cultural_context: item.cultural_context || null,
            grammar_notes: null, // Default value since column doesn't exist
            position: 1, // Default value since column doesn't exist
            // New grammar and linguistic fields
            word_type: item.word_type || null,
            verb_type: item.verb_type || null,
            gender: item.gender || null,
            stress_pattern: item.stress_pattern || null,
            conjugation_data: item.conjugation_data || null,
            grammar_category: item.grammar_category || null,
            difficulty_notes: item.difficulty_notes || null,
            usage_examples: item.usage_examples || null
        }));

        // If no content found, return sample Albanian phrases for demo
        if (content.length === 0) {
            const sampleContent = [
                {
                    id: 'sample-1',
                    english_phrase: 'Hello',
                    target_phrase: 'Përshëndetje',
                    pronunciation_guide: 'Per-shuhn-det-yeh',
                    cultural_context: 'Standard greeting used in both formal and informal situations',
                    difficulty_level: 1,
                    content_type: 'phrase',
                    position: 1
                },
                {
                    id: 'sample-2', 
                    english_phrase: 'Thank you',
                    target_phrase: 'Faleminderit',
                    pronunciation_guide: 'Fah-leh-meen-deh-reet',
                    cultural_context: 'Formal way to express gratitude, very important in Albanian culture',
                    difficulty_level: 1,
                    content_type: 'phrase',
                    position: 2
                },
                {
                    id: 'sample-3',
                    english_phrase: 'How are you?',
                    target_phrase: 'Si jeni?',
                    pronunciation_guide: 'See yeh-nee?',
                    cultural_context: 'Formal greeting, shows respect for the person you\'re addressing',
                    difficulty_level: 2,
                    content_type: 'phrase',
                    position: 3
                },
                {
                    id: 'sample-4',
                    english_phrase: 'My name is...',
                    target_phrase: 'Unë quhem...',
                    pronunciation_guide: 'Oo-nuh choo-hem...',
                    cultural_context: 'Standard way to introduce yourself in Albanian',
                    difficulty_level: 2,
                    content_type: 'phrase',
                    position: 4
                },
                {
                    id: 'sample-5',
                    english_phrase: 'Please',
                    target_phrase: 'Ju lutem',
                    pronunciation_guide: 'Yoo loo-tem',
                    cultural_context: 'Polite way to make requests, essential for courteous conversation',
                    difficulty_level: 1,
                    content_type: 'phrase',
                    position: 5
                }
            ];
            
            return NextResponse.json({
                success: true,
                lesson: {
                    id: lesson.id,
                    name: lesson.name,
                    description: lesson.description,
                    skill_name: lesson.skill_name,
                    skill_description: lesson.skill_description,
                    position: lesson.position,
                    difficulty_level: lesson.difficulty_level,
                    estimated_minutes: lesson.estimated_minutes,
                    cefr_level: lesson.cefr_level,
                    content_areas: ['vocabulary', 'pronunciation', 'cultural_context']
                },
                content: sampleContent,
                metadata: {
                    totalPhrases: sampleContent.length,
                    averageDifficulty: 1.4,
                    estimatedTime: lesson.estimated_minutes || 15,
                    hasAudio: false, // Will be true when audio is implemented
                    hasCulturalContext: true
                }
            });
        }

        // Get navigation info for sub-lessons
        let navigation = null;
        if (lesson.is_sub_lesson || lesson.total_sub_lessons > 1) {
            const navigationResult = await query(`
                SELECT
                    prev_lesson.id as prev_lesson_id,
                    prev_lesson.name as prev_lesson_name,
                    next_lesson.id as next_lesson_id,
                    next_lesson.name as next_lesson_name
                FROM lessons current_lesson
                LEFT JOIN lessons prev_lesson ON (
                    prev_lesson.parent_lesson_id = current_lesson.parent_lesson_id
                    AND prev_lesson.sequence_number = current_lesson.sequence_number - 1
                    AND prev_lesson.is_active = true
                )
                LEFT JOIN lessons next_lesson ON (
                    next_lesson.parent_lesson_id = current_lesson.parent_lesson_id
                    AND next_lesson.sequence_number = current_lesson.sequence_number + 1
                    AND next_lesson.is_active = true
                )
                WHERE current_lesson.id = $1
            `, [lessonId]);

            if (navigationResult.rows.length > 0) {
                const nav = navigationResult.rows[0];
                navigation = {
                    previous_lesson: nav.prev_lesson_id ? {
                        id: nav.prev_lesson_id,
                        name: nav.prev_lesson_name
                    } : null,
                    next_lesson: nav.next_lesson_id ? {
                        id: nav.next_lesson_id,
                        name: nav.next_lesson_name
                    } : null
                };
            }
        }

        // Return actual lesson data with navigation
        return NextResponse.json({
            success: true,
            lesson: {
                id: lesson.id,
                name: lesson.name,
                description: lesson.description,
                skill_name: lesson.skill_name,
                skill_description: lesson.skill_description,
                position: lesson.position,
                difficulty_level: lesson.difficulty_level,
                estimated_minutes: lesson.estimated_minutes,
                cefr_level: lesson.cefr_level,
                content_areas: ['vocabulary', 'pronunciation', 'grammar'],
                // Sub-lesson navigation info
                is_sub_lesson: lesson.is_sub_lesson,
                parent_lesson_id: lesson.parent_lesson_id,
                parent_lesson_name: lesson.parent_lesson_name,
                current_sub_lesson: lesson.current_sub_lesson,
                total_sub_lessons: lesson.total_sub_lessons_actual,
                lesson_type: lesson.is_sub_lesson ? 'sub_lesson' : (lesson.total_sub_lessons > 1 ? 'parent' : 'single')
            },
            content: content,
            navigation: navigation,
            metadata: {
                totalPhrases: content.length,
                averageDifficulty: content.reduce((sum, item) => sum + item.difficulty_level, 0) / content.length,
                estimatedTime: lesson.estimated_minutes || 15,
                hasAudio: false, // Will be true when audio is implemented
                hasCulturalContext: content.some(item => item.cultural_context),
                // Sub-lesson progress info
                sub_lesson_progress: lesson.is_sub_lesson ? {
                    current: lesson.current_sub_lesson,
                    total: lesson.total_sub_lessons_actual,
                    percentage: Math.round((lesson.current_sub_lesson / lesson.total_sub_lessons_actual) * 100)
                } : null
            }
        });

    } catch (error) {
        console.error('Lesson content API error:', error);
        return NextResponse.json(
            { success: false, error: `Failed to load lesson content: ${error.message}` },
            { status: 500 }
        );
    }
}