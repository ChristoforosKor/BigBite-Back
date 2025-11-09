module.exports = {
	globalSetup: '<rootDir>/tests/setup.js',
	globalTeardown: '<rootDir>/tests/teardown.js',
	testEnvironment: 'node',
        setupFilesAfterEnv: ['<rootDir>/tests/jest.setup-env.js']
};
