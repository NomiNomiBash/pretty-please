# Pretty Please

A WhatsApp-style game about the quiet misery of organising plans in London (default). React + Vite SPA; LLM turns and daily cast come from serverless routes on Vercel in production.

For deeper design and API detail, see **[architecture.md](./architecture.md)**.

---

## Prerequisites

- **Node 18+** (or current LTS)
- **npm**
- **Anthropic API key** for real turns ([console.anthropic.com](https://console.anthropic.com))

---

## Local development

```bash
npm install
cp .env.example .env
# Put your key in .env — see “Environment variables” below
npm run dev
```

**How API calls work in dev**

- By default the app does **not** use `/api/*` in dev. It uses bundled `editions/*.json` when present, otherwise a **seeded procedural** cast, and sends turns **from the browser** via `VITE_ANTHROPIC_API_KEY`.
- To exercise the same **server routes** as production locally, set in `.env`:
  - `VITE_USE_API_ROUTES=true`
  - Run a dev server that serves `api/` (e.g. `vercel dev` from this directory), **or** point your build at a deployed preview and use that origin — the client will call `/api/cast` and `/api/turn` on whatever host serves the app.

Production builds (`npm run build`) use **`/api/*` on the same origin** — no Anthropic key in the client.

---

## Deploy to Vercel

You can ship in **either** of these ways (both produce the same kind of deployment).

### Option A — Git-connected (recommended)

Best if you want **automatic deploys** when you push.

1. Push this app to **GitHub** (or GitLab / Bitbucket).  
   - If this folder lives **inside** a larger repo (e.g. `monorepo/pretty-please`), that’s fine; see **Root Directory** below.
2. In [vercel.com](https://vercel.com): **Add New… → Project → Import** your repository.
3. **Root Directory:** set to the folder that contains this `package.json` (e.g. `pretty-please`). If the repo root *is* the app, leave blank / `.`.
4. Vercel should detect **Vite**; build is **`npm run build`** and output **`dist`** (also set in [`vercel.json`](./vercel.json)).
5. Add **environment variables** (Project → Settings → Environment Variables) — at least **`ANTHROPIC_API_KEY`** for Production (and Preview if you want previews to run real turns). See the table below.
6. **Deploy.** Every push to your production branch (usually `main`) triggers a new production deploy; pull requests get **Preview** URLs.

### Option B — Vercel CLI (from your laptop)

Useful for quick deploys without pushing, or before Git is set up.

```bash
npm install          # if you haven’t
npm run build        # sanity check; Vercel will build again on deploy

npx vercel login     # opens browser / token — do this once
cd /path/to/pretty-please
vercel link          # link to an existing Vercel project or create one
```

Set secrets on the project (dashboard **or** CLI):

```bash
vercel env add ANTHROPIC_API_KEY
```

Then production:

```bash
npm run deploy
# same as: vercel --prod
```

If the CLI says the token is invalid, run **`vercel login`** again.

---

## Environment variables

| Variable | Where to set | Purpose |
|----------|----------------|--------|
| **`ANTHROPIC_API_KEY`** | **Vercel → Production** (required for live game) | Server-only key for `POST /api/turn`. |
| `GEOAPIFY_API_KEY` | Vercel (optional) | `GET /api/places` autocomplete. |
| `RATE_LIMIT_TURN_PER_HOUR` | Vercel (optional) | Default `80`. |
| `RATE_LIMIT_CAST_PER_HOUR` | Vercel (optional) | Default `5`. |
| `RATE_LIMIT_DISABLED` | Vercel (optional) | `true` disables rate limits (e.g. debugging). |
| **`VITE_ANTHROPIC_API_KEY`** | **Local `.env` only** | Used when **not** using API routes in dev (`gameApi.js`). **Do not** rely on this for production — production uses the server key above. |
| `VITE_USE_API_ROUTES` | Local `.env` | Set to `true` to call `/api/*` from the dev app (see Local development). |

---

## After deploy

- Open the **Production URL** Vercel shows you; the SPA and `/api/cast` should be on the **same origin** (no CORS setup needed for those routes).
- If turns fail with **500**, check Vercel **Functions** logs for `/api/turn` — usually missing or invalid `ANTHROPIC_API_KEY`.

---

## Authored daily editions (optional)

To override the procedural cast for a given UTC calendar day, add:

`editions/YYYY-MM-DD.json`

Commit and deploy (or push, if Git-connected). Vite also bundles these for offline dev fallback — see `architecture.md`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run deploy` | `vercel --prod` (CLI deploy) |

---

## License

MIT
