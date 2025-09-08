/**
 * GET /api/lessons/[id] - Get Specific Lesson Content
 * Load complete lesson content for learning session
 */

import { lessonQueries } from '../../../../../lib/database/queries';

export async function GET(request, { params }) {
  try {
    const { id: lessonId } = params;

    if (!lessonId) {
      return Response.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    const lessonData = await lessonQueries.getLessonContent(lessonId);

    return Response.json(lessonData);

  } catch (error) {
    console.error(`Error in /api/lessons/${params?.id}:`, error);
    
    if (error.message === 'Lesson not found') {
      return Response.json(
        { error: 'Lesson not found' }, 
        { status: 404 }
      );
    }

    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}