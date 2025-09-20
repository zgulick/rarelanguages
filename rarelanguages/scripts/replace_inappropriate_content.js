/**
 * Replace All Inappropriate Content
 *
 * Replace academic/complex content with appropriate beginner-level content for each unit
 */

const { query } = require('../lib/database');

class ContentReplacer {
    constructor() {
        this.replacedCount = 0;
        this.addedCount = 0;
    }

    /**
     * Remove all inappropriate academic content
     */
    async removeAllInappropriateContent() {
        console.log('🗑️ Removing ALL inappropriate academic content...');

        const removeResult = await query(`
            DELETE FROM lesson_content
            WHERE (
                -- Academic/research language
                english_phrase ILIKE '%credibility%' OR
                english_phrase ILIKE '%sources%' OR
                english_phrase ILIKE '%evaluate%' OR
                english_phrase ILIKE '%consider%' OR
                english_phrase ILIKE '%analysis%' OR
                english_phrase ILIKE '%theoretical%' OR
                english_phrase ILIKE '%methodology%' OR
                english_phrase ILIKE '%hypothesis%' OR
                english_phrase ILIKE '%evidence%' OR
                english_phrase ILIKE '%scholarly%' OR
                english_phrase ILIKE '%research%' OR
                english_phrase ILIKE '%academic%' OR
                english_phrase ILIKE '%morpholog%' OR
                english_phrase ILIKE '%linguistic%' OR
                english_phrase ILIKE '%inflection%' OR
                english_phrase ILIKE '%comparative%' OR
                english_phrase ILIKE '%synthesiz%' OR
                english_phrase ILIKE '%furthermore%' OR
                english_phrase ILIKE '%moreover%' OR
                english_phrase ILIKE '%in addition%' OR
                english_phrase ILIKE '%however%' OR
                english_phrase ILIKE '%therefore%' OR
                english_phrase ILIKE '%consequently%' OR
                english_phrase ILIKE '%nevertheless%' OR
                english_phrase ILIKE '%nonetheless%' OR
                english_phrase ILIKE '%alternatively%' OR
                english_phrase ILIKE '%specifically%' OR
                english_phrase ILIKE '%particularly%' OR
                english_phrase ILIKE '%essentially%' OR
                english_phrase ILIKE '%fundamentally%' OR
                english_phrase ILIKE '%subsequently%' OR
                english_phrase ILIKE '%ultimately%' OR
                english_phrase ILIKE '%significantly%' OR
                english_phrase ILIKE '%considerably%' OR
                english_phrase ILIKE '%substantially%' OR
                english_phrase ILIKE '%corresponding%' OR
                english_phrase ILIKE '%respective%' OR
                english_phrase ILIKE '%comprehensive%' OR
                english_phrase ILIKE '%appropriate%' OR
                english_phrase ILIKE '%adequate%' OR
                english_phrase ILIKE '%sufficient%' OR
                english_phrase ILIKE '%necessary%' OR
                english_phrase ILIKE '%required%' OR
                english_phrase ILIKE '%essential%' OR
                english_phrase ILIKE '%crucial%' OR
                english_phrase ILIKE '%vital%' OR
                english_phrase ILIKE '%fundamental%' OR
                english_phrase ILIKE '%significant%' OR
                english_phrase ILIKE '%substantial%' OR
                english_phrase ILIKE '%considerable%' OR
                english_phrase ILIKE '%extensive%' OR
                english_phrase ILIKE '%comprehensive%' OR
                english_phrase ILIKE '%thorough%' OR
                english_phrase ILIKE '%detailed%' OR
                english_phrase ILIKE '%complex%' OR
                english_phrase ILIKE '%sophisticated%' OR
                english_phrase ILIKE '%advanced%' OR
                english_phrase ILIKE '%intricate%' OR
                english_phrase ILIKE '%elaborate%' OR
                english_phrase ILIKE '%nuanced%' OR
                english_phrase ILIKE '%subtle%' OR
                english_phrase ILIKE '%distinction%' OR
                english_phrase ILIKE '%differentiate%' OR
                english_phrase ILIKE '%distinguish%' OR
                english_phrase ILIKE '%criteria%' OR
                english_phrase ILIKE '%framework%' OR
                english_phrase ILIKE '%paradigm%' OR
                english_phrase ILIKE '%perspective%' OR
                english_phrase ILIKE '%approach%' OR
                english_phrase ILIKE '%strategy%' OR
                english_phrase ILIKE '%mechanism%' OR
                english_phrase ILIKE '%process%' OR
                english_phrase ILIKE '%procedure%' OR
                english_phrase ILIKE '%implementation%' OR
                english_phrase ILIKE '%application%' OR
                english_phrase ILIKE '%utilization%' OR
                -- Albanian academic terms
                target_phrase ILIKE '%besueshmëri%' OR
                target_phrase ILIKE '%burime%' OR
                target_phrase ILIKE '%vlerësoj%' OR
                target_phrase ILIKE '%konsideru%' OR
                target_phrase ILIKE '%analizoj%' OR
                target_phrase ILIKE '%teorik%' OR
                target_phrase ILIKE '%metodologji%' OR
                target_phrase ILIKE '%hipotezë%' OR
                target_phrase ILIKE '%dëshmi%' OR
                target_phrase ILIKE '%akademik%' OR
                target_phrase ILIKE '%kërkime%' OR
                target_phrase ILIKE '%studime%' OR
                target_phrase ILIKE '%përveç%' OR
                target_phrase ILIKE '%gjithashtu%' OR
                target_phrase ILIKE '%megjithatë%' OR
                target_phrase ILIKE '%sidoqoftë%' OR
                target_phrase ILIKE '%prandaj%' OR
                target_phrase ILIKE '%rrjedhimisht%' OR
                LENGTH(english_phrase) > 50 OR
                LENGTH(target_phrase) > 60
            )
            AND english_phrase NOT ILIKE '%In this lesson%'
        `);

        this.replacedCount = removeResult.rowCount;
        console.log(`✅ Removed ${this.replacedCount} inappropriate academic items`);
    }

