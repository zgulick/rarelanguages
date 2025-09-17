import { query } from '../../../../../lib/database';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Bearer ', '');
    
    const { lesson_id, exercises, completion_time, accuracy } = await request.json();

    // Update lesson progress
    await query(`
      UPDATE user_progress 
      SET 
        status = 'completed',
        completion_date = NOW(),
        success_rate = $1,
        total_attempts = total_attempts + 1,
        time_spent_minutes = time_spent_minutes + $2
      WHERE user_id = $3 AND lesson_id = $4
    `, [accuracy, Math.round(completion_time / 60000), userId, lesson_id]);

    // Update spaced repetition for each exercise
    for (const exercise of exercises) {
      const quality = exercise.is_correct ? 5 : 2; // Simplified quality rating
      
      await query(`
        INSERT INTO spaced_repetition (user_id, content_id, current_interval, ease_factor, repetitions, last_reviewed, next_review, last_response_quality, total_reviews, success_count)
        VALUES ($1, $2, 1, 2.5, 1, NOW(), NOW() + INTERVAL '1 day', $3, 1, $4)
        ON CONFLICT (user_id, content_id)
        DO UPDATE SET
          repetitions = spaced_repetition.repetitions + 1,
          last_reviewed = NOW(),
          last_response_quality = $3,
          total_reviews = spaced_repetition.total_reviews + 1,
          success_count = spaced_repetition.success_count + $4,
          current_interval = CASE 
            WHEN $3 >= 3 THEN LEAST(spaced_repetition.current_interval * spaced_repetition.ease_factor, 365)
            ELSE GREATEST(spaced_repetition.current_interval * 0.6, 1)
          END,
          ease_factor = CASE
            WHEN $3 >= 3 THEN LEAST(spaced_repetition.ease_factor + 0.1, 3.0)
            ELSE GREATEST(spaced_repetition.ease_factor - 0.2, 1.3)
          END,
          next_review = NOW() + (
            CASE 
              WHEN $3 >= 3 THEN LEAST(spaced_repetition.current_interval * spaced_repetition.ease_factor, 365)
              ELSE GREATEST(spaced_repetition.current_interval * 0.6, 1)
            END || ' days'
          )::INTERVAL
      `, [userId, exercise.exercise_id, quality, exercise.is_correct ? 1 : 0]);
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Failed to complete exercise:', error);
    return Response.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}