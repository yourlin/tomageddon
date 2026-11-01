"""宣传视频剪映草稿：素材（record.mjs）+ 叠加层（overlays.py）+ 配乐 → 剪映草稿「番茄酱宣传片 v0.8 中文 / 英文」。
用法：/path/to/venv/python scripts/promo/jianying_draft.py zh|en
需要剪映 skill（jianying-pro）；可用环境变量 JY_SKILL_ROOT 指定 skill 目录。

配乐用剪映云端曲库的《Rush Hour Spin》（会员曲目，引用剪映自己的音乐缓存，不另存）。镜头时长按 3.43 秒一段规划
（标题 1 → 漫画 1 → 选角图鉴 1 → 战斗 1.5 → 6 章场地 1.5 → Boss 转阶段 1.5 → 升级 1 → 商店 1 → 合成 1 → 天赋 1
→ 挑战 / 图鉴 / 收藏 1.5 → 片尾 1.25，约 49 秒），每个镜头再取整到配乐的整数拍（节拍由 skill 的 beat_detect.py 生成），
镜头之间加短转场。
"""
import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SKILL = os.getenv("JY_SKILL_ROOT") or os.path.expanduser("~/.claude/skills/jianying-pro")
if not os.path.exists(os.path.join(SKILL, "scripts", "jy_wrapper.py")):
    raise ImportError(f"找不到剪映 skill：{SKILL}（可用 JY_SKILL_ROOT 指定）")
sys.path.insert(0, os.path.join(SKILL, "scripts"))
from jy_wrapper import JyProject  # noqa: E402

LANG = sys.argv[1] if len(sys.argv) > 1 else "zh"
RAW = os.path.join(ROOT, "promo", "raw" if LANG == "zh" else "raw-en")
OVL = os.path.join(ROOT, "promo", "overlay" if LANG == "zh" else "overlay-en")
MUSIC_ID, MUSIC_NAME = "7546547898043172918", "Rush Hour Spin"
MUSIC = os.path.expanduser("~/Movies/JianyingPro/User Data/Cache/music/62b40d4269a0e50f0cb19bb7dedb92ea.mp3")
BEATS = os.path.join(ROOT, "promo", "music", "rush_hour_spin.beats.json")
NAME = f"番茄酱宣传片 v0.8 {'中文' if LANG == 'zh' else '英文'}"

US = 1_000_000
BAR = round(60 / 140 * 8 * US)  # 2 小节
BEAT = BAR // 8
marks = json.load(open(os.path.join(RAW, "marks.json")))
# 录屏比标记晚约 0.2 秒出帧（screencast() 返回时还没开始出帧）：按标记截取时略微提前
at = lambda key, lead: max(0, round((marks[key] + 0.2 - lead) * US))  # noqa: E731

