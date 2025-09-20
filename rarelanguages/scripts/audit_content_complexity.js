#!/usr/bin/env node

/**
 * Content Complexity Audit Script
 * Analyzes current lesson content to identify overly complex phrases
 * for freshman high school Albanian learners
 */

const { query } = require('../lib/database');
const fs = require('fs').promises;
const path = require('path');

class ContentComplexityAuditor {
  constructor() {
    this.audit = {
      totalContent: 0,
      complexityAnalysis: {},
      flaggedContent: [],
      vocabularyComplexity: {},
      grammarComplexity: {},
      recommendations: []
    };
  }

  /**
   * Main audit entry point
   */
  async auditContentComplexity() {
    console.log('🔍 Starting content complexity audit for freshman Albanian...\n');

    try {
      // Step 1: Get all lesson content
      await this.getAllContent();

      // Step 2: Analyze vocabulary complexity
      await this.analyzeVocabularyComplexity();

      // Step 3: Analyze grammar complexity
      await this.analyzeGrammarComplexity();

      // Step 4: Identify problematic content
      await this.identifyProblematicContent();

      // Step 5: Generate recommendations
      await this.generateRecommendations();

      // Step 6: Save audit report
      await this.saveAuditReport();

      console.log('\n✅ Content complexity audit completed!');
      return this.audit;

    } catch (error) {
      console.error('❌ Content audit failed:', error);
      throw error;
    }
  }

  /**
   * Get all current lesson content for analysis
   */
  async getAllContent() {
    console.log('📊 Gathering all lesson content...');

    const result = await query(`
      SELECT
        lc.id,
        lc.english_phrase,
        lc.target_phrase,
        lc.word_type,
        lc.grammar_category,
        lc.difficulty_notes,
        lc.cultural_context,
        l.name as lesson_name,
        s.name as skill_name,
        s.cefr_level
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      WHERE l.is_active = true
        AND lc.english_phrase IS NOT NULL
        AND lc.target_phrase IS NOT NULL
      ORDER BY s.position, l.position, lc.id
    `);

    this.audit.totalContent = result.rows.length;
    this.contentData = result.rows;

    console.log(`   Found ${this.audit.totalContent} content items to analyze`);
  }

  /**
   * Analyze vocabulary complexity using multiple metrics
   */
  async analyzeVocabularyComplexity() {
    console.log('\n📝 Analyzing vocabulary complexity...');

    const complexityMetrics = {
      tooLong: [],           // >50 characters
      tooManyWords: [],      // >8 words
      academicVocab: [],     // Scientific/academic terms
      complexGrammar: [],    // Complex verb forms/tenses
      abstractConcepts: []   // Abstract/philosophical concepts
    };

    // Academic/scientific vocabulary patterns
    const academicPatterns = [
      /\b(hypothesis|experiment|theory|analysis|research|study|investigation|phenomenon|methodology|conclusion|evidence|data|statistics|probability|algorithm|coefficient|variable|parameter|scientific|academic|intellectual|philosophical|psychological|biological|chemical|physical|mathematical|technological|economic|political|sociological)\b/i,
      /\b(eksperiment|hipotez|analiz|studim|hetim|dukuri|metodologji|përfundim|dëshmi|të dhëna|statistik|probabilitet|algoritëm|koeficient|variabël|parametër|shkencor|akademik|intelektual|filozofik|psikologjik|biologjik|kimik|fizik|matematik|teknologjik|ekonomik|politik|sociologjik)\b/i
    ];

    // Complex grammar patterns
    const complexGrammarPatterns = [
      /\b(nëse|megjithëse|pavarësisht|meqenëse|përderisa|ashtu siç|në qoftë se|me kusht që|duke qenë se)\b/i, // Complex conjunctions
      /\b(do të|është duke|ka qenë|do të ketë|është dashur|duhet të)\b/i, // Complex verb forms
      /\b(i cili|e cila|të cilët|të cilat|i përgjithshëm|specifik|abstrakt)\b/i // Complex relative pronouns/abstract adjectives
    ];

    this.contentData.forEach(item => {
      const englishText = item.english_phrase || '';
      const albanianText = item.target_phrase || '';
      const combinedText = `${englishText} ${albanianText}`;

      // Check length complexity
      if (englishText.length > 50 || albanianText.length > 50) {
        complexityMetrics.tooLong.push({
          ...item,
          reason: `English: ${englishText.length} chars, Albanian: ${albanianText.length} chars`,
          severity: 'medium'
        });
      }

      // Check word count complexity
      const englishWords = englishText.split(/\s+/).length;
      const albanianWords = albanianText.split(/\s+/).length;
      if (englishWords > 8 || albanianWords > 8) {
        complexityMetrics.tooManyWords.push({
          ...item,
          reason: `English: ${englishWords} words, Albanian: ${albanianWords} words`,
          severity: 'high'
        });
      }

      // Check for academic vocabulary
      for (const pattern of academicPatterns) {
        if (pattern.test(combinedText)) {
          complexityMetrics.academicVocab.push({
            ...item,
            reason: 'Contains academic/scientific vocabulary',
            severity: 'high',
            matches: combinedText.match(pattern)
          });
          break;
        }
      }

      // Check for complex grammar
      for (const pattern of complexGrammarPatterns) {
        if (pattern.test(albanianText)) {
          complexityMetrics.complexGrammar.push({
            ...item,
            reason: 'Uses complex grammatical structures',
            severity: 'medium',
            matches: albanianText.match(pattern)
          });
          break;
        }
      }

      // Check for abstract concepts (based on English keywords)
      const abstractPatterns = [
        /\b(concept|idea|theory|philosophy|abstract|metaphor|symbolism|ideology|consciousness|existence|reality|truth|meaning|purpose|essence|identity|freedom|justice|beauty|wisdom|knowledge|understanding|belief|faith|hope|love|happiness|success|failure|progress|development|evolution|civilization|culture|tradition|custom|value|principle|moral|ethical|spiritual|emotional|intellectual|psychological|mental|physical|social|political|economic|historical|cultural|scientific|technological|digital|virtual|artificial|natural|environmental|global|universal|personal|individual|collective|community|society|humanity|world|universe|life|death|birth|time|space|future|past|present)\b/i
      ];

      for (const pattern of abstractPatterns) {
        if (pattern.test(englishText)) {
          complexityMetrics.abstractConcepts.push({
            ...item,
            reason: 'Contains abstract or advanced concepts',
            severity: 'high',
            matches: englishText.match(pattern)
          });
          break;
        }
      }
    });

    this.audit.complexityAnalysis = complexityMetrics;

    // Log summary
    console.log('   Complexity Issues Found:');
    console.log(`   - Too long: ${complexityMetrics.tooLong.length} items`);
    console.log(`   - Too many words: ${complexityMetrics.tooManyWords.length} items`);
    console.log(`   - Academic vocabulary: ${complexityMetrics.academicVocab.length} items`);
    console.log(`   - Complex grammar: ${complexityMetrics.complexGrammar.length} items`);
    console.log(`   - Abstract concepts: ${complexityMetrics.abstractConcepts.length} items`);
  }

