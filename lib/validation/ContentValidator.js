/**
 * Content Quality Validation System - Phase 4
 * Language-agnostic course content validation for academic rigor
 */

const CourseGeneration = require('../models/CourseGeneration');
const { query, db } = require('../database');

class ContentValidator {
  constructor() {
    this.courseGeneration = new CourseGeneration();
    this.validationStandards = {
      grammar_accuracy: process.env.VALIDATION_STANDARDS_STRICT === 'true' ? 85 : 60,
      cultural_appropriateness: process.env.VALIDATION_STANDARDS_STRICT === 'true' ? 80 : 50,
      progression_logic: process.env.VALIDATION_STANDARDS_STRICT === 'true' ? 90 : 60,
      overall_passing: process.env.VALIDATION_STANDARDS_STRICT === 'true' ? 85 : 60
    };
  }

  /**
   * Main validation orchestrator - validates complete course content
   */
  async validateCourseContent(courseId, options = {}) {
    console.log(`🔍 Starting content validation for course ${courseId}`);
    
    const validationResults = {
      courseId,
      timestamp: new Date().toISOString(),
      overall_status: 'pending',
      overall_score: 0,
      validations: {},
      issues_found: [],
      recommendations: [],
      quality_gate_decision: null
    };

    try {
      // Get course content for validation
      const courseContent = await this.getCourseContent(courseId);
      
      if (!courseContent.lessons || courseContent.lessons.length === 0) {
        throw new Error('No course content found for validation');
      }

      // 1. Grammar Accuracy Validation
      console.log('📝 Validating grammar accuracy...');
      validationResults.validations.grammar = await this.validateGrammarAccuracy(courseContent);
      
      // 2. Academic Progression Validation  
      console.log('📈 Validating academic progression...');
      validationResults.validations.progression = await this.validateAcademicProgression(courseContent);
      
      // 3. Cultural Context Appropriateness
      console.log('🌍 Validating cultural context...');
      validationResults.validations.cultural = await this.validateCulturalContext(courseContent);

      // Calculate overall score and make quality gate decision
      validationResults.overall_score = this.calculateOverallScore(validationResults.validations);
      validationResults.overall_status = this.determineOverallStatus(validationResults.overall_score);
      validationResults.quality_gate_decision = this.makeQualityGateDecision(validationResults.overall_score);
      
      // Generate actionable recommendations
      validationResults.recommendations = this.generateRecommendations(validationResults);
      
      console.log(`✅ Validation complete - Overall Score: ${validationResults.overall_score}%`);
      console.log(`🚦 Quality Gate Decision: ${validationResults.quality_gate_decision}`);
      
      return validationResults;
      
    } catch (error) {
      console.error('❌ Content validation failed:', error);
      validationResults.overall_status = 'error';
      validationResults.error = error.message;
      return validationResults;
    }
  }

  /**
   * Validate grammar explanations and examples for linguistic accuracy
   */
  async validateGrammarAccuracy(courseContent) {
    const { course, lessons } = courseContent;
    
    // Sample representative lessons for validation (to manage AI costs)
    const lessonsToValidate = this.sampleLessonsForValidation(lessons, 5);
    
    const validationPrompt = `You are a professional linguist validating language course content for accuracy.

COURSE CONTEXT:
- Language: ${course.language_name}
- Level: ${course.cefr_level}
- Course Name: ${course.name}

VALIDATION CRITERIA:
1. Grammar explanations are linguistically accurate and appropriate for the level
2. Examples properly demonstrate the grammar concepts being taught
3. Common mistakes section identifies real issues learners face
4. Progression within lessons builds logically from simple to complex
5. Terminology is consistent and pedagogically appropriate

LESSONS TO VALIDATE:
${JSON.stringify(lessonsToValidate.map(lesson => ({
  name: lesson.name,
  description: lesson.description,
  grammar_concepts: lesson.content?.grammar_explanation || 'No grammar content found',
  examples: lesson.content?.examples || 'No examples found',
  exercises_count: lesson.content?.exercises?.length || 0
})), null, 2)}

For each lesson, provide:
- Grammar accuracy score (0-100)
- Specific linguistic issues found (if any)
- Pedagogical appropriateness assessment
- Suggestions for improvement

Return a JSON response with overall assessment and lesson-by-lesson breakdown.

IMPORTANT: Focus on linguistic accuracy and pedagogical soundness, not cultural specifics.`;

    try {
      const response = await this.courseGeneration.openaiClient.makeRequest([
        { role: 'system', content: 'You are a professional linguist specializing in language education and curriculum validation.' },
        { role: 'user', content: validationPrompt }
      ], 'grammar-validation', {
        max_tokens: 8000,
        temperature: 0.3
      });

      // Ensure complete response using continuation system
      const fullResponseContent = await this.courseGeneration.ensureCompleteResponse(
        response.content,
        response.usage,
        validationPrompt,
        'grammar-validation'
      );

      const validation = this.parseValidationResponse(fullResponseContent);
      
      return {
        accuracy_score: validation.overall_accuracy || 0,
        lesson_scores: validation.lesson_breakdown || [],
        issues_found: validation.issues || [],
        improvements_suggested: validation.improvements || [],
        passed: (validation.overall_accuracy || 0) >= this.validationStandards.grammar_accuracy
      };
      
    } catch (error) {
      console.error('Grammar validation failed:', error);
      return {
        accuracy_score: 0,
        lesson_scores: [],
        issues_found: [`Grammar validation failed: ${error.message}`],
        improvements_suggested: ['Manual review required due to validation system error'],
        passed: false
      };
    }
  }