    /**
     * Add appropriate beginner content for each unit
     */
    async addAppropriateContent() {
        console.log('📚 Adding appropriate beginner content for each unit...');

        // Get all active skills/units
        const skills = await query(`
            SELECT id, name, position
            FROM skills
            WHERE is_active = true
            ORDER BY position
        `);

        for (const skill of skills.rows) {
            const unitContent = this.getContentForUnit(skill.name);
            if (unitContent.length === 0) continue;

            console.log(`\n📝 Adding content to: ${skill.name}`);

            // Get lessons for this skill
            const lessons = await query(`
                SELECT id, name
                FROM lessons
                WHERE skill_id = $1 AND is_active = true
                ORDER BY position
                LIMIT 3
            `, [skill.id]);

            for (const [lessonIndex, lesson] of lessons.rows.entries()) {
                const lessonContent = unitContent.slice(lessonIndex * 8, (lessonIndex + 1) * 8);

                console.log(`  Adding ${lessonContent.length} items to: ${lesson.name}`);

                for (const [index, item] of lessonContent.entries()) {
                    try {
                        await query(`
                            INSERT INTO lesson_content
                            (lesson_id, english_phrase, target_phrase, pronunciation_guide,
                             word_type, grammar_category, content_section_type, content_order,
                             difficulty_progression, is_key_concept, learning_objective, cultural_context)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                            ON CONFLICT DO NOTHING
                        `, [
                            lesson.id, item.english, item.albanian, item.pronunciation,
                            item.word_type || 'phrase', item.category, item.section || 'vocabulary',
                            index + 10, 1, true, item.objective, item.context || null
                        ]);
                        this.addedCount++;
                    } catch (error) {
                        console.warn(`Warning: Could not add "${item.english}": ${error.message}`);
                    }
                }
            }
        }

        console.log(`✅ Added ${this.addedCount} appropriate content items`);
    }

