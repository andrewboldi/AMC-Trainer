/**
 * Cleans the raw response from the CORS proxy.
 * The proxy returns content with Python-style string artifacts.
 */
function cleanHtml(raw: string): string {
	return raw
		.replaceAll("\\n'", '\n')
		.replaceAll('\\n', '\n')
		.replaceAll("b'", '');
}

/**
 * Extracts the answer string from the proxy response.
 * Format is: b'X' where X is the answer (a letter or 3-digit number).
 */
function extractAnswer(raw: string): string {
	const match = raw.match(/b'([^']+)'/);
	return match ? match[1] : raw.trim();
}

async function fetchText(url: string): Promise<string> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status}`);
	}
	return response.text();
}

export async function fetchProblem(url: string): Promise<string> {
	const raw = await fetchText(url);
	return cleanHtml(raw);
}

export async function fetchSolution(url: string): Promise<string> {
	const raw = await fetchText(url);
	return cleanHtml(raw);
}

export async function fetchAnswer(url: string): Promise<string> {
	const raw = await fetchText(url);
	return extractAnswer(raw);
}
