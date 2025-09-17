import { query } from '../../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const { id: lessonId } = await params;
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Bearer ', '');

    // Get lesson with all content
    const lessonResult = await query(`
      SELECT 
        l.*,
        s.name as skill_name,
        s.cefr_level
      FROM lessons l
      JOIN skills s ON l.skill_id = s.id
      WHERE l.id = $1
    `, [lessonId]);

    if (lessonResult.rows.length === 0) {
      return Response.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const lesson = lessonResult.rows[0];

    // Get lesson content (exercises)
    const contentResult = await query(`
      SELECT 
        id,
        english_phrase,
        target_phrase,
        pronunciation_guide,
        cultural_context,
        difficulty_score,
        exercise_types
      FROM lesson_content
      WHERE lesson_id = $1
      ORDER BY difficulty_score, id
    `, [lessonId]);

    lesson.content = contentResult.rows;

    // Update user progress to 'in_progress'
    if (userId) {
      await query(`
        INSERT INTO user_progress (user_id, lesson_id, skill_id, status, last_accessed)
        VALUES ($1, $2, $3, 'in_progress', NOW())
        ON CONFLICT (user_id, lesson_id)
        DO UPDATE SET 
          status = CASE WHEN user_progress.status = 'completed' THEN 'completed' ELSE 'in_progress' END,
          last_accessed = NOW()
      `, [userId, lessonId, lesson.skill_id]);
    }

    return Response.json(lesson);

  } catch (error) {
    console.error('Failed to load lesson:', error);
    return Response.json({ error: 'Failed to load lesson' }, { status: 500 });
  }
}