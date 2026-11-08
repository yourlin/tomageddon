/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_pumpkin(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass pumpkin skin id');
const report = { skinId, status: 'pending', cases: [], errors: [], scope: 'Actual pumpkinPhase equippedcast4frames,2.5svisibletranslucentinvulnerability,1.5sdecoy,contactdamage600mscadence,ghostfire andcleanup;three tiers/both directions;finalvisual separate.' };
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal'] });
try {
  for (const tier of ['low', 'standard', 'high']) for (const direction of [1, -1]) {
    const page = await browser.newPage();
    await freezeArtHmr(page);
    page.on('pageerror', e => report.errors.push(e.stack || e.message));
    await page.evaluateOnNewDocument(({ skinId, tier }) => localStorage.setItem('tomato_sister_save_v1', JSON.stringify({ saveVersion: 2, settings: { autoSkill: false, graphicsQuality: tier }, meta: { skins: [skinId], skinOf: { pumpkin: skinId } } })), { skinId, tier });
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1', { timeout: 90000 });
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => { window.run.start('pumpkin', 1, false, 0); window.game.scene.getScene('Menu').scene.start('Game'); });
    await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game')?.player?.active, { timeout: 60000 });
    await page.evaluate(async ({ skinId, direction }) => {
      const g = window.game.scene.getScene('Game'), p = g.player;
      if (p.art?.choice.entry.skinId !== skinId || !p.hasAuthoredAnimation('cast')) throw Error('Skin fallback or missing cast');
      g.timeLeft = 999; g.iframes = 0; g.damagePlayer = () => {}; g.weapons.update = () => {}; g.stats.speed = 0;
      const { controls } = await import('/src/systems/Controls.ts');
      controls.joyX = 0; controls.joyY = 0; g.moveX = 0; g.moveY = 0; g.facing = direction; p.tick(0, 0, direction);
      await new Promise(resolve=>g.time.delayedCall(600,resolve));
      const x=p.x,y=p.y,point=g.arena.clamp(p.x+15,p.y,24),target=g.spawnEnemyNow('mold',point.x,point.y);target.speed=0;target.hp=target.maxHp=1e8;
      await new Promise(resolve=>g.time.delayedCall(600,resolve));
      const start=g.time.now,originalHit=g.weaponHit,before=new Set(g.children.list),effects=g.skill.effects.length,puffs=new Set();
      const q={frames:new Set(),requiredFrames:p.art.choice.entry.anims.cast.frames,wrongFlip:false,minAlpha:1,sawDecoy:false,decoyClearedWhileGhost:false,hits:[],done:false};
      g.weaponHit=function(e,info,...rest){if(e===target&&info.weaponId==='skill')q.hits.push({at:g.time.now-start,dmg:info.dmg});return originalHit.call(this,e,info,...rest);};
      const sample=()=>{
        const t=g.time.now-start;
        if(p.state==='cast'){q.frames.add(Number(p.img.frame.name));q.wrongFlip ||= p.img.flipX !== (direction<0);}
        if(g.skill.ghostT>0)q.minAlpha=Math.min(q.minAlpha,p.alpha);
        q.sawDecoy ||= !!g.decoy;
        if(t>1700&&g.skill.ghostT>0)q.decoyClearedWhileGhost ||= !g.decoy;
        p.x=x;p.y=y;target.x=point.x;target.y=point.y;target.kvx=target.kvy=0;
        for(const v of g.children.list)if(!before.has(v)&&v.depth===10700)puffs.add(v);
        if(t>4200){Object.assign(q,{done:true,ghostExpired:g.skill.ghostT<=0,decoyCleared:!g.decoy,damaged:target.hp<1e8,opaqueRestored:p.alpha===1,puffCount:puffs.size,puffsDestroyed:[...puffs].every(v=>!v.scene),effectsCleared:g.skill.effects.length<=effects});g.weaponHit=originalHit;g.events.off('postupdate',sample);}
      };
      window.__pumpkinSkinProbe=q;g.events.on('postupdate',sample);g.skill.cd=0;g.skill.use();q.initialGhost=g.skill.ghostT;q.initialInvulnerable=g.skill.invulnerable;sample();
    }, { skinId, direction });
    await page.waitForFunction(()=>window.__pumpkinSkinProbe.done,{timeout:15000});
    const result=await page.evaluate(()=>{const q=window.__pumpkinSkinProbe;return {...q,frames:[...q.frames]};});
    if(result.requiredFrames.length!==4||result.requiredFrames.some(f=>!result.frames.includes(f))||result.wrongFlip||!result.initialInvulnerable||Math.abs(result.initialGhost-2.5)>0.02||result.minAlpha<=0||result.minAlpha>=0.5||!result.sawDecoy||!result.decoyClearedWhileGhost||!result.ghostExpired||!result.decoyCleared||!result.damaged||!result.opaqueRestored||result.hits.length<3||result.hits.some((h,i)=>i>0&&h.at-result.hits[i-1].at<550)||result.puffCount<20||!result.puffsDestroyed||!result.effectsCleared)throw Error(JSON.stringify({tier,direction,...result}));
    report.cases.push({ tier, direction, ...result });
    await page.close();
  }
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'passed';
} catch (e) { report.status = 'failed'; report.errors.push(e.stack || String(e)); process.exitCode = 1; }
finally { writeFileSync(`reports/art-pilot/${skinId}-skill-motion-native.json`, JSON.stringify(report, null, 2) + '\n'); await closeArtBrowser(browser); }
