// ==============================================
// CLEAN API ROUTES - Database-First Backend
// ==============================================

// File: src/app/api/languages/available/route.js
import { query } from '../../../../../lib/database';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        l.code,
        l.name,
        l.native_name,
        COUNT(les.id) as lesson_count,
        '🌍' as flag
      FROM languages l
      LEFT JOIN courses c ON l.id = c.language_id
      LEFT JOIN skills s ON c.id = s.course_id  
      LEFT JOIN lessons les ON s.id = les.skill_id
      WHERE l.active = true
      GROUP BY l.id, l.code, l.name, l.native_name
      ORDER BY lesson_count DESC
    `);

    return Response.json(result.rows);
  } catch (error) {
    console.error('Failed to load languages:', error);
    return Response.json({ error: 'Failed to load languages' }, { status: 500 });
  }
}

// File: src/app/api/user/create/route.js
import { query } from '../../../../../lib/database';

export async function POST(request) {
  try {
    const { languageCode } = await request.json();

    // Create new user
    const userResult = await query(`
      INSERT INTO users (email, preferences, current_language)
      VALUES (
        'guest@example.com',
        '{"audio_enabled": true, "show_cultural_context": true}',
        (SELECT id FROM languages WHERE code = $1)
      )
      RETURNING id, preferences, current_language
    `, [languageCode]);

    const user = userResult.rows[0];

    // Get the course for this language
    const courseResult = await query(`
      SELECT 
        c.*,
        l.name as language_name,
        l.native_name,
        COUNT(DISTINCT s.id) as total_skills,
        COALESCE(completed_skills.count, 0) as completed_skills,
        COALESCE(completed_skills.count, 0)::float / NULLIF(COUNT(DISTINCT s.id), 0) * 100 as completion_percentage
      FROM courses c
      JOIN languages l ON c.language_id = l.id
      LEFT JOIN skills s ON c.id = s.course_id
      LEFT JOIN (
        SELECT s.course_id, COUNT(*) as count
        FROM skills s
        JOIN lessons les ON s.id = les.skill_id
        JOIN user_progress up ON les.id = up.lesson_id
        WHERE up.user_id = $1 AND up.status = 'completed'
        GROUP BY s.course_id
      ) completed_skills ON c.id = completed_skills.course_id
      WHERE l.code = $2
      GROUP BY c.id, l.name, l.native_name, completed_skills.count
    `, [user.id, languageCode]);

    const course = courseResult.rows[0];

    return Response.json({
      user,
      course
    });

  } catch (error) {
    console.error('Failed to create user:', error);
    return Response.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// File: src/app/api/user/course-state/route.js
import { query } from '../../../../../lib/database';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Bearer ', '');

    if (!userId) {
      return Response.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Get user info
    const userResult = await query(`
      SELECT u.*, l.code as language_code, l.name as language_name
      FROM users u
      LEFT JOIN languages l ON u.current_language = l.id
      WHERE u.id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Get course progress
    const courseResult = await query(`
      SELECT 
        c.*,
        COUNT(DISTINCT s.id) as total_skills,
        COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN s.id END) as completed_skills,
        COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN s.id END)::float / NULLIF(COUNT(DISTINCT s.id), 0) * 100 as completion_percentage
      FROM courses c
      LEFT JOIN skills s ON c.id = s.course_id
      LEFT JOIN lessons les ON s.id = les.skill_id
      LEFT JOIN user_progress up ON les.id = up.lesson_id AND up.user_id = $1
      WHERE c.language_id = $2
      GROUP BY c.id
    `, [userId, user.current_language]);

    const course = courseResult.rows[0];

    // Get next lesson from spaced repetition
    const nextLessonResult = await query(`
      SELECT 
        l.*,
        s.name as skill_name,
        sr.next_review
      FROM lessons l
      JOIN skills s ON l.skill_id = s.id
      LEFT JOIN spaced_repetition sr ON l.id = sr.content_id AND sr.user_id = $1
      JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
      WHERE up.status IN ('not_started', 'in_progress') 
         OR (sr.next_review IS NOT NULL AND sr.next_review <= NOW())
      ORDER BY 
        CASE WHEN up.status = 'in_progress' THEN 1 ELSE 2 END,
        sr.next_review ASC NULLS LAST,
        l.position ASC
      LIMIT 1
    `, [userId]);

    const nextLesson = nextLessonResult.rows[0] || null;

    return Response.json({
      user,
      course,
      nextLesson
    });

  } catch (error) {
    console.error('Failed to load user state:', error);
    return Response.json({ error: 'Failed to load user state' }, { status: 500 });
  }
}

