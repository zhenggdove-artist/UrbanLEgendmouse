# Next AI Handoff (updated 2026-05-19)

## RP-2026-05-19-MOBILE-PERF — mobile rat-movement lag FIXED

Restore point name: `RP-2026-05-19-MOBILE-PERF`. Current head commit at time of fix: see latest commit after `81ac815` in this branch. User confirmed: 「手機遊戲卡頓情形完全修復了」 — operating the rat on mobile is no longer laggy.

### Root cause

The mobile lag was **NOT** chunk streaming, **NOT** rat AI scaling, **NOT** human animation cost. It was the **mobile CSS VHS overlay** at `index.html:42` using `mix-blend-mode:multiply`. On mobile browsers, `mix-blend-mode` over a full-screen WebGL canvas forces the compositor to maintain a separate stacking context covering the canvas and **re-blend it every frame the canvas pixels change**. When the rat is idle the canvas is mostly static so the cost hides; the moment the joystick moves, the camera follows, the canvas invalidates every frame, and the compositor pays the full-screen multiply-blend cost per frame. Desktop never had `body.mobile-vhs` set (gated on `IS_MOBILE_DEVICE`), so desktop entirely skipped this overlay — that is precisely why desktop had no lag.

The overlay also had two pseudo-element layers (`::before`, `::after`) with their own gradient backgrounds, each adding more compositor layers.

### Fix (kept in current HEAD)

Two changes that together fixed it:

1. **CSS overlay removed entirely** (`index.html:42-46`). Mobile no longer uses the CSS VHS approximation at all. The element `#mobile-vhs-overlay` is force-hidden (`display:none !important`).
2. **Mobile now runs the same WebGL VHS shader path as desktop** (`index.html:805-822, 12552-12559`). Scene → 480×270 `lowResRT` → VHS fragment shader pass → canvas. Canvas backing buffer is 480×270 on mobile (browser GPU upscales to the actual screen size, that step is essentially free). Mobile gets the same visual as desktop with ~5× less fragment shading than the prior 640×360 direct-render path, AND no CSS compositor layer.

Net effect:
- Same visual on mobile and desktop (chromatic aberration, scanlines, vignette).
- Fragment shading capped at 480×270 on both platforms.
- No CSS `mix-blend-mode` anywhere.

### Things NOT to revert

If a later optimisation regresses mobile perf, do NOT undo the above. Revert only the later change. Specifically:

- Do **not** re-introduce `mix-blend-mode` on any full-screen overlay.
- Do **not** put mobile back on a direct-render path (skipping `lowResRT`) — it raises mobile fragment cost and removes visual parity with desktop.
- Do **not** add new fullscreen DOM overlays that sit above `#c` without testing on mobile under joystick input.

### How to verify on device

1. Open browser console on mobile.
2. First console line should be `[BUILD] colon-strip-fix+own-meshes+silent-warm+lowres-mobile 2026-05-19 build` (or any later stamp that retains the `lowres-mobile` token).
3. Joystick-move the rat for ~10 seconds and confirm no frame stutter beyond the chunk-gen hitches (which were already there pre-fix and are unrelated).

## Still-open issue tracked separately: T-pose

The human NPCs still spawn in T-pose / sliding bind-pose. This is unrelated to the mobile perf fix above. Investigation in progress — see the colon-strip attempt + own-meshes restore in HEAD. User's console diagnostic confirms `firstBone= mixamorigHips` and `firstTrack= mixamorigHips.position` (names match — so it is **not** a name-binding regex issue). Next angle to chase is `SkeletonUtils.clone` failing to re-bind the cloned SkinnedMesh to the cloned skeleton (so the mixer animates clone bones but the mesh is still skinned to the original FBX's bones).

---


## Project shape

- Main project is still a single-file Three.js game in [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:1>).
- Most gameplay, UI, editor, loading, ending, audio, and NPC logic all live in the one `<script type="module">`.
- Do not split logic into new JS modules unless the user explicitly asks for architecture changes.
- Identifiers/comments should keep British English style where possible.
- Mobile and desktop layout buckets are separate and must stay separate.

