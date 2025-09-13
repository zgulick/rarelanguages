/**
 * Lesson Content API for Albanian Learning Experience
 * GET /api/lessons/[id]/content - Get lesson content with phrases and metadata
 */
import { NextResponse } from 'next/server';
const { query } = require('../../../../../../lib/database');

export async function GET(request, { params }) {
    try {
        const lessonId = params.id;

        // Get lesson basic info with skill details
        const lessonResult = await query(`
            SELECT 
                l.*,
                s.name as skill_name,
                s.description as skill_description,
                s.cefr_level
            FROM lessons l
            JOIN skills s ON l.skill_id = s.id
            WHERE l.id = $1 AND l.is_active = true
        `, [lessonId]);

        if (lessonResult.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Lesson not found or inactive' },
                { status: 404 }
            );
        }

        const lesson = lessonResult.rows[0];

        // Get lesson content (phrases) with all necessary fields
        const contentResult = await query(`
            SELECT 
                lc.id,
                lc.english_phrase,
                lc.target_phrase,
                lc.pronunciation_guide,
                lc.difficulty_level,
                lc.content_type,
                lc.cultural_context,
                lc.grammar_notes,
                lc.position
            FROM lesson_content lc
            WHERE lc.lesson_id = $1
            ORDER BY lc.position ASC, lc.id ASC
        `, [lessonId]);

        const content = contentResult.rows.map(item => ({
            id: item.id,
            english_phrase: item.english_phrase,
            target_phrase: item.target_phrase,
            pronunciation_guide: item.pronunciation_guide || 'Pronunciation guide available',
            difficulty_level: item.difficulty_level || 1,
            content_type: item.content_type || 'phrase',
            cultural_context: item.cultural_context || null,
            grammar_notes: item.grammar_notes || null,
            position: item.position || 1
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

        // Return actual lesson data
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
                content_areas: ['vocabulary', 'pronunciation', 'grammar']
            },
            content: content,
            metadata: {
                totalPhrases: content.length,
                averageDifficulty: content.reduce((sum, item) => sum + item.difficulty_level, 0) / content.length,
                estimatedTime: lesson.estimated_minutes || 15,
                hasAudio: false, // Will be true when audio is implemented
                hasCulturalContext: content.some(item => item.cultural_context)
            }
        });

    } catch (error) {
        console.error('Lesson content API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to load lesson content' },
            { status: 500 }
        );
    }
}