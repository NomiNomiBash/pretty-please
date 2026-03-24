# pretty please — architecture

## what this is

A **daily-flavoured** social planning game: players run a simulated group chat and try to lock in the right headcount for an occasion in as few steps as possible. Default tone is **London**, but **authored editions** can change city, cast, and voice.

There is **no database** in the current stack. Gameplay state lives in the **browser** for the session; the server only handles **cast resolution**, **LLM turns**, **place autocomplete**, and a **no-op result ack**.

---

## design choices (current)

- **Play and forget:** no persisted player sessions, chat logs, or identities server-side. Optional `POST /api/result` returns `{ ok: true }` and does not store payloads (scaffold only).
- **Same “daily puzzle” without a DB:**  
  - **Authored day:** `editions/YYYY-MM-DD.json` (UTC date) defines occasion + full cast.  
  - **No file that day:** **seeded procedural** cast for that ISO date — same roster for everyone who shares that date key, recomputed on each request (deterministic from the date + code).
- **LLM on demand:** each player action can call Anthropic via **`POST /api/turn`** (production) or **browser → Anthropic** in dev when API routes are off (see below).

---

## system overview

```
┌─────────────────────────────────────────────────────────┐
│  CLIENT — React + Vite SPA (static assets on CDN)       │
│  State: useGameState (in-memory). Optional VITE_* keys  │
│  in dev for direct Anthropic / Geoapify fallback.       │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────┐
│  VERCEL SERVERLESS — `api/*.js`                         │
│  GET  /api/cast   — authored JSON or procedural cast    │
│  POST /api/turn   — Anthropic proxy (server key)        │
│  GET  /api/places — Geoapify proxy (optional)           │
│  POST /api/result — ack only (no persistence)           │
└───────────────────────────┬─────────────────────────────┘
                            │
                ┌───────────▼───────────┐
                │  Anthropic Messages   │
                │  (claude-sonnet-4-6)  │
                └───────────────────────┘
```

There is **no** `GET /api/occasion` route; occasion is part of `/api/cast` (or derived procedurally).

---

## daily cast resolution

**Date key:** `YYYY-MM-DD` in **UTC** (`new Date().toISOString().slice(0, 10)`), used consistently for edition filenames and procedural seeding.

### 1. Authored edition (optional)

- **Repo path:** `editions/YYYY-MM-DD.json`
- **Server:** `api/cast.js` reads the file with `fs` if it exists and passes it through `normalizeAuthoredEdition` (`src/lib/editionNormalize.js`).
- **Client (dev / offline):** Vite bundles matching JSON via `import.meta.glob` in `src/lib/authoredEditionsBrowser.js` so `getTodayCast()` can resolve the same file without hitting the network.

Response includes `source: "authored"` or `"local-authored"` when served from bundled JSON.

### 2. Procedural fallback (default)

- **`src/lib/proceduralCast.js`:** occasion from `pickOccasionForCalendarDay` using the **day-of-month** from the ISO key; cast = subset of `src/data/characters.js` via **seeded** `pickGroupForOccasionSeeded` / `assignIdentitiesSeeded` for that date.
- Group size comes from **`getGroupSizeForOccasion`** in `src/data/namePool.js` (not a fixed 14).

Server response uses `source: "api"`; purely local dev uses `source: "local-fallback-seeded"`.

### 3. Authoring hooks

- Optional top-level **`theme`** (metadata).
- Optional **`settingLine`** → stored on the occasion as **`editionSettingLine`** for the system prompt (`src/lib/promptBuilder.js`): adds a **SETTING:** line and relaxes the default “London” framing.
- Per-character optional **`linguisticFingerprint`** overrides built-in fingerprints keyed by `id`.

---

## edition JSON shape (author reference)

```json
{
  "theme": "optional string",
  "settingLine": "optional — e.g. different city / fictional premise",
  "occasion": {
    "id": "string",
    "name": "string",
    "emoji": "string",
    "venue": "string",
    "target": 8,
    "min": 5,
    "max": 12,
    "note": "string"
  },
  "characters": [
    {
      "id": "archetype-id",
      "name": "Display name",
      "avatar": "👤",
      "lastSeen": "optional",
      "personality": "optional",
      "linguisticFingerprint": "optional — overrides prompt voice for this id"
    }
  ]
}
```

At least **two** characters are required. Reusing existing archetype **`id`** values keeps flake weights and default fingerprints predictable; fictional ids fall back to generic prompt behaviour unless you supply **`linguisticFingerprint`**.

---

## API routes (implemented)

### `GET /api/cast`

Returns `{ date, occasion, characters, source }`.  
**No Anthropic call.** Reads `editions/<date>.json` if present; otherwise procedural cast for that date.

### `POST /api/turn`

**Body (JSON):** `occ`, `chars`, `mode`, `prompt`, optional `dates`, `weeksLeft`, `totalWeeks`.

Builds system prompt via **`buildSys`** (`src/lib/promptBuilder.js`), calls Anthropic, returns parsed JSON (`responses`, `narratorComment`, etc.) plus `from_cache: false`. **No response caching** in code today.

**Per-IP rate limits (server, best-effort in-memory):**

| Route | Default | Notes |
|-------|---------|--------|
| `POST /api/turn` | **80 / hour / IP** | ~5 full games at ~16 turns each |
| `GET /api/cast` | **5 / hour / IP** | Cuts cast scraping / endless refresh |

Tune with `RATE_LIMIT_TURN_PER_HOUR` and `RATE_LIMIT_CAST_PER_HOUR`. Set `RATE_LIMIT_DISABLED=true` to turn off (e.g. local). On many cold instances, limits are weaker than the numbers suggest; upgrade to **Redis / Upstash** if you need a hard global cap.

### `GET /api/places?input=…`

Proxies **Geoapify** autocomplete when `GEOAPIFY_API_KEY` is set; otherwise `{ predictions: [] }`.

### `POST /api/result`

Accepts JSON payload; responds with **`ok: true`** and a small **`received`** echo. **Does not persist** to a database.

---

## client architecture

**Routing:** `App.jsx` switches on `useGameState().phase` — intro → `IntroScreen`, playing → `GameView`, result → `ResultScreen`.

```
src/
  App.jsx
  main.jsx
  components/
    IntroScreen.jsx
    GameView.jsx
    ResultScreen.jsx
    ChatMsg.jsx
    PollBubble.jsx
  data/
    characters.js      ← archetype pool + DM ghost helpers
    occasions.js       ← static occasion list + pickOccasionForCalendarDay
    commitmentDisplay.js
    namePool.js        ← group size, seeded shuffle, identities
  hooks/
    useGameState.js    ← session state, turns, scoring, weeks (4-week run)
    useCast.js         ← loads cast via getTodayCast()
  api/
    gameApi.js         ← getTodayCast, sendTurn, postResult, fetchPlaceSuggestions
    anthropic.js       ← browser Anthropic call (dev / fallback)
  lib/
    proceduralCast.js
    editionNormalize.js
    authoredEditionsBrowser.js
    promptBuilder.js
    serverRateLimit.js ← in-memory fixed window for `api/*` (best-effort)
    dates.js
  utils/
    scoring.js
```

**`src/api/gameApi.js` — `USE_API_ROUTES`**

- **`true`** in production (and in dev if `VITE_USE_API_ROUTES === "true"`): use `/api/cast`, `/api/turn`, `/api/places`, `/api/result`.
- **`false`** in local dev by default: cast from bundled editions + procedural; turns call **`fetchResponses`** in `anthropic.js` (requires **`VITE_ANTHROPIC_API_KEY`** in the browser build).

Production expectation: **no Anthropic key in the client**; only **`ANTHROPIC_API_KEY`** on the server for `/api/turn`.

---

## game rules (snapshot)

- **Weeks:** `TOTAL_WEEKS = 4` in `useGameState.js`; **4 steps per week** before the in-game week counter decrements (see `advanceWeekAndApplyFlakes`).
- **Actions:** message, poll, pin, DM, nudge, deadline — chips in `GameView.jsx`; prompt behaviour in `promptBuilder.js`.
- **Start:** `startGame(occasion, castFromApi, gameDateKey)` applies **`assignSingleDmGhost`** from `characters.js` so one eligible archetype may ignore DMs for the first in-game weeks.

---

## environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `ANTHROPIC_API_KEY` | Vercel (server) | `/api/turn` |
| `VITE_ANTHROPIC_API_KEY` | Local dev only | Direct browser Anthropic when `USE_API_ROUTES` is false |
| `VITE_USE_API_ROUTES` | Optional | `"true"` in dev to hit Vercel-style `/api/*` |
| `GEOAPIFY_API_KEY` | Server | `/api/places`; client may use `VITE_GEOAPIFY_API_KEY` as fallback in `gameApi.js` |
| `RATE_LIMIT_TURN_PER_HOUR` | Server | Default `80` for `POST /api/turn` |
| `RATE_LIMIT_CAST_PER_HOUR` | Server | Default `5` for `GET /api/cast` |
| `RATE_LIMIT_DISABLED` | Server | Set `true` to skip limits (local / debugging) |

---

## deployment

- **Build:** `vite build` → static assets in `dist/`.
- **Hosting:** e.g. **Vercel** with serverless **`api/`** handlers alongside the SPA.
- **New authored day:** add `editions/YYYY-MM-DD.json`, commit, deploy (and rebuild so Vite includes the JSON for offline / fallback bundling).

---

## not implemented (vs earlier spec ideas)

The following appear in older notes or wishlists but **are not in the repo** today:

- Database tables (`daily_cast`, `response_cache`, `game_results`)
- Cron job for once-a-day LLM cast generation
- CDN edge caching of `/api/cast`
- Strong global rate limits (Redis / edge) — only in-memory per instance today
- Turn response caching / `from_cache` semantics beyond the static `false` flag
- Shareable OG image pipeline (`sharing.js`, html-to-canvas, etc.)
- Spend caps and pre-written fallback responses

Those can be added later without changing the **file-based edition + procedural fallback** model if you introduce storage only where you truly need it (e.g. analytics or shared cache).