Related docs:

- [CLAUDE.md](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/CLAUDE.md:1>)
- [LAYOUT_EXPORT_REPLACE_GUIDE.md](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/LAYOUT_EXPORT_REPLACE_GUIDE.md:1>)
- [progress.md](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/progress.md:1>)

## Current worktree state

- `index.html` has uncommitted changes.
- `NEXT_AI_HANDOFF.md` has been updated to reflect the latest state.
- No push was done in this handoff step.
- User referred to `index(1).html`, but that file does not exist in the current workspace. All current work is being applied against `index.html`.

## Restore points / progress log

### RP-2026-05-19-A: visual correctness baseline restored

- Purpose: restore the last known-safe presentation baseline after a bad mobile perf pass.
- `index.html` changes in this restore point:
  - mobile render path restored to the shared `lowResRT -> VHS screen quad` path
  - human `AnimationMixer` frame-stride optimisation removed
  - humans now return to normal per-frame mixer updates
- Reason this exists:
  - mobile VHS filter had disappeared
  - humans / possessed host could appear in T-pose or sink into the ground
- If a later optimisation breaks human animation or VHS again, revert only the later optimisation and keep this baseline.

### RP-2026-05-19-B: rat LOD perf pass (current head)

- Purpose: reduce rat CPU cost without reducing visible rat count.
- Scope intentionally limited to ordinary street rats.
- What changed:
  - added distance-based rat LOD timers for `brain` work and `world probe` work
  - far / non-critical rats now retarget less often and run collision/support sampling less often
  - critical rats still run full simulation every frame:
    - ritual / `templeBound`
    - `templeSwarmVisual`
    - `followPlayer`
    - `followStatue`
    - `climbingHuman`
    - rats with `targetHuman`
- Explicit non-goals:
  - no reduction to visible rat population
- no impostor conversion
- no changes to temple ritual rat choreography
- If this introduces pathing weirdness, revert only the rat LOD block around `tickFollowerRats()` and the new rat LOD constants/helpers, while keeping RP-2026-05-19-A intact.

### RP-2026-05-19-C: staged stability + mobile perf repair

- Purpose: follow the user's requested repair order instead of broad speculative optimisation.
- Planned order in this restore point:
  - human LOD reactivation safety, ground clamping, pose refresh guards
  - mobile direct-render path restore, VHS/postprocess disabled on mobile
  - follower-rat full-sim budget so `followPlayer` no longer implies full actor simulation
  - remove live cleaner path and stop chunk ensure from firing every frame
- Revert guidance:
  - if human animation or positioning breaks, revert only the human safety block first
  - if mobile rendering regresses visually/perf-wise, revert only the renderer/tick mobile path block
  - if rat following logic breaks, revert only the follower full-sim budget block
- Current completion inside this restore point:
  - completed:
    - human ground clamp helpers + LOD deactivate/reactivate helpers
    - mobile renderer switched back to direct render on phone
    - renderer power preference moved to `high-performance`
    - follower rat full-sim budget added, and `followPlayer` removed from `isRatCriticalForFullSim`
    - per-frame `ensureChunksAroundX(player.root.position.x)` replaced by `maybeEnsureChunksAroundPlayer()`
    - live cleaner branch removed from `tickHumans()`
    - animation clip validation added:
      - incompatible filtered clips now return `null`
      - empty / near-empty clips are skipped before creating `AnimationAction`
      - human variant clip track counts are logged to console at load time
      - variants without usable idle + walk/run are filtered out of active human usage
    - mobile VHS restored as a CSS overlay (`#mobile-vhs-overlay`) while keeping mobile direct render
    - bite lock cache now uses `humansGrid` lookup instead of the new path doing a full-table human scan
    - `tickProps()` now ticks `activeProps` only instead of sweeping all props every frame
    - follower full-sim budget now updates at 5 Hz instead of sorting every frame
  - still pending / partial:
    - old disabled bite-lock block still exists as dead code and can be physically deleted later
    - full swarm-visual system is not yet implemented
    - props moved-grid refresh / full spatial-grid rollout still remain

