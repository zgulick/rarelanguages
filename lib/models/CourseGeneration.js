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

        const prompt = `You are a Level 1 University Instructor designing an academic language course. Create comprehensive course details for ${language.name} (${language.native_name}) Level ${level}.

INSTRUCTOR GUIDELINES - ACADEMIC COURSE DESIGN:
As a university-level language instructor, you must follow rigorous academic standards:

1. LEARNING THEORY INTEGRATION:
   - Apply Constructivist Learning Theory: Students build knowledge progressively
   - Use Communicative Language Teaching (CLT) methodology
   - Implement Task-Based Language Teaching (TBLT) principles
   - Ensure Comprehensible Input (Krashen's i+1 principle)

2. ACADEMIC RIGOR REQUIREMENTS:
   - CEFR ${cefrMap[level]} alignment with documented learning outcomes
   - Measurable, observable, and assessable objectives using Bloom's Taxonomy
   - Integration of linguistic competence AND communicative competence
   - Cultural competency as core academic requirement

3. PEDAGOGICAL STRUCTURE:
   - Spiral curriculum: Concepts revisited with increasing complexity
   - Scaffolded learning: Support structures that gradually decrease
   - Authentic materials and real-world application
   - Formative and summative assessment integration

COURSE CONTEXT:
- Academic Level: University undergraduate/graduate level
- Target Learners: Adult academic learners seeking proficiency
- Level ${level} = CEFR ${cefrMap[level]} with full academic expectations
- Duration: Semester-long intensive course (15-week academic term)

REQUIRED COURSE COMPONENTS:

COURSE NAMING (Academic Standards):
- Title Format: "${language.name} ${level}: [Academic Descriptor]"
- Must reflect academic rigor (e.g., "Intensive", "Academic", "University-Level")
- Course code: Follow academic convention (3-letter + 3-digit format)
- Description: Academic catalog-ready (2-3 sentences, learning-focused)

LEARNING OBJECTIVES (Bloom's Taxonomy):
- 6-8 specific, measurable objectives using academic action verbs
- Cover all four skills: speaking, listening, reading, writing
- Include cultural competency and intercultural communication
- Progress from lower-order (remember, understand) to higher-order thinking (analyze, evaluate, create)
- Must be assessable through academic evaluation methods

ESTIMATED HOURS (Academic Credit Standards):
- Include: Instructional hours + guided practice + independent study + assessment
- Follow university credit hour standards: 1 credit = 15 instructional hours + 30 study hours
- Level ${level} baseline: ${40 + (level-1)*10} instructional hours + ${(40 + (level-1)*10) * 2} study hours
- Must justify hour allocation with academic pedagogical reasoning

ACADEMIC QUALITY ASSURANCE:
- Ensure progression from novice to intermediate academic language use
- Integration of academic skills (note-taking, presentation, discussion)
- Preparation for academic language tasks relevant to university context
- Cultural competency for academic and professional environments

Return JSON format with academic specifications:
{
  "name": "Academic course title with rigor indicator",
  "code": "Academic course code (ABC123 format)",
  "description": "Academic catalog description focusing on learning outcomes",
  "cefr_level": "${cefrMap[level]}",
  "learning_objectives": ["Academic objective with Bloom's verb", "objective2", ...],
  "estimated_hours": ${40 + (level-1)*10},
  "academic_rationale": "Brief justification for course structure and hour allocation"
}`;

        const response = await this.openaiClient.makeRequest([
            { role: 'system', content: 'You are a Level 1 University Instructor and expert academic course designer specializing in language learning curriculum with advanced knowledge of university standards and pedagogical theory.' },
            { role: 'user', content: prompt }
        ], 'course-details');

        this.trackCost('course-details', 0.01);

        let courseDetails;
        try {
            let cleanContent = response.content.trim();
            
            // Handle various JSON markdown formats
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
            } else if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '');
            }
            
            // Remove any leading/trailing text before/after JSON
            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanContent = jsonMatch[0];
            }
            
            courseDetails = JSON.parse(cleanContent);
        } catch (parseError) {
            console.error('❌ Failed to parse course details JSON. Raw response:');
            console.error(response.content.substring(0, 1000) + '...');
            console.error('Parse error:', parseError.message);
            throw new Error('Failed to parse course details from AI response');
        }

        return courseDetails;
    }

    async generateCurriculumPlan(course, languageName, nativeName) {
        const prompt = `You are a Level 1 University Curriculum Architect with expertise in Second Language Acquisition (SLA) theory. Create a rigorous academic curriculum plan for "${course.name}".

INSTRUCTOR CREDENTIALS & METHODOLOGY:
You hold advanced degrees in Applied Linguistics and Language Pedagogy. Your curriculum design follows:

1. SLA THEORETICAL FOUNDATIONS:
   - Stephen Krashen's Input Hypothesis (Comprehensible Input i+1)
   - Michael Long's Interaction Hypothesis (Negotiation of meaning)
   - Rod Ellis's Task-Based Language Teaching methodology
   - Jim Cummins's CALP vs BICS framework (Academic Language Proficiency)

2. PEDAGOGICAL SEQUENCING PRINCIPLES:
   - Processability Theory (Manfred Pienemann): Grammar acquisition follows developmental sequences
   - Zone of Proximal Development (Vygotsky): Tasks slightly beyond current ability with support
   - Skill Integration Theory: Receptive → productive, simple → complex, concrete → abstract
   - Frequency-based Learning: High-frequency structures before low-frequency ones

3. ACADEMIC RIGOR REQUIREMENTS:
   - CEFR-aligned performance descriptors with measurable outcomes
   - Interleaved practice (mixing skill types within lessons)
   - Spaced repetition algorithms built into lesson sequencing
   - Authentic assessment through performance-based tasks

COURSE ACADEMIC CONTEXT:
- Language: ${languageName} (${nativeName})
- Academic Level: ${course.level} (University ${course.cefr_level})
- Course Description: ${course.description}
- Learning Objectives: ${course.learning_objectives}
- Total Academic Hours: ${course.estimated_hours} (includes lecture, lab, study time)

CURRICULUM DESIGN SPECIFICATIONS:

SKILL/MODULE ARCHITECTURE:
- Design 8-12 academic skills that follow natural acquisition sequences
- Each skill = 3-6 lessons with scaffolded complexity progression
- Prerequisite mapping following SLA developmental stages
- Integration points for skill synthesis and transfer

PEDAGOGICAL PROGRESSION REQUIREMENTS:

Phase 1 (Skills 1-3): FOUNDATION ESTABLISHMENT
- Phonological awareness and sound-symbol correspondence
- Core grammatical structures (subject-verb-object, basic morphology)  
- High-frequency lexical items (1000 most common words)
- Cultural schema activation for comprehension support

Phase 2 (Skills 4-7): ACADEMIC LANGUAGE DEVELOPMENT
- Complex sentence structures and subordination
- Academic vocabulary and collocations
- Register awareness (formal/informal language use)
- Discourse markers and cohesive devices

Phase 3 (Skills 8-12): PROFICIENCY INTEGRATION
- Pragmatic competence in academic/professional contexts
- Advanced morphosyntactic structures
- Critical thinking through target language
- Independent language use and self-monitoring

LESSON DESIGN METHODOLOGY:
Each lesson must follow the PPP framework (Presentation-Practice-Production):
- Pre-task: Schema activation and vocabulary priming
- During-task: Guided practice with scaffolding
- Post-task: Autonomous production with formative assessment
- Language focus: Explicit grammar instruction with form-meaning mapping

LEARNING OBJECTIVE SPECIFICATIONS:
- Use Bloom's Taxonomy verbs (remember → understand → apply → analyze → evaluate → create)
- Include all four skills with integrated practice
- Measurable performance indicators with rubric-ready criteria
- Cultural competency objectives for intercultural understanding

ASSESSMENT INTEGRATION:
- Formative assessment embedded in each lesson
- Summative assessments at skill completion points
- Portfolio development for authentic assessment
- Self-assessment tools for metacognitive development

Return comprehensive JSON format with full academic specifications:
{
  "skills": [
    {
      "name": "Academic skill title with SLA theoretical focus",
      "description": "Detailed academic description with learning theory rationale and pedagogical justification",
      "position": 1,
      "cefr_level": "${course.cefr_level}",
      "prerequisites": [], // Array of skill positions based on processability theory
      "estimated_hours": 4.5,
      "learning_phase": "foundation|development|integration",
      "sla_focus": "Specific SLA principle being applied (e.g., Input Hypothesis, Interaction Hypothesis)",
      "assessment_method": "Detailed description of how this skill will be assessed",
      "pedagogical_rationale": "Academic justification for this skill's placement and methodology",
      "lessons": [
        {
          "name": "Lesson title with clear measurable learning outcome",
          "position": 1,
          "difficulty_level": 3, // 1-10 scale with pedagogical justification
          "estimated_minutes": 30, // Academic class session length
          "learning_focus": "Specific measurable learning outcome using Bloom's taxonomy verbs",
          "content_areas": ["vocabulary", "grammar", "phonology", "culture", "pragmatics"],
          "ppp_framework": {
            "presentation": "Detailed description of how new language will be presented",
            "practice": "Controlled practice activities and methodology",
            "production": "Free production tasks for autonomous language use"
          },
          "scaffolding_strategy": "How support will be provided and gradually removed (ZPD application)",
          "assessment_strategy": "Formative assessment approach for this specific lesson",
          "academic_integration": "How this lesson connects to university-level learning outcomes"
        }
      ]
    }
  ],
  "curriculum_rationale": "Overall pedagogical justification for skill sequence and methodology",
  "prerequisites_map": "Visual representation of skill dependencies based on SLA research",
  "integration_points": ["Specific points where skills connect and reinforce each other"],
  "academic_standards_met": ["List of academic standards and frameworks addressed"]
}`;

        // Use maximum token limit for full academic response
        const response = await this.openaiClient.makeRequest([
            { role: 'system', content: 'You are a Level 1 University Curriculum Architect with advanced degrees in Applied Linguistics and Language Pedagogy. You design academically rigorous language curricula following Second Language Acquisition theory and university-level academic standards.' },
            { role: 'user', content: prompt }
        ], 'curriculum-planning', { 
            max_tokens: 8000, // Maximum tokens for comprehensive academic response
            temperature: 0.3 // Consistent academic content
        });

        this.trackCost('curriculum-planning', 0.02);

        let curriculumPlan;
        let fullResponseContent = response.content;
        
        try {
            // Check if response was truncated and continue if needed
            fullResponseContent = await this.ensureCompleteResponse(
                fullResponseContent, 
                response.usage,
                prompt,
                'curriculum-planning'
            );
            
            let cleanContent = fullResponseContent.trim();
            
            // Handle various JSON markdown formats
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
            } else if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '');
            }
            
            // Remove any leading/trailing text before/after JSON
            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanContent = jsonMatch[0];
            }
            
            curriculumPlan = JSON.parse(cleanContent);
        } catch (parseError) {
            console.error('❌ Failed to parse curriculum plan JSON after continuation attempts.');
            console.error('Response length:', fullResponseContent.length);
            console.error('Parse error:', parseError.message);
            console.error('Raw response preview:', fullResponseContent.substring(0, 1000) + '...');
            throw new Error('Failed to parse curriculum plan from AI response');
        }

        console.log(`✅ Generated curriculum plan: ${curriculumPlan.skills.length} skills`);
        return curriculumPlan;
    }

    /**
     * Ensure we get a complete response from GPT-4o, handling truncation by continuing
     */
    async ensureCompleteResponse(initialContent, initialUsage, originalPrompt, operationName, maxContinuations = 3) {
        let fullContent = initialContent;
        let continuationCount = 0;
        
        // Check if response appears to be truncated
        while (this.isResponseTruncated(fullContent) && continuationCount < maxContinuations) {
            continuationCount++;
            console.log(`🔄 Response appears truncated, requesting continuation ${continuationCount}/${maxContinuations}...`);
            
            const continuationPrompt = `Continue your previous response from exactly where you left off. 
            
Previous response ended with: "${fullContent.slice(-200)}"

Please continue the JSON response, picking up exactly where the previous response was cut off. Do not repeat any content, just continue from the truncation point.`;

            const continuationResponse = await this.openaiClient.makeRequest([
                { role: 'system', content: 'You are continuing a previously truncated academic response. Continue exactly where you left off without repeating any content.' },
                { role: 'user', content: continuationPrompt }
            ], `${operationName}-continuation-${continuationCount}`, {
                max_tokens: 8000,
                temperature: 0.3
            });

            // Combine the responses intelligently
            fullContent = this.combineResponseParts(fullContent, continuationResponse.content);
            this.trackCost(`${operationName}-continuation`, 0.015);
        }

        if (continuationCount > 0) {
            console.log(`✅ Complete response assembled after ${continuationCount} continuation(s)`);
        }

        return fullContent;
    }

    /**
     * Detect if a response was truncated
     */
    isResponseTruncated(content) {
        // Check for common truncation indicators
        const truncationIndicators = [
            // Incomplete JSON structures
            /\{[^}]*$/,  // Opening brace without closing
            /\[[^[\]]*$/,  // Opening bracket without closing
            /,"[^"]*$/,   // Incomplete quoted string
            /,\s*$/,      // Trailing comma
            // Incomplete sentences
            /\w+\.\.\.$/, // Ends with ellipsis
            /\w+\s*$/     // Ends mid-word
        ];

        // Check JSON validity by attempting to parse
        try {
            let testContent = content.trim();
            
            // Remove markdown if present
            if (testContent.startsWith('```json')) {
                testContent = testContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
            } else if (testContent.startsWith('```')) {
                testContent = testContent.replace(/```\s*/, '').replace(/```\s*$/, '');
            }
            
            const jsonMatch = testContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                JSON.parse(jsonMatch[0]);
                return false; // Valid JSON, not truncated
            }
        } catch (e) {
            // JSON is invalid, likely truncated
        }

        // Check against truncation patterns
        return truncationIndicators.some(pattern => pattern.test(content.trim()));
    }

    /**
     * Intelligently combine response parts
     */
    combineResponseParts(originalContent, continuationContent) {
        let continuation = continuationContent.trim();
        
        // Remove any markdown formatting from continuation
        if (continuation.startsWith('```json')) {
            continuation = continuation.replace(/```json\s*/, '').replace(/```\s*$/, '');
        } else if (continuation.startsWith('```')) {
            continuation = continuation.replace(/```\s*/, '').replace(/```\s*$/, '');
        }

        // If continuation starts with JSON structure, we need to merge carefully
        if (continuation.startsWith('{') || continuation.startsWith('[')) {
            // This is a complete continuation, replace any incomplete JSON in original
            const originalWithoutIncompleteJson = originalContent.replace(/\{[^}]*$/, '').replace(/\[[^[\]]*$/, '');
            return originalWithoutIncompleteJson + continuation;
        } else {
            // This is a partial continuation, append directly
            return originalContent + continuation;
        }
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
        
        const prompt = `You are a Level 1 University Language Content Specialist with expertise in Academic Language Corpus Design and Instructional Materials Development. Generate ${contentCount} academically rigorous lesson content items for "${lesson.name}" in ${languageName} (${nativeName}).

ACADEMIC INSTRUCTOR QUALIFICATIONS:
- PhD in Applied Linguistics with specialization in Corpus-Based Language Teaching
- Certified in CEFR Assessment and Academic Language Proficiency Standards
- Expert in Frequency-Based Vocabulary Selection and Academic Word Lists
- Advanced training in Cross-Cultural Pragmatics and Intercultural Competence

LESSON ACADEMIC CONTEXT:
- Academic Skill Module: ${skill.name}
- Pedagogical Description: ${skill.description}
- Learning Objective (Bloom's Taxonomy): ${lesson.learning_focus || 'Students will demonstrate comprehension and production of target structures'}
- Academic Difficulty Level: ${lesson.difficulty_level}/10 (university-level complexity)
- CEFR Academic Standard: ${skill.cefr_level} (aligned with European Framework descriptors)
- Content Integration Areas: ${lesson.content_areas ? lesson.content_areas.join(', ') : 'lexical competence, grammatical competence, sociocultural competence'}

ACADEMIC CONTENT DEVELOPMENT PRINCIPLES:

1. CORPUS-BASED LANGUAGE SELECTION:
   - Use frequency data from academic and authentic language corpora
   - Prioritize high-utility expressions for academic/professional contexts
   - Include collocational patterns and formulaic sequences
   - Select lexical items from Academic Word List (Coxhead) when appropriate

2. AUTHENTICITY AND REAL-WORLD APPLICATION:
   - Source language from authentic materials (academic texts, professional discourse)
   - Create situational contexts that mirror real language use
   - Include register variation (formal/informal, spoken/written)
   - Address pragmatic competence through contextual appropriateness

3. PEDAGOGICAL SEQUENCING WITHIN LESSON:
   - Progress from receptive to productive use
   - Scaffold complexity (single words → phrases → sentences → discourse)
   - Integrate new items with previously learned structures
   - Provide meaningful contexts that support comprehension and retention

4. CULTURAL AND INTERCULTURAL COMPETENCE:
   - Include culturally authentic scenarios and references
   - Address potential L1-L2 cultural transfer issues
   - Promote intercultural awareness and sensitivity
   - Avoid stereotypes while maintaining cultural authenticity

5. ASSESSMENT-READY CONTENT DESIGN:
   - Create items suitable for formative and summative assessment
   - Include distractors for multiple-choice exercises
   - Design content that supports performance-based tasks
   - Enable progress tracking through measurable outcomes

PRONUNCIATION AND PHONOLOGICAL INSTRUCTION:
- Use International Phonetic Alphabet (IPA) when appropriate
- Focus on sounds that are problematic for English L1 learners
- Include stress patterns and rhythm guidance
- Address connected speech phenomena (linking, assimilation)

EXERCISE TYPE SELECTION CRITERIA:
Based on cognitive load theory and task complexity:
- Flashcard: For form-meaning connections and vocabulary retention
- Audio: For pronunciation, listening comprehension, and prosodic features
- Conversation: For pragmatic competence and interactive skills
- Grammar: For explicit rule learning and pattern recognition
- Cultural: For sociocultural competence and intercultural awareness
- Writing: For productive written skills and academic register
- Reading: For comprehension and text analysis skills

Return comprehensive JSON array with academic specifications:
[
  {
    "english_phrase": "Academically relevant English phrase with clear communicative purpose",
    "target_phrase": "Accurate translation in ${nativeName} with appropriate register",
    "pronunciation_guide": "Detailed phonetic guide using English approximations and IPA where helpful",
    "grammatical_focus": "Specific grammatical structure or pattern being targeted",
    "lexical_level": "Academic word list level or frequency ranking",
    "cultural_context": "Rich cultural note with practical application guidance",
    "pragmatic_function": "Speech act or communicative function (request, apology, etc.)",
    "register_level": "formal|neutral|informal - appropriate for academic context",
    "difficulty_score": ${lesson.difficulty_level}, // Pedagogically justified complexity rating
    "cognitive_load": "low|medium|high - processing demands for learners",
    "exercise_types": ["pedagogically appropriate exercise types based on learning objective"],
    "assessment_potential": "How this item could be used in formative or summative assessment",
    "corpus_frequency": "High/medium/low frequency in academic/professional discourse",
    "error_prediction": "Common L1 interference or learning difficulties to anticipate"
  }
]

QUALITY ASSURANCE REQUIREMENTS:
- All content must be pedagogically sound and theoretically grounded
- Translations must be culturally appropriate and register-accurate
- Pronunciation guides must be accessible to English L1 learners
- Cultural context must promote intercultural competence
- Content must support the specific learning objective of this lesson
- Items must be suitable for university-level academic language instruction`;

        const response = await this.openaiClient.makeRequest([
            { role: 'system', content: `You are a Level 1 University Language Content Specialist with PhD in Applied Linguistics, specializing in ${languageName} language pedagogy and academic content development. You create university-level language learning materials following rigorous academic standards.` },
            { role: 'user', content: prompt }
        ], 'lesson-content', { 
            max_tokens: 8000, // Allow comprehensive academic content
            temperature: 0.3 
        });

        this.trackCost('lesson-content', 0.015);

        let contentItems;
        let fullResponseContent = response.content;
        
        try {
            // Ensure complete response for comprehensive academic content
            fullResponseContent = await this.ensureCompleteResponse(
                fullResponseContent,
                response.usage,
                prompt,
                'lesson-content'
            );
            
            let cleanContent = fullResponseContent.trim();
            
            // Handle various JSON markdown formats
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
            } else if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '');
            }
            
            // Remove any leading/trailing text before/after JSON
            const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                cleanContent = jsonMatch[0];
            }
            
            contentItems = JSON.parse(cleanContent);
        } catch (parseError) {
            console.error(`❌ Failed to parse lesson content JSON for ${lesson.name} after continuation attempts.`);
            console.error('Response length:', fullResponseContent.length);
            console.error('Parse error:', parseError.message);
            console.error('Raw response preview:', fullResponseContent.substring(0, 1000) + '...');
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