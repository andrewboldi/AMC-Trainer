# AMC Trainer Worker

Cloudflare Worker REST API backed by D1 (SQLite) serving AMC/AIME math competition problems.

## API Routes

### `GET /api/problem/random`

Get a random problem matching filters.

| Param | Required | Values | Default |
|-------|----------|--------|---------|
| `level` | Yes | `AMC_8`, `AMC_10`, `AMC_12`, `AIME`, `All` | — |
| `subject` | No | `algebra`, `geometry`, `combinatorics`, `number_theory` | any |
| `difficulty_min` | No | `1`-`10` | `1` |
| `difficulty_max` | No | `1`-`10` | `10` |

**Example:** `/api/problem/random?level=AMC_10&difficulty_min=4&difficulty_max=6`

### `GET /api/problem/:id`

Get a specific problem by ID.

### `GET /api/stats`

Get problem counts grouped by exam type and subject.

### `POST /api/problems/ingest`

Bulk upsert problems. Requires `X-API-Key` header.

**Body:** Array of problem objects with `year`, `exam_name`, `exam_base`, `variant`, `problem_num`, `subject`, `problem_html`, `solution_html`, `answer`.

## Difficulty Scale

Universal 1-10 scale with cross-exam overlaps:

| Difficulty | AMC 8 | AMC 10 | AMC 12 | AIME |
|---|---|---|---|---|
| 1 | #1-8 | | | |
| 2 | #9-16 | #1-5 | | |
| 3 | #17-21 | #6-10 | #1-5 | |
| 4 | #22-25 | #11-15 | #6-10 | |
| 5 | | #16-20 | #11-15 | |
| 6 | | #21-25 | #16-20 | #1-3 |
| 7 | | | #21-25 | #4-6 |
| 8 | | | | #7-9 |
| 9 | | | | #10-12 |
| 10 | | | | #13-15 |

## Setup

```bash
# Install dependencies
bun install

# Create the D1 database
bunx wrangler d1 create amc-problems
# Copy the database_id into wrangler.toml

# Apply schema
bunx wrangler d1 execute amc-problems --local --file=schema.sql

# Set ingest API key
bunx wrangler secret put INGEST_API_KEY

# Run locally
bun run dev

# Deploy
bun run deploy
```

## Migration

Populate D1 from existing HTML files:

```bash
python migrate.py \
  --problems-dir /path/to/amcProblems \
  --api-url http://localhost:8787 \
  --api-key YOUR_INGEST_KEY
```

## Tests

```bash
bun test
```
