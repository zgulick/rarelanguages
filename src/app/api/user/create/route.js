import { query } from '../../../../../lib/database';

export async function POST(request) {
  try {
    const { languageCode } = await request.json();

    // Create new user
    const userResult = await query(`
      INSERT INTO users (email, preferences, current_language)
      VALUES (
        'guest@example.com',
        '{"audio_enabled": true, "show_cultural_context": true}',
        (SELECT id FROM languages WHERE code = $1)
      )
      RETURNING id, preferences, current_language
    `, [languageCode]);

    const user = userResult.rows[0];

    // Get the course for this language
    const courseResult = await query(`
      SELECT 
        c.*,
        l.name as language_name,
        l.native_name,
        COUNT(DISTINCT s.id) as total_skills,
        COALESCE(completed_skills.count, 0) as completed_skills,
        COALESCE(completed_skills.count, 0)::float / NULLIF(COUNT(DISTINCT s.id), 0) * 100 as completion_percentage
      FROM courses c
      JOIN languages l ON c.language_id = l.id
      LEFT JOIN skills s ON c.id = s.course_id
      LEFT JOIN (
        SELECT s.course_id, COUNT(*) as count
        FROM skills s
        JOIN lessons les ON s.id = les.skill_id
        JOIN user_progress up ON les.id = up.lesson_id
        WHERE up.user_id = $1 AND up.status = 'completed'
        GROUP BY s.course_id
      ) completed_skills ON c.id = completed_skills.course_id
      WHERE l.code = $2
      GROUP BY c.id, l.name, l.native_name, completed_skills.count
    `, [user.id, languageCode]);

    const course = courseResult.rows[0];

    return Response.json({
      user,
      course
    });

  } catch (error) {
    console.error('Failed to create user:', error);
    return Response.json({ error: 'Failed to create user' }, { status: 500 });
  }
}