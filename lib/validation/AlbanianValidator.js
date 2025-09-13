/**
 * Albanian-Specific Content Validator - Phase 4
 * Specialized validation for Gheg dialect accuracy and Kosovo cultural context
 */

const CourseGeneration = require('../models/CourseGeneration');
const { query, db } = require('../database');

class AlbanianValidator {
  constructor() {
    this.courseGeneration = new CourseGeneration();
    this.albanianStandards = {
      dialect_accuracy: 85,
      cultural_authenticity: 80,
      family_appropriateness: 85
    };
  }

  /**
   * Albanian-specific course validation with Gheg dialect and Kosovo cultural focus
   */
  async validateAlbanianCourse(courseId) {
    console.log(`🇦🇱 Starting Albanian-specific validation for course ${courseId}`);
    
    const validationResults = {
      courseId,
      timestamp: new Date().toISOString(),
      language: 'Albanian (Gheg)',
      validations: {},
      dialect_issues: [],
      cultural_issues: [],
      recommendations: []
    };

    try {
      // Get course content
      const courseContent = await this.getCourseContent(courseId);
      
      // 1. Gheg Dialect Accuracy Validation
      console.log('🔤 Validating Gheg dialect accuracy...');
      validationResults.validations.dialect = await this.validateGhegDialect(courseContent);
      
      // 2. Kosovo Cultural Context Validation
      console.log('🏔️ Validating Kosovo cultural context...');
      validationResults.validations.cultural = await this.validateKosovoCultural(courseContent);
      
      // 3. Family Integration Appropriateness (if applicable)
      console.log('👨‍👩‍👧‍👦 Validating family integration context...');
      validationResults.validations.family = await this.validateFamilyContext(courseContent);

      // Generate Albanian-specific recommendations
      validationResults.recommendations = this.generateAlbanianRecommendations(validationResults);
      
      console.log(`✅ Albanian-specific validation complete`);
      return validationResults;
      
    } catch (error) {
      console.error('❌ Albanian validation failed:', error);
      validationResults.error = error.message;
      return validationResults;
    }
  }

  /**
   * Validate Gheg dialect accuracy vs Standard Albanian
   */
  async validateGhegDialect(courseContent) {
    const { course, lessons } = courseContent;
    
    // Sample Albanian phrases for dialect checking
    const albanianPhrases = this.extractAlbanianPhrases(lessons);
    
    if (albanianPhrases.length === 0) {
      return {
        dialect_score: 100,
        issues_found: [],
        corrections: [],
        passed: true,
        note: 'No Albanian phrases found for dialect validation'
      };
    }

    const validationPrompt = `You are a Kosovo Albanian linguist specializing in Gheg dialect authenticity.

DIALECT VALIDATION TASK:
Analyze Albanian phrases for Gheg dialect accuracy vs Standard Albanian usage.

KEY GHEG FEATURES TO CHECK:
1. Definite articles: Gheg often uses shorter forms (i/e vs të/së)
2. Verb endings: Gheg preserves archaic forms not in Standard Albanian
3. Vocabulary: Kosovo Albanian includes specific regional terms
4. Pronunciation patterns: Gheg phonological features
5. Turkish/regional loanwords: More common in Kosovo Gheg

ALBANIAN PHRASES TO VALIDATE:
${JSON.stringify(albanianPhrases.slice(0, 20), null, 2)}

For each phrase, identify:
- Is this authentic Gheg Albanian or Standard Albanian?
- Are there more natural Kosovo Albanian alternatives?
- Any vocabulary that seems inappropriate for Kosovo context?
- Pronunciation guide accuracy for Gheg sounds

Provide specific corrections where Standard Albanian should be replaced with Gheg forms.

Return JSON response with dialect authenticity assessment and corrections.`;

    try {
      const response = await this.courseGeneration.openaiClient.makeRequest([
        { role: 'system', content: 'You are a native Kosovo Albanian speaker and linguist specializing in Gheg dialect authenticity.' },
        { role: 'user', content: validationPrompt }
      ], 'gheg-validation', {
        max_tokens: 8000,
        temperature: 0.3
      });

      // Ensure complete response using continuation system
      const fullResponseContent = await this.courseGeneration.ensureCompleteResponse(
        response.content,
        response.usage,
        validationPrompt,
        'gheg-validation'
      );

      const validation = this.parseValidationResponse(fullResponseContent);
      
      return {
        dialect_score: validation.overall_dialect_score || 0,
        authenticity_assessment: validation.authenticity_notes || 'Not provided',
        issues_found: validation.dialect_issues || [],
        corrections: validation.corrections || [],
        gheg_improvements: validation.gheg_alternatives || [],
        passed: (validation.overall_dialect_score || 0) >= this.albanianStandards.dialect_accuracy
      };
      
    } catch (error) {
      console.error('Gheg dialect validation failed:', error);
      return {
        dialect_score: 0,
        issues_found: [`Dialect validation failed: ${error.message}`],
        corrections: [],
        passed: false
      };
    }
  }