  /**
   * Analyze grammar complexity and appropriateness for beginners
   */
  async analyzeGrammarComplexity() {
    console.log('\n🔧 Analyzing grammar complexity...');

    const grammarIssues = {
      beginnersAppropriate: [],
      intermediateLevel: [],
      advancedLevel: [],
      inappropriateForFreshman: []
    };

    // Beginner-appropriate patterns (what SHOULD be there)
    const beginnerPatterns = [
      /^(I am|You are|He is|She is|We are|They are)/i,
      /^(This is|That is|These are|Those are)/i,
      /^(My|Your|His|Her|Our|Their) (mother|father|brother|sister|family|house|room|school|teacher|friend)/i,
      /^(Good morning|Good afternoon|Good evening|Hello|Thank you|Please|Excuse me|How are you)/i,
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|red|blue|green|yellow|big|small|good|bad)\b/i
    ];

    // Advanced/inappropriate patterns for freshmen
    const advancedPatterns = [
      /\b(hypothesis|experiment|research|analysis|investigation|methodology|theoretical|empirical|statistical|quantitative|qualitative)\b/i,
      /\b(If .+ then .+|Although .+|Despite .+|Nevertheless|Furthermore|Moreover|Consequently|Subsequently)\b/i,
      /\b(had been|would have|should have|could have|might have|must have)\b/i,
      /\b(subjunctive|conditional|hypothetical|theoretical|abstract|philosophical|metaphysical)\b/i
    ];

