/**
 * Gheg Albanian Curriculum Structure Population Script
 * Populates database with complete A1-A2 curriculum framework
 * English content only - ready for AI translation phase
 */

require('dotenv').config();
const { db, query } = require('../lib/database');
const skillTreeData = require('./skillTreeData');
const { vocabularyLists } = require('./vocabularyLists');
const { culturalContext } = require('./culturalContext');
const { conversationScenarios } = require('./conversationScenarios');

class CurriculumBuilder {
  constructor() {
    this.stats = {
      skillsCreated: 0,
      lessonsCreated: 0,
      contentItemsCreated: 0,
      totalVocabularyTerms: 0,
      errors: []
    };
    this.languageId = null;
    this.skillIdMap = new Map(); // Map skill positions to IDs
    this.lessonIdMap = new Map(); // Map lesson identifiers to IDs
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substr(11, 8);
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async initialize() {
    this.log('🚀 Starting Gheg Albanian Curriculum Creation...');
    
    try {
      // Get Gheg Albanian language ID
      const languages = await db.select('languages', { code: 'gheg-al' });
      if (languages.length === 0) {
        throw new Error('Gheg Albanian language not found. Please run database setup first.');
      }
      
      this.languageId = languages[0].id;
      this.log(`Found Gheg Albanian language: ${this.languageId}`);
      
      return true;
    } catch (error) {
      this.log(`Initialization failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async createSkillsAndLessons() {
    this.log('📚 Creating skill tree structure...');

    try {
      // Combine all skill levels
      const allSkills = [
        ...skillTreeData.level1Skills,
        ...skillTreeData.level2Skills, 
        ...skillTreeData.level3Skills,
        ...skillTreeData.level4Skills,
        ...skillTreeData.level5Skills,
        ...skillTreeData.level6Skills
      ];

      // Create skills in order
      for (const skillData of allSkills) {
        await this.createSkillWithLessons(skillData);
      }

      this.log(`✅ Created ${this.stats.skillsCreated} skills with ${this.stats.lessonsCreated} lessons`);
      
    } catch (error) {
      this.log(`Error creating skills: ${error.message}`, 'error');
      throw error;
    }
  }

  async createSkillWithLessons(skillData) {
    try {
      // Convert prerequisite positions to IDs
      const prerequisiteIds = skillData.prerequisites.map(pos => this.skillIdMap.get(pos)).filter(Boolean);
      
      // Create skill
      const skill = await db.insert('skills', {
        language_id: this.languageId,
        name: skillData.name,
        description: skillData.description,
        position: skillData.position,
        prerequisites: JSON.stringify(prerequisiteIds),
        cefr_level: skillData.cefr_level,
        is_active: true,
        created_at: new Date()
      });

      // Map position to skill ID for prerequisites
      this.skillIdMap.set(skillData.position, skill.id);
      this.stats.skillsCreated++;
      
      this.log(`  ✅ Created skill: ${skillData.name}`);

      // Create lessons for this skill
      for (const lessonData of skillData.lessons) {
        await this.createLesson(skill.id, skillData, lessonData);
      }

    } catch (error) {
      this.log(`  ❌ Error creating skill ${skillData.name}: ${error.message}`, 'error');
      this.stats.errors.push(`Skill ${skillData.name}: ${error.message}`);
    }
  }

  async createLesson(skillId, skillData, lessonData) {
    try {
      // Create lesson
      const lesson = await db.insert('lessons', {
        skill_id: skillId,
        name: lessonData.name,
        position: lessonData.position,
        difficulty_level: lessonData.difficulty_level,
        estimated_minutes: lessonData.estimated_minutes,
        prerequisites: JSON.stringify([]), // Individual lesson prerequisites if needed
        is_active: true,
        created_at: new Date()
      });

      // Store lesson ID for content creation
      const lessonKey = `${skillData.name}:${lessonData.name}`;
      this.lessonIdMap.set(lessonKey, lesson.id);
      this.stats.lessonsCreated++;
      
      this.log(`    ✅ Created lesson: ${lessonData.name}`);

      // Create content for this lesson
      await this.createLessonContent(lesson.id, skillData, lessonData);

    } catch (error) {
      this.log(`    ❌ Error creating lesson ${lessonData.name}: ${error.message}`, 'error');
      this.stats.errors.push(`Lesson ${lessonData.name}: ${error.message}`);
    }
  }

  async createLessonContent(lessonId, skillData, lessonData) {
    try {
      // Get relevant vocabulary for this lesson
      const vocabularyForLesson = this.getVocabularyForLesson(skillData.name, lessonData.name);
      
      // Get conversation scenarios for this lesson
      const conversationPhrases = this.getConversationPhrasesForLesson(skillData.name, lessonData.name);
      
      // Combine vocabulary and conversation phrases
      const allPhrases = [...vocabularyForLesson, ...conversationPhrases];
      
      // Create content items (English only, ready for AI translation)
      for (const englishPhrase of allPhrases) {
        await this.createContentItem(lessonId, englishPhrase, skillData);
      }

      // Add cultural context as content item
      if (skillData.cultural_focus) {
        await this.createCulturalContextItem(lessonId, skillData);
      }

    } catch (error) {
      this.log(`    ❌ Error creating content for ${lessonData.name}: ${error.message}`, 'error');
      this.stats.errors.push(`Lesson content ${lessonData.name}: ${error.message}`);
    }
  }

  async createContentItem(lessonId, englishPhrase, skillData) {
    try {
      // Determine difficulty score based on phrase complexity
      const difficultyScore = this.calculateDifficultyScore(englishPhrase, skillData.cefr_level);
      
      // Determine exercise types based on content
      const exerciseTypes = this.determineExerciseTypes(englishPhrase, skillData);
      
      // Get cultural context for this phrase if applicable
      const culturalContext = this.getCulturalContextForPhrase(englishPhrase, skillData);

      const contentItem = await db.insert('lesson_content', {
        lesson_id: lessonId,
        english_phrase: englishPhrase,
        target_phrase: null, // Will be filled by AI translation phase
        pronunciation_guide: null, // Will be filled by AI translation phase  
        cultural_context: culturalContext,
        difficulty_score: difficultyScore,
        exercise_types: JSON.stringify(exerciseTypes),
        created_at: new Date()
      });

      this.stats.contentItemsCreated++;

    } catch (error) {
      // Log but don't fail - individual content items can be skipped
      this.log(`      ⚠️  Skipped content item "${englishPhrase}": ${error.message}`);
    }
  }

  async createCulturalContextItem(lessonId, skillData) {
    try {
      await db.insert('lesson_content', {
        lesson_id: lessonId,
        english_phrase: `Cultural Note: ${skillData.name}`,
        target_phrase: null,
        pronunciation_guide: null,
        cultural_context: skillData.cultural_focus,
        difficulty_score: 1, // Cultural notes are low difficulty
        exercise_types: JSON.stringify(['cultural_note']),
        created_at: new Date()
      });

      this.stats.contentItemsCreated++;

    } catch (error) {
      this.log(`      ⚠️  Could not create cultural context: ${error.message}`);
    }
  }

  getVocabularyForLesson(skillName, lessonName) {
    // Map lessons to relevant vocabulary categories
    const skillVocabularyMap = {
      "Greetings & Politeness": vocabularyLists.greetingsAndBasics.terms.slice(0, 20),
      "Personal Identity": vocabularyLists.greetingsAndBasics.terms.slice(20, 35),
      "Family Members": vocabularyLists.familyAndPeople.terms.slice(0, 25),
      "Family Conversations": vocabularyLists.familyAndPeople.terms.slice(25, 40),
      "Numbers 1-20": vocabularyLists.numbersAndTime.terms.slice(0, 25),
      "Days & Time": vocabularyLists.numbersAndTime.terms.slice(25, 45),
      "Basic Conversations": vocabularyLists.greetingsAndBasics.terms.slice(35),
      "Household Terms": vocabularyLists.householdAndDaily.terms.slice(0, 30),
      "Card Games & Leisure": vocabularyLists.socialAndGames.terms,
      "Food & Gatherings": vocabularyLists.foodCulture.terms.slice(0, 25),
      "Opinions & Feelings": vocabularyLists.opinionsAndFeelings.terms,
      "Future & Plans": vocabularyLists.futureAndPlans.terms
    };

    return skillVocabularyMap[skillName] || [];
  }

  getConversationPhrasesForLesson(skillName, lessonName) {
    // Extract relevant conversation phrases based on skill
    const phrases = [];
    
    Object.values(conversationScenarios).forEach(category => {
      category.scenarios.forEach(scenario => {
        // Match scenario context to lesson content
        if (this.isScenarioRelevantToLesson(scenario, skillName, lessonName)) {
          if (scenario.english_phrases) phrases.push(...scenario.english_phrases.slice(0, 5));
          if (scenario.english_responses) phrases.push(...scenario.english_responses.slice(0, 5));
          if (scenario.english_topics) phrases.push(...scenario.english_topics.slice(0, 3));
        }
      });
    });

    return phrases;
  }

  isScenarioRelevantToLesson(scenario, skillName, lessonName) {
    const relevanceMap = {
      "Family Conversations": ["family", "text", "phone", "meal"],
      "Card Games & Leisure": ["card", "game", "play"],
      "Basic Conversations": ["coffee", "conversation", "greeting"],
      "Food & Gatherings": ["meal", "food", "gathering"],
      "Greetings & Politeness": ["greeting", "phone", "coffee"]
    };

    const skillKeywords = relevanceMap[skillName] || [];
    const scenarioContext = scenario.context.toLowerCase();
    
    return skillKeywords.some(keyword => scenarioContext.includes(keyword));
  }

  calculateDifficultyScore(phrase, cefrLevel) {
    // Base difficulty on CEFR level
    let baseDifficulty = cefrLevel === 'A1' ? 3 : 5;
    
    // Adjust based on phrase complexity
    const wordCount = phrase.split(' ').length;
    if (wordCount > 6) baseDifficulty += 1;
    if (phrase.includes('?')) baseDifficulty += 1; // Questions are harder
    if (phrase.includes('I think') || phrase.includes('I believe')) baseDifficulty += 1; // Opinions harder
    
    return Math.min(Math.max(baseDifficulty, 1), 10); // Clamp between 1-10
  }

  determineExerciseTypes(phrase, skillData) {
    const exerciseTypes = ['flashcard']; // Default
    
    // Add specific exercise types based on content
    if (phrase.includes('?')) exerciseTypes.push('conversation');
    if (skillData.name.includes('Numbers')) exerciseTypes.push('audio');
    if (skillData.name.includes('Card Games')) exerciseTypes.push('visual');
    if (phrase.length > 50) exerciseTypes.push('conversation');
    
    return exerciseTypes;
  }

  getCulturalContextForPhrase(phrase, skillData) {
    // Add cultural context for specific types of phrases
    if (phrase.toLowerCase().includes('family')) {
      return 'Albanian families are central to social life. Extended family relationships are very important.';
    }
    if (phrase.toLowerCase().includes('coffee')) {
      return 'Coffee culture is essential in Albanian society. Coffee invitations are serious friendship gestures.';
    }
    if (phrase.toLowerCase().includes('thank') || phrase.toLowerCase().includes('please')) {
      return 'Politeness and respect are highly valued, especially when addressing elders.';
    }
    
    return null;
  }

  async createVocabularyReference() {
    this.log('📖 Creating vocabulary reference data...');
    
    try {
      // This could be expanded to create a separate vocabulary reference table
      // For now, vocabulary is integrated into lesson content
      
      this.stats.totalVocabularyTerms = Object.values(vocabularyLists)
        .reduce((total, category) => total + category.terms.length, 0);
      
      this.log(`✅ ${this.stats.totalVocabularyTerms} vocabulary terms integrated into lessons`);
      
    } catch (error) {
      this.log(`Error creating vocabulary reference: ${error.message}`, 'error');
      this.stats.errors.push(`Vocabulary reference: ${error.message}`);
    }
  }

  async validateCurriculumStructure() {
    this.log('🔍 Validating curriculum structure...');

    try {
      // Check skill prerequisites form valid progression
      const skills = await db.select('skills', { language_id: this.languageId }, 'position ASC');
      
      for (const skill of skills) {
        const prerequisites = JSON.parse(skill.prerequisites || '[]');
        
        // Validate all prerequisites exist and have lower positions
        for (const prereqId of prerequisites) {
          const prereq = skills.find(s => s.id === prereqId);
          if (!prereq) {
            throw new Error(`Skill ${skill.name} has invalid prerequisite: ${prereqId}`);
          }
          if (prereq.position >= skill.position) {
            throw new Error(`Skill ${skill.name} prerequisite ${prereq.name} has invalid position ordering`);
          }
        }
      }

      // Check lesson content exists for all lessons
      const lessons = await query(`
        SELECT l.*, COUNT(lc.id) as content_count
        FROM lessons l
        LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
        JOIN skills s ON l.skill_id = s.id
        WHERE s.language_id = $1
        GROUP BY l.id
        HAVING COUNT(lc.id) = 0
      `, [this.languageId]);

      if (lessons.rows.length > 0) {
        this.log(`⚠️  Found ${lessons.rows.length} lessons without content`);
      }

      this.log('✅ Curriculum structure validation passed');

    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async generateReport() {
    this.log('\n📊 Curriculum Creation Summary:');
    console.log(`  Languages: 1 (Gheg Albanian)`);
    console.log(`  Skills: ${this.stats.skillsCreated}`);
    console.log(`  Lessons: ${this.stats.lessonsCreated}`);
    console.log(`  Content Items: ${this.stats.contentItemsCreated}`);
    console.log(`  Vocabulary Terms: ${this.stats.totalVocabularyTerms}`);
    console.log(`  Cultural Context Items: Integrated`);
    console.log(`  Conversation Scenarios: Integrated`);
    
    if (this.stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      this.stats.errors.forEach(error => console.log(`    - ${error}`));
    }

    // Get final counts from database
    const finalStats = await this.getDatabaseStats();
    console.log(`\n📈 Database Verification:`);
    console.log(`  Skills in DB: ${finalStats.skills}`);
    console.log(`  Lessons in DB: ${finalStats.lessons}`);
    console.log(`  Content Items in DB: ${finalStats.content}`);
    console.log(`  Ready for AI Translation: ${finalStats.readyForTranslation}`);
  }

  async getDatabaseStats() {
    try {
      const skillsResult = await query('SELECT COUNT(*) FROM skills WHERE language_id = $1', [this.languageId]);
      const lessonsResult = await query(`
        SELECT COUNT(*) FROM lessons l 
        JOIN skills s ON l.skill_id = s.id 
        WHERE s.language_id = $1
      `, [this.languageId]);
      const contentResult = await query(`
        SELECT COUNT(*) FROM lesson_content lc
        JOIN lessons l ON lc.lesson_id = l.id
        JOIN skills s ON l.skill_id = s.id
        WHERE s.language_id = $1
      `, [this.languageId]);
      const readyResult = await query(`
        SELECT COUNT(*) FROM lesson_content lc
        JOIN lessons l ON lc.lesson_id = l.id
        JOIN skills s ON l.skill_id = s.id
        WHERE s.language_id = $1 AND lc.target_phrase IS NULL
      `, [this.languageId]);

      return {
        skills: parseInt(skillsResult.rows[0].count),
        lessons: parseInt(lessonsResult.rows[0].count),
        content: parseInt(contentResult.rows[0].count),
        readyForTranslation: parseInt(readyResult.rows[0].count)
      };
    } catch (error) {
      this.log(`Error getting database stats: ${error.message}`, 'error');
      return { skills: 0, lessons: 0, content: 0, readyForTranslation: 0 };
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.createSkillsAndLessons();
      await this.createVocabularyReference();
      await this.validateCurriculumStructure();
      await this.generateReport();
      
      this.log('🎉 Curriculum creation completed successfully!');
      process.exit(0);
      
    } catch (error) {
      this.log(`💥 Curriculum creation failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run curriculum creation if called directly
if (require.main === module) {
  const builder = new CurriculumBuilder();
  builder.run().catch(console.error);
}

module.exports = CurriculumBuilder;