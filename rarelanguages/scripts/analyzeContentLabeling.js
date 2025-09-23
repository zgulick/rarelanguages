/**
 * Content Labeling Analysis Script
 * Analyzes all content in the database to identify labeling issues and mismatches
 */

const { query } = require('../lib/database');
const fs = require('fs');
const path = require('path');

// Simple text analysis helpers
const analyzeText = (text) => {
  if (!text) return { type: 'unknown', confidence: 0 };

  const trimmed = text.trim();
  const wordCount = trimmed.split(/\s+/).length;
  const hasQuestionMark = trimmed.endsWith('?');
  const hasExclamation = trimmed.endsWith('!');
  const hasPeriod = trimmed.endsWith('.');

  // Simple classification rules
  if (hasQuestionMark) {
    return { type: 'question', confidence: 0.9, reason: 'ends with question mark' };
  }

  if (wordCount === 1) {
    // Single word - could be noun, verb, adjective, etc.
    if (trimmed.match(/^(hello|hi|goodbye|bye)$/i)) {
      return { type: 'greeting', confidence: 0.8, reason: 'common greeting word' };
    }
    return { type: 'word', confidence: 0.7, reason: 'single word' };
  }

  if (wordCount >= 2 && wordCount <= 4) {
    // Short phrase
    if (trimmed.match(/^(good morning|good evening|thank you|please|excuse me)/i)) {
      return { type: 'courtesy_phrase', confidence: 0.9, reason: 'common courtesy phrase' };
    }
    if (trimmed.match(/^(hello|hi)/i)) {
      return { type: 'greeting', confidence: 0.8, reason: 'greeting phrase' };
    }
    return { type: 'phrase', confidence: 0.6, reason: 'short phrase' };
  }

  if (wordCount >= 5) {
    // Longer content
    if (hasPeriod || hasExclamation) {
      return { type: 'sentence', confidence: 0.8, reason: 'complete sentence with punctuation' };
    }
    return { type: 'sentence', confidence: 0.6, reason: 'long phrase likely sentence' };
  }

  return { type: 'phrase', confidence: 0.4, reason: 'default classification' };
};

const checkDifficultyAppropriate = (content, lessonLevel) => {
  const text = content.english_phrase;
  const wordCount = text.trim().split(/\s+/).length;

  // Level 1 should be very basic
  if (lessonLevel === 1) {
    if (wordCount > 3) {
      return { appropriate: false, reason: 'too complex for level 1', suggested_level: 2 };
    }
    if (text.match(/would like|restaurant|library|coffee|directions/i)) {
      return { appropriate: false, reason: 'advanced vocabulary for level 1', suggested_level: 3 };
    }
  }

  return { appropriate: true, reason: 'seems appropriate' };
};