## Most important current state

### 1. Temple ritual / awakening

The latest working direction is now the simpler current-temple ritual path.

Relevant functions:

- `getCurrentTempleSwarmTarget()`
- `startTempleAwakeningLegacy()`
- `tickTempleEvent(dt)`
- `tryLoopTempleEntity(ent, prevX, prevZ)`
- `render_game_to_text()`

Current behaviour in code:

- Ritual resolves the actual temple the player is currently inside, not both temples.
- When player is inside temple and rat count is high enough, ritual starts on that temple only.
- `startTempleAwakeningLegacy()` immediately spawns `300` ritual rats for the player's current temple.
- Non-ritual rats already inside the temple are pushed back out toward street entrances so they do not interfere with the scripted climb.
- Generic spill / breeding rats are no longer newly marked `templeBound` after ritual has already started.
- `templeSwarmVisual` rats are ignored by the loop-portal teleport logic, so rear-door ritual rats should no longer get teleported out.

Important debug text already added to `render_game_to_text()`:

- `temple.inside`
- `temple.gathering`
- `temple.started`
- `temple.awakened`
- `temple.phase`
- `temple.swarmVisuals`
- `visualRats`

Known remaining issue:

- User reports ritual now starts, but some of the 300 doorway-spawned rats still do not consistently all climb the idol as intended in real play. The next AI should inspect the post-spawn pathing for front-door and rear-door ritual rats only, not revert back to distant street migration behaviour.

### 2. Rat visual budget / performance

Relevant symbols:

- `MAX_ACTIVE_RAT_VISUALS = 500`
- `tickRatVisualBudget(dt)`
- `enforceRatVisualBudget()`

Current behaviour:

- Visible active rat count is capped to about `500`.
- Far non-critical rats are collapsed back into `virtualRats`.
- Ritual `templeSwarmVisual` rats are protected and should not be removed by the budget pass.
- Budget pass runs during gameplay ticks and also right after ritual burst spawning.

Local smoke-test result from latest run:

- `rats = 1000`
- `visualRats = 481`
- `temple.swarmVisuals = 300`

Known remaining issue:

- User still reports the game feels slow / heavy after ritual start. Next AI should profile update hot paths around rat AI, ritual swarm movement, and any remaining expensive per-frame UI/editor work before touching preload strategy. User explicitly does not want “load later during gameplay” as the solution.

Latest perf direction:

- The newest pass targets ordinary rat AI cadence first, rather than touching ritual rats or human animation again.
- If performance is still poor, the next highest-CP targets are remaining full-table scans such as `nearestChaosSpot`, cleaner mess search, and host melee prop scan.

### 3. Human NPC models / skins

Relevant functions:

- `loadHumanTextureAsync(path)`
- `buildHuman(...)`
- `ensureCharacterSkinPresent(inst, tint, skin)`
- `tickHumans(dt)`

Current state:

- Human texture loading now distinguishes colour vs non-colour textures:
  - basecolor/albedo/diffuse -> `THREE.SRGBColorSpace`
  - normal/roughness/metallic -> `THREE.NoColorSpace`
- Schoolgirl base-colour path was corrected to the explicit `...BaseColor.jpg` file.
- Human instances now carry:
  - `skinVariant`
  - `skinTint`
  - `skinCheckTimer`
- Nearby humans periodically run `ensureCharacterSkinPresent(...)` to reapply skin material if a mesh loses its map and turns grey.
- Human animation clips were simplified recently so variants can share the male-student action set where compatible.

Known remaining issue:

- User still reports occasional grey/skinless humans on device. Do not assume this is fixed. Investigate actual texture/material loss in runtime rather than removing human variants.

### 4. UI layout editor

Relevant functions / data:

- `applyUILayoutMetrics(...)`
- `UI_LAYOUT_COMPARE_PAIRS`
- `getUILayoutBoundsForDef(def)`
- `measureUILayoutRect(def, metrics)`
- `beginUILayoutPointerDrag(...)`

