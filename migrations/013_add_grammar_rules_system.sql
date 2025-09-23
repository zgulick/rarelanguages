-- Migration 013: Add Grammar Rules System
-- This migration adds comprehensive grammar instruction support to the Albanian learning app
-- Follows additive-only approach - no changes to existing tables

BEGIN;

-- Create grammar rules table for structured grammar explanations
CREATE TABLE grammar_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'noun_declension', 'verb_conjugation', 'adjective_agreement', 'syntax', 'phonology'
    subcategory VARCHAR(50), -- More specific classification within category
    explanation TEXT NOT NULL,
    simple_explanation TEXT, -- Simplified version for beginners
    examples JSONB NOT NULL, -- Array of example objects with albanian/english/explanation
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 5),
    cefr_level VARCHAR(5), -- 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
    prerequisite_rules UUID[], -- Array of rule IDs that should be learned first
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL, -- Optional association with specific lesson
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL, -- Optional association with skill
    usage_frequency INTEGER DEFAULT 5 CHECK (usage_frequency BETWEEN 1 AND 10), -- How commonly this rule is needed
    is_exception BOOLEAN DEFAULT false, -- Is this an exception to a more general rule
    parent_rule_id UUID REFERENCES grammar_rules(id), -- For exception rules, reference to parent rule
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create grammar exercises table for practice activities
CREATE TABLE grammar_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES grammar_rules(id) ON DELETE CASCADE,
    exercise_type VARCHAR(50) NOT NULL, -- 'fill_blank', 'multiple_choice', 'transformation', 'translation', 'correction'
    question_data JSONB NOT NULL, -- Contains question text, options, etc.
    correct_answer JSONB NOT NULL, -- Contains correct answer(s) and acceptable variations
    explanation TEXT, -- Explanation of why this is the correct answer
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 5),
    hints JSONB, -- Array of progressive hints
    common_mistakes JSONB, -- Array of common incorrect answers with explanations
    estimated_time_seconds INTEGER DEFAULT 30,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create grammar patterns table for systematic pattern recognition
CREATE TABLE grammar_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_name VARCHAR(100) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL, -- 'inflection', 'word_order', 'agreement', 'transformation'
    pattern_template TEXT NOT NULL, -- Template showing the pattern (e.g., "adjective + noun agreement")
    description TEXT NOT NULL,
    examples JSONB NOT NULL, -- Examples demonstrating the pattern
    exceptions JSONB, -- Common exceptions to this pattern
    related_rules UUID[], -- Array of grammar rule IDs related to this pattern
    frequency_score INTEGER DEFAULT 5 CHECK (frequency_score BETWEEN 1 AND 10),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create lesson grammar content table to associate grammar rules with specific lessons
CREATE TABLE lesson_grammar_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES grammar_rules(id) ON DELETE CASCADE,
    content_order INTEGER NOT NULL,
    introduction_text TEXT, -- Lesson-specific introduction to this rule
    focus_points TEXT[], -- What aspects of this rule to emphasize in this lesson
    practice_exercises UUID[], -- Array of exercise IDs for this lesson
    is_review BOOLEAN DEFAULT false, -- Is this a review of a previously introduced rule
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for efficient queries
CREATE INDEX idx_grammar_rules_category ON grammar_rules(category);
CREATE INDEX idx_grammar_rules_difficulty ON grammar_rules(difficulty_level);
CREATE INDEX idx_grammar_rules_lesson ON grammar_rules(lesson_id);
CREATE INDEX idx_grammar_rules_skill ON grammar_rules(skill_id);
CREATE INDEX idx_grammar_exercises_rule ON grammar_exercises(rule_id);
CREATE INDEX idx_grammar_exercises_type ON grammar_exercises(exercise_type);
CREATE INDEX idx_grammar_patterns_type ON grammar_patterns(pattern_type);
CREATE INDEX idx_lesson_grammar_content_lesson ON lesson_grammar_content(lesson_id);
CREATE INDEX idx_lesson_grammar_content_order ON lesson_grammar_content(lesson_id, content_order);

