/**
 * AMC Trainer API Worker
 *
 * REST API backed by Cloudflare D1 (SQLite) serving AMC/AIME math competition problems.
 *
 * Routes:
 *   GET  /api/problem/random  — random problem matching filters (level, subject, difficulty)
 *   GET  /api/problem/:id     — specific problem by ID
 *   GET  /api/stats           — problem counts by exam and subject
 *   POST /api/problems/ingest — bulk upsert (API-key protected)
 *
 * Environment bindings:
 *   DB             — D1 database
 *   INGEST_API_KEY — secret for ingest endpoint auth
 */

interface Env {
	DB: D1Database;
	INGEST_API_KEY: string;
	FIREBASE_PROJECT_ID: string;
}

interface ProblemRow {
	id: number;
	year: number;
	exam_name: string;
	exam_base: string;
	variant: string | null;
	problem_num: number;
	subject: string | null;
	difficulty: number;
	problem_html: string;
	solution_html: string;
	answer: string;
}

interface ProblemResponse {
	id: number;
	year: number;
	examName: string;
	problemNum: number;
	subject: string | null;
	difficulty: number;
	problemHtml: string;
	solutionHtml: string;
	answer: string;
}

const VALID_LEVELS = ['AMC_8', 'AMC_10', 'AMC_12', 'AIME', 'All'] as const;
const VALID_SUBJECTS = ['algebra', 'geometry', 'combinatorics', 'number_theory'] as const;

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
};

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
	});
}

function error(message: string, status: number): Response {
	return json({ error: message }, status);
}

function formatRow(row: ProblemRow): ProblemResponse {
	return {
		id: row.id,
		year: row.year,
		examName: row.exam_name,
		problemNum: row.problem_num,
		subject: row.subject,
		difficulty: row.difficulty,
		problemHtml: row.problem_html,
		solutionHtml: row.solution_html,
		answer: row.answer,
	};
}

/**
 * Compute universal difficulty (1-10) from exam type and problem number.
 *
 * Scale is designed so the same number means roughly the same challenge
 * regardless of exam. Overlaps are intentional:
 *   AMC 10 hard (#21-25, diff 6) ≈ AMC 12 med-hard (#16-20, diff 6) ≈ AIME easy (#1-3, diff 6)
 */
export function computeDifficulty(examBase: string, problemNum: number): number {
	switch (examBase) {
		case 'AMC_8':
		case 'AJHSME':
			if (problemNum <= 8) return 1;
			if (problemNum <= 16) return 2;
			if (problemNum <= 21) return 3;
			return 4;
		case 'AMC_10':
			if (problemNum <= 5) return 2;
			if (problemNum <= 10) return 3;
			if (problemNum <= 15) return 4;
			if (problemNum <= 20) return 5;
			return 6;
		case 'AMC_12':
			if (problemNum <= 5) return 3;
			if (problemNum <= 10) return 4;
			if (problemNum <= 15) return 5;
			if (problemNum <= 20) return 6;
			return 7;
		case 'AIME':
			if (problemNum <= 3) return 6;
			if (problemNum <= 6) return 7;
			if (problemNum <= 9) return 8;
			if (problemNum <= 12) return 9;
			return 10;
		default:
			return 5;
	}
}

/**
 * Compact problem index — one entry per problem holding only the filterable
 * columns, as a tuple to keep the serialized form small.
 *
 * Picking a random row with `ORDER BY RANDOM()` forces SQLite to scan every
 * matching row into a temp B-tree and sort it, and D1 bills rows *scanned*,
 * not returned. That cost ~4.6k rows read per problem served, which exhausts
 * the daily free-tier quota in roughly a thousand problem loads. Keeping this
 * index hot instead lets us filter in memory and read exactly one row by
 * primary key.
 */
type IndexEntry = [id: number, examBase: string, subject: string | null, difficulty: number, year: number];

const INDEX_TTL_SECONDS = 3600;

let indexCache: { entries: IndexEntry[]; expires: number } | null = null;

/** Clear the in-isolate index cache. Test hook for simulating a cold start. */
export async function resetIndexCacheForTest(): Promise<void> {
	indexCache = null;
}

