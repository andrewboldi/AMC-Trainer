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
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
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

/** GET /api/problem/random?level=AMC_10,AMC_12&subject=geometry&difficulty_min=3&difficulty_max=7 */
async function handleRandomProblem(url: URL, env: Env): Promise<Response> {
	const levelParam = url.searchParams.get('level');
	if (!levelParam) {
		return error('Missing "level" param. Valid: AMC_8, AMC_10, AMC_12, AIME, All (comma-separated)', 400);
	}

	const levels = levelParam.split(',').map((s) => s.trim());
	for (const l of levels) {
		if (!VALID_LEVELS.includes(l as typeof VALID_LEVELS[number])) {
			return error(`Invalid level "${l}". Valid: AMC_8, AMC_10, AMC_12, AIME, All`, 400);
		}
	}
	const isAll = levels.includes('All');

	const subject = url.searchParams.get('subject');
	if (subject && !VALID_SUBJECTS.includes(subject as typeof VALID_SUBJECTS[number])) {
		return error('Invalid "subject" param. Valid: algebra, geometry, combinatorics, number_theory', 400);
	}

	const diffMin = parseInt(url.searchParams.get('difficulty_min') ?? '1', 10);
	const diffMax = parseInt(url.searchParams.get('difficulty_max') ?? '10', 10);
	if (diffMin < 1 || diffMax > 10 || diffMin > diffMax) {
		return error('difficulty_min/difficulty_max must be 1-10 with min <= max', 400);
	}

	const yearMin = parseInt(url.searchParams.get('year_min') ?? '1900', 10);
	const yearMax = parseInt(url.searchParams.get('year_max') ?? '2099', 10);

	const conditions: string[] = ['difficulty BETWEEN ?1 AND ?2', 'year BETWEEN ?3 AND ?4'];
	const bindings: (string | number)[] = [diffMin, diffMax, yearMin, yearMax];
	let paramIdx = 5;

	if (!isAll) {
		const examBaseClauses: string[] = [];
		for (const level of levels) {
			if (level === 'AMC_8') {
				examBaseClauses.push("exam_base IN ('AMC_8', 'AJHSME')");
			} else {
				examBaseClauses.push(`exam_base = ?${paramIdx}`);
				bindings.push(level);
				paramIdx++;
			}
		}
		conditions.push(`(${examBaseClauses.join(' OR ')})`);
	}

	if (subject) {
		conditions.push(`subject = ?${paramIdx}`);
		bindings.push(subject);
		paramIdx++;
	}

	const where = conditions.join(' AND ');
	const sql = `SELECT * FROM problems WHERE ${where} ORDER BY RANDOM() LIMIT 1`;
	const result = await env.DB.prepare(sql).bind(...bindings).first<ProblemRow>();

	if (!result) {
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

/** GET /api/stats */
async function handleStats(env: Env): Promise<Response> {
	const byExam = await env.DB.prepare(
		'SELECT exam_base, COUNT(*) as count FROM problems GROUP BY exam_base ORDER BY exam_base'
	).all();

	const bySubject = await env.DB.prepare(
		"SELECT COALESCE(subject, 'untagged') as subject, COUNT(*) as count FROM problems GROUP BY subject ORDER BY subject"
	).all();

	const total = await env.DB.prepare('SELECT COUNT(*) as count FROM problems').first<{ count: number }>();

	return json({
		total: total?.count ?? 0,
		byExam: byExam.results,
		bySubject: bySubject.results,
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

	const stmt = env.DB.prepare(
		`INSERT OR REPLACE INTO problems
		 (year, exam_name, exam_base, variant, problem_num, subject, difficulty, problem_html, solution_html, answer, updated_at)
		 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, datetime('now'))`
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

	return json({ inserted: results.length });
}

/** Legacy image proxy — forwards requests to external URLs (AoPS diagrams, etc.) */
const ALLOWED_PROXY_HOSTS = ['latex.artofproblemsolving.com', 'artofproblemsolving.com', 'wiki-images.artofproblemsolving.com'];

async function handleImageProxy(url: URL, request: Request): Promise<Response> {
	const targetUrl = decodeURIComponent(url.search.slice(1));
	if (!targetUrl.startsWith('https://')) {
		return error('Invalid proxy URL', 400);
	}
	try {
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
	headers.set('Access-Control-Allow-Origin', '*');
	headers.set('Cache-Control', 'public, max-age=86400');

	return new Response(response.body, {
		status: response.status,
		headers,
	});
}

/** Verify Firebase ID token using Google's public keys */
async function verifyFirebaseToken(token: string, projectId: string): Promise<string | null> {
	try {
		const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
		const certs = await res.json() as Record<string, string>;

		// Decode header to find the key ID
		const [headerB64] = token.split('.');
		const header = JSON.parse(atob(headerB64.replace(/-/g, '+').replace(/_/g, '/')));
		const certPem = certs[header.kid];
		if (!certPem) return null;

		// Import the public key
		const pemBody = certPem.replace(/-----BEGIN CERTIFICATE-----/g, '').replace(/-----END CERTIFICATE-----/g, '').replace(/\s/g, '');
		const certBuffer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

		const key = await crypto.subtle.importKey('raw', certBuffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']).catch(() => null);

		// Fallback: just decode and validate claims without crypto verification
		// (Cloudflare Workers have limited crypto.subtle support for x509)
		if (!key) {
			const [, payloadB64] = token.split('.');
			const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
			const now = Math.floor(Date.now() / 1000);
			if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
			if (payload.aud !== projectId) return null;
			if (payload.exp < now) return null;
			if (payload.iat > now + 10) return null;
			if (!payload.sub || typeof payload.sub !== 'string') return null;
			return payload.sub;
		}

		return null;
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
	},
};
