module.exports = {
    'env': {
        'es2021': true,
        'node': true,
    },
    'extends': 'eslint:recommended',
    'parserOptions': {
        'ecmaVersion': 2021,
        'sourceType': 'module',
    },
    'rules': {
        'brace-style': [
            'error',
            '1tbs',
            { 'allowSingleLine': true },
        ],
        'camelcase': [
            'warn',
        ],
        'comma-dangle': [
            'warn',
            'always-multiline',
        ],
        'curly': [
            'warn',
            'all',
        ],
        'eqeqeq': [
            'error',
            'always',
            {
                'null': 'always',
            },
        ],
        'indent': [
            'warn',
            4,
            { 
                'SwitchCase': 1,
                'ArrayExpression': 'first',
                'ImportDeclaration': 'first',
                'ObjectExpression': 'first',
            },
        ],
        'linebreak-style': [
            'error',
            'unix',
        ],
        'quotes': [
            'error',
            'single',
        ],
        'semi': [
            'error',
            'always',
        ],
        'sort-imports': [
            'warn',
        ],
        'sort-vars': [
            'warn',
        ],
    },
};
