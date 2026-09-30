import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const SITE_URL: string = pkg.homepage;
const REPO_URL: string = pkg.repository.url;

/** index.html 中的 %SITE_URL% 替换为站点绝对地址（分享卡片的图片必须用绝对地址） */
const siteUrl = (): Plugin => ({
  name: 'site-url',
  transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
});

export default defineConfig({
  base: './',
  plugins: [siteUrl()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __REPO_URL__: JSON.stringify(REPO_URL),
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
  },
});
