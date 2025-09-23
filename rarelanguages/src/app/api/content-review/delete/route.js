import { query } from '../../../../../lib/database';

export async function DELETE(request) {
  try {
    const { contentId } = await request.json();

    if (!contentId) {
      return Response.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // First, get the content details for logging
    const selectQuery = `
      SELECT
        lc.*,
        l.name as lesson_name,
        s.name as skill_name
      FROM lesson_content lc
      LEFT JOIN lessons l ON lc.lesson_id = l.id
      LEFT JOIN skills s ON l.skill_id = s.id
      WHERE lc.id = $1
    `;

    const selectResult = await query(selectQuery, [contentId]);

    if (selectResult.rows.length === 0) {
      return Response.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    const contentData = selectResult.rows[0];

    // Delete the content
    const deleteQuery = `DELETE FROM lesson_content WHERE id = $1`;
    await query(deleteQuery, [contentId]);

    // Log the deletion for audit purposes
    console.log(`Content manually deleted during review:`, {
      content_id: contentId,
      english_phrase: contentData.english_phrase,
      target_phrase: contentData.target_phrase,
      lesson_name: contentData.lesson_name,
      skill_name: contentData.skill_name,
      timestamp: new Date().toISOString(),
      reason: 'Manual deletion during content review'
    });

    return Response.json({
      success: true,
      deleted: {
        id: contentId,
        english_phrase: contentData.english_phrase
      }
    });

  } catch (error) {
    console.error('Error deleting content:', error);
    return Response.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}