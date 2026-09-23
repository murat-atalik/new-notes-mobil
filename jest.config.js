module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
};
