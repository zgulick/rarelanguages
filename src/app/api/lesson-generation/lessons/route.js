import { query } from '../../../../../lib/database';

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

    // Fetch processed lessons for this skill
    const lessonsQuery = `
      SELECT
        pl.*,
        s.name as skill_name,
        co.level as course_level
      FROM processed_lessons pl
      JOIN skills s ON pl.skill_id = s.id
      JOIN course_skills cs ON s.id = cs.skill_id
      JOIN courses co ON cs.course_id = co.id
      WHERE pl.skill_id = $1
      AND pl.is_active = true
      ORDER BY pl.created_at
    `;

    const result = await query(lessonsQuery, [skillId]);
    const processedLessons = result.rows;

    // Transform the lessons for frontend consumption
    const lessons = processedLessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      overview: lesson.overview,
      sections: lesson.sections,
      assessment: lesson.assessment,
      skillName: lesson.skill_name,
      courseLevel: lesson.course_level,
      generatedAt: lesson.generated_at,
      sourceContentCount: lesson.source_content_ids.length,
      generationCost: lesson.generation_cost
    }));

    return Response.json({
      success: true,
      skillId,
      lessons,
      totalLessons: lessons.length,
      totalCost: lessons.reduce((sum, lesson) => sum + parseFloat(lesson.generationCost || 0), 0)
    });

  } catch (error) {
    console.error('❌ Failed to fetch processed lessons:', error);

    return Response.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}