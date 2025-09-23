/**
 * Grammar Rules Generation Script
 * Uses OpenAI to generate comprehensive Albanian grammar explanations and exercises
 */

require('dotenv').config();
const { query } = require('../lib/database');
const { OpenAIClient } = require('../lib/openai');
const config = require('../config/contentGeneration');
const fs = require('fs').promises;
const path = require('path');

class GrammarRulesGenerator {
  constructor() {
    this.openaiClient = new OpenAIClient();
    this.progressFile = path.join(config.progress.progressDirectory, 'grammar-rules.json');
    this.completedRules = new Set();

    // Define grammar concepts to generate
    this.grammarConcepts = [
      {
        category: 'noun_declension',
        subcategory: 'basic_cases',
        concept: 'Basic noun cases in Albanian',
        difficulty: 2,
        cefr_level: 'A2'
      },
      {
        category: 'verb_conjugation',
        subcategory: 'present_tense',
        concept: 'Present tense conjugation patterns',
        difficulty: 2,
        cefr_level: 'A1'
      },
      {
        category: 'adjective_agreement',
        subcategory: 'gender_agreement',
        concept: 'Adjective-noun gender agreement',
        difficulty: 2,
        cefr_level: 'A2'
      },
      {
        category: 'articles',
        subcategory: 'definite_articles',
        concept: 'Definite article usage',
        difficulty: 1,
        cefr_level: 'A1'
      },
      {
        category: 'pronouns',
        subcategory: 'personal_pronouns',
        concept: 'Personal pronoun usage',
        difficulty: 1,
        cefr_level: 'A1'
      },
      {
        category: 'syntax',
        subcategory: 'word_order',
        concept: 'Basic Albanian word order',
        difficulty: 2,
        cefr_level: 'A2'
      },
      {
        category: 'prepositions',
        subcategory: 'basic_prepositions',
        concept: 'Common prepositions and their usage',
        difficulty: 2,
        cefr_level: 'A2'
      },
      {
        category: 'phonology',
        subcategory: 'pronunciation_rules',
        concept: 'Albanian pronunciation and stress patterns',
        difficulty: 3,
        cefr_level: 'B1'
      }
    ];
  }