  /**
   * Validate that course progression builds concepts logically
   */
  async validateAcademicProgression(courseContent) {
    const { course, lessons } = courseContent;
    
    const validationPrompt = `You are a curriculum design expert validating academic language course progression.

COURSE STRUCTURE:
- Language: ${course.language_name}
- Level: ${course.cefr_level}
- Total Lessons: ${lessons.length}

PROGRESSION VALIDATION CRITERIA:
1. Each lesson builds appropriately on concepts from previous lessons
2. Difficulty increases gradually and logically
3. Grammar concepts are introduced in pedagogically sound order
4. Prerequisites are clear and necessary
5. No significant gaps in concept development
6. Lesson sequence makes sense for ${course.cefr_level} level learners

LESSON SEQUENCE TO VALIDATE:
${JSON.stringify(lessons.map((lesson, index) => ({
  position: index + 1,
  name: lesson.name,
  description: lesson.description,
  difficulty_level: lesson.difficulty_level,
  main_concepts: lesson.content?.main_concepts || 'Not specified'
})), null, 2)}

Analyze the progression and provide:
- Overall progression logic score (0-100)
- Specific progression issues identified
- Recommended sequence adjustments (if any)
- Assessment of difficulty curve appropriateness

Return JSON response with detailed progression analysis.`;

    try {
      const response = await this.courseGeneration.openaiClient.makeRequest([
        { role: 'system', content: 'You are an expert in language learning curriculum design and pedagogical sequencing.' },
        { role: 'user', content: validationPrompt }
      ], 'progression-validation', {
        max_tokens: 8000,
        temperature: 0.3
      });

      // Ensure complete response using continuation system
      const fullResponseContent = await this.courseGeneration.ensureCompleteResponse(
        response.content,
        response.usage,
        validationPrompt,
        'progression-validation'
      );

      const validation = this.parseValidationResponse(fullResponseContent);
      
      return {
        logic_score: validation.progression_score || 0,
        sequencing_issues: validation.issues || [],
        reordering_suggestions: validation.reordering || [],
        difficulty_curve_assessment: validation.difficulty_assessment || 'Not provided',
        passed: (validation.progression_score || 0) >= this.validationStandards.progression_logic
      };
      
    } catch (error) {
      console.error('Progression validation failed:', error);
      return {
        logic_score: 0,
        sequencing_issues: [`Progression validation failed: ${error.message}`],
        reordering_suggestions: [],
        difficulty_curve_assessment: 'Validation error - manual review required',
        passed: false
      };
    }
  }

