/**
 * Freshman-Level Albanian Content Generator
 *
 * Generates age-appropriate Albanian content for high school freshman (ages 14-16)
 * Following the quality criteria and curriculum progression guidelines
 */

const fs = require('fs');
const path = require('path');
const { query } = require('../lib/database');

// Load our quality criteria and curriculum progression
const criteriaPath = path.join(__dirname, '..', 'data', 'freshman_content_criteria.json');
const progressionPath = path.join(__dirname, '..', 'data', 'freshman_curriculum_progression.json');

const qualityCriteria = JSON.parse(fs.readFileSync(criteriaPath, 'utf8'));
const curriculumProgression = JSON.parse(fs.readFileSync(progressionPath, 'utf8'));

class FreshmanContentGenerator {
    constructor() {
        this.forbiddenEnglishWords = new Set(qualityCriteria.content_guidelines.vocabulary_criteria.forbidden_words_english);
        this.forbiddenAlbanianWords = new Set(qualityCriteria.content_guidelines.vocabulary_criteria.forbidden_words_albanian);
        this.allowedVocabCategories = qualityCriteria.content_guidelines.vocabulary_criteria.allowed_vocabulary_categories;
        this.maxWordsPerPhrase = qualityCriteria.content_guidelines.vocabulary_criteria.max_unique_words_per_phrase;
        this.maxCharacters = qualityCriteria.content_guidelines.vocabulary_criteria.max_phrase_length_characters;

        // Initialize unit-specific vocabulary from curriculum progression
        this.unitVocabulary = this.extractUnitVocabulary();
    }

    extractUnitVocabulary() {
        const vocab = {};
        Object.entries(curriculumProgression.unit_progression).forEach(([unitKey, unitData]) => {
            const unitNumber = parseInt(unitKey.split('_')[1]);
            vocab[unitNumber] = {
                key_vocabulary: unitData.key_vocabulary || [],
                sample_phrases: unitData.sample_phrases || [],
                grammar_focus: unitData.grammar_focus || [],
                cultural_contexts: unitData.cultural_contexts || []
            };
        });
        return vocab;
    }

    /**
     * Validate if content meets freshman quality criteria
     */
    validateContent(englishText, albanianText) {
        const issues = [];

        // Check word count
        const englishWords = englishText.split(/\s+/).length;
        const albanianWords = albanianText.split(/\s+/).length;

        if (englishWords > this.maxWordsPerPhrase) {
            issues.push(`English has ${englishWords} words, max is ${this.maxWordsPerPhrase}`);
        }
        if (albanianWords > this.maxWordsPerPhrase) {
            issues.push(`Albanian has ${albanianWords} words, max is ${this.maxWordsPerPhrase}`);
        }

        // Check character length
        if (englishText.length > this.maxCharacters) {
            issues.push(`English has ${englishText.length} characters, max is ${this.maxCharacters}`);
        }
        if (albanianText.length > this.maxCharacters) {
            issues.push(`Albanian has ${albanianText.length} characters, max is ${this.maxCharacters}`);
        }

        // Check for forbidden vocabulary
        const englishWordsLower = englishText.toLowerCase().split(/\s+/);
        const albanianWordsLower = albanianText.toLowerCase().split(/\s+/);

        for (const word of englishWordsLower) {
            if (this.forbiddenEnglishWords.has(word)) {
                issues.push(`Contains forbidden English word: ${word}`);
            }
        }

        for (const word of albanianWordsLower) {
            if (this.forbiddenAlbanianWords.has(word)) {
                issues.push(`Contains forbidden Albanian word: ${word}`);
            }
        }

        // Check for abstract/academic concepts in English
        const academicPattern = /(theory|research|analysis|hypothesis|methodology|study|investigation|significant|correlation|empirical|complex|advanced|professional|academic|intellectual)/i;
        if (academicPattern.test(englishText)) {
            issues.push('Contains abstract or academic concepts');
        }

        return {
            isValid: issues.length === 0,
            issues: issues,
            score: Math.max(0, 100 - (issues.length * 20))
        };
    }

