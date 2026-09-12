/**
 * Regression tests for the bugs that let a single day of normal traffic burn
 * the entire D1 free-tier quota, and for the auth/ingest/CORS defects found
 * alongside it. Each test fails against the pre-fix worker.
 */
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { FakeD1, fakeCtx, installFakeCache, seedProblems } from './testHarness';
import worker, { parseFilter, matchesFilter, base64UrlToBytes, resetIndexCacheForTest } from './worker';

const env = (db: FakeD1) => ({ DB: db, INGEST_API_KEY: 'test-key', FIREBASE_PROJECT_ID: 'amc-trainer-firebase' }) as any;
const req = (path: string, init?: RequestInit) => new Request(`https://w.dev${path}`, init);

let db: FakeD1;
beforeEach(async () => {
	installFakeCache();
	db = new FakeD1();
	// The index cache is module state; without this it leaks between tests.
	await resetIndexCacheForTest();
});

describe('BUG 1: D1 row-read cost of /api/problem/random', () => {
	it('never issues a query that scans and sorts the table', async () => {
		seedProblems(db);
		const { ctx } = fakeCtx();
		await worker.fetch(req('/api/problem/random?level=All'), env(db), ctx);

		for (const q of db.queries) {
			expect(q).not.toContain('ORDER BY RANDOM()');
		}
	});

	it('fetches the chosen problem by primary key, not by filter scan', async () => {
		seedProblems(db);
		const { ctx } = fakeCtx();
		await worker.fetch(req('/api/problem/random?level=All'), env(db), ctx);

		const fetches = db.queries.filter((q) => q.includes('SELECT * FROM problems'));
		expect(fetches).toHaveLength(1);
		expect(fetches[0]).toBe('SELECT * FROM problems WHERE id = ?1');

		// A primary-key lookup must not need a temp B-tree sort.
		const plan = db.plan(fetches[0], [1]).join(' | ');
		expect(plan).not.toContain('TEMP B-TREE');
		expect(plan).toContain('SEARCH problems USING INTEGER PRIMARY KEY');
	});

	it('reads one problem row per request once the index is warm', async () => {
		seedProblems(db);
		const { ctx } = fakeCtx();
		const e = env(db);
		await worker.fetch(req('/api/problem/random?level=All'), e, ctx); // warms index
		db.queries = [];

		for (let i = 0; i < 20; i++) {
			await worker.fetch(req('/api/problem/random?level=All'), e, ctx);
		}
		// 20 requests => 20 single-row lookups, no index rebuild.
		expect(db.queries).toHaveLength(20);
		expect(db.queries.every((q) => q === 'SELECT * FROM problems WHERE id = ?1')).toBe(true);
	});

	it('a cold isolate reloads the index with one row read, not a table scan', async () => {
		seedProblems(db);
		const { ctx } = fakeCtx();
		const e = env(db);
		await worker.fetch(req('/api/problem/random?level=All'), e, ctx); // builds + persists index

		// Simulate a fresh isolate: module cache gone, persisted index row intact.
		await resetIndexCacheForTest();
		db.queries = [];
		await worker.fetch(req('/api/problem/random?level=All'), e, ctx);

		expect(db.queries).toEqual([
			'SELECT data FROM problem_index WHERE id = 1',
			'SELECT * FROM problems WHERE id = ?1',
		]);
		expect(db.queries.some((q) => q.includes('SELECT id, exam_base'))).toBe(false);
	});

	it('still serves problems if the problem_index migration has not been applied', async () => {
		seedProblems(db);
		db.db.exec('DROP TABLE problem_index');
		const { ctx } = fakeCtx();
		const res = await worker.fetch(req('/api/problem/random?level=All'), env(db), ctx);
		expect(res.status).toBe(200);
		expect((await res.json() as any).id).toBeGreaterThan(0);
	});

	it('/api/stats no longer runs table-scanning aggregates', async () => {
		seedProblems(db);
		const { ctx } = fakeCtx();
		const res = await worker.fetch(req('/api/stats'), env(db), ctx);
		expect(res.status).toBe(200);
		const body = (await res.json()) as any;
		expect(body.total).toBe(db.db.query('SELECT COUNT(*) c FROM problems').get<any>().c);
		expect(body.byExam.reduce((n: number, r: any) => n + r.count, 0)).toBe(body.total);
		for (const q of db.queries) expect(q).not.toContain('GROUP BY');
	});

	it('still honours every filter dimension', async () => {
		seedProblems(db);
		const { ctx } = fakeCtx();
		const e = env(db);
		for (let i = 0; i < 25; i++) {
			const res = await worker.fetch(
				req('/api/problem/random?level=AMC_10&subject=geometry&difficulty_min=3&difficulty_max=5&year_min=2010&year_max=2015'),
				e, ctx
			);
			expect(res.status).toBe(200);
			const p = (await res.json()) as any;
			expect(p.subject).toBe('geometry');
			expect(p.difficulty).toBeGreaterThanOrEqual(3);
			expect(p.difficulty).toBeLessThanOrEqual(5);
			expect(p.year).toBeGreaterThanOrEqual(2010);
			expect(p.year).toBeLessThanOrEqual(2015);
			expect(p.examName).toStartWith('AMC_10');
		}
	});

	it('selects across the whole candidate pool, not a fixed row', async () => {
		seedProblems(db);
		const { ctx } = fakeCtx();
		const e = env(db);
		const seen = new Set<number>();
		for (let i = 0; i < 60; i++) {
			const res = await worker.fetch(req('/api/problem/random?level=All'), e, ctx);
			seen.add(((await res.json()) as any).id);
		}
		expect(seen.size).toBeGreaterThan(20);
	});

	it('AMC_8 level still includes AJHSME problems', () => {
		const f = (parseFilter(new URL('https://w.dev/?level=AMC_8')) as any).filter;
		expect(matchesFilter([1, 'AJHSME', 'algebra', 2, 1990], f)).toBe(true);
		expect(matchesFilter([2, 'AMC_8', 'algebra', 2, 2010], f)).toBe(true);
		expect(matchesFilter([3, 'AMC_10', 'algebra', 2, 2010], f)).toBe(false);
	});
});

