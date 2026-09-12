/**
 * Minimal D1 / Cache / ExecutionContext stand-ins backed by real SQLite, so the
 * worker's actual SQL runs in tests rather than being asserted as strings.
 */
import { Database } from 'bun:sqlite';
import { readFileSync } from 'node:fs';

export class FakeD1 {
	db: Database;
	queries: string[] = [];

	constructor() {
		this.db = new Database(':memory:');
		this.db.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
		this.db.exec(readFileSync(new URL('../migrations/0001_add_user_data.sql', import.meta.url), 'utf8'));
		this.db.exec(readFileSync(new URL('../migrations/0002_add_problem_index.sql', import.meta.url), 'utf8'));
	}

	/** D1 uses ?1-style params; bun:sqlite wants ?N positional too, so pass through. */
	prepare(sql: string): any {
		const self = this;
		const make = (params: unknown[]): any => ({
			bind: (...p: unknown[]) => make(p),
			first: async () => {
				self.queries.push(sql);
				return self.db.query(sql).get(...(params as any[])) ?? null;
			},
			all: async () => {
				self.queries.push(sql);
				return { results: self.db.query(sql).all(...(params as any[])), meta: {} };
			},
			run: async () => {
				self.queries.push(sql);
				self.db.query(sql).run(...(params as any[]));
				return { meta: {} };
			},
			__sql: sql,
			__params: params,
		});
		return make([]);
	}

	async batch(stmts: any[]): Promise<any[]> {
		return stmts.map((s) => {
			this.queries.push(s.__sql);
			this.db.query(s.__sql).run(...(s.__params as any[]));
			return { meta: {} };
		});
	}

	/** Query plan for a statement — used to assert we never full-scan + sort. */
	plan(sql: string, params: unknown[] = []): string[] {
		return this.db.query(`EXPLAIN QUERY PLAN ${sql}`).all(...(params as any[])).map((r: any) => r.detail);
	}
}

export function fakeCtx() {
	const pending: Promise<unknown>[] = [];
	return {
		ctx: { waitUntil: (p: Promise<unknown>) => pending.push(p), passThroughOnException: () => {} } as any,
		settled: () => Promise.all(pending),
	};
}

/** In-memory stand-in for the Workers Cache API. */
export function installFakeCache() {
	const store = new Map<string, { body: string; headers: Record<string, string> }>();
	(globalThis as any).caches = {
		default: {
			async match(key: string) {
				const hit = store.get(key);
				return hit ? new Response(hit.body, { headers: hit.headers }) : undefined;
			},
			async put(key: string, res: Response) {
				store.set(key, { body: await res.clone().text(), headers: Object.fromEntries(res.headers) });
			},
			async delete(key: string) {
				return store.delete(key);
			},
		},
	};
	return store;
}

export function seedProblems(d1: FakeD1) {
	const EXAMS: [string, number, number, number, string][] = [
		['AJHSME', 1985, 1998, 25, 'AJHSME'],
		['AMC_8', 1999, 2026, 25, 'AMC_8'],
		['AMC_10A', 2002, 2025, 25, 'AMC_10'],
		['AMC_12A', 2002, 2025, 25, 'AMC_12'],
		['AIME_I', 2000, 2025, 15, 'AIME'],
	];
	const subjects = ['algebra', 'geometry', 'combinatorics', 'number_theory'];
	const ins = d1.db.prepare(
		`INSERT INTO problems (year, exam_name, exam_base, variant, problem_num, subject, difficulty, problem_html, solution_html, answer)
		 VALUES (?, ?, ?, NULL, ?, ?, ?, '<p>p</p>', '<p>s</p>', 'A')`
	);
	let n = 0;
	for (const [name, y0, y1, count, base] of EXAMS) {
		for (let y = y0; y <= y1; y++) {
			for (let p = 1; p <= count; p++) {
				ins.run(y, name, base, p, subjects[n % 4], (n % 10) + 1);
				n++;
			}
		}
	}
	return n;
}
