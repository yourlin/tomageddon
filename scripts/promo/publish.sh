#!/usr/bin/env bash
# 宣传片发布：成片 → public/promo/*.webm（随 GitHub Pages 发布）+ README 封面图（取带游戏名的标题帧）
# 用法：bash scripts/promo/publish.sh   （先 npm run promo:edit 生成 mp4）
set -euo pipefail
cd "$(dirname "$0")/../.."
POSTER_AT=1.8 # 标题叠加层 0.15s 起淡入、3.43s 前淡出，取中间完整显示的一帧
for L in zh en; do
  if [ "$L" = en ]; then SRC=promo/tomageddon-promo-en.mp4; else SRC=promo/tomageddon-promo.mp4; fi
  ffmpeg -v error -y -i "$SRC" -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -deadline good -cpu-used 3 \
    -c:a libopus -b:a 128k "public/promo/tomageddon-promo-$L.webm"
  ffmpeg -v error -y -ss $POSTER_AT -i "$SRC" -frames:v 1 -vf "scale=1280:-1" -q:v 3 "docs/images/promo-poster-$L.jpg"
  echo "$L：public/promo/tomageddon-promo-$L.webm · docs/images/promo-poster-$L.jpg"
done
