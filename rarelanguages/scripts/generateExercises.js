#!/usr/bin/env node

require('dotenv').config();
const { OpenAIClient } = require('../lib/openai');
const db = require('../lib/database');

/**
 * Dynamic Exercise Generation System
 * This script generates practice exercises using OpenAI for any topic/language
 */

class ExerciseGenerator {
    constructor() {
        this.openaiClient = new OpenAIClient();
        this.costs = {
            total: 0,
            exerciseGeneration: 0
        };
    }

    async generateExercisesForTopic(topicId, count = 10, difficulty = null, exerciseTypes = null, specialInstructions = '') {
        try {
            console.log(`🎯 Starting exercise generation for topic ID: ${topicId}`);
            
            // Get topic and language details
            const topicQuery = `
                SELECT t.*, l.name as language_name, l.native_name, l.code as language_code
                FROM topics t
                JOIN languages l ON t.language_id = l.id
                WHERE t.id = $1
            `;
            
            const topicResult = await db.query(topicQuery, [topicId]);
            if (topicResult.rows.length === 0) {
                throw new Error(`Topic with ID ${topicId} not found`);
            }

            const topic = topicResult.rows[0];
            console.log(`📚 Topic: ${topic.name} (${topic.language_name})`);
            
            // Create generation request record
            const requestId = await this.createGenerationRequest(topic, count, difficulty, exerciseTypes, specialInstructions);
            
            // Generate exercises in batches to avoid token limits
            const batchSize = 5;
            const batches = Math.ceil(count / batchSize);
            let totalGenerated = 0;
            
            for (let batch = 0; batch < batches; batch++) {
                const batchCount = Math.min(batchSize, count - totalGenerated);
                console.log(`⚡ Generating batch ${batch + 1}/${batches} (${batchCount} exercises)`);
                
                try {
                    const exercises = await this.generateExerciseBatch(
                        topic, 
                        batchCount, 
                        difficulty || topic.difficulty,
                        exerciseTypes,
                        specialInstructions
                    );
                    
                    // Save exercises to database
                    await this.saveExercises(exercises, topic.id, topic.language_id);
                    totalGenerated += exercises.length;
                    
                    console.log(`✅ Generated ${exercises.length} exercises (Total: ${totalGenerated})`);
                    
                } catch (error) {
                    console.error(`❌ Error generating batch ${batch + 1}:`, error.message);
                    // Continue with other batches
                }
            }
            
            // Update generation request
            await this.completeGenerationRequest(requestId, totalGenerated);
            
            console.log(`🎉 Exercise generation completed! Generated ${totalGenerated}/${count} exercises`);
            console.log(`💰 Total cost: $${this.costs.total.toFixed(4)}`);
            
            return totalGenerated;
            
        } catch (error) {
            console.error('❌ Exercise generation failed:', error);
            throw error;
        }
    }

    async generateExerciseBatch(topic, count, difficulty, exerciseTypes = null, specialInstructions = '') {
        const defaultTypes = ['translation', 'conjugation', 'phrase-complete', 'multiple-choice'];
        const types = exerciseTypes || defaultTypes;
        
        const prompt = this.buildGenerationPrompt(topic, count, difficulty, types, specialInstructions);
        
        console.log('🤖 Sending request to OpenAI...');
        const response = await this.openaiClient.makeRequest([
            { role: 'system', content: 'You are an expert language teacher and exercise creator specializing in Albanian language instruction for family integration.' },
            { role: 'user', content: prompt }
        ], 'exercise-generation');
        
        // Track costs
        this.costs.exerciseGeneration += 0.02; // Approximate cost
        this.costs.total += 0.02;
        
        // Parse and clean the response
        let exercises;
        try {
            let cleanContent = response.content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
            }
            exercises = JSON.parse(cleanContent);
        } catch (parseError) {
            console.error('❌ Failed to parse OpenAI response:', parseError);
            console.error('Raw response:', response.content.substring(0, 500));
            throw new Error('Invalid JSON response from OpenAI');
        }
        
