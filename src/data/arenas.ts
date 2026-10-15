// 各章场地：形状、尺寸与障碍物（设计见 docs/design/ARENAS.md）。
// 每张地图都是一件「放大的物件」：平底锅、菜畦、冰箱冷藏室……物件的形状就是场地形状。
// 坐标都相对场地外接矩形的左上角；障碍物只挡移动，不挡任何子弹。
import type { ArenaDef } from '../systems/Arena';
import { BALANCE } from './balance';

/** 默认场地：1920 × 1200 矩形（开发工具、沙盒与没有配置的章节） */
export const DEFAULT_ARENA: ArenaDef = { shape: { kind: 'rect', w: BALANCE.arena.width, h: BALANCE.arena.height } };

/** 凸多边形顶点：以 (cx, cy) 为中心、rx × ry 的椭圆上取 n 个点，半径按低频波浪轻微起伏（幅度小，保持凸） */
function blob(cx: number, cy: number, rx: number, ry: number, n: number): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const k = 1 + 0.035 * Math.cos(3 * a + 1) + 0.015 * Math.cos(5 * a + 2);
    return [Math.round(cx + Math.cos(a) * rx * k), Math.round(cy + Math.sin(a) * ry * k)];
  });
}

export const ARENAS: Record<number, ArenaDef> = {
  // 第 1 章 · 平底锅：直径 1300 的圆，锅柄只是装饰（画在场地外）
  1: {
    name: ['平底锅', 'The Frying Pan'],
    desc: [
      '深夜灶台上一口烧热的不粘锅。黑色涂层上一圈圈细密的旋纹，锅底中心受热发红，油星四处反光；银色锅沿围成一圈，锅柄从右侧伸出锅外。圆形场地没有角落，小怪从锅沿四个方向爬进来。',
      'A hot nonstick pan on the stove at midnight. Fine swirls run across the black coating, the center glows red with heat and oil droplets glint everywhere; a silver rim rings the pan and the handle juts out to the right. The round arena has no corners, and monsters crawl in over the rim from four sides.',
    ],
    shape: { kind: 'ellipse', rx: 650, ry: 650 },
  },
  // 第 2 章 · 菜畦：圆角矩形，木栅栏围边；2 个稻草人、1 个土堆
  2: {
    name: ['菜畦', 'The Garden Bed'],
    desc: [
      '一块荒废的菜畦，泥土一垄一垄地排开，夹着碎石和枯叶，四周围着木栅栏。两个稻草人和一个土堆把场地分成几条走位路线。',
      'An abandoned garden bed: rows of furrowed soil strewn with pebbles and dead leaves, fenced in with wood. Two scarecrows and a dirt mound split the field into lanes.',
    ],
    shape: { kind: 'roundRect', w: 1760, h: 1100, r: 160 },
    obstacles: [
      { kind: 'circle', x: 480, y: 360, r: 42 },
      { kind: 'circle', x: 1290, y: 760, r: 42 },
      { kind: 'circle', x: 1240, y: 300, r: 62 },
    ],
  },
  // 第 3 章 · 冰箱冷藏室：竖长矩形，两层玻璃隔板（上层中间留口、下层两侧留口）
  3: {
    name: ['冰箱冷藏室', 'The Fridge'],
    desc: [
      '冰箱冷藏室内部，结霜的白色内壁上长着冰晶。两层玻璃隔板从两侧伸出，把冷藏室分成上中下三层，中间留出一条宽通道。',
      'Inside the fridge: frosted white walls covered in ice crystals. Two glass shelves split the arena into three tiers — the upper shelf has a gap in the middle, the lower one gaps at both ends.',
    ],
    shape: { kind: 'rect', w: 1500, h: 1500 },
    obstacles: [
      // 两层隔板都只从两侧伸出 350，中间留出 800 宽的通道（Boss 战需要躲避空间）
      { kind: 'rect', x: 0, y: 480, w: 350, h: 34 },
      { kind: 'rect', x: 1150, y: 480, w: 350, h: 34 },
      { kind: 'rect', x: 0, y: 1000, w: 350, h: 34 },
      { kind: 'rect', x: 1150, y: 1000, w: 350, h: 34 },
    ],
    spawn: [750, 750],
  },
  // 第 4 章 · 垃圾场空地：十字形，四角是垃圾山（场地外）
  4: {
    name: ['垃圾场空地', 'The Junkyard'],
    desc: [
      '城市垃圾场中间的一块十字形空地，开裂的沥青上满是油污，四个角落是堆成小山的垃圾袋。四条通道在中央广场交汇。',
      'A cross-shaped clearing in the city junkyard: cracked, oil-stained asphalt with mountains of trash bags piled in the four corners. Four lanes meet in a central plaza.',
    ],
    outline: [
      [770, 0],
      [1430, 0],
      [1430, 420],
      [2200, 420],
      [2200, 1080],
      [1430, 1080],
      [1430, 1500],
      [770, 1500],
      [770, 1080],
      [0, 1080],
      [0, 420],
      [770, 420],
    ],
    shape: {
      kind: 'union',
      parts: [
        {
          kind: 'polygon',
          pts: [
            [0, 420],
            [2200, 420],
            [2200, 1080],
            [0, 1080],
          ],
        },
        {
          kind: 'polygon',
          pts: [
            [770, 0],
            [1430, 0],
            [1430, 1500],
            [770, 1500],
          ],
        },
      ],
    },
  },
  // 第 5 章 · 番茄酱生产线：宽矩形，四台灌装机靠在上下两侧
  5: {
    name: ['番茄酱生产线', 'The Ketchup Line'],
    desc: [
      '番茄酱工厂里一条横向的长生产线，金属防滑地板上溅满番茄酱，四周是黄黑警示线。两条传送带贯穿车间，四台灌装机靠在上下两侧。',
      'A long ketchup production line: diamond-plate floors splattered with ketchup, edged with yellow-and-black hazard stripes. Two conveyor belts run the length of the hall, with four filling machines along the top and bottom.',
    ],
    shape: { kind: 'rect', w: 2400, h: 1300 },
    obstacles: [
      // 灌装机靠在四个角落，不挡两条传送带之间的主走道
      { kind: 'rect', x: 80, y: 80, w: 160, h: 100 },
      { kind: 'rect', x: 2160, y: 80, w: 160, h: 100 },
      { kind: 'rect', x: 80, y: 1120, w: 160, h: 100 },
      { kind: 'rect', x: 2160, y: 1120, w: 160, h: 100 },
    ],
  },
  // 第 6 章 · 玻璃温室：八边形，中央一座圆形花台
  6: {
    name: ['玻璃温室', 'The Greenhouse'],
    desc: [
      '一座八边形的玻璃温室，六角地砖上长满青苔，八面玻璃墙蒙着水汽。中央是一座种着枯萎花朵的圆形花台，适合绕着它风筝。',
      'An octagonal glass greenhouse: mossy hexagonal tiles under eight fogged glass walls. A round planter of withered flowers stands in the middle — perfect for kiting enemies around.',
    ],
    shape: {
      kind: 'polygon',
      pts: [
        [560, 0],
        [1340, 0],
        [1900, 560],
        [1900, 1340],
        [1340, 1900],
        [560, 1900],
        [0, 1340],
        [0, 560],
      ],
    },
    obstacles: [{ kind: 'circle', x: 950, y: 950, r: 150 }],
    spawn: [950, 1300],
  },
  // 第 7 章 · 腐烂番茄剖面：边缘凹凸的不规则圆，几个籽腔是不可站立的腐土坑
  7: {
    name: ['腐烂番茄剖面', 'The Rotten Tomato'],
    desc: [
      '一颗巨大腐烂番茄的剖面——腐烂真正的源头。外圈还是鲜红的果肉，越往中心越褐越黑；边缘是发皱发霉的番茄皮，四个籽腔是不能站立的腐土坑。',
      "The cross-section of a giant rotten tomato — the true source of the rot. The outer flesh is still bright red, turning brown and black toward the core; wrinkled, moldy skin forms the edge, and four seed cavities are pits of rot you can't stand in.",
    ],
    shape: { kind: 'polygon', pts: blob(1000, 900, 1000, 900, 32) },
    obstacles: [
      { kind: 'circle', x: 620, y: 520, r: 70 },
      { kind: 'circle', x: 1420, y: 560, r: 64 },
      { kind: 'circle', x: 560, y: 1260, r: 66 },
      { kind: 'circle', x: 1380, y: 1290, r: 72 },
    ],
  },
};

/** 本章的场地定义（没有配置的章节用默认矩形） */
export const arenaDefFor = (chapterId: number): ArenaDef => ARENAS[chapterId] ?? DEFAULT_ARENA;
