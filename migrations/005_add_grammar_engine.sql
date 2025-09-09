-- Grammar Engine Database Migration
-- This adds tables for dynamic verb conjugation and grammar rule storage

-- 1. Verb Patterns Table
CREATE TABLE verb_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id UUID REFERENCES languages(id) ON DELETE CASCADE,
    pattern_name VARCHAR(100) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL, -- 'regular', 'irregular', 'semi-regular'
    description TEXT,
    conjugation_rules JSONB NOT NULL,
    example_verbs TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(language_id, pattern_name)
);

-- 2. Verbs Table
CREATE TABLE verbs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id UUID REFERENCES languages(id) ON DELETE CASCADE,
    infinitive VARCHAR(200) NOT NULL,
    english_translation VARCHAR(200) NOT NULL,
    verb_pattern_id UUID REFERENCES verb_patterns(id),
    frequency_rank INTEGER, -- 1 = most common
    conjugations JSONB NOT NULL,
    usage_examples JSONB,
    cultural_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(language_id, infinitive)
);

-- 3. Grammar Rules Table (for other grammar beyond verbs)
CREATE TABLE grammar_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id UUID REFERENCES languages(id) ON DELETE CASCADE,
    rule_type VARCHAR(100) NOT NULL, -- 'noun_declension', 'adjective_agreement', etc.
    rule_name VARCHAR(200) NOT NULL,
    rule_description TEXT,
    rule_patterns JSONB NOT NULL,
    examples JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(language_id, rule_type, rule_name)
);

-- 4. Language Generation Status Table (track grammar generation progress)
CREATE TABLE language_generation_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code VARCHAR(20) NOT NULL,
    grammar_patterns_generated BOOLEAN DEFAULT FALSE,
    verb_list_generated BOOLEAN DEFAULT FALSE,
    conjugations_generated BOOLEAN DEFAULT FALSE,
    grammar_rules_generated BOOLEAN DEFAULT FALSE,
    generation_started_at TIMESTAMP,
    generation_completed_at TIMESTAMP,
    error_details TEXT,
    
    UNIQUE(language_code)
);

-- 5. Create indexes for performance
CREATE INDEX idx_verbs_language_frequency ON verbs(language_id, frequency_rank);
CREATE INDEX idx_verb_patterns_language ON verb_patterns(language_id);
CREATE INDEX idx_grammar_rules_language_type ON grammar_rules(language_id, rule_type);
CREATE INDEX idx_verbs_infinitive ON verbs(language_id, infinitive);
CREATE INDEX idx_language_generation_status_code ON language_generation_status(language_code);

-- 6. Seed initial data for Gheg Albanian
INSERT INTO verb_patterns (language_id, pattern_name, pattern_type, description, conjugation_rules, example_verbs) 
SELECT 
    id as language_id,
    'regular_-oj' as pattern_name,
    'regular' as pattern_type,
    'Regular verbs ending in -oj' as description,
    '{
        "present": {
            "unë": "{stem}",
            "ti": "{stem}n",
            "ai/ajo": "{stem}n", 
            "ne": "{stem}më",
            "ju": "{stem}ni",
            "ata/ato": "{stem}në"
        },
        "past": {
            "unë": "{stem}ova",
            "ti": "{stem}ove", 
            "ai/ajo": "{stem}oi",
            "ne": "{stem}uam",
            "ju": "{stem}uat",
            "ata/ato": "{stem}uan"
        },
        "future": {
            "unë": "do {stem}",
            "ti": "do {stem}sh",
            "ai/ajo": "do {stem}",
            "ne": "do {stem}më", 
            "ju": "do {stem}ni",
            "ata/ato": "do {stem}në"
        }
    }'::jsonb as conjugation_rules,
    ARRAY['luaj', 'punoj', 'studoj'] as example_verbs
FROM languages 
WHERE code = 'gheg-al';

-- Initialize generation status for Gheg Albanian
INSERT INTO language_generation_status (language_code)
SELECT 'gheg-al'
WHERE NOT EXISTS (
    SELECT 1 FROM language_generation_status WHERE language_code = 'gheg-al'
);

-- Add helpful comments
COMMENT ON TABLE verb_patterns IS 'Stores conjugation patterns for different verb types per language';
COMMENT ON TABLE verbs IS 'Complete verb database with conjugations and usage examples';
COMMENT ON TABLE grammar_rules IS 'Additional grammar rules beyond verb conjugations';
COMMENT ON TABLE language_generation_status IS 'Tracks progress of grammar generation for each language';