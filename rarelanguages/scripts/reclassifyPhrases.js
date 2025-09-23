/**
 * Phrase Reclassification Script
 * Analyzes phrase-based "verbs" and reclassifies them into appropriate categories
 */

require('dotenv').config();
const { query } = require('../lib/database');
const { OpenAIClient } = require('../lib/openai');
const config = require('../config/contentGeneration');
const fs = require('fs').promises;
const path = require('path');

class PhraseReclassifier {
  constructor() {
    this.openaiClient = new OpenAIClient();
    this.progressFile = path.join(config.progress.progressDirectory, 'phrase-reclassification.json');
    this.reclassifications = [];
  }

  async getPhraseBasedVerbs() {
    console.log('📝 Fetching phrase-based "verbs" needing reclassification...');

    const result = await query(`
      SELECT
        lc.id,
        lc.english_phrase,
        lc.target_phrase,
        lc.pronunciation_guide,
        lc.word_type,
        lc.grammar_category,
        lc.cultural_context,
        l.name as lesson_name,
        s.name as skill_name
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al'
        AND lc.word_type = 'verb'
        AND lc.target_phrase NOT LIKE 'me %'
        AND lc.target_phrase IS NOT NULL
      ORDER BY l.name, lc.content_order
    `);

    console.log(`✅ Found ${result.rows.length} phrase-based entries to analyze`);
    return result.rows;
  }

