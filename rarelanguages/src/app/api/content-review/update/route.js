import { query } from '../../../../../lib/database';

export async function POST(request) {
  try {
    const { contentId, updates } = await request.json();

    if (!contentId || !updates) {
      return Response.json(
        { error: 'Content ID and updates are required' },
        { status: 400 }
      );
    }

    // Validate updates object
    const allowedFields = ['word_type', 'grammar_category', 'english_phrase', 'target_phrase'];
    const validUpdates = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined && value !== '') {
        validUpdates[key] = value;
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      return Response.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    // Build dynamic UPDATE query
    const updateFields = Object.keys(validUpdates);
    const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = Object.values(validUpdates);
    values.push(contentId); // Add contentId as the last parameter

    const updateQuery = `
      UPDATE lesson_content
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      return Response.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Log the manual correction for audit purposes
    console.log(`Manual correction applied to content ${contentId}:`, {
      updates: validUpdates,
      timestamp: new Date().toISOString()
    });

    return Response.json({
      success: true,
      updated: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating content:', error);
    return Response.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}