  async saveProgress(rules, step = 'grammar-rules') {
    try {
      await fs.mkdir(config.progress.progressDirectory, { recursive: true });
      await fs.writeFile(
        this.progressFile,
        JSON.stringify({
          step,
          completed: rules.length,
          rules,
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
      console.log(`📂 Loaded previous progress: ${progress.completed} rules completed`);

      // Mark completed rules
      progress.rules.forEach(r => {
        this.completedRules.add(r.rule_name);
      });

      return progress;
    } catch (error) {
      console.log('📋 No previous progress found, starting fresh');
      return null;
    }
  }

  async generateGrammarRule(concept) {
    console.log(`🔤 Generating grammar rule for "${concept.concept}"`);

    const messages = [
      {
        role: 'system',
        content: `You are an expert Albanian (Gheg dialect) grammar instructor specializing in teaching Albanian to English speakers.
        Create comprehensive, beginner-friendly grammar explanations with practical examples and exercises.
        Focus on patterns that English speakers can easily understand and remember.`
      },
      {
        role: 'user',
        content: `Create a comprehensive grammar rule explanation for this Albanian (Gheg dialect) concept:

Concept: "${concept.concept}"
Category: ${concept.category}
Subcategory: ${concept.subcategory || 'general'}
Difficulty Level: ${concept.difficulty}/5
CEFR Level: ${concept.cefr_level}

Please provide:
1. Clear, simple explanation suitable for English speakers
2. Detailed explanation for advanced learners
3. 4-6 practical examples with Albanian and English
4. 2-3 practice exercises
5. Common mistakes English speakers make
6. Related grammar patterns

Return as JSON with this exact structure:
{
  "rule_name": "concise name for this rule",
  "category": "${concept.category}",
  "subcategory": "${concept.subcategory || ''}",
  "explanation": "detailed explanation of the rule",
  "simple_explanation": "beginner-friendly explanation",
  "examples": [
    {
      "albanian": "Albanian example",
      "english": "English translation",
      "explanation": "why this example demonstrates the rule"
    }
  ],
  "exercises": [
    {
      "exercise_type": "fill_blank|multiple_choice|transformation|translation",
      "question_data": {
        "question": "exercise question",
        "options": ["option1", "option2", "option3", "option4"],
        "context": "additional context if needed"
      },
      "correct_answer": "correct answer or answers",
      "explanation": "why this is correct",
      "hints": ["hint1", "hint2"],
      "common_mistakes": [
        {
          "mistake": "common wrong answer",
          "explanation": "why this is wrong"
        }
      ]
    }
  ],
  "patterns": [
    {
      "pattern_name": "name of related pattern",
      "pattern_type": "inflection|word_order|agreement|transformation",
      "pattern_template": "template showing the pattern",
      "description": "how this pattern works",
      "examples": [
        {
          "albanian": "pattern example",
          "english": "translation"
        }
      ]
    }
  ],
  "usage_frequency": 8,
  "common_mistakes": [
    {
      "mistake": "what English speakers often do wrong",
      "correct_form": "what they should do instead",
      "explanation": "why the mistake happens"
    }
  ]
}

Make sure all Albanian examples use Gheg dialect and are culturally appropriate for Kosovo Albanian families.`
      }
    ];

    try {
      const response = await this.openaiClient.makeRequest(messages, 'grammar-rule', { max_tokens: 4000 });

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

      const grammarRule = JSON.parse(content);

      // Validate response structure
      if (!grammarRule.rule_name || !grammarRule.explanation || !grammarRule.examples) {
        throw new Error('Invalid response format - missing required fields');
      }

      console.log(`✅ Generated rule "${grammarRule.rule_name}" with ${grammarRule.examples.length} examples and ${grammarRule.exercises?.length || 0} exercises`);

      return {
        concept_info: concept,
        difficulty_level: concept.difficulty,
        cefr_level: concept.cefr_level,
        ...grammarRule
      };

    } catch (error) {
      console.error(`❌ Grammar rule generation failed for ${concept.concept}:`, error.message);
      throw error;
    }
  }

  async updateDatabase(grammarRuleData) {
    console.log(`💾 Updating database with grammar rule "${grammarRuleData.rule_name}"...`);

    try {
      // Insert grammar rule
      const ruleResult = await query(`
        INSERT INTO grammar_rules (
          rule_name, category, subcategory, explanation, simple_explanation,
          examples, difficulty_level, cefr_level, usage_frequency
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        grammarRuleData.rule_name,
        grammarRuleData.category,
        grammarRuleData.subcategory,
        grammarRuleData.explanation,
        grammarRuleData.simple_explanation,
        JSON.stringify(grammarRuleData.examples),
        grammarRuleData.difficulty_level,
        grammarRuleData.cefr_level,
        grammarRuleData.usage_frequency || 5
      ]);

      const ruleId = ruleResult.rows[0].id;

      // Insert exercises
      let insertedExercises = 0;
      if (grammarRuleData.exercises && grammarRuleData.exercises.length > 0) {
        for (const exercise of grammarRuleData.exercises) {
          try {
            await query(`
              INSERT INTO grammar_exercises (
                rule_id, exercise_type, question_data, correct_answer,
                explanation, difficulty_level, hints, common_mistakes
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
              ruleId,
              exercise.exercise_type,
              JSON.stringify(exercise.question_data),
              JSON.stringify(exercise.correct_answer),
              exercise.explanation,
              grammarRuleData.difficulty_level,
              JSON.stringify(exercise.hints || []),
              JSON.stringify(exercise.common_mistakes || [])
            ]);
            insertedExercises++;
          } catch (error) {
            console.error(`⚠️  Failed to insert exercise:`, error.message);
          }
        }
      }

      // Insert patterns
      let insertedPatterns = 0;
      if (grammarRuleData.patterns && grammarRuleData.patterns.length > 0) {
        for (const pattern of grammarRuleData.patterns) {
          try {
            await query(`
              INSERT INTO grammar_patterns (
                pattern_name, pattern_type, pattern_template, description,
                examples, related_rules, frequency_score
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (pattern_name) DO UPDATE SET
                pattern_template = EXCLUDED.pattern_template,
                description = EXCLUDED.description,
                related_rules = array_append(EXCLUDED.related_rules, $6)
            `, [
              pattern.pattern_name,
              pattern.pattern_type,
              pattern.pattern_template,
              pattern.description,
              JSON.stringify(pattern.examples),
              ruleId,
              grammarRuleData.usage_frequency || 5
            ]);
            insertedPatterns++;
          } catch (error) {
            console.error(`⚠️  Failed to insert pattern:`, error.message);
          }
        }
      }

      console.log(`✅ Inserted rule "${grammarRuleData.rule_name}" with ${insertedExercises} exercises and ${insertedPatterns} patterns`);
      return { ruleId, insertedExercises, insertedPatterns };

    } catch (error) {
      console.error(`❌ Database update failed for ${grammarRuleData.rule_name}:`, error.message);
      throw error;
    }
  }

