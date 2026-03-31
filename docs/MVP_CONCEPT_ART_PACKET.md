# MVP Concept Art Packet

Date: 2026-03-31
Status: Required pre-implementation packet for presentation asset production
Scope: Concept definition and approval only (no final SVG implementation files)

This document defines the minimum concept-art packet that must be completed and approved before creating implementation SVG assets for the redesigned presentation system.

Canonical companions:

- [AGENT.md](../AGENT.md)
- [docs/SCENE_VISUAL_DIRECTION.md](SCENE_VISUAL_DIRECTION.md)
- [docs/ARTWORK_PIPELINE.md](ARTWORK_PIPELINE.md)
- [docs/UI_PRESENTATION_REDESIGN_PLAN.md](UI_PRESENTATION_REDESIGN_PLAN.md)
- [docs/MVP_ASSET_PLAN.md](MVP_ASSET_PLAN.md)

---

## 1. Purpose

The concept packet exists to lock visual intent before production SVG implementation work starts.

It prevents:

- style drift back to corporate/diagrammatic looks
- inconsistent `avatarRole` readability
- expensive implementation rework caused by unclear art direction

This packet is a gate. If the checklist is incomplete, do not start final SVG assets.

---

## 2. MVP Packet Contents (Required)

Required packet deliverables for MVP:

1. 5 scene concepts
2. 6 `avatarRole` concepts
3. 1 posture/expression matrix covering supportive, neutral, concerned, upset
4. 1 small UI surface language board for scroll/codex/panel treatment

This scope is intentionally practical for MVP while still anchoring visual direction.

---

## 3. Scene Concept Set (Design + Approval Before SVG)

All scenes must follow [docs/SCENE_VISUAL_DIRECTION.md](SCENE_VISUAL_DIRECTION.md): place/stage composition, overlay-safe negative space, small-size legibility.

Minimum required scene concepts (5):

1. `default_run_scene` (generic fallback stage)
2. `legacy_architecture` (legacy pressure atmosphere)
3. `distributed_chaos` (fragmented systems atmosphere)
4. `hypergrowth_velocity` (rapid scale pressure atmosphere)
5. `compliance_pressure` (inspection and control atmosphere)

For each scene concept, include:

- one wide composition sketch (scenario banner framing)
- one compact crop check (event/card-scale readability sanity)
- marked overlay-safe zones for gameplay UI
- focal hierarchy notes (primary, secondary, ambient)
- anti-goal check (not infographic, not dashboard)

Approval gate for each scene:

- scene reads as a place/stage in under 3 seconds
- overlay-safe space is explicit and usable
- no text-heavy baked-in labels
- passes anti-goals in [docs/SCENE_VISUAL_DIRECTION.md](SCENE_VISUAL_DIRECTION.md)

---

## 4. Initial `avatarRole` Concept Set (Design + Approval Before SVG)

`avatarRole` visuals are generic fantasy-tech roles, not domain-specific business portraits.

Required MVP concept set (6):

1. `oracle`
2. `chronicler`
3. `warden`
4. `artificer`
5. `chancellor`
6. `envoy`

Notes:

- `envoy` is included as a sixth role to reduce visual repetition in MVP casting.
- Additional roles may be added later, but these six are the minimum concept lock.

### Minimum concept coverage per `avatarRole`

Each role concept must include all of the following before implementation SVG work:

- silhouette / overall look sheet
- one base standing pose (neutral-ready stance)
- posture/expression direction notes for:
  - supportive
  - neutral
  - concerned
  - upset

### Role-by-role concept checklist