# 场地蒙太奇每个场地 2 拍
ARENA = round(2 * json.load(open(BEATS))["beat_interval"] * US)
# 分镜：(素材, 源起点 us, 规划时长 us, 字幕；"..." 表示沿用上一张字幕)
SHOTS = [
    ("opening", round(0.3 * US), BAR, "title"),  # 标题压在平静的开场战斗画面上
    ("comic", at("comicFirst", 0.25), BAR, None),
    ("journal", round(0.3 * US), BAR, "cap_journal"),
    ("combat", round(3.2 * US), BAR * 3 // 2, "cap_combat"),  # 跳过开局的键盘操作提示，含第二次大招
    *[(f"arena{ch}", round(0.4 * US), ARENA, "cap_arenas" if ch == 2 else "...") for ch in range(2, 8)],
    ("boss", at("bossPhase", 0.5), BAR * 3 // 2, "cap_boss"),
    ("levelup", round(0.4 * US), BAR, "cap_levelup"),
    ("shop", round(0.3 * US), BAR, "cap_shop"),
    ("craft", round(0.8 * US), BAR, "cap_craft"),
    ("talent", at("talentFirstTap", 0.15), BAR, "cap_talent"),
    ("challenge", round(0.3 * US), BEAT * 4, "cap_extras"),
    ("codex", round(0.3 * US), BEAT * 4, "..."),
    ("collection", round(0.3 * US), BEAT * 4, "..."),
    ("menu", round(0.5 * US), BAR * 5 // 4, "end"),
]


def fix_image_duration(project, seg, dur):
    """图片素材物理时长只有 0.04 秒，部分版本会把片段截成 1 帧：显式写回请求的时长（见 skill rules/review.md）"""
    seg.target_timerange.duration = dur
    if seg.source_timerange is not None:
        seg.source_timerange.start = 0
        seg.source_timerange.duration = dur
    for mat in project.script.materials.videos:
        if mat.material_id == seg.material_id and mat.duration < dur:
            mat.duration = dur


# 第 i 个镜头切到下一个镜头时的转场（名称, 秒）；转场时长不超过下一段素材入点前余量的 2 倍。
# 快切组（场地蒙太奇、挑战 / 图鉴 / 收藏）内部用卡拍硬切（None），转场只放在段落之间
TRANSITIONS = [
    ("叠化", 0.5),  # 标题 → 漫画
    ("泛光", 0.6),  # 漫画 → 选角
    ("变速推近", 0.6),  # 选角 → 战斗
    ("极速甩镜", 0.6),  # 战斗 → 场地蒙太奇
    *[None] * 5,  # 场地之间
    ("光刃破空", 0.7),  # 场地 → Boss
    ("电流冲击", 0.6),  # Boss → 升级
    ("分层甩动", 0.5),  # 升级 → 商店
    ("条带甩动", 0.5),  # 商店 → 合成
    ("分层甩动", 0.5),  # 合成 → 天赋
    ("交叠扫光", 0.6),  # 天赋 → 挑战
    None,  # 挑战 → 图鉴
    None,  # 图鉴 → 收藏
    ("叠化", 0.7),  # 收藏 → 片尾
]
assert len(TRANSITIONS) == len(SHOTS) - 1


def beat_cuts():
    """剪辑点落在配乐拍点上：每个镜头按规划时长取整数拍"""
    b = json.load(open(BEATS))
    beats = [round(x * US) for x in b["beats"]]
    step = b["beat_interval"] * US
    idx, cuts = 0, [0]
    for _, _, dur, _ in SHOTS:
        idx += max(1, round(dur / step))
        cuts.append(beats[idx])
    return cuts


def tag_cloud_music(project):
    """把配乐标回剪映云端曲目（剪映据此显示曲名并校验会员与版权）"""
    for mat in project.script.materials.audios:
        if os.path.abspath(mat.path) != os.path.abspath(MUSIC):
            continue
        base = mat.export_json

        def export_json(base=base):
            j = base()
            j.update(name=MUSIC_NAME, music_id=MUSIC_ID, type="music", category_name="")
            return j

        mat.export_json = export_json


def main():
    if not os.path.exists(MUSIC):
        raise FileNotFoundError(f"找不到配乐缓存：{MUSIC}（先在剪映里把《{MUSIC_NAME}》加到任意草稿，让剪映下载一次）")
    p = JyProject(NAME, width=1920, height=1080, overwrite=True)
    cuts = beat_cuts()
    segs = []
    caps = []  # [字幕, 起点, 时长]
    for i, (clip, src, _, cap) in enumerate(SHOTS):
        t, dur = cuts[i], cuts[i + 1] - cuts[i]
        seg = p.add_clip(os.path.join(RAW, f"{clip}.webm"), src, dur, t, "Video")
        if seg is None:
            raise RuntimeError(f"导入失败：{clip}")
        seg.volume = 0  # 录屏没有声音；保险起见静音，只留配乐
        segs.append(seg)
        if cap == "end":
            p.add_segment_effect(seg, "模糊")
        if cap == "...":
            caps[-1][2] += dur
        elif cap:
            caps.append([cap, t, dur])
    end = cuts[-1]
    for seg, tr in zip(segs, TRANSITIONS):
        if tr is None:
            continue
        name, sec = tr
        if p.add_transition_simple(name, seg, round(sec * US)) is None:
            raise RuntimeError(f"转场不可用：{name}")

    for cap, start, dur in caps:
        track = "Cards" if cap in ("title", "end") else "Captions"
        seg = p.add_overlay(os.path.join(OVL, f"{cap}.png"), start, dur, track, position="center", scale=1.0)
        fix_image_duration(p, seg, dur)
        if cap == "title":
            p.add_video_animation(seg, "渐显", "intro", round(0.4 * US))
            p.add_video_animation(seg, "渐隐", "outro", round(0.3 * US))
        elif cap == "end":
            p.add_video_animation(seg, "渐显", "intro", round(0.6 * US))
        else:
            # 字幕避开转场：转场进行时滑入，切到下一组前淡出
            p.add_video_animation(seg, "向右滑动", "intro", round(0.35 * US))
            p.add_video_animation(seg, "渐隐", "outro", round(0.25 * US))

    p.add_audio_safe(MUSIC, 0, end, "BGM", fade_in=round(0.2 * US), fade_out=round(1.8 * US))
    tag_cloud_music(p)
    p.save()
    print(f"草稿：{NAME}（{end / US:.2f} 秒，{len(SHOTS)} 个镜头，{sum(1 for t in TRANSITIONS if t)} 个转场，{len(caps)} 张叠加图）")


if __name__ == "__main__":
    main()
