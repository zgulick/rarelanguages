/**
 * Test script to validate conjugation data
 */

require('dotenv').config();
const { query } = require('../lib/database');

async function testConjugations() {
  try {
    // Test specific verb conjugations
    const result = await query(`
      SELECT
        vc.tense,
        vc.person,
        vc.number,
        vc.conjugated_form,
        vc.pronunciation_guide
      FROM lesson_content lc
      JOIN verb_conjugations vc ON lc.id = vc.verb_id
      WHERE lc.target_phrase = 'me punu'
      ORDER BY
        CASE vc.tense WHEN 'present' THEN 1 WHEN 'past' THEN 2 WHEN 'future' THEN 3 WHEN 'perfect' THEN 4 END,
        CASE vc.person WHEN 'first' THEN 1 WHEN 'second' THEN 2 WHEN 'third' THEN 3 END,
        CASE vc.number WHEN 'singular' THEN 1 WHEN 'plural' THEN 2 END
    `);

    console.log('🔍 Conjugations for "me punu" (to work):');
    let currentTense = '';
    result.rows.forEach(row => {
      if (row.tense !== currentTense) {
        console.log();
        console.log(`${row.tense.toUpperCase()} TENSE:`);
        currentTense = row.tense;
      }
      console.log(`  ${row.person} ${row.number}: ${row.conjugated_form} (${row.pronunciation_guide || 'N/A'})`);
    });

    // Test API-style query
    console.log('\n🔍 Testing API-style conjugation query...');
    const apiResult = await query(`
      SELECT
        lc.id as verb_id,
        lc.english_phrase,
        lc.target_phrase,
        lc.pronunciation_guide,
        vr.root_form,
        vr.verb_class,
        COUNT(vc.id) as total_conjugations
      FROM lesson_content lc
      LEFT JOIN verb_roots vr ON lc.id = vr.verb_id
      LEFT JOIN verb_conjugations vc ON lc.id = vc.verb_id
      WHERE lc.target_phrase LIKE 'me %'
      GROUP BY lc.id, lc.english_phrase, lc.target_phrase, lc.pronunciation_guide, vr.root_form, vr.verb_class
      HAVING COUNT(vc.id) > 0
      ORDER BY total_conjugations DESC
      LIMIT 3
    `);

    console.log('\nTop 3 conjugated verbs:');
    apiResult.rows.forEach(verb => {
      console.log(`• ${verb.target_phrase} (${verb.english_phrase})`);
      console.log(`  Root: ${verb.root_form}, Class: ${verb.verb_class}`);
      console.log(`  Conjugations: ${verb.total_conjugations}`);
      console.log();
    });

    console.log('✅ Conjugation data validation completed successfully!');

  } catch (error) {
    console.error('❌ Error testing conjugations:', error.message);
  }
}

if (require.main === module) {
  testConjugations()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('💥 Test failed:', err);
      process.exit(1);
    });
}

module.exports = { testConjugations };