  async analyzePhrases(phrases) {
    console.log('🧠 Analyzing phrases with AI to determine proper classifications...');

    // Process in batches to avoid token limits
    const batchSize = 10;
    const allAnalyses = [];

    for (let i = 0; i < phrases.length; i += batchSize) {
      const batch = phrases.slice(i, i + batchSize);
      console.log(`📊 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(phrases.length/batchSize)}...`);

      const messages = [
        {
          role: 'system',
          content: `You are an expert Albanian language curriculum designer. Analyze Albanian language learning content and classify it into appropriate pedagogical categories.

          Classify each entry into one of these categories:
          - greeting: Basic greetings and farewells
          - phrase: Common useful phrases and expressions
          - sentence: Complete sentences for practice
          - question: Questions and interrogatives
          - response: Responses and answers
          - vocabulary: Individual words or short vocabulary items
          - noun: Standalone nouns
          - adjective: Standalone adjectives
          - DELETE: Content that is not useful for language learning or is duplicated

          Focus on practical language learning value.`
        },
        {
          role: 'user',
          content: `Analyze and classify these Albanian language learning entries:

${batch.map((item, idx) => `
${idx + 1}. English: "${item.english_phrase}"
   Albanian: "${item.target_phrase}"
   Current: word_type="${item.word_type}", lesson="${item.lesson_name}"
`).join('')}

Return as JSON with this exact structure:
{
  "classifications": [
    {
      "index": 1,
      "english": "exact english phrase",
      "albanian": "exact albanian phrase",
      "recommended_type": "greeting|phrase|sentence|question|response|vocabulary|noun|adjective|DELETE",
      "reasoning": "brief explanation of why this classification",
      "confidence": "high|medium|low"
    }
  ]
}

Ensure all entries are classified and the classification makes pedagogical sense for Albanian language learning.`
        }
      ];

      try {
        const response = await this.openaiClient.makeRequest(messages, 'phrase-analysis', { max_tokens: 2000 });

        // Clean response content
        let content = response.content.trim();
        if (content.includes('```')) {
          const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch) {
            content = jsonMatch[1];
          }
        }

        const analysis = JSON.parse(content);

        if (analysis.classifications && Array.isArray(analysis.classifications)) {
          allAnalyses.push(...analysis.classifications);
          console.log(`✅ Analyzed ${analysis.classifications.length} entries in this batch`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Failed to analyze batch starting at ${i}:`, error.message);
        // Add fallback classifications for this batch
        batch.forEach((item, batchIdx) => {
          allAnalyses.push({
            index: i + batchIdx + 1,
            english: item.english_phrase,
            albanian: item.target_phrase,
            recommended_type: "phrase", // Safe fallback
            reasoning: "Fallback classification due to analysis error",
            confidence: "low"
          });
        });
      }
    }

    console.log(`✅ Completed analysis of ${allAnalyses.length} entries`);
    return allAnalyses;
  }

  async applyReclassifications(phrases, analyses) {
    console.log('💾 Applying reclassifications to database...');

    let reclassified = 0;
    let deleted = 0;
    let errors = 0;

    for (let i = 0; i < phrases.length; i++) {
      const phrase = phrases[i];
      const analysis = analyses[i];

      if (!analysis) {
        console.warn(`⚠️  No analysis found for phrase ${i + 1}`);
        continue;
      }

      try {
        if (analysis.recommended_type === 'DELETE') {
          // Delete the entry
          await query(`DELETE FROM lesson_content WHERE id = $1`, [phrase.id]);
          deleted++;
          console.log(`🗑️  Deleted: "${phrase.english_phrase}"`);
        } else {
          // Update the word_type
          await query(`
            UPDATE lesson_content
            SET word_type = $1,
                grammar_category = $2
            WHERE id = $3
          `, [
            analysis.recommended_type,
            analysis.recommended_type,
            phrase.id
          ]);
          reclassified++;

          this.reclassifications.push({
            id: phrase.id,
            english: phrase.english_phrase,
            albanian: phrase.target_phrase,
            old_type: phrase.word_type,
            new_type: analysis.recommended_type,
            reasoning: analysis.reasoning,
            confidence: analysis.confidence,
            lesson: phrase.lesson_name
          });

          if (reclassified % 10 === 0) {
            console.log(`✅ Reclassified ${reclassified} entries...`);
          }
        }

      } catch (error) {
        console.error(`❌ Failed to update "${phrase.english_phrase}":`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Reclassification Summary:`);
    console.log(`  ✅ Reclassified: ${reclassified}`);
    console.log(`  🗑️  Deleted: ${deleted}`);
    console.log(`  ❌ Errors: ${errors}`);

    return { reclassified, deleted, errors };
  }

  async saveProgress(analyses, summary) {
    try {
      await fs.mkdir(config.progress.progressDirectory, { recursive: true });
      await fs.writeFile(
        this.progressFile,
        JSON.stringify({
          timestamp: new Date().toISOString(),
          summary,
          analyses,
          reclassifications: this.reclassifications,
          costSummary: this.openaiClient.getCostSummary()
        }, null, 2)
      );
      console.log(`✅ Progress saved to ${this.progressFile}`);
    } catch (error) {
      console.error('⚠️  Failed to save progress:', error.message);
    }
  }

  async generateSummaryReport() {
    console.log('\n📋 Generating summary report...');

    // Check remaining "verb" entries
    const remainingVerbs = await query(`
      SELECT COUNT(*) as count
      FROM lesson_content
      WHERE word_type = 'verb'
      AND target_phrase NOT LIKE 'me %'
    `);

    // Check new word type distribution
    const typeDistribution = await query(`
      SELECT
        word_type,
        COUNT(*) as count
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al'
      GROUP BY word_type
      ORDER BY count DESC
    `);

    console.log(`\n📊 Final Results:`);
    console.log(`  Remaining phrase-based "verbs": ${remainingVerbs.rows[0].count}`);
    console.log(`\n📈 Content Type Distribution:`);
    typeDistribution.rows.forEach(row => {
      console.log(`  ${row.word_type}: ${row.count}`);
    });

    return {
      remainingPhraseVerbs: parseInt(remainingVerbs.rows[0].count),
      typeDistribution: typeDistribution.rows
    };
  }

  async processReclassification() {
    console.log('🚀 Starting phrase reclassification process...');

    // Get all phrase-based "verbs"
    const phrases = await this.getPhraseBasedVerbs();

    if (phrases.length === 0) {
      console.log('🎉 No phrase-based verbs found to reclassify!');
      return;
    }

    // Analyze with AI
    const analyses = await this.analyzePhrases(phrases);

    // Apply reclassifications
    const summary = await this.applyReclassifications(phrases, analyses);

    // Generate final report
    const finalReport = await this.generateSummaryReport();

    // Save progress
    await this.saveProgress(analyses, { ...summary, ...finalReport });

    console.log('\n🎉 Phrase reclassification completed!');

    const costSummary = this.openaiClient.getCostSummary();
    console.log(`💰 Total cost: $${costSummary.totalCost.toFixed(4)}`);

    return {
      summary,
      finalReport,
      reclassifications: this.reclassifications
    };
  }
}

async function reclassifyPhrases() {
  const reclassifier = new PhraseReclassifier();

  try {
    const result = await reclassifier.processReclassification();
    return result;

  } catch (error) {
    console.error('❌ Phrase reclassification failed:', error);
    throw error;
  }
}

if (require.main === module) {
  reclassifyPhrases()
    .then((result) => {
      console.log('🎯 Phrase reclassification completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Phrase reclassification failed:', error);
      process.exit(1);
    });
}

module.exports = {
  reclassifyPhrases,
  PhraseReclassifier
};