// File: src/app/api/courses/[courseId]/skills/route.js
import { query } from '../../../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const { courseId } = await params;
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Bearer ', '');

    const result = await query(`
      SELECT 
        s.*,
        COUNT(l.id) as total_lessons,
        COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed_lessons,
        COUNT(CASE WHEN up.status = 'completed' THEN 1 END)::float / NULLIF(COUNT(l.id), 0) * 100 as progress_percentage,
        CASE 
          WHEN s.prerequisites IS NULL THEN true
          WHEN s.prerequisites = '[]'::jsonb THEN true
          ELSE s.prerequisites <@ (
            SELECT COALESCE(array_to_json(array_agg(DISTINCT completed_skills.skill_id)), '[]')::jsonb
            FROM (
              SELECT DISTINCT s2.id as skill_id
              FROM skills s2
              JOIN lessons l2 ON s2.id = l2.skill_id
              JOIN user_progress up2 ON l2.id = up2.lesson_id
              WHERE up2.user_id = $2 AND up2.status = 'completed'
            ) completed_skills
          )
        END as available,
        CASE 
          WHEN COUNT(CASE WHEN up.status = 'completed' THEN 1 END) = COUNT(l.id) THEN 'completed'
          WHEN COUNT(CASE WHEN up.status IN ('in_progress', 'completed') THEN 1 END) > 0 THEN 'in_progress'
          ELSE 'not_started'
        END as status,
        (
          SELECT l3.id 
          FROM lessons l3 
          LEFT JOIN user_progress up3 ON l3.id = up3.lesson_id AND up3.user_id = $2
          WHERE l3.skill_id = s.id 
            AND (up3.status IS NULL OR up3.status != 'completed')
          ORDER BY l3.position 
          LIMIT 1
        ) as next_lesson_id
      FROM skills s
      LEFT JOIN lessons l ON s.id = l.skill_id
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $2
      WHERE s.course_id = $1 AND s.is_active = true
      GROUP BY s.id, s.name, s.description, s.position, s.prerequisites, s.cefr_level
      ORDER BY s.position
    `, [courseId, userId]);

    return Response.json(result.rows);

  } catch (error) {
    console.error('Failed to load skills:', error);
    return Response.json({ error: 'Failed to load skills' }, { status: 500 });
  }
}

// File: src/app/api/lessons/next/route.js
import { query } from '../../../../../lib/database';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Bearer ', '');

    // Get next lesson based on spaced repetition algorithm
    const result = await query(`
      WITH next_lesson_candidates AS (
        -- Get lessons due for review
        SELECT 
          l.id,
          l.name,
          l.position,
          s.name as skill_name,
          sr.next_review,
          up.status,
          1 as priority -- High priority for spaced repetition
        FROM lessons l
        JOIN skills s ON l.skill_id = s.id
        JOIN spaced_repetition sr ON l.id = sr.content_id AND sr.user_id = $1
        LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
        WHERE sr.next_review <= NOW()
        
        UNION ALL
        
        -- Get next unstarted lesson
        SELECT 
          l.id,
          l.name,
          l.position,
          s.name as skill_name,
          NULL as next_review,
          up.status,
          2 as priority -- Lower priority for new content
        FROM lessons l
        JOIN skills s ON l.skill_id = s.id
        LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
        WHERE (up.status IS NULL OR up.status = 'not_started')
          AND (
            s.prerequisites IS NULL 
            OR s.prerequisites = '[]'::jsonb
            OR s.prerequisites <@ (
              SELECT COALESCE(array_to_json(array_agg(DISTINCT skill_id)), '[]')::jsonb
              FROM (
                SELECT DISTINCT s2.id as skill_id
                FROM skills s2
                JOIN lessons l2 ON s2.id = l2.skill_id
                JOIN user_progress up2 ON l2.id = up2.lesson_id
                WHERE up2.user_id = $1 AND up2.status = 'completed'
              ) completed_skills
            )
          )
      )
      SELECT * FROM next_lesson_candidates
      ORDER BY priority, next_review ASC NULLS LAST, position
      LIMIT 1
    `, [userId]);

    if (result.rows.length === 0) {
      return Response.json({ message: 'No lessons available' }, { status: 404 });
    }

    return Response.json(result.rows[0]);

  } catch (error) {
    console.error('Failed to get next lesson:', error);
    return Response.json({ error: 'Failed to get next lesson' }, { status: 500 });
  }
}

