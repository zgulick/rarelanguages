import { query } from '../../../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const { id: skillId } = await params;

    // Get skill info
    const skillResult = await query(`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.cefr_level
      FROM skills s
      WHERE s.id = $1 AND s.is_active = true
    `, [skillId]);

    if (skillResult.rows.length === 0) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    const skill = skillResult.rows[0];

    // Get all lessons for this skill
    const lessonsResult = await query(`
      SELECT 
        l.id,
        l.name,
        l.position,
        l.difficulty_level,
        l.estimated_minutes,
        COUNT(lc.id) as content_count
      FROM lessons l
      LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
      WHERE l.skill_id = $1 AND l.is_active = true
      GROUP BY l.id, l.name, l.position, l.difficulty_level, l.estimated_minutes
      ORDER BY l.position ASC
    `, [skillId]);

    const lessons = lessonsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      position: row.position,
      difficulty_level: row.difficulty_level,
      estimated_minutes: row.estimated_minutes,
      content_count: parseInt(row.content_count) || 0
    }));

    return Response.json({
      success: true,
      skill: {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        cefr_level: skill.cefr_level
      },
      lessons,
      total_lessons: lessons.length
    });

  } catch (error) {
    console.error('Failed to load lessons for skill:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}