  /**
   * Validate cultural context for appropriateness and sensitivity
   */
  async validateCulturalContext(courseContent) {
    const { course, lessons } = courseContent;
    
    // Sample lessons with cultural content
    const lessonsWithCulture = lessons.filter(lesson => 
      lesson.content?.cultural_context || lesson.content?.cultural_notes
    );
    
    if (lessonsWithCulture.length === 0) {
      return {
        appropriateness_score: 100,
        cultural_issues: [],
        improvements_suggested: ['Consider adding more cultural context to enhance learning'],
        passed: true
      };
    }

    const validationPrompt = `You are a cultural consultant specializing in respectful language education.

CULTURAL VALIDATION CONTEXT:
- Language: ${course.language_name}
- Course Focus: Standard language learning (not specific family integration)

CULTURAL SENSITIVITY CRITERIA:
1. Respectful representation of language speakers and culture
2. Appropriate cultural examples that enhance language learning
3. Avoids stereotypes while acknowledging cultural patterns
4. Suitable for diverse learners from different backgrounds
5. Cultural context supports rather than distracts from language learning

CULTURAL CONTENT TO VALIDATE:
${JSON.stringify(lessonsWithCulture.slice(0, 5).map(lesson => ({
  name: lesson.name,
  cultural_context: lesson.content?.cultural_context || 'None',
  cultural_notes: lesson.content?.cultural_notes || 'None'
})), null, 2)}

For the cultural content, assess:
- Cultural appropriateness (0-100)
- Sensitivity to diverse learners (0-100)
- Relevance to language learning goals (0-100)
- Potential concerns or improvements needed

Return JSON response with detailed cultural context assessment.`;

    try {
      const response = await this.courseGeneration.openaiClient.makeRequest([
        { role: 'system', content: 'You are a cultural education expert specializing in respectful cross-cultural language teaching.' },
        { role: 'user', content: validationPrompt }
      ], 'cultural-validation', {
        max_tokens: 8000,
        temperature: 0.3
      });

      // Ensure complete response using continuation system
      const fullResponseContent = await this.courseGeneration.ensureCompleteResponse(
        response.content,
        response.usage,
        validationPrompt,
        'cultural-validation'
      );

      const validation = this.parseValidationResponse(fullResponseContent);
      
      return {
        appropriateness_score: validation.cultural_appropriateness || 0,
        sensitivity_score: validation.cultural_sensitivity || 0,
        relevance_score: validation.learning_relevance || 0,
        cultural_issues: validation.issues || [],
        improvements_suggested: validation.improvements || [],
        passed: (validation.cultural_appropriateness || 0) >= this.validationStandards.cultural_appropriateness
      };
      
    } catch (error) {
      console.error('Cultural validation failed:', error);
      return {
        appropriateness_score: 0,
        sensitivity_score: 0,
        relevance_score: 0,
        cultural_issues: [`Cultural validation failed: ${error.message}`],
        improvements_suggested: ['Manual cultural review required due to validation system error'],
        passed: false
      };
    }
  }

  /**
   * Get course content for validation from database
   */
  async getCourseContent(courseId) {
    
    // Get course basic info
    const courseResult = await query(`
      SELECT c.*, l.name as language_name, l.native_name
      FROM courses c
      JOIN languages l ON c.language_id = l.id
      WHERE c.id = $1
    `, [courseId]);
    
    if (courseResult.rows.length === 0) {
      throw new Error(`Course ${courseId} not found`);
    }
    
    const course = courseResult.rows[0];
    
    // Get lessons with content
    const lessonsResult = await query(`
      SELECT l.*, s.name as skill_name
      FROM lessons l
      JOIN skills s ON l.skill_id = s.id
      JOIN course_skills cs ON s.id = cs.skill_id
      WHERE cs.course_id = $1
      ORDER BY s.position, l.position
    `, [courseId]);
    
    const lessons = lessonsResult.rows;
    
    // Get lesson content for each lesson
    for (let lesson of lessons) {
      const contentResult = await query(`
        SELECT * FROM lesson_content
        WHERE lesson_id = $1
        ORDER BY created_at
      `, [lesson.id]);
      
      lesson.content = {
        grammar_explanation: 'Grammar content derived from lesson content',
        examples: contentResult.rows.map(c => ({ 
          english: c.english_phrase, 
          target: c.target_phrase 
        })),
        exercises: contentResult.rows,
        cultural_context: contentResult.rows
          .filter(c => c.cultural_context)
          .map(c => c.cultural_context)
          .join(' '),
        cultural_notes: contentResult.rows
          .map(c => c.cultural_context)
          .filter(context => context)
          .join(' ')
      };
    }
    
    return {
      course,
      lessons,
      total_lessons: lessons.length
    };
  }

