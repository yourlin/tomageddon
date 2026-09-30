// 从游戏数据自动生成中英双语文档（中文 docs/，英文 docs/en/）：
//   CHARACTERS 角色 · SKILLS 技能与状态 · WEAPONS 武器 · ITEMS 道具 · MONSTERS 怪物 · CHAPTERS 关卡 · DATA_TABLES 数值表
// 配图由 npm run docs:images 导出到 docs/images/。设计文档 GDD.md 为手写，英文版 docs/en/GDD.md 需同步维护。运行：npm run docs
import { setLang, type Lang } from '../src/i18n';
import { applyLanguage } from '../src/i18n/apply';
import { charactersDoc, skillsDoc, weaponsDoc } from './docs/pages-a';
import { itemsDoc, monstersDoc, chaptersDoc } from './docs/pages-b';
import { tablesDoc } from './docs/tables';

// 先中文后英文：applyLanguage 会把英文写回数据对象，不可逆
for (const l of ['zh', 'en'] as Lang[]) {
  setLang(l);
  applyLanguage(l);
  charactersDoc();
  skillsDoc();
  weaponsDoc();
  itemsDoc();
  monstersDoc();
  chaptersDoc();
  tablesDoc();
  console.log(`docs (${l}) generated`);
}