    /**
     * Generate unit-appropriate content based on curriculum progression
     */
    generateUnitContent(unitNumber, contentType = 'phrase') {
        const unitData = this.unitVocabulary[unitNumber];
        if (!unitData) {
            throw new Error(`Unit ${unitNumber} not found in curriculum progression`);
        }

        const templates = this.getContentTemplates(unitNumber, contentType);
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

        return this.fillTemplate(randomTemplate, unitData);
    }

    /**
     * Get content templates based on unit and type
     */
    getContentTemplates(unitNumber, contentType) {
        const templates = {
            1: { // Greetings & Self-Introduction
                phrase: [
                    { english: "Hello, my name is {name}", albanian: "Përshëndetje, unë quhem {name}" },
                    { english: "How are you?", albanian: "Si jeni?" },
                    { english: "I am {age} years old", albanian: "Unë jam {age} vjeç" },
                    { english: "Good morning", albanian: "Mirëmëngjes" },
                    { english: "Thank you very much", albanian: "Faleminderit shumë" },
                    { english: "Please", albanian: "Ju lutem" },
                    { english: "I am Albanian", albanian: "Unë jam shqiptar" },
                    { english: "Nice to meet you", albanian: "Gëzohem që ju njoh" }
                ],
                sentence: [
                    { english: "My name is Maria and I am fifteen.", albanian: "Unë quhem Maria dhe jam pesëmbëdhjetë vjeç." },
                    { english: "Hello, how are you today?", albanian: "Përshëndetje, si jeni sot?" },
                    { english: "I am fine, thank you.", albanian: "Unë jam mirë, faleminderit." },
                    { english: "Good afternoon, teacher.", albanian: "Mirëdita, mësues." }
                ]
            },
            2: { // Family & Relationships
                phrase: [
                    { english: "This is my mother", albanian: "Kjo është nëna ime" },
                    { english: "My father is tall", albanian: "Babai im është i lartë" },
                    { english: "I have one brother", albanian: "Unë kam një vëlla" },
                    { english: "My sister is young", albanian: "Motra ime është e re" },
                    { english: "My family is big", albanian: "Familja ime është e madhe" },
                    { english: "This is my grandmother", albanian: "Kjo është gjyshja ime" },
                    { english: "My grandfather is kind", albanian: "Gjyshi im është i mirë" }
                ],
                sentence: [
                    { english: "I live with my parents and sister.", albanian: "Unë jetoj me prindërit dhe motrën." },
                    { english: "My brother goes to university.", albanian: "Vëllai im shkon në universitet." },
                    { english: "We are a happy family.", albanian: "Ne jemi një familje e lumtur." },
                    { english: "My grandmother makes good food.", albanian: "Gjyshja ime gatuan ushqim të mirë." }
                ]
            },
            3: { // School Life
                phrase: [
                    { english: "I go to school", albanian: "Unë shkoj në shkollë" },
                    { english: "My teacher is nice", albanian: "Mësuesi im është i mirë" },
                    { english: "I like mathematics", albanian: "Mua më pëlqen matematika" },
                    { english: "This is my book", albanian: "Ky është libri im" },
                    { english: "I have a pencil", albanian: "Unë kam një laps" },
                    { english: "The classroom is big", albanian: "Klasa është e madhe" },
                    { english: "History is interesting", albanian: "Historia është interesante" }
                ],
                sentence: [
                    { english: "I study Albanian at school.", albanian: "Unë studioj shqip në shkollë." },
                    { english: "My favorite subject is art.", albanian: "Lënda ime e preferuar është arti." },
                    { english: "We have homework every day.", albanian: "Ne kemi detyra çdo ditë." },
                    { english: "The students are friendly.", albanian: "Nxënësit janë miqësorë." }
                ]
            },
            4: { // Home & Daily Life
                phrase: [
                    { english: "My room is small", albanian: "Dhoma ime është e vogël" },
                    { english: "This is our kitchen", albanian: "Kjo është kuzina jonë" },
                    { english: "I sleep in my bed", albanian: "Unë fle në kreatin tim" },
                    { english: "The house is beautiful", albanian: "Shtëpia është e bukur" },
                    { english: "I watch television", albanian: "Unë shikoj televizor" },
                    { english: "We eat breakfast", albanian: "Ne hamë mëngjes" },
                    { english: "I help at home", albanian: "Unë ndihmoj në shtëpi" }
                ],
                sentence: [
                    { english: "I wake up at seven in the morning.", albanian: "Unë zgjohem në orën shtatë të mëngjesit." },
                    { english: "My family eats dinner together.", albanian: "Familja ime ha darkë së bashku." },
                    { english: "I clean my room on Saturday.", albanian: "Unë pastroj dhomën time të shtunën." },
                    { english: "We relax in the living room.", albanian: "Ne çlodhemi në dhomën e ndenjjes." }
                ]
            },
            5: { // Food & Eating
                phrase: [
                    { english: "I like bread", albanian: "Mua më pëlqen buka" },
                    { english: "This is good food", albanian: "Ky është ushqim i mirë" },
                    { english: "I want water", albanian: "Unë dua ujë" },
                    { english: "We eat fruit", albanian: "Ne hamë fruta" },
                    { english: "Milk is healthy", albanian: "Qumështi është i shëndetshëm" },
                    { english: "I drink coffee", albanian: "Unë pi kafe" },
                    { english: "Vegetables are important", albanian: "Perimet janë të rëndësishme" }
                ],
                sentence: [
                    { english: "I eat breakfast at home every day.", albanian: "Unë ha mëngjes në shtëpi çdo ditë." },
                    { english: "My mother cooks delicious meals.", albanian: "Nëna ime gatuan ushqime të shijshme." },
                    { english: "We buy groceries at the market.", albanian: "Ne blejmë ushqime në treg." },
                    { english: "I prefer fresh fruit for snacks.", albanian: "Unë preferoj fruta të freskëta për ushqime të vogla." }
                ]
            },
            6: { // Weather & Seasons
                phrase: [
                    { english: "Today is sunny", albanian: "Sot bën diell" },
                    { english: "It is raining", albanian: "Po bie shi" },
                    { english: "I like summer", albanian: "Mua më pëlqen vera" },
                    { english: "Winter is cold", albanian: "Dimri është i ftohtë" },
                    { english: "The wind is strong", albanian: "Era është e fortë" },
                    { english: "Spring is beautiful", albanian: "Pranvera është e bukur" },
                    { english: "It will snow tomorrow", albanian: "Nesër do të bjerë borë" }
                ],
                sentence: [
                    { english: "We play outside when it's sunny.", albanian: "Ne luajmë jashtë kur bën diell." },
                    { english: "I wear a coat in winter.", albanian: "Unë vesh pallto në dimër." },
                    { english: "The flowers bloom in spring.", albanian: "Lulet çelin në pranverë." },
                    { english: "Swimming is fun in summer.", albanian: "Noti është argëtues në verë." }
                ]
            },
            7: { // Free Time & Hobbies
                phrase: [
                    { english: "I play football", albanian: "Unë luaj futboll" },
                    { english: "Music is fun", albanian: "Muzika është argëtuese" },
                    { english: "I like reading", albanian: "Mua më pëlqen leximi" },
                    { english: "We watch movies", albanian: "Ne shikojmë filma" },
                    { english: "Sports are healthy", albanian: "Sportet janë të shëndetshme" },
                    { english: "I meet my friends", albanian: "Unë takoj miqtë e mi" },
                    { english: "Games are entertaining", albanian: "Lojërat janë argëtuese" }
                ],
                sentence: [
                    { english: "I play basketball with my friends.", albanian: "Unë luaj basketboll me miqtë e mi." },
                    { english: "We listen to music after school.", albanian: "Ne dëgjojmë muzikë pas shkollës." },
                    { english: "Reading books is my hobby.", albanian: "Leximi i librave është hobi im." },
                    { english: "My family watches TV together.", albanian: "Familja ime shikon TV së bashku." }
                ]
            },
            8: { // Future Plans & Dreams
                phrase: [
                    { english: "I want to study", albanian: "Unë dua të studioj" },
                    { english: "My dream is big", albanian: "Ëndrra ime është e madhe" },
                    { english: "I will travel", albanian: "Unë do të udhëtoj" },
                    { english: "The future is bright", albanian: "E ardhmja është e ndritshme" },
                    { english: "I have plans", albanian: "Unë kam plane" },
                    { english: "Education is important", albanian: "Arsimi është i rëndësishëm" },
                    { english: "I will succeed", albanian: "Unë do të kem sukses" }
                ],
                sentence: [
                    { english: "I want to become a teacher.", albanian: "Unë dua të bëhem mësues." },
                    { english: "Next year I will study harder.", albanian: "Vitin e ardhshëm do të studioj më shumë." },
                    { english: "My goal is to visit Albania.", albanian: "Qëllimi im është të vizitoj Shqipërinë." },
                    { english: "I hope to learn Albanian well.", albanian: "Shpresoj të mësoj shqip mirë." }
                ]
            }
        };

        return templates[unitNumber]?.[contentType] || [];
    }

