import React, { useState, useEffect } from 'react';

const MarketingLanding = ({ onGetStarted }) => {
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
              RareLanguages
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary-600 transition-colors font-medium">How It Works</a>
              <a href="#languages" className="text-gray-600 hover:text-primary-600 transition-colors font-medium">Languages</a>
              <a href="#about" className="text-gray-600 hover:text-primary-600 transition-colors font-medium">About</a>
              <button className="px-6 py-2 bg-white border border-gray-300 hover:border-primary-300 rounded-full transition-all duration-300 font-medium">
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-100 rounded-full blur-3xl opacity-70"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-70"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary-50 to-indigo-50 rounded-full opacity-50"></div>
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-indigo-600 text-white rounded-full mb-8 shadow-lg">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold tracking-wide">AI-POWERED LANGUAGE UNIVERSITY</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-6 mb-12">
            <div className="text-6xl md:text-8xl font-black text-gray-900 leading-tight tracking-tight">
              <div className="mb-6">From</div>
              <div className="relative inline-block">
                <span className="text-gray-400 line-through decoration-red-500 decoration-4">"Practice App"</span>
              </div>
              <div className="mt-6">
                to <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">University</span>
              </div>
            </div>
          </div>

          {/* Value Proposition */}
          <p className="text-xl md:text-2xl text-gray-700 mb-16 max-w-5xl mx-auto leading-relaxed font-light">
            Select any rare language. Click <span className="font-bold text-primary-600">"Generate Course."</span> Receive complete 4-level university curriculum with AI-built content in under 30 minutes. 
            <span className="font-bold text-gray-900 block mt-2">Zero manual content creation required.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <button 
              onClick={onGetStarted}
              className="group relative px-12 py-6 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-primary-500/25 transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center space-x-3">
                <span>Build My Course</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            <button className="group flex items-center space-x-3 px-8 py-6 border-2 border-gray-300 hover:border-primary-300 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-300">
              <svg className="w-6 h-6 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-12 text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium">University-Grade Curriculum</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              <span className="font-medium">AI-Generated in Minutes</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              <span className="font-medium">Any Language Structure</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-8 leading-tight">
              Academic Language Learning,
              <span className="bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent"> Automated</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Revolutionary AI architecture that builds complete university-level language curricula with cultural context and pedagogical excellence.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Interactive Feature Cards */}
            <div className="space-y-8">
              <div 
                className={`p-8 rounded-3xl cursor-pointer transition-all duration-500 border-2 ${
                  activeFeature === 0 
                    ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white border-transparent shadow-2xl transform scale-105' 
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
                onClick={() => setActiveFeature(0)}
              >
                <div className="flex items-start space-x-6">
                  <div className="text-4xl">📚</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Grammar-First Methodology</h3>
                    <p className="text-lg leading-relaxed opacity-90">
                      Learn linguistic structures and patterns, not just vocabulary memorization. 
                      Understand why language works the way it does with explicit grammar instruction.
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className={`p-8 rounded-3xl cursor-pointer transition-all duration-500 border-2 ${
                  activeFeature === 1 
                    ? 'bg-gradient-to-r from-success-600 to-emerald-600 text-white border-transparent shadow-2xl transform scale-105' 
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
                onClick={() => setActiveFeature(1)}
              >
                <div className="flex items-start space-x-6">
                  <div className="text-4xl">🏛️</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Cultural Context Integration</h3>
                    <p className="text-lg leading-relaxed opacity-90">
                      Every lesson includes cultural context. Learn Albanian family interactions, 
                      Welsh traditions, or Māori customs alongside language structure.
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className={`p-8 rounded-3xl cursor-pointer transition-all duration-500 border-2 ${
                  activeFeature === 2 
                    ? 'bg-gradient-to-r from-accent-600 to-orange-600 text-white border-transparent shadow-2xl transform scale-105' 
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
                onClick={() => setActiveFeature(2)}
              >
                <div className="flex items-start space-x-6">
                  <div className="text-4xl">⚡</div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4">AI Curriculum Architecture</h3>
                    <p className="text-lg leading-relaxed opacity-90">
                      Complete university-level courses generated in minutes, not months. 
                      AI creates entire curricula with structured progression and quality control.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Demo Interface */}
            <div className="relative">
              <div className="bg-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-700">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-400 text-sm ml-4 font-mono">Course Generation Dashboard</span>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-primary-900/30 rounded-2xl border border-primary-500/30">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white font-bold">1</div>
                      <span className="text-white font-medium">Language Structure Analysis</span>
                    </div>
                    <div className="text-green-400 text-2xl">✓</div>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-indigo-900/30 rounded-2xl border border-indigo-500/30">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold">2</div>
                      <span className="text-white font-medium">Cultural Context Research</span>
                    </div>
                    <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gray-700/30 rounded-2xl border border-gray-500/30 opacity-60">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center text-white font-bold">3</div>
                      <span className="text-gray-300 font-medium">Curriculum Generation</span>
                    </div>
                    <span className="text-gray-400">Pending</span>
                  </div>

                  <div className="mt-8 p-6 bg-gradient-to-r from-success-900/30 to-emerald-900/30 rounded-2xl border border-success-500/30">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">🎯</span>
                      <span className="text-success-300 font-bold">Estimated Completion</span>
                    </div>
                    <div className="text-4xl font-black text-success-400">
                      24 minutes
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section id="languages" className="py-24 px-6 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-8 leading-tight">
              Any Rare Language,
              <span className="bg-gradient-to-r from-success-600 to-emerald-600 bg-clip-text text-transparent"> Complete Curriculum</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Our AI system adapts to any language structure. From agglutinative to polysynthetic, 
              generate university-quality courses for languages unavailable elsewhere.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Albanian - Live */}
            <div className="group bg-gradient-to-br from-success-50 to-emerald-50 rounded-3xl p-8 border-2 border-success-200 hover:border-success-300 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="text-center">
                <div className="text-5xl mb-6">🇦🇱</div>
                <h3 className="text-2xl font-bold text-success-900 mb-3">Albanian (Gheg)</h3>
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                  <span className="text-success-700 font-semibold">Live • 2.1k learners</span>
                </div>
                <p className="text-success-800 mb-6 text-sm">4 Complete Courses • 175+ Hours</p>
                <button className="w-full py-4 bg-gradient-to-r from-success-600 to-emerald-600 text-white rounded-2xl font-bold hover:from-success-500 hover:to-emerald-500 transition-all shadow-lg">
                  Start Learning
                </button>
              </div>
            </div>

            {/* Welsh - Generating */}
            <div className="group bg-gradient-to-br from-orange-50 to-yellow-50 rounded-3xl p-8 border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="text-center">
                <div className="text-5xl mb-6">🏴󠁧󠁢󠁷󠁬󠁳󠁿</div>
                <h3 className="text-2xl font-bold text-orange-900 mb-3">Welsh</h3>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-orange-700 font-semibold">AI Generating</span>
                    <span className="text-orange-700 font-bold">78%</span>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full transition-all duration-500" style={{width: '78%'}}></div>
                  </div>
                </div>
                <p className="text-orange-800 mb-6 text-sm">4 Complete Courses • ~175+ Hours</p>
                <button className="w-full py-4 bg-orange-500/50 text-orange-900 rounded-2xl font-semibold cursor-not-allowed" disabled>
                  Notify When Ready
                </button>
              </div>
            </div>

            {/* Māori - Generating */}
            <div className="group bg-gradient-to-br from-purple-50 to-violet-50 rounded-3xl p-8 border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="text-center">
                <div className="text-5xl mb-6">🇳🇿</div>
                <h3 className="text-2xl font-bold text-purple-900 mb-3">Māori</h3>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-purple-700 font-semibold">AI Generating</span>
                    <span className="text-purple-700 font-bold">45%</span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-purple-500 to-violet-500 h-3 rounded-full transition-all duration-500" style={{width: '45%'}}></div>
                  </div>
                </div>
                <p className="text-purple-800 mb-6 text-sm">4 Complete Courses • ~175+ Hours</p>
                <button className="w-full py-4 bg-purple-500/50 text-purple-900 rounded-2xl font-semibold cursor-not-allowed" disabled>
                  Notify When Ready
                </button>
              </div>
            </div>

            {/* Scots Gaelic - Queued */}
            <div className="group bg-gradient-to-br from-gray-50 to-slate-50 rounded-3xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="text-center">
                <div className="text-5xl mb-6">🏴󠁧󠁢󠁳󠁣󠁴󠁿</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Scots Gaelic</h3>
                <div className="mb-4 text-gray-600 font-medium">
                  In Queue • Request to prioritize
                </div>
                <p className="text-gray-700 mb-6 text-sm">4 Complete Courses • ~175+ Hours</p>
                <button className="w-full py-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-2xl font-semibold transition-all">
                  Join Waitlist
                </button>
              </div>
            </div>

            {/* Croatian - Queued */}
            <div className="group bg-gradient-to-br from-gray-50 to-slate-50 rounded-3xl p-8 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="text-center">
                <div className="text-5xl mb-6">🇭🇷</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Croatian</h3>
                <div className="mb-4 text-gray-600 font-medium">
                  In Queue • Request to prioritize
                </div>
                <p className="text-gray-700 mb-6 text-sm">4 Complete Courses • ~175+ Hours</p>
                <button className="w-full py-4 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-2xl font-semibold transition-all">
                  Join Waitlist
                </button>
              </div>
            </div>

            {/* Request Language */}
            <div className="group bg-gradient-to-br from-primary-50 to-indigo-50 rounded-3xl p-8 border-2 border-dashed border-primary-300 hover:border-primary-400 transition-all duration-300 hover:shadow-xl hover:scale-105">
              <div className="text-center">
                <div className="text-5xl mb-6">🌍</div>
                <h3 className="text-2xl font-bold text-primary-900 mb-3">Your Language</h3>
                <div className="mb-4 text-primary-700 font-medium">
                  Request any rare language • AI will build it
                </div>
                <p className="text-primary-800 mb-6 text-sm">Custom course generation • 24-48 hour delivery</p>
                <button className="w-full py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl font-bold hover:from-primary-500 hover:to-indigo-500 transition-all shadow-lg">
                  Request Build
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-200">
            <div className="grid md:grid-cols-4 gap-12 text-center">
              <div>
                <div className="text-5xl font-black bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent mb-3">28min</div>
                <div className="text-gray-600 font-medium">Avg. Generation Time</div>
              </div>
              <div>
                <div className="text-5xl font-black bg-gradient-to-r from-success-600 to-emerald-600 bg-clip-text text-transparent mb-3">175+</div>
                <div className="text-gray-600 font-medium">Hours Per Language</div>
              </div>
              <div>
                <div className="text-5xl font-black bg-gradient-to-r from-accent-600 to-orange-600 bg-clip-text text-transparent mb-3">100%</div>
                <div className="text-gray-600 font-medium">AI-Generated</div>
              </div>
              <div>
                <div className="text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">12+</div>
                <div className="text-gray-600 font-medium">Languages Planned</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-primary-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
            Ready to Build Your Course?
          </h2>
          
          <p className="text-2xl mb-16 max-w-4xl mx-auto font-light leading-relaxed opacity-90">
            Join the revolution in language learning. Select your language, click generate, 
            and start learning with university-quality curriculum in minutes.
          </p>

          <div className="space-y-8">
            <button 
              onClick={onGetStarted}
              className="group relative px-16 py-6 bg-white text-primary-600 rounded-3xl text-2xl font-black hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 shadow-2xl overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center space-x-4">
                <span>Get Started Free</span>
                <svg className="w-8 h-8 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            
            <p className="text-primary-100 text-lg">
              No credit card required • Albanian course available immediately • 30-minute generation guarantee
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div className="text-2xl font-black mb-4 md:mb-0 bg-gradient-to-r from-primary-400 to-indigo-400 bg-clip-text text-transparent">
              RareLanguages
            </div>
            <div className="flex items-center space-x-8 text-gray-300">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© 2024 RareLanguages. Revolutionizing language education through AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLanding;