/**
 * Automated Content Labeling Fix Script
 * Fixes obvious labeling errors in the database based on analysis results
 */

const { query, transaction } = require('../lib/database');
const fs = require('fs');

// Load the analysis report
const analysisReport = JSON.parse(fs.readFileSync('./content_analysis_report.json', 'utf8'));

// Helper function to determine correct content type
const getCorrectContentType = (text) => {
  if (!text) return null;

  const trimmed = text.trim();
  const wordCount = trimmed.split(/\s+/).length;
  const hasQuestionMark = trimmed.endsWith('?');
  const hasExclamation = trimmed.endsWith('!');
  const hasPeriod = trimmed.endsWith('.');

  // Clear classification rules
  if (hasQuestionMark) {
    return 'question';
  }

  if (wordCount === 1) {
    // Single word - analyze more carefully
    if (trimmed.match(/^(hello|hi|goodbye|bye)$/i)) {
      return 'greeting';
    }
    if (trimmed.match(/^(please|thanks|thank|you)$/i)) {
      return 'courtesy_phrase';
    }
    return 'word';
  }

  if (wordCount >= 2 && wordCount <= 4) {
    // Short phrase
    if (trimmed.match(/^(good morning|good evening|good afternoon|thank you|excuse me|you're welcome)/i)) {
      return 'courtesy_phrase';
    }
    if (trimmed.match(/^(hello|hi)/i)) {
      return 'greeting';
    }
    return 'phrase';
  }

  if (wordCount >= 5) {
    // Longer content - likely sentences
    return 'sentence';
  }

  return 'phrase';
};

// Helper function to determine correct grammar category
const getCorrectGrammarCategory = (text, contentType) => {
  const lower = text.toLowerCase();

  if (contentType === 'greeting') {
    return 'greetings';
  }

  if (contentType === 'courtesy_phrase') {
    return 'courtesy';
  }

  if (contentType === 'question') {
    return 'questions';
  }

  // Pattern-based grammar category detection
  if (lower.match(/^(i am|i'm|he is|she is|they are)/)) {
    return 'sentence';
  }

  if (lower.match(/^(what|where|when|why|how|who)/)) {
    return 'questions';
  }

  if (lower.match(/good (morning|evening|afternoon|night)/)) {
    return 'greetings';
  }

  if (lower.match(/(thank|please|excuse|sorry|welcome)/)) {
    return 'courtesy';
  }

  if (lower.match(/(sleep|work|eat|drink|go|come|take)/)) {
    return 'daily activities';
  }

  // Default based on content type
  if (contentType === 'sentence') {
    return 'sentences';
  }

  return 'general_vocabulary';
};

// Check if content is appropriate for level
const isAppropriateForLevel = (text, level) => {
  const wordCount = text.trim().split(/\s+/).length;

  if (level === 1) {
    // Level 1 should be very basic
    if (wordCount > 4) return false;
    if (text.match(/conclusion|infer|result|contrast|however|therefore|assistance|inconvenience/i)) {
      return false;
    }
  }

  return true;
};

const fixContentLabeling = async () => {
  console.log('🔧 Starting automated content labeling fixes...\n');

  // Get all high and medium priority issues
  const fixableIssues = analysisReport.issues.filter(issue =>
    issue.issues.some(i => ['obvious_error', 'word_type_mismatch'].includes(i.type))
  );

  console.log(`Found ${fixableIssues.length} fixable issues\n`);

  const fixes = [];
  const flaggedForRemoval = [];
  const flaggedForLevelChange = [];

  for (const issue of fixableIssues) {
    const correctType = getCorrectContentType(issue.english_phrase);
    const correctGrammarCategory = getCorrectGrammarCategory(issue.english_phrase, correctType);
    const appropriateLevel = isAppropriateForLevel(issue.english_phrase, issue.lesson_level);

    // Prepare fix for this content
    const fix = {
      content_id: issue.content_id,
      english_phrase: issue.english_phrase,
      current_word_type: issue.current_word_type,
      current_grammar_category: issue.current_grammar_category,
      suggested_word_type: correctType,
      suggested_grammar_category: correctGrammarCategory,
      lesson_name: issue.lesson_name,
      lesson_level: issue.lesson_level,
      action: 'update'
    };

    // Check if content should be removed or moved
    if (!appropriateLevel) {
      if (issue.lesson_level === 1 && issue.english_phrase.match(/conclusion|infer|result|contrast|assistance/i)) {
        fix.action = 'flag_for_removal';
        fix.reason = 'Too advanced/academic for language learning';
        flaggedForRemoval.push(fix);
      } else {
        fix.action = 'flag_for_level_change';
        fix.suggested_level = issue.lesson_level + 1;
        fix.reason = 'Too complex for current level';
        flaggedForLevelChange.push(fix);
      }
    } else {
      fixes.push(fix);
    }
  }

  console.log(`Preparing ${fixes.length} automatic fixes`);
  console.log(`Flagging ${flaggedForRemoval.length} items for removal`);
  console.log(`Flagging ${flaggedForLevelChange.length} items for level change\n`);

  // Show sample fixes
  console.log('📝 SAMPLE FIXES:');
  console.log('================');
  fixes.slice(0, 10).forEach(fix => {
    console.log(`✅ "${fix.english_phrase}"`);
    console.log(`   ${fix.current_word_type} → ${fix.suggested_word_type}`);
    console.log(`   ${fix.current_grammar_category} → ${fix.suggested_grammar_category}`);
    console.log('');
  });

  // Ask for confirmation (in real use, you'd want interactive confirmation)
  console.log('🚨 CONTENT FLAGGED FOR REMOVAL:');
  console.log('===============================');
  flaggedForRemoval.slice(0, 5).forEach(item => {
    console.log(`❌ "${item.english_phrase}" - ${item.reason}`);
  });

  console.log('\n📊 SUMMARY:');
  console.log(`Ready to fix: ${fixes.length} items`);
  console.log(`Flagged for removal: ${flaggedForRemoval.length} items`);
  console.log(`Flagged for level change: ${flaggedForLevelChange.length} items`);

  // Save fixes to files for review
  fs.writeFileSync('./content_fixes.json', JSON.stringify({
    automatic_fixes: fixes,
    flagged_for_removal: flaggedForRemoval,
    flagged_for_level_change: flaggedForLevelChange,
    timestamp: new Date().toISOString()
  }, null, 2));

  console.log('\n📄 Fixes saved to ./content_fixes.json for review');
  console.log('Run with --apply flag to execute fixes');

  // If --apply flag is passed, execute the fixes
  if (process.argv.includes('--apply')) {
    console.log('\n🚀 APPLYING FIXES...');
    await applyFixes(fixes);
  }
};

const applyFixes = async (fixes) => {
  console.log(`Applying ${fixes.length} fixes...`);

  try {
    // Build transaction queries
    const queries = fixes.map(fix => ({
      text: `
        UPDATE lesson_content
        SET word_type = $1, grammar_category = $2
        WHERE id = $3
      `,
      params: [fix.suggested_word_type, fix.suggested_grammar_category, fix.content_id]
    }));

    // Execute all fixes in a transaction
    await transaction(queries);

    console.log(`✅ Successfully applied ${fixes.length} fixes!`);

    // Generate summary report
    const summary = {
      fixes_applied: fixes.length,
      timestamp: new Date().toISOString(),
      changes: fixes.map(f => ({
        content_id: f.content_id,
        phrase: f.english_phrase,
        word_type_change: `${f.current_word_type} → ${f.suggested_word_type}`,
        grammar_category_change: `${f.current_grammar_category} → ${f.suggested_grammar_category}`
      }))
    };

    fs.writeFileSync('./applied_fixes.json', JSON.stringify(summary, null, 2));
    console.log('📄 Applied fixes summary saved to ./applied_fixes.json');

  } catch (error) {
    console.error('❌ Error applying fixes:', error);
    throw error;
  }
};

// Run the fix process
fixContentLabeling().catch(console.error);