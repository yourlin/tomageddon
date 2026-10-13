// 平衡报告的交互图表：服务端只把数据嵌进页面（<script type="application/json">），浏览器里用 ECharts（Apache-2.0，免费商用）绘制。
// echarts.min.js 由 writeReports 复制到 reports/ 目录、报告用相对路径加载，离线也能打开。
// 图表形式：line（按波次的折线，悬停十字线 + 所有系列的读数，可拖动缩放波次）、range（每波 P10–P90 竖线 + P50 圆点）。
// 一个页面只有一排章节筛选（全部 / 第 N 章），切换后所有图表一起重绘。原始数据表放在每张图下方的「查看数据表」里。
// 配色：数据可视化参考调色板的前 3 个分类色，已按报告的面板底色校验（浅色 #fbfcfa / 深色 #192019，色盲与对比度检查通过；
// 浅色下青绿色对比度 2.74，靠线尾直接标注 + 数据表补足）。

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// JSON 嵌进 <script> 时防止 </script> 截断
const embed = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

/** 一张图。datasets：{ all: {...}, '1': {...}, ... }，键是章节筛选值；
 *  line：{ x: number[], series: [{ name, slot, values: (number|null)[] }] }；
 *  range：{ x: number[], series: [{ name, slot, p10: [], p50: [], p90: [] }] } */
export function chart({ type = 'line', title, sub = '', fmt = 'int', unit = '', datasets, table = '' }) {
  const spec = { type, fmt, unit, datasets };
  return `<figure class="viz">
  <figcaption><b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</figcaption>
  <div class="viz-legend"></div>
  <div class="viz-plot"></div>
  <script type="application/json" class="viz-data">${embed(spec)}</script>
  ${table ? `<details class="viz-table"><summary>查看数据表</summary><div class="scroll">${table}</div></details>` : ''}
</figure>`;
}

/** 章节筛选：放在按波次的图表组最上方，所有 .viz 一起响应 */
export function chapterFilter(chapters) {
  const opts = [['all', '全部章节'], ...chapters.map((c) => [String(c), `第 ${c} 章`])];
  return `<div class="viz-filter" role="group" aria-label="按章节筛选图表">${opts
    .map(([v, t], i) => `<button type="button" data-ch="${v}" aria-pressed="${i === 0}">${t}</button>`)
    .join('')}</div>`;
}

export const CHART_CSS = `
:root{--s1:#2a78d6;--s2:#eb6834;--s3:#1baf7a;--grid:#e1e0d9;--base:#c3c2b7}
@media (prefers-color-scheme:dark){:root{--s1:#3987e5;--s2:#d95926;--s3:#199e70;--grid:#2c372a;--base:#3b4738}}
.viz-filter{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 6px;position:sticky;top:0;z-index:5;padding:10px 0;background:var(--ground)}
.viz-filter button{font:inherit;font-size:13px;padding:4px 12px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--ink2);cursor:pointer}
.viz-filter button:hover{border-color:var(--ink2)}
.viz-filter button[aria-pressed="true"]{background:var(--ink);border-color:var(--ink);color:var(--panel);font-weight:600}
.viz{margin:14px 0 22px;padding:14px 16px 10px;background:var(--panel);border:1px solid var(--line);border-radius:6px}
.viz figcaption{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;margin-bottom:2px}
.viz figcaption b{font-size:14px}
.viz figcaption span{font-size:12px;color:var(--muted)}
.viz-legend{display:none}
.viz-plot{position:relative;height:280px}
.viz-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:13px}
.viz-table{margin-top:6px}.viz-table summary{font-size:12px;color:var(--muted);padding:4px 0}
`;

