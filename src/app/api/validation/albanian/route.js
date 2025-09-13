/**
 * Albanian-Specific Content Validation API - Phase 4
 * Specialized validation for Gheg dialect and Kosovo cultural context
 */

import { NextResponse } from 'next/server';

/**
 * POST /api/validation/albanian
 * Validates Albanian course content for Gheg dialect accuracy and Kosovo cultural appropriateness
 */
export async function POST(request) {
    try {
        const { courseId } = await request.json();

        if (!courseId) {
            return NextResponse.json(
                { error: 'Course ID is required', success: false },
                { status: 400 }
            );
        }

        console.log(`🇦🇱 Starting Albanian-specific validation for course: ${courseId}`);

        // Use direct relative path from API route to validator  
        const { AlbanianValidator } = require('../../../../../lib/validation/AlbanianValidator.js');
        const albanianValidator = new AlbanianValidator();
        const validationResults = await albanianValidator.validateAlbanianCourse(courseId);

        // Store Albanian-specific validation results
        await storeAlbanianValidationResults(validationResults);

        return NextResponse.json({
            success: true,
            validation: validationResults,
            message: getAlbanianValidationMessage(validationResults)
        });

    } catch (error) {
        console.error('❌ Albanian validation API error:', error);
        
        return NextResponse.json(
            { 
                error: 'Albanian validation failed',
                details: error.message,
                success: false 
            },
            { status: 500 }
        );
    }
}

/**
 * Store Albanian-specific validation results
 */
async function storeAlbanianValidationResults(validationResults) {
    try {
        console.log('🇦🇱 Albanian Validation Results Summary:');
        console.log(`Course: ${validationResults.courseId}`);
        
        if (validationResults.validations.dialect) {
            console.log(`Gheg Dialect Score: ${validationResults.validations.dialect.dialect_score}%`);
        }
        
        if (validationResults.validations.cultural) {
            console.log(`Kosovo Cultural Score: ${validationResults.validations.cultural.cultural_score}%`);
        }
        
        if (validationResults.validations.family) {
            console.log(`Family Context Score: ${validationResults.validations.family.family_score}%`);
        }
        
        if (validationResults.recommendations.length > 0) {
            console.log(`Albanian-specific Recommendations: ${validationResults.recommendations.length} items`);
        }

        // TODO: Store in database if needed for tracking
        
    } catch (error) {
        console.error('Failed to store Albanian validation results:', error);
    }
}

/**
 * Generate Albanian-specific validation message
 */
function getAlbanianValidationMessage(validationResults) {
    const messages = [];
    
    if (validationResults.validations.dialect) {
        const dialectScore = validationResults.validations.dialect.dialect_score;
        if (dialectScore >= 85) {
            messages.push(`✅ Gheg dialect authenticity is excellent (${dialectScore}%)`);
        } else if (dialectScore >= 70) {
            messages.push(`⚠️ Gheg dialect needs some improvement (${dialectScore}%)`);
        } else {
            messages.push(`❌ Gheg dialect requires significant updates (${dialectScore}%)`);
        }
    }
    
    if (validationResults.validations.cultural) {
        const culturalScore = validationResults.validations.cultural.cultural_score;
        if (culturalScore >= 80) {
            messages.push(`✅ Kosovo cultural context is appropriate (${culturalScore}%)`);
        } else {
            messages.push(`⚠️ Kosovo cultural context could be improved (${culturalScore}%)`);
        }
    }
    
    if (validationResults.validations.family && validationResults.validations.family.family_score < 100) {
        const familyScore = validationResults.validations.family.family_score;
        messages.push(`Family integration content score: ${familyScore}%`);
    }
    
    return messages.length > 0 
        ? messages.join('. ')
        : 'Albanian-specific validation completed.';
}