// File: src/app/api/lessons/[lessonId]/route.js
import { query } from '../../../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const { lessonId } = await params;
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Bearer ', '');

    // Get lesson with all content
    const lessonResult = await query(`
      SELECT 
        l.*,
        s.name as skill_name,
        s.cefr_level
      FROM lessons l
      JOIN skills s ON l.skill_id = s.id
      WHERE l.id = $1
    `, [lessonId]);

    if (lessonResult.rows.length === 0) {
      return Response.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const lesson = lessonResult.rows[0];

    // Get lesson content (exercises)
    const contentResult = await query(`
      SELECT 
        id,
        english_phrase,
        target_phrase,
        pronunciation_guide,
        cultural_context,
        difficulty_score,
        exercise_types
      FROM lesson_content
      WHERE lesson_id = $1
      ORDER BY difficulty_score, id
    `, [lessonId]);

    lesson.content = contentResult.rows;

    // Update user progress to 'in_progress'
    await query(`
      INSERT INTO user_progress (user_id, lesson_id, skill_id, status, last_accessed)
      VALUES ($1, $2, $3, 'in_progress', NOW())
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET 
        status = CASE WHEN user_progress.status = 'completed' THEN 'completed' ELSE 'in_progress' END,
        last_accessed = NOW()
    `, [userId, lessonId, lesson.skill_id]);

    return Response.json(lesson);

  } catch (error) {
    console.error('Failed to load lesson:', error);
    return Response.json({ error: 'Failed to load lesson' }, { status: 500 });
  }
}

// File: src/app/api/exercises/complete/route.js
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

// File: src/app/api/practice/due-items/route.js
import { query } from '../../../../../lib/database';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userId = authHeader?.replace('Bearer ', '');

    const result = await query(`
      SELECT 
        s.name as skill_name,
        COUNT(*) as due_count,
        MAX(sr.last_reviewed) as last_reviewed,
        CASE 
          WHEN COUNT(*) FILTER (WHERE sr.next_review < NOW() - INTERVAL '1 day') > 0 THEN 'overdue'
          WHEN COUNT(*) FILTER (WHERE sr.next_review <= NOW()) > 0 THEN 'due'
          ELSE 'upcoming'
        END as urgency,
        AVG(sr.success_count::float / NULLIF(sr.total_reviews, 0)) * 100 as mastery_percentage
      FROM spaced_repetition sr
      JOIN lesson_content lc ON sr.content_id = lc.id
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      WHERE sr.user_id = $1 
        AND sr.next_review <= NOW() + INTERVAL '1 day'
      GROUP BY s.id, s.name
      ORDER BY 
        CASE 
          WHEN COUNT(*) FILTER (WHERE sr.next_review < NOW() - INTERVAL '1 day') > 0 THEN 1
          WHEN COUNT(*) FILTER (WHERE sr.next_review <= NOW()) > 0 THEN 2
          ELSE 3
        END,
        due_count DESC
    `, [userId]);

    return Response.json(result.rows);

  } catch (error) {
    console.error('Failed to load practice queue:', error);
    return Response.json({ error: 'Failed to load practice queue' }, { status: 500 });
  }
}