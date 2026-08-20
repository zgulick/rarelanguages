-- Add grammar columns to lesson_content table
-- Run this SQL script in your PostgreSQL database

ALTER TABLE lesson_content ADD COLUMN IF NOT EXISTS word_type VARCHAR(50);
ALTER TABLE lesson_content ADD COLUMN IF NOT EXISTS verb_type VARCHAR(20);
ALTER TABLE lesson_content ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE lesson_content ADD COLUMN IF NOT EXISTS stress_pattern VARCHAR(100);
ALTER TABLE lesson_content ADD COLUMN IF NOT EXISTS conjugation_data JSONB;
ALTER TABLE lesson_content ADD COLUMN IF NOT EXISTS grammar_category VARCHAR(50);
ALTER TABLE lesson_content ADD COLUMN IF NOT EXISTS difficulty_notes TEXT;
ALTER TABLE lesson_content ADD COLUMN IF NOT EXISTS usage_examples JSONB;

-- Verify columns were added
\d lesson_content;