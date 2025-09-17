import { query } from '../../../../../lib/database';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Bearer ', '');

    if (!userId) {
      return Response.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Get user info
    const userResult = await query(`
      SELECT u.*, l.code as language_code, l.name as language_name
      FROM users u
      LEFT JOIN languages l ON u.current_language = l.id
      WHERE u.id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Get course progress
    const courseResult = await query(`
      SELECT 
        c.*,
        COUNT(DISTINCT s.id) as total_skills,
        COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN s.id END) as completed_skills,
        COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN s.id END)::float / NULLIF(COUNT(DISTINCT s.id), 0) * 100 as completion_percentage
      FROM courses c
      LEFT JOIN skills s ON c.language_id = s.language_id
      LEFT JOIN lessons les ON s.id = les.skill_id
      LEFT JOIN user_progress up ON les.id = up.lesson_id AND up.user_id = $1
      WHERE c.language_id = $2
      GROUP BY c.id
    `, [userId, user.current_language]);

    const course = courseResult.rows[0];

    // Get next lesson from spaced repetition
    const nextLessonResult = await query(`
      SELECT 
        l.*,
        s.name as skill_name,
        sr.next_review
      FROM lessons l
      JOIN skills s ON l.skill_id = s.id
      LEFT JOIN spaced_repetition sr ON l.id = sr.content_id AND sr.user_id = $1
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
      WHERE (up.status IS NULL OR up.status IN ('not_started', 'in_progress'))
         OR (sr.next_review IS NOT NULL AND sr.next_review <= NOW())
      ORDER BY 
        CASE WHEN up.status = 'in_progress' THEN 1 ELSE 2 END,
        sr.next_review ASC NULLS LAST,
        l.position ASC
      LIMIT 1
    `, [userId]);

    const nextLesson = nextLessonResult.rows[0] || null;

    return Response.json({
      user,
      course,
      nextLesson
    });

  } catch (error) {
    console.error('Failed to load user state:', error);
    return Response.json({ error: 'Failed to load user state' }, { status: 500 });
  }
}