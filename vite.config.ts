import { defineConfig, type Plugin, type Connect } from 'vite';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const SITE_URL: string = pkg.homepage;
const REPO_URL: string = pkg.repository.url;

/** index.html 中的 %SITE_URL% 替换为站点绝对地址（分享卡片的图片必须用绝对地址） */
const siteUrl = (): Plugin => ({
  name: 'site-url',
  transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
});

/**
 * 平衡报告（scripts/batch.mjs 生成在 reports/）给开发者界面「报告」页签用，只挂在 dev / preview 服务器上，静态构建里没有。
 *   GET /__balance-reports/         报告列表 JSON（新的在前）
 *   GET /__balance-reports/<文件名>  reports/ 下的 .html / .md / .js / .json 文件（报告用相对路径加载 echarts.min.js；
 *                                    weapon-eff.json 是武器实战转换率，开发者界面 E1 用）
 * 只接受 reports/ 下的纯文件名，不允许子目录和 ..，读不到别处的文件。
 */
const REPORTS_DIR = new URL('./reports/', import.meta.url).pathname;
const REPORT_ROUTE = '/__balance-reports/';
const REPORT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};
const balanceReports = (): Plugin => {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    const url = (req.url ?? '').split('?')[0];
    if (!url.startsWith(REPORT_ROUTE)) return next();
    const name = decodeURIComponent(url.slice(REPORT_ROUTE.length));
    const send = (code: number, type: string, body: string | Buffer) => {
      res.statusCode = code;
      res.setHeader('Content-Type', type);
      res.setHeader('Cache-Control', 'no-store');
      res.end(body);
    };
    if (!name) {
      const list = existsSync(REPORTS_DIR)
        ? readdirSync(REPORTS_DIR)
            .filter((f) => f.endsWith('.html'))
            .map((f) => {
              const st = statSync(join(REPORTS_DIR, f));
              return { name: f, mtime: st.mtimeMs, size: st.size };
            })
            .sort((a, b) => b.mtime - a.mtime)
        : [];
      return send(200, 'application/json; charset=utf-8', JSON.stringify(list));
    }
    const ext = name.slice(name.lastIndexOf('.'));
    if (!/^[\w.-]+$/.test(name) || name.includes('..') || !REPORT_TYPES[ext]) return send(400, 'text/plain; charset=utf-8', 'bad name');
    const file = join(REPORTS_DIR, name);
    if (!existsSync(file)) return send(404, 'text/plain; charset=utf-8', 'not found');
    send(200, REPORT_TYPES[ext], readFileSync(file));
  };
  return {
    name: 'balance-reports',
    configureServer: (server) => void server.middlewares.use(handler),
    configurePreviewServer: (server) => void server.middlewares.use(handler),
  };
};

export default defineConfig({
  base: './',
  plugins: [siteUrl(), balanceReports()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __REPO_URL__: JSON.stringify(REPO_URL),
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
  },
  // 经 CloudFront（带 Basic Auth）远程访问 EC2 上的 dev / preview 服务器；Vite 默认拒绝陌生 Host
  server: { allowedHosts: ['d1po7vtgxceca1.cloudfront.net'] },
  preview: { allowedHosts: ['d1po7vtgxceca1.cloudfront.net'] },
});