/** Read every problem's filterable columns. Costs a full table scan — callers must be rare. */
async function scanProblemIndex(env: Env): Promise<IndexEntry[]> {
	const { results } = await env.DB.prepare(
		'SELECT id, exam_base, subject, difficulty, year FROM problems'
	).all<{ id: number; exam_base: string; subject: string | null; difficulty: number; year: number }>();
	return results.map((r) => [r.id, r.exam_base, r.subject, r.difficulty, r.year]);
}

/** Rebuild the persisted index row from the problems table. */
export async function rebuildProblemIndex(env: Env): Promise<IndexEntry[]> {
	const entries = await scanProblemIndex(env);
	await env.DB.prepare(
		`INSERT INTO problem_index (id, data, updated_at) VALUES (1, ?1, datetime('now'))
		 ON CONFLICT(id) DO UPDATE SET data = ?1, updated_at = datetime('now')`
	).bind(JSON.stringify(entries)).run();
	indexCache = { entries, expires: Date.now() + INDEX_TTL_SECONDS * 1000 };
	return entries;
}

/**
 * Load the problem index: isolate memory first, then the single persisted row
 * (one row read), rebuilding from a scan only when that row is missing.
 *
 * Deliberately not backed by the Cache API — cache operations are only
 * functional on custom domains, and this Worker serves from workers.dev, where
 * they would silently no-op and send every cold isolate back to a full scan.
 */
async function loadProblemIndex(env: Env): Promise<IndexEntry[]> {
	const now = Date.now();
	if (indexCache && indexCache.expires > now) return indexCache.entries;

	try {
		const row = await env.DB.prepare('SELECT data FROM problem_index WHERE id = 1').first<{ data: string }>();
		if (row) {
			const entries = JSON.parse(row.data) as IndexEntry[];
			indexCache = { entries, expires: now + INDEX_TTL_SECONDS * 1000 };
			return entries;
		}
		return await rebuildProblemIndex(env);
	} catch (e) {
		// Most likely the 0002 migration has not been applied to this database yet.
		// Serve correctly off a scan rather than failing every request.
		console.error('problem_index unavailable, falling back to full scan:', e);
		const entries = await scanProblemIndex(env);
		indexCache = { entries, expires: now + INDEX_TTL_SECONDS * 1000 };
		return entries;
	}
}

export interface ProblemFilter {
	levels: string[];
	isAll: boolean;
	subject: string | null;
	diffMin: number;
	diffMax: number;
	yearMin: number;
	yearMax: number;
}

/**
 * Parse an integer query param. Rejects anything non-integral — `parseInt`
 * turns "abc" into NaN, which silently slips past every range comparison.
 */
function intParam(url: URL, name: string, fallback: number): number | null {
	const raw = url.searchParams.get(name);
	if (raw === null || raw === '') return fallback;
	const n = Number(raw);
	return Number.isInteger(n) ? n : null;
}

/** Parse and validate the filter query params shared by the random endpoint. */
export function parseFilter(url: URL): { filter: ProblemFilter } | { error: string } {
	const levelParam = url.searchParams.get('level');
	if (!levelParam) {
		return { error: 'Missing "level" param. Valid: AMC_8, AMC_10, AMC_12, AIME, All (comma-separated)' };
	}

	const levels = levelParam.split(',').map((s) => s.trim());
	for (const l of levels) {
		if (!VALID_LEVELS.includes(l as typeof VALID_LEVELS[number])) {
			return { error: `Invalid level "${l}". Valid: AMC_8, AMC_10, AMC_12, AIME, All` };
		}
	}

	const subject = url.searchParams.get('subject');
	if (subject && !VALID_SUBJECTS.includes(subject as typeof VALID_SUBJECTS[number])) {
		return { error: 'Invalid "subject" param. Valid: algebra, geometry, combinatorics, number_theory' };
	}

	const diffMin = intParam(url, 'difficulty_min', 1);
	const diffMax = intParam(url, 'difficulty_max', 10);
	if (diffMin === null || diffMax === null || diffMin < 1 || diffMax > 10 || diffMin > diffMax) {
		return { error: 'difficulty_min/difficulty_max must be integers 1-10 with min <= max' };
	}

	const yearMin = intParam(url, 'year_min', 1900);
	const yearMax = intParam(url, 'year_max', 2099);
	if (yearMin === null || yearMax === null || yearMin > yearMax) {
		return { error: 'year_min/year_max must be integers with min <= max' };
	}

	return { filter: { levels, isAll: levels.includes('All'), subject, diffMin, diffMax, yearMin, yearMax } };
}

