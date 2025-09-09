-- Migration 006: Add dynamic exercise generation system
-- This creates tables for topics and exercises that can be generated dynamically

-- Topics table for organizing lessons by subject
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id UUID REFERENCES languages(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL, -- URL-friendly version of name
    description TEXT,
    difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    learning_objectives JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(language_id, slug)
);

-- Exercises table for storing generated practice exercises
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id UUID REFERENCES languages(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    exercise_type VARCHAR(50) NOT NULL, -- 'translation', 'conjugation', 'phrase-complete', 'listening'
    difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
    question_text TEXT NOT NULL,
    question_audio_url TEXT, -- For listening exercises
    correct_answer TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb, -- Multiple choice options
    explanation TEXT, -- Why this is the correct answer
    cultural_notes TEXT, -- Cultural context
    tags JSONB DEFAULT '[]'::jsonb, -- For filtering/organization
    generation_prompt TEXT, -- Store the prompt used to generate this
    ai_confidence_score DECIMAL(3,2), -- How confident the AI was (0.00-1.00)
    is_reviewed BOOLEAN DEFAULT false, -- Human reviewed
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise generation requests - track what's been generated
CREATE TABLE IF NOT EXISTS exercise_generation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language_id UUID REFERENCES languages(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    requested_count INTEGER NOT NULL,
    generated_count INTEGER DEFAULT 0,
    difficulty_level INTEGER,
    exercise_types JSONB DEFAULT '[]'::jsonb,
    special_instructions TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    generation_cost_usd DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_topics_language_active ON topics(language_id, is_active);
CREATE INDEX IF NOT EXISTS idx_topics_difficulty ON topics(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_topic ON exercises(topic_id);
CREATE INDEX IF NOT EXISTS idx_exercises_type_difficulty ON exercises(exercise_type, difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_active ON exercises(is_active);
CREATE INDEX IF NOT EXISTS idx_generation_requests_status ON exercise_generation_requests(status);

-- Add some sample topics for Albanian
INSERT INTO topics (language_id, name, slug, description, difficulty, learning_objectives) 
SELECT 
    l.id,
    'Hello and Goodbye',
    'hello-goodbye',
    'Essential greetings and farewells for daily family interactions',
    1,
    '["Learn basic greetings", "Practice polite farewells", "Understand formal vs informal address"]'::jsonb
FROM languages l WHERE l.name = 'Gheg Albanian'
ON CONFLICT (language_id, slug) DO NOTHING;

INSERT INTO topics (language_id, name, slug, description, difficulty, learning_objectives) 
SELECT 
    l.id,
    'Game Conversation',
    'game-conversation', 
    'Vocabulary and phrases for playing games with family',
    2,
    '["Learn game-related vocabulary", "Practice turn-taking phrases", "Express winning and losing gracefully"]'::jsonb
FROM languages l WHERE l.name = 'Gheg Albanian'
ON CONFLICT (language_id, slug) DO NOTHING;

INSERT INTO topics (language_id, name, slug, description, difficulty, learning_objectives) 
SELECT 
    l.id,
    'Food Names',
    'food-names',
    'Common foods and cooking vocabulary for family meals',
    2,
    '["Learn food vocabulary", "Practice meal preparation phrases", "Discuss dietary preferences"]'::jsonb
FROM languages l WHERE l.name = 'Gheg Albanian'
ON CONFLICT (language_id, slug) DO NOTHING;

INSERT INTO topics (language_id, name, slug, description, difficulty, learning_objectives) 
SELECT 
    l.id,
    'Home & Rooms',
    'home-rooms',
    'Vocabulary for describing home spaces and furniture',
    2,
    '["Learn room names", "Describe furniture and objects", "Give directions in the house"]'::jsonb
FROM languages l WHERE l.name = 'Gheg Albanian'
ON CONFLICT (language_id, slug) DO NOTHING;

INSERT INTO topics (language_id, name, slug, description, difficulty, learning_objectives) 
SELECT 
    l.id,
    'Daily Activities',
    'daily-activities',
    'Common daily routines and activities',
    2,
    '["Describe daily schedule", "Talk about work and chores", "Plan family activities"]'::jsonb
FROM languages l WHERE l.name = 'Gheg Albanian'
ON CONFLICT (language_id, slug) DO NOTHING;

-- Function to auto-generate slug from name
CREATE OR REPLACE FUNCTION generate_topic_slug(topic_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(trim(topic_name), '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug if not provided
CREATE OR REPLACE FUNCTION set_topic_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_topic_slug(NEW.name);
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER topic_slug_trigger
    BEFORE INSERT OR UPDATE ON topics
    FOR EACH ROW
    EXECUTE FUNCTION set_topic_slug();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exercises_updated_at 
    BEFORE UPDATE ON exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();