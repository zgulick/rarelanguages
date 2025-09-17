# Clean UI/UX Architecture - Database-First Design

## Core Philosophy: "If it's not in the database, it doesn't exist"

Zero hardcoded content. Zero fallbacks. Zero cheats. Everything comes from your database.

## 1. Clean Component Hierarchy

```
RareLanguagesApp/
├── AppShell/
│   ├── Navigation (dynamic from user's courses)
│   ├── ProgressHeader (real progress from DB)
│   └── SettingsPanel (user preferences from DB)
├── CoursePage/
│   ├── CourseOverview (from courses table)
│   ├── SkillTree (from skills table, real prerequisites)
│   └── NextLessonCard (spaced repetition algorithm)
├── LessonPage/
│   ├── LessonHeader (from lessons table)
│   ├── ExerciseFlow (from lesson_content table)
│   └── ProgressTracker (real-time DB updates)
└── PracticeHub/
    ├── TopicBrowser (from completed lessons)
    ├── ReviewQueue (spaced repetition due items)
    └── ProgressAnalytics (user_progress table)
```

## 2. Data Flow Architecture

### Single Source of Truth: PostgreSQL Database

**User State:**
- Current course: `users.current_language`
- Progress: `user_progress` table
- Next lesson: Spaced repetition algorithm
- Preferences: `users.preferences` JSONB

**Content State:**
- Courses: `courses` table
- Skills: `skills` table with real prerequisites
- Lessons: `lessons` table with proper positioning
- Exercises: `lesson_content` table with real Albanian phrases

**No localStorage cache, no mock data, no fallbacks**

## 3. Page-by-Page Design

### Landing Page: Course Selection
```
┌─────────────────────────────────┐
│ RareLanguages.com               │
├─────────────────────────────────┤
│ Available Languages:            │
│                                 │
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │🇦🇱   │ │ +   │ │ +   │        │
│ │Gheg │ │Add  │ │Add  │        │
│ │Alb. │ │Lang │ │Lang │        │
│ │50+  │ │     │ │     │        │
│ │less.│ │     │ │     │        │
│ └─────┘ └─────┘ └─────┘        │
│                                 │
│ [Continue Learning →]           │
└─────────────────────────────────┘
```

**Data Sources:**
- Languages from `languages` table where `active = true`
- Lesson counts from actual `lessons` count
- User's current language from `users.current_language`

### Course Dashboard: Skill Tree
```
┌─────────────────────────────────┐
│ ← Gheg Albanian Course          │
├─────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓░░ 78% Complete        │
│                                 │
│     ┌─────────┐                │
│     │ Unit 1  │ ✓               │
│     │ Family  │                 │
│     └─────────┘                │
│          │                      │
│     ┌─────────┐                │
│     │ Unit 2  │ ●               │
│     │ Home    │ (current)       │
│     └─────────┘                │
│          │                      │
│     ┌─────────┐                │
│     │ Unit 3  │ 🔒             │
│     │ Daily   │ (locked)        │
│     └─────────┘                │
│                                 │
│ [Continue Lesson →]             │
│ [Practice Previous →]           │
└─────────────────────────────────┘
```

**Data Sources:**
- Skills from `skills` table with real prerequisites
- Progress from `user_progress` table
- Next lesson from spaced repetition algorithm
- Completion percentages calculated from actual progress

### Lesson Page: Clean Exercise Flow
```
┌─────────────────────────────────┐
│ ← Lesson 2.3: Household Items   │
├─────────────────────────────────┤
│ Exercise 3 of 8  ▓▓▓░░░░░       │
│                                 │
│ 🎯 Translation Practice         │
│                                 │
│ "The kitchen is clean"          │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Kuzhin___ është e pastër    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │  a  │ │  e  │ │  ja │        │
│ └─────┘ └─────┘ └─────┘        │
│                                 │
│ [🔊 Play Audio] [Skip →]        │
└─────────────────────────────────┘
```

**Data Sources:**
- Exercise content from `lesson_content` table
- Pronunciation from `pronunciation_guide` field
- Cultural context from `cultural_context` field
- Progress tracking to `user_progress` table

### Practice Hub: Mastery Review
```
┌─────────────────────────────────┐
│ ← Practice Hub                  │
├─────────────────────────────────┤
│ Due for Review (5)              │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🔥 Family Terms             │ │
│ │ 3 items overdue             │ │
│ │ Last reviewed: 2 days ago   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📚 Household Items          │ │
│ │ 2 items due today           │ │
│ │ Mastery: 85%                │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Start Review Session →]        │
└─────────────────────────────────┘
```