    /**
     * Get appropriate content for each unit
     */
    getContentForUnit(skillName) {
        const name = skillName.toLowerCase();

        if (name.includes('unit 1') || name.includes('greetings')) {
            return [
                { english: 'Hello', albanian: 'Përshëndetje', pronunciation: 'Per-shen-DET-yeh', category: 'greetings', objective: 'Basic Albanian greeting' },
                { english: 'Good morning', albanian: 'Mirëmëngjes', pronunciation: 'Mee-ruh-MUN-gyes', category: 'greetings', objective: 'Morning greeting' },
                { english: 'Good evening', albanian: 'Mirëmbrëma', pronunciation: 'Mee-ruh-BRUH-mah', category: 'greetings', objective: 'Evening greeting' },
                { english: 'Goodbye', albanian: 'Mirupafshim', pronunciation: 'Mee-roo-PAHF-sheem', category: 'greetings', objective: 'Polite farewell' },
                { english: 'Thank you', albanian: 'Faleminderit', pronunciation: 'Fah-leh-min-deh-REET', category: 'courtesy', objective: 'Express gratitude' },
                { english: 'Please', albanian: 'Ju lutem', pronunciation: 'Yoo LOO-tem', category: 'courtesy', objective: 'Polite request' },
                { english: 'Excuse me', albanian: 'Më falni', pronunciation: 'Muh FAHL-nee', category: 'courtesy', objective: 'Get attention politely' },
                { english: 'Sorry', albanian: 'Më vjen keq', pronunciation: 'Muh vyen kehk', category: 'courtesy', objective: 'Apologize' }
            ];
        }

        if (name.includes('unit 2') || name.includes('numbers')) {
            return [
                { english: 'One', albanian: 'Një', pronunciation: 'Nyuh', category: 'numbers', objective: 'Count to 20' },
                { english: 'Two', albanian: 'Dy', pronunciation: 'Dee', category: 'numbers', objective: 'Count to 20' },
                { english: 'Three', albanian: 'Tre', pronunciation: 'Treh', category: 'numbers', objective: 'Count to 20' },
                { english: 'Four', albanian: 'Katër', pronunciation: 'Kah-tur', category: 'numbers', objective: 'Count to 20' },
                { english: 'Five', albanian: 'Pesë', pronunciation: 'Peh-suh', category: 'numbers', objective: 'Count to 20' },
                { english: 'What time is it?', albanian: 'Sa është ora?', pronunciation: 'Sah esht OH-rah?', category: 'time_expressions', objective: 'Ask about time' },
                { english: 'One o\'clock', albanian: 'Ora një', pronunciation: 'OH-rah nyuh', category: 'time_expressions', objective: 'Tell time' },
                { english: 'Today', albanian: 'Sot', pronunciation: 'Soht', category: 'time_expressions', objective: 'Talk about today' }
            ];
        }

        if (name.includes('unit 3') || name.includes('food')) {
            return [
                { english: 'Water', albanian: 'Ujë', pronunciation: 'OO-yuh', category: 'food', objective: 'Order drinks' },
                { english: 'Coffee', albanian: 'Kafe', pronunciation: 'Kah-FEH', category: 'food', objective: 'Order drinks' },
                { english: 'Bread', albanian: 'Bukë', pronunciation: 'BOO-kuh', category: 'food', objective: 'Basic foods' },
                { english: 'Cheese', albanian: 'Djathë', pronunciation: 'DYAH-thuh', category: 'food', objective: 'Basic foods' },
                { english: 'I am hungry', albanian: 'Kam uri', pronunciation: 'Kahm OO-ree', category: 'feelings', objective: 'Express hunger' },
                { english: 'I am thirsty', albanian: 'Kam etje', pronunciation: 'Kahm EHT-yeh', category: 'feelings', objective: 'Express thirst' },
                { english: 'It tastes good', albanian: 'Ka shije të mirë', pronunciation: 'Kah SHEE-yeh tuh MEE-ruh', category: 'opinions', objective: 'Express taste' },
                { english: 'The bill, please', albanian: 'Llogarinë, ju lutem', pronunciation: 'Loh-gah-REE-nuh, yoo LOO-tem', category: 'restaurant', objective: 'Pay at restaurant' }
            ];
        }

        if (name.includes('unit 4') || name.includes('daily')) {
            return [
                { english: 'I wake up', albanian: 'Zgjohem', pronunciation: 'ZGYOH-hem', category: 'daily_activities', objective: 'Talk about morning routine' },
                { english: 'I eat breakfast', albanian: 'Ha mëngjes', pronunciation: 'Hah MUN-gyes', category: 'daily_activities', objective: 'Talk about meals' },
                { english: 'I go to work', albanian: 'Shkoj në punë', pronunciation: 'Shkoy nuh POO-nuh', category: 'daily_activities', objective: 'Talk about work' },
                { english: 'I come home', albanian: 'Vij në shtëpi', pronunciation: 'Veey nuh SHTUH-pee', category: 'daily_activities', objective: 'Talk about returning home' },
                { english: 'I watch TV', albanian: 'Shoh televizor', pronunciation: 'Shoh teh-leh-vee-ZOHR', category: 'daily_activities', objective: 'Talk about evening activities' },
                { english: 'I go to sleep', albanian: 'Shkoj të fle', pronunciation: 'Shkoy tuh fleh', category: 'daily_activities', objective: 'Talk about bedtime' },
                { english: 'I take a shower', albanian: 'Bëj dush', pronunciation: 'Buy doosh', category: 'daily_activities', objective: 'Talk about hygiene' },
                { english: 'I cook dinner', albanian: 'Gatuaj darkë', pronunciation: 'Gah-too-aye DAHR-kuh', category: 'daily_activities', objective: 'Talk about cooking' }
            ];
        }

        if (name.includes('unit 5') || name.includes('home')) {
            return [
                { english: 'House', albanian: 'Shtëpi', pronunciation: 'SHTUH-pee', category: 'home', objective: 'Talk about where you live' },
                { english: 'Kitchen', albanian: 'Kuzhinë', pronunciation: 'Koo-ZHEE-nuh', category: 'home', objective: 'Name rooms in house' },
                { english: 'Bedroom', albanian: 'Dhomë gjumi', pronunciation: 'THOH-muh GYOO-mee', category: 'home', objective: 'Name rooms in house' },
                { english: 'Bathroom', albanian: 'Banjë', pronunciation: 'BAHN-yuh', category: 'home', objective: 'Name rooms in house' },
                { english: 'Living room', albanian: 'Dhomë ndenjeje', pronunciation: 'THOH-muh nden-YEH-yeh', category: 'home', objective: 'Name rooms in house' },
                { english: 'Street', albanian: 'Rrugë', pronunciation: 'RROO-guh', category: 'places', objective: 'Talk about locations' },
                { english: 'City center', albanian: 'Qendër qyteti', pronunciation: 'Chen-dur chee-TEH-tee', category: 'places', objective: 'Talk about locations' },
                { english: 'Near the park', albanian: 'Pranë parkut', pronunciation: 'PRAH-nuh par-KOOT', category: 'places', objective: 'Give directions' }
            ];
        }

        if (name.includes('unit 6') || name.includes('past') || name.includes('future')) {
            return [
                { english: 'Yesterday', albanian: 'Dje', pronunciation: 'Dyeh', category: 'time', objective: 'Talk about past' },
                { english: 'Tomorrow', albanian: 'Nesër', pronunciation: 'Neh-SUR', category: 'time', objective: 'Talk about future' },
                { english: 'I went', albanian: 'Shkova', pronunciation: 'Shko-VAH', category: 'past_tense', objective: 'Use past tense' },
                { english: 'I will go', albanian: 'Do të shkoj', pronunciation: 'Doh tuh shkoy', category: 'future_tense', objective: 'Use future tense' },
                { english: 'I was', albanian: 'Isha', pronunciation: 'EE-shah', category: 'past_tense', objective: 'Use past tense of "to be"' },
                { english: 'I will be', albanian: 'Do të jem', pronunciation: 'Doh tuh yem', category: 'future_tense', objective: 'Use future tense of "to be"' },
                { english: 'Last week', albanian: 'Javën e kaluar', pronunciation: 'YAH-vun eh kah-loo-AHR', category: 'time', objective: 'Talk about past time' },
                { english: 'Next week', albanian: 'Javën tjetër', pronunciation: 'YAH-vun TYEH-tur', category: 'time', objective: 'Talk about future time' }
            ];
        }

        if (name.includes('unit 7') || name.includes('opinion') || name.includes('feeling')) {
            return [
                { english: 'I like', albanian: 'Më pëlqen', pronunciation: 'Muh PUL-chen', category: 'opinions', objective: 'Express preferences' },
                { english: 'I don\'t like', albanian: 'Nuk më pëlqen', pronunciation: 'Nook muh PUL-chen', category: 'opinions', objective: 'Express dislikes' },
                { english: 'I feel happy', albanian: 'Ndihem i lumtur', pronunciation: 'Ndee-hem ee loom-TOOR', category: 'feelings', objective: 'Express emotions' },
                { english: 'I feel sad', albanian: 'Ndihem i trishtuar', pronunciation: 'Ndee-hem ee treesh-too-AHR', category: 'feelings', objective: 'Express emotions' },
                { english: 'I think', albanian: 'Mendoj', pronunciation: 'Men-DOY', category: 'opinions', objective: 'Express thoughts' },
                { english: 'In my opinion', albanian: 'Sipas mendimit tim', pronunciation: 'See-pahs men-dee-MEET teem', category: 'opinions', objective: 'Give opinion' },
                { english: 'I agree', albanian: 'Pajtohem', pronunciation: 'Paye-toh-hem', category: 'opinions', objective: 'Express agreement' },
                { english: 'I disagree', albanian: 'Nuk pajtohem', pronunciation: 'Nook paye-toh-hem', category: 'opinions', objective: 'Express disagreement' }
            ];
        }

        if (name.includes('unit 8') || name.includes('travel')) {
            return [
                { english: 'Where is...?', albanian: 'Ku është...?', pronunciation: 'Koo esht...?', category: 'directions', objective: 'Ask for directions' },
                { english: 'Go straight', albanian: 'Shko drejt', pronunciation: 'Shkoh dreyt', category: 'directions', objective: 'Give directions' },
                { english: 'Turn left', albanian: 'Kthehu majtas', pronunciation: 'Ktheh-hoo MAY-tahs', category: 'directions', objective: 'Give directions' },
                { english: 'Turn right', albanian: 'Kthehu djathtas', pronunciation: 'Ktheh-hoo dyaht-TAHS', category: 'directions', objective: 'Give directions' },
                { english: 'Bus station', albanian: 'Stacion autobusi', pronunciation: 'Stah-tsee-OHN ah-oo-toh-BOO-see', category: 'travel', objective: 'Find transportation' },
                { english: 'Train station', albanian: 'Stacion treni', pronunciation: 'Stah-tsee-OHN TREH-nee', category: 'travel', objective: 'Find transportation' },
                { english: 'Airport', albanian: 'Aeroport', pronunciation: 'Ah-eh-roh-POHRT', category: 'travel', objective: 'Find transportation' },
                { english: 'Hotel', albanian: 'Hotel', pronunciation: 'Hoh-TEHL', category: 'travel', objective: 'Find accommodation' }
            ];
        }

        return [];
    }

    /**
     * Main execution
     */
    async replaceAllContent() {
        console.log('🚀 Starting comprehensive content replacement...\n');

        try {
            // Step 1: Remove all inappropriate content
            await this.removeAllInappropriateContent();

            // Step 2: Add appropriate beginner content
            await this.addAppropriateContent();

            console.log('\n🎉 Content replacement completed!');
            console.log(`Items removed: ${this.replacedCount}`);
            console.log(`Items added: ${this.addedCount}`);
            console.log('Status: SUCCESS');

            return true;

        } catch (error) {
            console.error('❌ Error during content replacement:', error);
            throw error;
        }
    }
}

/**
 * Main execution
 */
async function main() {
    const replacer = new ContentReplacer();
    const success = await replacer.replaceAllContent();
    process.exit(success ? 0 : 1);
}

// Export for use as module
module.exports = { ContentReplacer };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}