  async processAllGrammarConcepts() {
    console.log('🚀 Starting grammar rules generation process...');

    // Load previous progress
    const previousProgress = await this.loadProgress();
    let allRules = previousProgress ? previousProgress.rules : [];

    // Filter remaining concepts
    const remainingConcepts = this.grammarConcepts.filter(concept =>
      !this.completedRules.has(concept.concept)
    );

    if (remainingConcepts.length === 0) {
      console.log('🎉 All grammar concepts already generated!');
      return allRules;
    }

    console.log(`📝 Processing ${remainingConcepts.length} remaining grammar concepts`);

    // Process concepts one by one
    for (let i = 0; i < remainingConcepts.length; i++) {
      const concept = remainingConcepts[i];
      console.log(`\n🎯 Processing concept ${i + 1}/${remainingConcepts.length}: "${concept.concept}"`);

      try {
        const grammarRuleData = await this.generateGrammarRule(concept);
        await this.updateDatabase(grammarRuleData);

        allRules.push(grammarRuleData);

        // Save progress periodically
        if (allRules.length % 3 === 0) {
          await this.saveProgress(allRules);
        }

        // Check budget
        const costSummary = this.openaiClient.getCostSummary();
        if (costSummary.totalCost > config.generation.maxDailyCost * 0.8) {
          console.log(`⚠️  Approaching budget limit ($${costSummary.totalCost.toFixed(2)})`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Failed to process concept "${concept.concept}":`, error.message);
        await this.saveProgress(allRules, 'partial');

        // Continue with next concept
        console.log('⏭️  Continuing with next concept...');
        continue;
      }
    }

    // Final save
    await this.saveProgress(allRules, 'completed');

    console.log('\n🎉 Grammar rules generation completed!');
    console.log(`✅ Total rules generated: ${allRules.length}`);

    const costSummary = this.openaiClient.getCostSummary();
    console.log(`💰 Total cost: $${costSummary.totalCost.toFixed(2)}`);
    console.log(`📊 API calls: ${costSummary.totalCalls}`);

    return allRules;
  }
}

async function generateGrammarRules() {
  const generator = new GrammarRulesGenerator();

  try {
    const rules = await generator.processAllGrammarConcepts();

    // Validate results
    const validation = await validateGrammarRules();
    console.log(`✨ Validation: ${validation.totalRules} rules with ${validation.totalExercises} exercises generated`);

    return rules;

  } catch (error) {
    console.error('❌ Grammar rules generation failed:', error);
    throw error;
  }
}

async function validateGrammarRules() {
  console.log('🔍 Validating grammar rules...');

  const result = await query(`
    SELECT
      COUNT(gr.id) as total_rules,
      COUNT(ge.id) as total_exercises,
      COUNT(gp.id) as total_patterns,
      COUNT(DISTINCT gr.category) as categories_covered
    FROM grammar_rules gr
    LEFT JOIN grammar_exercises ge ON gr.id = ge.rule_id
    LEFT JOIN grammar_patterns gp ON gr.id = ANY(gp.related_rules)
  `);

  const stats = result.rows[0];

  console.log(`📊 Grammar Rules Statistics:`);
  console.log(`  Total rules: ${stats.total_rules}`);
  console.log(`  Total exercises: ${stats.total_exercises}`);
  console.log(`  Total patterns: ${stats.total_patterns}`);
  console.log(`  Categories covered: ${stats.categories_covered}`);

  return {
    totalRules: parseInt(stats.total_rules),
    totalExercises: parseInt(stats.total_exercises),
    totalPatterns: parseInt(stats.total_patterns),
    categoriesCovered: parseInt(stats.categories_covered)
  };
}

if (require.main === module) {
  generateGrammarRules()
    .then((rules) => {
      console.log('🎯 Grammar rules generation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Grammar rules generation failed:', error);
      process.exit(1);
    });
}

module.exports = {
  generateGrammarRules,
  validateGrammarRules,
  GrammarRulesGenerator
};