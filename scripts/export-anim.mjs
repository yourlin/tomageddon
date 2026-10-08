// 导出文档用动图：在无头 Chrome 中逐帧渲染游戏的程序化美术，用 img2webp 合成循环播放的动态 WebP
//   char   角色：待机 → 庆祝 → 待机            → docs/images/char/<id>.webp（CHARACTERS.md）
//   skill  技能：角色待机 → 施法 → 待机        → docs/images/skill/<角色 id>.webp（SKILLS.md）
//   enemy  怪物：待机 → 攻击 → 待机            → docs/images/enemy/<id>.webp（MONSTERS.md）
//   boss   精英 / Boss：待机 → 蓄力 → 攻击     → docs/images/boss/<id>.webp（MONSTERS.md）
//   weapon 武器：图标轻轻摆动、上下浮动        → docs/images/weapon/<id>.webp（WEAPONS.md）
// 用法：npm run docs:anim [-- --only char,enemy]（需要本机安装 Google Chrome 与 img2webp：brew install webp）
import puppeteer from 'puppeteer-core';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 4177;
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = fileURLToPath(new URL('../docs/images/', import.meta.url));
const FPS = 15;
const FRAMES = 36; // 2.4 秒一轮
// 武器整张图标都在摆动、每帧像素都变，文件大：缩小尺寸、减少帧数、降低质量（文档里武器图本来就显示得小）
const SPEC = { weapon: { size: 96, frames: 24, q: 60 } };
const spec = (kind) => ({ size: 128, frames: FRAMES, q: 80, ...SPEC[kind] });
// 技能、武器用实战画面，见 export-combat-anim.mjs（这里的 skill / weapon 仅作备用：施法姿势、图标摆动，需 --only 指定）
const KINDS = ['char', 'enemy', 'boss'];
const oi = process.argv.indexOf('--only');
const ONLY = oi > 0 ? process.argv[oi + 1].split(',') : KINDS;

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const URL_ = `http://localhost:${PORT}/?lang=zh`;
for (let i = 0; ; i++) {
  try {
    if ((await fetch(URL_)).ok) break;
  } catch {
    /* 服务未就绪 */
  }
  if (i > 100) throw new Error('开发服务器启动失败');
  await new Promise((r) => setTimeout(r, 200));
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const tmp = mkdtempSync(join(tmpdir(), 'anim-'));
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[页面错误]', e.message));
  await page.goto(URL_);
  await page.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 120000 });
  const jobs = await page.evaluate(async (ONLY) => {
    const { CHARACTERS } = await import('/src/data/characters.ts');
    const { ENEMIES } = await import('/src/data/enemies.ts');
    const { BOSSES } = await import('/src/data/bosses.ts');
    const { WEAPONS } = await import('/src/data/weapons.ts');
    const { EVOLVED_WEAPONS } = await import('/src/data/evolutions.ts');
    const ids = {
      char: CHARACTERS.map((c) => c.id),
      skill: CHARACTERS.map((c) => c.id),
      enemy: ENEMIES.map((e) => e.id),
      boss: BOSSES.map((b) => b.id),
      weapon: [...WEAPONS, ...EVOLVED_WEAPONS].map((w) => w.id),
    };
    return ONLY.flatMap((k) => ids[k].map((id) => [k, id]));
  }, ONLY);
  const count = {};
  for (const [kind, id] of jobs) {
    const frames = await page.evaluate(
      async (kind, id, FPS, FRAMES, SIZE) => {
        const scene = window.game.scene.getScene('Menu');
        // 先画在 256 的大画布上（高个子、跳起、挥动都不会被裁掉），最后按所有帧的内容框统一裁成正方形
        const rt = scene.make.renderTexture({ width: 256, height: 256 }, false);
        const snap = () => new Promise((r) => rt.snapshot((el) => r(el.src)));
        const out = [];
        const dt = 1 / FPS;
        if (kind === 'weapon') {
          // 没有专门图标的武器（如刀具箱）与游戏内一样退回武器本体贴图
          const key = scene.textures.exists(`icon_weapon_${id}`) ? `icon_weapon_${id}` : `weapon_${id}`;
          const img = scene.make.image({ key }, false);
          const s = 96 / Math.max(img.width, img.height);
          for (let f = 0; f < FRAMES; f++) {
            const p = (f / FRAMES) * Math.PI * 2;
            img.setRotation(Math.sin(p) * 0.22).setScale(s * (1 + Math.sin(p * 2) * 0.04));
            rt.clear();
            rt.draw(img, 128, 128 + Math.sin(p) * 6);
            out.push(await snap());
          }
          img.destroy();
        } else {
          const { Rig } = await import('/src/objects/Rig.ts');
          const { lookOf } = await import('/src/ui/Portrait.ts');
          const look = kind === 'skill' ? 'char' : kind;
          const rig = new Rig(scene, lookOf(look, id), `${look}_${id}`, 44);
          // 中段做一次动作（计时状态结束后自动回到待机）
          const act = {
            char: [['victory', 0.4]],
            skill: [['cast', 0.35]],
            enemy: [['attack', 0.4]],
            boss: [
              ['windup', 0.3],
              ['attack', 0.55],
            ],
          }[kind];
          for (let f = 0; f < FRAMES; f++) {
            for (const [st, at] of act) if (f === Math.round(FRAMES * at)) rig.play(st, true);
            // 眼睛左右看一圈，首尾衔接
            rig.tick(dt, 0, 1, Math.sin((f / FRAMES) * Math.PI * 2) * 0.6, 0);
            rt.clear();
            rt.draw(rig, 128, 140);
            out.push(await snap());
          }
          rig.destroy();
        }
        rt.destroy();
        // 所有帧不透明像素的并集包围盒 → 以它为中心取正方形，等比缩放到 SIZE（不拉伸、不裁切）
        const imgs = await Promise.all(
          out.map(
            (src) =>
              new Promise((r) =>
                Object.assign(new Image(), {
                  onload() {
                    r(this);
                  },
                  src,
                }),
              ),
          ),
        );
        const cv = document.createElement('canvas');
        cv.width = cv.height = 256;
        const cx = cv.getContext('2d', { willReadFrequently: true });
        let x0 = 256,
          y0 = 256,
          x1 = 0,
          y1 = 0;
        for (const im of imgs) {
          cx.clearRect(0, 0, 256, 256);
          cx.drawImage(im, 0, 0);
          const d = cx.getImageData(0, 0, 256, 256).data;
          for (let y = 0; y < 256; y++)
            for (let x = 0; x < 256; x++)
              if (d[(y * 256 + x) * 4 + 3] > 8) {
                if (x < x0) x0 = x;
                if (x > x1) x1 = x;
                if (y < y0) y0 = y;
                if (y > y1) y1 = y;
              }
        }
        const side = Math.max(x1 - x0, y1 - y0) + 8;
        const sx = (x0 + x1) / 2 - side / 2,
          sy = (y0 + y1) / 2 - side / 2;
        cv.width = cv.height = SIZE;
        return imgs.map((im) => {
          cx.clearRect(0, 0, SIZE, SIZE);
          cx.drawImage(im, sx, sy, side, side, 0, 0, SIZE, SIZE);
          return cv.toDataURL('image/png');
        });
      },
      kind,
      id,
      FPS,
      spec(kind).frames,
      spec(kind).size,
    );
    const files = frames.map((url, i) => {
      const f = join(tmp, `${kind}_${id}_${String(i).padStart(3, '0')}.png`);
      writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
      return f;
    });
    const dir = join(OUT, kind);
    mkdirSync(dir, { recursive: true });
    execFileSync(
      'img2webp',
      ['-loop', '0', '-lossy', '-q', String(spec(kind).q), '-d', String(Math.round(1000 / FPS)), ...files, '-o', join(dir, `${id}.webp`)],
      {
        stdio: 'ignore',
      },
    );
    for (const f of files) rmSync(f);
    count[kind] = (count[kind] ?? 0) + 1;
  }
  console.log('导出动图：', count);
} finally {
  await browser.close();
  server.kill();
  rmSync(tmp, { recursive: true, force: true });
}
