# Next AI Handoff (updated 2026-05-19)

## RP-2026-05-19-RAT-FOLLOW — proper follower swarm, no static rats, audio unlocked

Restore point name: `RP-2026-05-19-RAT-FOLLOW`. Build stamp in the browser console: `[BUILD] lod-hysteresis+rat-follow+audio-unlock 2026-05-19 build`.

### Symptoms this restore point addresses

1. Human NPCs still flickered after the no-fade fix (RP-2026-05-19-TPOSE-FIXED).
2. Visible rats sat on the alley as static sprites instead of following the player. The user wanted: chaos increase → rats spawn, run to the destruction location, gather briefly, then trail behind the player. Past 1000 total rats, they peel off toward the temple (existing logic).
3. SFX did not fire immediately at game start — there was a delay before sounds began working on first interaction.
4. Humans floated above the floor.

### Root causes & fixes

**Human flicker (`index.html:5500` + `5670`):** the LOD path called `forceHumanActionPose(...)` every time a human re-activated, which stop()+reset()-ed the action back to time 0. Because the LOD radius was a single 34 m threshold with no hysteresis, NPCs wandering at the boundary toggled inactive↔active **every frame** as the player walked — each toggle replayed the animation from frame 0, producing per-frame strobing across every borderline NPC. Fixes:
- `activateHumanFromLOD` no longer calls `forceHumanActionPose`. It just sets `_lodInactive=false`, clamps the human to the ground, and turns root.visible back on. The mesh's bones already hold the last animated pose so reactivation is seamless.
- `shouldSimulateHumanEntity` now uses hysteresis — enter at 32 m, leave at 40 m. NPCs at the edge of LOD range can't strobe.

**Rat follow / static rats (`index.html:11031` + `11502-11514` + `1180-1190` + `12127-12134`):**
- Visible cap dropped to **60 desktop / 25 mobile** (was 220 / 40). With the cap that low the full-sim cap can equal the visible cap — every visible rat is fully simulated every frame.
- `tickFollowerRats` now iterates `game.rats` unconditionally on both platforms. The old `activeFollowerRats` short-list on mobile produced rendered-but-unticked rats — those were the "static images on the street" the user reported.
- `rebuildRatsGrid` similarly iterates `game.rats` instead of the active short-list.
- `summonSpillRats` sets `followPlayer=true` for **every** spawned rat (was 32%). The other 68% used to settle at the chaos spot and stand still forever. Now every rat heads to the chaos spot (initial targetPos), reaches it, and the next brain tick (~0.18–0.42 s) retargets to "behind player" — the gather-then-follow visual the user wanted.
- `summonSpillRats` also pre-checks `getActiveVisualMax()`: any spawn over the cap increments `game.virtualRats` only, so chaos / ritual progression still works past 60 visible rats but the player never sees overflow sprites.

**Audio unlock (`index.html:1300`):** the previous attempt removed `play()` from the warm path entirely to stop the startup-burst. That fixed the burst but left iOS-style browsers unable to play any SFX afterwards until the user clicked something else. Restored the correct **play + immediate pause** pattern: set `muted=true` + `volume=0`, fire `play()` synchronously inside the BEGIN-click handler, `pause()` on the very next line before the audio decoder can submit any output, then restore muted/volume so `playSFX()` later picks real values. This unlocks every audio element inside the gesture *without* an audible burst.

**Ground height (`index.html:5224`):** `HUMAN_WORLD_Y_OFFSET = -0.8` (was -0.9). The idle clip's first keyframe lifts the rig slightly off the bind-pose floor; this constant compensates. Tune the literal here if the look ever drifts again.

### Diagnostic keypresses still available

- **T** rotates the nearest human's head 45° (skinning vs. binding isolation).
- **B** dumps mixer state for the nearest human's idle action.
- `window.game` / `window.player` exposed.

### Things NOT to revert

- Do **not** make `activateHumanFromLOD` call `forceHumanActionPose` again — it brings back the strobe.
- Do **not** restore a single LOD radius without hysteresis.
- Do **not** put `activeFollowerRats` back into `tickFollowerRats` / `rebuildRatsGrid` — that's the static-rat bug source.
- Do **not** spawn rats with `followPlayer=false` (the 32% gambit), unless you specifically want gather-and-stay behaviour for a one-off scripted moment.
- Do **not** drop the visible-rat cap enforcement in `summonSpillRats` — without it the cap is only enforced after the fact by `enforceRatVisualBudget`, leaving a frame of overflow rats.
- Do **not** strip `play()` from `warmSFXAudioElement`. The play+immediate-pause is what satisfies iOS/Android unlock without a burst.