/** 浏览器端：ECharts 绘制、章节筛选、自适应宽度、明暗主题 */
export const CHART_JS = `
(function () {
  if (!window.echarts) {
    document.querySelectorAll('.viz-plot').forEach(function (p) {
      var e = document.createElement('div');
      e.className = 'viz-empty';
      e.textContent = '缺少 echarts.min.js（应与报告放在同一目录）';
      p.appendChild(e);
    });
    return;
  }
  var tok = function (k) { return getComputedStyle(document.documentElement).getPropertyValue(k).trim(); };
  var fmtV = function (v, f, unit) {
    if (v === null || v === undefined || isNaN(v)) return '–';
    if (f === 'pct') return Math.round(v) + '%';
    if (f === 'sec') return Math.round(v * 10) / 10 + 's';
    return (Math.abs(v) >= 100 ? Math.round(v).toLocaleString('zh-CN') : String(Math.round(v * 10) / 10)) + (unit || '');
  };
  // 区间图的 Y 轴上限按 P90 算（ECharts 只按圆点数据算会把竖线截掉），取 5 的倍数
  var rangeMax = function (ds) {
    var m = 0;
    ds.series.forEach(function (s) { s.p90.forEach(function (v) { if (v !== null && v > m) m = v; }); });
    return Math.max(5, Math.ceil(m / 5) * 5);
  };
  var charts = [];
  var current = 'all';

  function option(c) {
    var ds = c.spec.datasets[current];
    if (!ds || !ds.x || ds.x.length < 2) return null;
    var f = c.spec.fmt, unit = c.spec.unit, isRange = c.spec.type === 'range';
    var ink = tok('--ink'), ink2 = tok('--ink2'), muted = tok('--muted'), grid = tok('--grid'), base = tok('--base'), panel = tok('--panel'), line = tok('--line');
    var col = function (slot) { return tok('--s' + slot); };
    var series;
    if (isRange) {
      series = [];
      ds.series.forEach(function (s, si) {
        var off = ds.series.length > 1 ? (si - (ds.series.length - 1) / 2) * 10 : 0;
        // P10–P90 竖线（自定义图形）
        series.push({
          type: 'custom', name: s.name, color: col(s.slot), silent: true, z: 2,
          data: ds.x.map(function (_, i) { return [i, s.p10[i], s.p90[i]]; }).filter(function (d) { return d[1] !== null; }),
          renderItem: function (params, api) {
            var a = api.coord([api.value(0), api.value(1)]), b = api.coord([api.value(0), api.value(2)]);
            return { type: 'line', shape: { x1: a[0] + off, y1: a[1], x2: b[0] + off, y2: b[1] }, style: { stroke: col(s.slot), lineWidth: 2, opacity: 0.55, lineCap: 'round' } };
          },
        });
        // P50 圆点（带 2px 底色描边）
        series.push({
          type: 'scatter', name: s.name, color: col(s.slot), z: 3, symbolSize: 10, symbolOffset: [off, 0],
          itemStyle: { color: col(s.slot), borderColor: panel, borderWidth: 2 },
          data: ds.x.map(function (_, i) { return s.p50[i]; }),
        });
      });
    } else {
      series = ds.series.map(function (s) {
        return {
          type: 'line', name: s.name, data: s.values, color: col(s.slot), connectNulls: false,
          showSymbol: false, symbol: 'circle', symbolSize: 8, lineStyle: { width: 2 },
          itemStyle: { color: col(s.slot), borderColor: panel, borderWidth: 2 },
          areaStyle: ds.series.length === 1 ? { opacity: 0.1 } : undefined,
          emphasis: { focus: 'series' },
          // 线尾直接标注末端数值（文字用正文色，不用系列色）
          endLabel: { show: true, color: ink2, fontSize: 12, formatter: function (p) { return fmtV(p.value, f, unit); } },
          labelLayout: { moveOverlap: 'shiftY' },
        };
      });
    }
    var tooltip = {
      trigger: 'axis',
      backgroundColor: panel, borderColor: line, textStyle: { color: ink2, fontSize: 12 },
      axisPointer: { type: 'line', lineStyle: { color: muted, width: 1, type: 'solid' } },
      formatter: function (ps) {
        if (!ps.length) return '';
        var i = ps[0].dataIndex, out = '<div style="color:' + muted + '">第 ' + ds.x[i] + ' 波</div>';
        ds.series.forEach(function (s) {
          var v = isRange ? fmtV(s.p50[i], f) + '（' + fmtV(s.p10[i], f) + '–' + fmtV(s.p90[i], f) + '）' : fmtV(s.values[i], f, unit);
          out += '<div><span style="display:inline-block;width:12px;height:2px;margin-right:8px;vertical-align:3px;background:' + col(s.slot) + '"></span><b style="color:' + ink + '">' + v + '</b>&ensp;' + s.name.replace(/</g, '&lt;') + '</div>';
        });
        return out;
      },
    };
    return {
      animationDuration: 300,
      textStyle: { fontFamily: getComputedStyle(document.body).fontFamily },
      grid: { left: 56, right: isRange ? 20 : 76, top: ds.series.length > 1 ? 34 : 14, bottom: 60 },
      legend: { show: ds.series.length > 1, top: 0, left: 0, itemWidth: isRange ? 8 : 14, itemHeight: isRange ? 8 : 4, icon: isRange ? 'circle' : 'roundRect',
        textStyle: { color: ink2, fontSize: 12 }, data: ds.series.map(function (s) { return s.name; }) },
      tooltip: tooltip,
      xAxis: { type: 'category', data: ds.x, boundaryGap: isRange, name: '波次', nameLocation: 'middle', nameGap: 24, nameTextStyle: { color: muted, fontSize: 11 },
        axisLine: { lineStyle: { color: base } }, axisTick: { show: false }, axisLabel: { color: muted, fontSize: 11 } },
      yAxis: { type: 'value', min: 0, max: f === 'pct' ? function (v) { return Math.max(100, Math.ceil(v.max / 10) * 10); } : isRange ? rangeMax(ds) : undefined, interval: isRange ? rangeMax(ds) / 5 : undefined,
        splitLine: { lineStyle: { color: grid, width: 1 } }, axisLabel: { color: muted, fontSize: 11, formatter: function (v) { return fmtV(v, f); } } },
      dataZoom: [{ type: 'inside' }, { type: 'slider', height: 12, bottom: 0, borderColor: line, fillerColor: 'rgba(128,128,128,.15)', handleSize: 14,
        textStyle: { color: muted, fontSize: 10 }, dataBackground: { lineStyle: { color: base }, areaStyle: { color: grid } } }],
      series: series,
    };
  }

  function draw(c) {
    var opt = option(c);
    var empty = c.plot.querySelector('.viz-empty');
    if (!opt) {
      c.inst.clear();
      if (!empty) {
        empty = document.createElement('div');
        empty.className = 'viz-empty';
        empty.textContent = '这个章节的数据不足';
        c.plot.appendChild(empty);
      }
      return;
    }
    if (empty) empty.remove();
    c.inst.setOption(opt, true);
  }

  document.querySelectorAll('.viz').forEach(function (fig) {
    var data = fig.querySelector('.viz-data');
    if (!data) return;
    var plot = fig.querySelector('.viz-plot');
    var c = { spec: JSON.parse(data.textContent), plot: plot, inst: echarts.init(plot, null, { renderer: 'svg' }) };
    charts.push(c);
    draw(c);
    if (window.ResizeObserver) new ResizeObserver(function () { c.inst.resize(); }).observe(plot);
  });
  document.querySelectorAll('.viz-filter button').forEach(function (b) {
    b.addEventListener('click', function () {
      current = b.dataset.ch;
      document.querySelectorAll('.viz-filter button').forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      charts.forEach(draw);
    });
  });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { charts.forEach(draw); });
})();
`;
