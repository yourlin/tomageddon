# Tomageddon

[中文](README.md) · **English**

🎮 **Play online: <https://yourlin.github.io/tomageddon/>** (auto-deployed by GitHub Actions on every push to main)

[![Tomageddon trailer (click to play)](docs/images/promo-poster-en.jpg)](https://yourlin.github.io/tomageddon/promo/tomageddon-promo-en.webm)

<sub>▶ Click the cover to watch the 30-second trailer</sub>

A top-down 2D arena survival roguelite for the browser. Phaser 3 (WebGL) + TypeScript + Vite, PC and landscape mobile, **Chinese and English**. **All art and background music are generated procedurally** — no image or audio assets are needed to run it.

## Contents

- [Story](#story)
- [Gameplay](#gameplay)
  - [Core loop](#core-loop)
  - [Controls](#controls)
  - [Progression & economy](#progression--economy)
- [Content](#content)
- [Documentation](#documentation)
- [Changelog](docs/en/CHANGELOG.md)
- [Development](#development)
  - [Running](#running)
  - [Tuning values](#tuning-values)
  - [Localization](#localization)
  - [Code style](#code-style)
  - [Balance testing](#balance-testing)
  - [Trailer](#trailer)
  - [Versioning](#versioning)
  - [Replacing art (optional)](#replacing-art-optional)
  - [Debugging](#debugging)
- [Support the Author](#support-the-author)
- [License](#license)

## Story

Ketchup Town is being eaten away by "the Rot": mold, pests and possessed kitchenware run wild. Tomato Sister and her fruit-and-veggie friends set out from the Midnight Kitchen, fight through the Wild Garden, the Frozen Fridge and the City Junkyard, and storm the Ketchup Factory to defeat the source of the Rot.

## Gameplay

### Core loop

1. **Pick a character and chapter**: every [character](docs/en/CHARACTERS.md) has unique stats, traits, a **signature talent** (a unique mechanic that changes how they play), starting weapons and an active skill.
2. **Fight waves**: 15 waves per chapter in chapters 1–4; from chapter 5, 20 waves and +5 per chapter (up to 50); 20–60 seconds each. Weapons aim and fire on their own; you dodge bullets, telegraphed zones, lasers and charges, and time your [skill](docs/en/SKILLS.md).
3. **Elites and bosses**: [elites](docs/en/MONSTERS.md#elites) every 5 waves, a [boss](docs/en/MONSTERS.md#bosses) on the last wave of each chapter (after 90 seconds it enrages, with damage stacking until the fight is decided). Each run draws them at random from the chapter pool.
4. **Between waves**: harvest & interest → level-up choices → open crates → shop for [weapons](docs/en/WEAPONS.md) and [items](docs/en/ITEMS.md), combine, reroll, lock.
5. **Achievements & unlocks**: clearing a [chapter](docs/en/CHAPTERS.md) unlocks the next one; [achievements](docs/en/ACHIEVEMENTS.md) (Bronze/Silver/Gold/Diamond tiers) grant points, and every locked character is tied to one achievement that unlocks it automatically.
6. **Talent tree**: milestone achievements also grant talent points to spend on the [talent maps](docs/en/TALENTS.md) of 6 branches — boost your starting stats or gain special abilities (knives on dodge, healing on cast, executes, a last stand…), with free resets at any time.
7. **Endless mode**: after clearing a chapter you can play it in Endless — no wave limit after the chapter's last wave, elites and a boss every 15 waves, ever-stronger monsters. How far can you go?
8. **Weapon evolution**: a T4 weapon plus a specific item evolves in the shop into one of 12 [super weapons](docs/en/WEAPONS.md#evolution), keeping its affixes and forge level.
9. **Daily / weekly challenges**: a fixed character, chapter, set of [rule modifiers](docs/en/CHAPTERS.md#challenges) and shop every day and every week — everyone gets the same rolls; your best and streak are recorded.

After each run you can open "Run stats" (damage by source, seeds per wave), and "History" on the main menu keeps your last 30 runs. New players get short tips the first time they meet each system (re-enable them in Settings).

Players and enemies share one set of [buffs and debuffs](docs/en/SKILLS.md#statuses): Poison, Freeze, Curse, Armor Break… versus Shield, Rage, Haste, Regen.

### Controls

| Platform | Move                                        | Skill                     | Pause            |
| -------- | ------------------------------------------- | ------------------------- | ---------------- |
| PC       | WASD / arrow keys                           | Space                     | ESC / P          |
| Mobile   | Floating joystick anywhere on the left half | Skill button bottom-right | Top-right button |

**Phones & WeChat**

- The main menu and pause menu have a Fullscreen button; on phones the first tap automatically tries fullscreen and locks landscape
- iPhone Safari and WeChat can’t make web pages fullscreen; the button shows a guide instead. In Safari use Share → “Add to Home Screen” and launch from the icon for fullscreen landscape; in WeChat tap “···” → “Open in Browser”
- Android WeChat can usually go fullscreen directly

### Progression & economy

- Kills drop **Seeds** (XP + currency), fruit (healing) and crates (items)
- 21 stats: Max HP, HP Regen, Life Steal, Damage, Melee/Ranged/Elemental Damage, Attack Speed, Crit, Range, Armor, Dodge, Move Speed, Luck, Harvest, Pickup Range, XP Gain, Skill Cooldown/Damage/Area/Duration
- Two identical weapons of the same tier combine into the next tier (T1–T4); items stack (some have caps)
- T3 / T4 weapons roll random affixes (tiers I–IV) that can be rerolled in the shop, all at once or one by one; T4 weapons can be forged (+1 to +10) — higher levels cost more and succeed less often
- Seeds left on the ground at wave end aren't auto-collected; they go into a bonus pool, and next wave every Seed you pick up is doubled until the pool runs out
- Piggy-bank items pay interest; HP refills at the start of every wave
- Local browser save: permanent progress + mid-run save; pause and "Save & Quit" to resume from the current wave later
- The result screen can generate a share poster (character, stats, QR code) — long-press to send it in WeChat; scanning opens the game

## Content

| Category        | Count        | Notes                                                                                                                                                                          | Docs                                                                        |
| --------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Characters      | 33           | All-rounders, melee tanks, marksmen, elemental/status, crit assassins, dodge/survival, economy/growth, explosives/berserkers                                                   | [Characters](docs/en/CHARACTERS.md)                                         |
| Skills          | 33           | 13 forms: nova, missile, screen clear, focused barrage, binding field, mass debuff, self buff, stealth, dash, strikes, ring, drain heal, clones; cooldowns computed from power | [Skills](docs/en/SKILLS.md)                                                 |
| Statuses        | 28           | 16 debuffs + 12 buffs, shared by players and enemies                                                                                                                           | [Status effects](docs/en/SKILLS.md#statuses)                                |
| Weapons         | 50 + 12      | Melee 17 / ranged 18 / elemental 15, 9 attack types, 4 tiers; most characters have favored weapons (+20% damage); plus 12 evolved super weapons                                                                                                                            | [Weapons](docs/en/WEAPONS.md)                                               |
| Items           | 566          | 46 classic items + 52 themed series × 10, power-budgeted per rarity                                                                                                            | [Items](docs/en/ITEMS.md)                                                   |
| Monsters        | 75 + 2       | 75 monsters (10 AI behaviors) + 2 terrain critters, 15 per chapter                                                                                                                             | [Monsters](docs/en/MONSTERS.md)                                             |
| Elites / Bosses | 30 / 15      | 11 attack patterns, phase two, enrage; 12 elite affixes                                                                                                                        | [Elites](docs/en/MONSTERS.md#elites) · [Bosses](docs/en/MONSTERS.md#bosses) |
| Achievements    | 865          | Tiered medals (Bronze/Silver/Gold/Diamond), bigger rewards for harder goals; covers monsters, weapons, item series, skills, statuses, chapters, challenges, Endless and every character; specific achievements unlock characters, milestones also grant talent points | [Achievements](docs/en/ACHIEVEMENTS.md)                                     |
| Talent tree     | 6 × 81       | Might, Guard, Agility, Arcane, Fortune, Alchemy — laid out like maps; all points together master about 2.5 branches                                                           | [Talents](docs/en/TALENTS.md)                                               |
| Chapters        | 5 × 15 waves | Midnight Kitchen, Wild Garden, Frozen Fridge, City Junkyard, Ketchup Factory; 2–3 terrain hazards each; cleared chapters unlock their Endless mode (no wave limit)               | [Chapters](docs/en/CHAPTERS.md)                                             |

Procedural art: Canvas cartoon shading + part-based rigs + 12 animation states (idle/move/attack/hurt/windup/charge/stun/freeze/cast/spawn/death/victory).

Procedural music: electronic loops synthesized live with WebAudio. The main menu, shop, boss fight and each of the 5 chapters have their own style (tempo, mode, chord progression, drums and melody).

## Documentation

| Doc                                     | Contents                                                                         |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| [Characters](docs/en/CHARACTERS.md)     | Every character's role, traits, stats, starting weapons, skill and how to unlock |
| [Skills & Statuses](docs/en/SKILLS.md)  | Skill rules, the 13 forms, per-skill numbers; all buffs and debuffs              |
| [Weapons](docs/en/WEAPONS.md)           | Attack types, tier values and effects of every weapon                            |
| [Items](docs/en/ITEMS.md)               | Rarity and power budget, level-up choices, classic items and every series        |
| [Monsters](docs/en/MONSTERS.md)         | Behaviors, attack patterns, phase two and affixes of monsters, elites and bosses |
| [Chapters](docs/en/CHAPTERS.md)         | Wave rules, chapter difficulty, terrain hazards, monster/elite/boss pools        |
| [Achievements](docs/en/ACHIEVEMENTS.md) | Tier goals and points of every achievement, character prices and prerequisites   |
| [Talents](docs/en/TALENTS.md)           | Talent point sources and every talent in all 6 branches                          |
| [Design Doc](docs/en/GDD.md)            | Systems, formulas, art & animation, balancing method, architecture               |
| [Data Tables](docs/en/DATA_TABLES.md)   | All numbers in one place                                                         |
| [Changelog](docs/en/CHANGELOG.md)       | Player-facing release notes (also in the game's main menu)                       |

Everything except the design doc is generated from `src/data/` by `npm run docs`, in both languages, with cross-links between docs. Characters, weapons, items, monsters, elites and bosses come with images exported by `npm run docs:images`, which runs the game's own procedural drawing code; re-export after changing any look.

## Development

### Running

```bash
npm install
npm run dev        # dev server (--host, reachable from phones on the same LAN)
npm run build      # production build into dist/ (static files, any static host works)
npm run preview    # preview the build
npm run release    # release: bump version +0.0.1, then build (release:minor / release:major)
npm run typecheck  # TypeScript type check
npm run lint       # ESLint (lint:fix to auto-fix)
npm run format     # Prettier (format:check to only check)
npm run docs       # regenerate the bilingual docs (docs/ and docs/en/)
npm run docs:images # export doc images from the game's procedural art into docs/images/ (needs Chrome)
npm run balance    # build and run the headless balance test (options below)
```

### Tuning values

All numbers live in `src/data/`: `balance.ts` (global formulas), `characters.ts`, `weapons.ts`, `items.ts`, `enemies.ts`, `bosses.ts`, `chapters.ts`. Run `npm run docs` afterwards to sync the docs.

### Localization

- Chinese / English. Follows the browser language by default; switch under Settings → Language (reloads the page), or force it with `?lang=en` / `?lang=zh`
- UI strings use `tx('中文', 'English')` (`src/i18n/index.ts`); English data text (characters, items, monsters…) lives in `src/i18n/en/*.ts`, keyed by id, and is written back into the data at startup by `src/i18n/apply.ts`
- New data needs matching English entries; `npm run docs` generates both language versions of the docs

### Code style

- ESLint (`eslint.config.js`, TypeScript recommended rules) + Prettier (`.prettierrc.json`, 140 columns, single quotes)
- Before committing: `npm run lint && npm run format:check && npm run typecheck`
- TypeScript is pinned to 6.0.x: TypeScript 7 no longer ships the compiler API that typescript-eslint needs

### Balance testing

```bash
npm run balance -- --chapters 1,2,3 --runs 2 [--workers 10] [--min-workers 4] [--cpu 80] [--speed max] [--chars corn,tomato] [--timeout 240] [--talents none|mid|full] [--endless] [--no-talents id,id] [--fresh]
```

- Runs headless Chrome pages in parallel; concurrency adapts to whole-machine CPU load (target `--cpu`, default 80%, between `--min-workers` and `--workers`, default 40% of cores to cores−1), at low process priority, with a progress bar showing elapsed and estimated remaining time. Test mode skips rendering; `--speed max` (default) simulates as many steps per frame as fit in the time budget
- Every run writes an HTML report: `docs/reports/balance-<time>.html` (unfinished runs get a `-partial` suffix); `docs/BALANCE_REPORT.html` / `.md` is the latest. Reports are not committed
- Progress is saved to `scripts/.batch-progress.json` after every game; after an interruption (Ctrl+C, crash, power loss) **rerun with the same options to resume**; `--fresh` starts over
- Talent presets: `--talents none` (default baseline) / `mid` (40 points, a mid-game player) / `full` (all 79 points), auto-allocated by each character's main class; `--no-talents` removes specific talents to find overpowered ones
- `--endless` tests Endless mode; the reported wave is the furthest reached
- Reports track per-wave economy, stats, items and weapon tiers (P50 / P90 / range), the T4 distribution and the evolved-weapon rate; `node scripts/econ.mjs` prints a quick summary
- Regenerate a report manually: `node scripts/report.mjs`

### Trailer

```bash
npm run promo:overlays   # QR code, title, captions and end card overlays (Chinese and English)
npm run promo:record     # headless Chrome plays the game from a script and records each clip (both UIs) plus the music
npm run promo:edit       # beat-synced ffmpeg edit → promo/tomageddon-promo.mp4 and -en.mp4
npm run promo:publish    # transcode to public/promo/*.webm and grab the README poster from the title frame
```

Footage and renders live in `promo/` (not committed); the cover image at the top of each README links to the WebM version in `public/promo/`, served by GitHub Pages (GitHub strips `<video>` tags from READMEs, so the cover links to the video instead).

### Versioning

The version comes from `version` in `package.json`, is injected at build time and shown under the title on the main menu (`-dev` suffix in dev mode). Always release with `npm run release`, which bumps the version automatically.

### Replacing art (optional)

Drop images into `src/assets/` (any subfolder); **the file name is the asset key**: `arena_ch1~5` (maps), `item_<id>`, `weapon_<id>`, `icon_weapon_<id>`, `char_/enemy_/boss_<id>` (codex thumbnails); audio `sfx_hit.mp3`, `bgm_menu.mp3`, etc. Audio files with the same key take priority over the procedural sounds.

### Debugging

The browser console exposes `game`, `run` (current run state), `controls` and `GameScene`, e.g.:

```js
GameScene.simSpeed = 4; // simulate combat at 4x
await import('/scripts/bot.js');
startBot('corn', 1); // automated balance-test bot
run.seeds += 500; // add Seeds
```

## Support the Author

If Tomageddon made you smile, consider buying the author a coffee ☕

Tomageddon is a free game made in spare time. Your support turns into more characters, more bosses and more new mechanics. Alipay and WeChat Pay both work.

<img src="docs/images/donate/donate-en.jpg" alt="Buy me a coffee: Alipay / WeChat Pay QR codes" width="600" />

## License

[MIT](LICENSE)
