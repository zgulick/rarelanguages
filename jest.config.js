const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',

  // Without these, jest's file crawler walks the whole project (including
  // .next and node_modules) and never finishes -- the runner would hang
  // indefinitely before executing a single test.
  roots: ['<rootDir>/__tests__'],
  watchman: false,

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1'
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.next/'
  ],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'src/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.js',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ]
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
