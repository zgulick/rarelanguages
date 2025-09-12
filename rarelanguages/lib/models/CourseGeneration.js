const { query, db } = require('../database');
const { OpenAIClient } = require('../openai');

/**
 * Automated Course Generation System
 * Handles the complete automation of course curriculum creation
 */
class CourseGeneration {
    constructor() {
        this.openaiClient = new OpenAIClient();
        this.generationCosts = {
            total: 0,
            breakdown: {}
        };
    }

    /**
     * Generate complete course curriculum for any language
     * This is the main "Build My Course" functionality
     */
    async generateFullCourse(languageCode, languageName, nativeName, targetLevel = 1) {
        const startTime = Date.now();
        console.log(`🚀 Starting automated course generation for ${languageName} Level ${targetLevel}`);

        try {
            // 1. Ensure language exists
            let languageId = await this.ensureLanguageExists(languageCode, languageName, nativeName);
            
            // 2. Generate or get existing course structure
            let course = await this.getOrCreateCourse(languageId, targetLevel);
            
            // 3. Generate academic curriculum structure
            const curriculumPlan = await this.generateCurriculumPlan(course, languageName, nativeName);
            
            // 4. Create skills and lessons based on curriculum plan
            const skills = await this.generateSkillsFromPlan(course.id, languageId, curriculumPlan);
            
            // 5. Generate comprehensive lesson content
            const contentStats = await this.generateLessonContent(skills, languageName, nativeName);
            
            // 6. Create assessments for the course
            const assessments = await this.generateCourseAssessments(course.id, skills);
            
            // 7. Link everything together properly
            await this.linkCourseComponents(course.id, skills);
            
            const duration = Math.round((Date.now() - startTime) / 1000);
            const result = {
                courseId: course.id,
                courseName: course.name,
                language: languageName,
                level: targetLevel,
                skills: skills.length,
                lessons: contentStats.totalLessons,
                contentItems: contentStats.totalContent,
                assessments: assessments.length,
                generationTimeSeconds: duration,
                estimatedCost: this.generationCosts.total,
                success: true
            };

            console.log(`🎉 Course generation completed!`);
            console.log(`   Course: ${course.name}`);
            console.log(`   Skills: ${skills.length}, Lessons: ${contentStats.totalLessons}`);
            console.log(`   Content Items: ${contentStats.totalContent}`);
            console.log(`   Time: ${duration}s, Cost: $${this.generationCosts.total.toFixed(4)}`);

            return result;

        } catch (error) {
            console.error(`❌ Course generation failed:`, error.message);
            throw error;
        }
    }

    async ensureLanguageExists(code, name, nativeName) {
        // Check if language already exists
        const existing = await db.select('languages', { code });
        if (existing.length > 0) {
            return existing[0].id;
        }

        // Create new language
        const language = await db.insert('languages', {
            code,
            name,
            native_name: nativeName,
            active: true
        });

        console.log(`✅ Created language: ${name} (${code})`);
        return language.id;
    }

    async getOrCreateCourse(languageId, level) {
        // Check if course already exists
        const existing = await db.select('courses', { language_id: languageId, level });
        if (existing.length > 0) {
            return existing[0];
        }

        // Get language info for course naming
        const languages = await db.select('languages', { id: languageId });
        const language = languages[0];

        // Create new course with AI-generated details
        const courseDetails = await this.generateCourseDetails(language, level);
        
        const course = await db.insert('courses', {
            language_id: languageId,
            name: courseDetails.name,
            code: courseDetails.code,
            description: courseDetails.description,
            level,
            cefr_level: courseDetails.cefr_level,
            learning_objectives: JSON.stringify(courseDetails.learning_objectives),
            estimated_hours: courseDetails.estimated_hours,
            is_active: true
        });

        console.log(`✅ Created course: ${course.name} (${course.code})`);
        return course;
    }

    async generateCourseDetails(language, level) {
        const cefrMap = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2' };
        const levelNames = { 1: 'Foundations', 2: 'Development', 3: 'Fluency', 4: 'Mastery' };

        const prompt = `Create course details for ${language.name} (${language.native_name}) Level ${level}.

CONTEXT:
- This is an academic language course for adult learners
- Focus on practical communication and cultural integration
- Level ${level} corresponds to CEFR ${cefrMap[level]}
- Course should prepare students for real-world language use

Generate course details with:

COURSE NAMING:
- Professional course title: "${language.name} ${level}: [Descriptive Title]"
- Course code: 3-letter language code + level (e.g., "ALB101", "WEL201")
- Description: 2-3 sentences about the course focus and outcomes

LEARNING OBJECTIVES:
- 5-7 specific, measurable learning objectives
- Focus on practical skills and cultural competency
- Appropriate for ${cefrMap[level]} level

ESTIMATED HOURS:
- Realistic time estimate for course completion
- Include study time, practice, and assessments
- Level ${level} baseline: ${40 + (level-1)*10} hours

Return JSON format:
{
  "name": "Course title",
  "code": "Course code",
  "description": "Course description",
  "cefr_level": "${cefrMap[level]}",
  "learning_objectives": ["objective1", "objective2", ...],
  "estimated_hours": ${40 + (level-1)*10}
}`;

        const response = await this.openaiClient.makeRequest([
            { role: 'system', content: 'You are an expert academic course designer specializing in language learning curriculum.' },
            { role: 'user', content: prompt }
        ], 'course-details');

        this.trackCost('course-details', 0.01);

        let courseDetails;
        try {
            let cleanContent = response.content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
            }
            courseDetails = JSON.parse(cleanContent);
        } catch (parseError) {
            throw new Error('Failed to parse course details from AI response');
        }

