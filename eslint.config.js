import react from "eslint-plugin-react";

export default [
  {
    ignores: ["dist/**", "build/**", "coverage/**", "node_modules/**", ".vite/**"],
  },
  {
    files: ["**/*.{js,jsx}"],
    plugins: {
      react,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        Audio: "readonly",
        AudioContext: "readonly",
        Blob: "readonly",
        File: "readonly",
        FileReader: "readonly",
        HTMLAnchorElement: "readonly",
        HTMLAudioElement: "readonly",
        MediaRecorder: "readonly",
        URL: "readonly",
        afterEach: "readonly",
        beforeEach: "readonly",
        cancelAnimationFrame: "readonly",
        clearInterval: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        describe: "readonly",
        document: "readonly",
        expect: "readonly",
        it: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        requestAnimationFrame: "readonly",
        sessionStorage: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
        test: "readonly",
        vi: "readonly",
        webkitAudioContext: "readonly",
        window: "readonly",
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/jsx-uses-react": "warn",
      "react/jsx-uses-vars": "warn",
      "no-constant-condition": "warn",
      "no-dupe-args": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-duplicate-imports": "warn",
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-extra-semi": "warn",
      "no-irregular-whitespace": "error",
      "no-undef": "warn",
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
