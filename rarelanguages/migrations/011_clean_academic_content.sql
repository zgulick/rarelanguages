-- Migration 011: Clean Academic Content and Fix Unit Content
-- This migration removes inappropriate academic content and ensures units have proper content

BEGIN;

-- Step 1: Remove all academic/morphological content
DELETE FROM lesson_content
WHERE
    english_phrase ILIKE '%morpholog%' OR
    english_phrase ILIKE '%inflectional%' OR
    english_phrase ILIKE '%linguistic%' OR
    english_phrase ILIKE '%theoretical%' OR
    english_phrase ILIKE '%analysis%' OR
    english_phrase ILIKE '%argument%' OR
    english_phrase ILIKE '%comparative%' OR
    english_phrase ILIKE '%synthesiz%' OR
    english_phrase ILIKE '%theories%' OR
    target_phrase ILIKE '%morfologjik%' OR
    target_phrase ILIKE '%infleksional%' OR
    target_phrase ILIKE '%teorive%' OR
    target_phrase ILIKE '%modeleve%' OR
    cultural_context ILIKE '%morpholog%' OR
    cultural_context ILIKE '%inflection%' OR
    cultural_context ILIKE '%linguistic%' OR
    cultural_context ILIKE '%academic%' OR
    cultural_context ILIKE '%research%' OR
    cultural_context ILIKE '%comparative%';

-- Step 2: Remove inappropriate cultural contexts from simple phrases
UPDATE lesson_content
SET cultural_context = NULL
WHERE cultural_context IS NOT NULL
AND (
    cultural_context ILIKE '%academic%' OR
    cultural_context ILIKE '%research%' OR
    cultural_context ILIKE '%analysis%' OR
    cultural_context ILIKE '%argument%' OR
    cultural_context ILIKE '%critical%' OR
    cultural_context ILIKE '%theoretical%' OR
    cultural_context ILIKE '%methodology%' OR
    cultural_context ILIKE '%hypothesis%' OR
    cultural_context ILIKE '%evidence%' OR
    cultural_context ILIKE '%scholarly%'
);

-- Step 3: Simplify basic vocabulary cards
UPDATE lesson_content
SET
    gender = NULL,
    usage_examples = NULL,
    difficulty_notes = NULL,
    conjugation_data = NULL,
    stress_pattern = NULL
WHERE english_phrase IN ('Hello', 'Thank you', 'Please', 'Good morning', 'Good afternoon', 'Good evening', 'Goodbye', 'How are you?', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten');

-- Step 4: Simplify by category
UPDATE lesson_content
SET
    gender = NULL,
    usage_examples = NULL,
    difficulty_notes = NULL,
    conjugation_data = NULL,
    stress_pattern = NULL
WHERE grammar_category IN ('greetings', 'courtesy', 'numbers', 'time_expressions')
AND LENGTH(english_phrase) < 25;

-- Step 5: Add proper beginner-friendly cultural contexts
UPDATE lesson_content
SET cultural_context = 'A friendly greeting used throughout Albania in both formal and casual situations.'
WHERE english_phrase = 'Hello' AND cultural_context IS NULL;

UPDATE lesson_content
SET cultural_context = 'Expressing gratitude is very important in Albanian culture and shows good manners.'
WHERE english_phrase = 'Thank you' AND cultural_context IS NULL;

UPDATE lesson_content
SET cultural_context = 'Adding "ju lutem" (please) makes requests more polite in Albanian culture.'
WHERE english_phrase = 'Please' AND cultural_context IS NULL;

UPDATE lesson_content
SET cultural_context = 'A warm morning greeting commonly used until around noon in Albania.'
WHERE english_phrase = 'Good morning' AND cultural_context IS NULL;

UPDATE lesson_content
SET cultural_context = 'A common way to show interest in someone''s wellbeing in Albanian culture.'
WHERE english_phrase = 'How are you?' AND cultural_context IS NULL;

COMMIT;