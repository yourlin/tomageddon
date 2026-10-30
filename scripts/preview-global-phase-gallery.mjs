/* global document */
import puppeteer from 'puppeteer-core';
import { readFileSync, mkdirSync } from 'node:fs';
import { BOSSES } from '../src/data/bosses.ts';
import { CH1_BOSS_FORMS } from '../src/data/combatArt.ts';
const forms = JSON.parse(readFileSync('src/data/bossFormArt.generated.json', 'utf8'));
const runtime = JSON.parse(readFileSync('src/data/artRuntime.generated.json', 'utf8')).files;
const bosses = BOSSES.filter((b) => b.phases?.length);
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const out = 'docs/images/art-global';
mkdirSync(out, { recursive: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
  for (let offset = 0; offset < bosses.length; offset += 3) {
    const rows = bosses
      .slice(offset, offset + 3)
      .map((b) => {
        const pictures = b.phases
          .map((p, phase) => {
            const form = forms.find((f) => f.id === b.id && f.phase === phase);
            const file =
              phase === 0
                ? `entities/boss/${b.id}/body.png`
                : form
                  ? `combat/global/${form.file}`
                  : `combat/ch1/${CH1_BOSS_FORMS[b.id][phase].file}`;
            return `<article><img src="http://127.0.0.1:4183/src/assets/runtime/${runtime[file].file}"><b>${phase + 1} · ${p.name[0]}</b></article>`;
          })
          .join('');
        return `<section><header>${b.name} <small>${b.id}</small></header><div>${pictures}</div></section>`;
      })
      .join('');
    await page.setContent(
      `<style>*{box-sizing:border-box}body{margin:0;padding:16px;background:#211c24;color:#f8deb8;font-family:system-ui}section{height:350px;border-bottom:1px solid #625142}header{height:36px;font-size:23px}small{font-size:13px;color:#baa58c}section>div{display:flex;gap:16px}article{width:330px;text-align:center;background:#322a32;border-radius:14px;padding:6px}img{width:280px;height:265px;object-fit:contain}b{display:block;font-size:18px}</style>${rows}`,
    );
    await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
    await page.screenshot({ path: `${out}/boss-forms-page${offset / 3 + 1}.png` });
  }
  console.log(`Rendered base and all stages for ${bosses.length} Bosses.`);
} finally {
  await browser.close();
}
