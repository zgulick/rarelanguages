# Albanian Language Learning App - Implementation Plan
## Priorities 1 & 2: Lesson Splitting + Grammar Data Population

### Overview
This plan addresses the two highest priority items from the development summary:
1. **Priority 1**: Break large lessons (195 cards) into manageable sub-lessons (15-20 cards each)
2. **Priority 2**: Populate the 8 new grammar columns with actual Albanian language data

---

## Current State Analysis
- **Problem**: 195 cards per lesson making learning sessions overwhelming
- **Current Structure**: `lessons` table with `lesson_content` table (1:many relationship)
- **Current UI**: Single lesson flow in `/src/app/skills/[id]/learn/page.tsx`
- **APIs**: `/api/lessons/[id]/content/route.js` returns all lesson content at once
- **Grammar Columns**: 8 new columns added but empty (word_type, verb_type, gender, etc.)

---

## Phase 1: Database Schema Changes (2 hours)
### Files to Create/Modify:
- `migrations/009_add_lesson_splitting.sql`

### Changes:
```sql
-- Add lesson grouping and sequencing columns
ALTER TABLE lessons ADD COLUMN parent_lesson_id UUID REFERENCES lessons(id);
ALTER TABLE lessons ADD COLUMN sequence_number INTEGER DEFAULT 1;
ALTER TABLE lessons ADD COLUMN cards_per_lesson INTEGER DEFAULT 15;
ALTER TABLE lessons ADD COLUMN is_sub_lesson BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX idx_lessons_parent_lesson_id ON lessons(parent_lesson_id);
CREATE INDEX idx_lessons_sequence_number ON lessons(sequence_number);
CREATE INDEX idx_lessons_is_sub_lesson ON lessons(is_sub_lesson);

-- Update existing lessons
UPDATE lessons SET cards_per_lesson = 15 WHERE cards_per_lesson IS NULL;
```

### Success Criteria:
- ✅ Schema migration runs without errors
- ✅ All new columns created with proper constraints
- ✅ Indexes created for performance
- ✅ Existing lessons updated with default values

---

## Phase 2: Lesson Splitting Implementation (4 hours)
### Files to Create:
- `scripts/split_large_lessons.js`
- `scripts/analyze_lesson_content.js`

### Features:
- Detect lessons with >20 cards
- Create parent lesson (keeps original ID, becomes container)
- Create sub-lessons (actual learning units)
- Redistribute lesson_content logically
- Maintain skill_id relationships
- Preserve lesson ordering

### Strategy:
```javascript
// 1. Identify large lessons
// 2. Create parent-child structure
// 3. Split content by logical groups (15-20 cards each)
// 4. Maintain content sequence
// 5. Update lesson relationships
```

### Success Criteria:
- ✅ No lessons with >25 cards
- ✅ All lesson content preserved
- ✅ Logical content grouping maintained
- ✅ Parent-child relationships established

---

## Phase 3: API Endpoint Updates (3 hours)
### Files to Modify:
- `/src/app/api/skills/[id]/lessons/route.js`
- `/src/app/api/lessons/[id]/content/route.js`

### Files to Create:
- `/src/app/api/lessons/[id]/sub-lessons/route.js`

### Updates:
1. **Skills/Lessons API**: Return only parent lessons with sub-lesson count
2. **Lesson Content API**: Handle parent/sub-lesson requests with navigation metadata
3. **New Sub-Lessons API**: Get all sub-lessons for a parent lesson

### Success Criteria:
- ✅ APIs return correct sub-lesson data
- ✅ Navigation metadata included
- ✅ Backward compatibility maintained
- ✅ Error handling for missing sub-lessons

---

## Phase 4: UI Component Updates (3 hours)
### Files to Modify:
- `/src/app/skills/[id]/learn/page.tsx`

### Features:
- Add sub-lesson navigation state
- Show "Lesson X of Y" indicator
- Add "Next Lesson" button for sub-lesson progression
- Update progress bar to show sub-lesson progress
- Handle lesson completion flow to next sub-lesson

