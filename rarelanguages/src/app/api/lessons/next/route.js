import { query } from '../../../../../lib/database';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Bearer ', '');

    // Get next lesson based on spaced repetition algorithm
    const result = await query(`
      WITH next_lesson_candidates AS (
        -- Get lessons due for review
        SELECT 
          l.id,
          l.name,
          l.position,
          s.name as skill_name,
          sr.next_review,
          up.status,
          1 as priority -- High priority for spaced repetition
        FROM lessons l
        JOIN skills s ON l.skill_id = s.id
        JOIN spaced_repetition sr ON l.id = sr.content_id AND sr.user_id = $1
        LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
        WHERE sr.next_review <= NOW()
        
        UNION ALL
        
        -- Get next unstarted lesson
        SELECT 
          l.id,
          l.name,
          l.position,
          s.name as skill_name,
          NULL as next_review,
          up.status,
          2 as priority -- Lower priority for new content
        FROM lessons l
        JOIN skills s ON l.skill_id = s.id
        LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
        WHERE (up.status IS NULL OR up.status = 'not_started')
          AND (
            s.prerequisites IS NULL 
            OR s.prerequisites = '[]'::jsonb
            OR s.prerequisites <@ (
              SELECT COALESCE(array_to_json(array_agg(DISTINCT skill_id)), '[]')::jsonb
              FROM (
                SELECT DISTINCT s2.id as skill_id
                FROM skills s2
                JOIN lessons l2 ON s2.id = l2.skill_id
                JOIN user_progress up2 ON l2.id = up2.lesson_id
                WHERE up2.user_id = $1 AND up2.status = 'completed'
              ) completed_skills
            )
          )
      )
      SELECT * FROM next_lesson_candidates
      ORDER BY priority, next_review ASC NULLS LAST, position
      LIMIT 1
    `, [userId]);

    if (result.rows.length === 0) {
      return Response.json({ message: 'No lessons available' }, { status: 404 });
    }

    return Response.json(result.rows[0]);

  } catch (error) {
    console.error('Failed to get next lesson:', error);
    return Response.json({ error: 'Failed to get next lesson' }, { status: 500 });
  }
}