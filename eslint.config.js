// ESLint 配置（flat config）：TypeScript 推荐规则 + 关闭与 Prettier 冲突的格式规则
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'docs/', 'public/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    // Node 端脚本（构建、文档、批量测试）
    files: ['scripts/**/*.{ts,mjs}', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  {
    // 这些脚本中 page.evaluate 的回调在浏览器里执行
    files: ['scripts/batch.mjs', 'scripts/export-images.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser, game: 'readonly' } },
  },
  {
    // 注入到游戏页面运行的测试机器人，使用 main.ts 暴露到 window 的调试全局量
    files: ['scripts/bot*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.browser, game: 'readonly', run: 'readonly', controls: 'readonly', GameScene: 'readonly' },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'prefer-const': 'warn',
    },
  },
  prettier,
);
