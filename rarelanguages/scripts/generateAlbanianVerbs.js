/**
 * Albanian Infinitive Verbs Generation Script
 * Generates essential Albanian infinitive verbs for language learning
 */

require('dotenv').config();
const { query } = require('../lib/database');
const { OpenAIClient } = require('../lib/openai');
const config = require('../config/contentGeneration');
const fs = require('fs').promises;
const path = require('path');

class AlbanianVerbGenerator {
  constructor() {
    this.openaiClient = new OpenAIClient();
    this.progressFile = path.join(config.progress.progressDirectory, 'albanian-verbs.json');
    this.generatedVerbs = [];
  }

  async generateEssentialVerbsList() {
    console.log('🎯 Generating essential Albanian infinitive verbs list...');

    const messages = [
      {
        role: 'system',
        content: `You are an expert Albanian (Gheg dialect) language instructor specializing in curriculum design.
        Create a comprehensive list of essential Albanian infinitive verbs for language learners.
        Focus on the most commonly used verbs that students need for basic to intermediate communication.
        Prioritize verbs by frequency of use and pedagogical importance.`
      },
      {
        role: 'user',
        content: `Generate a comprehensive list of 80 essential Albanian (Gheg dialect) infinitive verbs for language learning.

        Requirements:
        1. Include infinitive form in Albanian (e.g., "me lexu", "me fol")
        2. Provide accurate English translation
        3. Classify by CEFR level (A1, A2, B1, B2)
        4. Categorize by verb type (regular/irregular, transitive/intransitive)
        5. Include pronunciation guide
        6. Order by frequency/importance for learners

        Focus on verbs covering these essential categories:
        - Being/Existence (to be, to have, to exist)
        - Movement (to go, to come, to walk, to run)
        - Communication (to speak, to say, to ask, to answer)
        - Daily activities (to eat, to drink, to sleep, to work)
        - Cognition (to think, to know, to understand, to learn)
        - Actions (to do, to make, to take, to give)
        - Emotions (to love, to like, to want, to need)
        - Physical (to see, to hear, to touch, to feel)

        Return as JSON with this exact structure:
        {
          "total_verbs": 80,
          "verbs": [
            {
              "rank": 1,
              "english": "to be",
              "albanian_infinitive": "me qenë",
              "pronunciation": "meh chen",
              "verb_type": "irregular",
              "transitivity": "intransitive",
              "cefr_level": "A1",
              "category": "existence",
              "frequency_score": 10,
              "conjugation_difficulty": "high",
              "usage_notes": "Most fundamental verb in Albanian, highly irregular conjugation",
              "example_sentences": [
                {
                  "albanian": "Unë dua me qenë doktor.",
                  "english": "I want to be a doctor."
                }
              ]
            }
          ]
        }

        Ensure all verbs are authentic Gheg Albanian infinitives and pedagogically appropriate for family-friendly learning.`
      }
    ];

    try {
      const response = await this.openaiClient.makeRequest(messages, 'verb-generation', { max_tokens: 4000 });

      // Clean response content
      let content = response.content.trim();

      // Remove markdown code blocks
      if (content.includes('```')) {
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          content = jsonMatch[1];
        } else {
          content = content.replace(/```[^`]*?```/g, '').replace(/```/g, '').trim();
        }
      }

