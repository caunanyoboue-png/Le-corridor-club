/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@maquis/shared$": "<rootDir>/../../packages/shared/src/index.ts",
  },
  coverageDirectory: "coverage",
};

module.exports = config;
