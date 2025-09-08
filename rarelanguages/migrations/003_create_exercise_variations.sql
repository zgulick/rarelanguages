-- Exercise Variations Table for Generated Content
-- Stores different exercise types generated from lesson content

CREATE TABLE exercise_variations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES lesson_content(id) ON DELETE CASCADE,
  exercise_type VARCHAR(50) NOT NULL CHECK (exercise_type IN (
    'flashcard',
    'multiple_choice', 
    'conversation',
    'audio_repeat',
    'fill_blank',
    'cultural_note',
    'pronunciation_practice'
  )),
  exercise_data JSONB NOT NULL DEFAULT '{}',
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10) DEFAULT 5,
  estimated_duration_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  validated BOOLEAN DEFAULT false,
  validation_notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_exercise_variations_content_id ON exercise_variations(content_id);
CREATE INDEX idx_exercise_variations_type ON exercise_variations(exercise_type);
CREATE INDEX idx_exercise_variations_difficulty ON exercise_variations(difficulty_level);
CREATE INDEX idx_exercise_variations_validated ON exercise_variations(validated);

-- Create progress tracking table for content generation
CREATE TABLE content_generation_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operation_type VARCHAR(50) NOT NULL, -- 'translation', 'exercises', 'pronunciation'
  batch_id VARCHAR(100) NOT NULL,
  total_items INTEGER NOT NULL,
  completed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending',
  api_calls_made INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10,4) DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  error_details JSONB DEFAULT '{}',
  resume_data JSONB DEFAULT '{}'
);

-- Index for progress tracking
CREATE INDEX idx_content_generation_progress_status ON content_generation_progress(status);
CREATE INDEX idx_content_generation_progress_operation ON content_generation_progress(operation_type);
CREATE INDEX idx_content_generation_progress_batch ON content_generation_progress(batch_id);