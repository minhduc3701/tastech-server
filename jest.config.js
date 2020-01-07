module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  setupFilesAfterEnv: ['./jest.setup.js'],
  reporters: process.env.CI ? ['default', 'jest-junit'] : ['default']
}