-- Add constraints for data integrity
ALTER TABLE grammar_rules
ADD CONSTRAINT valid_category CHECK (category IN ('noun_declension', 'verb_conjugation', 'adjective_agreement', 'syntax', 'phonology', 'articles', 'pronouns', 'prepositions')),
ADD CONSTRAINT valid_cefr_level CHECK (cefr_level IS NULL OR cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));

ALTER TABLE grammar_exercises
ADD CONSTRAINT valid_exercise_type CHECK (exercise_type IN ('fill_blank', 'multiple_choice', 'transformation', 'translation', 'correction', 'ordering'));

ALTER TABLE grammar_patterns
ADD CONSTRAINT valid_pattern_type CHECK (pattern_type IN ('inflection', 'word_order', 'agreement', 'transformation', 'phonological'));

-- Create unique constraints
ALTER TABLE lesson_grammar_content
ADD CONSTRAINT unique_lesson_rule_order UNIQUE (lesson_id, rule_id, content_order);

-- Create helpful views for grammar content queries

-- View for complete grammar rule information
CREATE VIEW grammar_rules_complete AS
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
    gr.usage_frequency,
    gr.is_exception,
    parent_rule.rule_name as parent_rule_name,
    l.name as lesson_name,
    s.name as skill_name,
    COUNT(ge.id) as exercise_count,
    ARRAY_AGG(DISTINCT gp.pattern_name ORDER BY gp.pattern_name) FILTER (WHERE gp.pattern_name IS NOT NULL) as related_patterns
FROM grammar_rules gr
LEFT JOIN grammar_rules parent_rule ON gr.parent_rule_id = parent_rule.id
LEFT JOIN lessons l ON gr.lesson_id = l.id
LEFT JOIN skills s ON gr.skill_id = s.id
LEFT JOIN grammar_exercises ge ON gr.id = ge.rule_id
LEFT JOIN grammar_patterns gp ON gr.id = ANY(gp.related_rules)
GROUP BY gr.id, gr.rule_name, gr.category, gr.subcategory, gr.explanation,
         gr.simple_explanation, gr.examples, gr.difficulty_level, gr.cefr_level,
         gr.usage_frequency, gr.is_exception, parent_rule.rule_name, l.name, s.name;

-- View for lesson grammar overview
CREATE VIEW lesson_grammar_overview AS
SELECT
    l.id as lesson_id,
    l.name as lesson_name,
    COUNT(DISTINCT lgc.rule_id) as total_grammar_rules,
    COUNT(DISTINCT ge.id) as total_exercises,
    ARRAY_AGG(DISTINCT gr.category ORDER BY gr.category) as grammar_categories,
    AVG(gr.difficulty_level) as avg_difficulty,
    ARRAY_AGG(DISTINCT gr.cefr_level ORDER BY gr.cefr_level) FILTER (WHERE gr.cefr_level IS NOT NULL) as cefr_levels
FROM lessons l
LEFT JOIN lesson_grammar_content lgc ON l.id = lgc.lesson_id
LEFT JOIN grammar_rules gr ON lgc.rule_id = gr.id
LEFT JOIN grammar_exercises ge ON gr.id = ge.rule_id
WHERE l.is_active = true
GROUP BY l.id, l.name;

-- View for grammar rule dependencies (prerequisite tracking)
CREATE VIEW grammar_rule_dependencies AS
WITH RECURSIVE rule_deps AS (
    -- Base case: rules with no prerequisites
    SELECT id, rule_name, prerequisite_rules, 0 as depth
    FROM grammar_rules
    WHERE prerequisite_rules IS NULL OR array_length(prerequisite_rules, 1) = 0

    UNION ALL

    -- Recursive case: rules that depend on rules we've already processed
    SELECT gr.id, gr.rule_name, gr.prerequisite_rules, rd.depth + 1
    FROM grammar_rules gr
    JOIN rule_deps rd ON rd.id = ANY(gr.prerequisite_rules)
    WHERE gr.prerequisite_rules IS NOT NULL
    AND array_length(gr.prerequisite_rules, 1) > 0
)
SELECT * FROM rule_deps;

COMMIT;