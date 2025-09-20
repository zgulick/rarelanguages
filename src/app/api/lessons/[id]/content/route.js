/**
 * Lesson Content API for Albanian Learning Experience
 * GET /api/lessons/[id]/content - Get lesson content with phrases and metadata
 */
import { NextResponse } from 'next/server';
const { query } = require('../../../../../../lib/database');

export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const lessonId = resolvedParams.id;

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

        // Get structured lesson content organized by sections
        const contentResult = await query(`
            SELECT
                ls.id as section_id,
                ls.section_type,
                ls.section_order,
                ls.title as section_title,
                ls.description as section_description,
                ls.estimated_minutes as section_minutes,
                lc.id as content_id,
                lc.english_phrase,
                lc.target_phrase,
                lc.pronunciation_guide,
                lc.cultural_context,
                lc.content_order,
                lc.content_section_type,
                lc.difficulty_progression,
                lc.is_key_concept,
                lc.learning_objective,
                lc.word_type,
                lc.verb_type,
                lc.gender,
                lc.stress_pattern,
                lc.conjugation_data,
                lc.grammar_category,
                lc.difficulty_notes,
                lc.usage_examples
            FROM lesson_sections ls
            LEFT JOIN lesson_content lc ON ls.id = lc.section_id
            WHERE ls.lesson_id = $1
            ORDER BY ls.section_order, lc.content_order, lc.id
        `, [lessonId]);

        // Group content by sections for structured learning flow
        const sectionsMap = new Map();

        contentResult.rows.forEach(row => {
            const sectionId = row.section_id;

            if (!sectionsMap.has(sectionId)) {
                sectionsMap.set(sectionId, {
                    section_id: sectionId,
                    section_type: row.section_type,
                    section_order: row.section_order,
                    title: row.section_title,
                    description: row.section_description,
                    estimated_minutes: row.section_minutes,
                    content: []
                });
            }

            // Only add content if it exists (some sections might not have content yet)
            if (row.content_id) {
                sectionsMap.get(sectionId).content.push({
                    id: row.content_id,
                    english_phrase: row.english_phrase,
                    target_phrase: row.target_phrase,
                    pronunciation_guide: row.pronunciation_guide,
                    cultural_context: row.cultural_context || null,
                    content_order: row.content_order,
                    difficulty_progression: row.difficulty_progression || 1,
                    is_key_concept: row.is_key_concept || false,
                    learning_objective: row.learning_objective,
                    word_type: row.word_type || null,
                    verb_type: row.verb_type || null,
                    gender: row.gender || null,
                    stress_pattern: row.stress_pattern || null,
                    conjugation_data: row.conjugation_data || null,
                    grammar_category: row.grammar_category || null,
                    difficulty_notes: row.difficulty_notes || null,
                    usage_examples: row.usage_examples || null
                });
            }
        });

        // Convert to array and sort by section order
        const sections = Array.from(sectionsMap.values()).sort((a, b) => a.section_order - b.section_order);

        // If no sections found, return sample structured content for demo
        if (sections.length === 0) {
            const sampleSections = [
                {
                    section_id: 'sample-intro',
                    section_type: 'introduction',
                    section_order: 1,
                    title: 'Lesson Introduction',
                    description: 'Welcome to your Albanian lesson!',
                    estimated_minutes: 2,
                    content: [{
                        id: 'intro-1',
                        english_phrase: 'Welcome to Albanian!',
                        target_phrase: 'Mirë se vini në shqip!',
                        pronunciation_guide: 'Mee-ruh seh vee-nee nuh shkeep!',
                        learning_objective: 'Start your Albanian learning journey'
                    }]
                },
                {
                    section_id: 'sample-vocab',
                    section_type: 'vocabulary',
                    section_order: 2,
                    title: 'Core Vocabulary',
                    description: 'Essential words and phrases',
                    estimated_minutes: 5,
                    content: [
                        {
                            id: 'vocab-1',
                            english_phrase: 'Hello',
                            target_phrase: 'Përshëndetje',
                            pronunciation_guide: 'Per-shen-det-yeh',
                            is_key_concept: true,
                            learning_objective: 'Learn essential Albanian greetings'
                        },
                        {
                            id: 'vocab-2',
                            english_phrase: 'Thank you',
                            target_phrase: 'Faleminderit',
                            pronunciation_guide: 'Fah-leh-min-deh-rit',
                            is_key_concept: true,
                            learning_objective: 'Express gratitude politely'
                        }
                    ]
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
                    content_areas: ['introduction', 'vocabulary', 'pronunciation'],
                    structure_version: 2
                },
                sections: sampleSections,
                content: sampleSections.reduce((all, s) => all.concat(s.content.map(c => ({...c, difficulty_level: 1, content_type: 'phrase', position: all.length + 1, grammar_notes: null}))), []),
                metadata: {
                    totalSections: sampleSections.length,
                    totalContent: sampleSections.reduce((sum, s) => sum + s.content.length, 0),
                    totalPhrases: sampleSections.reduce((sum, s) => sum + s.content.length, 0),
                    averageDifficulty: 1.0,
                    estimatedTime: sampleSections.reduce((sum, s) => sum + s.estimated_minutes, 0),
                    hasStructuredFlow: true,
                    hasAudio: false,
                    hasCulturalContext: false,
                    pedagogicalApproach: 'introduction_vocab_practice'
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

        // Calculate metadata from sections
        const totalContent = sections.reduce((sum, section) => sum + section.content.length, 0);
        const totalEstimatedTime = sections.reduce((sum, section) => sum + (section.estimated_minutes || 0), 0);
        const averageDifficulty = totalContent > 0 ?
            sections.reduce((sum, section) =>
                sum + section.content.reduce((contentSum, item) =>
                    contentSum + (item.difficulty_progression || 1), 0), 0
            ) / totalContent : 1;

        // Flatten sections into single content array for backward compatibility
        const flattenedContent = sections.reduce((allContent, section) => {
            return allContent.concat(section.content.map(item => ({
                ...item,
                difficulty_level: item.difficulty_progression || 1,
                content_type: 'phrase',
                position: allContent.length + 1,
                grammar_notes: null,
                section_info: {
                    section_type: section.section_type,
                    section_title: section.title,
                    section_order: section.section_order
                }
            })));
        }, []);

        // Return structured lesson data with both sections (new) and content (backward compatibility)
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
                content_areas: sections.map(s => s.section_type),
                structure_version: 2,
                pedagogical_approach: 'structured_progression',
                // Sub-lesson navigation info
                is_sub_lesson: lesson.is_sub_lesson,
                parent_lesson_id: lesson.parent_lesson_id,
                parent_lesson_name: lesson.parent_lesson_name,
                current_sub_lesson: lesson.current_sub_lesson,
                total_sub_lessons: lesson.total_sub_lessons_actual,
                lesson_type: lesson.is_sub_lesson ? 'sub_lesson' : (lesson.total_sub_lessons > 1 ? 'parent' : 'single')
            },
            sections: sections,
            content: flattenedContent, // Backward compatibility
            navigation: navigation,
            metadata: {
                totalSections: sections.length,
                totalContent: flattenedContent.length,
                totalPhrases: flattenedContent.length, // Backward compatibility
                averageDifficulty: averageDifficulty,
                estimatedTime: totalEstimatedTime || lesson.estimated_minutes || 15,
                hasStructuredFlow: true,
                hasIntroduction: sections.some(s => s.section_type === 'introduction'),
                hasVocabulary: sections.some(s => s.section_type === 'vocabulary'),
                hasPronunciation: sections.some(s => s.section_type === 'pronunciation'),
                hasGrammar: sections.some(s => s.section_type === 'grammar'),
                hasPractice: sections.some(s => s.section_type === 'practice'),
                hasAudio: false, // Backward compatibility
                hasCulturalContext: flattenedContent.some(item => item.cultural_context), // Backward compatibility
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