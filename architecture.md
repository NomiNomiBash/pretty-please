# pretty please — architecture spec

## what this is

A daily social planning game. Every day a new cast of 14 characters is generated. Players try to organise a real London gathering by messaging the group via a simulated WhatsApp interface. Each action costs a step. The goal is to get the right number of people committed in the fewest steps.

---

## the daily cast model

This is the core architectural decision everything else flows from.

**One API call generates the entire day's cast.** This happens once per day, server-side, on a cron job. The resulting cast — names, avatars, personalities, quirks, commitment tendencies — is stored in a database and served to every player that day. Everyone on Tuesday plays with Tuesday's cast.

This gives you:
- A Wordle-style shared cultural moment ("did you get Zara to commit?")
- Near-zero per-player LLM cost for cast generation
- A theming hook — Monday cast can skew reliable, Friday can be maximum chaos, January cast can be sober-month themed

The cast expires at midnight. Wednesday's players get a fresh cast.

---

## system overview

```
┌─────────────────────────────────────────────────────┐
│                     CLIENT                          │
│  React SPA — static, served from CDN               │
│  No API keys. No direct Anthropic calls.            │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────┐
│                  API SERVER                         │
│  Node / Express (or Next.js API routes)             │
│                                                     │
│  POST /api/turn      — game turn                    │
│  GET  /api/cast      — today's cast                 │
│  GET  /api/occasion  — today's occasion             │
│  POST /api/result    — store end-of-game result     │
└────────────────────┬────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
┌─────────▼──────┐    ┌─────────▼──────────────────┐
│   ANTHROPIC    │    │         DATABASE            │
│   API          │    │                             │
│                │    │  daily_cast                 │
│  claude-sonnet │    │  response_cache             │
│                │    │  game_results               │
└────────────────┘    └─────────────────────────────┘
```

---

## database schema

### `daily_cast`
```sql
id            serial primary key
date          date unique          -- one cast per day
occasion      jsonb                -- { id, name, emoji, venue, target, min, max, note }
characters    jsonb                -- array of 14 character objects (see below)
theme         text                 -- optional e.g. "dry january", "pre-christmas chaos"
generated_at  timestamp
```

**Character object shape:**
```json
{
  "id": "zara",
  "name": "Zara",
  "avatar": "👩🏽",
  "archetype": "zone-snob",
  "personality": "Moved to Peckham 8 months ago...",
  "quirk": "treats Zone 1 as a foreign country",
  "commitment_tendency": 0.3,
  "last_seen": "today at 12:45"
}
```

### `response_cache`
```sql
id              serial primary key
cast_date       date
character_id    text
action_type     text    -- message | nudge | deadline | pin | dm | poll
commitment_from text    -- commitment state when action was received
commitment_to   text    -- resulting commitment state
messages        jsonb   -- array of message strings
use_count       integer default 0
created_at      timestamp
```

This is your cost reduction engine. See caching strategy below.

### `game_results`
```sql
id              serial primary key
cast_date       date
session_id      text
occasion_id     text
steps           integer
confirmed_count integer
outcome         text     -- win | loss_too_few | loss_too_many
confirmed_chars jsonb    -- array of character names who confirmed
narrator_lines  jsonb    -- best narrator lines from the session
score           integer
created_at      timestamp
```

---

## cron job — daily cast generation

Runs at 00:01 every day.

```
1. Pick or generate today's occasion
2. Call Anthropic once with a cast generation prompt
3. Receive 14 characters with full personality specs
4. Store in daily_cast table
5. Optionally pre-warm the response cache with a seed run
   (simulate one full game to generate cached responses for common states)
```

**Cast generation prompt shape:**
```
Generate a cast of 14 London friends for a social planning game.
Today's theme: [theme or "none"]
Today's occasion: [occasion name and details]

For each character produce:
- name (London-realistic, diverse)
- avatar (single emoji, varied skin tones)
- archetype (one of: enthusiast-hedger | ghost | late-confirmer | zone-snob |
             wellness-era | coupled-up | always-working | connector |
             hyper-organiser | over-committed | unreliable-yes | last-minute)
- personality (2-3 sentences, specific and funny)
- quirk (one sentence, the thing they always do)
- commitment_tendency (0.0–1.0, honest probability they actually show up)
- last_seen (fake WhatsApp timestamp)

Return valid JSON array only.
```

---

## API routes

### `GET /api/cast`
Returns today's cast and occasion from the database. No Anthropic call. This is just a DB read.

Response:
```json
{
  "date": "2025-03-24",
  "occasion": { ... },
  "characters": [ ... ]
}
```

Rate limit: 100 req/min per IP. Cached at CDN edge with 5min TTL.

---

### `POST /api/turn`
The main game endpoint. Called once per player action.

Request:
```json
{
  "session_id": "abc123",
  "cast_date": "2025-03-24",
  "action": {
    "type": "nudge",
    "text": "come on lads",
    "dm_target": null
  },
  "commitments": {
    "zara": "maybe",
    "theo": "unknown",
    ...
  },
  "history": [
    { "sender": "You", "text": "...", "action": "message" },
    ...
  ]
}
```

**Server logic:**

