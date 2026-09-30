#!/usr/bin/env bash
# 宣传视频剪辑：promo/raw 素材 + promo/overlay 字幕 → promo/tomageddon-promo.mp4（1920×1080 · 30fps · 30 秒）
# 配乐 140 BPM，每 2 小节（≈3.43s）一刀，卡点剪辑。
set -euo pipefail
cd "$(dirname "$0")/../../promo"
BAR2=3.4286 # 2 小节
R=raw
O=overlay

# 片段：输入, 源起点, 时长
seg() { echo "trim=start=$1:duration=$2,setpts=PTS-STARTPTS,fps=30,scale=1920:1080:flags=lanczos,setsar=1"; }

# 字幕从左侧滑入 + 淡入淡出：overlay 名称 起 止
cap() {
  local name=$1 a=$2 b=$3
  echo "[$name]format=rgba,fade=t=in:st=$a:d=0.3:alpha=1,fade=t=out:st=$(python3 -c "print($b-0.25)"):d=0.25:alpha=1[${name}f];"
}

T1=$BAR2                                   # 标题结束 / 战斗字幕开始
T2=$(python3 -c "print(round($BAR2*2.5,4))") # 战斗结束（8.571）
T3=$(python3 -c "print(round($T2+$BAR2,4))")
T4=$(python3 -c "print(round($T3+$BAR2,4))")
T5=$(python3 -c "print(round($T4+$BAR2,4))")
T6=$(python3 -c "print(round($T5+$BAR2,4))")
T7=$(python3 -c "print(round($T6+$BAR2,4))") # 片尾开始（25.714）
END=30

ffmpeg -v error -y \
  -i $R/combat.webm -i $R/boss.webm -i $R/levelup.webm -i $R/shop.webm -i $R/forge.webm -i $R/unlock.webm -i $R/menu.webm \
  -i $R/music.webm \
  -loop 1 -t $END -i $O/title.png \
  -loop 1 -t $END -i $O/cap_combat.png -loop 1 -t $END -i $O/cap_boss.png -loop 1 -t $END -i $O/cap_levelup.png \
  -loop 1 -t $END -i $O/cap_shop.png -loop 1 -t $END -i $O/cap_forge.png -loop 1 -t $END -i $O/cap_unlock.png \
  -loop 1 -t $END -i $O/end.png \
  -filter_complex "
    [0:v]$(seg 0 $T2)[s0];
    [1:v]$(seg 2.0 $BAR2)[s1];
    [2:v]$(seg 0.4 $BAR2)[s2];
    [3:v]$(seg 0.3 $BAR2)[s3];
    [4:v]$(seg 5.8 $BAR2)[s4];
    [5:v]$(seg 1.4 $BAR2)[s5];
    [6:v]$(seg 0.5 4.2857),boxblur=12:2[s6];
    [s0][s1][s2][s3][s4][s5][s6]concat=n=7:v=1:a=0[base];
    [8:v]format=rgba,fade=t=in:st=0.15:d=0.4:alpha=1,fade=t=out:st=$(python3 -c "print($T1-0.3)"):d=0.3:alpha=1[title];
    [9:v]copy[c1];[10:v]copy[c2];[11:v]copy[c3];[12:v]copy[c4];[13:v]copy[c5];[14:v]copy[c6];
    $(cap c1 $T1 $T2) $(cap c2 $T2 $T3) $(cap c3 $T3 $T4) $(cap c4 $T4 $T5) $(cap c5 $T5 $T6) $(cap c6 $T6 $T7)
    [15:v]format=rgba,fade=t=in:st=$T7:d=0.5:alpha=1[endf];
    [base][title]overlay=0:0:enable='lt(t,$T1)'[v0];
    [v0][c1f]overlay=x='if(lt(t-$T1,0.35),-700+(t-$T1)/0.35*700,0)':y=0:enable='between(t,$T1,$T2)'[v1];
    [v1][c2f]overlay=x='if(lt(t-$T2,0.35),-700+(t-$T2)/0.35*700,0)':y=0:enable='between(t,$T2,$T3)'[v2];
    [v2][c3f]overlay=x='if(lt(t-$T3,0.35),-700+(t-$T3)/0.35*700,0)':y=0:enable='between(t,$T3,$T4)'[v3];
    [v3][c4f]overlay=x='if(lt(t-$T4,0.35),-700+(t-$T4)/0.35*700,0)':y=0:enable='between(t,$T4,$T5)'[v4];
    [v4][c5f]overlay=x='if(lt(t-$T5,0.35),-700+(t-$T5)/0.35*700,0)':y=0:enable='between(t,$T5,$T6)'[v5];
    [v5][c6f]overlay=x='if(lt(t-$T6,0.35),-700+(t-$T6)/0.35*700,0)':y=0:enable='between(t,$T6,$T7)'[v6];
    [v6][endf]overlay=0:0:enable='gte(t,$T7)',fade=t=in:st=0:d=0.3,fade=t=out:st=$(python3 -c "print($END-0.6)"):d=0.6[vout];
    [7:a]atrim=0:$END,asetpts=PTS-STARTPTS,afade=t=in:d=0.2,afade=t=out:st=$(python3 -c "print($END-1.8)"):d=1.8,alimiter=limit=0.89:level=false[aout]
  " \
  -map "[vout]" -map "[aout]" -t $END -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart \
  tomageddon-promo.mp4
echo "成片：promo/tomageddon-promo.mp4"
