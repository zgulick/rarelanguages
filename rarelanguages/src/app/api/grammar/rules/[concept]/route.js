/**
 * Grammar Rules API for Albanian Learning Experience
 * GET /api/grammar/rules/[concept] - Get grammar rule explanations and exercises
 */
import { NextResponse } from 'next/server';
const { query } = require('../../../../../../lib/database');

export async function GET(request, { params }) {
    try {
        const resolvedParams = await params;
        const concept = resolvedParams.concept;

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const difficulty = searchParams.get('difficulty');
        const cefrLevel = searchParams.get('cefr_level');
        const includeExercises = searchParams.get('include_exercises') !== 'false';
        const includeExamples = searchParams.get('include_examples') !== 'false';

        // Build WHERE clause for concept search
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        // Search by category, subcategory, or rule name
        whereConditions.push(`(
            gr.category ILIKE $${paramIndex} OR
            gr.subcategory ILIKE $${paramIndex} OR
            gr.rule_name ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${concept}%`);
        paramIndex++;

        // Add difficulty filter if provided
        if (difficulty) {
            whereConditions.push(`gr.difficulty_level = $${paramIndex}`);
            queryParams.push(parseInt(difficulty));
            paramIndex++;
        }

        // Add CEFR level filter if provided
        if (cefrLevel) {
            whereConditions.push(`gr.cefr_level = $${paramIndex}`);
            queryParams.push(cefrLevel);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        // Get grammar rules matching the concept
        const rulesResult = await query(`
            SELECT
                gr.id as rule_id,
                gr.rule_name,
                gr.category,
                gr.subcategory,
                gr.explanation,
                gr.simple_explanation,
                gr.examples,
                gr.difficulty_level,
                gr.cefr_level,
                gr.prerequisite_rules,
                gr.usage_frequency,
                gr.is_exception,
                gr.parent_rule_id,
                parent_rule.rule_name as parent_rule_name,
                parent_rule.explanation as parent_rule_explanation,
                l.id as lesson_id,
                l.name as lesson_name,
                s.id as skill_id,
                s.name as skill_name
            FROM grammar_rules gr
            LEFT JOIN grammar_rules parent_rule ON gr.parent_rule_id = parent_rule.id
            LEFT JOIN lessons l ON gr.lesson_id = l.id
            LEFT JOIN skills s ON gr.skill_id = s.id
            ${whereClause}
            ORDER BY gr.usage_frequency DESC, gr.difficulty_level ASC, gr.rule_name
        `, queryParams);

        if (rulesResult.rows.length === 0) {
            return NextResponse.json({
                success: true,
                concept: concept,
                rules: [],
                message: `No grammar rules found for concept: ${concept}`
            });
        }

        // Get prerequisite rule details if needed
        const allPrerequisiteIds = [...new Set(
            rulesResult.rows
                .flatMap(row => row.prerequisite_rules || [])
                .filter(Boolean)
        )];

        let prerequisitesResult = { rows: [] };
        if (allPrerequisiteIds.length > 0) {
            prerequisitesResult = await query(`
                SELECT id, rule_name, category, difficulty_level, cefr_level
                FROM grammar_rules
                WHERE id = ANY($1)
            `, [allPrerequisiteIds]);
        }

        // Get exercises if requested
        let exercisesResult = { rows: [] };
        if (includeExercises) {
            const ruleIds = rulesResult.rows.map(row => row.rule_id);
            exercisesResult = await query(`
                SELECT
                    ge.id as exercise_id,
                    ge.rule_id,
                    ge.exercise_type,
                    ge.question_data,
                    ge.correct_answer,
                    ge.explanation,
                    ge.difficulty_level,
                    ge.hints,
                    ge.common_mistakes,
                    ge.estimated_time_seconds
                FROM grammar_exercises ge
                WHERE ge.rule_id = ANY($1)
                ORDER BY ge.difficulty_level ASC, ge.exercise_type
            `, [ruleIds]);
        }

        // Get related patterns
        const ruleIds = rulesResult.rows.map(row => row.rule_id);
        const patternsResult = await query(`
            SELECT
                gp.id as pattern_id,
                gp.pattern_name,
                gp.pattern_type,
                gp.pattern_template,
                gp.description,
                gp.examples as pattern_examples,
                gp.exceptions,
                gp.frequency_score,
                unnest(gp.related_rules) as related_rule_id
            FROM grammar_patterns gp
            WHERE gp.related_rules && $1
        `, [ruleIds]);

        // Organize data
        const rulesWithDetails = rulesResult.rows.map(rule => {
            // Get prerequisites for this rule
            const prerequisites = (rule.prerequisite_rules || []).map(prereqId => {
                const prereq = prerequisitesResult.rows.find(p => p.id === prereqId);
                return prereq ? {
                    id: prereq.id,
                    rule_name: prereq.rule_name,
                    category: prereq.category,
                    difficulty_level: prereq.difficulty_level,
                    cefr_level: prereq.cefr_level
                } : null;
            }).filter(Boolean);

            // Get exercises for this rule
            const exercises = includeExercises ?
                exercisesResult.rows.filter(ex => ex.rule_id === rule.rule_id) :
                [];

            // Get related patterns
            const relatedPatterns = patternsResult.rows
                .filter(p => p.related_rule_id === rule.rule_id)
                .map(p => ({
                    pattern_id: p.pattern_id,
                    pattern_name: p.pattern_name,
                    pattern_type: p.pattern_type,
                    pattern_template: p.pattern_template,
                    description: p.description,
                    examples: p.pattern_examples,
                    exceptions: p.exceptions,
                    frequency_score: p.frequency_score
                }));

            return {
                rule_id: rule.rule_id,
                rule_name: rule.rule_name,
                category: rule.category,
                subcategory: rule.subcategory,
                explanation: rule.explanation,
                simple_explanation: rule.simple_explanation,
                examples: includeExamples ? rule.examples : null,
                difficulty_level: rule.difficulty_level,
                cefr_level: rule.cefr_level,
                usage_frequency: rule.usage_frequency,
                is_exception: rule.is_exception,
                parent_rule: rule.parent_rule_id ? {
                    id: rule.parent_rule_id,
                    name: rule.parent_rule_name,
                    explanation: rule.parent_rule_explanation
                } : null,
                prerequisites: prerequisites,
                lesson_association: rule.lesson_id ? {
                    lesson_id: rule.lesson_id,
                    lesson_name: rule.lesson_name
                } : null,
                skill_association: rule.skill_id ? {
                    skill_id: rule.skill_id,
                    skill_name: rule.skill_name
                } : null,
                exercises: exercises.map(ex => ({
                    exercise_id: ex.exercise_id,
                    exercise_type: ex.exercise_type,
                    question_data: ex.question_data,
                    correct_answer: ex.correct_answer,
                    explanation: ex.explanation,
                    difficulty_level: ex.difficulty_level,
                    hints: ex.hints,
                    common_mistakes: ex.common_mistakes,
                    estimated_time_seconds: ex.estimated_time_seconds
                })),
                related_patterns: relatedPatterns
            };
        });

        // Calculate summary statistics
        const categories = [...new Set(rulesResult.rows.map(r => r.category))];
        const difficultyLevels = [...new Set(rulesResult.rows.map(r => r.difficulty_level))];
        const cefrLevels = [...new Set(rulesResult.rows.map(r => r.cefr_level).filter(Boolean))];
        const totalExercises = exercisesResult.rows.length;

        return NextResponse.json({
            success: true,
            concept: concept,
            rules: rulesWithDetails,
            summary: {
                total_rules: rulesWithDetails.length,
                categories: categories,
                difficulty_levels: difficultyLevels,
                cefr_levels: cefrLevels,
                total_exercises: totalExercises,
                has_exceptions: rulesWithDetails.some(r => r.is_exception),
                average_difficulty: rulesResult.rows.reduce((sum, r) => sum + r.difficulty_level, 0) / rulesResult.rows.length
            },
            filters: {
                applied_difficulty: difficulty,
                applied_cefr_level: cefrLevel,
                include_exercises: includeExercises,
                include_examples: includeExamples
            },
            metadata: {
                api_version: '1.0',
                data_source: 'grammar_rules_system',
                supports_exercises: true,
                supports_patterns: true,
                supports_prerequisites: true
            }
        });

    } catch (error) {
        console.error('Grammar rules API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: `Failed to load grammar rules: ${error.message}`,
                concept: resolvedParams?.concept || 'unknown'
            },
            { status: 500 }
        );
    }
}