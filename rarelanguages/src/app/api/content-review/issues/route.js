import { query } from '../../../../../lib/database';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Load the latest analysis report to get remaining issues
    const reportPath = path.join(process.cwd(), 'content_analysis_report.json');

    if (!fs.existsSync(reportPath)) {
      return Response.json({ issues: [] });
    }

    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

    // Filter to only issues that still need manual review
    // These are typically the lower confidence issues or complex cases
    const issuesNeedingReview = reportData.issues.filter(issue => {
      const hasHighConfidenceIssues = issue.issues.some(i =>
        i.confidence && i.confidence > 0.7 &&
        !['obvious_error', 'word_type_mismatch'].includes(i.type)
      );
      const hasDifficultyIssues = issue.issues.some(i => i.type === 'difficulty_mismatch');
      const hasContentQualityIssues = issue.issues.some(i => i.type === 'content_quality_issue');

      return hasHighConfidenceIssues || hasDifficultyIssues || hasContentQualityIssues;
    });

    // Enrich with additional context from database
    const enrichedIssues = await Promise.all(
      issuesNeedingReview.map(async (issue) => {
        try {
          const contentQuery = `
            SELECT
              lc.*,
              l.name as lesson_name,
              l.difficulty_level as lesson_level,
              s.name as skill_name,
              co.level as course_level
            FROM lesson_content lc
            LEFT JOIN lessons l ON lc.lesson_id = l.id
            LEFT JOIN skills s ON l.skill_id = s.id
            LEFT JOIN course_skills cs ON s.id = cs.skill_id
            LEFT JOIN courses co ON cs.course_id = co.id
            WHERE lc.id = $1
          `;

          const result = await query(contentQuery, [issue.content_id]);
          const contentData = result.rows[0];

          return {
            ...issue,
            ...contentData,
            current_word_type: contentData?.word_type,
            current_grammar_category: contentData?.grammar_category,
            current_content_type: contentData?.content_type,
            albanian_phrase: contentData?.target_phrase
          };
        } catch (error) {
          console.error(`Error enriching issue ${issue.content_id}:`, error);
          return issue;
        }
      })
    );

    return Response.json({
      issues: enrichedIssues,
      total: enrichedIssues.length,
      original_total: reportData.issues.length
    });

  } catch (error) {
    console.error('Error loading content issues:', error);
    return Response.json(
      { error: 'Failed to load content issues' },
      { status: 500 }
    );
  }
}