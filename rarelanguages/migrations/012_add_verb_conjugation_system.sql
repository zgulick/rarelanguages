-- Migration 012: Add Verb Conjugation System
-- This migration adds comprehensive verb conjugation support to the Albanian learning app
-- Follows additive-only approach - no changes to existing tables

BEGIN;

-- Create verb conjugations table for detailed conjugation data
CREATE TABLE verb_conjugations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verb_id UUID NOT NULL REFERENCES lesson_content(id) ON DELETE CASCADE,
    tense VARCHAR(50) NOT NULL, -- 'present', 'past', 'future', 'perfect', 'conditional', 'subjunctive'
    person VARCHAR(10) NOT NULL, -- 'first', 'second', 'third'
    number VARCHAR(10) NOT NULL, -- 'singular', 'plural'
    conjugated_form TEXT NOT NULL,
    pronunciation_guide TEXT,
    usage_notes TEXT,
    is_irregular BOOLEAN DEFAULT false,
    frequency_rank INTEGER, -- How common this conjugation is (1-10 scale)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create verb paradigm templates for pattern-based conjugation
CREATE TABLE verb_paradigms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verb_type VARCHAR(50) NOT NULL, -- 'regular_ar', 'regular_er', 'regular_ir', 'irregular', 'auxiliary'
    tense VARCHAR(50) NOT NULL,
    pattern_template JSONB NOT NULL, -- Stores conjugation patterns as JSON
    example_verb_id UUID REFERENCES lesson_content(id),
    description TEXT,
    usage_frequency INTEGER DEFAULT 5, -- 1-10 scale of how commonly this pattern is used
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create table for verb root analysis (helps with pattern recognition)
CREATE TABLE verb_roots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verb_id UUID NOT NULL REFERENCES lesson_content(id) ON DELETE CASCADE,
    root_form TEXT NOT NULL, -- The stem/root of the verb
    verb_class VARCHAR(50), -- Classification for conjugation patterns
    stem_changes JSONB, -- Document any stem changes in conjugation
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for efficient queries
CREATE INDEX idx_verb_conjugations_verb_id ON verb_conjugations(verb_id);
CREATE INDEX idx_verb_conjugations_tense ON verb_conjugations(tense);
CREATE INDEX idx_verb_conjugations_lookup ON verb_conjugations(verb_id, tense, person, number);
CREATE INDEX idx_verb_paradigms_type_tense ON verb_paradigms(verb_type, tense);
CREATE INDEX idx_verb_roots_verb_id ON verb_roots(verb_id);

-- Add constraints to ensure data integrity
ALTER TABLE verb_conjugations
ADD CONSTRAINT valid_tense CHECK (tense IN ('present', 'past', 'future', 'perfect', 'conditional', 'subjunctive', 'imperative')),
ADD CONSTRAINT valid_person CHECK (person IN ('first', 'second', 'third')),
ADD CONSTRAINT valid_number CHECK (number IN ('singular', 'plural')),
ADD CONSTRAINT valid_frequency_rank CHECK (frequency_rank IS NULL OR frequency_rank BETWEEN 1 AND 10);

ALTER TABLE verb_paradigms
ADD CONSTRAINT valid_verb_type CHECK (verb_type IN ('regular_ar', 'regular_er', 'regular_ir', 'irregular', 'auxiliary', 'modal')),
ADD CONSTRAINT valid_paradigm_tense CHECK (tense IN ('present', 'past', 'future', 'perfect', 'conditional', 'subjunctive', 'imperative')),
ADD CONSTRAINT valid_usage_frequency CHECK (usage_frequency BETWEEN 1 AND 10);

-- Create unique constraints to prevent duplicate conjugations
ALTER TABLE verb_conjugations
ADD CONSTRAINT unique_verb_conjugation UNIQUE (verb_id, tense, person, number);

ALTER TABLE verb_paradigms
ADD CONSTRAINT unique_verb_paradigm UNIQUE (verb_type, tense);

-- Create helper view for complete verb conjugation data
CREATE VIEW verb_conjugation_complete AS
SELECT
    lc.id as verb_id,
    lc.english_phrase,
    lc.target_phrase,
    lc.pronunciation_guide as base_pronunciation,
    vr.root_form,
    vr.verb_class,
    vc.tense,
    vc.person,
    vc.number,
    vc.conjugated_form,
    vc.pronunciation_guide as conjugated_pronunciation,
    vc.usage_notes,
    vc.is_irregular,
    vc.frequency_rank,
    vp.pattern_template,
    vp.description as pattern_description
FROM lesson_content lc
LEFT JOIN verb_roots vr ON lc.id = vr.verb_id
LEFT JOIN verb_conjugations vc ON lc.id = vc.verb_id
LEFT JOIN verb_paradigms vp ON vr.verb_class = vp.verb_type AND vc.tense = vp.tense
WHERE lc.word_type = 'verb';

-- Create helper view for lesson verb summary
CREATE VIEW lesson_verb_summary AS
SELECT
    l.id as lesson_id,
    l.name as lesson_name,
    COUNT(DISTINCT lc.id) as total_verbs,
    COUNT(DISTINCT vc.id) as total_conjugations,
    ARRAY_AGG(DISTINCT vc.tense ORDER BY vc.tense) as available_tenses,
    ARRAY_AGG(DISTINCT vr.verb_class ORDER BY vr.verb_class) as verb_classes
FROM lessons l
JOIN lesson_content lc ON l.id = lc.lesson_id
LEFT JOIN verb_conjugations vc ON lc.id = vc.verb_id
LEFT JOIN verb_roots vr ON lc.id = vr.verb_id
WHERE lc.word_type = 'verb' AND l.is_active = true
GROUP BY l.id, l.name;

COMMIT;