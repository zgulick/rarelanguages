import { NextResponse } from 'next/server';
const { query } = require('../../../../../lib/database');

/**
 * Phase Progress API
 * POST /api/lessons/phase-progress
 * Records learner progress through lesson phases
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            userId,
            lessonId,
            courseId,
            phaseIndex,
            phaseType,
            phaseData,
            timestamp
        } = body;

        // Validate required fields (allow anonymous users with fallback userId)
        const effectiveUserId = userId || 'anonymous-user';
        
        if (!lessonId || phaseIndex === undefined || !phaseType) {
            return NextResponse.json(
                { 
                    error: 'Missing required fields: lessonId, phaseIndex, phaseType',
                    success: false 
                },
                { status: 400 }
            );
        }

        // Insert phase progress record
        const result = await query(`
            INSERT INTO lesson_phase_progress (
                user_id, 
                lesson_id, 
                course_id,
                phase_index, 
                phase_type, 
                phase_data, 
                completed_at
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id, lesson_id, phase_index) 
            DO UPDATE SET
                phase_data = $6,
                completed_at = $7,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [
            effectiveUserId,
            lessonId,
            courseId,
            phaseIndex,
            phaseType,
            JSON.stringify(phaseData),
            timestamp || new Date().toISOString()
        ]);

        return NextResponse.json({
            success: true,
            message: 'Phase progress recorded successfully',
            progress: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Phase progress recording failed:', error);
        
        return NextResponse.json(
            { 
                error: 'Failed to record phase progress',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/lessons/phase-progress?userId=X&lessonId=Y
 * Retrieves phase progress for a specific user and lesson
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const lessonId = searchParams.get('lessonId');

        if (!userId || !lessonId) {
            return NextResponse.json(
                { 
                    error: 'Missing required parameters: userId, lessonId',
                    success: false 
                },
                { status: 400 }
            );
        }

        const result = await query(`
            SELECT *
            FROM lesson_phase_progress
            WHERE user_id = $1 AND lesson_id = $2
            ORDER BY phase_index ASC
        `, [userId, lessonId]);

        return NextResponse.json({
            success: true,
            progress: result.rows
        });

    } catch (error) {
        console.error('❌ Phase progress retrieval failed:', error);
        
        return NextResponse.json(
            { 
                error: 'Failed to retrieve phase progress',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}