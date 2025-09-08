/**
 * Test Translation Script
 * Phase 1.3: Test OpenAI translation with a small batch
 */

require('dotenv').config();
const { query } = require('../lib/database');
const { OpenAIClient } = require('../lib/openai');

async function testSmallTranslation() {
  console.log('🧪 Testing OpenAI Translation with Small Batch');
  console.log('='.repeat(50));
  
  try {
    const client = new OpenAIClient();
    
    // Get 3 untranslated phrases for testing
    const result = await query(`
      SELECT lc.id, lc.english_phrase
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al' 
        AND lc.target_phrase IS NULL
        AND lc.english_phrase IS NOT NULL
      LIMIT 3
    `);
    
    if (result.rows.length === 0) {
      console.log('✅ All content already translated!');
      return true;
    }
    
    console.log(`📝 Testing with ${result.rows.length} phrases:`);
    result.rows.forEach((row, i) => {
      console.log(`  ${i+1}. "${row.english_phrase}"`);
    });
    
    // Test translation
    const phrases = result.rows.map(row => row.english_phrase);
    const context = "Family greetings and basic politeness expressions used in Kosovo Albanian families";
    
    console.log('\n🔤 Calling OpenAI for translation...');
    const response = await client.batchTranslate(phrases, context, 'test_translation');
    
    console.log('\n📊 API Response:');
    console.log(`💰 Cost: $${response.cost.toFixed(4)}`);
    console.log(`🔢 Tokens: ${response.usage.prompt_tokens} input + ${response.usage.completion_tokens} output`);
    
    // Parse and display results
    const translations = JSON.parse(response.content);
    console.log('\n✨ Translations:');
    translations.forEach((t, i) => {
      console.log(`${i+1}. "${t.english}" -> "${t.gheg}"`);
      if (t.cultural_note) {
        console.log(`   📝 ${t.cultural_note}`);
      }
    });
    
    // Test database update
    console.log('\n💾 Testing database update...');
    let updated = 0;
    for (const translation of translations) {
      const matchingRow = result.rows.find(row => 
        row.english_phrase.toLowerCase() === translation.english.toLowerCase()
      );
      
      if (matchingRow) {
        await query(`
          UPDATE lesson_content 
          SET target_phrase = $1, 
              cultural_context = $2,
              updated_at = NOW()
          WHERE id = $3
        `, [translation.gheg, translation.cultural_note, matchingRow.id]);
        updated++;
      }
    }
    
    console.log(`✅ Updated ${updated} database records`);
    
    // Show cost summary
    const costSummary = client.getCostSummary();
    console.log('\n📊 Cost Summary:');
    console.log(`  Total API calls: ${costSummary.totalCalls}`);
    console.log(`  Total cost: $${costSummary.totalCost.toFixed(4)}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Translation test failed:', error);
    return false;
  }
}

if (require.main === module) {
  testSmallTranslation()
    .then((success) => {
      if (success) {
        console.log('\n🎉 Translation test completed successfully!');
        console.log('🚀 Ready to run full translation: node scripts/generateTranslations.js');
        process.exit(0);
      } else {
        console.log('\n⚠️  Translation test failed');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Translation test failed:', error);
      process.exit(1);
    });
}

module.exports = { testSmallTranslation };