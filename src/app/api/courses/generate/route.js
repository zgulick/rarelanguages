import { NextResponse } from 'next/server';
const CourseGeneration = require('../../../../../lib/models/CourseGeneration');

/**
 * Automated Course Generation API
 * POST /api/courses/generate
 * 
 * The main "Build My Course" endpoint that generates complete curriculum
 */
export async function POST(request) {
    try {
        const { languageCode, languageName, nativeName, level = 1 } = await request.json();

        // Validate required parameters
        if (!languageCode || !languageName || !nativeName) {
            return NextResponse.json(
                { 
                    error: 'Missing required parameters: languageCode, languageName, nativeName',
                    success: false 
                },
                { status: 400 }
            );
        }

        // Validate level
        if (level < 1 || level > 4) {
            return NextResponse.json(
                { 
                    error: 'Course level must be between 1 and 4',
                    success: false 
                },
                { status: 400 }
            );
        }

        console.log(`🎯 Course generation request: ${languageName} Level ${level}`);

        const generator = new CourseGeneration();
        
        // Generate the complete course
        const result = await generator.generateFullCourse(
            languageCode,
            languageName, 
            nativeName,
            level
        );

        return NextResponse.json(result);

    } catch (error) {
        console.error('❌ Course generation failed:', error);
        
        return NextResponse.json(
            { 
                error: 'Course generation failed',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}

/**
 * Get course generation status
 * GET /api/courses/generate?courseId=uuid
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');

        if (!courseId) {
            return NextResponse.json(
                { error: 'Missing courseId parameter', success: false },
                { status: 400 }
            );
        }

        const generator = new CourseGeneration();
        const status = await generator.getGenerationStatus(courseId);

        return NextResponse.json(status);

    } catch (error) {
        console.error('❌ Failed to get generation status:', error);
        
        return NextResponse.json(
            { 
                error: 'Failed to get generation status',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}