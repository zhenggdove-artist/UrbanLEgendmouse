# Next AI Handoff

## Project shape

- Main game is a single-file Three.js project: [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:1>)
- Almost all recent work is inside the inline module script in that file.
- Existing docs:
  - [CLAUDE.md](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/CLAUDE.md:1>) is old high-level project context.
  - [LAYOUT_EXPORT_REPLACE_GUIDE.md](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/LAYOUT_EXPORT_REPLACE_GUIDE.md:1>) explains how to paste exported layout config back into `index.html`.
  - [progress.md](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/progress.md:1>) contains useful history but parts are mojibake/corrupted. Do not rely on it blindly.

## Current important systems

### 1. Temple / rat swarm event

- Temple event state lives in `game.templeEvent`.
- Key code:
  - `startTempleGathering()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:3919>)
  - `startTempleAwakening()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:3956>)
  - `tickTempleEvent()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:4098>)
  - follower rats climbing / gathering logic [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:7285>)
- Intended behaviour now:
  - At `1000` rats: street rats gather toward temple.
  - Only when player enters the temple: actual climb / awakening starts.
  - Rats moving toward idol or following idol should use forward animation intent.

### 2. Parasitism / host control

- Bite/parasitise flow:
  - `startRatBite()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:6392>)
  - `enterHost()` nearby below
  - `exitHost()` nearby below
  - `abandonHost()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:6443>)
- Current intended rules:
  - Bite duration is `1.5s`.
  - While possessing a host, `R` or `DROP HOST` should kill the host and make the rat drop out immediately.
  - `Q` is still the normal exit-host action.

### 3. UI layout editor

- Entry point: `Shift+C`
- Main block starts at [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:4740>)
- Important parts:
  - `UI_LAYOUT_DEFAULTS` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:4742>)
  - `UI_LAYOUT_TARGET_DEFS` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:4776>)
  - `measureUILayoutRect()` [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:5036>)
  - panel scroll preservation [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:5081>)
  - export helper [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:5268>)
  - direct drag fallback [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:5288>)
  - editor build / event wiring [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:5892>)

## What was recently fixed

### Temple behaviour

- Swarm event split into `gathering` and actual `started` awakening.
- Climb movement had a bug where rats could appear to fly upward too early; climbing is now gated by horizontal proximity before lifting vertically.
- Gather-before-enter-temple logic was added for follower rats too.

### Layout editor

- Added desktop/mobile separated layout buckets.
- Added phone-ratio mobile admin stage.
- Added black outer workspace around game viewport for easier dragging.
- Added draggable/resizable `Layout Objects` panel.
- Added importable custom image frames.
- Added `Ctrl+Z`, copy/paste, layer ordering, lock/hide, keyboard nudging.
- Added `rat-city-btn` to editable targets.
- Fixed a real drag bug:
  - visible UI elements were returning `DOMRect`;
  - later drag math spread that object and lost `left/top`;
  - resulting layout metrics became invalid;
  - `measureUILayoutRect()` now returns a plain `{left, top, width, height}` object.
- Fixed panel jump-to-top:
  - the actual scrolling container is `.ui-layout-object-panel`, not `.ui-layout-object-list`.
- Added direct drag on real UI elements, not only overlay boxes.
- `viewport-frame-*` overlays now behave like panel-only targets so they do not keep blocking other UI.

## What was actually verified

These were verified with Playwright-style browser automation on a local `python -m http.server` session, not just static code reading:

- In active game UI state, direct dragging works for:
  - `jump-btn`
  - `bite-btn`
  - `rats-box`
  - `chaos-box`
  - `rat-city-btn`
  - `joystick-zone`
- `Layout Objects` panel selection no longer resets its scroll position to top.
- Module script syntax check passed via Node `--check`.

## Known caveats

- The project is still a single huge `index.html`; many systems are tightly coupled.
- Some older notes in `progress.md` are encoding-damaged.
- I did not do a full human playthrough after every change, only targeted browser validation for the layout editor and static checks for some gameplay changes.
- There is still a temp debug file in repo root:
  - `.tmp_ui_verify2.js`
  - It is not part of the game and can be deleted.

## If the next AI needs to continue layout editor work

1. Start local server in repo root:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

2. Open `http://127.0.0.1:8000/index.html`

3. If testing gameplay UI objects, remove intro gate first or click into play state, because `body.intro-active` hides HUD/game-controls:
  - relevant CSS hide rules are at [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:194>)

4. Toggle editor with `Shift+C`.

5. For export-reimport workflow:
  - use `Export` button in editor
  - then follow [LAYOUT_EXPORT_REPLACE_GUIDE.md](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/LAYOUT_EXPORT_REPLACE_GUIDE.md:1>)

## If the next AI needs to continue temple gameplay work

Start from these checkpoints:

- trigger threshold and event state transitions: [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:4101>)
- idol awakening pipeline: [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:3956>)
- follower-rat gather/climb logic: [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:7285>)

## Fastest mental model

- This is a mobile-first 3D web game in one file.
- The two hottest areas right now are:
  - temple swarm / idol event
  - UI layout editor
- For editor bugs, trust real browser interaction over static guessing.
- For layout export, only replace the `UI_LAYOUT_DEFAULTS` block, not the following `UI_LAYOUT_TARGET_DEFS` block.
