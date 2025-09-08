/**
 * Database Populator for Generated Albanian Content
 * Efficiently updates the database with translated content
 */

const { query, db } = require('../lib/database');
const path = require('path');

/**
 * Main database population function
 */
async function populateDatabase(progress) {
  progress.setCurrentPhase('database_population');
  
  console.log('📊 Populating database with Albanian content...');
  
  // Get all translations from progress tracker
  const translations = progress.getTranslations();
  
  if (translations.length === 0) {
    console.log('⚠️  No translations found to populate database');
    return;
  }
  
  console.log(`📝 Processing ${translations.length} translations...`);
  
  try {
    // Step 1: Update lesson_content table with translations
    await updateLessonContentTable(translations, progress);
    
    // Step 2: Update lesson theory snippets (skipped - optional)
    // await updateLessonTheories(progress);
    
    // Step 3: Ensure all lessons have proper content counts (skipped - optional)
    // await updateLessonMetadata(progress);
    
    // Step 4: Validate database consistency
    await validateDatabaseContent(progress);
    
    console.log('✅ Database population complete!');
    
  } catch (error) {
    console.error('❌ Database population failed:', error.message);
    progress.logError(error, 'database_population');
    throw error;
  }
}

/**
 * Update lesson_content table with Albanian translations
 */