```
1. Validate session, check rate limit (max 40 turns/session, 3 sessions/hour/IP)
2. Check response_cache for a match on (cast_date, action_type, character commitment states)
3. Cache HIT for background characters → serve cached response, skip Anthropic call
4. Cache MISS or foreground characters → call Anthropic, store result in cache
5. Return responses + narrator comment
6. Increment use_count on any cache entries used
```

Rate limit: 40 req/session, 120 req/hour per IP.

Response:
```json
{
  "responses": [
    {
      "characterId": "zara",
      "messages": ["ugh zone 1 though", "is there genuinely nothing in peckham"],
      "commitment": "maybe"
    }
  ],
  "narratorComment": "Zone 1 strikes again.",
  "from_cache": false
}
```

---

### `POST /api/result`
Called when player locks in. Stores outcome for analytics and leaderboard.

---

## caching strategy

The key insight: **context matters less than you think for most characters.**

When Hamish gets nudged while his commitment is `unknown`, his response is almost always a variation of the same thing. The specific chat history above it barely affects what he says. You can cache that response and serve it to the next player in the same state — they'll never know.

**What to cache:** responses keyed on `(cast_date, character_id, action_type, commitment_from)`.

**What not to cache:** responses to DMs (too context-dependent), first turn of a session (needs fresh context), any response where the chat history is highly unusual.

**Cache hit logic:**
```
if action is DM → always call Anthropic
if character hasn't spoken yet this session → prefer Anthropic (first impression matters)
if cache has 3+ entries for this key → randomly pick one, skip Anthropic
if cache has 1-2 entries → 50% chance of using cache, 50% fresh
if cache is empty → call Anthropic, store result
```

Over time the cache fills up and costs drop dramatically. The first week is expensive, the second week is cheap.

---

## client architecture

Static React SPA. Deployed to Vercel / Netlify / Cloudflare Pages.

```
src/
  components/
    IntroScreen.jsx       ← planner aesthetic, notebook design
    GameScreen.jsx        ← WhatsApp interface
    ResultScreen.jsx      ← shareable end card
    ChatMsg.jsx
    PollBubble.jsx
    StatsSidebar.jsx
  data/
    occasions.js          ← static fallback occasions
  hooks/
    useGameState.js       ← all game logic, state machine
    useCast.js            ← fetches today's cast from /api/cast
  utils/
    scoring.js
    sharing.js            ← generates shareable result card
```

**No API keys in the client. Ever.**

The client fetches the cast on load, runs local game state, and fires to `/api/turn` on each action.

---

## shareable result card

The viral mechanic. Generated at end of game.

```
pretty please 📋
24 March · Bottomless Brunch · HIDE, Piccadilly

confirmed ✅  Zara, Marcus, Bex, Jade, Ollie
ghosted 👻   Hamish (obviously)
flaked 😬   Saskia ("absolutely slammed")

4/5 in range · 11 steps · score 78

play today's →  pretty-please.co
```

This is a client-side generated image (html-to-canvas or a server-side OG image endpoint). Twitter/WhatsApp preview pulls the OG image.

---

## cost model

| Event | Tokens | Cost (est.) |
|---|---|---|
| Daily cast generation | ~2,000 | ~£0.003 |
| Cache seed run (1 game) | ~15,000 | ~£0.02 |
| Uncached player turn | ~1,500 | ~£0.002 |
| Cached player turn | 0 | £0 |

At 1,000 daily players, 15 turns avg, 60% cache hit rate after week 1:
- 1,000 × 15 × 0.4 uncached turns = 6,000 Anthropic calls/day
- ~£12/day, ~£360/month

At 10,000 players same assumptions: ~£120/day. That's where you need either a spend cap + graceful degradation, or monetisation.

---

## graceful degradation

When daily spend cap is hit, or Anthropic is slow:

1. Serve cached responses if available
2. If no cache entry exists, serve archetype-based pre-written fallbacks (not AI, but in-character)
3. Show a subtle "the group chat is being quiet" system message
4. Never show an error to the player

Pre-written fallbacks are a JSON file per archetype, seeded manually. Cheap insurance.

---

## environment variables

```
ANTHROPIC_API_KEY=
DATABASE_URL=
DAILY_SPEND_CAP_GBP=50
RATE_LIMIT_TURNS_PER_SESSION=40
RATE_LIMIT_SESSIONS_PER_HOUR=3
CAST_GENERATION_CRON="1 0 * * *"
```

---

## recommended stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite | Already written |
| API | Next.js API routes | One repo, easy Vercel deploy |
| Database | Supabase (Postgres) | Free tier, good DX, instant API |
| Cache | DB table (above) | Simple, queryable, no Redis needed at this scale |
| Hosting | Vercel | CDN included, zero config |
| Cron | Vercel Cron or GitHub Actions | Free at this scale |
| OG images | Vercel OG (@vercel/og) | Serverless, fast, free |

---

## what to build first (order)

1. `/api/cast` endpoint + daily cast cron + DB schema — this unblocks everything
2. Port existing frontend to fetch cast from API instead of using hardcoded characters
3. `/api/turn` endpoint with direct Anthropic proxy (no caching yet)
4. Add rate limiting
5. `/api/result` + result screen with shareable card
6. Add response cache layer to `/api/turn`
7. Pre-written fallbacks
8. OG image endpoint