---



## RP-2026-05-19-TPOSE-FIXED — human NPCs animate correctly, no flicker

Restore point name: `RP-2026-05-19-TPOSE-FIXED`. Stamp the user can see in the browser console: `[BUILD] flicker-fixed+ground-y-0.9 2026-05-19 build`. User confirmed: 「目前成功沒有TPOSE了」 — T-pose is gone.

### Root cause #1: the T-pose itself

Bone names matched. Clip tracks resolved. Bindings reported `bound=53 unbound=0`. But the runtime `actionWeight=0` on every active human's idle action. Three.js's `AnimationAction._updateWeight()` sets `this.enabled=false` the instant a `fadeOut` interpolant finishes — combined with rapid idle↔walk transitions on wandering humans, the previously-chosen action ended every cycle in a `weight=0, enabled=false` dead state and never came back to `1` even when the next `setEffectiveWeight(1)` was called. Mixer applied tracks with weight 0 → bones reverted to `saveOriginalState` (the bind pose) → T-pose every frame.

**Fix at `index.html:5379` (`forceHumanActionPose`) and `index.html:5513` (`tickActor`):**

- Replaced every `act.fadeIn(0.12).play()` / `act.fadeOut(0.12)` with direct `act.stop()` + `act.setEffectiveWeight(0)` for losers, and `act.enabled=true; act.setEffectiveWeight(1); act.play()` for the winner.
- Added a steady-state guard in `tickActor`: every frame, if the chosen action's effective weight has somehow drifted below 0.999, re-assert it to 1.
- Visual cost: idle↔walk transitions are now hard cuts (no 0.12 s crossfade). Acceptable for the PS1 aesthetic.

### Root cause #2: post-fix flicker

After the T-pose fix, all models (rats and humans) flickered.

- **Rats** (`index.html:12781-12805`): the new follower-rat frame-animation loop wrote `r.moveIntent.y = -speedScale` every frame. With Tripo wander code wobbling `curSpeed` around the forward/idle threshold (0.35), the sprite state flipped each frame and `tickRatBillboard` reset the frame index to 0 on every state change — visible per-frame strobing. **Fix**: hysteresis (enter forward at speed>0.6, return to idle below 0.2, keep current state in between).
- **Humans** (`index.html:5503-5535`): the wander code in `tickHumans` ratchets `curSpeed` between 0 and 0.76 every frame as the NPC turns. With the old `curSpeed > 0.08` threshold this flipped `next` between `'walk'` and `'idle'` per frame, and the transition path called `act.reset()` (zeroing the clip time) every frame, producing visible animation strobing. **Fix**: (a) hysteresis — enter walk only above 0.4, return to idle only below 0.05, otherwise stick at the previous `animState`; (b) only call `act.reset()` when `shouldRestartAction` is set, not on every state transition.

### Root cause #3: floating-above-ground

After fixing the T-pose, humans rendered ~half a model height above the floor because the idle clip's first keyframe doesn't put the Hips at world-Y=0. **Fix at `index.html:5224`**: `HUMAN_WORLD_Y_OFFSET = -0.9`. Adjust if needed (more negative = lower; less negative = higher). Anchored at the `getHumanGroundY` helper so every spawn / LOD reactivate / wander tick uses the same value.

### Diagnostic keypresses kept in place

- **T**: rotates the nearest visible human's head bone 45° (isolation test for skinning vs. binding). Should leave it visible permanently — useful if T-pose ever returns.
- **B**: dumps the nearest human's idle action state — clipTracks, bindings, bound/unbound, time, effectiveWeight, sample track→bone mappings. Inline-primitive log, no need to expand Objects.
- `window.game` and `window.player` exposed for console debugging.

### Things NOT to revert

- Do **not** put `fadeIn/fadeOut` back into `tickActor` / `forceHumanActionPose`. The fade system is what produces the silent T-pose state.
- Do **not** restore `curSpeed > 0.08` as the walk-state threshold — keep the 0.4 / 0.05 hysteresis band.
- Do **not** call `act.reset()` on every state transition. Only on `shouldRestartAction`.
- Do **not** re-introduce `act.fadeOut(0.12)` for the loser actions; use `act.stop()`.

---



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
