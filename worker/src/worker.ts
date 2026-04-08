interface Env {
	GITHUB_TOKEN: string;
	IP_DATA: KVNamespace;
}

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/cbracketdash/amcProblems/main';

const PREFIX_TO_PATH: Record<string, string> = {
	'!': 'problems',
	'$': 'solutions',
	'|': 'answers'
};

function stripHeaders(request: Request): Record<string, string> {
	const headers: Record<string, string> = {};
	for (const [key, value] of request.headers.entries()) {
		if (
			!key.match(/^origin/) &&
			!key.match(/eferer/) &&
			!key.match(/^cf-/) &&
			!key.match(/^x-forw/) &&
			!key.match(/^x-cors-headers/)
		) {
			headers[key] = value;
		}
	}
	return headers;
}

async function logIp(env: Env, ip: string | null): Promise<void> {
	if (!ip) return;
	try {
		const current = await env.IP_DATA.get(ip);
		const entry = (current ?? '') + ';' + Date.now().toString();
		await env.IP_DATA.put(ip, entry);
	} catch (e) {
		console.error('IP logging failed:', e);
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const isOptions = request.method === 'OPTIONS';

		if (!url.search.startsWith('?')) {
			return new Response('Bad request', { status: 400 });
		}

		const fetchUrl = decodeURIComponent(decodeURIComponent(url.search.slice(1)));
		const ip = request.headers.get('CF-Connecting-IP');
		ctx.waitUntil(logIp(env, ip));

		const prefix = fetchUrl[0];
		const path = PREFIX_TO_PATH[prefix];

		if (!path) {
			return new Response('Unknown prefix', { status: 400 });
		}

		const filename = fetchUrl.replaceAll(prefix, '');
		const githubUrl = `${GITHUB_RAW_BASE}/${path}/${filename}`;

		const headers = stripHeaders(request);
		headers['Authorization'] = `token ${env.GITHUB_TOKEN}`;

		const response = await fetch(githubUrl, { headers });
		const responseHeaders = new Headers(response.headers);

		if (isOptions) {
			return new Response(null, { status: 200, headers: responseHeaders });
		}

		const body = await response.arrayBuffer();
		return new Response(body, {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders
		});
	}
};