      // Extract JSON object
      const jsonMatch = content.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        content = jsonMatch[1];
      }

      const verbsData = JSON.parse(content);

      // Validate response structure
      if (!verbsData.verbs || !Array.isArray(verbsData.verbs)) {
        throw new Error('Invalid response format - missing verbs array');
      }

      if (verbsData.verbs.length === 0) {
        throw new Error('No verbs generated');
      }

      console.log(`✅ Generated ${verbsData.verbs.length} Albanian infinitive verbs`);

      // Validate each verb has required fields
      const validatedVerbs = verbsData.verbs.filter(verb => {
        if (!verb.english || !verb.albanian_infinitive || !verb.cefr_level) {
          console.warn(`⚠️  Skipping invalid verb: ${JSON.stringify(verb)}`);
          return false;
        }
        return true;
      });

      console.log(`✅ Validated ${validatedVerbs.length} verbs after filtering`);

      this.generatedVerbs = validatedVerbs;
      return {
        total_verbs: validatedVerbs.length,
        verbs: validatedVerbs,
        generation_timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Albanian verbs generation failed:`, error.message);
      throw error;
    }
  }

  async saveProgress(verbsData, step = 'generated') {
    try {
      await fs.mkdir(config.progress.progressDirectory, { recursive: true });
      await fs.writeFile(
        this.progressFile,
        JSON.stringify({
          step,
          ...verbsData,
          costSummary: this.openaiClient.getCostSummary()
        }, null, 2)
      );
      console.log(`✅ Progress saved to ${this.progressFile}`);
    } catch (error) {
      console.error('⚠️  Failed to save progress:', error.message);
    }
  }

  async loadProgress() {
    try {
      const data = await fs.readFile(this.progressFile, 'utf8');
      const progress = JSON.parse(data);
      console.log(`📂 Loaded previous progress: ${progress.total_verbs} verbs generated`);
      return progress;
    } catch (error) {
      console.log('📋 No previous progress found, starting fresh');
      return null;
    }
  }

  async insertVerbsIntoDatabase(verbsData) {
    console.log('💾 Inserting Albanian verbs into database...');

    // First, get an appropriate lesson to attach these verbs to
    // We'll create a dedicated "Verb Learning" lesson or use an existing one
    const lessonResult = await query(`
      SELECT l.id
      FROM lessons l
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al'
      ORDER BY s.position, l.position
      LIMIT 1
    `);

    if (lessonResult.rows.length === 0) {
      throw new Error('No Albanian lessons found in database. Please create lessons first.');
    }

    const defaultLessonId = lessonResult.rows[0].id;
    console.log(`📚 Using lesson ID: ${defaultLessonId}`);

    let insertedCount = 0;
    const errors = [];

    for (const verb of verbsData.verbs) {
      try {
        await query(`
          INSERT INTO lesson_content (
            lesson_id,
            english_phrase,
            target_phrase,
            pronunciation_guide,
            word_type,
            content_order,
            grammar_category,
            verb_type,
            cultural_context,
            difficulty_notes,
            usage_examples
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          defaultLessonId,
          verb.english,
          verb.albanian_infinitive,
          verb.pronunciation,
          'verb',
          verb.rank || insertedCount + 1,
          verb.category || 'verb',
          verb.verb_type || 'regular',
          JSON.stringify({
            cefr_level: verb.cefr_level,
            frequency_score: verb.frequency_score,
            transitivity: verb.transitivity,
            conjugation_difficulty: verb.conjugation_difficulty
          }),
          verb.usage_notes || '',
          JSON.stringify(verb.example_sentences || [])
        ]);

        insertedCount++;

        if (insertedCount % 10 === 0) {
          console.log(`✅ Inserted ${insertedCount}/${verbsData.verbs.length} verbs...`);
        }

      } catch (error) {
        console.error(`⚠️  Failed to insert verb "${verb.english}":`, error.message);
        errors.push({ verb: verb.english, error: error.message });
      }
    }

    console.log(`✅ Successfully inserted ${insertedCount} verbs into database`);

    if (errors.length > 0) {
      console.log(`⚠️  ${errors.length} errors occurred during insertion:`);
      errors.forEach(err => console.log(`   - ${err.verb}: ${err.error}`));
    }

    return { insertedCount, errors };
  }

  async validateDatabaseInsert() {
    console.log('🔍 Validating database insertion...');

    const result = await query(`
      SELECT
        COUNT(*) as total_verbs,
        COUNT(CASE WHEN target_phrase LIKE 'me %' THEN 1 END) as infinitive_verbs,
        COUNT(CASE WHEN word_type = 'verb' THEN 1 END) as verb_type_count
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al'
    `);

    const stats = result.rows[0];

    console.log(`📊 Database Validation Results:`);
    console.log(`  Total verbs: ${stats.total_verbs}`);
    console.log(`  Infinitive verbs (starting with 'me'): ${stats.infinitive_verbs}`);
    console.log(`  Properly typed as 'verb': ${stats.verb_type_count}`);

    return stats;
  }

  async processVerbGeneration() {
    console.log('🚀 Starting Albanian infinitive verbs generation process...');

    // Check for previous progress
    const previousProgress = await this.loadProgress();

    let verbsData;
    if (previousProgress && previousProgress.verbs && previousProgress.verbs.length > 0) {
      console.log('📂 Using previously generated verbs');
      verbsData = previousProgress;
    } else {
      console.log('🎯 Generating new verb list...');
      verbsData = await this.generateEssentialVerbsList();
      await this.saveProgress(verbsData, 'generated');
    }

    // Insert into database
    console.log('💾 Inserting verbs into database...');
    const insertResults = await this.insertVerbsIntoDatabase(verbsData);

    // Validate insertion
    const validationStats = await this.validateDatabaseInsert();

    // Final save with database results
    await this.saveProgress({
      ...verbsData,
      database_insertion: insertResults,
      validation_stats: validationStats
    }, 'completed');

    console.log('\n🎉 Albanian verbs generation completed!');
    console.log(`✅ Generated: ${verbsData.total_verbs} verbs`);
    console.log(`✅ Inserted: ${insertResults.insertedCount} verbs`);
    console.log(`✅ Database total: ${validationStats.total_verbs} verbs`);

    const costSummary = this.openaiClient.getCostSummary();
    console.log(`💰 Total cost: $${costSummary.totalCost.toFixed(4)}`);

    return verbsData;
  }
}

async function generateAlbanianVerbs() {
  const generator = new AlbanianVerbGenerator();

  try {
    const verbs = await generator.processVerbGeneration();
    return verbs;

  } catch (error) {
    console.error('❌ Albanian verbs generation failed:', error);
    throw error;
  }
}

if (require.main === module) {
  generateAlbanianVerbs()
    .then((verbs) => {
      console.log('🎯 Albanian verbs generation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Albanian verbs generation failed:', error);
      process.exit(1);
    });
}

module.exports = {
  generateAlbanianVerbs,
  AlbanianVerbGenerator
};