    /**
     * Fill template with appropriate vocabulary
     */
    fillTemplate(template, unitData) {
        let english = template.english;
        let albanian = template.albanian;

        // Replace placeholders with appropriate values
        if (english.includes('{name}')) {
            const names = ['Ana', 'Mark', 'Sara', 'David', 'Elena', 'John'];
            const randomName = names[Math.floor(Math.random() * names.length)];
            english = english.replace('{name}', randomName);
            albanian = albanian.replace('{name}', randomName);
        }

        if (english.includes('{age}')) {
            const ages = ['fourteen', 'fifteen', 'sixteen'];
            const agesAlbanian = ['katërmbëdhjetë', 'pesëmbëdhjetë', 'gjashtëmbëdhjetë'];
            const ageIndex = Math.floor(Math.random() * ages.length);
            english = english.replace('{age}', ages[ageIndex]);
            albanian = albanian.replace('{age}', agesAlbanian[ageIndex]);
        }

        return { english, albanian };
    }

    /**
     * Generate replacement content for flagged items
     */
    async generateReplacementContent(originalEnglish, originalAlbanian, unitHint = null) {
        // Determine appropriate unit based on content complexity
        let targetUnit = unitHint || this.determineAppropriateUnit(originalEnglish);

        // Generate multiple candidates
        const candidates = [];
        for (let i = 0; i < 5; i++) {
            const content = this.generateUnitContent(targetUnit, 'phrase');
            const validation = this.validateContent(content.english, content.albanian);

            if (validation.isValid) {
                candidates.push({
                    ...content,
                    validation_score: validation.score,
                    target_unit: targetUnit
                });
            }
        }

        // Return the best candidate
        if (candidates.length > 0) {
            return candidates.sort((a, b) => b.validation_score - a.validation_score)[0];
        }

        // Fallback to simpler unit if no valid candidates
        if (targetUnit > 1) {
            return this.generateReplacementContent(originalEnglish, originalAlbanian, targetUnit - 1);
        }

        throw new Error('Unable to generate appropriate replacement content');
    }

