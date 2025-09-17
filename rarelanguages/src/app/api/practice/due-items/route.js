import { query } from '../../../../../lib/database';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Bearer ', '');

    const result = await query(`
      SELECT 
        s.name as skill_name,
        COUNT(*) as due_count,
        MAX(sr.last_reviewed) as last_reviewed,
        CASE 
          WHEN COUNT(*) FILTER (WHERE sr.next_review < NOW() - INTERVAL '1 day') > 0 THEN 'overdue'
          WHEN COUNT(*) FILTER (WHERE sr.next_review <= NOW()) > 0 THEN 'due'
          ELSE 'upcoming'
        END as urgency,
        AVG(sr.success_count::float / NULLIF(sr.total_reviews, 0)) * 100 as mastery_percentage
      FROM spaced_repetition sr
      JOIN lesson_content lc ON sr.content_id = lc.id
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      WHERE sr.user_id = $1 
        AND sr.next_review <= NOW() + INTERVAL '1 day'
      GROUP BY s.id, s.name
      ORDER BY 
        CASE 
          WHEN COUNT(*) FILTER (WHERE sr.next_review < NOW() - INTERVAL '1 day') > 0 THEN 1
          WHEN COUNT(*) FILTER (WHERE sr.next_review <= NOW()) > 0 THEN 2
          ELSE 3
        END,
        due_count DESC
    `, [userId]);

    return Response.json(result.rows);

  } catch (error) {
    console.error('Failed to load practice queue:', error);
    return Response.json({ error: 'Failed to load practice queue' }, { status: 500 });
  }
}