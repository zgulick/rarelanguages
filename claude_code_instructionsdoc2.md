# Claude Code Implementation Instructions

## Overview
I want to completely rebuild my language learning app UI/UX with a clean, database-first architecture. Currently my app has hardcoded fallbacks, demo data mixed with real data, and complex routing that creates a nightmare to maintain. I want to eliminate ALL hardcoded content and build everything from my PostgreSQL database.

## Project Context
- **Goal**: Language learning app for Gheg Albanian (starting language)
- **Database**: PostgreSQL with comprehensive schema already built
- **Current Problem**: UI has hardcoded fallbacks, mock data, complex routing between comprehensive/demo content
- **Solution**: Clean, database-first architecture where "if it's not in the database, it doesn't exist"

## Architecture Requirements

### Core Principle
- **Zero hardcoded content** - everything comes from PostgreSQL database
- **No fallbacks** - if database fails, show error (don't fake it with demo data)
- **Clean component hierarchy** - each component has single responsibility
- **Database-first data flow** - all state comes from API calls to database

### Key Database Tables (already exist)
```
languages - available languages (Gheg Albanian, etc.)
courses - language courses 
skills - course units with prerequisites
lessons - individual lessons in skills
lesson_content - phrases, pronunciation, cultural context
users - user accounts and progress
user_progress - completion tracking
spaced_repetition - algorithm for review scheduling
verbs - verb conjugations (if exists)
comprehensive_lessons - rich lesson data (if exists)
```

## Step 1: Clean Slate Setup

**Task**: Create backup and clean slate
```bash
# Backup current state
git checkout -b backup-before-rebuild
git add -A && git commit -m "Backup before clean rebuild"

# Create clean branch
git checkout -b clean-ui-rebuild
```

**Files to DELETE** (these have hardcoded/fallback content):
```
components/exercises/AcademicLesson.jsx
components/exercises/ComprehensiveLessonCards.jsx  
components/DemoApp.jsx
demo.html
test-phase3.html
lib/mockData.js
contexts/AppContextOriginal.js
src/app/api/lessons/comprehensive/
src/app/api/lessons/[id]/academic-content/route.js
dynamic-verb-section.js
learning-app-react-fixed.js
```

## Step 2: Create Clean App Structure

**Task**: Create the main clean app component

**File**: `components/clean/CleanApp.jsx`
**Requirements**:
- AppContext with database-only state management
- No localStorage caching of content (only user ID)
- Clean error handling (show errors, don't hide with fallbacks)
- Loading states for all database operations
- Four main pages: language-selection, dashboard, lesson, practice

**Key Context Methods**:
```javascript
// Database-only methods
selectLanguage(languageCode) // POST /api/user/create
startLesson(lessonId) // GET /api/lessons/{id}  
completeExercise(results) // POST /api/exercises/complete
loadCourseProgress() // GET /api/courses/{id}/progress
```

**Page Components**:
- `LanguageSelectionPage` - show available languages from database
- `CourseDashboard` - show skill tree with real prerequisites
- `LessonPage` - choice between comprehensive cards or quick exercises
- `PracticeHub` - show items due for review

## Step 3: Create Database-First API Routes

**Task**: Create clean API endpoints that only serve database content

### API Route 1: `src/app/api/languages/available/route.js`
```javascript
// GET available languages with lesson counts
SELECT l.code, l.name, l.native_name, COUNT(les.id) as lesson_count
FROM languages l
LEFT JOIN courses c ON l.id = c.language_id
LEFT JOIN skills s ON c.id = s.course_id  
LEFT JOIN lessons les ON s.id = les.skill_id
WHERE l.active = true
GROUP BY l.id
ORDER BY lesson_count DESC
```

### API Route 2: `src/app/api/user/create/route.js`
```javascript
// POST create user with selected language
// Insert into users table with current_language
// Return user + course data
```

### API Route 3: `src/app/api/courses/[courseId]/skills/route.js`
```javascript
// GET skill tree with real prerequisites and progress
// Join skills + lessons + user_progress
// Calculate availability based on prerequisites
// Return next available lesson for each skill
```

### API Route 4: `src/app/api/lessons/next/route.js`
```javascript
// GET next lesson based on spaced repetition algorithm
// Priority: 1) overdue reviews, 2) new lessons with met prerequisites
// Use spaced_repetition table + user_progress
```

### API Route 5: `src/app/api/lessons/[lessonId]/route.js`
```javascript
// GET lesson content with all phrases
// From lesson_content table
// Update user_progress to 'in_progress'
```

### API Route 6: `src/app/api/exercises/complete/route.js`
```javascript
// POST exercise completion
// Update user_progress
// Update spaced_repetition with new intervals
```

## Step 4: Create Comprehensive Learning Cards

**Task**: Build the rich card-based learning experience (this is the key feature I want)

**File**: `components/clean/ComprehensiveLearningCards.jsx`

**Requirements**:
- **Rich educational cards** with Albanian pronunciation, gender, variations, cultural context
- **Verb conjugation cards** with full present tense tables
- **Family relationship cards** showing Albanian cultural context
- **Spaced repetition rating** (Again/Hard/Good/Easy) after each card
- **Database-driven content** from lesson_content + comprehensive_lessons tables
- **Audio pronunciation** using Web Speech API with Albanian (sq) language
- **Mobile-optimized** with large touch targets

**Card Types**:
1. **Vocabulary Cards**: Albanian term, pronunciation, gender, examples, cultural notes
2. **Verb Conjugation Cards**: Full conjugation table with usage examples  
3. **Family Relationship Cards**: How terms relate in Albanian culture
4. **Usage Pattern Cards**: When/how to use specific phrases

### API Route 7: `src/app/api/lessons/[lessonId]/comprehensive-cards/route.js`
```javascript
// GET rich card content for lesson
// Try comprehensive_lessons table first
// Fallback to generating cards from lesson_content
// Include verb conjugations from verbs table
// Generate Albanian-specific variations (definite/indefinite articles, gender agreements)
```

## Step 5: Integration and Testing

**Task**: Connect everything and test with real Albanian data

**File**: `src/app/page.js`
```javascript
import CleanApp from '../../components/clean/CleanApp';
export default function Home() {
  return <CleanApp />;
}
```

**Database Verification**:
```sql
-- Verify Albanian content exists
SELECT COUNT(*) FROM lesson_content 
WHERE target_phrase IS NOT NULL AND target_phrase != '';

-- Check spaced repetition setup
SELECT COUNT(*) FROM spaced_repetition;

-- Verify user progress tracking
SELECT * FROM user_progress LIMIT 5;
```

## Step 6: Albanian-Specific Enhancements

**Task**: Add Albanian language features

**Features**:
- **Audio pronunciation** with Albanian language code ('sq')
- **Gender detection** for Albanian nouns (masculine/feminine)
- **Definite/indefinite article variations** (babai/baba, nëna/nënë)
- **Cultural context** for Kosovo Albanian customs
- **Verb conjugation patterns** for common Albanian verbs

**Albanian Linguistic Rules to Implement**:
```javascript
// Gender detection
if (phrase.includes('babai') || phrase.includes(' i ')) return 'masculine';
if (phrase.includes('nëna') || phrase.includes(' e ')) return 'feminine';

// Common conjugation patterns
// -oj verbs: punoj → punoj/punon/punon/punojmë/punoni/punojnë
// -em verbs: flem → flem/fle/fle/flemi/fleni/flemi
// Irregular: jam, kam, shkoj
```

## Success Criteria

**Technical Validation**:
- [ ] Zero hardcoded content in any component
- [ ] All data comes from PostgreSQL queries
- [ ] No fallback/demo/mock data anywhere
- [ ] Clean error handling (show errors, don't hide them)
- [ ] Fast loading with optimized database queries

**User Experience Validation**:
- [ ] Language selection shows real Albanian with lesson count
- [ ] Course dashboard shows real skill tree with prerequisites
- [ ] Comprehensive cards show rich Albanian content
- [ ] Audio pronunciation works for Albanian phrases
- [ ] Progress tracking persists in database
- [ ] Spaced repetition schedules reviews correctly

**Albanian Learning Validation**:
- [ ] Real Gheg Albanian phrases (not demo English)
- [ ] Cultural context for Kosovo Albanian customs
- [ ] Pronunciation guides for Albanian phonetics
- [ ] Gender and article variations
- [ ] Verb conjugations for Albanian grammar

## Final Instructions for Claude Code

1. **Start with Step 1** - backup and clean slate
2. **Implement steps sequentially** - don't skip the database verification
3. **Test each API route** before moving to next step
4. **Use my existing database schema** - don't modify tables
5. **Focus on the comprehensive cards** - this is the core learning experience I want
6. **No shortcuts or fallbacks** - if something fails, show error message
7. **Albanian language focus** - all examples should be real Albanian, not placeholder content

The goal is a clean, professional language learning platform that my Albanian family can use to learn Gheg Albanian, with rich educational content powered entirely by the database.