Current editor state:

- Desktop and mobile layout buckets are separate.
- Desktop-side `MOBILE` preview now applies layout in stage-local percent space again, so it should match the saved phone layout much more closely.
- Pair snapping was reduced heavily. Only old viewport helper frame pairs remain in `UI_LAYOUT_COMPARE_PAIRS`.
- `Chaos Box`, `Rats Box`, `Host Life`, and other normal HUD objects should no longer use live overflow DOM bounds for editor measurement.
- In admin/editor mode, stored layout rects are preferred over overflow-influenced live bounds for normal HUD editing.
- This was specifically done to stop:
  - dragging one object causing others to move
  - objects jumping while dragged
  - resize handles changing only the editor box but not the actual object
  - `Chaos/Rats/Host Life` snapping each other unexpectedly

Latest local verification:

- Dragging `host-life-box` changed its position while width/height stayed identical.
- Mobile preview screenshot check showed `jump/bite/pickup/drop/chaos/rats/joystick` staying inside the mobile frame.

Known remaining issue:

- User still reports the editor does not yet feel stable enough for real production use. If more work is needed, focus on direct manipulation reliability first:
  - no jump on pointer down
  - no unintended resize on move
  - no cross-object coupling
  - object rect must always match real drawn object

### 5. Audio

Current state:

- Street ambience and rat movement audio are preloaded during intro.
- Earlier startup deadlock from `BEGIN` + audio warm-up was already reduced.
- Distance attenuation now uses the current controlled actor / host rather than always using the original rat body, which fixed one major “audio fades out after possessing a human” bug.

Known remaining issue:

- User still reports many sounds becoming too quiet or failing after host possession, except street ambience and follower-rat movement. Next AI should inspect current audio attenuation / cooldown / ownership logic for:
  - host footsteps
  - prop break sounds
  - throw sounds
  - bite / parasite-related one-shots

Also confirm that non-player human NPC footstep audio stays disabled. User explicitly asked for that earlier.

## Specific things the next AI should not accidentally undo

- Do not revert mobile/desktop layout separation.
- Do not reintroduce ring frame objects:
  - `builtin-frame-minimap-ring`
  - `builtin-frame-rat-city-ring`
  - `builtin-frame-jump-ring`
  - `builtin-frame-bite-ring`
  - `builtin-frame-pickup-ring`
  - `builtin-frame-drop-ring`
- Do not bring back ritual flow that waits for distant rats to slowly walk in from the street.
- Do not solve performance by delaying asset loads into gameplay; user explicitly rejected that.

## Suggested next debugging order

1. Reproduce ritual on local server with debug text on-screen and verify whether any of the 300 ritual rats still receive the wrong target/path after spawn.
2. Inspect runtime human materials on a grey NPC and confirm whether the map is missing, the texture load failed, or the wrong material instance was assigned.
3. Profile post-ritual frame cost:
   - rat AI updates
   - ritual swarm movement
   - human update loop
   - audio update loop
4. If user returns to layout issues, debug only in the current stable coordinate-space path; do not reintroduce live DOM rect dependence for normal HUD objects.

## Useful quick checks

- `git status --short`
- `node --check index.html` is not valid for HTML; use browser or extracted module checks instead.
- Use `render_game_to_text()` for fast temple / rat / mode verification.
- For ritual verification, test:
  - rat total forced to `1000`
  - player moved into temple
  - confirm `temple.started=true`
  - confirm `temple.swarmVisuals=300`
  - confirm `visualRats<=500`

## Last verified observations

- Ritual trigger smoke test reached:
  - `temple.started=true`
  - `temple.phase='gather'`
  - `temple.swarmVisuals=300`
- Rat budget smoke test reached:
  - `visualRats=481`
- Layout drag smoke test:
  - `host-life-box` moved without width/height drift.

This file is intentionally focused on current live issues, not full historical context. For the longer history, read `progress.md`.
