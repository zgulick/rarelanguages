/**
 * Dynamic Exercise API Routes
 * Provides endpoints for managing topics and exercises
 */

const express = require('express');
const router = express.Router();
const db = require('../lib/database');
const { ExerciseGenerator } = require('../scripts/generateExercises');

/**
 * GET /api/exercises/topics
 * Get all available topics for a language
 */
router.get('/topics', async (req, res) => {
    try {
        const { language = 'gheg-al', includeCount = 'true' } = req.query;
        
        let query = `
            SELECT t.id, t.name, t.slug, t.description, t.difficulty, 
                   t.learning_objectives, l.name as language_name, l.code as language_code
        `;
        
        if (includeCount === 'true') {
            query += `, COUNT(e.id) as exercise_count`;
        }
        
        query += `
            FROM topics t
            JOIN languages l ON t.language_id = l.id
        `;
        
        if (includeCount === 'true') {
            query += `LEFT JOIN exercises e ON t.id = e.topic_id AND e.is_active = true`;
        }
        
        query += `
            WHERE t.is_active = true AND l.code = $1
        `;
        
        if (includeCount === 'true') {
            query += `GROUP BY t.id, t.name, t.slug, t.description, t.difficulty, t.learning_objectives, l.name, l.code`;
        }
        
        query += ` ORDER BY t.difficulty, t.name`;
        
        const result = await db.query(query, [language]);
        
        res.json({
            success: true,
            topics: result.rows.map(topic => ({
                ...topic,
                learning_objectives: topic.learning_objectives || [],
                exercise_count: parseInt(topic.exercise_count) || 0
            }))
        });
        
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch topics'
        });
    }
});

/**
 * GET /api/exercises/stats
 * Get statistics about exercises and topics
 */
router.get('/stats', async (req, res) => {
    try {
        const { language = 'gheg-al' } = req.query;
        
        const [topicsResult, exercisesResult, generationResult] = await Promise.all([
            db.query(`
                SELECT COUNT(*) as total_topics,
                       AVG(difficulty) as avg_difficulty
                FROM topics t
                JOIN languages l ON t.language_id = l.id
                WHERE t.is_active = true AND l.code = $1
            `, [language]),
            
            db.query(`
                SELECT COUNT(*) as total_exercises,
                       COUNT(DISTINCT exercise_type) as exercise_types,
                       AVG(ai_confidence_score) as avg_confidence
                FROM exercises e
                JOIN languages l ON e.language_id = l.id
                WHERE e.is_active = true AND l.code = $1
            `, [language]),
            
            db.query(`
                SELECT COUNT(*) as total_requests,
                       SUM(generated_count) as total_generated,
                       SUM(generation_cost_usd) as total_cost
                FROM exercise_generation_requests egr
                JOIN languages l ON egr.language_id = l.id
                WHERE l.code = $1
            `, [language])
        ]);
        
        res.json({
            success: true,
            stats: {
                topics: {
                    total: parseInt(topicsResult.rows[0].total_topics),
                    avgDifficulty: parseFloat(topicsResult.rows[0].avg_difficulty) || 0
                },
                exercises: {
                    total: parseInt(exercisesResult.rows[0].total_exercises),
                    types: parseInt(exercisesResult.rows[0].exercise_types),
                    avgConfidence: parseFloat(exercisesResult.rows[0].avg_confidence) || 0
                },
                generation: {
                    totalRequests: parseInt(generationResult.rows[0].total_requests),
                    totalGenerated: parseInt(generationResult.rows[0].total_generated),
                    totalCost: parseFloat(generationResult.rows[0].total_cost) || 0
                }
            }
        });
        
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

/**
 * GET /api/exercises/generation/status
 * Get status of exercise generation requests
 */
router.get('/generation/status', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        
        const result = await db.query(`
            SELECT egr.*, t.name as topic_name, l.name as language_name
            FROM exercise_generation_requests egr
            JOIN topics t ON egr.topic_id = t.id
            JOIN languages l ON egr.language_id = l.id
            ORDER BY egr.created_at DESC
            LIMIT $1
        `, [parseInt(limit)]);
        
        res.json({
            success: true,
            requests: result.rows
        });
        
    } catch (error) {
        console.error('Error fetching generation status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch generation status'
        });
    }
});

/**
 * GET /api/exercises/:topicSlug
 * Get exercises for a specific topic
 */
