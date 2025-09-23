/**
 * Test single verb conjugation to debug JSON issues
 */

require('dotenv').config();
const { query } = require('../lib/database');
const { OpenAIClient } = require('../lib/openai');

async function testSingleVerb() {
  const openaiClient = new OpenAIClient();

  try {
    // Get one verb for testing
    const verbResult = await query(`
      SELECT id, english_phrase, target_phrase
      FROM lesson_content
      WHERE word_type = 'verb' AND target_phrase IS NOT NULL
      LIMIT 1
    `);

    if (verbResult.rows.length === 0) {
      console.log('No verbs found');
      return;
    }

    const verb = verbResult.rows[0];
    console.log(`Testing verb: "${verb.target_phrase}" (${verb.english_phrase})`);

    const messages = [
      {
        role: 'system',
        content: `You are an expert Albanian (Gheg dialect) linguist. Return ONLY valid JSON, no extra text.`
      },
      {
        role: 'user',
        content: `Generate conjugation data for: "${verb.target_phrase}" (${verb.english_phrase})

Return ONLY this JSON structure:
{
  "verb_analysis": {
    "root_form": "root",
    "verb_class": "regular_ar",
    "stem_changes": "none",
    "notes": "notes"
  },
  "conjugations": [
    {
      "tense": "present",
      "person": "first",
      "number": "singular",
      "conjugated_form": "form",
      "pronunciation_guide": "pronunciation",
      "usage_notes": "usage",
      "is_irregular": false,
      "frequency_rank": 5
    }
  ]
}`
      }
    ];

    const response = await openaiClient.makeRequest(messages, 'test-verb');

    console.log('Raw OpenAI response:');
    console.log('---');
    console.log(response.content);
    console.log('---');

    // Try to parse it
    let cleanContent = response.content.trim();

    // Remove markdown
    if (cleanContent.includes('```')) {
      const jsonMatch = cleanContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        cleanContent = jsonMatch[1];
      }
    }

    console.log('Cleaned content:');
    console.log('---');
    console.log(cleanContent);
    console.log('---');

    const parsed = JSON.parse(cleanContent);
    console.log('✅ Successfully parsed JSON!');
    console.log('Verb analysis:', parsed.verb_analysis);
    console.log('Conjugations count:', parsed.conjugations?.length || 0);

    // Test database insertion
    console.log('Testing database insertion...');

    // Insert with safe JSON handling
    const stemChanges = typeof parsed.verb_analysis.stem_changes === 'string'
      ? JSON.stringify({ description: parsed.verb_analysis.stem_changes })
      : JSON.stringify(parsed.verb_analysis.stem_changes);

    await query(`
      INSERT INTO verb_roots (verb_id, root_form, verb_class, stem_changes, notes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (verb_id) DO UPDATE SET
        root_form = EXCLUDED.root_form
    `, [
      verb.id,
      parsed.verb_analysis.root_form,
      parsed.verb_analysis.verb_class,
      stemChanges,
      parsed.verb_analysis.notes
    ]);

    console.log('✅ Database insertion successful!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testSingleVerb().then(() => process.exit(0)).catch(console.error);