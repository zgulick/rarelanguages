const { query, db } = require('../database');

/**
 * University-Style Course Progression Logic
 * Handles academic course enrollment, prerequisites, and progression
 */
class CourseProgression {
    
    /**
     * Get available courses for a user with prerequisite checking
     */
    async getAvailableCourses(userId, languageCode = null) {
        let queryText = `
            WITH user_course_progress AS (
                SELECT 
                    cp.course_id,
                    cp.status,
                    cp.completion_date,
                    cp.overall_score
                FROM course_progress cp
                WHERE cp.user_id = $1
            ),
            course_prerequisites AS (
                SELECT 
                    c.id as course_id,
                    c.prerequisites,
                    CASE 
                        WHEN c.prerequisites IS NULL OR jsonb_array_length(c.prerequisites) = 0 THEN true
                        ELSE (
                            SELECT COUNT(*) = jsonb_array_length(c.prerequisites)
                            FROM unnest(ARRAY(SELECT jsonb_array_elements_text(c.prerequisites))::uuid[]) AS prereq_id
                            JOIN user_course_progress ucp ON ucp.course_id = prereq_id AND ucp.status = 'completed'
                        )
                    END as prerequisites_met
                FROM courses c
            )
            SELECT 
                c.*,
                l.name as language_name,
                l.code as language_code,
                l.native_name,
                COALESCE(ucp.status, 'not_started') as enrollment_status,
                ucp.completion_date,
                ucp.overall_score,
                cp.prerequisites_met,
                COUNT(DISTINCT cs.skill_id) as total_skills,
                COUNT(DISTINCT a.id) as total_assessments,
                CASE 
                    WHEN ucp.status = 'completed' THEN 'completed'
                    WHEN ucp.status IN ('in_progress', 'not_started') AND cp.prerequisites_met THEN 'available'
                    WHEN NOT cp.prerequisites_met THEN 'locked'
                    ELSE 'available'
                END as access_status
            FROM courses c
            JOIN languages l ON c.language_id = l.id
            LEFT JOIN user_course_progress ucp ON c.id = ucp.course_id
            JOIN course_prerequisites cp ON c.id = cp.course_id
            LEFT JOIN course_skills cs ON c.id = cs.course_id
            LEFT JOIN assessments a ON c.id = a.course_id AND a.is_active = true
            WHERE c.is_active = true
        `;

        const params = [userId];
        if (languageCode) {
            queryText += ` AND l.code = $2`;
            params.push(languageCode);
        }

        queryText += `
            GROUP BY c.id, l.name, l.code, l.native_name, ucp.status, 
                     ucp.completion_date, ucp.overall_score, cp.prerequisites_met
            ORDER BY l.name, c.level
        `;

        const result = await query(queryText, params);
        
        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            code: row.code,
            description: row.description,
            level: row.level,
            cefrLevel: row.cefr_level,
            estimatedHours: row.estimated_hours,
            language: {
                code: row.language_code,
                name: row.language_name,
                nativeName: row.native_name
            },
            learningObjectives: row.learning_objectives,
            totalSkills: row.total_skills || 0,
            totalAssessments: row.total_assessments || 0,
            enrollmentStatus: row.enrollment_status,
            accessStatus: row.access_status,
            completionDate: row.completion_date,
            overallScore: row.overall_score,
            prerequisitesMet: row.prerequisites_met
        }));
    }

    /**
     * Get course progression path for a language
     */
    async getCourseProgression(languageCode, userId = null) {
        const queryText = `
            SELECT 
                c.*,
                l.name as language_name,
                l.code as language_code,
                COALESCE(cp.status, 'not_started') as enrollment_status,
                cp.completion_date,
                cp.overall_score,
                cp.skills_completed,
                cp.skills_total,
                ROUND((cp.skills_completed::decimal / NULLIF(cp.skills_total, 0) * 100), 1) as completion_percentage
            FROM courses c
            JOIN languages l ON c.language_id = l.id
            LEFT JOIN course_progress cp ON c.id = cp.course_id AND cp.user_id = $2
            WHERE l.code = $1 AND c.is_active = true
            ORDER BY c.level
        `;

        const result = await query(queryText, [languageCode, userId]);
        
        const progression = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            code: row.code,
            level: row.level,
            cefrLevel: row.cefr_level,
            estimatedHours: row.estimated_hours,
            enrollmentStatus: row.enrollment_status,
            completionDate: row.completion_date,
            overallScore: row.overall_score,
            skillsCompleted: row.skills_completed || 0,
            skillsTotal: row.skills_total || 0,
            completionPercentage: row.completion_percentage || 0
        }));

        return {
            language: result.rows[0] ? {
                code: result.rows[0].language_code,
                name: result.rows[0].language_name
            } : null,
            courses: progression,
            totalCourses: progression.length,
            completedCourses: progression.filter(c => c.enrollmentStatus === 'completed').length
        };
    }

    /**
     * Check if user can enroll in a course
     */
    async canEnrollInCourse(userId, courseId) {
        // Get course details and prerequisites
        const courseResult = await query(`
            SELECT c.*, l.name as language_name
            FROM courses c
            JOIN languages l ON c.language_id = l.id
            WHERE c.id = $1
        `, [courseId]);

        if (courseResult.rows.length === 0) {
            return { canEnroll: false, reason: 'Course not found' };
        }

        const course = courseResult.rows[0];

        // Check if already enrolled
        const enrollmentResult = await query(`
            SELECT status FROM course_progress
            WHERE user_id = $1 AND course_id = $2
        `, [userId, courseId]);

        if (enrollmentResult.rows.length > 0) {
            const status = enrollmentResult.rows[0].status;
            return { 
                canEnroll: false, 
                reason: `Already ${status} in this course`,
                currentStatus: status
            };
        }

        // Check prerequisites
        if (course.prerequisites && course.prerequisites.length > 0) {
            const prerequisiteResult = await query(`
                SELECT 
                    COUNT(*) as total_prerequisites,
                    COUNT(CASE WHEN cp.status = 'completed' THEN 1 END) as completed_prerequisites
                FROM unnest($1::uuid[]) AS prereq_id
                LEFT JOIN course_progress cp ON cp.course_id = prereq_id 
                    AND cp.user_id = $2
            `, [course.prerequisites, userId]);

            const { total_prerequisites, completed_prerequisites } = prerequisiteResult.rows[0];
            
            if (parseInt(completed_prerequisites) < parseInt(total_prerequisites)) {
                const missingCount = parseInt(total_prerequisites) - parseInt(completed_prerequisites);
                return { 
                    canEnroll: false, 
                    reason: `Missing ${missingCount} prerequisite course(s)`,
                    missingPrerequisites: missingCount
                };
            }
        }

        return { 
            canEnroll: true, 
            course: {
                id: course.id,
                name: course.name,
                level: course.level,
                language: course.language_name
            }
        };
    }

    /**
     * Get next recommended course for a user in a language
     */
    async getNextRecommendedCourse(userId, languageCode) {
        const progression = await this.getCourseProgression(languageCode, userId);
        
        if (!progression.courses || progression.courses.length === 0) {
            return { nextCourse: null, reason: 'No courses available for this language' };
        }

        // Find first course that's not completed
        for (const course of progression.courses) {
            if (course.enrollmentStatus === 'not_started') {
                const canEnroll = await this.canEnrollInCourse(userId, course.id);
                if (canEnroll.canEnroll) {
                    return { 
                        nextCourse: course,
                        reason: `Continue with ${course.name}`
                    };
                }
            } else if (course.enrollmentStatus === 'in_progress') {
                return { 
                    nextCourse: course,
                    reason: `Resume ${course.name}`
                };
            }
        }

        // All courses completed
        const completedCount = progression.courses.filter(c => c.enrollmentStatus === 'completed').length;
        if (completedCount === progression.courses.length) {
            return { 
                nextCourse: null, 
                reason: `Congratulations! You've completed all ${completedCount} courses in ${progression.language.name}`
            };
        }

        return { 
            nextCourse: null, 
            reason: 'Prerequisites not met for remaining courses'
        };
    }

    /**
     * Update course progress when user completes lessons/skills
     */
    async updateCourseProgress(userId, courseId, completedSkillId = null) {
        // Get current progress
        const progressResult = await query(`
            SELECT * FROM course_progress
            WHERE user_id = $1 AND course_id = $2
        `, [userId, courseId]);

        if (progressResult.rows.length === 0) {
            console.warn(`No course progress record found for user ${userId}, course ${courseId}`);
            return null;
        }

        const currentProgress = progressResult.rows[0];

        // Count total completed skills for this course
        const skillsResult = await query(`
            SELECT 
                COUNT(DISTINCT cs.skill_id) as total_skills,
                COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN cs.skill_id END) as completed_skills
            FROM course_skills cs
            LEFT JOIN user_progress up ON cs.skill_id = up.skill_id AND up.user_id = $1
            WHERE cs.course_id = $2
        `, [userId, courseId]);

        const { total_skills, completed_skills } = skillsResult.rows[0];
        const completedCount = parseInt(completed_skills);
        const totalCount = parseInt(total_skills);

        // Determine new course status
        let newStatus = currentProgress.status;
        let completionDate = currentProgress.completion_date;

        if (completedCount === 0) {
            newStatus = 'not_started';
        } else if (completedCount < totalCount) {
            newStatus = 'in_progress';
        } else if (completedCount === totalCount) {
            newStatus = 'completed';
            completionDate = completionDate || new Date().toISOString();
        }

        // Update progress record
        const updatedProgress = await db.update('course_progress', {
            skills_completed: completedCount,
            skills_total: totalCount,
            status: newStatus,
            completion_date: completionDate,
            last_accessed: new Date().toISOString()
        }, { 
            user_id: userId, 
            course_id: courseId 
        });

        console.log(`Updated course progress: ${completedCount}/${totalCount} skills completed (${newStatus})`);
        return updatedProgress;
    }

    /**
     * Get course certificate eligibility
     */
    async getCertificateEligibility(userId, courseId) {
        const progressResult = await query(`
            SELECT 
                cp.*,
                c.name as course_name,
                c.code as course_code,
                l.name as language_name
            FROM course_progress cp
            JOIN courses c ON cp.course_id = c.id
            JOIN languages l ON c.language_id = l.id
            WHERE cp.user_id = $1 AND cp.course_id = $2
        `, [userId, courseId]);

        if (progressResult.rows.length === 0) {
            return { eligible: false, reason: 'Not enrolled in course' };
        }

        const progress = progressResult.rows[0];

        if (progress.status !== 'completed') {
            return { 
                eligible: false, 
                reason: 'Course not completed',
                progress: `${progress.skills_completed}/${progress.skills_total} skills completed`
            };
        }

        // Check assessment requirements (optional - courses can be completed without assessments)
        const assessmentResult = await query(`
            SELECT 
                COUNT(*) as total_assessments,
                COUNT(CASE WHEN ua.passed = true THEN 1 END) as passed_assessments
            FROM assessments a
            LEFT JOIN user_assessments ua ON a.id = ua.assessment_id AND ua.user_id = $1
            WHERE a.course_id = $2 AND a.is_active = true
        `, [userId, courseId]);

        const { total_assessments, passed_assessments } = assessmentResult.rows[0];

        return {
            eligible: true,
            course: {
                name: progress.course_name,
                code: progress.course_code,
                language: progress.language_name
            },
            completionDate: progress.completion_date,
            overallScore: progress.overall_score,
            assessmentsPassed: `${passed_assessments}/${total_assessments}`,
            alreadyIssued: progress.certificate_issued
        };
    }
}

module.exports = CourseProgression;