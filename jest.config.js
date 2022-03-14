export default {
    'collectCoverageFrom': [
        'src/**/*.js',
    ],
    'coverageProvider': 'v8',
    'transform': {
        '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
    },
    'transformIgnorePatterns': [
        '/node_modules/(?!(execa|strip-final-newline|npm-run-path|path-key|onetime|mimic-fn|human-signals|is-stream|got|p-cancelable|@szmarczak|lowercase-keys)/)',
    ],
};