import { query } from '../../../../../lib/database';

export async function POST(request) {
  try {
    const { languageCode } = await request.json();

    // Create new user with unique email using timestamp
    const userResult = await query(`
      INSERT INTO users (email, preferences, current_language)
      VALUES (
        $1,
        '{"audio_enabled": true, "show_cultural_context": true}',
        (SELECT id FROM languages WHERE code = $2)
      )
      RETURNING id, preferences, current_language
    `, [`guest${Date.now()}@example.com`, languageCode]);

    const user = userResult.rows[0];

    // Get the course for this language (simplified since skills link directly to language)
    const courseResult = await query(`
      SELECT 
        c.*,
        l.name as language_name,
        l.native_name,
        COUNT(DISTINCT s.id) as total_skills,
        0 as completed_skills,
        0 as completion_percentage
      FROM courses c
      JOIN languages l ON c.language_id = l.id
      LEFT JOIN skills s ON l.id = s.language_id
      WHERE l.code = $1
      GROUP BY c.id, l.name, l.native_name
      LIMIT 1
    `, [languageCode]);

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