**Data Sources:**
- Review items from `spaced_repetition` table
- Mastery percentages from `user_progress.success_rate`
- Due dates calculated by spaced repetition algorithm

## 4. API Architecture (Simplified)

### Core APIs (No redundant routes):
```
GET /api/user/course-state          → Current course, progress, next lesson
GET /api/courses/{courseId}/skills  → Skill tree with real prerequisites  
GET /api/lessons/{lessonId}         → Complete lesson with all exercises
POST /api/exercises/complete        → Update progress + spaced repetition
GET /api/practice/due-items         → Items due for review
```

### Data Response Format:
```javascript
// GET /api/user/course-state
{
  user: {
    id: "uuid",
    currentCourse: "uuid", 
    preferences: {...}
  },
  course: {
    id: "uuid",
    name: "Gheg Albanian",
    totalSkills: 12,
    completedSkills: 8
  },
  nextLesson: {
    id: "uuid",
    name: "Household Items",
    skill: "Home & Living",
    dueDate: "2025-09-16T10:00:00Z"
  }
}
```

## 5. Component Implementation Strategy

### AppContext (Simplified):
```javascript
const AppContext = {
  // User state from database
  user: null,
  currentCourse: null,
  
  // Current page state  
  currentPage: 'dashboard',
  currentLesson: null,
  
  // Loading states
  loading: false,
  error: null,
  
  // Methods that only talk to database
  loadUserState: () => fetch('/api/user/course-state'),
  startLesson: (lessonId) => fetch(`/api/lessons/${lessonId}`),
  completeExercise: (results) => fetch('/api/exercises/complete', {...})
}
```

### Component Rules:
1. **Loading State**: Show spinner while loading from database
2. **Error State**: Show error message if database fails
3. **No Fallbacks**: If database fails, show error - don't fake it
4. **Real Progress**: All progress bars show actual database values
5. **Dynamic Content**: All text comes from database fields

## 6. Database-First Features

### Smart Next Lesson:
```sql
-- Spaced repetition determines what to study next
SELECT l.*, sr.next_review 
FROM lessons l
JOIN spaced_repetition sr ON l.id = sr.lesson_id  
WHERE sr.user_id = $1 AND sr.next_review <= NOW()
ORDER BY sr.next_review ASC
LIMIT 1
```

### Real Prerequisites:
```sql
-- Only show skills user can actually access
SELECT s.* FROM skills s
WHERE s.course_id = $1 
AND (
  s.prerequisites IS NULL 
  OR s.prerequisites <@ (
    SELECT array_agg(skill_id::text) 
    FROM user_progress 
    WHERE user_id = $2 AND status = 'completed'
  )::jsonb
)
```

### Accurate Progress:
```sql  
-- Real completion percentage from database
SELECT 
  COUNT(CASE WHEN up.status = 'completed' THEN 1 END)::float / COUNT(*)::float * 100 as completion_percentage
FROM skills s
LEFT JOIN lessons l ON s.id = l.skill_id
LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
WHERE s.course_id = $2
```

## 7. Mobile-First Responsive Design

### Breakpoint Strategy:
- **Mobile First (375px+)**: Single column, large touch targets
- **Tablet (768px+)**: Two columns, side navigation  
- **Desktop (1024px+)**: Three columns, rich interactions

### Touch Interactions:
- **Swipe Navigation**: Next/previous exercises
- **Long Press**: Audio replay
- **Pull to Refresh**: Reload current lesson
- **Progressive Web App**: Offline lesson caching

## 8. Implementation Plan

### Phase 1: Clean Slate (Week 1)
1. Delete all fallback/demo components
2. Create new clean components
3. Implement database-first data flow
4. Remove all hardcoded mappings

### Phase 2: Core Features (Week 2)  
1. User authentication with course selection
2. Skill tree with real prerequisites
3. Lesson player with database content
4. Progress tracking with spaced repetition

### Phase 3: Polish (Week 3)
1. Practice hub with due items
2. Mobile responsiveness
3. Audio integration
4. Error handling and loading states

## 9. Success Metrics

### User Experience:
- **Zero loading errors** from missing data
- **Consistent data** across all screens
- **Real progress** that users can trust
- **Fast loading** with optimized queries

### Technical Quality:
- **No hardcoded content** anywhere in codebase
- **Single data source** (PostgreSQL)
- **Clean component hierarchy** with clear responsibilities
- **Scalable architecture** for multiple languages

This architecture eliminates all your current pain points while leveraging the excellent database structure you've already built. Every piece of content comes from your database, creating a true language learning platform that can scale to any language.