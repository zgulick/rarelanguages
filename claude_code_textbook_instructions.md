# Claude Code Instructions - Fix Textbook Learning Flow

## 🎯 Problem to Solve

The clean architecture you built is working great, but the lesson experience has two major issues:

1. **Academic skill names** - "Phonological and Lexical Foundations" instead of "Albanian 1: Family & Greetings"
2. **Cards test before teaching** - Asking "How do you say..." before showing the word

I need you to implement a **proper textbook learning flow**: **Teach → Practice → Test**

## 📚 Solution Overview

Create a new **TextbookLearningCards** component that follows real textbook methodology:

### Phase 1: Teaching (No pressure)
- **Overview Card**: "Today you'll learn 8 family words"  
- **Vocabulary Teaching Cards**: Show Albanian word + pronunciation + meaning (no testing)
- **Grammar Teaching**: Show verb conjugations with explanations
- **Examples**: See words used in sentences

### Phase 2: Practice (With hints)
- **Recognition Cards**: "Which of these means 'father'?" (multiple choice)
- **Pattern Practice**: Fill-in-the-blank with support
- **Audio Practice**: Listen and repeat

### Phase 3: Testing (Check understanding)
- **Recall Cards**: "Type 'father' in Albanian" (no hints)
- **Translation**: Use in realistic sentences
- **Conversation**: Apply in family scenarios

## 🔧 Implementation Steps

### Step 1: Create TextbookLearningCards Component

**File**: `components/TextbookLearningCards.jsx`

Use the complete implementation I provided in the artifacts. Key features:
- **Three clear phases** with different expectations
- **Teaching cards that just show information** (no interaction required)
- **Practice cards with hints and support**
- **Testing cards without hints**
- **Smooth transitions between phases**
- **Progress tracking per phase**

### Step 2: Create Textbook Content API

**File**: `src/app/api/lessons/[id]/textbook-content/route.js`

Use the complete API implementation I provided. This API:
- **Structures content for teaching flow** 
- **Organizes vocabulary by difficulty**
- **Extracts grammar concepts from lesson content**
- **Creates realistic usage examples**
- **Generates practice and test exercises**

### Step 3: Update LessonPage Component

**File**: `components/clean/CleanApp.jsx`

Replace the existing `LessonPage` component with the updated version I provided:
- **Auto-selects textbook mode** (this is what the user wants)
- **Optional mode selection screen** (can be removed if preferred)
- **Imports TextbookLearningCards**

### Step 4: Fix Database Content

Run these database updates to fix the academic nonsense:

#### Fix Skill Names:
```sql
-- Replace academic terms with learner-friendly names
UPDATE skills SET 
  name = 'Albanian 1: Unit 1 - Family & Greetings',
  description = 'Learn to introduce family members and greet people politely'
WHERE name ILIKE '%phonological%' OR name ILIKE '%lexical%';

UPDATE skills SET 
  name = 'Albanian 1: Unit 2 - Numbers & Time',
  description = 'Count from 1-20 and talk about time and days'  
WHERE name ILIKE '%morphosyntactic%';

UPDATE skills SET 
  name = 'Albanian 1: Unit 3 - Food & Drinks',
  description = 'Order food, express preferences, and understand meal customs'
WHERE name ILIKE '%pragmatic%';

UPDATE skills SET 
  name = 'Albanian 1: Unit 4 - Daily Activities', 
  description = 'Describe your daily routine and make plans'
WHERE name ILIKE '%discourse%' OR name ILIKE '%academic%';
```

#### Fix Lesson Names:
```sql
-- Replace academic lesson names with simple ones
UPDATE lessons SET name = 'Family Vocabulary' WHERE name ILIKE '%morphophonemic%';
UPDATE lessons SET name = 'Basic Greetings' WHERE name ILIKE '%phonological%';
UPDATE lessons SET name = 'Polite Expressions' WHERE name ILIKE '%lexical%';
UPDATE lessons SET name = 'Numbers 1-10' WHERE name ILIKE '%morphosyntactic%';
UPDATE lessons SET name = 'Days of the Week' WHERE name ILIKE '%syntactic%';
UPDATE lessons SET name = 'Telling Time' WHERE name ILIKE '%grammatical%';
```

### Step 5: Test the Flow

After implementation, test this user journey:

1. **Select Gheg Albanian**
2. **Click "Continue Lesson"** 
3. **Should automatically start TextbookLearningCards**
4. **Phase 1**: See teaching cards that just show vocabulary (no testing)
5. **Phase 2**: Practice with multiple choice and hints  
6. **Phase 3**: Test recall without hints
7. **Complete**: See lesson summary

### Step 6: Optional Enhancements

If time permits, add these improvements:

#### Better Phase Transitions:
```javascript
const PhaseTransitionCard = ({ phase }) => (
  <div className="text-center">
    <h2>{phase === 'practice' ? '🎯 Now let\'s practice!' : '🧠 Show what you learned!'}</h2>
    <p>{phase === 'practice' ? 'We\'ll help with hints' : 'No hints this time!'}</p>
  </div>
);
```

#### Audio Integration:
```javascript
const playAlbanianAudio = (text) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'sq'; // Albanian
    utterance.rate = 0.7;  // Slower for learning
    speechSynthesis.speak(utterance);
  }
};
```

## 🎯 Success Criteria

After implementation, the user should experience:

### ✅ High School Style Course Structure
- **Albanian 1: Unit 1 - Family & Greetings** (not "Phonological Foundations")
- **Family Vocabulary** (not "Morphophonemic Development")
- **Basic Greetings** (not "Lexical Integration")

### ✅ Proper Teaching Flow
- **Teaching Phase**: "Here's a new word: babai (BAH-bye) = father"
- **Practice Phase**: "Which word means father? A) nëna B) babai C) djali"  
- **Testing Phase**: "How do you say 'father' in Albanian?" [text input]

### ✅ Clear Expectations
- **Phase 1**: "Just relax and absorb - no testing yet!"
- **Phase 2**: "Try it out with hints and support"
- **Phase 3**: "Show what you've learned (no hints!)"

### ✅ Realistic Content
- **Real Albanian phrases** from your database
- **Cultural context** for Kosovo Albanian customs
- **Grammar explanations** that make sense to learners
- **Progression** that builds confidence

## 🚀 Priority Order

1. **FIRST**: Create TextbookLearningCards component (most important)
2. **SECOND**: Create textbook-content API endpoint
3. **THIRD**: Update LessonPage to use textbook mode
4. **FOURTH**: Fix database skill/lesson names
5. **FIFTH**: Test the complete flow

The user wants the **textbook learning experience** where you learn first, then practice, then test. No more jumping into quizzes without teaching!

## 📁 File Locations

```
components/
├── TextbookLearningCards.jsx (NEW - main component)
└── clean/
    └── CleanApp.jsx (UPDATE - LessonPage component)

src/app/api/lessons/[id]/
└── textbook-content/
    └── route.js (NEW - structured content API)
```

Focus on getting the **teaching flow right** - that's what will make the user happy. The clean architecture is already working, we just need proper lesson pedagogy!