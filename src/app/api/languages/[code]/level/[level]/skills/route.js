import { NextResponse } from 'next/server';
import { query } from '../../../../../../../../lib/database';

export async function GET(request, { params }) {
  const { code, level } = await params;

  try {
    // Skills link to courses through the course_skills join table.
    // There is no skills.course_id column.
    const skillsResult = await query(
      `
      SELECT s.*,
             c.name AS course_name,
             l.name AS language_name,
             (SELECT COUNT(*)::int
                FROM processed_lessons pl
               WHERE pl.skill_id = s.id) AS processed_lesson_count
      FROM skills s
      JOIN course_skills cs ON cs.skill_id = s.id
      JOIN courses c ON c.id = cs.course_id
      JOIN languages l ON l.id = c.language_id
      WHERE l.code = $1 AND c.level = $2
      ORDER BY s.position ASC
      `,
      [code, parseInt(level, 10)]
    );

    const skills = skillsResult.rows;

    // Resolve the display name even when this language has no skills yet,
    // so the page never renders a heading with a blank language.
    let languageName = skills[0]?.language_name ?? null;
    if (!languageName) {
      const languageResult = await query(
        `SELECT name FROM languages WHERE code = $1`,
        [code]
      );
      languageName = languageResult.rows[0]?.name ?? null;
    }

    // One query for every lesson across all skills, rather than N+1.
    let lessonsBySkill = new Map();
    if (skills.length > 0) {
      const lessonsResult = await query(
        `
        SELECT id, skill_id, name, estimated_minutes, difficulty_level, position
        FROM lessons
        WHERE skill_id = ANY($1::uuid[])
        ORDER BY position ASC
        `,
        [skills.map((s) => s.id)]
      );

      lessonsBySkill = lessonsResult.rows.reduce((acc, lesson) => {
        const list = acc.get(lesson.skill_id) ?? [];
        list.push(lesson);
        acc.set(lesson.skill_id, list);
        return acc;
      }, new Map());
    }

    const skillsWithLessons = skills.map((skill) => {
      const lessons = lessonsBySkill.get(skill.id) ?? [];
      const totalMinutes = lessons.reduce(
        (acc, l) => acc + (l.estimated_minutes || 0),
        0
      );

      return {
        ...skill,
        lessons,
        totalLessons: lessons.length,
        estimatedHours: Math.ceil(totalMinutes / 60)
      };
    });

    return NextResponse.json({
      success: true,
      languageName,
      skills: skillsWithLessons
    });
  } catch (error) {
    console.error('Failed to fetch skills:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}
