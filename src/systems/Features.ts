// 玩法开关：还没定稿的玩法这一版先不对玩家开放，数据与素材照常保留，下个版本把对应常量改成 true 即可恢复。
// 地址带 ?skins=1 / ?buildshare=1 可以临时打开（美术与功能验收脚本都带这些参数）。
const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');

/**
 * 皮肤玩法是否随版本发布。
 * 关掉只影响玩家入口与装备生效，皮肤数据（data/skins.ts）、图集清单与 showcaseRig 都照常工作，
 * 美术素材可以继续做、继续验收。
 */
export const SKINS_RELEASED = false;

/**
 * 结算 / 历史的本局数据页里「复制构筑分享码」「用此构筑练习」是否随版本发布。
 * 关掉只去掉这两个入口；构筑码照常记进存档，练习模式本身和粘贴导入构筑码都不受影响。
 */
export const BUILD_SHARE_RELEASED = false;

/** 本次运行生效的开关；测试里可以直接改 */
export const features = {
  skins: SKINS_RELEASED || params.has('skins'),
  buildShare: BUILD_SHARE_RELEASED || params.has('buildshare'),
};

/** 皮肤玩法（购买、装备、局内生效、收藏与露出入口）是否开放 */
export const skinsEnabled = (): boolean => features.skins;

/** 本局数据页的构筑分享码 / 练习入口是否开放 */
export const buildShareEnabled = (): boolean => features.buildShare;