| `avatarRole` | Silhouette / overall look (required) | Base standing pose (required) | Supportive direction | Neutral direction | Concerned direction | Upset direction |
|---|---|---|---|---|---|---|
| `oracle` | Cloaked seer silhouette, orb/lens motif, readable head shape | Grounded stance, one hand near focus artifact | Slight forward lean, open shoulder line, lifted gaze | Centered posture, calm brow, low-intensity glow | Brows angled inward, guarded shoulders, dimmed orb | Tense neck/shoulders, narrowed eyes, unstable glow |
| `chronicler` | Scribe silhouette, satchel/tablet profile, clean cape edge | Upright recorder stance, one hand ready to document | Open chest, quick-note gesture, alert eyes | Balanced stance, composed expression, still hands | Hesitant pen angle, chin tuck, constrained shoulders | Hard jaw, rigid posture, abrupt writing gesture |
| `warden` | Broad guard silhouette, shield-emblem read, armored shoulder mass | Protective stance, feet planted, torso forward | Protective-open posture, steady eye line, confident set | Guard-ready posture, neutral jaw, even weight | Raised guard side, furrowed brow, tension at elbows | Compressed stance, shield-forward posture, stern glare |
| `artificer` | Tool-bearing silhouette, apron/belt geometry, asymmetry from gear | Workshop-ready stance, one hand on tool rig | Animated upper body, engaged hand gesture, bright accents | Resting work stance, measured gaze, stable toolkit | Shoulder pinch, cautious head tilt, reduced glow | Aggressive tool grip, tense jawline, sparks/chaotic accents |
| `chancellor` | Formal authority silhouette, high collar/insignia massing | Composed standing pose, one hand directive | Reassuring hand raise, softened eyes, open stance | Still authoritative stance, controlled expression | Tightened lips, closed stance, scrutiny gaze | Rigid command pose, sharp brow, severe mouth line |
| `envoy` | Diplomatic-traveler silhouette, layered cloak, emblem token | Conversational stance, one hand mediating | Open-palmed gesture, warm eye line, relaxed shoulders | Balanced mediator stance, calm face, neutral gesture | Slight recoil, guarded hands, uncertain brow | Defensive angle, tightened shoulders, confrontational stare |

---

## 5. Posture/Expression Matrix Deliverable

A single cross-role posture/expression matrix is required in the packet.

Matrix requirements:

- rows: all six `avatarRole` concepts
- columns: supportive, neutral, concerned, upset
- each cell includes a brief direction note for:
  - shoulder line
  - head tilt/gaze
  - mouth/brow intensity
  - accent/glow behavior

Pass criteria:

- states are distinguishable at small avatar thumbnail sizes
- role identity remains stable across all four states
- changes are driven by posture and expression, not costume replacement

---

## 6. Shared UI Surface Language Board

A small shared reference board for UI surfaces is required before implementation SVG assets.

Decision: yes, this board is required for MVP.

Board scope:

- scroll treatment reference (edge, trim, material cue)
- codex treatment reference (frame, corner motif, divider language)
- panel treatment reference (overlay-safe frame density, decorative restraint)

Board constraints:

- must support gameplay readability first
- must remain compatible with scene negative-space rules
- must avoid observability-dashboard visual language

---

## 7. Approval Checklist (Pre-Implementation Gate)

Use this checklist before any final SVG implementation task is started.

- [ ] 5 scene concepts complete and approved
- [ ] Scene overlay-safe zones documented for each concept
- [ ] 6 `avatarRole` concepts complete and approved
- [ ] Each `avatarRole` includes silhouette sheet + base standing pose
- [ ] Each `avatarRole` includes supportive/neutral/concerned/upset direction notes
- [ ] Cross-role posture/expression matrix complete
- [ ] UI surface language board complete (scroll/codex/panel)
- [ ] Anti-goal review passed against [docs/SCENE_VISUAL_DIRECTION.md](SCENE_VISUAL_DIRECTION.md)
- [ ] Packet approved before final SVG implementation begins

---

## 8. Out of Scope for This Packet

This packet does not include:

- final production SVG files
- runtime registry wiring changes
- implementation component changes
- gameplay/simulation logic changes

This is concept anchoring only.