import tsEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  {
    // Only lint application files
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['**/*.config.*'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tsEslint
    },
    rules: {
      // ... your rules
    }
  }
]