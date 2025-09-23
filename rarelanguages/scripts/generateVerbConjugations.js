/**
 * Verb Conjugation Generation Script
 * Uses OpenAI to generate comprehensive Albanian verb conjugation data
 */

require('dotenv').config();
const { query } = require('../lib/database');
const { OpenAIClient } = require('../lib/openai');
const config = require('../config/contentGeneration');
const fs = require('fs').promises;
const path = require('path');

class VerbConjugationGenerator {
  constructor() {
    this.openaiClient = new OpenAIClient();
    this.progressFile = path.join(config.progress.progressDirectory, 'infinitive-verb-conjugations.json');
    this.completedVerbs = new Set();
  }

  async getUnconjugatedVerbs() {
    console.log('📝 Fetching infinitive verbs needing conjugation data...');

    const result = await query(`
      SELECT
        lc.id,
        lc.english_phrase,
        lc.target_phrase,
        lc.pronunciation_guide,
        lc.grammar_category,
        lc.verb_type,
        lc.cultural_context,
        l.name as lesson_name,
        s.name as skill_name,
        s.cefr_level
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al'
        AND lc.word_type = 'verb'
        AND lc.target_phrase IS NOT NULL
        AND lc.target_phrase LIKE 'me %'
        AND NOT EXISTS (
          SELECT 1 FROM verb_conjugations vc WHERE vc.verb_id = lc.id
        )
      ORDER BY lc.content_order, lc.id
    `);

    console.log(`✅ Found ${result.rows.length} infinitive verbs needing conjugation data`);
    return result.rows;
  }

  async saveProgress(conjugations, step = 'conjugations') {
    try {
      await fs.mkdir(config.progress.progressDirectory, { recursive: true });
      await fs.writeFile(
        this.progressFile,
        JSON.stringify({
          step,
          completed: conjugations.length,
          conjugations,
          timestamp: new Date().toISOString(),
          costSummary: this.openaiClient.getCostSummary()
        }, null, 2)
      );
    } catch (error) {
      console.error('⚠️  Failed to save progress:', error.message);
    }
  }

  async loadProgress() {
    try {
      const data = await fs.readFile(this.progressFile, 'utf8');
      const progress = JSON.parse(data);
      console.log(`📂 Loaded previous progress: ${progress.completed} verbs completed`);

      // Mark completed verbs
      progress.conjugations.forEach(c => {
        this.completedVerbs.add(c.target_phrase);
      });

      return progress;
    } catch (error) {
      console.log('📋 No previous progress found, starting fresh');
      return null;
    }
  }

