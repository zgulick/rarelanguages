import { query } from '../../../../../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const { code: languageCode, level } = await params;
    const levelNumber = parseInt(level);

    if (isNaN(levelNumber)) {
      throw new Error(`Invalid level: ${level}`);
    }

    // Get all skills for courses at this language and level
    const result = await query(`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.position as skill_position,
        cs.position as course_position,
        cs.estimated_hours,
        COUNT(l.id) as total_lessons,
        c.name as course_name,
        c.id as course_id
      FROM skills s
      JOIN course_skills cs ON s.id = cs.skill_id
      JOIN courses c ON cs.course_id = c.id
      JOIN languages lang ON c.language_id = lang.id
      LEFT JOIN lessons l ON s.id = l.skill_id
      WHERE lang.code = $1 AND c.level = $2 AND c.is_active = true AND s.is_active = true
      GROUP BY s.id, s.name, s.description, s.position, cs.position, cs.estimated_hours, c.name, c.id
      ORDER BY cs.position ASC
    `, [languageCode, levelNumber]);

    if (result.rows.length === 0) {
      throw new Error(`No skills found for ${languageCode} level ${levelNumber}`);
    }

    const skills = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      position: row.course_position, // Use course_skills position for ordering
      totalLessons: parseInt(row.total_lessons) || 0,
      estimatedHours: row.estimated_hours || 4,
      courseName: row.course_name,
      courseId: row.course_id
    }));

    return Response.json({
      success: true,
      skills,
      language: languageCode,
      level: levelNumber,
      total: skills.length
    });

  } catch (error) {
    console.error('Failed to load skills for level:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}