import React from 'react';

const LanguageLanding = ({ onStartLearning }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <header className="px-4 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="text-2xl font-bold text-gray-900">
            RareLanguages
          </div>
          <div className="space-x-4">
            <button className="btn text-gray-600 hover:text-gray-900">
              About
            </button>
            <button className="btn btn-secondary">
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="heading-1 text-4xl md:text-6xl mb-6">
            Master Any Language with 
            <span className="text-primary-500"> University-Quality</span> Courses
          </h1>
          
          <p className="body-text text-xl mb-8 max-w-2xl mx-auto">
            Structured academic progression from beginner to advanced proficiency. 
            Start with Albanian, expand to any rare language.
          </p>

          <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center">
            <button 
              onClick={onStartLearning}
              className="btn bg-primary-500 hover:bg-primary-600 text-white text-lg px-8 py-4"
            >
              Start Learning Albanian
            </button>
            <button className="btn btn-secondary text-lg px-8 py-4">
              View Course Catalog
            </button>
          </div>
        </div>
      </section>

      {/* Course Preview */}
      <section className="px-4 py-16 bg-white">
        <div className="container mx-auto">
          <h2 className="heading-2 text-center mb-12">Available Courses</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Albanian Course Cards */}
            <div className="card hover:shadow-lg transition-all">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                  CEFR A1
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Albanian 1: Foundations</h3>
              <p className="text-gray-600 text-sm mb-4">ALB101 • 40 hours</p>
              <p className="text-gray-700 mb-4">
                Introduction to Gheg Albanian with essential vocabulary and grammar foundations.
              </p>
              <button className="btn bg-primary-500 text-white w-full">
                Start Course
              </button>
            </div>

            {/* Repeat for Albanian 2, 3, 4 with coming soon for others */}
            <div className="card opacity-75">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                  CEFR A2
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Albanian 2: Family Life</h3>
              <p className="text-gray-600 text-sm mb-4">ALB102 • 45 hours</p>
              <p className="text-gray-700 mb-4">
                Building practical communication skills for family and social situations.
              </p>
              <button className="btn btn-secondary w-full" disabled>
                Complete Albanian 1 First
              </button>
            </div>

            {/* Coming Soon Cards */}
            <div className="card border-dashed border-2 border-gray-300">
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🏴󠁧󠁢󠁷󠁬󠁳󠁿</div>
                <h3 className="text-lg font-semibold mb-2">Welsh Courses</h3>
                <p className="text-gray-600 mb-4">Coming Soon</p>
                <button className="btn btn-secondary">
                  Join Waitlist
                </button>
              </div>
            </div>

            <div className="card border-dashed border-2 border-gray-300">
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🏴</div>
                <h3 className="text-lg font-semibold mb-2">Scots Gaelic</h3>
                <p className="text-gray-600 mb-4">Coming Soon</p>
                <button className="btn btn-secondary">
                  Join Waitlist
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Academic Quality</h3>
              <p className="text-gray-600">
                University-level curriculum with CEFR alignment and structured progression.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Mobile Learning</h3>
              <p className="text-gray-600">
                Optimized for mobile study with offline capability and audio integration.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Rare Languages</h3>
              <p className="text-gray-600">
                Specialized in minority and heritage languages often unavailable elsewhere.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LanguageLanding;