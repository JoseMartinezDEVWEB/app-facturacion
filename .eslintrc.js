module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:electron-security/recommended',
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
    'electron-security',
  ],
  rules: {
    'electron-security/isolated-world': 'error',
    'electron-security/no-new-function': 'error',
    'electron-security/no-eval': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
}; 