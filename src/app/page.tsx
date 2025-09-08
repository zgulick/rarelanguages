'use client';

import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          target_language: 'Albanian',
          native_language: 'English'
        }),
      });

      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
        setIsSignedIn(true);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const startLearning = () => {
    window.location.href = '/learn';
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🇦🇱 Learn Albanian
            </h1>
            <p className="text-gray-600">
              Master Gheg Albanian through family conversations
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Start Learning Albanian
            </button>
          </form>

          <div className="mt-8 text-center">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <div className="font-semibold">📚 180+ Phrases</div>
                <div>Family conversations</div>
              </div>
              <div>
                <div className="font-semibold">🇦🇱 Gheg Albanian</div>
                <div>Kosovo dialect</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600">
            Ready to continue learning Albanian?
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={startLearning}
            className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition duration-200"
          >
            🇦🇱 Continue Your Lesson
          </button>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-semibold text-gray-900">Progress</div>
              <div className="text-gray-600">Beginner</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-semibold text-gray-900">Streak</div>
              <div className="text-gray-600">Day 1</div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs text-gray-500">
          Learning: Family conversations in Gheg Albanian
        </div>
      </div>
    </div>
  );
}