  /**
   * Validate Kosovo cultural context appropriateness
   */
  async validateKosovoCultural(courseContent) {
    const { course, lessons } = courseContent;
    
    // Extract cultural content
    const culturalContent = this.extractCulturalContent(lessons);
    
    if (culturalContent.length === 0) {
      return {
        cultural_score: 100,
        issues_found: [],
        improvements: [],
        passed: true,
        note: 'No cultural content found for validation'
      };
    }

    const validationPrompt = `You are a Kosovo Albanian cultural expert validating language learning content.

KOSOVO CULTURAL CONTEXT VALIDATION:
Assess cultural content for Kosovo Albanian appropriateness and authenticity.

KOSOVO-SPECIFIC CONSIDERATIONS:
1. Post-independence (2008) cultural context
2. Religious diversity (Muslim majority, Christian minorities)
3. Family structures in contemporary Kosovo
4. Economic and social realities
5. Generational differences in language and culture
6. Diaspora community connections
7. Regional differences within Kosovo

CULTURAL CONTENT TO VALIDATE:
${JSON.stringify(culturalContent.slice(0, 10), null, 2)}

For each cultural element, assess:
- Is this accurate for Kosovo Albanian context specifically?
- Does it avoid stereotypes while being authentic?
- Is it appropriate for diverse learners?
- Are there more current/relevant alternatives?
- Does it respect religious and cultural diversity?

Focus on practical, respectful cultural guidance for language learners.

Return JSON response with Kosovo cultural appropriateness assessment.`;

    try {
      const response = await this.courseGeneration.openaiClient.makeRequest([
        { role: 'system', content: 'You are a Kosovo Albanian cultural consultant specializing in contemporary cultural dynamics and language education.' },
        { role: 'user', content: validationPrompt }
      ], 'kosovo-cultural-validation', {
        max_tokens: 8000,
        temperature: 0.3
      });

      // Ensure complete response using continuation system
      const fullResponseContent = await this.courseGeneration.ensureCompleteResponse(
        response.content,
        response.usage,
        validationPrompt,
        'kosovo-cultural-validation'
      );

      const validation = this.parseValidationResponse(fullResponseContent);
      
      return {
        cultural_score: validation.kosovo_appropriateness || 0,
        authenticity_score: validation.cultural_authenticity || 0,
        diversity_score: validation.diversity_sensitivity || 0,
        issues_found: validation.cultural_issues || [],
        improvements: validation.cultural_improvements || [],
        kosovo_specific_notes: validation.kosovo_notes || [],
        passed: (validation.kosovo_appropriateness || 0) >= this.albanianStandards.cultural_authenticity
      };
      
    } catch (error) {
      console.error('Kosovo cultural validation failed:', error);
      return {
        cultural_score: 0,
        issues_found: [`Cultural validation failed: ${error.message}`],
        improvements: [],
        passed: false
      };
    }
  }

  /**
   * Validate family integration context (if the course includes family scenarios)
   */
  async validateFamilyContext(courseContent) {
    const { lessons } = courseContent;
    
    // Look for family-related content
    const familyContent = this.extractFamilyContent(lessons);
    
    if (familyContent.length === 0) {
      return {
        family_score: 100,
        passed: true,
        note: 'No family-specific content found - general language course'
      };
    }

    const validationPrompt = `You are an expert in Albanian family dynamics and language learning for family integration.

FAMILY CONTEXT VALIDATION:
Assess family-related language learning content for appropriateness and effectiveness.

ALBANIAN FAMILY CONTEXT CONSIDERATIONS:
1. Respect for elders and hierarchy
2. Hospitality customs and expectations
3. Religious considerations in family settings
4. Gender roles and modern adaptations
5. Intergenerational communication patterns
6. Integration of non-Albanian speakers into families

FAMILY CONTENT TO VALIDATE:
${JSON.stringify(familyContent, null, 2)}

Assess each family scenario for:
- Cultural appropriateness and sensitivity
- Practical usefulness for family integration
- Respect for Albanian family values
- Realistic conversation scenarios
- Inclusive approach for diverse learners

Return JSON response with family context validation.`;

    try {
      const response = await this.courseGeneration.openaiClient.makeRequest([
        { role: 'system', content: 'You are an expert in Albanian family dynamics and cross-cultural integration.' },
        { role: 'user', content: validationPrompt }
      ], 'family-context-validation', {
        max_tokens: 8000,
        temperature: 0.3
      });

      // Ensure complete response using continuation system
      const fullResponseContent = await this.courseGeneration.ensureCompleteResponse(
        response.content,
        response.usage,
        validationPrompt,
        'family-context-validation'
      );

      const validation = this.parseValidationResponse(fullResponseContent);
      
      return {
        family_score: validation.family_appropriateness || 0,
        integration_effectiveness: validation.integration_score || 0,
        sensitivity_score: validation.cultural_sensitivity || 0,
        issues_found: validation.family_issues || [],
        improvements: validation.family_improvements || [],
        passed: (validation.family_appropriateness || 0) >= this.albanianStandards.family_appropriateness
      };
      
    } catch (error) {
      console.error('Family context validation failed:', error);
      return {
        family_score: 0,
        issues_found: [`Family validation failed: ${error.message}`],
        improvements: [],
        passed: false
      };
    }
  }