/** Does an index entry satisfy the filter? Mirrors the old SQL WHERE clause. */
export function matchesFilter(entry: IndexEntry, f: ProblemFilter): boolean {
	const [, examBase, subject, difficulty, year] = entry;
	if (difficulty < f.diffMin || difficulty > f.diffMax) return false;
	if (year < f.yearMin || year > f.yearMax) return false;
	if (f.subject !== null && subject !== f.subject) return false;
	if (f.isAll) return true;
	return f.levels.some((l) => (l === 'AMC_8' ? examBase === 'AMC_8' || examBase === 'AJHSME' : examBase === l));
}

/** GET /api/problem/random?level=AMC_10,AMC_12&subject=geometry&difficulty_min=3&difficulty_max=7 */
async function handleRandomProblem(url: URL, env: Env): Promise<Response> {
	const parsed = parseFilter(url);
	if ('error' in parsed) return error(parsed.error, 400);

	const index = await loadProblemIndex(env);
	const candidates = index.filter((e) => matchesFilter(e, parsed.filter));
	if (candidates.length === 0) return error('No problems found matching filters', 404);

	const pickedId = candidates[Math.floor(Math.random() * candidates.length)][0];
	const result = await env.DB.prepare('SELECT * FROM problems WHERE id = ?1')
		.bind(pickedId)
		.first<ProblemRow>();

	// An index entry with no matching row means the index is stale; rebuild it so
	// the next request selects from reality.
	if (!result) {
		await rebuildProblemIndex(env);
		return error('No problems found matching filters', 404);
	}

	return json(formatRow(result));
}

/** GET /api/problem/:id */
async function handleGetProblem(id: string, env: Env): Promise<Response> {
	const numId = parseInt(id, 10);
	if (isNaN(numId)) {
		return error('Invalid problem ID', 400);
	}

	const result = await env.DB.prepare('SELECT * FROM problems WHERE id = ?1')
		.bind(numId)
		.first<ProblemRow>();

	if (!result) {
		return error('Problem not found', 404);
	}

	return json(formatRow(result));
}

/**
 * GET /api/stats — counts by exam and subject.
 *
 * Derived from the problem index rather than three GROUP BY/COUNT aggregates,
 * which each scanned the whole table (~13.7k rows read per public hit).
 */
async function handleStats(env: Env): Promise<Response> {
	const index = await loadProblemIndex(env);

	const examCounts = new Map<string, number>();
	const subjectCounts = new Map<string, number>();
	for (const [, examBase, subject] of index) {
		examCounts.set(examBase, (examCounts.get(examBase) ?? 0) + 1);
		const key = subject ?? 'untagged';
		subjectCounts.set(key, (subjectCounts.get(key) ?? 0) + 1);
	}

	const sorted = (m: Map<string, number>, key: string) =>
		[...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, count]) => ({ [key]: k, count }));

	return json({
		total: index.length,
		byExam: sorted(examCounts, 'exam_base'),
		bySubject: sorted(subjectCounts, 'subject'),
	});
}

/** POST /api/problems/ingest — bulk upsert, API-key protected */
async function handleIngest(request: Request, env: Env): Promise<Response> {
	const apiKey = request.headers.get('X-API-Key');
	if (!apiKey || apiKey !== env.INGEST_API_KEY) {
		return error('Unauthorized', 401);
	}

	const body = await request.json() as Array<{
		year: number;
		exam_name: string;
		exam_base: string;
		variant: string | null;
		problem_num: number;
		subject: string | null;
		problem_html: string;
		solution_html: string;
		answer: string;
	}>;

	if (!Array.isArray(body) || body.length === 0) {
		return error('Body must be a non-empty array of problem objects', 400);
	}

	// ON CONFLICT ... DO UPDATE rather than INSERT OR REPLACE: REPLACE deletes the
	// existing row and reinserts it, handing the problem a brand-new AUTOINCREMENT
	// id. Saved problems, bookmarks and missed-problem lists all reference these
	// ids, so a re-scrape used to silently repoint them at unrelated problems.
	const stmt = env.DB.prepare(
		`INSERT INTO problems
		 (year, exam_name, exam_base, variant, problem_num, subject, difficulty, problem_html, solution_html, answer, updated_at)
		 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, datetime('now'))
		 ON CONFLICT(year, exam_name, problem_num) DO UPDATE SET
		   exam_base = ?3, variant = ?4, subject = ?6, difficulty = ?7,
		   problem_html = ?8, solution_html = ?9, answer = ?10, updated_at = datetime('now')`
	);

	const batch = body.map((p) =>
		stmt.bind(
			p.year,
			p.exam_name,
			p.exam_base,
			p.variant,
			p.problem_num,
			p.subject,
			computeDifficulty(p.exam_base, p.problem_num),
			p.problem_html,
			p.solution_html,
			p.answer
		)
	);

	const results = await env.DB.batch(batch);
	// Rebuild eagerly so newly ingested problems are immediately selectable. A
	// failure here must not report the ingest itself as failed.
	try {
		await rebuildProblemIndex(env);
	} catch (e) {
		console.error('problem_index rebuild after ingest failed:', e);
		indexCache = null;
	}

	return json({ inserted: results.length });
}