describe('BUG 5: numeric params', () => {
	it('rejects non-numeric difficulty instead of silently matching nothing', () => {
		const r = parseFilter(new URL('https://w.dev/?level=All&difficulty_min=abc')) as any;
		expect(r.error).toBeDefined();
	});

	it('rejects trailing-garbage numbers that parseInt would accept', () => {
		const r = parseFilter(new URL('https://w.dev/?level=All&difficulty_max=12abc')) as any;
		expect(r.error).toBeDefined();
	});

	it('rejects non-numeric year bounds', () => {
		const r = parseFilter(new URL('https://w.dev/?level=All&year_min=nope')) as any;
		expect(r.error).toBeDefined();
	});

	it('returns 400, not 404, for a bad difficulty', async () => {
		seedProblems(db);
		const { ctx } = fakeCtx();
		const res = await worker.fetch(req('/api/problem/random?level=All&difficulty_min=abc'), env(db), ctx);
		expect(res.status).toBe(400);
	});

	it('accepts valid bounds', () => {
		const r = parseFilter(new URL('https://w.dev/?level=All&difficulty_min=3&difficulty_max=7')) as any;
		expect(r.filter.diffMin).toBe(3);
		expect(r.filter.diffMax).toBe(7);
	});
});

describe('BUG 3: CORS', () => {
	it('allows the PUT + Authorization that /api/user/data requires', async () => {
		const { ctx } = fakeCtx();
		const res = await worker.fetch(req('/api/user/data', { method: 'OPTIONS' }), env(db), ctx);
		expect(res.headers.get('Access-Control-Allow-Methods')).toContain('PUT');
		expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
	});
});