  /**
   * Get course content from database
   */
  async getCourseContent(courseId) {
    
    // Get course info
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
    
    // Get lessons
    const lessonsResult = await query(`
      SELECT l.*, s.name as skill_name
      FROM lessons l
      JOIN skills s ON l.skill_id = s.id
      JOIN course_skills cs ON s.id = cs.skill_id
      WHERE cs.course_id = $1
      ORDER BY s.position, l.position
    `, [courseId]);
    
    const lessons = lessonsResult.rows;
    
    // Get lesson content
    for (let lesson of lessons) {
      const contentResult = await query(`
        SELECT * FROM lesson_content
        WHERE lesson_id = $1
        ORDER BY created_at
      `, [lesson.id]);
      
      lesson.content = {
        phrases: contentResult.rows,
        cultural_context: contentResult.rows
          .filter(c => c.cultural_context)
          .map(c => c.cultural_context),
        cultural_notes: contentResult.rows
          .filter(c => c.cultural_notes)
          .map(c => c.cultural_notes)
      };
    }
    
    return { course, lessons };
  }

  /**
   * Extract Albanian phrases for dialect validation
   */
  extractAlbanianPhrases(lessons) {
    const phrases = [];
    
    lessons.forEach(lesson => {
      if (lesson.content && lesson.content.phrases) {
        lesson.content.phrases.forEach(item => {
          if (item.target_phrase) {
            phrases.push({
              lesson: lesson.name,
              albanian: item.target_phrase,
              english: item.english_phrase,
              pronunciation: item.pronunciation_guide,
              context: item.context_description
            });
          }
        });
      }
    });
    
    return phrases;
  }

  /**
   * Extract cultural content for validation
   */
  extractCulturalContent(lessons) {
    const cultural = [];
    
    lessons.forEach(lesson => {
      if (lesson.content) {
        if (lesson.content.cultural_context) {
          lesson.content.cultural_context.forEach(context => {
            if (context) {
              cultural.push({
                lesson: lesson.name,
                type: 'context',
                content: context
              });
            }
          });
        }
        
        if (lesson.content.cultural_notes) {
          lesson.content.cultural_notes.forEach(note => {
            if (note) {
              cultural.push({
                lesson: lesson.name,
                type: 'note',
                content: note
              });
            }
          });
        }
      }
    });
    
    return cultural;
  }

  /**
   * Extract family-related content
   */
  extractFamilyContent(lessons) {
    const family = [];
    
    lessons.forEach(lesson => {
      if (lesson.content && lesson.content.phrases) {
        lesson.content.phrases.forEach(item => {
          if (item.english_phrase && 
              (item.english_phrase.toLowerCase().includes('family') ||
               item.english_phrase.toLowerCase().includes('mother') ||
               item.english_phrase.toLowerCase().includes('father') ||
               item.english_phrase.toLowerCase().includes('parent') ||
               item.english_phrase.toLowerCase().includes('grandmother') ||
               item.english_phrase.toLowerCase().includes('grandfather'))) {
            family.push({
              lesson: lesson.name,
              albanian: item.target_phrase,
              english: item.english_phrase,
              context: item.cultural_context
            });
          }
        });
      }
    });
    
    return family;
  }

  /**
   * Parse validation response with error handling
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
      console.error('Failed to parse Albanian validation response:', error);
      console.error('Raw response length:', content.length);
      console.error('Response preview:', content.substring(0, 500) + '...');
      
      return {
        overall_dialect_score: 50,
        kosovo_appropriateness: 50,
        family_appropriateness: 50,
        issues: ['Albanian validation response parsing failed - response may have been truncated']
      };
    }
  }

  /**
   * Generate Albanian-specific recommendations
   */
  generateAlbanianRecommendations(validationResults) {
    const recommendations = [];
    
    // Dialect recommendations
    if (validationResults.validations.dialect && !validationResults.validations.dialect.passed) {
      recommendations.push({
        category: 'dialect',
        priority: 'high',
        description: 'Gheg dialect authenticity needs improvement',
        details: 'Some phrases use Standard Albanian forms instead of Kosovo Gheg',
        suggestions: validationResults.validations.dialect.gheg_improvements || []
      });
    }
    
    // Cultural recommendations
    if (validationResults.validations.cultural && !validationResults.validations.cultural.passed) {
      recommendations.push({
        category: 'cultural',
        priority: 'medium',
        description: 'Kosovo cultural context could be more authentic',
        details: 'Cultural content may need Kosovo-specific updates',
        suggestions: validationResults.validations.cultural.improvements || []
      });
    }
    
    // Family context recommendations
    if (validationResults.validations.family && !validationResults.validations.family.passed) {
      recommendations.push({
        category: 'family',
        priority: 'medium',
        description: 'Family integration scenarios need refinement',
        details: 'Family-related content could better support integration goals',
        suggestions: validationResults.validations.family.improvements || []
      });
    }
    
    return recommendations;
  }
}

module.exports = { AlbanianValidator };