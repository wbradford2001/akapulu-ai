module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    modulePathIgnorePatterns: ["<rootDir>/dist/"],
    setupFiles: ["dotenv/config"], 
    testTimeout: 30000,
    maxConcurrency: 1,
    maxWorkers: 1,
    globalTeardown: '<rootDir>/src/utils/testing/globalTeardown.ts',
    setupFilesAfterEnv: ['<rootDir>/src/utils/testing/jest.setup.ts'],
  };
  
