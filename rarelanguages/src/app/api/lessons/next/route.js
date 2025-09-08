/**
 * GET /api/lessons/next - Get Next Lesson
 * Powers the "Continue Your Lesson" button using spaced repetition algorithm
 */

import { lessonQueries } from '../../../../../lib/database/queries';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    const nextLessonData = await lessonQueries.getNextLesson(userId);

    if (nextLessonData.type === 'review') {
      return Response.json({
        lesson: nextLessonData.lesson,
        is_review: true,
        next_action: 'review'
      });
    }

    if (nextLessonData.type === 'completed') {
      return Response.json({
        lesson: null,
        is_review: false,
        next_action: 'completed',
        message: nextLessonData.message
      });
    }

    return Response.json({
      lesson: nextLessonData.lesson,
      is_review: false,
      next_action: 'new_lesson'
    });

  } catch (error) {
    console.error('Error in /api/lessons/next:', error);
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}