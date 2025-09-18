# Database Schema Updates for Enhanced Learning Cards

## Overview
This document outlines the database schema changes needed to support rich learning cards with grammar information, word types, and conjugation data.

## Required Database Changes

### 1. Update `lesson_content` Table

Add the following columns to the existing `lesson_content` table:

```sql
-- Add new columns for enhanced learning cards
ALTER TABLE lesson_content ADD COLUMN word_type VARCHAR(50);
ALTER TABLE lesson_content ADD COLUMN verb_type VARCHAR(20);
ALTER TABLE lesson_content ADD COLUMN gender VARCHAR(20);
ALTER TABLE lesson_content ADD COLUMN stress_pattern VARCHAR(100);
ALTER TABLE lesson_content ADD COLUMN conjugation_data JSONB;
ALTER TABLE lesson_content ADD COLUMN grammar_category VARCHAR(50);
ALTER TABLE lesson_content ADD COLUMN difficulty_notes TEXT;
ALTER TABLE lesson_content ADD COLUMN usage_examples JSONB;
```

### 2. Column Definitions

| Column | Type | Purpose | Example Values |
|--------|------|---------|----------------|
| `word_type` | VARCHAR(50) | Part of speech | 'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition' |
| `verb_type` | VARCHAR(20) | Verb classification | 'regular', 'irregular', 'modal', 'auxiliary' |
| `gender` | VARCHAR(20) | Noun/adjective gender | 'masculine', 'feminine', 'neuter' |
| `stress_pattern` | VARCHAR(100) | Pronunciation emphasis | 'BA-bai', 'fah-LEH-min-de-rit' |
| `conjugation_data` | JSONB | Full conjugation info | See JSON structure below |
| `grammar_category` | VARCHAR(50) | Grammar concept type | 'basic_verb', 'family_vocab', 'greeting' |
| `difficulty_notes` | TEXT | Learning difficulty info | 'Irregular verb - memorize pattern' |
| `usage_examples` | JSONB | Additional usage examples | Array of example sentences |

## Data Structures

### 3. Conjugation Data JSON Structure

For verbs, store conjugation information as JSON:

```json
{
  "verb_type": "regular",
  "infinitive": "të flas",
  "present_tense": {
    "first_singular": "unë flas",
    "second_singular": "ti flet", 
    "third_singular": "ai/ajo flet",
    "first_plural": "ne flasim",
    "second_plural": "ju flisni", 
    "third_plural": "ata/ato flasin"
  },
  "past_tense": {
    "first_singular": "unë folë",
    "second_singular": "ti fole",
    "third_singular": "ai/ajo foli",
    "first_plural": "ne folëm",
    "second_plural": "ju folët",
    "third_plural": "ata/ato folën"
  },
  "pattern_notes": "Regular -as verb pattern",
  "irregular_notes": null
}
```

### 4. Usage Examples JSON Structure

```json
[
  {
    "english": "My mother is cooking dinner",
    "albanian": "Nëna ime po gatuaj darkën",
    "pronunciation": "NUH-nah EE-meh po gah-TOO-ahn DAR-kuhn",
    "context": "family_dinner"
  },
  {
    "english": "She is a wonderful mother",
    "albanian": "Ajo është një nënë e mrekullueshme", 
    "pronunciation": "AH-yo UH-sht nyuh NUH-nuh eh mreh-kool-LWESH-meh",
    "context": "compliment"
  }
]
```

## Sample Data Examples

### Example 1: Noun (Mother)
```sql
INSERT INTO lesson_content (
  english_phrase, target_phrase, pronunciation_guide,
  word_type, gender, stress_pattern, grammar_category,
  cultural_context, usage_examples
) VALUES (
  'mother', 'nëna', 'NUH-nah',
  'noun', 'feminine', 'NUH-nah',
  'family_vocab',
  'Mothers are central to Albanian family life',
  '[{"english": "My mother is cooking", "albanian": "Nëna ime po gatuaj", "pronunciation": "NUH-nah EE-meh po gah-TOO-ahn"}]'
);
```

### Example 2: Regular Verb (To Speak)
```sql
INSERT INTO lesson_content (
  english_phrase, target_phrase, pronunciation_guide,
  word_type, verb_type, stress_pattern, grammar_category,
  conjugation_data, grammar_notes
) VALUES (
  'to speak', 'të flas', 'tuh FLAHS',
  'verb', 'regular', 'FLAHS',
  'basic_verb',
  '{"verb_type": "regular", "infinitive": "të flas", "present_tense": {"first_singular": "unë flas", "second_singular": "ti flet", "third_singular": "ai/ajo flet"}}',
  'Regular verb following the -as pattern'
);
```

### Example 3: Irregular Verb (To Be)
```sql
INSERT INTO lesson_content (
  english_phrase, target_phrase, pronunciation_guide,
  word_type, verb_type, stress_pattern, grammar_category,
  conjugation_data, difficulty_notes
) VALUES (
  'to be', 'të jem', 'tuh YEHM',
  'verb', 'irregular', 'YEHM',
  'basic_verb',
  '{"verb_type": "irregular", "infinitive": "të jem", "present_tense": {"first_singular": "unë jam", "second_singular": "ti je", "third_singular": "ai/ajo është"}}',
  'Highly irregular verb - must memorize all forms'
);
```

## Implementation Steps

### Step 1: Database Migration
1. Run the ALTER TABLE commands above
2. Verify columns are added successfully
3. Update any existing data if needed

### Step 2: Data Population Guidelines
- **word_type**: Always specify (noun, verb, adjective, etc.)
- **stress_pattern**: Use capital letters for emphasized syllables
- **conjugation_data**: Only for verbs, include at least present tense
- **usage_examples**: 1-3 real-world examples per word
- **cultural_context**: Brief cultural note when relevant

### Step 3: Validation
- Test API endpoints return new fields
- Verify JSON data is valid
- Check pronunciation patterns are consistent

## Card Type Mapping

Based on `word_type` and `content_type` values:

| word_type | Card Type | Shows |
|-----------|-----------|-------|
| noun | Vocabulary Card | Word, gender, pronunciation, examples |
| verb | Verb Card | Conjugation table, verb type, usage |
| adjective | Vocabulary Card | Word, agreement rules, examples |
| phrase | Phrase Card | Full phrase, breakdown, context |
| grammar | Grammar Card | Rule explanation, examples |

## Future Enhancements

These fields can be added later without code changes:

- `case_declension` (JSONB) - For noun cases
- `plural_form` (VARCHAR) - Plural nouns
- `comparative_form` (VARCHAR) - Adjective comparison
- `idiom_meaning` (TEXT) - For idiomatic expressions
- `regional_variants` (JSONB) - Different regional pronunciations

## Notes

- All new columns are nullable - existing data won't break
- JSON fields allow flexible data structures
- Pronunciation patterns use capital letters for stress
- Examples should be culturally relevant and practical