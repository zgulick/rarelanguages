/**
 * Verb Conjugations API for Albanian Learning Experience
 * GET /api/lessons/[id]/conjugations - Get verb conjugation data for lesson
 */
import { NextResponse } from 'next/server';
const { query } = require('../../../../../../lib/database');

export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const lessonId = resolvedParams.id;

        // Get all verbs in this lesson with their conjugation data
        const verbsResult = await query(`
            SELECT
                lc.id as verb_id,
                lc.english_phrase,
                lc.target_phrase,
                lc.pronunciation_guide,
                lc.cultural_context,
                lc.difficulty_notes,
                lc.conjugation_data as legacy_conjugation_data,
                vr.root_form,
                vr.verb_class,
                vr.stem_changes,
                vr.notes as root_notes
            FROM lesson_content lc
            LEFT JOIN verb_roots vr ON lc.id = vr.verb_id
            WHERE lc.lesson_id = $1
            AND lc.word_type = 'verb'
            ORDER BY lc.content_order, lc.id
        `, [lessonId]);

        if (verbsResult.rows.length === 0) {
            return NextResponse.json({
                success: true,
                lesson_id: lessonId,
                verbs: [],
                message: 'No verbs found in this lesson'
            });
        }

        // Get conjugation data for all verbs in the lesson
        const verbIds = verbsResult.rows.map(row => row.verb_id);
        const conjugationsResult = await query(`
            SELECT
                vc.verb_id,
                vc.tense,
                vc.person,
                vc.number,
                vc.conjugated_form,
                vc.pronunciation_guide as conjugated_pronunciation,
                vc.usage_notes,
                vc.is_irregular,
                vc.frequency_rank
            FROM verb_conjugations vc
            WHERE vc.verb_id = ANY($1)
            ORDER BY
                vc.verb_id,
                CASE vc.tense
                    WHEN 'present' THEN 1
                    WHEN 'past' THEN 2
                    WHEN 'future' THEN 3
                    WHEN 'perfect' THEN 4
                    WHEN 'conditional' THEN 5
                    WHEN 'subjunctive' THEN 6
                    WHEN 'imperative' THEN 7
                    ELSE 8
                END,
                CASE vc.person
                    WHEN 'first' THEN 1
                    WHEN 'second' THEN 2
                    WHEN 'third' THEN 3
                    ELSE 4
                END,
                CASE vc.number
                    WHEN 'singular' THEN 1
                    WHEN 'plural' THEN 2
                    ELSE 3
                END
        `, [verbIds]);

        // Get paradigm patterns for verb classes found in this lesson
        const verbClasses = [...new Set(verbsResult.rows
            .map(row => row.verb_class)
            .filter(Boolean)
        )];

        let paradigmsResult = { rows: [] };
        if (verbClasses.length > 0) {
            paradigmsResult = await query(`
                SELECT
                    vp.verb_type,
                    vp.tense,
                    vp.pattern_template,
                    vp.description,
                    vp.usage_frequency,
                    lc.english_phrase as example_verb_english,
                    lc.target_phrase as example_verb_albanian
                FROM verb_paradigms vp
                LEFT JOIN lesson_content lc ON vp.example_verb_id = lc.id
                WHERE vp.verb_type = ANY($1)
                ORDER BY vp.verb_type, vp.tense
            `, [verbClasses]);
        }

        // Organize data by verb
        const verbsWithConjugations = verbsResult.rows.map(verb => {
            // Get conjugations for this specific verb
            const verbConjugations = conjugationsResult.rows.filter(
                conj => conj.verb_id === verb.verb_id
            );

            // Organize conjugations by tense
            const conjugationsByTense = {};
            verbConjugations.forEach(conj => {
                if (!conjugationsByTense[conj.tense]) {
                    conjugationsByTense[conj.tense] = {};
                }

                const personKey = `${conj.person}_${conj.number}`;
                conjugationsByTense[conj.tense][personKey] = {
                    form: conj.conjugated_form,
                    pronunciation: conj.conjugated_pronunciation,
                    usage_notes: conj.usage_notes,
                    is_irregular: conj.is_irregular,
                    frequency_rank: conj.frequency_rank
                };
            });

            // Get available tenses for this verb
            const availableTenses = Object.keys(conjugationsByTense);

            // Get paradigm information for this verb's class
            const paradigms = verb.verb_class ?
                paradigmsResult.rows.filter(p => p.verb_type === verb.verb_class) :
                [];

            return {
                verb_id: verb.verb_id,
                english_phrase: verb.english_phrase,
                target_phrase: verb.target_phrase,
                pronunciation_guide: verb.pronunciation_guide,
                cultural_context: verb.cultural_context,
                difficulty_notes: verb.difficulty_notes,
                root_info: {
                    root_form: verb.root_form,
                    verb_class: verb.verb_class,
                    stem_changes: verb.stem_changes,
                    notes: verb.root_notes
                },
                conjugations: {
                    by_tense: conjugationsByTense,
                    available_tenses: availableTenses,
                    total_forms: verbConjugations.length
                },
                paradigms: paradigms.map(p => ({
                    tense: p.tense,
                    pattern_template: p.pattern_template,
                    description: p.description,
                    usage_frequency: p.usage_frequency,
                    example_verb: {
                        english: p.example_verb_english,
                        albanian: p.example_verb_albanian
                    }
                })),
                // Include legacy conjugation data for backward compatibility
                legacy_conjugation_data: verb.legacy_conjugation_data
            };
        });

        // Calculate summary statistics
        const totalConjugations = conjugationsResult.rows.length;
        const uniqueTenses = [...new Set(conjugationsResult.rows.map(r => r.tense))];
        const hasIrregularVerbs = conjugationsResult.rows.some(r => r.is_irregular);

        return NextResponse.json({
            success: true,
            lesson_id: lessonId,
            verbs: verbsWithConjugations,
            summary: {
                total_verbs: verbsWithConjugations.length,
                total_conjugations: totalConjugations,
                available_tenses: uniqueTenses,
                verb_classes: verbClasses,
                has_irregular_verbs: hasIrregularVerbs,
                conjugation_coverage: verbsWithConjugations.map(v => ({
                    verb_id: v.verb_id,
                    target_phrase: v.target_phrase,
                    tense_count: v.conjugations.available_tenses.length,
                    total_forms: v.conjugations.total_forms
                }))
            },
            metadata: {
                api_version: '1.0',
                data_source: 'verb_conjugations_system',
                supports_paradigms: true,
                supports_pronunciation: true
            }
        });

    } catch (error) {
        console.error('Lesson conjugations API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: `Failed to load verb conjugations: ${error.message}`,
                lesson_id: resolvedParams?.id || 'unknown'
            },
            { status: 500 }
        );
    }
}