import { query } from '../../../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const { id: skillId } = params;

    if (!skillId) {
      return Response.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      );
    }

    // Get processed lessons for this skill - ONLY processed lessons, no fallback
    const lessonsQuery = `
      SELECT
        pl.*,
        s.name as skill_name,
        s.description as skill_description,
        co.level as course_level,
        co.name as course_name
      FROM processed_lessons pl
      JOIN skills s ON pl.skill_id = s.id
      JOIN course_skills cs ON s.id = cs.skill_id
      JOIN courses co ON cs.course_id = co.id
      WHERE pl.skill_id = $1
      AND pl.is_active = true
      ORDER BY pl.created_at
    `;

    const result = await query(lessonsQuery, [skillId]);

    if (result.rows.length === 0) {
      return Response.json(
        {
          error: 'No processed lessons found for this skill',
          message: 'This skill has not been processed yet. Use the lesson generation tool to create lessons.',
          skillId
        },
        { status: 404 }
      );
    }

    const processedLessons = result.rows;

    // Transform for frontend
    const lessons = processedLessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      overview: lesson.overview,
      sections: lesson.sections,
      assessment: lesson.assessment,
      sourceContentCount: lesson.source_content_ids.length,
      generatedAt: lesson.generated_at,
      generationCost: parseFloat(lesson.generation_cost || 0)
    }));

    // Get skill metadata
    const skillInfo = {
      id: skillId,
      name: processedLessons[0].skill_name,
      description: processedLessons[0].skill_description,
      courseLevel: processedLessons[0].course_level,
      courseName: processedLessons[0].course_name
    };

    return Response.json({
      success: true,
      skill: skillInfo,
      lessons,
      totalLessons: lessons.length,
      totalCost: lessons.reduce((sum, lesson) => sum + lesson.generationCost, 0),
      generatedAt: processedLessons[0].generated_at
    });

  } catch (error) {
    console.error('❌ Failed to fetch processed lessons:', error);

    return Response.json(
      {
        error: 'Failed to fetch processed lessons',
        details: error.message
      },
      { status: 500 }
    );
  }
}