    this.contentData.forEach(item => {
      const englishText = item.english_phrase || '';
      let complexityLevel = 'unknown';
      let reasoning = [];

      // Check if it matches beginner patterns
      const isBeginnerAppropriate = beginnerPatterns.some(pattern => pattern.test(englishText));
      if (isBeginnerAppropriate) {
        complexityLevel = 'beginner';
        reasoning.push('Uses basic sentence structures appropriate for beginners');
      }

      // Check if it matches advanced patterns
      const isAdvanced = advancedPatterns.some(pattern => pattern.test(englishText));
      if (isAdvanced) {
        complexityLevel = 'advanced';
        reasoning.push('Contains advanced grammar or academic language');
      }

      // Categorize based on sentence structure complexity
      const sentenceLength = englishText.split(/[.!?]+/).length;
      const hasComplexConjunctions = /\b(because|although|however|therefore|moreover|furthermore|nevertheless|consequently)\b/i.test(englishText);
      const hasPassiveVoice = /\b(is|are|was|were|been) \w+ed\b/.test(englishText);

      if (sentenceLength > 2 || hasComplexConjunctions || hasPassiveVoice) {
        if (complexityLevel === 'unknown') {
          complexityLevel = 'intermediate';
          reasoning.push('Contains complex sentence structures');
        }
      }

      // Final categorization
      const categorizedItem = {
        ...item,
        complexityLevel,
        reasoning: reasoning.join('; '),
        recommendedAction: this.getRecommendedAction(complexityLevel, englishText)
      };

      switch (complexityLevel) {
        case 'beginner':
          grammarIssues.beginnersAppropriate.push(categorizedItem);
          break;
        case 'intermediate':
          grammarIssues.intermediateLevel.push(categorizedItem);
          break;
        case 'advanced':
          grammarIssues.inappropriateForFreshman.push(categorizedItem);
          break;
        default:
          grammarIssues.advancedLevel.push(categorizedItem);
      }
    });

    this.audit.grammarComplexity = grammarIssues;

    console.log('   Grammar Complexity Distribution:');
    console.log(`   - Beginner appropriate: ${grammarIssues.beginnersAppropriate.length} items`);
    console.log(`   - Intermediate level: ${grammarIssues.intermediateLevel.length} items`);
    console.log(`   - Advanced level: ${grammarIssues.advancedLevel.length} items`);
    console.log(`   - Inappropriate for freshman: ${grammarIssues.inappropriateForFreshman.length} items`);
  }

  /**
   * Get recommended action based on complexity level
   */
  getRecommendedAction(complexityLevel, text) {
    switch (complexityLevel) {
      case 'beginner':
        return 'KEEP - Appropriate for freshman level';
      case 'intermediate':
        return 'REVIEW - May need simplification';
      case 'advanced':
        return 'REPLACE - Too advanced for beginners';
      default:
        return 'REVIEW - Needs complexity assessment';
    }
  }

  /**
   * Identify the most problematic content that needs immediate attention
   */
  async identifyProblematicContent() {
    console.log('\n🚨 Identifying problematic content...');

    const flagged = [];

    // Combine all high-severity issues
    const highSeverityIssues = [
      ...this.audit.complexityAnalysis.tooManyWords,
      ...this.audit.complexityAnalysis.academicVocab,
      ...this.audit.complexityAnalysis.abstractConcepts,
      ...this.audit.grammarComplexity.inappropriateForFreshman
    ];

    // Deduplicate and prioritize
    const seenIds = new Set();
    highSeverityIssues.forEach(item => {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        flagged.push({
          ...item,
          priorityScore: this.calculatePriorityScore(item),
          immediateAction: 'REPLACE_IMMEDIATELY'
        });
      }
    });

    // Sort by priority score (highest first)
    flagged.sort((a, b) => b.priorityScore - a.priorityScore);

    this.audit.flaggedContent = flagged;

    console.log(`   🚩 ${flagged.length} items flagged for immediate replacement`);

    // Show top 10 most problematic
    console.log('\n   Top 10 Most Problematic Items:');
    flagged.slice(0, 10).forEach((item, index) => {
      console.log(`   ${index + 1}. [${item.priorityScore}] "${item.english_phrase}"`);
      console.log(`      Skill: ${item.skill_name} | Reason: ${item.reason}`);
    });
  }

  /**
   * Calculate priority score for problematic content (higher = more urgent)
   */
  calculatePriorityScore(item) {
    let score = 0;

    // Academic vocabulary gets highest priority
    if (item.reason?.includes('academic')) score += 10;

    // Abstract concepts get high priority
    if (item.reason?.includes('abstract')) score += 8;

    // Too many words gets medium-high priority
    if (item.reason?.includes('words')) score += 6;

    // Length issues get medium priority
    if (item.reason?.includes('chars')) score += 4;

    // Complex grammar gets medium priority
    if (item.reason?.includes('grammatical')) score += 5;

    // Boost score for early skills (more critical to fix)
    if (item.skill_name?.includes('Unit 1') || item.skill_name?.includes('Greetings')) score += 5;
    if (item.skill_name?.includes('Unit 2') || item.skill_name?.includes('Family')) score += 4;

    return score;
  }

  /**
   * Generate actionable recommendations
   */
  async generateRecommendations() {
    console.log('\n💡 Generating recommendations...');

    const recommendations = [];

    // Content replacement recommendations
    const totalProblematic = this.audit.flaggedContent.length;
    const percentageProblematic = (totalProblematic / this.audit.totalContent * 100).toFixed(1);

    if (totalProblematic > this.audit.totalContent * 0.3) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'Content Overhaul',
        action: `Replace ${totalProblematic} items (${percentageProblematic}%) with beginner-appropriate content`,
        impact: 'Essential for making app usable by target audience',
        effort: 'High (6-8 hours)',
        timeline: 'Immediate'
      });
    }

    // Specific skill-based recommendations
    const skillIssues = {};
    this.audit.flaggedContent.forEach(item => {
      if (!skillIssues[item.skill_name]) {
        skillIssues[item.skill_name] = [];
      }
      skillIssues[item.skill_name].push(item);
    });

    Object.entries(skillIssues).forEach(([skillName, issues]) => {
      if (issues.length > 5) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Skill Content',
          action: `Redesign "${skillName}" content - ${issues.length} inappropriate items`,
          impact: 'Critical for specific learning unit',
          effort: 'Medium (2-3 hours)',
          timeline: 'This week'
        });
      }
    });

    // Curriculum structure recommendations
    recommendations.push({
      priority: 'HIGH',
      category: 'Curriculum Design',
      action: 'Create freshman-appropriate content generator with vocabulary limits',
      impact: 'Ensures all future content is age-appropriate',
      effort: 'Medium (3-4 hours)',
      timeline: 'This week'
    });

    recommendations.push({
      priority: 'MEDIUM',
      category: 'Quality Assurance',
      action: 'Implement content complexity validation in CI/CD pipeline',
      impact: 'Prevents inappropriate content from entering database',
      effort: 'Low (1-2 hours)',
      timeline: 'Next week'
    });

    this.audit.recommendations = recommendations;

    console.log(`   Generated ${recommendations.length} recommendations`);
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. [${rec.priority}] ${rec.action}`);
    });
  }

  /**
   * Save comprehensive audit report
   */
  async saveAuditReport() {
    const reportPath = path.join(__dirname, '..', 'data', 'content-complexity-audit.json');

    const report = {
      ...this.audit,
      auditDate: new Date().toISOString(),
      summary: {
        totalContentItems: this.audit.totalContent,
        flaggedForReplacement: this.audit.flaggedContent.length,
        percentageProblematic: (this.audit.flaggedContent.length / this.audit.totalContent * 100).toFixed(1),
        recommendationsCount: this.audit.recommendations.length,
        urgentActionsNeeded: this.audit.recommendations.filter(r => r.priority === 'CRITICAL').length
      }
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Also save a simplified report for quick reference
    const simplifiedReport = `# Content Complexity Audit Results

