# AMC Trainer

Random problem trainer for AMC 8, AMC 10, AMC 12, and AIME math competitions.

## Architecture

**Frontend:** SvelteKit static site (adapter-static) deployed to GitHub Pages from `main` branch. Pushes go live immediately.

**Backend:** Cloudflare Worker (`worker/`) with D1 (SQLite) database. REST API serving problems, solutions, and answers.

**Data Ingestion:** Python scraper (`worker/scraper.py`) fetches problems from the AoPS wiki, parses HTML, extracts answers, and POSTs batches to the worker's `/api/problems/ingest` endpoint (API-key protected).

## Key Directories

```
src/
  lib/
    components/    # Svelte 5 components (runes: $state, $derived, $effect, $props)
    stores/        # Svelte writable stores (settings, problem, streak, stats)
    services/      # API client (aopsClient.ts), answer validation
    types/         # TypeScript interfaces and type aliases
  routes/
    +page.svelte   # Landing page
    play/          # Main trainer page
    +layout.svelte # App shell (background gradient, CSS vars)
  app.css          # Global styles
worker/
  src/worker.ts    # Cloudflare Worker API
  scraper.py       # Python ingestion script
  wrangler.toml    # Worker config
static/img/        # SVG icons and logo variants
```

## Data Flow

1. User clicks Next -> `loadNewProblem()` in `stores/problem.ts`
2. Calls `fetchRandomProblem()` in `services/aopsClient.ts`
3. Hits `GET /api/problem/random?level=...&subject=...` on the CF Worker
4. Worker queries D1, returns JSON with problem HTML, solution HTML, answer
5. Frontend renders HTML directly, runs KaTeX for LaTeX, proxies AoPS images

## Conventions

- **Package manager:** bun (not npm)
- **Framework:** Svelte 5 with runes ($state, $props, $derived, $effect)
- **Styling:** Global CSS in app.css, scoped CSS in components
- **Settings:** All user preferences stored in localStorage via `stores/settings.ts`
- **CSS variables:** `--bg-color-1`, `--bg-color-2`, `--text-color`, `--text-invert` set on the app div in +layout.svelte
- **Deploy:** `git push` to main triggers GitHub Pages build

## API Endpoints (Worker)

- `GET /api/problem/random?level=&subject=&difficulty_min=&difficulty_max=` - Random problem
- `GET /api/problem/:id` - Specific problem by ID
- `GET /api/stats` - Problem count by exam and subject
- `POST /api/problems/ingest` - Bulk upsert (API-key required)
- `GET /api/image-proxy?<url>` - CORS proxy for AoPS images (restricted to AoPS domains)