/** Legacy image proxy — forwards requests to external URLs (AoPS diagrams, etc.) */
const ALLOWED_PROXY_HOSTS = ['latex.artofproblemsolving.com', 'artofproblemsolving.com', 'wiki-images.artofproblemsolving.com'];

async function handleImageProxy(url: URL, request: Request): Promise<Response> {
	// decodeURIComponent throws on malformed escapes (e.g. "/?%"), so it has to
	// sit inside the try alongside URL parsing.
	let targetUrl: string;
	try {
		targetUrl = decodeURIComponent(url.search.slice(1));
		if (!targetUrl.startsWith('https://')) {
			return error('Invalid proxy URL', 400);
		}
		const parsed = new URL(targetUrl);
		if (!ALLOWED_PROXY_HOSTS.includes(parsed.hostname)) {
			return error('Proxy domain not allowed', 403);
		}
	} catch {
		return error('Invalid proxy URL', 400);
	}

	const response = await fetch(targetUrl, {
		headers: { 'User-Agent': 'AMC-Trainer-Proxy/2.0' },
	});

	const headers = new Headers(response.headers);
	headers.delete('Set-Cookie');
	headers.set('Access-Control-Allow-Origin', '*');
	headers.set('Cache-Control', response.ok ? 'public, max-age=86400' : 'no-store');

	return new Response(response.body, {
		status: response.status,
		headers,
	});
}

/**
 * Google's Firebase token signing keys, in JWK form.
 *
 * The x509 endpoint returns PEM certificates, which `crypto.subtle.importKey`
 * cannot load ('raw' is not a valid format for RSA keys, so the import always
 * threw). The JWK endpoint imports natively, which is what makes real
 * signature verification possible here.
 */
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let jwksCache: { keys: Record<string, JsonWebKey>; expires: number } | null = null;

async function getSigningKeys(): Promise<Record<string, JsonWebKey>> {
	const now = Date.now();
	if (jwksCache && jwksCache.expires > now) return jwksCache.keys;

	const res = await fetch(JWKS_URL);
	if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
	const body = (await res.json()) as { keys: Array<JsonWebKey & { kid: string }> };

	const keys: Record<string, JsonWebKey> = {};
	for (const k of body.keys) keys[k.kid] = k;

	const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('Cache-Control') ?? '')?.[1] ?? 3600);
	jwksCache = { keys, expires: now + maxAge * 1000 };
	return keys;
}

export function base64UrlToBytes(input: string): Uint8Array {
	const b64 = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
	return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

/**
 * Verify a Firebase ID token and return its uid.
 *
 * Checks the RS256 signature against Google's published keys before reading any
 * claim. Fails closed: a token that cannot be verified is rejected outright.
 */
async function verifyFirebaseToken(token: string, projectId: string): Promise<string | null> {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const [headerB64, payloadB64, signatureB64] = parts;

		const header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(headerB64)));
		if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;

		const jwk = (await getSigningKeys())[header.kid];
		if (!jwk) return null;

		const key = await crypto.subtle.importKey(
			'jwk',
			jwk,
			{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
			false,
			['verify']
		);

		const signed = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
		const valid = await crypto.subtle.verify(
			'RSASSA-PKCS1-v1_5',
			key,
			base64UrlToBytes(signatureB64),
			signed
		);
		if (!valid) return null;

		const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64)));
		const now = Math.floor(Date.now() / 1000);
		if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
		if (payload.aud !== projectId) return null;
		if (typeof payload.exp !== 'number' || payload.exp <= now) return null;
		if (typeof payload.iat !== 'number' || payload.iat > now + 60) return null;
		if (typeof payload.sub !== 'string' || payload.sub === '') return null;

		return payload.sub;
	} catch {
		return null;
	}
}