        // Validate exercises
        return this.validateAndCleanExercises(exercises, difficulty);
    }

    buildGenerationPrompt(topic, count, difficulty, types, specialInstructions) {
        const difficultyMap = {
            1: 'Beginner (basic words, simple present tense)',
            2: 'Elementary (common phrases, basic past/future)',
            3: 'Intermediate (complex sentences, subjunctive)',
            4: 'Advanced (idioms, complex grammar)',
            5: 'Expert (literary expressions, dialectal variations)'
        };

        return `Generate ${count} Albanian language practice exercises for the topic: "${topic.name}"

CONTEXT:
- Language: ${topic.language_name} (${topic.native_name})
- Description: ${topic.description}
- Difficulty Level: ${difficulty} - ${difficultyMap[difficulty]}
- Learning Objectives: ${JSON.stringify(topic.learning_objectives)}
- Target Audience: Adults learning Albanian for family integration

EXERCISE TYPES TO INCLUDE: ${types.join(', ')}

EXERCISE TYPE DEFINITIONS:
1. translation: English phrase → Albanian translation (multiple choice)
2. conjugation: Fill in correct verb form for given person/tense
3. phrase-complete: Complete Albanian phrase (multiple choice)
4. multiple-choice: General knowledge questions about the topic

SPECIAL INSTRUCTIONS: ${specialInstructions}

CULTURAL CONTEXT:
- Focus on family integration scenarios
- Include culturally appropriate expressions
- Consider formal vs informal register (ju vs ti)
- Include cultural notes where relevant

OUTPUT FORMAT (JSON):
[
  {
    "exercise_type": "translation|conjugation|phrase-complete|multiple-choice",
    "difficulty": ${difficulty},
    "question_text": "English question or prompt",
    "correct_answer": "Correct Albanian answer",
    "options": ["option1", "option2", "option3", "correct_answer"], // For multiple choice
    "explanation": "Why this is correct (optional)",
    "cultural_notes": "Cultural context if relevant",
    "tags": ["tag1", "tag2"], // For organization
    "ai_confidence_score": 0.95 // How confident you are (0.0-1.0)
  }
]

EXAMPLE EXERCISES:
Translation: "Good morning!" → "Mirëmëngjes!"
Conjugation: "I speak (flas) Albanian" → "Unë ___ shqip" (Answer: flas)
Phrase-complete: "Faleminderit ___" → ["shumë", "mirë", "pak"] (Answer: shumë)

Generate exercises that are:
- Practical for daily family life
- Grammatically correct
- Culturally appropriate
- Progressively challenging within the difficulty level
- Focused on the topic: ${topic.name}

Return ONLY valid JSON array, no additional text.`;
    }

    validateAndCleanExercises(exercises, targetDifficulty) {
        if (!Array.isArray(exercises)) {
            console.warn('⚠️ Response is not an array, attempting to extract...');
            exercises = [exercises];
        }

        return exercises
            .filter(ex => {
                // Basic validation
                if (!ex.exercise_type || !ex.question_text || !ex.correct_answer) {
                    console.warn('⚠️ Skipping invalid exercise:', ex);
                    return false;
                }
                return true;
            })
            .map(ex => ({
                ...ex,
                difficulty: ex.difficulty || targetDifficulty,
                options: ex.options || [],
                tags: ex.tags || [],
                ai_confidence_score: ex.ai_confidence_score || 0.8,
                cultural_notes: ex.cultural_notes || null,
                explanation: ex.explanation || null
            }));
    }

    async saveExercises(exercises, topicId, languageId) {
        const query = `
            INSERT INTO exercises (
                language_id, topic_id, exercise_type, difficulty, question_text,
                correct_answer, options, explanation, cultural_notes, tags,
                ai_confidence_score, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;

        for (const exercise of exercises) {
            await db.query(query, [
                languageId,
                topicId,
                exercise.exercise_type,
                exercise.difficulty,
                exercise.question_text,
                exercise.correct_answer,
                JSON.stringify(exercise.options),
                exercise.explanation,
                exercise.cultural_notes,
                JSON.stringify(exercise.tags),
                exercise.ai_confidence_score,
                true
            ]);
        }
    }

    async createGenerationRequest(topic, count, difficulty, exerciseTypes, specialInstructions) {
        const query = `
            INSERT INTO exercise_generation_requests (
                language_id, topic_id, requested_count, difficulty_level,
                exercise_types, special_instructions, status
            ) VALUES ($1, $2, $3, $4, $5, $6, 'processing') RETURNING id
        `;
        
        const result = await db.query(query, [
            topic.language_id,
            topic.id,
            count,
            difficulty,
            JSON.stringify(exerciseTypes),
            specialInstructions
        ]);
        
        return result.rows[0].id;
    }

    async completeGenerationRequest(requestId, generatedCount) {
        const query = `
            UPDATE exercise_generation_requests 
            SET generated_count = $1, status = 'completed', 
                completed_at = NOW(), generation_cost_usd = $2
            WHERE id = $3
        `;
        
        await db.query(query, [generatedCount, this.costs.total, requestId]);
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
🎯 Dynamic Exercise Generator

Usage:
  node scripts/generateExercises.js --topic "Days of the Week" --count 15
  node scripts/generateExercises.js --topic-id uuid-here --count 10 --difficulty 3
  node scripts/generateExercises.js --list-topics

Options:
  --topic <name>           Topic name to generate exercises for
  --topic-id <uuid>        Direct topic UUID
  --count <number>         Number of exercises to generate (default: 10)
  --difficulty <1-5>       Override topic difficulty
  --types <types>          Exercise types (comma-separated)
  --instructions <text>    Special generation instructions
  --list-topics            Show available topics
        `);
        process.exit(0);
    }

    try {
        const generator = new ExerciseGenerator();
        
        if (args.includes('--list-topics')) {
            await listTopics();
            return;
        }
        
        const topicName = getArgValue(args, '--topic');
        const topicId = getArgValue(args, '--topic-id');
        const count = parseInt(getArgValue(args, '--count') || '10');
        const difficultyStr = getArgValue(args, '--difficulty');
        const difficulty = difficultyStr ? parseInt(difficultyStr) : null;
        const typesStr = getArgValue(args, '--types');
        const instructions = getArgValue(args, '--instructions') || '';
        
        const types = typesStr ? typesStr.split(',').map(t => t.trim()) : null;
        
        let finalTopicId = topicId;
        
        if (!finalTopicId && topicName) {
            // Find topic by name
            const result = await db.query('SELECT id FROM topics WHERE name ILIKE $1', [topicName]);
            if (result.rows.length === 0) {
                console.error(`❌ Topic "${topicName}" not found. Use --list-topics to see available topics.`);
                process.exit(1);
            }
            finalTopicId = result.rows[0].id;
        }
        
        if (!finalTopicId) {
            console.error('❌ Please provide either --topic or --topic-id');
            process.exit(1);
        }
        
        await generator.generateExercisesForTopic(
            finalTopicId, 
            count, 
            difficulty, 
            types, 
            instructions
        );
        
    } catch (error) {
        console.error('❌ Generation failed:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

async function listTopics() {
    console.log('\n📚 Available Topics:');
    const result = await db.query(`
        SELECT t.id, t.name, t.difficulty, l.name as language_name,
               COUNT(e.id) as exercise_count
        FROM topics t
        JOIN languages l ON t.language_id = l.id
        LEFT JOIN exercises e ON t.id = e.topic_id AND e.is_active = true
        WHERE t.is_active = true
        GROUP BY t.id, t.name, t.difficulty, l.name
        ORDER BY l.name, t.difficulty, t.name
    `);
    
    result.rows.forEach(topic => {
        console.log(`  ${topic.name} (${topic.language_name})`);
        console.log(`    ID: ${topic.id}`);
        console.log(`    Difficulty: ${topic.difficulty}/5`);
        console.log(`    Exercises: ${topic.exercise_count}`);
        console.log('');
    });
}

function getArgValue(args, flag) {
    const index = args.indexOf(flag);
    return index !== -1 && index + 1 < args.length ? args[index + 1] : null;
}

if (require.main === module) {
    main();
}

module.exports = { ExerciseGenerator };