async function updateLessonContentTable(translations, progress) {
  console.log('📝 Updating lesson content with Albanian translations...');
  
  let updated = 0;
  let inserted = 0;
  
  for (const translation of translations) {
    try {
      // First, try to find existing content with this English phrase
      const existingContent = await query(`
        SELECT lc.id, l.name as lesson_name, s.name as skill_name
        FROM lesson_content lc
        JOIN lessons l ON lc.lesson_id = l.id
        JOIN skills s ON l.skill_id = s.id
        WHERE lc.english_phrase = $1 AND lc.target_phrase IS NULL
        LIMIT 1
      `, [translation.english]);
      
      if (existingContent.rows.length > 0) {
        // Update existing content
        const contentId = existingContent.rows[0].id;
        
        await query(`
          UPDATE lesson_content 
          SET target_phrase = $1,
              cultural_context = $2
          WHERE id = $3
        `, [
          translation.albanian,
          translation.cultural_note || null,
          contentId
        ]);
        
        updated++;
        
        if (updated % 10 === 0) {
          console.log(`   📝 Updated ${updated} existing phrases...`);
        }
      } else {
        // Insert new content - find an appropriate lesson
        const appropriateLesson = await findAppropriateLesson(translation.english);
        
        if (appropriateLesson) {
          await query(`
            INSERT INTO lesson_content (
              lesson_id, english_phrase, target_phrase, cultural_context,
              difficulty_score, exercise_types
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            appropriateLesson.id,
            translation.english,
            translation.albanian,
            translation.cultural_note || null,
            3, // Default difficulty
            JSON.stringify(['flashcard', 'audio', 'conversation', 'visual'])
          ]);
          
          inserted++;
        }
      }
      
    } catch (error) {
      console.warn(`⚠️  Failed to process translation: "${translation.english}" - ${error.message}`);
      progress.logError(error, `translation: ${translation.english}`);
    }
  }
  
  console.log(`✅ Updated ${updated} existing phrases, inserted ${inserted} new phrases`);
}

/**
 * Find appropriate lesson for a given English phrase
 */
async function findAppropriateLesson(englishPhrase) {
  // Simple heuristic to match phrases to lessons based on keywords
  const keywordToSkill = {
    'family': 'family_members',
    'father': 'family_members',
    'mother': 'family_members',
    'brother': 'family_members',
    'sister': 'family_members',
    'hello': 'greetings_basics',
    'good morning': 'greetings_basics',
    'thank you': 'greetings_basics',
    'coffee': 'coffee_hospitality',
    'food': 'food_meals',
    'eat': 'food_meals',
    'time': 'time_daily',
    'clock': 'time_daily',
    'years old': 'numbers_ages',
    'happy': 'feelings_emotions',
    'weather': 'weather_nature'
  };
  
  const phrase = englishPhrase.toLowerCase();
  let matchedSkill = null;
  
  // Find keyword match
  for (const [keyword, skill] of Object.entries(keywordToSkill)) {
    if (phrase.includes(keyword)) {
      matchedSkill = skill;
      break;
    }
  }
  
  // Default to first available lesson if no match
  const skillCondition = matchedSkill ? `s.name = '${matchedSkill}'` : '1=1';
  
  const result = await query(`
    SELECT l.id, l.name, s.name as skill_name
    FROM lessons l
    JOIN skills s ON l.skill_id = s.id
    WHERE ${skillCondition}
    ORDER BY l.position
    LIMIT 1
  `);
  
  return result.rows[0] || null;
}

/**
 * Update lesson theory snippets
 */
async function updateLessonTheories(progress) {
  console.log('📚 Updating lesson theory snippets...');
  
  const lessons = await query(`
    SELECT l.id, l.name, l.theory_snippet, s.name as skill_name
    FROM lessons l
    JOIN skills s ON l.skill_id = s.id
    WHERE l.theory_snippet IS NULL OR l.theory_snippet = ''
  `);
  
  for (const lesson of lessons.rows) {
    try {
      const theorySnippet = generateTheorySnippet(lesson.name, lesson.skill_name);
      
      await query(`
        UPDATE lessons 
        SET theory_snippet = $1
        WHERE id = $2
      `, [theorySnippet, lesson.id]);
      
    } catch (error) {
      console.warn(`⚠️  Failed to update theory for lesson ${lesson.name}: ${error.message}`);
    }
  }
  
  console.log(`✅ Updated theory snippets for ${lessons.rows.length} lessons`);
}

/**
 * Generate theory snippet for a lesson
 */
function generateTheorySnippet(lessonName, skillName) {
  const snippets = {
    'family_members': 'Albanian family terms show respect and closeness. "Babai" (father) and "nana" (mother) are the most common informal terms.',
    'greetings_basics': 'Albanian greetings are important for showing respect. Always greet elders first and use appropriate time-of-day expressions.',
    'coffee_hospitality': 'Coffee culture is central to Albanian social life. Refusing coffee can be seen as rude - always accept at least one cup.',
    'food_meals': 'Sharing food is a sign of friendship and hospitality in Albanian culture. Always compliment the cook and eat heartily.',
    'time_daily': 'Time expressions in Albanian follow a 24-hour format. Family schedules often revolve around meal times.',
    'numbers_ages': 'Age is respected in Albanian culture. Always ask about family members and show interest in their ages and stages of life.',
    'feelings_emotions': 'Expressing emotions openly is valued in Albanian families. Support and encouragement are important family values.',
    'weather_nature': 'Weather talk is common in Albanian conversation. It\'s a safe topic that shows interest in shared experiences.'
  };
  
  return snippets[skillName] || `Learn essential ${lessonName.toLowerCase()} vocabulary for family conversations.`;
}

/**
 * Update lesson metadata (content counts, etc.)
 */
async function updateLessonMetadata(progress) {
  console.log('📊 Updating lesson metadata...');
  
  const lessons = await query(`
    SELECT 
      l.id, 
      l.name,
      COUNT(lc.id) as content_count,
      COUNT(CASE WHEN lc.target_phrase IS NOT NULL THEN 1 END) as translated_count
    FROM lessons l
    LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
    GROUP BY l.id, l.name
  `);
  
  for (const lesson of lessons.rows) {
    // Update estimated_minutes based on content count
    const estimatedMinutes = Math.max(5, Math.ceil(lesson.content_count / 3));
    
    await query(`
      UPDATE lessons 
      SET estimated_minutes = $1
      WHERE id = $2
    `, [estimatedMinutes, lesson.id]);
  }
  
  console.log(`✅ Updated metadata for ${lessons.rows.length} lessons`);
}

/**
 * Validate database content after population
 */
async function validateDatabaseContent(progress) {
  console.log('🔍 Validating database content...');
  
  // Check for lessons without content
  const emptyLessons = await query(`
    SELECT l.name 
    FROM lessons l
    LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
    GROUP BY l.id, l.name
    HAVING COUNT(lc.id) = 0
  `);
  
  if (emptyLessons.rows.length > 0) {
    console.warn(`⚠️  Found ${emptyLessons.rows.length} lessons without content:`);
    emptyLessons.rows.forEach(lesson => console.warn(`   - ${lesson.name}`));
  }
  
  // Check translation coverage
  const translationStats = await query(`
    SELECT 
      COUNT(*) as total_phrases,
      COUNT(CASE WHEN target_phrase IS NOT NULL THEN 1 END) as translated,
      COUNT(CASE WHEN target_phrase IS NULL THEN 1 END) as untranslated
    FROM lesson_content
  `);
  
  const stats = translationStats.rows[0];
  const coverage = (stats.translated / stats.total_phrases * 100).toFixed(1);
  
  console.log(`📊 Translation coverage: ${stats.translated}/${stats.total_phrases} (${coverage}%)`);
  
  if (stats.untranslated > 0) {
    console.warn(`⚠️  ${stats.untranslated} phrases still need translation`);
  }
  
  // Check for lessons with all translations
  const readyLessons = await query(`
    SELECT 
      l.name,
      COUNT(lc.id) as total,
      COUNT(CASE WHEN lc.target_phrase IS NOT NULL THEN 1 END) as translated
    FROM lessons l
    JOIN lesson_content lc ON l.id = lc.lesson_id
    GROUP BY l.id, l.name
    HAVING COUNT(lc.id) = COUNT(CASE WHEN lc.target_phrase IS NOT NULL THEN 1 END)
    AND COUNT(lc.id) > 0
  `);
  
  console.log(`✅ ${readyLessons.rows.length} lessons are fully translated and ready for learning!`);
  
  if (readyLessons.rows.length > 0) {
    console.log('📚 Ready lessons:');
    readyLessons.rows.slice(0, 5).forEach(lesson => {
      console.log(`   - ${lesson.name} (${lesson.total} phrases)`);
    });
    
    if (readyLessons.rows.length > 5) {
      console.log(`   ... and ${readyLessons.rows.length - 5} more`);
    }
  }
}

/**
 * Get database population statistics
 */
async function getDatabaseStats() {
  const stats = await query(`
    SELECT 
      COUNT(DISTINCT l.id) as total_lessons,
      COUNT(lc.id) as total_phrases,
      COUNT(CASE WHEN lc.target_phrase IS NOT NULL THEN 1 END) as translated_phrases,
      COUNT(CASE WHEN lc.cultural_context IS NOT NULL THEN 1 END) as phrases_with_culture,
      AVG(CASE WHEN lc.target_phrase IS NOT NULL THEN l.estimated_minutes END) as avg_lesson_time
    FROM lessons l
    LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
  `);
  
  return stats.rows[0];
}

module.exports = {
  populateDatabase,
  updateLessonContentTable,
  updateLessonTheories,
  updateLessonMetadata,
  validateDatabaseContent,
  getDatabaseStats
};