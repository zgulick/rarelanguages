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

    // Get parent lessons for this skill (not sub-lessons)
    const lessonsResult = await query(`
      SELECT
        l.id,
        l.name,
        l.position,
        l.difficulty_level,
        l.estimated_minutes,
        l.is_sub_lesson,
        l.total_sub_lessons,
        l.lesson_group_name,
        CASE
          WHEN l.is_sub_lesson = FALSE AND l.total_sub_lessons > 1 THEN
            (SELECT COUNT(*) FROM lesson_content lc
             WHERE lc.lesson_id IN (
               SELECT sub.id FROM lessons sub
               WHERE sub.parent_lesson_id = l.id AND sub.is_active = true
             ))
          ELSE
            (SELECT COUNT(*) FROM lesson_content lc WHERE lc.lesson_id = l.id)
        END as content_count,
        CASE
          WHEN l.is_sub_lesson = FALSE AND l.total_sub_lessons > 1 THEN
            (SELECT COUNT(*) FROM lessons sub
             WHERE sub.parent_lesson_id = l.id AND sub.is_active = true)
          ELSE 1
        END as sub_lesson_count
      FROM lessons l
      WHERE l.skill_id = $1
        AND l.is_active = true
        AND l.is_sub_lesson = FALSE
      ORDER BY l.position ASC
    `, [skillId]);

    const lessons = lessonsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      position: row.position,
      difficulty_level: row.difficulty_level,
      estimated_minutes: row.estimated_minutes,
      content_count: parseInt(row.content_count) || 0,
      is_split_lesson: row.total_sub_lessons > 1,
      sub_lesson_count: parseInt(row.sub_lesson_count) || 1,
      total_sub_lessons: parseInt(row.total_sub_lessons) || 1,
      lesson_type: row.total_sub_lessons > 1 ? 'split' : 'single'
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