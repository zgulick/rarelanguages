/**
 * GET /api/review/queue - Get Review Items from Spaced Repetition Algorithm
 * Returns prioritized items due for review
 */

import { getReviewQueue } from '../../../../../lib/spacedRepetition';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit')) || 20;

    if (!userId) {
      return Response.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    if (limit > 100) {
      return Response.json({ error: 'Limit cannot exceed 100' }, { status: 400 });
    }

    const reviewItems = await getReviewQueue(userId, limit);

    // Transform the data to match API specification
    const formattedItems = reviewItems.map(item => ({
      contentId: item.content_id,
      english_phrase: item.english_phrase,
      target_phrase: item.target_phrase,
      pronunciation_guide: item.pronunciation_guide,
      cultural_context: item.cultural_context,
      lastReviewed: item.last_reviewed,
      daysOverdue: item.next_review ? Math.max(0, Math.ceil((Date.now() - new Date(item.next_review)) / (1000 * 60 * 60 * 24))) : 0,
      difficulty: item.difficulty_score || 3,
      exerciseTypes: item.exercise_types || ['flashcard', 'audio'],
      recallProbability: item.recall_probability,
      recommendation: item.recommendation
    }));

    // Calculate estimated time (assume 30 seconds per item average)
    const estimatedMinutes = Math.ceil((formattedItems.length * 30) / 60);

    return Response.json({
      reviewItems: formattedItems,
      totalDue: formattedItems.length,
      estimatedMinutes
    });

  } catch (error) {
    console.error('Error in /api/review/queue:', error);
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}