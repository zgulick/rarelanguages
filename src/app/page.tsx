export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Albanian Learning Platform
        </h1>
        <p className="text-gray-600 mb-8">
          Welcome to your language learning journey
        </p>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-green-600 font-semibold">
            ✅ Deployment successful!
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Build completed successfully
          </p>
        </div>
      </div>
    </div>
  );
}