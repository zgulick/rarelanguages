// Dynamic VerbSection Component - replaces hardcoded conjugations with API calls
const DynamicVerbSection = ({ topic, onNext, onPrev }) => {
    const [verbData, setVerbData] = useState([]);
    const [activeVerb, setActiveVerb] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadVerbsForTopic();
    }, [topic]);

    const loadVerbsForTopic = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Get verbs from grammar API
            const response = await fetch('/api/grammar/verbs?language=gheg-al&limit=20');
            const data = await response.json();
            
            if (data.success && data.verbs) {
                // Select 3-4 most relevant verbs for the topic
                const topicVerbs = selectVerbsForTopic(data.verbs, topic.name);
                setVerbData(topicVerbs);
                setActiveVerb(0);
            } else {
                throw new Error('Failed to load verb data');
            }
            
        } catch (error) {
            console.error('Error loading verbs for topic:', error);
            setError(error.message);
            // Fallback to basic verb data
            setVerbData(getFallbackVerbData(topic.name));
        } finally {
            setLoading(false);
        }
    };

    const selectVerbsForTopic = (allVerbs, topicName) => {
        // Map topics to relevant verbs based on usage context
        const topicVerbMap = {
            'Game Conversation': ['luaj', 'fitoj', 'humbas'],
            'Playing Cards': ['luaj', 'fitoj', 'ndaj'],
            'Food Names': ['ha', 'gatuaj', 'shërben'],
            'Home & Rooms': ['jetoj', 'shkoj', 'qëndroj'],
            'Daily Activities': ['punoj', 'lexoj', 'fle'],
            'Expressing Opinions': ['mendoj', 'besoj', 'preferoj'],
            'Emotions & Feelings': ['ndihem', 'jam', 'dukem'],
            'Hello and Goodbye': ['them', 'vij', 'shkoj'],
            'Card Game Terms': ['filloj', 'ndal', 'dua'],
            'Winning & Losing': ['fitoj', 'humbas', 'provoj']
        };

        const preferredVerbs = topicVerbMap[topicName] || ['jam', 'ha', 'shkoj'];
        
        // Find verbs that match the topic
        const selectedVerbs = [];
        
        for (const verbInfinitive of preferredVerbs) {
            const verb = allVerbs.find(v => v.infinitive === verbInfinitive);
            if (verb) {
                selectedVerbs.push(transformVerbForDisplay(verb));
            }
        }
        
        // If we don't have enough verbs, add some high-frequency ones
        while (selectedVerbs.length < 3 && selectedVerbs.length < allVerbs.length) {
            const additionalVerb = allVerbs
                .filter(v => !selectedVerbs.some(sv => sv.infinitive === v.infinitive))
                .sort((a, b) => (a.frequency_rank || 100) - (b.frequency_rank || 100))[0];
            
            if (additionalVerb) {
                selectedVerbs.push(transformVerbForDisplay(additionalVerb));
            } else {
                break;
            }
        }
        
        return selectedVerbs.slice(0, 4); // Max 4 verbs per topic
    };

    const transformVerbForDisplay = (verb) => {
        // Transform API verb data to match the expected component format
        const presentConjugations = verb.conjugations?.present || {};
        
        return {
            infinitive: verb.infinitive,
            english: verb.english_translation,
            type: verb.pattern_name || 'unknown pattern',
            conjugations: {
                'unë': { 
                    form: presentConjugations['unë'] || verb.infinitive, 
                    english: `I ${verb.english_translation.replace('to ', '')}` 
                },
                'ti': { 
                    form: presentConjugations['ti'] || verb.infinitive, 
                    english: `you ${verb.english_translation.replace('to ', '')}` 
                },
                'ai/ajo': { 
                    form: presentConjugations['ai/ajo'] || verb.infinitive, 
                    english: `he/she ${verb.english_translation.replace('to ', '')}s` 
                },
                'ne': { 
                    form: presentConjugations['ne'] || verb.infinitive, 
                    english: `we ${verb.english_translation.replace('to ', '')}` 
                },
                'ju': { 
                    form: presentConjugations['ju'] || verb.infinitive, 
                    english: `you (plural) ${verb.english_translation.replace('to ', '')}` 
                },
                'ata/ato': { 
                    form: presentConjugations['ata/ato'] || verb.infinitive, 
                    english: `they ${verb.english_translation.replace('to ', '')}` 
                }
            },
            examples: verb.usage_examples || generateBasicExamples(verb),
            cultural_notes: verb.cultural_notes
        };
    };

    const generateBasicExamples = (verb) => {
        // Generate basic examples when none are provided
        const presentForms = verb.conjugations?.present || {};
        const examples = [];
        
        if (presentForms['unë']) {
            examples.push({
                albanian: `Unë ${presentForms['unë']} çdo ditë`,
                english: `I ${verb.english_translation.replace('to ', '')} every day`
            });
        }
        
        if (presentForms['ne']) {
            examples.push({
                albanian: `Ne ${presentForms['ne']} bashkë`,
                english: `We ${verb.english_translation.replace('to ', '')} together`
            });
        }
        
        return examples;
    };

    const getFallbackVerbData = (topicName) => {
        // Fallback verb data when API is not available
        return [
            {
                infinitive: 'jam',
                english: 'to be',
                type: 'irregular',
                conjugations: {
                    'unë': { form: 'jam', english: 'I am' },
                    'ti': { form: 'je', english: 'you are' },
                    'ai/ajo': { form: 'është', english: 'he/she is' },
                    'ne': { form: 'jemi', english: 'we are' },
                    'ju': { form: 'jeni', english: 'you (plural) are' },
                    'ata/ato': { form: 'janë', english: 'they are' }
                },
                examples: [
                    { albanian: 'Unë jam këtu', english: 'I am here' },
                    { albanian: 'Ti je i mirë', english: 'You are good' }
                ]
            }
        ];
    };

    if (loading) {
        return (
            <div className="verb-section loading">
                <div className="section-header">
                    <h3>📖 Albanian Verbs - {topic.name}</h3>
                    <p>Loading verb conjugations...</p>
                </div>
                <div className="spinner"></div>
            </div>
        );
    }

    if (error || !verbData || verbData.length === 0) {
        return (
            <div className="verb-section error">
                <div className="section-header">
                    <h3>📖 Albanian Verbs - {topic.name}</h3>
                    <p style={{color: '#e74c3c'}}>
                        {error ? `Error: ${error}` : 'No verbs available for this topic'}
                    </p>
                </div>
                <div className="navigation-buttons">
                    <button className="btn btn-secondary" onClick={onPrev}>
                        ← Previous Section
                    </button>
                    <button className="btn btn-primary" onClick={onNext}>
                        Continue to Practice →
                    </button>
                </div>
            </div>
        );
    }

    const currentVerb = verbData[activeVerb];

    return (
        <div className="verb-section">
            <div className="section-header">
                <h3>📖 Albanian Verbs - {topic.name}</h3>
                <p>Master essential verb conjugations for {topic.name.toLowerCase()}</p>
                <div className="verb-selector">
                    {verbData.map((verb, index) => (
                        <button
                            key={verb.infinitive}
                            className={`verb-tab ${index === activeVerb ? 'active' : ''}`}
                            onClick={() => setActiveVerb(index)}
                        >
                            {verb.infinitive}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="verb-content">
                <div className="verb-info">
                    <h4>{currentVerb.infinitive} ({currentVerb.english})</h4>
                    <p className="verb-type">{currentVerb.type}</p>
                    {currentVerb.cultural_notes && (
                        <div className="cultural-note">
                            <strong>💡 Cultural Context:</strong> {currentVerb.cultural_notes}
                        </div>
                    )}
                </div>
                
                <div className="conjugation-table">
                    <h5>Present Tense Conjugations:</h5>
                    <div className="conjugations-grid">
                        {Object.entries(currentVerb.conjugations).map(([person, data]) => (
                            <div key={person} className="conjugation-row">
                                <div className="person">{person}</div>
                                <div className="form">{data.form}</div>
                                <div className="translation">{data.english}</div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {currentVerb.examples && currentVerb.examples.length > 0 && (
                    <div className="verb-examples">
                        <h5>Example Sentences:</h5>
                        {currentVerb.examples.map((example, index) => (
                            <div key={index} className="example">
                                <div className="albanian">{example.albanian}</div>
                                <div className="english">{example.english}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="navigation-buttons">
                <button className="btn btn-secondary" onClick={onPrev}>
                    ← Previous Section  
                </button>
                <button className="btn btn-primary" onClick={onNext}>
                    Continue to Practice →
                </button>
            </div>
        </div>
    );
};