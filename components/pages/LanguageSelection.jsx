import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const LanguageSelection = ({ onLanguageSelected, onBack }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const response = await fetch('/api/courses/catalog');
      const data = await response.json();
      
      if (data.success) {
        // Transform API data into display format
        const transformedLanguages = data.languages.map(lang => ({
          code: lang.code,
          name: lang.name,
          native_name: lang.native_name,
          flag: getLanguageFlag(lang.code),
          status: 'available',
          description: `Complete progression from beginner to advanced proficiency`,
          courses: 4 // Default assumption
        }));

        // Get existing language codes to avoid duplicates
        const existingCodes = new Set(transformedLanguages.map(lang => lang.code));

        // Add coming soon languages (only if not already in API data)
        const comingSoonLanguages = [
          {
            code: 'cy',
            name: 'Welsh',
            native_name: 'Cymraeg',
            flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
            status: 'coming-soon',
            description: 'University-quality Welsh with cultural context from Wales',
            courses: 4
          },
          {
            code: 'mi',
            name: 'Māori',
            native_name: 'Te Reo Māori',
            flag: '🇳🇿',
            status: 'coming-soon',
            description: 'Traditional Māori language with cultural integration',
            courses: 4
          },
          {
            code: 'gd',
            name: 'Scots Gaelic',
            native_name: 'Gàidhlig',
            flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
            status: 'coming-soon',
            description: 'Highland Scots Gaelic with traditional cultural context',
            courses: 4
          },
          {
            code: 'custom',
            name: 'Request Your Language',
            native_name: 'Any Language',
            flag: '🌍',
            status: 'request',
            description: 'AI-generate a complete course for any language not listed',
            courses: '?'
          }
        ].filter(lang => !existingCodes.has(lang.code)); // Filter out duplicates

        setLanguages([...transformedLanguages, ...comingSoonLanguages]);
      } else {
        // Fallback to static data if API fails
        setLanguages([
          {
            code: 'sq',
            name: 'Albanian (Gheg)',
            native_name: 'Shqip (Gegë)',
            flag: '🇦🇱',
            status: 'available',
            description: 'Complete 4-level curriculum focusing on Kosovo Albanian family interactions',
            courses: 4
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading languages:', error);
      // Fallback to minimal static data
      setLanguages([
        {
          code: 'sq',
          name: 'Albanian (Gheg)',
          native_name: 'Shqip (Gegë)',
          flag: '🇦🇱',
          status: 'available',
          description: 'Complete 4-level curriculum focusing on Kosovo Albanian family interactions',
          courses: 4
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getLanguageFlag = (code) => {
    const flags = {
      'sq': '🇦🇱',
      'cy': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
      'gd': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      'mi': '🇳🇿',
      'hr': '🇭🇷'
    };
    return flags[code] || '🌐';
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    
    // For available languages, auto-continue after a short delay for visual feedback
    if (language.status === 'available') {
      setTimeout(() => {
        onLanguageSelected(language);
      }, 500);
    }
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      onLanguageSelected(selectedLanguage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-6"></div>
          <p className="text-blue-100 text-lg">Loading language options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10"></div>
      </div>

      {/* Header with Back Button */}
      <header className="relative z-10 px-4 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <motion.button 
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 text-blue-100 hover:text-white hover:bg-white/20 flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300"
          >
            <span>←</span>
            <span>Back</span>
          </motion.button>
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            RareLanguages
          </div>
          <div className="space-x-4">
            <button className="bg-white/10 backdrop-blur-sm border border-white/20 text-blue-100 hover:text-white hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-300">
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="relative z-10 px-4 py-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-400 text-white rounded-full flex items-center justify-center font-bold shadow-lg">✓</div>
              <span className="text-green-200">Welcome</span>
            </div>
            <div className="w-12 h-0.5 bg-blue-300/50"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center font-bold shadow-lg">2</div>
              <span className="text-blue-200 font-medium">Select Language</span>
            </div>
            <div className="w-12 h-0.5 bg-white/30"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/30 text-blue-200 rounded-full flex items-center justify-center font-bold">3</div>
              <span className="text-blue-200/70">Choose Course</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="relative z-10 px-4 py-12">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 mb-6">
              Choose Your Language Journey
            </h1>
            
            <p className="text-xl text-blue-100 font-light mb-12 max-w-3xl mx-auto leading-relaxed">
              Experience the traditional high school language learning progression. 
              Each language offers 4 sequential levels, from fundamentals to advanced proficiency.
            </p>
          </motion.div>

          {/* Language Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
          >
            {languages.map((language, index) => (
              <motion.div
                key={`${language.code}-${language.status}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, rotateY: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleLanguageSelect(language)}
                className={`relative group cursor-pointer ${
                  selectedLanguage?.code === language.code ? 'ring-4 ring-blue-400/60' : ''
                } ${
                  language.status === 'coming-soon' ? 'opacity-75' : ''
                }`}
              >
                <div className={`bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 text-center hover:bg-white/15 transition-all duration-500 shadow-2xl group-hover:shadow-blue-500/25 ${
                  language.status === 'request' ? 'border-dashed border-2 border-purple-400/50' : ''
                }`}>
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    {language.status === 'available' && (
                      <span className="inline-block px-3 py-1 bg-green-400/20 text-green-200 text-xs font-medium rounded-full border border-green-400/30">
                        AVAILABLE
                      </span>
                    )}
                    {language.status === 'coming-soon' && (
                      <span className="inline-block px-3 py-1 bg-orange-400/20 text-orange-200 text-xs font-medium rounded-full border border-orange-400/30">
                        COMING SOON
                      </span>
                    )}
                    {language.status === 'request' && (
                      <span className="inline-block px-3 py-1 bg-purple-400/20 text-purple-200 text-xs font-medium rounded-full border border-purple-400/30">
                        AI POWERED
                      </span>
                    )}
                  </div>

                  {/* Flag and Name */}
                  <div className="mb-6">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {language.flag}
                    </div>
                    <h3 className="text-2xl font-semibold mb-2 text-white group-hover:text-blue-200 transition-colors">
                      {language.name}
                    </h3>
                    <p className="text-blue-200/80 text-sm font-light">
                      {language.native_name}
                    </p>
                  </div>
                  
                  {/* Course Level Preview */}
                  <div className="mb-6">
                    <div className="text-blue-100/80 text-sm mb-3">Academic Sequence:</div>
                    <div className="flex justify-center space-x-1">
                      {[101, 201, 301, 401].map((level) => (
                        <span 
                          key={level}
                          className="px-2 py-1 bg-blue-500/30 text-blue-100 text-xs rounded border border-blue-400/30"
                        >
                          {level}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-blue-100/90 text-sm mb-6 leading-relaxed">
                    {language.description}
                  </p>

                  {/* Selection Indicator */}
                  {selectedLanguage?.code === language.code && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border-2 border-blue-400/50"
                    >
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center shadow-lg">
                          {language.status === 'available' ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            >
                              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </motion.div>
                          ) : (
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      {language.status === 'available' && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                          <div className="bg-green-400 text-white px-3 py-1 rounded-full text-sm font-medium">
                            Loading courses...
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/10 group-hover:to-purple-600/10 rounded-2xl transition-all duration-500"></div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Continue Button */}
          {selectedLanguage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <motion.button 
                onClick={handleContinue}
                whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg font-semibold px-12 py-4 rounded-2xl shadow-2xl transition-all duration-300"
              >
                {selectedLanguage.status === 'available' 
                  ? `Begin ${selectedLanguage.name} Studies →`
                  : selectedLanguage.status === 'request'
                  ? 'Request This Language →'
                  : 'Join Waitlist →'
                }
              </motion.button>
              
              <div className="text-center">
                {selectedLanguage.status === 'available' && (
                  <p className="text-blue-200 text-sm">
                    Complete 4-level curriculum ready • Begin your academic journey immediately
                  </p>
                )}
                
                {selectedLanguage.status === 'coming-soon' && (
                  <p className="text-blue-200 text-sm">
                    Course development in progress • Get notified when your textbook is ready
                  </p>
                )}
                
                {selectedLanguage.status === 'request' && (
                  <p className="text-blue-200 text-sm">
                    AI will generate your complete academic sequence • Ready within 24-48 hours
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Features Footer */}
      <section className="relative z-10 px-4 py-20 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mb-4">
              Academic Excellence, Digitally Enhanced
            </h2>
            <p className="text-blue-100/80 text-lg max-w-2xl mx-auto">
              Experience the depth of university-level language education with the convenience of modern technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-2xl">📚</span>
              </div>
              <h4 className="text-xl font-semibold mb-4 text-white">Sequential Progression</h4>
              <p className="text-blue-100/80 leading-relaxed">
                Like traditional high school sequences: 101 → 201 → 301 → 401. 
                Each level builds systematically on previous knowledge.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-2xl">🏛️</span>
              </div>
              <h4 className="text-xl font-semibold mb-4 text-white">Cultural Immersion</h4>
              <p className="text-blue-100/80 leading-relaxed">
                Every lesson integrates authentic cultural context. 
                Learn language as it's truly spoken and lived.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="text-xl font-semibold mb-4 text-white">AI-Powered Generation</h4>
              <p className="text-blue-100/80 leading-relaxed">
                Complete academic curricula created instantly for any language. 
                University-quality education, available on demand.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LanguageSelection;