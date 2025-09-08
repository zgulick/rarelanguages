/**
 * GET /api/practice/[topic] - Get Practice Content by Topic
 * Returns content organized by completed topics for targeted practice
 */

import { progressQueries } from '../../../../../lib/database/queries';

export async function GET(request, { params }) {
  try {
    const { topic } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    if (!topic) {
      return Response.json({ error: 'Topic parameter is required' }, { status: 400 });
    }

    const practiceData = await progressQueries.getPracticeContent(userId, decodeURIComponent(topic));

    if (!practiceData.topic || practiceData.content.length === 0) {
      return Response.json({
        error: 'No practice content available for this topic. Complete some lessons first!'
      }, { status: 404 });
    }

    return Response.json(practiceData);

  } catch (error) {
    console.error(`Error in /api/practice/${params?.topic}:`, error);
    
    if (error.message === 'Topic not found') {
      return Response.json(
        { error: 'Topic not found' }, 
        { status: 404 }
      );
    }

    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}