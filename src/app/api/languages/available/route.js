import { query } from '../../../../../lib/database';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        l.code,
        l.name,
        l.native_name,
        COUNT(les.id) as lesson_count,
        '🌍' as flag
      FROM languages l
      LEFT JOIN courses c ON l.id = c.language_id
      LEFT JOIN skills s ON c.id = s.course_id  
      LEFT JOIN lessons les ON s.id = les.skill_id
      WHERE l.active = true
      GROUP BY l.id, l.code, l.name, l.native_name
      ORDER BY lesson_count DESC
    `);

    return Response.json(result.rows);
  } catch (error) {
    console.error('Failed to load languages:', error);
    return Response.json({ error: 'Failed to load languages' }, { status: 500 });
  }
}