/** Extract and verify UID from Authorization header */
async function getAuthUid(request: Request, env: Env): Promise<string | null> {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader?.startsWith('Bearer ')) return null;
	const token = authHeader.slice(7);
	const projectId = env.FIREBASE_PROJECT_ID || 'amc-trainer-firebase';
	return verifyFirebaseToken(token, projectId);
}

/** GET /api/user/data */
async function handleGetUserData(request: Request, env: Env): Promise<Response> {
	const uid = await getAuthUid(request, env);
	if (!uid) return error('Unauthorized', 401);

	const row = await env.DB.prepare('SELECT * FROM user_data WHERE uid = ?1').bind(uid).first<{
		uid: string; display_name: string | null; settings_json: string | null;
		stats_json: string | null; missed_ids_json: string | null; bookmarks_json: string | null;
		updated_at: string;
	}>();

	if (!row) {
		return json({ uid, settings: null, stats: null, missedIds: null, bookmarks: null, updatedAt: null });
	}

	return json({
		uid: row.uid,
		settings: row.settings_json ? JSON.parse(row.settings_json) : null,
		stats: row.stats_json ? JSON.parse(row.stats_json) : null,
		missedIds: row.missed_ids_json ? JSON.parse(row.missed_ids_json) : null,
		bookmarks: row.bookmarks_json ? JSON.parse(row.bookmarks_json) : null,
		updatedAt: row.updated_at,
	});
}

/** PUT /api/user/data */
async function handlePutUserData(request: Request, env: Env): Promise<Response> {
	const uid = await getAuthUid(request, env);
	if (!uid) return error('Unauthorized', 401);

	const body = await request.json() as {
		displayName?: string;
		settings?: unknown;
		stats?: unknown;
		missedIds?: unknown;
		bookmarks?: unknown;
	};

	await env.DB.prepare(`
		INSERT INTO user_data (uid, display_name, settings_json, stats_json, missed_ids_json, bookmarks_json, updated_at)
		VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))
		ON CONFLICT(uid) DO UPDATE SET
			display_name = ?2,
			settings_json = ?3,
			stats_json = ?4,
			missed_ids_json = ?5,
			bookmarks_json = ?6,
			updated_at = datetime('now')
	`).bind(
		uid,
		body.displayName ?? null,
		body.settings ? JSON.stringify(body.settings) : null,
		body.stats ? JSON.stringify(body.stats) : null,
		body.missedIds ? JSON.stringify(body.missedIds) : null,
		body.bookmarks ? JSON.stringify(body.bookmarks) : null,
	).run();

	return json({ ok: true });
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		try {
			return await route(request, env);
		} catch (e) {
			console.error('Unhandled error:', e);
			return error('Internal error', 500);
		}
	},
};

async function route(request: Request, env: Env): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}

		const url = new URL(request.url);
		const path = url.pathname;

		// Route matching
		if (request.method === 'GET' && path === '/api/problem/random') {
			return handleRandomProblem(url, env);
		}

		const problemMatch = path.match(/^\/api\/problem\/(\d+)$/);
		if (request.method === 'GET' && problemMatch) {
			return handleGetProblem(problemMatch[1], env);
		}

		if (request.method === 'GET' && path === '/api/stats') {
			return handleStats(env);
		}

		if (request.method === 'POST' && path === '/api/problems/ingest') {
			return handleIngest(request, env);
		}

		if (request.method === 'GET' && path === '/api/user/data') {
			return handleGetUserData(request, env);
		}

		if (request.method === 'PUT' && path === '/api/user/data') {
			return handlePutUserData(request, env);
		}

		// Legacy CORS proxy for images (diagrams, Asymptote renders) still
		// referenced in stored HTML as ?https://...
		if (request.method === 'GET' && url.search.startsWith('?')) {
			return handleImageProxy(url, request);
		}

		return error('Not found', 404);
}