router.get('/:topicSlug', async (req, res) => {
    try {
        const { topicSlug } = req.params;
        const { 
            language = 'gheg-al', 
            limit = 10, 
            difficulty = null,
            exerciseType = null,
            includeInactive = 'false'
        } = req.query;
        
        let query = `
            SELECT e.*, t.name as topic_name, t.slug as topic_slug
            FROM exercises e
            JOIN topics t ON e.topic_id = t.id
            JOIN languages l ON e.language_id = l.id
            WHERE t.slug = $1 AND l.code = $2
        `;
        
        const queryParams = [topicSlug, language];
        let paramIndex = 3;
        
        if (includeInactive !== 'true') {
            query += ` AND e.is_active = true`;
        }
        
        if (difficulty) {
            query += ` AND e.difficulty = $${paramIndex}`;
            queryParams.push(parseInt(difficulty));
            paramIndex++;
        }
        
        if (exerciseType) {
            query += ` AND e.exercise_type = $${paramIndex}`;
            queryParams.push(exerciseType);
            paramIndex++;
        }
        
        query += ` ORDER BY e.difficulty, e.created_at LIMIT $${paramIndex}`;
        queryParams.push(parseInt(limit));
        
        const result = await db.query(query, queryParams);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No exercises found for this topic'
            });
        }
        
        res.json({
            success: true,
            exercises: result.rows.map(exercise => ({
                ...exercise,
                options: exercise.options || [],
                tags: exercise.tags || []
            }))
        });
        
    } catch (error) {
        console.error('Error fetching exercises:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch exercises'
        });
    }
});

/**
 * POST /api/exercises/generate
 * Generate new exercises for a topic (Admin endpoint)
 */
router.post('/generate', async (req, res) => {
    try {
        const { 
            topicId, 
            topicName, 
            count = 10, 
            difficulty = null,
            exerciseTypes = null,
            specialInstructions = ''
        } = req.body;
        
        if (!topicId && !topicName) {
            return res.status(400).json({
                success: false,
                error: 'Either topicId or topicName is required'
            });
        }
        
        let finalTopicId = topicId;
        
        // Find topic by name if ID not provided
        if (!finalTopicId && topicName) {
            const topicResult = await db.query('SELECT id FROM topics WHERE name ILIKE $1', [topicName]);
            if (topicResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: `Topic "${topicName}" not found`
                });
            }
            finalTopicId = topicResult.rows[0].id;
        }
        
        // Start generation asynchronously
        const generator = new ExerciseGenerator();
        
        // Don't await - return immediately and generate in background
        generator.generateExercisesForTopic(
            finalTopicId, 
            parseInt(count), 
            difficulty ? parseInt(difficulty) : null,
            exerciseTypes,
            specialInstructions
        ).catch(error => {
            console.error('Background exercise generation failed:', error);
        });
        
        res.json({
            success: true,
            message: `Started generating ${count} exercises for topic`,
            topicId: finalTopicId,
            estimatedTime: `${Math.ceil(parseInt(count) / 5) * 30} seconds`
        });
        
    } catch (error) {
        console.error('Error starting exercise generation:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start exercise generation'
        });
    }
});

/**
 * POST /api/exercises/topics
 * Create a new topic (Admin endpoint)
 */
router.post('/topics', async (req, res) => {
    try {
        const { 
            name, 
            description, 
            difficulty = 1, 
            learningObjectives = [],
            language = 'gheg-al'
        } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Topic name is required'
            });
        }
        
        // Get language ID
        const languageResult = await db.query('SELECT id FROM languages WHERE code = $1', [language]);
        if (languageResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                error: `Language "${language}" not found`
            });
        }
        
        const languageId = languageResult.rows[0].id;
        
        // Insert new topic (slug will be auto-generated by trigger)
        const result = await db.query(`
            INSERT INTO topics (language_id, name, description, difficulty, learning_objectives)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [languageId, name, description, parseInt(difficulty), JSON.stringify(learningObjectives)]);
        
        const topic = result.rows[0];
        
        res.status(201).json({
            success: true,
            message: 'Topic created successfully',
            topic: {
                ...topic,
                learning_objectives: topic.learning_objectives || []
            }
        });
        
    } catch (error) {
        console.error('Error creating topic:', error);
        
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({
                success: false,
                error: 'A topic with this name already exists for this language'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Failed to create topic'
        });
    }
});

module.exports = router;