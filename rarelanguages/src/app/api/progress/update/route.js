/**
 * POST /api/progress/update - Track User Exercise Performance
 * Updates spaced repetition algorithm and lesson progress
 */

import { progressQueries } from '../../../../../lib/database/queries';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, contentId, lessonId, exerciseType, responseQuality, timeSpent, correct } = body;

    // Validate required fields
    if (!userId || !contentId || !lessonId || responseQuality === undefined || correct === undefined) {
      return Response.json({ 
        error: 'Missing required fields: userId, contentId, lessonId, responseQuality, correct' 
      }, { status: 400 });
    }

    // Validate responseQuality range
    if (responseQuality < 1 || responseQuality > 5) {
      return Response.json({ 
        error: 'responseQuality must be between 1 and 5' 
      }, { status: 400 });
    }

    const progressData = {
      contentId,
      lessonId,
      exerciseType: exerciseType || 'flashcard',
      responseQuality,
      timeSpent: timeSpent || 0,
      correct
    };

    const result = await progressQueries.updateUserProgress(userId, progressData);

    return Response.json(result);

  } catch (error) {
    console.error('Error in /api/progress/update:', error);
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}