# Next AI Handoff (updated 2026-05-17)

## Project shape

- Still a single-file Three.js project: [index.html](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/index.html:1>)
- ~9000-line `<script type="module">` inside one HTML file. New systems
  go inline; do NOT split into separate JS modules.
- British English for identifiers + comments (`behaviour`, `parasitise`,
  `colour`). Do not regress to American spellings.
- Mobile-first. Both desktop and mobile UI buckets are edited separately
  in the layout admin (see §3).

Related docs:

- [CLAUDE.md](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/CLAUDE.md:1>) — original high-level project briefing.
- [LAYOUT_EXPORT_REPLACE_GUIDE.md](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/LAYOUT_EXPORT_REPLACE_GUIDE.md:1>) — how to paste an exported `UI_LAYOUT_DEFAULTS` block back into `index.html`.
- [progress.md](</D:/ELY/作品相關/###小遊戲製作GIT/都市傳說/都市傳說3-屬巴拉西/UrbanLEgendmouse/progress.md:1>) — historical only, parts are mojibake.

Recent git history (most recent first):

```
06057d8 Editor: fix scroll-jump, deselect-on-blank, imported-frame resize
d7d2d71 (multiple Update index.html commits — see git log for content)
```

---

## 1. Temple idol system (神像 / 巡禮儀式)

The defining event in the game. Player herds rats until 1000 → walks
into the temple → 300 rats swarm in through the doorway, climb the
altar, cover the idol → flash → idol awakens with a different skin and
walks out → it & its rat retinue start hunting humans → humans covered
by enough rats transform into mini idol-skinned wanderers.

### Idol skin (pre vs post)

`buildTempleIdolMaterial(src, mode)` in `index.html` — uses
**MeshBasicMaterial** for all phases (unlit, never goes black no matter
the lighting setup; previous attempts with Lambert / Phong / Standard
all had issues).

- `mode='gold'` / `'gray'` → pre-ritual texture =
  `TEMPLE_IDOL_SKIN.preBase`. Default loads
  `asset/神像/tripo_model_roughness.JPEG` (the gray patchy texture).
  Drop in `asset/神像/idol_skin_pre.jpg` to override.
- `mode='awake'` → post-ritual texture = `TEMPLE_IDOL_SKIN.awakeBase`.
  Default loads
  `asset/神像/tripo_node_48d63a74-29de-4f3d-b8f8-321e4690480b_BaseColor.jpg`
  (the green/teal patina). Drop in `asset/神像/idol_skin_post.jpg`
  to override.
- `mode='flash'` → white-out transition.

Loading wiring is in `loadTempleIdolAssets()`. The optional pre/post
files are loaded via `optionalTex(path)` which silently falls back if
the file is missing.

### Awakening flow & known-good sequence

1. `tickTempleEvent(dt)` checks rat count ≥ `TEMPLE_SWARM_TRIGGER` (1000)
   → `startTempleGathering()` (rats wander toward altarFrontPos).
2. `ensurePrimaryIdolMatchesPlayer()` runs each tick before gathering
   starts — if the player is inside the TWIN temple (A side), it
   hot-swaps that idol to be the primary, so the swarm bursts in from
   the door the player is next to.
3. When player is inside a temple zone and gathering is active →
   `startTempleAwakening()` spawns 300 rats just outside the doorway
   (`SWARM_COUNT=300` constant — local to that function).
4. The gather phase (`tickTempleEvent` `phase==='gather'`) animates rats
   in five stages: spawn → doorway → altar foot → climb altar face →
   walk across altar top → swarm idol body.
5. Phases progress: `gather` → `glow` → `flash` → `drop` (apply `awake`
   material, despawn secondary idols) → `awakenTempleIdol(idol)` runs
   `replaceTempleIdolWithWalkRig()` and starts procession.

### Anti-flicker / anti-sink during awakening

`replaceTempleIdolWithWalkRig` (index.html, near line 3470):
- Stops every action first, then plays the `walk` action with
  `walk.time=0.05` + `mixer.update(0.05)` so the first rendered frame is
  already a walk pose (no T-pose flash).
- `realignActorFeet` is called, then `root.position.copy(idlePos)` to
  pin the new rig back to the altar height.

`tickTempleIdolProcession` Y handling: previously snapped to
`resolveIdolGroundY(idol)` each frame, which caused a 1.6 m instant
drop the moment the idol left the altar collider. Now uses
`lerp(currentY, groundY, dt*2.6)` for a ~0.4 s smooth descent.

### Rats hunt humans + transform (post-awakening)

Key constants (search for these names):
- `RAT_HUNT_HUMAN_RANGE` = 16 m — idol-centric attack radius.
- `RAT_CLIMB_GRAB_DIST` = 0.85 m — rat → human latch distance.
- `HUMAN_RAT_ATTACK_CAP` = 14 — max climbers per human.
- `HUMAN_RAT_TRANSFORM_RATS` = 8 — climbers needed to start transform.
- `HUMAN_RAT_TRANSFORM_TIME` = 2.4 s — time at full coverage → transform.

Helpers:
- `spawnRatBloodSpray(pos, count)` — uses `FX_TEX.blood` sprites.
- `findHumanToAttackFor(rat, idol)` — nearest valid victim near idol.
- `tickRatClimbingHuman(rat, dt)` — spiral climb pose around the host.
- `tickHumanRatAttackState(dt)` — per-human progress + transform fire.
- `transformHumanToIdolModel(human)` — swaps the human's rig for the
  idol model with awake skin.

### Transformed human height controls

`transformHumanToIdolModel(human)` exposes three parameters:

| Variable                          | Default                       | Purpose                                              |
|-----------------------------------|-------------------------------|------------------------------------------------------|
| `targetHeight: human.height \|\| 1.72` | 1.72 m                        | Overall body height of the new idol-skinned rig.     |
| `anchorY = human.baseY ?? HUMAN_WORLD_Y_OFFSET` | `HUMAN_WORLD_Y_OFFSET = -0.70` | Y-coordinate of feet (matches normal humans).         |
| `human._lockedFeetY = anchorY`    | same as anchorY               | Per-frame clamp written by `tickHumans` so the rig cannot sink through the ground. Add an offset here to lift / lower individually. |

If transformed creatures appear to "hover" or "sink", change
`_lockedFeetY` (e.g. `anchorY + 0.15`). To resize globally, change
`targetHeight`.

---

## 2. Loop street + 101 silhouette

The street is a finite ring: chunk `TEMPLE_A_CHUNK_IDX = -10` (left
temple) ↔ chunk `TEMPLE_CHUNK_IDX = 6` (right / event temple), joined
back-to-back through `templeLoopPortals.a` / `.b` at each rear-street
position.

`tryLoopTempleEntity(ent, prevX, prevZ)` (index.html, ~line 2862):
- Bi-directional now — fires when the entity is past the portal in the
  same direction it is moving, on either side.
- Teleports the entity to `dst.rearStreetPos + dstForward * (RADIUS + 0.8)`
  so the cooldown can't ping-pong it inside the dst portal's radius.

Chunk lifecycle:
- Chunks in `[TEMPLE_A_CHUNK_IDX, TEMPLE_CHUNK_IDX + 2]` are protected
  from disposal (see `disposeChunk` guard). This stops the "approach
  temple → lag" stutter the player used to feel as they walked into
  the temple loop.
- Boot eagerly generates chunks behind temple B (chunks 7 + 8) so the
  player can walk to B's rear portal on the first lap without a frame
  hitch.

### 101 / skyline

The 101 + city silhouette is now **baked into `scene.background`** (a
1024×256 canvas texture, see top of `index.html` near the
`scene.fog` / `scene.background` setup). It renders at infinite
distance, so it CANNOT clip with temple geometry. No 3D skyline group
exists any more (`buildTaipeiSkyline` is intentionally an empty
function — keep it so any legacy caller still works).

Camera far plane is back to 110 (was bumped temporarily, no longer
needed).

---

## 3. UI layout editor (Shift+C)

### Scenes (`game` / `loading` / `ending`)

Toolbar at top-right has three buttons. State is `uiLayoutState.scene`.
Each `UI_LAYOUT_TARGET_DEFS` entry carries `scene: 'game'|'loading'|'ending'`.
Custom frames remember their authoring scene in `frame.scene`.

CSS hides everything that doesn't belong to the current scene via
`body.admin-stage-active.scene-game`,
`body.admin-stage-active.scene-loading`,
`body.admin-stage-active.scene-ending` rules + a
`[data-scene]` attribute on each `.ui-layout-custom-frame`.

`setUILayoutScene(scene)` is the entry point — handles deselection of
targets that don't belong to the new scene, applies scene class, and
refreshes the editor.

### Toolbar minimize

Top-right toolbar has a `_` button on the LEFT
(`[data-layout-action="toggle-minimise"]`). When pressed it collapses
the whole toolbar down to a 42 px chip; click again (the button becomes
`+`) to expand.

### Floating "Loading Text" panel

`Loading Text` button on the toolbar opens
`document.getElementById('loading-text-panel')` — a draggable / resizable
floating editor for the text targets of the active scene (intro-title,
intro-tag, intro-copy on Loading; rw-text, rw-sub, rw-replay on
Ending).

Per text target the panel exposes:
- text content (`<input>` / `<textarea>`)
- X/Y/Z (position + layer)
- W/H (size in %)
- font size (px), color (hex)
- font family (system font dropdown)
- text-align (left/center/right/justify)
- letter spacing (px), line height

All edits go through `setUILayoutTextProperty(defId, patch)` or
`setUILayoutPosSize(defId, patch)` and immediately persist to
`localStorage` via `saveUILayoutConfig()`.

`applyUILayoutMetrics` reads each property and assigns to `el.style.*`.
Multi-paragraph copy (intro-copy) wraps each non-empty line in a `<p>`
on apply.

### Object panel scroll-jump (fixed twice)

History:
1. Initial fix in `refreshUILayoutObjectPanel` — used a LOCAL
   `savedScroll` + `_suspendScrollCapture` flag so the panel's
   `scroll` event listener does not stomp the saved value while
   `innerHTML=''` empties the rows.
2. **Second pass** — `setUILayoutSelection` was still using the global
   state. `syncUILayoutTextInput` toggles a text-edit row's `display`
   which changes panel `scrollHeight`, browser auto-clamps `scrollTop`,
   fires a `scroll` event, the global is overwritten to 0, and the
   restore reads 0 → jump-to-top. Now `setUILayoutSelection` uses the
   same local-var + suspend pattern.

If you see jump-to-top return, check ALL callers of
`captureUILayoutObjectPanelScroll` / `restoreUILayoutObjectPanelScroll`
and convert them to the local-var pattern.

### Click-empty-space-to-deselect

`handleUILayoutDirectTargetPointerDown` now treats clicks on the
admin-stage / black workspace / game canvas with no selectable target
under the cursor as a deselect gesture. It excludes
`.ui-layout-editor` and `.ui-loading-text-panel` so panel clicks don't
deselect.

### Imported-frame resize (fixed)

Root cause: `createUILayoutCustomFrame` does
`setUILayoutSelection(id)` BEFORE `refreshUILayoutEditor`. The
`syncUILayoutSelectionStyles` inside selection iterates
`uiLayoutState.overlays` which doesn't yet contain the new frame's
box, so `.selected` is never added → CSS `.ui-layout-box.selected
.ui-layout-handle` rule doesn't match → all 8 resize handles are
`opacity:0; pointer-events:none`.

Fix: `refreshUILayoutEditor` now reapplies
`box.classList.toggle('selected', uiLayoutState.selectedIds.includes(def.id))`
inside its per-def loop, so newly created boxes pick up the current
selection state.

### Drag past the game viewport into the black workspace

`clampUILayoutRect` is intentionally loose now — element centre can
range from `-width*0.85` to `window.innerWidth - width*0.15` (and the
same for Y). `admin-stage` CSS uses `overflow:visible` plus a
dashed-outline `::before` to mark the viewport edge instead of
clipping.

### Object label tooltip styling

`.ui-layout-box-label` uses system fonts
(`Segoe UI, -apple-system, BlinkMacSystemFont, "Microsoft JhengHei", sans-serif`)
with `background:transparent` and a triple-black `text-shadow` for
contrast — no longer the heavy pill box that occluded the scene.

### Loading screen / intro elements

The loading card and its text children
(`#intro-card`, `#intro-title`, `#intro-tag`, `#intro-copy`) are all
`position:fixed` and registered in `UI_LAYOUT_TARGET_DEFS` with
`scene: 'loading'`. CSS forces `#intro` visible (with a semi-transparent
backdrop) whenever `body.admin-stage-active` so the user can edit it
even after pressing BEGIN.

`UI_LAYOUT_INTRO_FALLBACK` provides sensible default rects for both
loading & ending targets (used by `ensureUILayoutMetrics` when no
explicit entry exists in `UI_LAYOUT_DEFAULTS`).

### Mobile detection

`layoutMobileQuery = window.matchMedia('(any-pointer: coarse), (max-width: 900px)')`.
The CSS `@media` block uses the same query. This catches modern phones
whose portrait widths exceed 640 px (the previous threshold).

### Mobile zoom prevention

`gesturestart` / `gesturechange` / `gestureend` preventDefault, plus a
`touchend` double-tap detector (< 320 ms between two taps →
preventDefault), plus `dblclick` preventDefault. Viewport meta also has
`user-scalable=no`.

---

## 4. Temple visual polish

`buildTempleComplex(xBase, opts)` (~line 2597):

- **Stepped 藻井 ceiling** — `buildSteppedTempleCeiling(temple, opts)`
  is called BEFORE the outer roof tiers. Seven nested rectangular frames
  rise from y=7.95 to y≈10.95 with a central gold medallion + red boss
  + six hanging tassels.
- **Dragon pillars** — every pillar is now a dragon column built via
  `buildDragonPillar(parent, px, pz, opts)`. Four across the front +
  four at the corner positions (the old red "tower" boxes). Each pillar
  carries 5 extra ornament layers stacked on top of the original
  silhouette:
  1. Lotus-petal base (gold + jade alternating cones).
  2. Vertical gold fluting (8 thin cylinders).
  3. Pearl-bead chains at 3 heights (12 spheres each + jade backing
     torus).
  4. Jade cloud-wave torus pairs sandwiching each dragon-body ring +
     jade bumps.
  5. Dragon-whisker filigree (half-torus swirls + gold tassel rods +
     red knots) just below the capital.
- Cross-mullion window decorations inside the hall **removed**.

---

## 5. Cleaner AI

`findNearestMessForCleaner(cleaner)` (~line 8367) now seeks BOTH
`prop.tipped` and `prop.fireFX?.active` (burning) props. Fire is
prioritised — its squared distance is halved before comparison, so a
visible flame within ~1.4× the radius of a tipped prop outranks it.
`restorePropFromCleaner` calls `clearPropFX(prop)` which extinguishes
fire as part of cleanup.

---

## 6. Mobile UI handoff

UI elements are reparented into `#admin-stage` whenever the editor
opens (see `ensureAdminStage` / `dismantleAdminStage`). Their
`position:fixed` becomes relative to admin-stage thanks to the stage's
`transform`. Outside the editor they live directly under `<body>`.

The `@media (any-pointer: coarse), (max-width:900px)` CSS block
contains the in-game mobile overrides for `#chaos-box`, `#rats-box`,
`#rat-city-btn`, `#minimap`, etc. Inline styles set by
`applyUILayoutMetrics` override these.

---

## 7. Game loop integration

Main tick order (inside the game's `requestAnimationFrame` callback,
search `tickHumans(dt)` to find it):

```
tickHumans(dt)
tickBreeding(dt)
tickFollowerRats(dt)
tickHumanRatAttackState(dt)   ← rat-attack progress / transform
tickTempleEvent(dt)            ← gathering / awakening / procession
tickTransientFX(dt)            ← blood spray, embers, etc.
```

Per-frame Y clamp for transformed humans is now in `tickHumans`'s very
first lines (`if(h.transformedToIdol && typeof h._lockedFeetY==='number')`).

---

## 8. What is verified vs not

Verified by browser playthrough:
- Idol pre/post skin swap works with the existing JPG paths.
- Loop portal works in both directions, no more pink-clear void.
- Imported frames are selectable + resizable on creation.
- Click-empty deselects.
- Object panel does not scroll-jump on row click.
- Mobile detection matches actual phones.

NOT exhaustively verified — please run a real 1000-rat ritual end-to-end:
- Rats spawn outside the doorway, charge in, climb altar, cover idol.
- Flash → awake skin swap → idol walks out without T-pose or sink.
- Rats follow the awakened idol, attack nearby humans, blood sprays,
  humans transform into mini idols.
- Transformed mini-idols wander without sinking into the ground.

---

## 9. Common pitfalls / "do not regress"

- Do NOT call `clear()` on the BVH or any cache — always LRU one entry
  at a time.
- Do NOT add a 3D skyline back. The 101 is in `scene.background`. A 3D
  101 will clip the temple.
- Do NOT add `position:static` to `#intro-card` etc. — they need
  `position:fixed` for the layout editor's percent math to work.
- Do NOT clamp `metrics.x` / `metrics.y` to 0..100 anywhere — the
  workspace drag-out feature relies on values outside that range.
- Do NOT make `realignActorFeet` run on transformed humans every
  frame — the `_lockedFeetY` clamp already pins them.
- When you add a new layout target, give it a `scene` field, add an
  entry to `UI_LAYOUT_INTRO_FALLBACK` (or `UI_LAYOUT_DEFAULTS`) for a
  sensible default rect, and add it to `UI_LAYOUT_STYLABLE_TARGETS` /
  `UI_LAYOUT_TEXT_TARGETS` only if it should accept bg-colour or text
  edits.

---

## 10. Best next steps

1. Real in-browser 1000-rat ritual end-to-end test (rare to repro,
   takes a while). Watch for: T-pose flicker, idol sink, rats not
   reaching altar, transformed humans floating / clipping the ground.
2. Confirm the loop loop portal teleport works at very high speed (the
   teleport now pushes past `RADIUS + 0.8`, but worth double-checking
   with a fast vehicle / host mode).
3. The loading text panel currently lists only the text targets — if
   the user wants to also reposition the intro-card itself from that
   panel, add `intro-card` and ending-card targets to
   `getLoadingTextTargets()` (currently filters by
   `UI_LAYOUT_TEXT_TARGETS` only).
4. The export-config button copies a `const UI_LAYOUT_DEFAULTS=...`
   block; the user follows LAYOUT_EXPORT_REPLACE_GUIDE.md to paste it
   back. If you add new target fields, make sure `JSON.stringify`
   captures them (they do as long as they live on the metric object).
