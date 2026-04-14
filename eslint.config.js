import tseslint from '@typescript-eslint/eslint-plugin'
import parser from '@typescript-eslint/parser'

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: { parser },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
    }
  },
  {
    // Test files use mocked Node.js APIs with complex overloads (e.g. readdir,
    // readFile) where `as any` at mock boundaries is unavoidable without
    // fighting the type system. Relax the rule rather than suppress per-line.
    files: ['src/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    }
  }
]
