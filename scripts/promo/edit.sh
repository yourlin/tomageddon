#!/usr/bin/env bash
# 宣传视频剪辑：素材 + 字幕叠加层 → 成片（1920×1080 · 30fps · 33.4 秒）
# 用法：bash scripts/promo/edit.sh [zh|en]   zh → promo/tomageddon-promo.mp4，en → promo/tomageddon-promo-en.mp4
# 配乐 140 BPM，每 2 小节（≈3.43s）一刀，卡点剪辑。8 段画面 + 7 条字幕。
set -euo pipefail
cd "$(dirname "$0")/../../promo"
BAR2=3.4286 # 2 小节
PL=${1:-zh}
if [ "$PL" = en ]; then R=raw-en O=overlay-en OUTFILE=tomageddon-promo-en.mp4; else R=raw O=overlay OUTFILE=tomageddon-promo.mp4; fi
# 天赋段的截取起点：录制时写进 $R/marks.json 的「第一次加点」时刻（每次录制节奏都有出入，不能写死）。
# 录屏比标记晚约 0.2 秒出帧（screencast() 返回时还没开始出帧），画面里的点击 ≈ 标记 + 0.2；再提前 0.15 秒起剪 → 标记 + 0.05
TALENT_AT=$(python3 -c "import json;print(round(json.load(open('$R/marks.json')).get('talentFirstTap',3.15)+0.05,2))" 2>/dev/null || echo 3.2)
MUSIC=raw/music.webm # 两个语言版本共用配乐

# 片段：输入, 源起点, 时长
seg() { echo "trim=start=$1:duration=$2,setpts=PTS-STARTPTS,fps=30,scale=1920:1080:flags=lanczos,setsar=1"; }

# 字幕从左侧滑入 + 淡入淡出：overlay 名称 起 止
cap() {
  local name=$1 a=$2 b=$3
  echo "[$name]format=rgba,fade=t=in:st=$a:d=0.3:alpha=1,fade=t=out:st=$(python3 -c "print($b-0.25)"):d=0.25:alpha=1[${name}f];"
}

# 时间轴：标题 1 段 → combat 1.5 段（字幕从 T1 起）→ boss/levelup/shop/craft/talent/unlock 各 1 段 → 片尾 1.25 段
T1=$BAR2                                     # 标题结束 / 战斗字幕开始
T2=$(python3 -c "print(round($BAR2*2.5,4))") # 战斗结束（8.5715）
T3=$(python3 -c "print(round($T2+$BAR2,4))") # boss
T4=$(python3 -c "print(round($T3+$BAR2,4))") # levelup
T5=$(python3 -c "print(round($T4+$BAR2,4))") # shop
T6=$(python3 -c "print(round($T5+$BAR2,4))") # craft（仓库与配方合成）
T7=$(python3 -c "print(round($T6+$BAR2,4))") # talent（天赋树）
T8=$(python3 -c "print(round($T7+$BAR2,4))") # 片尾开始（29.1431）
END=$(python3 -c "print(round($T8+4.2857,4))")

ffmpeg -v error -y \
  -i $R/combat.webm -i $R/boss.webm -i $R/levelup.webm -i $R/shop.webm -i $R/craft.webm -i $R/talent.webm \
  -i $R/unlock.webm -i $R/menu.webm \
  -i $MUSIC \
  -loop 1 -t $END -i $O/title.png \
  -loop 1 -t $END -i $O/cap_combat.png -loop 1 -t $END -i $O/cap_boss.png -loop 1 -t $END -i $O/cap_levelup.png \
  -loop 1 -t $END -i $O/cap_shop.png -loop 1 -t $END -i $O/cap_craft.png -loop 1 -t $END -i $O/cap_talent.png \
  -loop 1 -t $END -i $O/cap_unlock.png \
  -loop 1 -t $END -i $O/end.png \
  -filter_complex "
    [0:v]$(seg 0 $T2)[s0];
    [1:v]$(seg 2.0 $BAR2)[s1];
    [2:v]$(seg 0.4 $BAR2)[s2];
    [3:v]$(seg 0.3 $BAR2)[s3];
    [4:v]$(seg 0.8 $BAR2)[s4];
    [5:v]$(seg $TALENT_AT $BAR2)[s5];
    [6:v]$(seg 1.4 $BAR2)[s6];
    [7:v]$(seg 0.5 4.2857),boxblur=12:2[s7];
    [s0][s1][s2][s3][s4][s5][s6][s7]concat=n=8:v=1:a=0[base];
    [9:v]format=rgba,fade=t=in:st=0.15:d=0.4:alpha=1,fade=t=out:st=$(python3 -c "print($T1-0.3)"):d=0.3:alpha=1[title];
    [10:v]copy[c1];[11:v]copy[c2];[12:v]copy[c3];[13:v]copy[c4];[14:v]copy[c5];[15:v]copy[c6];[16:v]copy[c7];
    $(cap c1 $T1 $T2) $(cap c2 $T2 $T3) $(cap c3 $T3 $T4) $(cap c4 $T4 $T5) $(cap c5 $T5 $T6) $(cap c6 $T6 $T7) $(cap c7 $T7 $T8)
    [17:v]format=rgba,fade=t=in:st=$T8:d=0.5:alpha=1[endf];
    [base][title]overlay=0:0:enable='lt(t,$T1)'[v0];
    [v0][c1f]overlay=x='if(lt(t-$T1,0.35),-700+(t-$T1)/0.35*700,0)':y=0:enable='between(t,$T1,$T2)'[v1];
    [v1][c2f]overlay=x='if(lt(t-$T2,0.35),-700+(t-$T2)/0.35*700,0)':y=0:enable='between(t,$T2,$T3)'[v2];
    [v2][c3f]overlay=x='if(lt(t-$T3,0.35),-700+(t-$T3)/0.35*700,0)':y=0:enable='between(t,$T3,$T4)'[v3];
    [v3][c4f]overlay=x='if(lt(t-$T4,0.35),-700+(t-$T4)/0.35*700,0)':y=0:enable='between(t,$T4,$T5)'[v4];
    [v4][c5f]overlay=x='if(lt(t-$T5,0.35),-700+(t-$T5)/0.35*700,0)':y=0:enable='between(t,$T5,$T6)'[v5];
    [v5][c6f]overlay=x='if(lt(t-$T6,0.35),-700+(t-$T6)/0.35*700,0)':y=0:enable='between(t,$T6,$T7)'[v6];
    [v6][c7f]overlay=x='if(lt(t-$T7,0.35),-700+(t-$T7)/0.35*700,0)':y=0:enable='between(t,$T7,$T8)'[v7];
    [v7][endf]overlay=0:0:enable='gte(t,$T8)',fade=t=in:st=0:d=0.3,fade=t=out:st=$(python3 -c "print($END-0.6)"):d=0.6[vout];
    [8:a]atrim=0:$END,asetpts=PTS-STARTPTS,afade=t=in:d=0.2,afade=t=out:st=$(python3 -c "print($END-1.8)"):d=1.8,alimiter=limit=0.89:level=false[aout]
  " \
  -map "[vout]" -map "[aout]" -t $END -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart \
  "$OUTFILE"
echo "成片：promo/${OUTFILE}（${END} 秒）"
