const nextJest = require('next/jest');

// Эта функция автоматически подхватывает конфигурацию Next.js (включая SWC для TypeScript)
const createJestConfig = nextJest({
                                      dir: './',
                                  });

/** @type {import('jest').Config} */
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
};

module.exports = createJestConfig(customJestConfig);