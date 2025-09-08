# 🇦🇱 Albanian Learning App Database Queries

## Check Your Albanian Content

```sql
-- See all Albanian translations
SELECT 
  l.name as lesson_name,
  lc.english_phrase,
  lc.target_phrase as albanian_phrase,
  lc.cultural_context
FROM lesson_content lc 
JOIN lessons l ON lc.lesson_id = l.id 
WHERE lc.target_phrase IS NOT NULL 
ORDER BY l.position, lc.id 
LIMIT 20;

-- Count translations by lesson
SELECT 
  l.name as lesson_name,
  COUNT(lc.id) as total_phrases,
  COUNT(lc.target_phrase) as translated_phrases
FROM lessons l 
LEFT JOIN lesson_content lc ON l.id = lc.lesson_id 
GROUP BY l.id, l.name 
ORDER BY l.position;

-- Sample Albanian family phrases
SELECT english_phrase, target_phrase 
FROM lesson_content 
WHERE target_phrase IS NOT NULL 
  AND english_phrase LIKE '%family%' 
  OR english_phrase LIKE '%father%' 
  OR english_phrase LIKE '%mother%';

-- Check user progress (after you start learning)
SELECT 
  u.email,
  l.name as current_lesson,
  up.last_studied,
  up.total_exercises_completed
FROM user_progress up 
JOIN users u ON up.user_id = u.id 
JOIN lessons l ON up.current_lesson_id = l.id;
```

## Useful Admin Queries

```sql
-- Reset your progress to start over
DELETE FROM user_progress WHERE user_id = 'your-user-id';

-- See all available lessons
SELECT name, estimated_minutes, position 
FROM lessons 
ORDER BY position;

-- Add a custom Albanian phrase
INSERT INTO lesson_content (
  lesson_id, english_phrase, target_phrase, cultural_context, difficulty_score
) VALUES (
  1, 'Hello friend', 'Tungjatjeta mik', 'Informal greeting between friends', 2
);
```