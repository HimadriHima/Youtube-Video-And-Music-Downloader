import fs from 'fs/promises';
import path from 'path';

function getPersistentDataDir(): string {
	const platform = process.platform;
	let base: string | undefined;
	if (platform === 'win32') base = process.env.APPDATA || process.env.LOCALAPPDATA || undefined;
	else if (platform === 'darwin') base = process.env.HOME ? path.join(process.env.HOME, 'Library', 'Application Support') : undefined;
	else base = process.env.XDG_DATA_HOME || (process.env.HOME ? path.join(process.env.HOME, '.local', 'share') : undefined);
	return base ? path.join(base, 'yt-downloader') : path.join(process.cwd(), '.data');
}

const DATA_DIR = getPersistentDataDir();
const COOKIE_FILE = path.join(DATA_DIR, 'yt_cookie.txt');
const LEGACY_DIR = path.join(process.cwd(), '.data');
const LEGACY_COOKIE_FILE = path.join(LEGACY_DIR, 'yt_cookie.txt');

function ensureDirectoryExists(directoryPath: string): Promise<void> {
	return fs.mkdir(directoryPath, { recursive: true }).then(() => {});
}

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
		let content: string;
		try {
			content = await fs.readFile(COOKIE_FILE, 'utf8');
		} catch {
			// Attempt legacy migration
			try {
				const legacy = await fs.readFile(LEGACY_COOKIE_FILE, 'utf8');
				if (legacy && legacy.trim()) {
					await ensureDirectoryExists(DATA_DIR);
					await fs.writeFile(COOKIE_FILE, legacy, 'utf8');
					content = legacy;
				} else {
					throw new Error('No legacy cookie');
				}
			} catch {
				return null;
			}
		}
		if (!content.trim()) return null;
		// If file looks like a Netscape cookies.txt, parse to header string
		if (content.includes('\t') || content.includes('Netscape')) {
			const header = parseCookiesTxtToHeader(content);
			return header || null;
		}
		return content.trim();
	} catch {
		return null;
	}
}

export async function saveCookieFromHeader(cookieHeader: string): Promise<void> {
	const header = (cookieHeader || '').trim();
	if (!header) throw new Error('Cookie header is empty');
	await ensureDirectoryExists(DATA_DIR);
	await fs.writeFile(COOKIE_FILE, header, 'utf8');
}

export async function saveCookieFromCookiesTxt(cookiesTxt: string): Promise<void> {
	const header = parseCookiesTxtToHeader(cookiesTxt || '');
	if (!header) throw new Error('Parsed cookies.txt is empty or invalid');
	await ensureDirectoryExists(DATA_DIR);
	await fs.writeFile(COOKIE_FILE, header, 'utf8');
}

export async function deleteStoredCookie(): Promise<void> {
	try {
		await fs.unlink(COOKIE_FILE);
	} catch {
		// ignore if it doesn't exist
	}
}

export async function getCookieFileInfo(): Promise<{ exists: boolean; mtimeMs?: number }> {
	try {
		const stats = await fs.stat(COOKIE_FILE);
		return { exists: true, mtimeMs: stats.mtimeMs };
	} catch {
		return { exists: false };
	}
}