  async generateConjugationsForVerb(verb) {
    console.log(`🔤 Generating conjugations for "${verb.target_phrase}" (${verb.english_phrase})`);

    const messages = [
      {
        role: 'system',
        content: `You are an expert Albanian (Gheg dialect) linguist specializing in verb conjugation.
        Provide accurate, comprehensive conjugation data for Gheg Albanian verbs used in Kosovo.
        Focus on the most commonly used tenses and ensure all forms are linguistically correct.`
      },
      {
        role: 'user',
        content: `Generate comprehensive conjugation data for this Gheg Albanian infinitive verb:

Albanian Infinitive: "${verb.target_phrase}"
English Meaning: "${verb.english_phrase}"
Pronunciation: "${verb.pronunciation_guide || 'N/A'}"
Verb Type: ${verb.verb_type || 'regular'}
CEFR Level: ${verb.cefr_level || 'A1'}

This is an INFINITIVE VERB starting with "me". Please conjugate the root verb form.

Please provide conjugations for the following tenses:
1. Present (Tani) - e.g., "unë lexoj", "ti lexon"
2. Past (E kaluara) - e.g., "unë lexova", "ti lexove"
3. Future (E ardhmja) - e.g., "unë kam me lexu", "ti ke me lexu"
4. Perfect (E kryer) - e.g., "unë kam lexu", "ti ke lexu"

For each tense, provide all persons (first, second, third) and numbers (singular, plural).

Also analyze the verb to determine:
- Root/stem form (remove "me" from infinitive)
- Verb class (regular_ar, regular_er, regular_ir, irregular, auxiliary)
- Any stem changes during conjugation
- Whether any forms are irregular

Return as JSON with this exact structure:
{
  "verb_analysis": {
    "root_form": "verb stem/root",
    "verb_class": "regular_ar|regular_er|regular_ir|irregular|auxiliary",
    "stem_changes": "description of any stem changes",
    "notes": "any special notes about this verb"
  },
  "conjugations": [
    {
      "tense": "present",
      "person": "first",
      "number": "singular",
      "conjugated_form": "conjugated form",
      "pronunciation_guide": "pronunciation guide",
      "usage_notes": "when/how this form is used",
      "is_irregular": false,
      "frequency_rank": 8
    }
    // ... all other conjugations
  ],
  "paradigm_info": {
    "pattern_template": "description of conjugation pattern",
    "example_usage": "example sentence using this verb"
  }
}

Ensure all conjugated forms are accurate Gheg Albanian and include pronunciation guides.`
      }
    ];

    try {
      const response = await this.openaiClient.makeRequest(messages, 'verb-conjugation', { max_tokens: 4000 });

      // Clean response content - handle various OpenAI response formats
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

      // Extract just the JSON object if there's extra text
      const jsonMatch = content.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        content = jsonMatch[1];
      }

      const conjugationData = JSON.parse(content);

      // Validate response structure
      if (!conjugationData.verb_analysis || !conjugationData.conjugations) {
        throw new Error('Invalid response format - missing required fields');
      }

      if (!Array.isArray(conjugationData.conjugations)) {
        throw new Error('Invalid response format - conjugations should be an array');
      }

      console.log(`✅ Generated ${conjugationData.conjugations.length} conjugated forms`);

      return {
        verb_id: verb.id,
        target_phrase: verb.target_phrase,
        english_phrase: verb.english_phrase,
        lesson_name: verb.lesson_name,
        skill_name: verb.skill_name,
        ...conjugationData
      };

    } catch (error) {
      console.error(`❌ Conjugation generation failed for ${verb.target_phrase}:`, error.message);
      throw error;
    }
  }

  async updateDatabase(verbConjugationData) {
    console.log(`💾 Updating database with conjugations for "${verbConjugationData.target_phrase}"...`);

    try {
      // Insert verb root analysis with safe JSON handling
      const stemChanges = typeof verbConjugationData.verb_analysis.stem_changes === 'string'
        ? JSON.stringify({ description: verbConjugationData.verb_analysis.stem_changes })
        : JSON.stringify(verbConjugationData.verb_analysis.stem_changes);

      await query(`
        INSERT INTO verb_roots (verb_id, root_form, verb_class, stem_changes, notes)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (verb_id) DO UPDATE SET
          root_form = EXCLUDED.root_form,
          verb_class = EXCLUDED.verb_class,
          stem_changes = EXCLUDED.stem_changes,
          notes = EXCLUDED.notes
      `, [
        verbConjugationData.verb_id,
        verbConjugationData.verb_analysis.root_form,
        verbConjugationData.verb_analysis.verb_class,
        stemChanges,
        verbConjugationData.verb_analysis.notes
      ]);

      // Insert conjugations
      let insertedConjugations = 0;
      for (const conj of verbConjugationData.conjugations) {
        try {
          await query(`
            INSERT INTO verb_conjugations (
              verb_id, tense, person, number, conjugated_form,
              pronunciation_guide, usage_notes, is_irregular, frequency_rank
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (verb_id, tense, person, number) DO UPDATE SET
              conjugated_form = EXCLUDED.conjugated_form,
              pronunciation_guide = EXCLUDED.pronunciation_guide,
              usage_notes = EXCLUDED.usage_notes,
              is_irregular = EXCLUDED.is_irregular,
              frequency_rank = EXCLUDED.frequency_rank
          `, [
            verbConjugationData.verb_id,
            conj.tense,
            conj.person,
            conj.number,
            conj.conjugated_form,
            conj.pronunciation_guide,
            conj.usage_notes,
            conj.is_irregular || false,
            Math.min(conj.frequency_rank || 5, 10)
          ]);
          insertedConjugations++;
        } catch (error) {
          console.error(`⚠️  Failed to insert conjugation ${conj.tense}/${conj.person}/${conj.number}:`, error.message);
        }
      }

      // Insert paradigm template if provided
      if (verbConjugationData.paradigm_info && verbConjugationData.verb_analysis.verb_class) {
        for (const tense of ['present', 'past', 'future', 'perfect']) {
          try {
            await query(`
              INSERT INTO verb_paradigms (verb_type, tense, pattern_template, example_verb_id, description)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (verb_type, tense) DO UPDATE SET
                pattern_template = EXCLUDED.pattern_template,
                description = EXCLUDED.description
            `, [
              verbConjugationData.verb_analysis.verb_class,
              tense,
              JSON.stringify(verbConjugationData.paradigm_info),
              verbConjugationData.verb_id,
              verbConjugationData.paradigm_info.pattern_template
            ]);
          } catch (error) {
            // Paradigm insertion is optional - don't fail the whole process
            console.log(`ℹ️  Paradigm template not inserted for ${tense}: ${error.message}`);
          }
        }
      }

      console.log(`✅ Inserted ${insertedConjugations} conjugations for "${verbConjugationData.target_phrase}"`);
      return insertedConjugations;

    } catch (error) {
      console.error(`❌ Database update failed for ${verbConjugationData.target_phrase}:`, error.message);
      throw error;
    }
  }

  async processAllVerbs() {
    console.log('🚀 Starting verb conjugation generation process...');

    // Load previous progress
    const previousProgress = await this.loadProgress();
    let allConjugations = previousProgress ? previousProgress.conjugations : [];

    // Get verbs needing conjugation (skip already completed)
    const allVerbs = await this.getUnconjugatedVerbs();
    const remainingVerbs = allVerbs.filter(verb =>
      !this.completedVerbs.has(verb.target_phrase)
    );

    if (remainingVerbs.length === 0) {
      console.log('🎉 All verbs already have conjugation data!');
      return allConjugations;
    }

    console.log(`📝 Processing ${remainingVerbs.length} remaining verbs`);

    // Process verbs one by one (conjugation is complex, better to do individually)
    for (let i = 0; i < remainingVerbs.length; i++) {
      const verb = remainingVerbs[i];
      console.log(`\n🎯 Processing verb ${i + 1}/${remainingVerbs.length}: "${verb.target_phrase}"`);

      try {
        const conjugationData = await this.generateConjugationsForVerb(verb);
        await this.updateDatabase(conjugationData);

        allConjugations.push(conjugationData);

        // Save progress periodically
        if (allConjugations.length % 5 === 0) {
          await this.saveProgress(allConjugations);
        }

        // Check budget
        const costSummary = this.openaiClient.getCostSummary();
        if (costSummary.totalCost > config.generation.maxDailyCost * 0.8) {
          console.log(`⚠️  Approaching budget limit ($${costSummary.totalCost.toFixed(2)})`);
        }

        // Rate limiting - be gentle with complex requests
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Failed to process verb "${verb.target_phrase}":`, error.message);
        await this.saveProgress(allConjugations, 'partial');

        // Continue with next verb instead of failing completely
        console.log('⏭️  Continuing with next verb...');
        continue;
      }
    }

    // Final save
    await this.saveProgress(allConjugations, 'completed');

    console.log('\n🎉 Verb conjugation generation completed!');
    console.log(`✅ Total verbs processed: ${allConjugations.length}`);

    const costSummary = this.openaiClient.getCostSummary();
    console.log(`💰 Total cost: $${costSummary.totalCost.toFixed(2)}`);
    console.log(`📊 API calls: ${costSummary.totalCalls}`);

    return allConjugations;
  }
}

async function generateVerbConjugations() {
  const generator = new VerbConjugationGenerator();

  try {
    const conjugations = await generator.processAllVerbs();

    // Validate results
    const validation = await validateConjugations();
    console.log(`✨ Validation: ${validation.verbsWithConjugations}/${validation.totalVerbs} verbs have conjugation data`);

    return conjugations;

  } catch (error) {
    console.error('❌ Verb conjugation generation failed:', error);
    throw error;
  }
}

async function validateConjugations() {
  console.log('🔍 Validating conjugation results...');

  const result = await query(`
    SELECT
      COUNT(DISTINCT lc.id) as total_verbs,
      COUNT(DISTINCT vc.verb_id) as verbs_with_conjugations,
      COUNT(vc.id) as total_conjugations,
      COUNT(DISTINCT vr.verb_id) as verbs_with_roots
    FROM lesson_content lc
    LEFT JOIN verb_conjugations vc ON lc.id = vc.verb_id
    LEFT JOIN verb_roots vr ON lc.id = vr.verb_id
    JOIN lessons l ON lc.lesson_id = l.id
    JOIN skills s ON l.skill_id = s.id
    JOIN languages lang ON s.language_id = lang.id
    WHERE lang.code = 'gheg-al' AND lc.word_type = 'verb'
  `);

  const stats = result.rows[0];
  const coverageRate = (parseInt(stats.verbs_with_conjugations) / parseInt(stats.total_verbs)) * 100;

  console.log(`📊 Conjugation Statistics:`);
  console.log(`  Total verbs: ${stats.total_verbs}`);
  console.log(`  Verbs with conjugations: ${stats.verbs_with_conjugations}`);
  console.log(`  Total conjugated forms: ${stats.total_conjugations}`);
  console.log(`  Verbs with root analysis: ${stats.verbs_with_roots}`);
  console.log(`  Coverage rate: ${coverageRate.toFixed(1)}%`);

  return {
    totalVerbs: parseInt(stats.total_verbs),
    verbsWithConjugations: parseInt(stats.verbs_with_conjugations),
    totalConjugations: parseInt(stats.total_conjugations),
    verbsWithRoots: parseInt(stats.verbs_with_roots),
    coverageRate: coverageRate.toFixed(1)
  };
}

if (require.main === module) {
  generateVerbConjugations()
    .then((conjugations) => {
      console.log('🎯 Verb conjugation generation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Verb conjugation generation failed:', error);
      process.exit(1);
    });
}

module.exports = {
  generateVerbConjugations,
  validateConjugations,
  VerbConjugationGenerator
};