import { query } from '../../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const { id: lessonId } = await params;

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
      return Response.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
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

    // NOTE: this handler used to INSERT into user_progress. A GET must not
    // write — any prefetch, crawler, or CDN revalidation would mutate
    // progress. There is no authentication, so the "user id" it keyed on was
    // an unverified header value anyway.
    return Response.json({ success: true, data: lesson });

  } catch (error) {
    console.error('Failed to load lesson:', error);
    return Response.json(
      { success: false, error: 'Failed to load lesson' },
      { status: 500 }
    );
  }
}