  /**
   * Sample lessons for validation to manage costs and focus on representative content
   */
  sampleLessonsForValidation(lessons, maxLessons = 5) {
    if (lessons.length <= maxLessons) {
      return lessons;
    }
    
    // Sample strategically: first, middle, last, and random others
    const sampled = [];
    sampled.push(lessons[0]); // First lesson
    sampled.push(lessons[Math.floor(lessons.length / 2)]); // Middle lesson  
    sampled.push(lessons[lessons.length - 1]); // Last lesson
    
    // Add random others to reach maxLessons
    const remaining = lessons.filter(l => !sampled.includes(l));
    const additionalCount = Math.min(maxLessons - sampled.length, remaining.length);
    
    for (let i = 0; i < additionalCount; i++) {
      const randomIndex = Math.floor(Math.random() * remaining.length);
      sampled.push(remaining.splice(randomIndex, 1)[0]);
    }
    
    return sampled;
  }

  /**
   * Parse AI validation response, handling potential JSON parsing issues
   */
  parseValidationResponse(content) {
    try {
      let cleanContent = content.trim();
      
      // Handle various JSON markdown formats and explanatory text
      if (cleanContent.includes('```json')) {
        const jsonMatch = cleanContent.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanContent = jsonMatch[1];
        }
      } else if (cleanContent.includes('```')) {
        const codeMatch = cleanContent.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          cleanContent = codeMatch[1];
        }
      }
      
      // Extract JSON object from any remaining text
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('Failed to parse validation response as JSON:', error);
      console.error('Raw response length:', content.length);
      console.error('Response preview:', content.substring(0, 500) + '...');
      
      // Return a basic structure if JSON parsing fails
      return {
        overall_accuracy: 50,
        progression_score: 50,
        cultural_appropriateness: 50,
        issues: ['Validation response parsing failed - response may have been truncated'],
        improvements: ['Manual review recommended due to parsing error']
      };
    }
  }

  /**
   * Calculate overall validation score
   */
  calculateOverallScore(validations) {
    const scores = [];
    
    if (validations.grammar?.accuracy_score !== undefined) {
      scores.push(validations.grammar.accuracy_score);
    }
    
    if (validations.progression?.logic_score !== undefined) {
      scores.push(validations.progression.logic_score);
    }
    
    if (validations.cultural?.appropriateness_score !== undefined) {
      scores.push(validations.cultural.appropriateness_score);
    }
    
    return scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  }

  /**
   * Determine overall validation status
   */
  determineOverallStatus(overallScore) {
    if (overallScore >= this.validationStandards.overall_passing) {
      return 'passed';
    } else if (overallScore >= 70) {
      return 'needs_review';
    } else {
      return 'failed';
    }
  }

  /**
   * Make quality gate decision based on hybrid approach (Option C)
   */
  makeQualityGateDecision(overallScore) {
    if (overallScore >= 90) {
      return 'auto_approve'; // Score ≥ 90%: Auto-approve
    } else if (overallScore >= 70) {
      return 'manual_review'; // Score 70-89%: Flag for manual review
    } else {
      return 'block_activation'; // Score < 70%: Block course activation
    }
  }

  /**
   * Generate actionable recommendations based on validation results
   */
  generateRecommendations(validationResults) {
    const recommendations = [];
    
    // Grammar recommendations
    if (validationResults.validations.grammar && !validationResults.validations.grammar.passed) {
      recommendations.push({
        category: 'grammar',
        priority: 'high',
        description: 'Grammar accuracy below standards',
        suggestions: validationResults.validations.grammar.improvements_suggested || []
      });
    }
    
    // Progression recommendations
    if (validationResults.validations.progression && !validationResults.validations.progression.passed) {
      recommendations.push({
        category: 'progression',
        priority: 'high',
        description: 'Academic progression needs improvement',
        suggestions: validationResults.validations.progression.reordering_suggestions || []
      });
    }
    
    // Cultural recommendations
    if (validationResults.validations.cultural && !validationResults.validations.cultural.passed) {
      recommendations.push({
        category: 'cultural',
        priority: 'medium',
        description: 'Cultural context could be improved',
        suggestions: validationResults.validations.cultural.improvements_suggested || []
      });
    }
    
    return recommendations;
  }
}

module.exports = { ContentValidator };