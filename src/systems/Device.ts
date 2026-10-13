// 设备识别：iPhone / iPad、微信内置浏览器，以及据此启用的「手机低内存模式」。
// iOS 对单个网页（微信 WebView 更严）的内存 / 显存有硬上限，超了系统直接杀掉页面甚至整个微信，
// 所以这些环境下降低高清倍率、关闭多重采样抗锯齿、放慢启动时的贴图生成，压低启动峰值。
const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
export const IS_WECHAT = /MicroMessenger/i.test(ua);
export const IS_IOS =
  /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);

/** 手机低内存模式：iOS（Safari / 微信 / 其他内核相同的浏览器）与任意平台的微信内置浏览器 */
export const LOW_MEM = IS_IOS || IS_WECHAT;

/** 低内存模式下的高清倍率上限：微信 1（不放大），其他 iOS 浏览器 1.25 */
export const LOW_MEM_MAX_RES = IS_WECHAT ? 1 : 1.25;