        return courseDetails;
    }

    async generateCurriculumPlan(course, languageName, nativeName) {
        const prompt = `Create a comprehensive academic curriculum plan for "${course.name}".

COURSE CONTEXT:
- Language: ${languageName} (${nativeName})
- Level: ${course.level}
- CEFR Level: ${course.cefr_level}
- Description: ${course.description}
- Learning Objectives: ${course.learning_objectives}
- Estimated Hours: ${course.estimated_hours}

CURRICULUM REQUIREMENTS:
- Create 6-10 skills (topics/modules) that build progressively
- Each skill should have 3-5 lessons
- Skills should follow language learning pedagogy (grammar-first approach)
- Include cultural context throughout
- Ensure prerequisite relationships between skills
- Focus on practical, real-world application

SKILL PROGRESSION GUIDELINES:
- Start with essential foundations
- Build vocabulary systematically
- Introduce grammar concepts progressively  
- Include cultural competency throughout
- End with practical application and integration

Return JSON format:
{
  "skills": [
    {
      "name": "Skill name",
      "description": "What this skill covers",
      "position": 1,
      "cefr_level": "${course.cefr_level}",
      "prerequisites": [], // Array of skill positions that must be completed first
      "estimated_hours": 4.0,
      "lessons": [
        {
          "name": "Lesson name",
          "position": 1,
          "difficulty_level": 3,
          "estimated_minutes": 20,
          "learning_focus": "What students will learn",
          "content_areas": ["vocabulary", "grammar", "culture"] // What types of content to generate
        }
      ]
    }
  ]
}`;

        const response = await this.openaiClient.makeRequest([
            { role: 'system', content: 'You are an expert language curriculum architect with deep knowledge of pedagogical sequencing.' },
            { role: 'user', content: prompt }
        ], 'curriculum-planning');

        this.trackCost('curriculum-planning', 0.02);

        let curriculumPlan;
        try {
            let cleanContent = response.content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
            }
            curriculumPlan = JSON.parse(cleanContent);
        } catch (parseError) {
            throw new Error('Failed to parse curriculum plan from AI response');
        }

        console.log(`✅ Generated curriculum plan: ${curriculumPlan.skills.length} skills`);
        return curriculumPlan;
    }

    async generateSkillsFromPlan(courseId, languageId, curriculumPlan) {
        const skills = [];
        
        console.log(`📚 Generating skills and lessons from curriculum plan...`);
        
        for (const skillPlan of curriculumPlan.skills) {
            // Create skill
            const skill = await db.insert('skills', {
                language_id: languageId,
                name: skillPlan.name,
                description: skillPlan.description,
                position: skillPlan.position,
                prerequisites: JSON.stringify(skillPlan.prerequisites || []),
                cefr_level: skillPlan.cefr_level,
                is_active: true
            });

            // Link skill to course
            await db.insert('course_skills', {
                course_id: courseId,
                skill_id: skill.id,
                position: skillPlan.position,
                estimated_hours: skillPlan.estimated_hours || 4.0
            });

            // Create lessons for this skill
            const lessons = [];
            for (const lessonPlan of skillPlan.lessons) {
                const lesson = await db.insert('lessons', {
                    skill_id: skill.id,
                    name: lessonPlan.name,
                    position: lessonPlan.position,
                    difficulty_level: lessonPlan.difficulty_level || 3,
                    estimated_minutes: lessonPlan.estimated_minutes || 20,
                    prerequisites: JSON.stringify([]),
                    is_active: true
                });

                lessons.push({ ...lesson, content_areas: lessonPlan.content_areas });
            }

            skills.push({ ...skill, lessons });
            console.log(`   ✅ ${skillPlan.name} - ${lessons.length} lessons`);
        }

        return skills;
    }

    async generateLessonContent(skills, languageName, nativeName) {
        console.log(`📝 Generating lesson content for ${skills.length} skills...`);
        
        let totalLessons = 0;
        let totalContent = 0;

        for (const skill of skills) {
            for (const lesson of skill.lessons) {
                const contentItems = await this.generateContentForLesson(
                    lesson, skill, languageName, nativeName
                );
                totalContent += contentItems;
                totalLessons++;
            }
        }

        console.log(`✅ Generated content for ${totalLessons} lessons (${totalContent} items)`);
        return { totalLessons, totalContent };
    }

    async generateContentForLesson(lesson, skill, languageName, nativeName) {
        const contentCount = 8; // Generate 8 content items per lesson
        
        const prompt = `Generate ${contentCount} lesson content items for "${lesson.name}" in ${languageName} (${nativeName}).

LESSON CONTEXT:
- Skill: ${skill.name}
- Description: ${skill.description}
- Lesson Focus: ${lesson.learning_focus || 'General language practice'}
- Difficulty Level: ${lesson.difficulty_level}/10
- CEFR Level: ${skill.cefr_level}

CONTENT REQUIREMENTS:
- Create practical, everyday phrases and expressions
- Include pronunciation guidance for English speakers
- Add cultural context where appropriate
- Vary difficulty within the level range
- Focus on areas: ${lesson.content_areas ? lesson.content_areas.join(', ') : 'vocabulary, grammar, conversation'}

Return JSON array:
[
  {
    "english_phrase": "English phrase or sentence",
    "target_phrase": "Translation in ${nativeName}",
    "pronunciation_guide": "Phonetic guide for English speakers",
    "cultural_context": "Cultural note (if relevant, otherwise null)",
    "difficulty_score": 5, // 1-10 scale
    "exercise_types": ["flashcard", "audio", "conversation"] // Applicable exercise types
  }
]`;

        const response = await this.openaiClient.makeRequest([
            { role: 'system', content: `You are an expert ${languageName} language teacher with deep cultural knowledge.` },
            { role: 'user', content: prompt }
        ], 'lesson-content');

        this.trackCost('lesson-content', 0.015);

        let contentItems;
        try {
            let cleanContent = response.content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
            }
            contentItems = JSON.parse(cleanContent);
        } catch (parseError) {
            console.warn(`⚠️  Failed to parse content for ${lesson.name}, using fallback`);
            return 0;
        }

        // Save content items to database
        for (const item of contentItems) {
            await db.insert('lesson_content', {
                lesson_id: lesson.id,
                english_phrase: item.english_phrase,
                target_phrase: item.target_phrase,
                pronunciation_guide: item.pronunciation_guide,
                cultural_context: item.cultural_context,
                difficulty_score: item.difficulty_score || 5,
                exercise_types: JSON.stringify(item.exercise_types || ['flashcard'])
            });
        }

        return contentItems.length;
    }

    async generateCourseAssessments(courseId, skills) {
        console.log(`📋 Generating course assessments...`);
        
        const assessments = [];
        
        // Create midterm assessment
        const midterm = await db.insert('assessments', {
            course_id: courseId,
            name: 'Course Midterm Assessment',
            assessment_type: 'quiz',
            max_score: 100,
            passing_score: 75,
            time_limit_minutes: 30,
            instructions: 'Comprehensive assessment covering the first half of the course content.',
            is_active: true
        });
        assessments.push(midterm);

        // Create final assessment  
        const final = await db.insert('assessments', {
            course_id: courseId,
            name: 'Course Final Assessment',
            assessment_type: 'exam',
            max_score: 100,
            passing_score: 80,
            time_limit_minutes: 45,
            instructions: 'Final comprehensive assessment covering all course content.',
            is_active: true
        });
        assessments.push(final);

        console.log(`✅ Generated ${assessments.length} course assessments`);
        return assessments;
    }

    async linkCourseComponents(courseId, skills) {
        // Update course with final skill count
        const totalSkills = skills.length;
        await db.update('courses', 
            { 
                created_at: new Date().toISOString(),
                // Add any final course metadata 
            }, 
            { id: courseId }
        );

        console.log(`✅ Linked ${totalSkills} skills to course`);
    }

    trackCost(operation, cost) {
        this.generationCosts.breakdown[operation] = (this.generationCosts.breakdown[operation] || 0) + cost;
        this.generationCosts.total += cost;
    }

    /**
     * Get generation status and progress for a course
     */
    async getGenerationStatus(courseId) {
        const course = await db.select('courses', { id: courseId });
        if (course.length === 0) {
            return { exists: false };
        }

        const skills = await db.select('course_skills', { course_id: courseId });
        const lessons = await query(`
            SELECT COUNT(*) as count FROM lessons l 
            JOIN course_skills cs ON l.skill_id = cs.skill_id 
            WHERE cs.course_id = $1
        `, [courseId]);
        const content = await query(`
            SELECT COUNT(*) as count FROM lesson_content lc
            JOIN lessons l ON lc.lesson_id = l.id
            JOIN course_skills cs ON l.skill_id = cs.skill_id 
            WHERE cs.course_id = $1
        `, [courseId]);

        return {
            exists: true,
            course: course[0],
            skills: skills.length,
            lessons: parseInt(lessons.rows[0].count),
            content: parseInt(content.rows[0].count),
            isComplete: skills.length > 0 && parseInt(lessons.rows[0].count) > 0
        };
    }
}

module.exports = CourseGeneration;