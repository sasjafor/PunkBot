module.exports = {
    'env': {
        'es2021': true,
        'node': true
    },
    'extends': 'eslint:recommended',
    'parserOptions': {
        'ecmaVersion': 2021,
        'sourceType': 'module'
    },
    'rules': {
        'indent': [
            'warn',
            4,
            { 'SwitchCase': 1 }
        ],
        'linebreak-style': [
            'error',
            'unix'
        ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'always'
        ],
        'brace-style': [
            'error',
            '1tbs',
            { 'allowSingleLine': true }
        ],
        'curly': 'error',
        'camelcase': [
            'warn',
        ]
    }
};