const analyzeContentIssues = async () => {
  console.log('🔍 Starting content labeling analysis...\n');

  try {
    // Get all content with lesson and skill information
    const contentQuery = `
      SELECT
        c.*,
        l.name as lesson_name,
        l.difficulty_level,
        s.name as skill_name,
        co.level as course_level
      FROM lesson_content c
      LEFT JOIN lessons l ON c.lesson_id = l.id
      LEFT JOIN skills s ON l.skill_id = s.id
      LEFT JOIN course_skills cs ON s.id = cs.skill_id
      LEFT JOIN courses co ON cs.course_id = co.id
      ORDER BY co.level, c.lesson_id, c.content_order
    `;

    const result = await query(contentQuery);
    const allContent = result.rows;
    console.log(`📊 Found ${allContent.length} content items to analyze\n`);

    const issues = [];
    const stats = {
      total: allContent.length,
      word_type_mismatches: 0,
      difficulty_mismatches: 0,
      theme_mismatches: 0,
      obvious_errors: 0
    };

    for (const content of allContent) {
      const analysis = analyzeText(content.english_phrase);
      const difficultyCheck = checkDifficultyAppropriate(content, content.course_level || content.difficulty_level);

      const issue = {
        content_id: content.id,
        english_phrase: content.english_phrase,
        current_word_type: content.word_type,
        current_grammar_category: content.grammar_category,
        lesson_name: content.lesson_name,
        lesson_level: content.course_level || content.difficulty_level,
        analysis: analysis,
        difficulty_check: difficultyCheck,
        issues: []
      };

      // Check for word_type mismatches
      if (content.word_type && analysis.type !== content.word_type) {
        // Special cases that are obviously wrong
        if (analysis.type === 'question' && content.word_type === 'preposition') {
          issue.issues.push({
            type: 'obvious_error',
            severity: 'high',
            description: `"${content.english_phrase}" is a question but labeled as "${content.word_type}"`
          });
          stats.obvious_errors++;
        } else if (analysis.type === 'sentence' && ['preposition', 'pronoun', 'adjective'].includes(content.word_type)) {
          issue.issues.push({
            type: 'obvious_error',
            severity: 'high',
            description: `"${content.english_phrase}" is a sentence but labeled as "${content.word_type}"`
          });
          stats.obvious_errors++;
        } else {
          issue.issues.push({
            type: 'word_type_mismatch',
            severity: 'medium',
            description: `Analyzed as "${analysis.type}" but labeled as "${content.word_type}"`
          });
          stats.word_type_mismatches++;
        }
      }

      // Check for difficulty mismatches
      if (!difficultyCheck.appropriate) {
        issue.issues.push({
          type: 'difficulty_mismatch',
          severity: 'medium',
          description: difficultyCheck.reason,
          suggested_level: difficultyCheck.suggested_level
        });
        stats.difficulty_mismatches++;
      }

      // Check for theme mismatches (simple heuristics)
      if (content.lesson_name && content.lesson_name.includes('Travel') &&
          !content.english_phrase.match(/travel|direction|where|how to get|map|location/i)) {
        issue.issues.push({
          type: 'theme_mismatch',
          severity: 'low',
          description: `Content doesn't match travel theme: "${content.english_phrase}"`
        });
        stats.theme_mismatches++;
      }

      if (issue.issues.length > 0) {
        issues.push(issue);
      }
    }

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      statistics: stats,
      issues: issues,
      summary: {
        total_issues: issues.length,
        error_rate: (issues.length / stats.total * 100).toFixed(1) + '%',
        high_priority: issues.filter(i => i.issues.some(iss => iss.severity === 'high')).length,
        medium_priority: issues.filter(i => i.issues.some(iss => iss.severity === 'medium')).length,
        low_priority: issues.filter(i => i.issues.some(iss => iss.severity === 'low')).length
      }
    };

    // Save detailed report
    const reportPath = './content_analysis_report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Save CSV for easy spreadsheet review
    const csvData = issues.map(issue => ({
      content_id: issue.content_id,
      english_phrase: issue.english_phrase,
      current_word_type: issue.current_word_type,
      suggested_type: issue.analysis.type,
      confidence: issue.analysis.confidence,
      lesson_name: issue.lesson_name,
      lesson_level: issue.lesson_level,
      issues: issue.issues.map(i => i.description).join('; '),
      severity: Math.max(...issue.issues.map(i => i.severity === 'high' ? 3 : i.severity === 'medium' ? 2 : 1))
    }));

    const csvContent = [
      'content_id,english_phrase,current_word_type,suggested_type,confidence,lesson_name,lesson_level,issues,severity',
      ...csvData.map(row =>
        `"${row.content_id}","${row.english_phrase}","${row.current_word_type}","${row.suggested_type}","${row.confidence}","${row.lesson_name}","${row.lesson_level}","${row.issues}","${row.severity}"`
      )
    ].join('\n');

    fs.writeFileSync('./content_issues.csv', csvContent);

    // Print summary
    console.log('📊 ANALYSIS COMPLETE');
    console.log('====================');
    console.log(`Total content items: ${stats.total}`);
    console.log(`Items with issues: ${issues.length} (${report.summary.error_rate})`);
    console.log(`High priority issues: ${report.summary.high_priority}`);
    console.log(`Medium priority issues: ${report.summary.medium_priority}`);
    console.log(`Low priority issues: ${report.summary.low_priority}`);
    console.log('');
    console.log(`Obvious errors: ${stats.obvious_errors}`);
    console.log(`Word type mismatches: ${stats.word_type_mismatches}`);
    console.log(`Difficulty mismatches: ${stats.difficulty_mismatches}`);
    console.log(`Theme mismatches: ${stats.theme_mismatches}`);
    console.log('');
    console.log(`📄 Detailed report: ${reportPath}`);
    console.log(`📊 CSV for review: ./content_issues.csv`);

    // Show some examples of obvious errors
    const obviousErrors = issues.filter(i => i.issues.some(iss => iss.type === 'obvious_error'));
    if (obviousErrors.length > 0) {
      console.log('\n🚨 OBVIOUS ERRORS (sample):');
      console.log('============================');
      obviousErrors.slice(0, 10).forEach(error => {
        console.log(`❌ "${error.english_phrase}"`);
        console.log(`   Current: ${error.current_word_type} | Should be: ${error.analysis.type}`);
        console.log(`   Lesson: ${error.lesson_name} (Level ${error.lesson_level})`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error analyzing content:', error);
    throw error;
  }
};

// Run the analysis
analyzeContentIssues().catch(console.error);