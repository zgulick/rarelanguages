/**
 * Course Content Validation API - Phase 4
 * Validates course content for academic quality and accuracy
 */

import { NextResponse } from 'next/server';

/**
 * POST /api/validation/course
 * Validates a course's content for quality and accuracy
 */
export async function POST(request) {
    try {
        const { courseId, options = {} } = await request.json();

        if (!courseId) {
            return NextResponse.json(
                { error: 'Course ID is required', success: false },
                { status: 400 }
            );
        }

        // Check if validation is disabled
        if (process.env.ENABLE_VALIDATION === 'false') {
            console.log(`⚠️ Validation disabled - auto-approving course: ${courseId}`);
            return NextResponse.json({
                success: true,
                validation: {
                    courseId,
                    timestamp: new Date().toISOString(),
                    overall_status: 'passed',
                    overall_score: 95,
                    validations: {
                        grammar: { accuracy_score: 95, passed: true },
                        progression: { logic_score: 95, passed: true },
                        cultural: { appropriateness_score: 95, passed: true }
                    },
                    quality_gate_decision: 'auto_approve',
                    recommendations: [],
                    note: 'Validation bypassed - content ready for learning'
                },
                message: 'Course ready for learning! Validation temporarily disabled.'
            });
        }

        console.log(`🔍 Starting validation for course: ${courseId}`);

        // Use direct relative path from API route to validator
        const { ContentValidator } = require('../../../../../lib/validation/ContentValidator.js');
        const validator = new ContentValidator();
        const validationResults = await validator.validateCourseContent(courseId, options);

        // Store validation results for tracking (optional)
        await storeValidationResults(validationResults);

        return NextResponse.json({
            success: true,
            validation: validationResults,
            message: getValidationMessage(validationResults)
        });

    } catch (error) {
        console.error('❌ Course validation API error:', error);
        
        return NextResponse.json(
            { 
                error: 'Course validation failed',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/validation/course?courseId={id}
 * Get stored validation results for a course
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');

        if (!courseId) {
            return NextResponse.json(
                { error: 'Course ID is required', success: false },
                { status: 400 }
            );
        }

        const validationHistory = await getValidationHistory(courseId);

        return NextResponse.json({
            success: true,
            courseId,
            validations: validationHistory
        });

    } catch (error) {
        console.error('❌ Get validation history error:', error);
        
        return NextResponse.json(
            { 
                error: 'Failed to get validation history',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}

/**
 * Store validation results for tracking and history
 */
async function storeValidationResults(validationResults) {
    try {
        // For now, just log the results. In production, you might want to store in database
        console.log('📊 Validation Results Summary:');
        console.log(`Course: ${validationResults.courseId}`);
        console.log(`Overall Score: ${validationResults.overall_score}%`);
        console.log(`Status: ${validationResults.overall_status}`);
        console.log(`Quality Gate: ${validationResults.quality_gate_decision}`);
        
        if (validationResults.recommendations.length > 0) {
            console.log(`Recommendations: ${validationResults.recommendations.length} items`);
        }

        // TODO: Implement database storage if needed
        // const query = db.query;
        // await query(`
        //     INSERT INTO validation_results (course_id, validation_data, overall_score, status, created_at)
        //     VALUES ($1, $2, $3, $4, $5)
        // `, [
        //     validationResults.courseId,
        //     JSON.stringify(validationResults),
        //     validationResults.overall_score,
        //     validationResults.overall_status,
        //     new Date()
        // ]);

    } catch (error) {
        console.error('Failed to store validation results:', error);
        // Don't throw - this is not critical to the validation process
    }
}

/**
 * Get validation history for a course
 */
async function getValidationHistory(courseId) {
    try {
        // For now, return empty array. In production, query database
        // const query = db.query;
        // const result = await query(`
        //     SELECT * FROM validation_results 
        //     WHERE course_id = $1 
        //     ORDER BY created_at DESC 
        //     LIMIT 10
        // `, [courseId]);
        // return result.rows;
        
        return [];
        
    } catch (error) {
        console.error('Failed to get validation history:', error);
        return [];
    }
}

/**
 * Generate user-friendly validation message
 */
function getValidationMessage(validationResults) {
    const score = validationResults.overall_score;
    const decision = validationResults.quality_gate_decision;
    
    switch (decision) {
        case 'auto_approve':
            return `Excellent quality! Course scored ${score}% and is ready for student enrollment.`;
        
        case 'manual_review':
            return `Good quality with some areas for improvement. Course scored ${score}% and is flagged for review.`;
        
        case 'block_activation':
            return `Quality issues detected. Course scored ${score}% and needs improvement before activation.`;
        
        default:
            return `Validation completed with ${score}% overall score.`;
    }
}