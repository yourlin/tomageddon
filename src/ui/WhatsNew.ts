// M4：「新功能」弹窗——老玩家第一次进入新版本时在主菜单弹出，列出本版本的重点玩法；新玩家不弹
import Phaser from 'phaser';
import { CHANGELOG } from '../data/changelog';
import { save, persist } from '../systems/Save';
import { tx, lang } from '../i18n';
import { text, button, panel, COLORS } from './UI';

/** 是否需要弹：当前版本有 news、玩家玩过旧版本（有开局记录或看过旧版更新日志）、还没看过本版本 */
export function shouldShowWhatsNew(version: string): boolean {
  const e = CHANGELOG[0];
  if (!e || e.version !== version || !e.news?.length) return false;
  if (save.seenVersion === version) return false;
  const played = !!save.seenVersion || Object.values(save.charRuns).some((n) => n > 0);
  return played;
}

/** 弹出卡片；关闭或点「查看更新日志」都会记为已看过 */
export function showWhatsNew(scene: Phaser.Scene, version: string, onLog: () => void): void {
  const e = CHANGELOG[0];
  const news = e.news ?? [];
  const W = scene.scale.width,
    H = scene.scale.height;
  const pick = (t: [string, string]) => (lang === 'en' ? t[1] : t[0]);
  const root = scene.add.container(0, 0).setDepth(5000);
  const mask = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive();
  const pw = Math.min(W - 60, 900),
    ph = Math.min(H - 60, 150 + Math.ceil(news.length / 2) * 96 + 80);
  const px = (W - pw) / 2,
    py = (H - ph) / 2;
  root.add([mask, panel(scene, px, py, pw, ph)]);
  root.add(text(scene, W / 2, py + 26, tx(`v${version} 新功能`, `New in v${version}`), 34, '#ffd166').setOrigin(0.5, 0));
  root.add(
    text(scene, W / 2, py + 74, pick(e.highlight), 16, COLORS.textDim, {
      wordWrap: { width: pw - 60, useAdvancedWrap: true },
      align: 'center',
    }).setOrigin(0.5, 0),
  );
  const colW = (pw - 60) / 2;
  news.forEach((n, i) => {
    const x = px + 30 + (i % 2) * colW,
      y = py + 140 + Math.floor(i / 2) * 96;
    root.add(text(scene, x, y, n.icon, 34).setOrigin(0, 0));
    root.add(text(scene, x + 52, y, pick(n.title), 20, '#ffffff'));
    root.add(text(scene, x + 52, y + 28, pick(n.desc), 15, COLORS.textDim, { wordWrap: { width: colW - 70, useAdvancedWrap: true } }));
  });
  const close = () => {
    save.seenVersion = version;
    persist();
    root.destroy();
  };
  const by = py + ph - 44;
  root.add(
    button(
      scene,
      W / 2 - 130,
      by,
      220,
      54,
      tx('查看更新日志', 'Full changelog'),
      () => {
        close();
        onLog();
      },
      COLORS.panel,
      20,
    ),
  );
  root.add(button(scene, W / 2 + 130, by, 220, 54, tx('知道了', 'Got it'), close, COLORS.primary, 22));
}
