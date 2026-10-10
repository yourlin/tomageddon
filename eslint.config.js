// ESLint 配置（flat config）：TypeScript 推荐规则 + 关闭与 Prettier 冲突的格式规则
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/', 'dist-steam/', 'release-steam/', '.kiro/', 'node_modules/', 'docs/', 'public/', 'operations/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    // 平台适配层约束：游戏代码不直接碰 localStorage / window.open，统一走 src/platform
    files: ['src/**/*.ts'],
    ignores: ['src/platform/**', 'src/dev/**'],
    rules: {
      'no-restricted-globals': ['error', { name: 'localStorage', message: '请使用 src/platform 的 storage' }],
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'localStorage', message: '请使用 src/platform 的 storage' },
        { object: 'window', property: 'open', message: '请使用 src/platform 的 openExternal' },
      ],
    },
  },
  {
    // Node 端脚本（构建、文档、批量测试）
    files: ['scripts/**/*.{ts,mjs}', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  {
    // Electron 主进程与预加载脚本（CommonJS，Node 环境）
    files: ['electron/**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    // 这些脚本中 page.evaluate 的回调在浏览器里执行
    files: [
      'scripts/batch.mjs',
      'scripts/export-images.mjs',
      'scripts/export-anim.mjs',
      'scripts/export-combat-anim.mjs',
      'scripts/promo/record.mjs',
    ],
    languageOptions: { globals: { ...globals.node, ...globals.browser, game: 'readonly', run: 'readonly' } },
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