    /**
     * Determine appropriate unit based on content complexity
     */
    determineAppropriateUnit(englishText) {
        const text = englishText.toLowerCase();

        // Unit 1: Basic greetings and introductions
        if (text.includes('hello') || text.includes('name') || text.includes('how are')) return 1;

        // Unit 2: Family
        if (text.includes('family') || text.includes('mother') || text.includes('father')) return 2;

        // Unit 3: School
        if (text.includes('school') || text.includes('teacher') || text.includes('study')) return 3;

        // Unit 4: Home
        if (text.includes('home') || text.includes('room') || text.includes('house')) return 4;

        // Unit 5: Food
        if (text.includes('food') || text.includes('eat') || text.includes('drink')) return 5;

        // Unit 6: Weather
        if (text.includes('weather') || text.includes('rain') || text.includes('sun')) return 6;

        // Unit 7: Hobbies
        if (text.includes('play') || text.includes('music') || text.includes('sport')) return 7;

        // Unit 8: Future
        if (text.includes('future') || text.includes('plan') || text.includes('dream')) return 8;

        // Default to unit 1 for unknown content
        return 1;
    }

    /**
     * Batch generate fresh content for entire units
     */
    async generateUnitContentBatch(unitNumber, count = 20) {
        const results = [];
        const contentTypes = ['phrase', 'sentence'];

        for (let i = 0; i < count; i++) {
            try {
                const contentType = contentTypes[i % contentTypes.length];
                const content = this.generateUnitContent(unitNumber, contentType);
                const validation = this.validateContent(content.english, content.albanian);

                if (validation.isValid) {
                    results.push({
                        english: content.english,
                        albanian: content.albanian,
                        unit_number: unitNumber,
                        content_type: contentType,
                        validation_score: validation.score,
                        generated_at: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.warn(`Failed to generate content ${i + 1} for unit ${unitNumber}:`, error.message);
            }
        }

        return results;
    }
}

/**
 * Main execution function
 */
async function main() {
    if (process.argv.length < 3) {
        console.log('Usage: node generate_freshman_content.js <command> [options]');
        console.log('Commands:');
        console.log('  validate <english> <albanian> - Validate if content meets criteria');
        console.log('  generate <unit> [count] - Generate content for specific unit');
        console.log('  replace <english> <albanian> - Generate replacement for problematic content');
        console.log('  batch <unit> [count] - Generate batch content for unit');
        return;
    }

    const generator = new FreshmanContentGenerator();
    const command = process.argv[2];

    try {
        switch (command) {
            case 'validate':
                if (process.argv.length < 5) {
                    console.log('Usage: validate <english> <albanian>');
                    return;
                }
                const english = process.argv[3];
                const albanian = process.argv[4];
                const validation = generator.validateContent(english, albanian);
                console.log(JSON.stringify(validation, null, 2));
                break;

            case 'generate':
                if (process.argv.length < 4) {
                    console.log('Usage: generate <unit> [type]');
                    return;
                }
                const unit = parseInt(process.argv[3]);
                const type = process.argv[4] || 'phrase';
                const content = generator.generateUnitContent(unit, type);
                console.log(JSON.stringify(content, null, 2));
                break;

            case 'replace':
                if (process.argv.length < 5) {
                    console.log('Usage: replace <english> <albanian>');
                    return;
                }
                const origEnglish = process.argv[3];
                const origAlbanian = process.argv[4];
                const replacement = await generator.generateReplacementContent(origEnglish, origAlbanian);
                console.log(JSON.stringify(replacement, null, 2));
                break;

            case 'batch':
                if (process.argv.length < 4) {
                    console.log('Usage: batch <unit> [count]');
                    return;
                }
                const batchUnit = parseInt(process.argv[3]);
                const batchCount = parseInt(process.argv[4]) || 20;
                const batchResults = await generator.generateUnitContentBatch(batchUnit, batchCount);
                console.log(JSON.stringify(batchResults, null, 2));
                break;

            default:
                console.log('Unknown command:', command);
                break;
        }
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = { FreshmanContentGenerator };

// Run if called directly
if (require.main === module) {
    main();
}