### Success Criteria:
- ✅ Clear lesson sequence display
- ✅ Smooth sub-lesson navigation
- ✅ Accurate progress tracking
- ✅ Complete learning flow from start to finish

---

## Phase 5: Grammar Data Population Scripts (3 hours)
### Files to Create:
- `scripts/populate_grammar_data.js`
- `scripts/analyze_existing_content.js`
- `data/grammar_classification_rules.json`

### Features:
1. **Content Analysis Script**
   - Analyze existing `lesson_content` entries
   - Identify common patterns (greetings, family terms, verbs, etc.)
   - Auto-classify basic word types based on English phrases

2. **Basic Classification Queries**
   ```sql
   -- Auto-classify common phrase types
   UPDATE lesson_content SET
     word_type = 'phrase',
     grammar_category = 'greetings'
   WHERE english_phrase IN ('Hello', 'Thank you', 'Please', 'Goodbye');
   ```

### Success Criteria:
- ✅ 50+ entries with word_type populated
- ✅ Grammar categories assigned logically
- ✅ Automated classification rules working
- ✅ Manual review system in place

---

## Phase 6: Pronunciation Enhancement (2 hours)
### Files to Create:
- `scripts/enhance_pronunciation.js`
- `data/albanian_stress_patterns.json`

### Features:
1. **Stress Pattern Analysis**
   - Convert existing pronunciation guides to stress patterns
   - Use CAPS for stressed syllables (e.g., "PER-shun-det-yeh")
   - Create systematic stress pattern rules

2. **Pronunciation Data Quality**
   - Validate existing pronunciation guides
   - Fill gaps in pronunciation data
   - Standardize pronunciation format

### Success Criteria:
- ✅ 100+ items with proper stress patterns
- ✅ Standardized pronunciation format
- ✅ Enhanced pronunciation display in UI
- ✅ Quality validation completed

---

## Phase 7: Advanced Grammar Data (2 hours)
### Files to Create:
- `scripts/populate_advanced_grammar.js`
- `data/albanian_verb_conjugations.json`
- `data/noun_gender_rules.json`

### Features:
1. **Word Type Population**
   - Albanian word ending analysis (for gender/word type)
   - Verb type classification (regular/irregular)
   - Gender assignment for nouns

2. **Conjugation Data**
   - Basic verb conjugation tables
   - Usage examples in context
   - Difficulty notes for learners

### Success Criteria:
- ✅ Verb types classified
- ✅ Noun genders assigned
- ✅ Sample conjugation data populated
- ✅ Enhanced card displays working

---

## Timeline Summary: 19 hours total
- **Phase 1**: Database Changes (2 hours)
- **Phase 2**: Lesson Splitting Script (4 hours)
- **Phase 3**: API Updates (3 hours)
- **Phase 4**: UI Updates (3 hours)
- **Phase 5**: Grammar Data Scripts (3 hours)
- **Phase 6**: Pronunciation Enhancement (2 hours)
- **Phase 7**: Advanced Grammar Data (2 hours)

---

## Final Success Criteria

### Priority 1: Lesson Splitting ✅
1. **✅ Lesson Splitting Complete**: No lessons with >25 cards
2. **✅ Smooth Learning Flow**: Easy progression between sub-lessons
3. **✅ User Testing Ready**: Full flow from homepage to lesson completion

### Priority 2: Grammar Data Population ✅
4. **✅ 50+ Grammar Entries**: Basic word types and categories populated
5. **✅ Pronunciation Data**: At least 100 items with proper stress patterns
6. **✅ Enhanced UI**: Grammar information displays correctly in cards
7. **✅ Data Quality**: Validation and review systems working

---

## Risk Mitigation

### Data Safety
- Backup database before running splitting script
- Test splitting logic on sample data first
- Verify lesson content integrity after splitting

### API Compatibility
- Maintain backward compatibility where possible
- Update all API consumers simultaneously
- Test API changes thoroughly

### User Experience
- Ensure no broken navigation flows
- Verify progress tracking accuracy
- Test on various lesson sizes and types

---

*Generated: 2025-01-18*
*Status: Ready for implementation*