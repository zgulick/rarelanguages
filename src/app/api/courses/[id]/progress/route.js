import { query } from '../../../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const { id: courseId } = await params;
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Bearer ', '');

    // Get updated course progress
    const result = await query(`
      SELECT 
        c.*,
        COUNT(DISTINCT s.id) as total_skills,
        COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN s.id END) as completed_skills,
        COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN s.id END)::float / NULLIF(COUNT(DISTINCT s.id), 0) * 100 as completion_percentage
      FROM courses c
      LEFT JOIN skills s ON c.id = s.course_id
      LEFT JOIN lessons les ON s.id = les.skill_id
      LEFT JOIN user_progress up ON les.id = up.lesson_id AND up.user_id = $1
      WHERE c.id = $2
      GROUP BY c.id
    `, [userId, courseId]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'Course not found' }, { status: 404 });
    }

    return Response.json(result.rows[0]);

  } catch (error) {
    console.error('Failed to load course progress:', error);
    return Response.json({ error: 'Failed to load course progress' }, { status: 500 });
  }
}