import { query } from '../../../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const { id: courseId } = await params;
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Bearer ', '');

    const result = await query(`
      SELECT 
        s.*,
        COUNT(l.id) as total_lessons,
        COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed_lessons,
        COUNT(CASE WHEN up.status = 'completed' THEN 1 END)::float / NULLIF(COUNT(l.id), 0) * 100 as progress_percentage,
        CASE 
          WHEN s.prerequisites IS NULL THEN true
          WHEN s.prerequisites = '[]'::jsonb THEN true
          ELSE s.prerequisites <@ (
            SELECT COALESCE(array_to_json(array_agg(DISTINCT completed_skills.skill_id)), '[]')::jsonb
            FROM (
              SELECT DISTINCT s2.id as skill_id
              FROM skills s2
              JOIN lessons l2 ON s2.id = l2.skill_id
              JOIN user_progress up2 ON l2.id = up2.lesson_id
              WHERE up2.user_id = $2 AND up2.status = 'completed'
            ) completed_skills
          )
        END as available,
        CASE 
          WHEN COUNT(CASE WHEN up.status = 'completed' THEN 1 END) = COUNT(l.id) THEN 'completed'
          WHEN COUNT(CASE WHEN up.status IN ('in_progress', 'completed') THEN 1 END) > 0 THEN 'in_progress'
          ELSE 'not_started'
        END as status,
        (
          SELECT l3.id 
          FROM lessons l3 
          LEFT JOIN user_progress up3 ON l3.id = up3.lesson_id AND up3.user_id = $2
          WHERE l3.skill_id = s.id 
            AND (up3.status IS NULL OR up3.status != 'completed')
          ORDER BY l3.position 
          LIMIT 1
        ) as next_lesson_id
      FROM skills s
      LEFT JOIN lessons l ON s.id = l.skill_id
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $2
      WHERE s.course_id = $1 AND s.is_active = true
      GROUP BY s.id, s.name, s.description, s.position, s.prerequisites, s.cefr_level
      ORDER BY s.position
    `, [courseId, userId]);

    return Response.json(result.rows);

  } catch (error) {
    console.error('Failed to load skills:', error);
    return Response.json({ error: 'Failed to load skills' }, { status: 500 });
  }
}