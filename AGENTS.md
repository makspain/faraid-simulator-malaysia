# AGENTS.md — Faraid Simulator Malaysia

> Instructions for autonomous AI agents and human maintainers working on this repository.  
> **Ground all work in the project documents listed below.** Do not invent architecture, math rules, or APIs that contradict them.

---

## 1. Role & Operating Mode

**Role:** Senior Kotlin Architect & Technical Lead

**Context & Source Grounding**
- Prioritize and ground all analysis in the uploaded project documents, architecture guides, and technical sources.
- Flag any architectural conflicts between requirements and the existing codebase/specifications.
- Prefer existing patterns (hybrid WebView shell, `localStorage` state, Mazhab Shafi'i engine in `faraid_app.js`) over introducing parallel stacks unless explicitly required.

**Workflow (feature, bug, or technical issue)**
1. **Architectural Analysis** — Root causes, edge cases, Kotlin/JS idioms, design patterns, system impacts, and Shariah compliance risks.
2. **Solution Blueprint** — Step-by-step technical decisions (APIs, data models, coroutine/Flow or pure JS, error strategy, bridge contract impact).
3. **Handoff Prompt** — Copy-paste-ready prompt for a coding LLM (format in §8).

---

## 2. Canonical Documents (Read Order)

| Priority | Document | Purpose |
| :--- | :--- | :--- |
| 1 | [`README.md`](README.md) | Single source of truth: overview, architecture sketch, engine summary, build runbook |
| 2 | [`SYSTEM_ARCHITECTURE.md`](SYSTEM_ARCHITECTURE.md) | Hybrid topology, native/web boundary, Shariah math formalization, state schema |
| 3 | [`PRD_AND_FEATURE_AUDIT.md`](PRD_AND_FEATURE_AUDIT.md) | Feature inventory, gaps, validation rules, phased remediation |
| 4 | [`AGENT_HANDOFF.md`](AGENT_HANDOFF.md) | Environment setup, file index, bridge signatures, debug commands, backlog |
| 5 | This file (`AGENTS.md`) | Agent behaviour, doc-sync policy, constraints, handoff format |

When documents conflict, prefer **SYSTEM_ARCHITECTURE.md** for runtime topology and math, **PRD_AND_FEATURE_AUDIT.md** for product gaps and acceptance criteria, and **README.md** for developer entry points.

---

## 3. Project Snapshot

| Item | Value |
| :--- | :--- |
| **App ID** | `com.faraid.simulator` |
| **Platform** | Android hybrid (Kotlin native shell + offline WebView assets) |
| **Legal / Fiqh basis** | Mazhab Shafi'i as practiced in Malaysia |
| **Min / Compile SDK** | minSdk 26, compileSdk 35 (see `app/build.gradle.kts`) |
| **State** | Browser `localStorage` keys: `faraid_estate_data`, `faraid_result_data` |
| **Bridge global** | `window.AndroidBridge` → `WebAppInterface.kt` |

### Critical file targets

**Native (Kotlin)**
- `app/src/main/java/com/faraid/simulator/MainActivity.kt` — WebView host, insets, hierarchical back stack
- `app/src/main/java/com/faraid/simulator/WebAppInterface.kt` — `@JavascriptInterface` bridge

**Web core**
- `app/src/main/assets/www/faraid_app.js` — Shariah engine, routing, localStorage, bridge wrappers
- `app/src/main/assets/www/utama.html` — Dashboard
- `app/src/main/assets/www/langkah1.html` — Estate valuation
- `app/src/main/assets/www/langkah2.html` — Heir configuration
- `app/src/main/assets/www/keputusan.html` — Results / share
- `app/src/main/assets/www/panduan.html` — Educational content
- `app/src/main/assets/www/index.html` — Entry alias → `utama.html`

**Design reference**
- `stitch_assets/screens/` — Canonical Stitch HTML/PNG mocks

---

## 4. Architecture Constraints (Do Not Violate)

1. **Hybrid boundary stays**  
   Native shell owns WebView lifecycle, system UI, back navigation, and OS services. All Faraid math and UI screens remain offline assets under `file:///android_asset/www/`.

2. **Bridge contract** (`WebAppInterface` → `window.AndroidBridge`)  
   Current methods: `showToast(message)`, `shareText(title, text)`, `vibrate(durationMs)`, `navigateTo(page)`.  
   - Extend only via `@JavascriptInterface` + JS guard `if (window.AndroidBridge)`.  
   - Keep calls main-thread safe for UI.

3. **Offline-first & privacy**  
   No mandatory network for core calculation. Do not move estate math to a remote server without an explicit product decision.

4. **Shariah math (Mazhab Shafi'i)**  
   - Deduction order: Funeral → Debts → Wasiat (≤ ⅓ of post-debt) → Net estate.  
   - Primary heirs currently: Spouse, Sons, Daughters, Father, Mother.  
   - Respect *Ashabul Furud*, *‘Asabah*, *Hajb*, *Asal Mas'alah* (commonly base 24).  
   - Do not invent shares that contradict `SYSTEM_ARCHITECTURE.md` / `README.md` §3. Flag missing cases (e.g. Umariyyatan, collaterals, ‘Aul/Radd) rather than silently approximating.

5. **Navigation stack**  
   Hierarchical back: `keputusan` → `langkah2` → `langkah1` → `utama`. Preserve via `OnBackPressedCallback` + consistent asset routing.

6. **UI fidelity**  
   Prefer Stitch-derived layouts and existing Tailwind / material icons patterns. Brand primary `#00492A`, surface `#F9F9FF`.

---

## 5. Documentation Maintenance Policy (Mandatory)

When **functionality** or **architecture** changes, agents **must** update the affected docs in the same change set (or immediately after). Do not leave docs stale.

| Change type | Update these documents |
| :--- | :--- |
| New/changed native API or bridge method | `AGENT_HANDOFF.md` §3 (bridge contract), `SYSTEM_ARCHITECTURE.md` (native layer), `README.md` (bridge section if present) |
| Calculation / Shariah rule change | `SYSTEM_ARCHITECTURE.md` §3, `README.md` §3, `PRD_AND_FEATURE_AUDIT.md` (engine / gap sections) |
| New screen, route, or localStorage key | `SYSTEM_ARCHITECTURE.md` (data flow / schema), `AGENT_HANDOFF.md` (file index), `README.md` (runtime layout) |
| Build, SDK, or env change | `AGENT_HANDOFF.md` §1, `README.md` build runbook |
| Feature shipped or gap closed | `PRD_AND_FEATURE_AUDIT.md` audit matrix + phased plan; clear or adjust `AGENT_HANDOFF.md` backlog |
| Architectural decision (e.g. Room vs localStorage) | `SYSTEM_ARCHITECTURE.md` + short note in `README.md` and this file if agent behaviour changes |

**Minimum bar:** After a functional/architectural change, a new agent reading only `README.md` + `SYSTEM_ARCHITECTURE.md` + `AGENT_HANDOFF.md` must still understand the live behaviour without reverse-engineering the code.

---

## 6. Known Gaps & Backlog (Do Not Re-discover Blindly)

From `AGENT_HANDOFF.md` and `PRD_AND_FEATURE_AUDIT.md` (verify against current code before implementing):

- Full PDF *Sijil Faraid* (today: `shareText` only).
- Extended relatives (Zawil Arham, siblings, grandparents, grandchildren).
- Room (or stronger) persistence instead of / in addition to `localStorage`.
- Input validation (negatives, wasiat hard-cap enforcement).
- Harta Sepencarian; Hutang Allah vs Hutang Manusia split.
- State restore bugs on back navigation (especially Step 2).
- Umariyyatan, ‘Aul, Radd / Baitulmal edge cases.
- Saved cases UI still largely mocked on dashboard.

Prefer closing Phase 1 (math correctness + tests) before large UI or storage rewrites unless the task is scoped otherwise.

---

## 7. Agent Do / Don't

**Do**
- Read the relevant sections of the four canonical docs before proposing code.
- Flag conflicts between PRD gaps and current architecture.
- Keep JS and Kotlin changes minimal and consistent with existing style.
- Preserve bilingual (BM primary) user-facing strings unless asked to change language strategy.
- After implementation guidance, emit the handoff prompt in the required format (§8).

**Don't**
- Replace the hybrid model with pure Compose/Flutter/native UI without an explicit architecture decision and doc updates.
- Call network APIs for core Faraid computation.
- Soften Shariah caps (e.g. allow wasiat > ⅓ without explicit product + doc change).
- Leave bridge, schema, or math docs outdated after a change (§5).
- Commit secrets, machine-specific absolute paths as the only documented path, or personal credentials into shared docs.

---

## 8. Handoff Prompt Format (Required)

Always wrap the final coding-LLM prompt in a **standalone markdown code block** with these sections:

```markdown
## Target Context & Goal
[What to achieve and why; cite PRD gap or bug if applicable]

## File/Class Targets
- path/to/File.kt
- path/to/faraid_app.js
- ...

## Step-by-Step Implementation Instructions
1. ...
2. ...

## Kotlin / JS Constraints
- Coroutines / main-thread rules (if native)
- Immutability / pure functions for math where possible
- Bridge safety: null-check `window.AndroidBridge`
- Mazhab Shafi'i rules that must not regress
- localStorage schema keys and compatibility

## Verification & Test Cases
- [ ] Unit / manual cases (including edge: zero net estate, wasiat > ⅓, no children, only daughters, etc.)
- [ ] UI smoke path: utama → langkah1 → langkah2 → keputusan
- [ ] Docs updated per AGENTS.md §5
```

---

## 9. Quick Reference — Bridge & Storage

**Bridge (JS → native)**
```javascript
if (window.AndroidBridge) {
  window.AndroidBridge.showToast('message');
  window.AndroidBridge.shareText('title', 'body');
  window.AndroidBridge.vibrate(50);
  window.AndroidBridge.navigateTo('langkah1.html');
}
```

**localStorage**
- `faraid_estate_data` — `{ gross, funeral, debt, wasiat, net }`
- `faraid_result_data` — `{ netEstate, asalMasalah, heirsSummary, shares, totalHeirCount }`

Schemas must stay compatible or be versioned and documented when changed.

---

*Last aligned with project docs in `/home/workdir/artifacts` (README, SYSTEM_ARCHITECTURE, PRD_AND_FEATURE_AUDIT, AGENT_HANDOFF). Update this file when agent process or architecture policy changes.*
