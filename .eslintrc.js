module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/no-invalid-void-type': 'error', // disallow void type outside of generic or return types
    '@typescript-eslint/no-confusing-void-expression': 'error', // require expressions of type void to appear in statement position
    '@typescript-eslint/no-explicit-any': 'warn', // disallow the any type
    eqeqeq: ['warn', 'always', { null: 'ignore' }], // require the use of === and !==  cf) allow null
    '@typescript-eslint/explicit-function-return-type': 'error', // require explict return types on functions and class methods\
    '@typescript-eslint/explicit-module-boundary-types': 'error', // require explicit return and argument types on exported functions' and classes' public class mathods
  },
};
