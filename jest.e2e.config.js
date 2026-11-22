// End-to-end tests run in plain Node (real HTTP), not the React Native test preset.
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.e2e.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  // babel-preset-expo turns process.env.EXPO_PUBLIC_* into an import of this ESM file.
  transformIgnorePatterns: ['/node_modules/(?!expo/virtual/)'],
  testTimeout: 30_000,
};
