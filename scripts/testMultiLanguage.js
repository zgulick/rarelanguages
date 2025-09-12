#!/usr/bin/env node

require('dotenv').config();
const { OpenAIClient } = require('../lib/openai');
const db = require('../lib/database');

/**
 * Multi-Language Curriculum Generation Test
 * Tests the scalability of the current system with additional rare languages
 */

class MultiLanguageTest {
    constructor() {
        this.openaiClient = new OpenAIClient();
    }

    async testLanguageGeneration(languageCode, languageName, nativeName) {
        console.log(`🌍 Testing curriculum generation for: ${languageName} (${nativeName})`);
        
        try {
            // 1. Insert test language
            const languageId = await this.insertTestLanguage(languageCode, languageName, nativeName);
            console.log(`✅ Language inserted with ID: ${languageId}`);
            
            // 2. Generate basic skills structure
            const skills = await this.generateBasicSkills(languageId, languageName);
            console.log(`✅ Generated ${skills.length} skills`);
            
            // 3. Generate sample lessons for first skill
            const lessons = await this.generateSampleLessons(skills[0], languageName);
            console.log(`✅ Generated ${lessons.length} lessons for "${skills[0].name}"`);
            
            // 4. Generate sample content for first lesson
            const content = await this.generateSampleContent(lessons[0], languageName, nativeName);
            console.log(`✅ Generated ${content.length} content items for "${lessons[0].name}"`);
            
            return {
                languageId,
                skills: skills.length,
                lessons: lessons.length,
                content: content.length,
                success: true
            };
            
        } catch (error) {
            console.error(`❌ Error testing ${languageName}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async insertTestLanguage(code, name, nativeName) {
        // Check if language already exists
        const existing = await db.query('SELECT id FROM languages WHERE code = $1', [code]);
        if (existing.rows.length > 0) {
            return existing.rows[0].id;
        }
        
        const result = await db.query(`
            INSERT INTO languages (code, name, native_name, active) 
            VALUES ($1, $2, $3, true) 
            RETURNING id
        `, [code, name, nativeName]);
        
        return result.rows[0].id;
    }

    async generateBasicSkills(languageId, languageName) {
        const prompt = `Generate a basic skill progression for learning ${languageName} as a foreign language. 
        
        Create 6 foundational skills following language learning best practices:
        - Start with absolute basics (greetings, basic words)
        - Progress logically through fundamental concepts
        - Include cultural context appropriate to the language
        - Use CEFR A1 level progression
        
        Return JSON array format:
        [
            {
                "name": "Greetings & Basics",
                "description": "Essential greetings and basic vocabulary",
                "position": 1,
                "cefr_level": "A1",
                "prerequisites": []
            }
        ]`;

        const response = await this.openaiClient.makeRequest([
            { role: 'system', content: 'You are an expert language curriculum designer.' },
            { role: 'user', content: prompt }
        ], 'skill-generation');

        let skillsData;
        try {
            let cleanContent = response.content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
            }
            skillsData = JSON.parse(cleanContent);
        } catch (parseError) {
            console.error('Failed to parse skills response:', parseError);
            throw new Error('Invalid JSON response for skills generation');
        }

        // Insert skills into database
        const skills = [];
        for (const skillData of skillsData) {
            const result = await db.query(`
                INSERT INTO skills (
                    language_id, name, description, position, 
                    prerequisites, cefr_level, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, true) 
                RETURNING *
            `, [
                languageId,
                skillData.name,
                skillData.description,
                skillData.position,
                JSON.stringify(skillData.prerequisites),
                skillData.cefr_level
            ]);
            
            skills.push(result.rows[0]);
        }

        return skills;
    }

    async generateSampleLessons(skill, languageName) {
        const prompt = `Generate 3 lessons for the "${skill.name}" skill in ${languageName} learning.
        
        Context: ${skill.description}
        CEFR Level: ${skill.cefr_level}
        
        Create lessons that:
        - Build progressively in difficulty
        - Focus on practical, everyday usage
        - Are appropriate for adult learners
        
        Return JSON array:
        [
            {
                "name": "Basic Greetings",
                "position": 1,
                "difficulty_level": 1,
                "estimated_minutes": 15,
                "prerequisites": []
            }
        ]`;

        const response = await this.openaiClient.makeRequest([
            { role: 'system', content: 'You are an expert language lesson designer.' },
            { role: 'user', content: prompt }
        ], 'lesson-generation');

        let lessonsData;
        try {
            let cleanContent = response.content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
            }
            lessonsData = JSON.parse(cleanContent);
        } catch (parseError) {
            console.error('Failed to parse lessons response:', parseError);
            throw new Error('Invalid JSON response for lessons generation');
        }

        // Insert lessons into database
        const lessons = [];
        for (const lessonData of lessonsData) {
            const result = await db.query(`
                INSERT INTO lessons (
                    skill_id, name, position, difficulty_level, 
                    estimated_minutes, prerequisites, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, true) 
                RETURNING *
            `, [
                skill.id,
                lessonData.name,
                lessonData.position,
                lessonData.difficulty_level,
                lessonData.estimated_minutes,
                JSON.stringify(lessonData.prerequisites)
            ]);
            
            lessons.push(result.rows[0]);
        }

        return lessons;
    }

    async generateSampleContent(lesson, languageName, nativeName) {
        const prompt = `Generate 5 basic lesson content items for "${lesson.name}" in ${languageName} (${nativeName}).
        
        Create practical phrases that:
        - Are commonly used in daily life
        - Are appropriate for beginners
        - Include pronunciation guidance for English speakers
        - Have cultural context where relevant
        
        Return JSON array:
        [
            {
                "english_phrase": "Hello",
                "target_phrase": "[translation in ${nativeName}]",
                "pronunciation_guide": "[phonetic guide for English speakers]",
                "cultural_context": "[brief cultural note if relevant]",
                "difficulty_score": 1,
                "exercise_types": ["flashcard", "audio"]
            }
        ]`;

        const response = await this.openaiClient.makeRequest([
            { role: 'system', content: `You are an expert in ${languageName} language and culture.` },
            { role: 'user', content: prompt }
        ], 'content-generation');

        let contentData;
        try {
            let cleanContent = response.content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
            }
            contentData = JSON.parse(cleanContent);
        } catch (parseError) {
            console.error('Failed to parse content response:', parseError);
            throw new Error('Invalid JSON response for content generation');
        }

        // Insert content into database
        const contentItems = [];
        for (const itemData of contentData) {
            const result = await db.query(`
                INSERT INTO lesson_content (
                    lesson_id, english_phrase, target_phrase, 
                    pronunciation_guide, cultural_context, difficulty_score, 
                    exercise_types
                ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
                RETURNING *
            `, [
                lesson.id,
                itemData.english_phrase,
                itemData.target_phrase,
                itemData.pronunciation_guide,
                itemData.cultural_context,
                itemData.difficulty_score,
                JSON.stringify(itemData.exercise_types)
            ]);
            
            contentItems.push(result.rows[0]);
        }

        return contentItems;
    }

    async runMultiLanguageTest() {
        console.log('🚀 Starting Multi-Language Curriculum Generation Test\n');
        
        const testLanguages = [
            { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },
            { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
            { code: 'mi', name: 'Māori', nativeName: 'Te Reo Māori' }
        ];

        const results = [];
        
        for (const lang of testLanguages) {
            console.log(`\n${'='.repeat(50)}`);
            const result = await this.testLanguageGeneration(lang.code, lang.name, lang.nativeName);
            results.push({ language: lang, result });
            
            // Brief pause to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Summary
        console.log(`\n${'='.repeat(50)}`);
        console.log('📊 MULTI-LANGUAGE TEST SUMMARY');
        console.log(`${'='.repeat(50)}`);
        
        results.forEach(({ language, result }) => {
            if (result.success) {
                console.log(`✅ ${language.name}: Skills(${result.skills}) Lessons(${result.lessons}) Content(${result.content})`);
            } else {
                console.log(`❌ ${language.name}: ${result.error}`);
            }
        });

        const successCount = results.filter(r => r.result.success).length;
        console.log(`\n🎯 Success Rate: ${successCount}/${testLanguages.length} (${Math.round(successCount/testLanguages.length*100)}%)`);
        
        return results;
    }
}

// CLI Interface
async function main() {
    try {
        const tester = new MultiLanguageTest();
        await tester.runMultiLanguageTest();
        
    } catch (error) {
        console.error('❌ Multi-language test failed:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

if (require.main === module) {
    main();
}

module.exports = { MultiLanguageTest };