## Summary
- **Total Content Items:** ${report.summary.totalContentItems}
- **Items Flagged for Replacement:** ${report.summary.flaggedForReplacement} (${report.summary.percentageProblematic}%)
- **Critical Actions Needed:** ${report.summary.urgentActionsNeeded}

## Top 20 Most Problematic Items
${this.audit.flaggedContent.slice(0, 20).map((item, i) =>
  `${i + 1}. **"${item.english_phrase}"** (${item.skill_name})\n   - Issue: ${item.reason}\n   - Action: ${item.recommendedAction}`
).join('\n\n')}

## Recommendations
${this.audit.recommendations.map((rec, i) =>
  `${i + 1}. **[${rec.priority}]** ${rec.action}\n   - Impact: ${rec.impact}\n   - Effort: ${rec.effort}`
).join('\n\n')}

*Generated: ${new Date().toLocaleString()}*
`;

    const summaryPath = path.join(__dirname, '..', 'CONTENT_COMPLEXITY_AUDIT.md');
    await fs.writeFile(summaryPath, simplifiedReport);

    console.log(`\n📄 Audit report saved to: ${reportPath}`);
    console.log(`📄 Summary report saved to: ${summaryPath}`);
  }
}

/**
 * CLI interface
 */
async function main() {
  try {
    const auditor = new ContentComplexityAuditor();
    const results = await auditor.auditContentComplexity();

    console.log('\n🎯 AUDIT SUMMARY:');
    console.log(`Total Content: ${results.totalContent}`);
    console.log(`Flagged for Replacement: ${results.flaggedContent.length} (${(results.flaggedContent.length/results.totalContent*100).toFixed(1)}%)`);
    console.log(`Critical Actions: ${results.recommendations.filter(r => r.priority === 'CRITICAL').length}`);

    if (results.flaggedContent.length > results.totalContent * 0.3) {
      console.log('\n🚨 CRITICAL: Over 30% of content is inappropriate for freshman level!');
      console.log('   Immediate content replacement needed for app to be usable.');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n💥 Audit failed:', error.message);
    process.exit(1);
  }
}

// Export for testing and direct usage
module.exports = { ContentComplexityAuditor };

// Run if called directly
if (require.main === module) {
  main();
}