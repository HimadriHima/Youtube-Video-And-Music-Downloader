import fs from 'fs/promises';
import path from 'path';

const COOKIE_FILE = path.join(process.cwd(), 'cookie', 'cookie.txt');

function parseCookiesTxtToHeader(cookiesTxt: string): string {
	const cookieNameToValue: Record<string, string> = {};
	const lines = cookiesTxt.split(/\r?\n/);
	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;
		const parts = line.split(/\t+/);
		if (parts.length >= 7) {
			const name = parts[5];
			const value = parts.slice(6).join('\t');
			if (name) cookieNameToValue[name] = value;
			continue;
		}
		// Fallback: try space-separated
		const wsParts = line.split(/\s+/);
		if (wsParts.length >= 7) {
			const name = wsParts[5];
			const value = wsParts.slice(6).join(' ');
			if (name) cookieNameToValue[name] = value;
		}
	}
	const pairs = Object.entries(cookieNameToValue).map(([name, value]) => `${name}=${value}`);
	return pairs.join('; ');
}

export async function getStoredCookieHeader(): Promise<string | null> {
	try {
		const content = await fs.readFile(COOKIE_FILE, 'utf8');
		if (!content.trim()) return null;
		
		// If file looks like a Netscape cookies.txt, parse to header string
		if (content.includes('\t') || content.includes('Netscape')) {
			const header = parseCookiesTxtToHeader(content);
			return header || null;
		}
		
		// Otherwise treat as a cookie header string
		return content.trim();
	} catch {
		// Fallback to environment variable (for Vercel deployment)
		return process.env.YT_COOKIE_STORED || null;
	}
}


