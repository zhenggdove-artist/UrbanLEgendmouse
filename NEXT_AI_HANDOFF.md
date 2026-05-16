# Next AI Handoff

## Project shape

- Main game is still a single-file Three.js project: [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:1>)
- Most recent work is concentrated in:
  - temple swarm / idol event
  - UI layout editor
  - UI art replacement layers for buttons/HUD

Related docs:

- [CLAUDE.md](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/CLAUDE.md:1>) is older high-level project context.
- [LAYOUT_EXPORT_REPLACE_GUIDE.md](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/LAYOUT_EXPORT_REPLACE_GUIDE.md:1>) explains how exported layout config should be pasted back into `index.html`.
- [progress.md](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/progress.md:1>) has historical notes but parts are mojibake/corrupted. Use carefully.

## Current hotspots

### 1. Temple / ritual event

Important code:

- `startTempleGathering()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:3950>)
- `startTempleAwakening()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:3987>)
- `tickTempleEvent()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:4129>)
- follower rats temple climb logic [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:7494>)
- temple idol material phase logic [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:3915>)

Intended behaviour:

- At `1000` rats, temple event enters `gathering`.
- Street rats gather toward temple first.
- Only when player enters temple does actual awakening / climb start.
- Rats moving toward idol should use forward animation intent.

Latest temple fixes:

- Climb logic was adjusted so altar-foot XZ uses `altarFrontPos` instead of pushing rats toward the altar body interior:
  - main ritual swarm [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:4184>)
  - follower rats [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:7529>)
- Idol material pipeline was changed from flat unlit yellow to lit gold-like material:
  - `TEMPLE_IDOL_SKIN.materialKind='standard'` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:899>) [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:942>)
  - `buildTempleIdolMaterial()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:3915>)
- Added temple-specific key/rim lighting to restore body silhouette and metallic shading:
  - temple light state [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:796>)
  - light creation in `spawnTempleIdol()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:3073>)

Important caveat:

- These latest temple fixes passed syntax check only.
- They were **not** fully run through an actual in-browser 1000-rat ritual verification after the last patch.
- If the next AI continues here, first priority should be a real temple event playthrough.

### 2. Parasitism / host control

Important code:

- `startRatBite()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:6637>)
- `enterHost()` and `exitHost()` immediately nearby
- `abandonHost()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:6688>)

Current rules:

- Bite/parasitise duration is `1.5s`.
- In host mode:
  - `R` or `DROP HOST` kills host immediately and drops rat out.
  - `Q` still does standard exit-host.

### 3. UI layout editor

Entry:

- `Shift+C`

Main area:

- starts at [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:4740>)

Important code:

- `UI_LAYOUT_DEFAULTS` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:4742>)
- `UI_LAYOUT_TARGET_DEFS` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:5020>)
- `measureUILayoutRect()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:5408>)
- `beginUILayoutPointerDrag()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:5649>)
- panel scroll preservation [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:5464>)
- editor toolbar / art controls [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:6110>)
- export helper [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:5638>)

Current editor capabilities:

- Desktop/mobile separate layout buckets.
- Phone-ratio mobile preview.
- Black outer workspace around game viewport.
- Draggable/resizable `Layout Objects` panel.
- `Ctrl+Z`, copy/paste, layer order, lock/hide, keyboard nudging.
- Import custom frame images.
- Export copies only pure `const UI_LAYOUT_DEFAULTS=...;` block now.

### 4. UI art replacement layers

These were added recently so text labels can be replaced with imported art:

- `chaos-box-art`
- `rats-box-art`
- `rat-city-btn-art`
- `jump-btn-art`
- `bite-btn-art`
- `pickup-btn-art`
- `exit-host-btn-art`

Important code:

- DOM / CSS art layers:
  - styles [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:163>)
  - DOM insertion [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:366>) [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:423>)
- art target defs [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:5025>)
- art metrics / apply logic [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:5159>) [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:5267>)
- art import / clear / color [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:5912>) [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:5943>)
- text update safe helper `setUIArtHostLabel()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:6567>)

User-visible intent:

- In editor, these labels can be replaced by imported image art.
- Art layer position/size can be edited separately.
- Base background colour can be changed via color picker.
- `rat-city-btn` default beige background was removed and is now transparent by default.

## What was actually verified

These were browser-verified, not just static guesses:

- Layout editor drag no longer changes size while moving for tested targets.
- Real drag verified for:
  - `jump-btn`
  - `bite-btn`
  - `rat-city-btn`
  - `chaos-box`
  - `rats-box`
  - `exit-host-btn`
- For those verified targets:
  - position changed
  - size did **not** change during move
- `Import Art`, `Clear Art`, and background color controls exist in editor toolbar.
- Art target DOM nodes exist for all requested HUD/button elements.
- `Layout Objects` panel no longer jumps to top on selection in tested flow.
- Module script syntax check passed after latest edits.

## What is only partially verified

- Temple ritual climb fix was not fully playtested in live game after latest patch.
- Idol gold material / lighting was not visually inspected in browser after latest patch.
- Art import UI existence was verified, but a full manual image import + export + reload cycle was not run after the very latest temple edits.

## Known caveats

- `index.html` is still very large and tightly coupled.
- Some old notes in `progress.md` are encoding-damaged.
- `body.intro-active` hides many game UI elements; remove intro or enter real play state before testing HUD/button editor behaviour.
- The editor now distinguishes parent target vs art sub-target. If behaviour seems odd, inspect:
  - `getUILayoutSkinTargetId()`
  - `getUILayoutParentTargetId()`
  - `applyUILayoutSkinArt()`

## Export rule

- `Export` now copies only pure code:

```js
const UI_LAYOUT_DEFAULTS={ ... };
```

- Do not paste explanatory text into `index.html`.
- Use [LAYOUT_EXPORT_REPLACE_GUIDE.md](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/LAYOUT_EXPORT_REPLACE_GUIDE.md:1>) for exact replace instructions.

## Best next steps for the next AI

1. Run a real temple event test to confirm:
   - rats climb altar front instead of tunnelling under table
   - rats continue onto idol body
   - idol gold material now has visible light/dark form

2. If temple still fails:
   - inspect `altarFrontPos / altarEdgeTopPos / altarTopPos` source in temple build code around [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:2794>)
   - inspect both climb pipelines:
     - main ritual swarm
     - follower rats

3. If continuing editor work:
   - start with real browser interaction, not static code reading
   - test in actual play UI state, not intro-hidden state

## Fastest mental model

- One-file mobile-first 3D web game.
- Most unstable area right now is the temple ritual sequence.
- Most recently stabilised area is the UI layout editor.
- Layout editor now supports separate art overlays for HUD/button labels.
