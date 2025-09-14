import React, { useState } from 'react';

const LanguageSelection = ({ onLanguageSelected, onBack }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  const languages = [
    {
      code: 'sq',
      name: 'Albanian (Gheg)',
      flag: '🇦🇱',
      status: 'available',
      description: 'Complete 4-level curriculum focusing on Kosovo Albanian family interactions',
      courses: 4
    },
    {
      code: 'cy',
      name: 'Welsh',
      flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
      status: 'coming-soon',
      description: 'University-quality Welsh with cultural context from Wales',
      courses: 4
    },
    {
      code: 'mi',
      name: 'Māori',
      flag: '🇳🇿',
      status: 'coming-soon',
      description: 'Traditional Māori language with cultural integration',
      courses: 4
    },
    {
      code: 'gd',
      name: 'Scots Gaelic',
      flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      status: 'coming-soon',
      description: 'Highland Scots Gaelic with traditional cultural context',
      courses: 4
    },
    {
      code: 'hr',
      name: 'Croatian',
      flag: '🇭🇷',
      status: 'coming-soon',
      description: 'Standard Croatian with Balkan cultural integration',
      courses: 4
    },
    {
      code: 'custom',
      name: 'Request Your Language',
      flag: '🌍',
      status: 'request',
      description: 'AI-generate a complete course for any language not listed',
      courses: '?'
    }
  ];

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
  };

  const handleContinue = () => {
    if (selectedLanguage) {
      onLanguageSelected(selectedLanguage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header with Back Button */}
      <header className="px-4 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="btn text-gray-600 hover:text-gray-900 flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <div className="text-2xl font-bold text-gray-900">
            RareLanguages
          </div>
          <div className="space-x-4">
            <button className="btn btn-secondary">
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="px-4 py-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">✓</div>
              <span className="text-gray-600">Welcome</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <span className="text-blue-600 font-medium">Select Language</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center font-bold">3</div>
              <span className="text-gray-400">Choose Course</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="px-4 py-12">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="heading-1 text-4xl md:text-5xl mb-6">
            Which Language Would You Like to 
            <span className="text-primary-600"> Master?</span>
          </h1>
          
          <p className="body-text text-lg mb-12 max-w-2xl mx-auto">
            Select a rare language to generate your complete university-quality curriculum. 
            Each course includes 4 progressive levels with cultural context.
          </p>

          {/* Language Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {languages.map((language) => (
              <div
                key={language.code}
                onClick={() => handleLanguageSelect(language)}
                className={`card hover:shadow-xl cursor-pointer transition-all duration-300 ${
                  selectedLanguage?.code === language.code 
                    ? 'ring-2 ring-primary-500 shadow-lg transform -translate-y-1' 
                    : 'hover:-translate-y-0.5'
                } ${
                  language.status === 'coming-soon' ? 'opacity-75' : ''
                } ${
                  language.status === 'request' ? 'border-dashed border-2 border-primary-300' : ''
                }`}
              >
                <div className="text-center">
                  {/* Status Badge */}
                  <div className="mb-4">
                    {language.status === 'available' && (
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        AVAILABLE NOW
                      </span>
                    )}
                    {language.status === 'coming-soon' && (
                      <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                        COMING SOON
                      </span>
                    )}
                    {language.status === 'request' && (
                      <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                        AI GENERATED
                      </span>
                    )}
                  </div>

                  {/* Flag and Name */}
                  <div className="text-4xl mb-4">{language.flag}</div>
                  <h3 className="text-lg font-semibold mb-2">{language.name}</h3>
                  
                  {/* Course Count */}
                  <p className="text-sm text-gray-600 mb-3">
                    {language.courses} Course Levels • 40-45 hours each
                  </p>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-700 mb-4">
                    {language.description}
                  </p>

                  {/* Selection Indicator */}
                  {selectedLanguage?.code === language.code && (
                    <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 text-primary-700">
                        <span className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </span>
                        <span className="text-sm font-medium">Selected</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Continue Button */}
          {selectedLanguage && (
            <div className="space-y-4">
              <button 
                onClick={handleContinue}
                className="btn bg-primary-600 hover:bg-primary-700 text-white text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                {selectedLanguage.status === 'available' 
                  ? `Start Learning ${selectedLanguage.name} →`
                  : selectedLanguage.status === 'request'
                  ? 'Request This Language →'
                  : 'Join Waitlist →'
                }
              </button>
              
              {selectedLanguage.status === 'available' && (
                <p className="text-sm text-gray-600">
                  Complete curriculum ready • Start learning immediately
                </p>
              )}
              
              {selectedLanguage.status === 'coming-soon' && (
                <p className="text-sm text-gray-600">
                  Course generation in progress • Get notified when ready
                </p>
              )}
              
              {selectedLanguage.status === 'request' && (
                <p className="text-sm text-gray-600">
                  AI will generate a complete 4-level curriculum • Usually ready in 24-48 hours
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Footer */}
      <section className="px-4 py-16 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">📚</span>
              </div>
              <h4 className="font-semibold mb-2">Academic Quality</h4>
              <p className="text-sm text-gray-600">University-level curriculum with CEFR alignment</p>
            </div>
            
            <div>
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🏛️</span>
              </div>
              <h4 className="font-semibold mb-2">Cultural Context</h4>
              <p className="text-sm text-gray-600">Learn language through authentic cultural situations</p>
            </div>
            
            <div>
              <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">⚡</span>
              </div>
              <h4 className="font-semibold mb-2">AI Generated</h4>
              <p className="text-sm text-gray-600">Complete courses created automatically for any language</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LanguageSelection;