describe('BUG 4: ingest preserves problem ids', () => {
	it('keeps ids and created_at stable when a problem is re-scraped', async () => {
		const { ctx } = fakeCtx();
		const e = env(db);
		const payload = [{
			year: 2024, exam_name: 'AMC_10A', exam_base: 'AMC_10', variant: null, problem_num: 1,
			subject: 'algebra', problem_html: '<p>v1</p>', solution_html: '<p>s1</p>', answer: 'A',
		}];
		const post = (body: unknown) => worker.fetch(
			req('/api/problems/ingest', { method: 'POST', headers: { 'X-API-Key': 'test-key', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
			e, ctx
		);

		await post(payload);
		const before = db.db.query('SELECT id, created_at FROM problems').get() as any;

		await post([{ ...payload[0], problem_html: '<p>v2 corrected</p>', answer: 'B' }]);
		const after = db.db.query('SELECT id, created_at, problem_html, answer FROM problems').get() as any;

		expect(after.id).toBe(before.id);
		expect(after.created_at).toBe(before.created_at);
		expect(after.problem_html).toBe('<p>v2 corrected</p>');
		expect(after.answer).toBe('B');
		expect(db.db.query('SELECT COUNT(*) c FROM problems').get() as any).toMatchObject({ c: 1 });
	});

	it('rejects ingest without the API key', async () => {
		const { ctx } = fakeCtx();
		const res = await worker.fetch(req('/api/problems/ingest', { method: 'POST', body: '[]' }), env(db), ctx);
		expect(res.status).toBe(401);
	});
});

describe('BUG 6: image proxy input handling', () => {
	it('returns 400 for a malformed percent-escape instead of throwing', async () => {
		const { ctx } = fakeCtx();
		const res = await worker.fetch(req('/?%'), env(db), ctx);
		expect(res.status).toBe(400);
	});

	it('still blocks non-allowlisted hosts', async () => {
		const { ctx } = fakeCtx();
		const res = await worker.fetch(req('/?' + encodeURIComponent('https://evil.example.com/x.png')), env(db), ctx);
		expect(res.status).toBe(403);
	});
});

describe('BUG 2: Firebase token verification', () => {
	const b64u = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
	const ISS = 'https://securetoken.google.com/amc-trainer-firebase';
	const KID = 'test-kid-1';
	const realFetch = globalThis.fetch;

	/** Stand up a real RSA keypair and serve its public half as Google's JWKS. */
	async function withStubbedJwks() {
		const pair = await crypto.subtle.generateKey(
			{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
			true, ['sign', 'verify']
		);
		const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
		globalThis.fetch = (async (url: any) =>
			String(url).includes('/jwk/')
				? new Response(JSON.stringify({ keys: [{ ...jwk, kid: KID, alg: 'RS256' }] }), { headers: { 'Cache-Control': 'max-age=3600' } })
				: realFetch(url)) as typeof fetch;
		return pair.privateKey;
	}

	async function signed(priv: CryptoKey, claims: Record<string, unknown>) {
		const head = b64u({ alg: 'RS256', kid: KID });
		const body = b64u(claims);
		const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', priv, new TextEncoder().encode(`${head}.${body}`));
		return `${head}.${body}.${Buffer.from(sig).toString('base64url')}`;
	}

	const call = (token: string) => {
		const { ctx } = fakeCtx();
		return worker.fetch(req('/api/user/data', { headers: { Authorization: `Bearer ${token}` } }), env(db), ctx);
	};

	afterEach(() => { globalThis.fetch = realFetch; });

	it('accepts a properly signed, unexpired token', async () => {
		const priv = await withStubbedJwks();
		const now = Math.floor(Date.now() / 1000);
		const res = await call(await signed(priv, { iss: ISS, aud: 'amc-trainer-firebase', exp: now + 3600, iat: now - 5, sub: 'real-user' }));
		expect(res.status).toBe(200);
		expect((await res.json() as any).uid).toBe('real-user');
	});

	it('rejects a forged signature even when the kid is a real published key id', async () => {
		await withStubbedJwks();
		const now = Math.floor(Date.now() / 1000);
		const forged = `${b64u({ alg: 'RS256', kid: KID })}.${b64u({ iss: ISS, aud: 'amc-trainer-firebase', exp: now + 9999, iat: now - 10, sub: 'VICTIM_UID' })}.made-up-signature`;
		expect((await call(forged)).status).toBe(401);
	});

	it('rejects a token whose payload was tampered with after signing', async () => {
		const priv = await withStubbedJwks();
		const now = Math.floor(Date.now() / 1000);
		const good = await signed(priv, { iss: ISS, aud: 'amc-trainer-firebase', exp: now + 3600, iat: now - 5, sub: 'real-user' });
		const [h, , sig] = good.split('.');
		const tampered = [h, b64u({ iss: ISS, aud: 'amc-trainer-firebase', exp: now + 3600, iat: now - 5, sub: 'VICTIM_UID' }), sig].join('.');
		expect((await call(tampered)).status).toBe(401);
	});

	it('rejects an alg=none downgrade', async () => {
		await withStubbedJwks();
		const now = Math.floor(Date.now() / 1000);
		expect((await call(`${b64u({ alg: 'none' })}.${b64u({ iss: ISS, aud: 'amc-trainer-firebase', exp: now + 9999, iat: now, sub: 'X' })}.`)).status).toBe(401);
	});

	it('rejects an expired but correctly signed token', async () => {
		const priv = await withStubbedJwks();
		const now = Math.floor(Date.now() / 1000);
		expect((await call(await signed(priv, { iss: ISS, aud: 'amc-trainer-firebase', exp: now - 60, iat: now - 3600, sub: 'real-user' }))).status).toBe(401);
	});

	it('rejects a correctly signed token issued for another Firebase project', async () => {
		const priv = await withStubbedJwks();
		const now = Math.floor(Date.now() / 1000);
		expect((await call(await signed(priv, { iss: 'https://securetoken.google.com/other-app', aud: 'other-app', exp: now + 3600, iat: now, sub: 'u' }))).status).toBe(401);
	});

	it('rejects a missing or malformed Authorization header', async () => {
		const { ctx } = fakeCtx();
		expect((await worker.fetch(req('/api/user/data'), env(db), ctx)).status).toBe(401);
		expect((await call('garbage')).status).toBe(401);
	});

	it('decodes base64url without padding correctly', () => {
		expect(new TextDecoder().decode(base64UrlToBytes(Buffer.from('{"a":1}').toString('base64url')))).toBe('{"a":1}');
	});
});

describe('unhandled errors do not leak as 1101s', () => {
	it('returns a JSON 500 when a handler throws', async () => {
		const broken = { DB: { prepare() { throw new Error('boom'); } }, INGEST_API_KEY: 'k' } as any;
		const { ctx } = fakeCtx();
		const res = await worker.fetch(req('/api/problem/random?level=All'), broken, ctx);
		expect(res.status).toBe(500);
		expect((await res.json() as any).error).toBe('Internal error');
	});
});
