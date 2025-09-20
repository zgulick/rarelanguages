-- Migration 010: Lesson Structure Enhancement
-- Add proper lesson organization and content sequencing support

-- Add lesson section management
CREATE TABLE IF NOT EXISTS lesson_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    section_type VARCHAR(50) NOT NULL, -- 'introduction', 'vocabulary', 'pronunciation', 'grammar', 'sentences', 'practice'
    section_order INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    estimated_minutes INTEGER DEFAULT 5,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add content ordering and categorization to existing lesson_content
ALTER TABLE lesson_content
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES lesson_sections(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS content_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS content_section_type VARCHAR(50) DEFAULT 'vocabulary', -- 'intro', 'vocab', 'pronunciation', 'grammar', 'sentence', 'practice'
ADD COLUMN IF NOT EXISTS difficulty_progression INTEGER DEFAULT 1, -- 1-5 scale within lesson
ADD COLUMN IF NOT EXISTS is_key_concept BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prerequisites TEXT[], -- Array of required concepts
ADD COLUMN IF NOT EXISTS learning_objective VARCHAR(500);

-- Create index for efficient content ordering
CREATE INDEX IF NOT EXISTS idx_lesson_content_order ON lesson_content(lesson_id, section_id, content_order);
CREATE INDEX IF NOT EXISTS idx_lesson_sections_order ON lesson_sections(lesson_id, section_order);

-- Add lesson progression metadata
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS lesson_structure_version INTEGER DEFAULT 2, -- Track structure updates
ADD COLUMN IF NOT EXISTS pedagogical_approach VARCHAR(100) DEFAULT 'structured_progression',
ADD COLUMN IF NOT EXISTS content_focus TEXT[], -- Array like ['vocabulary', 'pronunciation', 'grammar']
ADD COLUMN IF NOT EXISTS prerequisite_skills TEXT[], -- Skills needed before this lesson
ADD COLUMN IF NOT EXISTS learning_outcomes TEXT[]; -- What students will achieve

-- Create standard lesson section templates
INSERT INTO lesson_sections (lesson_id, section_type, section_order, title, description, estimated_minutes)
SELECT
    l.id,
    unnest(ARRAY['introduction', 'vocabulary', 'pronunciation', 'grammar', 'sentences', 'practice']) as section_type,
    row_number() OVER (PARTITION BY l.id ORDER BY unnest(ARRAY['introduction', 'vocabulary', 'pronunciation', 'grammar', 'sentences', 'practice'])) as section_order,
    CASE unnest(ARRAY['introduction', 'vocabulary', 'pronunciation', 'grammar', 'sentences', 'practice'])
        WHEN 'introduction' THEN 'Unit Introduction'
        WHEN 'vocabulary' THEN 'Core Vocabulary'
        WHEN 'pronunciation' THEN 'Pronunciation Practice'
        WHEN 'grammar' THEN 'Grammar Basics'
        WHEN 'sentences' THEN 'Example Sentences'
        WHEN 'practice' THEN 'Practice & Review'
    END as title,
    CASE unnest(ARRAY['introduction', 'vocabulary', 'pronunciation', 'grammar', 'sentences', 'practice'])
        WHEN 'introduction' THEN 'Learn what you''ll discover in this lesson'
        WHEN 'vocabulary' THEN 'Master essential vocabulary words'
        WHEN 'pronunciation' THEN 'Practice correct Albanian pronunciation'
        WHEN 'grammar' THEN 'Understand basic grammar patterns'
        WHEN 'sentences' THEN 'See vocabulary used in context'
        WHEN 'practice' THEN 'Reinforce your learning'
    END as description,
    CASE unnest(ARRAY['introduction', 'vocabulary', 'pronunciation', 'grammar', 'sentences', 'practice'])
        WHEN 'introduction' THEN 2
        WHEN 'vocabulary' THEN 5
        WHEN 'pronunciation' THEN 4
        WHEN 'grammar' THEN 3
        WHEN 'sentences' THEN 4
        WHEN 'practice' THEN 5
    END as estimated_minutes
FROM lessons l
WHERE l.is_active = true
ON CONFLICT DO NOTHING; -- Prevent duplicates if run multiple times

-- Update existing content with better categorization based on current data
UPDATE lesson_content SET
    content_section_type = CASE
        WHEN grammar_category = 'greetings' AND word_type IN ('phrase', 'noun', 'pronoun') THEN 'vocabulary'
        WHEN grammar_category = 'numbers' THEN 'vocabulary'
        WHEN word_type = 'verb' AND target_phrase NOT LIKE '%?%' THEN 'grammar'
        WHEN target_phrase LIKE '%?%' THEN 'practice'
        WHEN LENGTH(target_phrase) > 20 THEN 'sentences'
        ELSE 'vocabulary'
    END,
    difficulty_progression = CASE
        WHEN word_type IN ('phrase', 'noun') AND LENGTH(target_phrase) <= 15 THEN 1
        WHEN word_type = 'verb' AND LENGTH(target_phrase) <= 20 THEN 2
        WHEN LENGTH(target_phrase) BETWEEN 21 AND 35 THEN 3
        WHEN LENGTH(target_phrase) > 35 THEN 4
        ELSE 1
    END,
    is_key_concept = CASE
        WHEN grammar_category IN ('greetings', 'courtesy', 'numbers') THEN true
        ELSE false
    END,
    learning_objective = CASE
        WHEN grammar_category = 'greetings' THEN 'Learn essential Albanian greetings for daily communication'
        WHEN grammar_category = 'numbers' THEN 'Master basic numbers for counting and describing quantities'
        WHEN grammar_category = 'courtesy' THEN 'Use polite expressions to show respect in Albanian culture'
        WHEN word_type = 'verb' THEN 'Understand basic Albanian verb usage and conjugation'
        ELSE 'Build fundamental Albanian vocabulary for everyday situations'
    END
WHERE content_section_type IS NULL OR content_section_type = 'vocabulary';

-- Assign content to appropriate lesson sections
UPDATE lesson_content lc SET
    section_id = ls.id,
    content_order = ROW_NUMBER() OVER (PARTITION BY lc.lesson_id, lc.content_section_type ORDER BY lc.difficulty_progression, lc.id)
FROM lesson_sections ls
WHERE lc.lesson_id = ls.lesson_id
AND ls.section_type = lc.content_section_type;

-- Add constraints to ensure data integrity
ALTER TABLE lesson_sections
ADD CONSTRAINT unique_lesson_section_order UNIQUE (lesson_id, section_order),
ADD CONSTRAINT valid_section_type CHECK (section_type IN ('introduction', 'vocabulary', 'pronunciation', 'grammar', 'sentences', 'practice'));

ALTER TABLE lesson_content
ADD CONSTRAINT valid_content_section_type CHECK (content_section_type IN ('intro', 'vocabulary', 'pronunciation', 'grammar', 'sentences', 'practice')),
ADD CONSTRAINT valid_difficulty_progression CHECK (difficulty_progression BETWEEN 1 AND 5);

-- Create helpful views for lesson structure queries
CREATE OR REPLACE VIEW lesson_structure_overview AS
SELECT
    l.id as lesson_id,
    l.name as lesson_name,
    s.name as skill_name,
    COUNT(DISTINCT ls.id) as total_sections,
    COUNT(lc.id) as total_content_items,
    ARRAY_AGG(DISTINCT ls.section_type ORDER BY ls.section_order) as section_types,
    AVG(lc.difficulty_progression) as avg_difficulty,
    l.estimated_minutes
FROM lessons l
JOIN skills s ON l.skill_id = s.id
LEFT JOIN lesson_sections ls ON l.id = ls.lesson_id
LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
WHERE l.is_active = true
GROUP BY l.id, l.name, s.name, l.estimated_minutes;

-- Create view for structured lesson content delivery
CREATE OR REPLACE VIEW structured_lesson_content AS
SELECT
    l.id as lesson_id,
    l.name as lesson_name,
    ls.id as section_id,
    ls.section_type,
    ls.section_order,
    ls.title as section_title,
    ls.description as section_description,
    lc.id as content_id,
    lc.english_phrase,
    lc.target_phrase,
    lc.pronunciation_guide,
    lc.content_order,
    lc.content_section_type,
    lc.difficulty_progression,
    lc.is_key_concept,
    lc.learning_objective,
    lc.word_type,
    lc.grammar_category
FROM lessons l
JOIN lesson_sections ls ON l.id = ls.lesson_id
LEFT JOIN lesson_content lc ON ls.id = lc.section_id
WHERE l.is_active = true
ORDER BY l.position, ls.section_order, lc.content_order;