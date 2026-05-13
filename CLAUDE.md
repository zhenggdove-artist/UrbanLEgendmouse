# CLAUDE.md — Urban Legend Mouse (都市傳說3)

> Read this first. Skip the re-discovery phase.

## What this is

A browser 3D action game with a black-humour twist, built for mobile-first
touch play. Player begins as a **rat with a human head** (the user's own
selfie, captured in-game and mapped onto the rat's head in real time).
The player rampages through a 3D scene, smashing rigidbody props to raise
a **chaos** value; chaos spawns more rats; enough rats wins the round.
Mid-game the player can climb onto a wandering human NPC, bite their
neck, and **transfer control** to that human host for larger-scale
destruction. Cleaner NPCs spawn to tidy the mess and must be fought off.

Built as a single-file Three.js page (matches the convention used by
都市傳說2). One `index.html` holds the markup, the styles, and the
inline `<script type="module">` game code.

## Repository layout

```
UrbanLEgendmouse/
├── index.html      ← everything (HTML + CSS + game script)
└── CLAUDE.md       ← this briefing
```

A separate `models/`, `audio/`, `fonts/` folder will be added later when
art assets exist. For now the prototype uses **procedural primitives**
(spheres / capsules / boxes) so the systems can be wired up without
waiting on art.

## Conventions

- **British English** for every identifier and code comment
  (`behaviour`, `colour`, `centre`, `parasitise`, `mum`). No Americanised
  spellings. The user has explicitly asked for this — do not regress.
- One file, one game. New systems go into `index.html`, not new modules.
- Asset paths are relative — they have to work both when the page is
  opened locally and when it is hosted (the deploy target is the same
  static-host pattern used by 都市傳說2).
- Mobile-first. The desktop keyboard (WASD / Space) is supported as a
  developer convenience, but layout, sizing, and input are tuned for a
  phone in portrait.

## Technology stack

| Layer | Choice | Why |
|---|---|---|
| Engine | **Three.js 0.160.0** via ES-module CDN (`unpkg`) | Same import-map approach used in 都市傳說2 — no build step |
| Loaders | GLTFLoader / DRACOLoader / FBXLoader (addons) | Ready for art drops later |
| Skeleton cloning | `SkeletonUtils` (addons) | Cheap NPC duplication (rats, humans, cleaners) |
| Raycast acceleration | **three-mesh-bvh 0.7.5** (lazy-loaded) | Needed once the scene grows past trivial size — same lesson as 都市傳說2 |
| Camera input | Front-facing `getUserMedia({video:{facingMode:'user'}})` | Native browser API, no library |
| Face mapping | `CanvasTexture` over a sphere head, repainted on demand | No ML / face-landmark library in the POC; a future iteration can swap in FaceMesh |
| Physics | Phase 1: scripted "knock-over" impulses on `THREE.Object3D` props. Phase 2: swap to **Rapier3D** (`@dimforge/rapier3d-compat`) when the count of dynamic rigidbodies grows past ~30 | Avoid pulling in a physics engine until it earns its keep |
| AI | Plain JS state machines for the cleaner NPCs (`wander → seek → tidy → return`). A behaviour-tree library is not justified at this scale | KISS |
| State | One module-level `game` object with sub-fields (`game.controlMode`, `game.chaos`, `game.rats[]`, `game.hosts[]`, `game.cleaners[]`). No Redux/MobX/etc. | Single-file game; global state is fine |
| UI | Hand-rolled DOM overlays (joystick, buttons, chaos bar, mode badge, selfie modal). Same DOM-overlay pattern as 都市傳說2 | Lowest overhead |

## The five systems (modules inside `index.html`)

1. **`bootstrap` / `loop`** — renderer, scene, camera, lighting,
   `requestAnimationFrame` loop. Always renders; only ticks gameplay
   while `game.phase === 'playing'`.
2. **`face` — selfie capture + dynamic face mapping** (POC delivered).
   `openSelfieCapture()` opens a modal that streams the front camera,
   `captureSelfie()` freezes a square crop, `paintFaceTexture(image)`
   bakes it into the head's `CanvasTexture`. Fallback: a default
   pre-made face is used if the camera is denied.
3. **`movement` / `chaos`** — joystick → forward velocity for whichever
   entity is currently being controlled (rat or host). Rigidbody props
   are simple `Object3D`s with a `chaosWeight`; on collision the prop
   tips over (script-driven for now) and adds to `game.chaos`. Chaos
   above thresholds spawns rats at the scene edges.
4. **`parasitism` — climbing + bite-and-take-over** (POC delivered for
   the take-over half). Detects rat proximity to a host's neck, hides
   the rat, swaps `game.controlMode` from `'rat'` to `'host'`, retargets
   the camera, and routes joystick input to the host. Exit-host action
   restores the rat. Climbing surfaces are tagged on the geometry
   (`userData.climbable = true`); a separate `climb` mode is sketched
   but not yet wired to gameplay.
5. **`cleaners` — opposing AI** — humans tagged as cleaners walk to the
   currently-most-displaced rigidbody and run a tidy animation that
   slowly subtracts from `game.chaos`. While in host mode the player
   can knock cleaners over to interrupt them. Stubbed in the POC.

## Game phases

`game.phase` values: `'selfie' | 'briefing' | 'playing' | 'won'`.

- `selfie` — initial modal. User either captures a selfie or picks the
  preset face. On confirm → `briefing`.
- `briefing` — short hint card. On dismiss → `playing`.
- `playing` — main loop, chaos accumulating, rats spawning.
- `won` — once `game.rats.length >= WIN_RAT_COUNT`. Fades out, shows
  the victory card.

## Control modes (`game.controlMode`)

- `'rat'` (default) — joystick drives the human-headed rat. Jump button
  hops. Holding "bite" while next to a host neck triggers parasitism.
- `'host'` — joystick drives the parasitised human. Jump button kicks
  / shoves nearby props and cleaners. "Bite" button now exits the
  host and drops the rat at the host's feet.

Both modes share one input layer — `inputController` exposes
`getMoveAxis()`, `wasJumpPressed()`, `wasActionPressed()` — and the
movement code reads the same axis regardless of which body is being
driven. This is the key reason to keep a single `entity.controllable`
flag rather than hard-coding two input pipelines.

## Performance lessons inherited from 都市傳說2 — *do not regress*

1. Lazy-load three-mesh-bvh; cache ground-Y queries on a grid.
2. Decals (graffiti, claw marks) only on meshes below ~18k triangles;
   bigger surfaces use a flat-plane fallback.
3. Never call `clear()` on a hot cache. LRU-evict one entry at a time.
4. SkeletonUtils.clone **shares** geometry — only dispose per-instance
   cloned materials, never the geometry.

## Browser & device support

- Target: iOS Safari 17+, Chrome on Android 12+.
- Camera permission is requested **on user gesture only** (a "Take a
  selfie" button) — iOS rejects `getUserMedia` calls fired from page
  load.
- Camera permission denied → the preset face PNG (`./face_preset.png`)
  is used. Game must still be fully playable in that path.

## Quick self-test

Once running, open the browser console — you should see:

```
[boot] scene ready
[bvh] loaded               ← lazy import, may arrive a moment later
[face] initial texture painted (preset)
[face] camera stream opened   ← only after the user taps "selfie"
[face] selfie captured (512x512)
[parasitism] host acquired: human#3
[parasitism] host released
```

If `[bvh]` never logs, raycasts are running on the slow path — fine for
the prototype scene, becomes a problem once real geometry lands.

## Git flow

- Repo is fresh (`UrbanLEgendmouse/.git` exists, only `.gitattributes`
  committed so far).
- Branch: `main`. Push direct, no PR workflow yet.
- Commit subject: short imperative. Body: what & why. Sign off with
  `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
