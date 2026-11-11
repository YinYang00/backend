// Configuratia ESLint a backend-ului. Fiecare regula de aici corespunde unei
// sectiuni din CODING_STYLE.md; formatarea propriu-zisa este lasata Prettier.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'coverage/'] },
  js.configs.recommended,
  jsdoc.configs['flat/recommended-error'],
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      // 3.1 Declaratii si variabile
      'no-var': 'error',
      'prefer-const': 'error',
      'one-var': ['error', 'never'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // 3.2 Denumiri
      camelcase: ['error', { properties: 'never' }],
      // Router() din Express si DataTypes.X() din Sequelize sunt factory-uri,
      // nu constructori, deci sunt permise fara new.
      'new-cap': [
        'error',
        {
          capIsNewExceptions: ['Router'],
          capIsNewExceptionPattern: '^DataTypes\\.',
        },
      ],
      'id-length': ['error', { min: 2, exceptions: ['i', 'j', '_'] }],

      // 3.3 Expresii si control
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-else-return': 'error',
      'prefer-template': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'no-nested-ternary': 'error',

      // 3.4 Gestionarea erorilor
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-console': ['error', { allow: ['info', 'warn', 'error'] }],

      // 3.5 Dimensiunea codului
      'max-lines': [
        'error',
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      'max-lines-per-function': [
        'error',
        { max: 40, skipBlankLines: true, skipComments: true },
      ],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      complexity: ['error', 10],

      // 3.6 Comentarii JSDoc pentru tot ce este exportat
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            ArrowFunctionExpression: true,
            ClassDeclaration: true,
          },
        },
      ],
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns-description': 'off',
    },
  },
  {
    files: ['tests/**/*.js'],
    rules: {
      'max-lines-per-function': 'off',
      'jsdoc/require-jsdoc': 'off',
    },
  },
  prettier,
];
