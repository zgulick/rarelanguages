import { LessonGenerator } from '../../../../../lib/services/LessonGenerator';

export async function POST(request) {
  try {
    const { skillId, options = {} } = await request.json();

    if (!skillId) {
      return Response.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting lesson generation for skill: ${skillId}`);

    const generator = new LessonGenerator();
    const result = await generator.generateLessonsForSkill(skillId, options);

    return Response.json({
      success: true,
      ...result,
      message: `Successfully generated ${result.lessonsGenerated} lessons`
    });

  } catch (error) {
    console.error('❌ Lesson generation failed:', error);

    return Response.json(
      {
        error: 'Lesson generation failed',
        details: error.message,
        type: error.type || 'GENERATION_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get('skillId');

    if (!skillId) {
      return Response.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      );
    }

    // Check if processed lessons exist for this skill
    const { query } = require('../../../../../lib/database');
    const result = await query(`
      SELECT
        COUNT(*) as lesson_count,
        MAX(generated_at) as last_generated,
        SUM(generation_cost) as total_cost
      FROM processed_lessons
      WHERE skill_id = $1 AND is_active = true
    `, [skillId]);

    const stats = result.rows[0];

    return Response.json({
      skillId,
      hasProcessedLessons: parseInt(stats.lesson_count) > 0,
      lessonCount: parseInt(stats.lesson_count),
      lastGenerated: stats.last_generated,
      totalCost: parseFloat(stats.total_cost || 0)
    });

  } catch (error) {
    console.error('❌ Failed to check lesson generation status:', error);

    return Response.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}