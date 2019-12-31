module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  setupFilesAfterEnv: ['./jest.setup.js'],
  testResultsProcessor: process.env.CI ? 'jest-junit' : null
}
