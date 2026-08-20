-- Enhanced Lesson Schema Migration (Chunk 1.3)
-- Implements comprehensive database schema for textbook-quality lessons

BEGIN;

-- 1. Enhanced processed_lessons Table
ALTER TABLE processed_lessons
ADD COLUMN IF NOT EXISTS lesson_number INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS lesson_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS pattern_focus JSONB,
ADD COLUMN IF NOT EXISTS prerequisites INTEGER[],
ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(50) DEFAULT 'pending';

-- Add unique constraint for lesson ordering
ALTER TABLE processed_lessons
ADD CONSTRAINT unique_skill_lesson_number
UNIQUE (skill_id, lesson_number);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_processed_lessons_number
ON processed_lessons(skill_id, lesson_number);

-- 2. New lesson_patterns Table
CREATE TABLE IF NOT EXISTS lesson_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  pattern_type VARCHAR(50) NOT NULL, -- 'number', 'verb', 'grammar', 'pronunciation'
  pattern_name VARCHAR(200) NOT NULL,
  pattern_rule TEXT NOT NULL,
  examples JSONB NOT NULL,
  difficulty_level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patterns_skill ON lesson_patterns(skill_id);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON lesson_patterns(pattern_type);

-- 3. New pronunciation_guides Table
CREATE TABLE IF NOT EXISTS pronunciation_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word VARCHAR(200) NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  ipa_notation VARCHAR(200),
  sounds_like VARCHAR(200),
  audio_url VARCHAR(500),
  syllable_breakdown VARCHAR(200),
  stress_pattern VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE pronunciation_guides
ADD CONSTRAINT IF NOT EXISTS unique_word_language UNIQUE (word, language_code);

CREATE INDEX IF NOT EXISTS idx_pronunciation_word ON pronunciation_guides(word);

-- 4. New lesson_generation_logs Table
CREATE TABLE IF NOT EXISTS lesson_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  orchestration_plan JSONB NOT NULL,
  patterns_found JSONB,
  lessons_planned INTEGER,
  lessons_completed INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed
  error_log JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_generation_logs_skill ON lesson_generation_logs(skill_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_status ON lesson_generation_logs(status);

-- 5. Performance Indexes for JSONB
CREATE INDEX IF NOT EXISTS idx_lessons_content_vocabulary
ON processed_lessons USING gin ((content->'vocabulary'));

CREATE INDEX IF NOT EXISTS idx_lessons_content_exercises
ON processed_lessons USING gin ((content->'exercises'));

CREATE INDEX IF NOT EXISTS idx_lessons_pattern_focus
ON processed_lessons USING gin (pattern_focus);

-- 6. Data Validation Function
CREATE OR REPLACE FUNCTION validate_lesson_prerequisites()
RETURNS TRIGGER AS $$
BEGIN
  -- Check that prerequisites exist and are lower numbered
  IF NEW.prerequisites IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM unnest(NEW.prerequisites) AS prereq
      WHERE prereq >= NEW.lesson_number
    ) THEN
      RAISE EXCEPTION 'Prerequisites must be earlier lessons';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create Trigger for Prerequisites Validation
DROP TRIGGER IF EXISTS check_lesson_prerequisites ON processed_lessons;
CREATE TRIGGER check_lesson_prerequisites
BEFORE INSERT OR UPDATE ON processed_lessons
FOR EACH ROW EXECUTE FUNCTION validate_lesson_prerequisites();

COMMIT;

-- Verify Migration Success
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('processed_lessons', 'lesson_patterns', 'pronunciation_guides', 'lesson_generation_logs')
ORDER BY table_name, ordinal_position;