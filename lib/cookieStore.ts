import fs from 'fs/promises';
import path from 'path';

function isVercel(): boolean {
	return Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
}

function getPersistentDataDir(): string {
	const platform = process.platform;
	let base: string | undefined;
	if (platform === 'win32') base = process.env.APPDATA || process.env.LOCALAPPDATA || undefined;
	else if (platform === 'darwin') base = process.env.HOME ? path.join(process.env.HOME, 'Library', 'Application Support') : undefined;
	else base = process.env.XDG_DATA_HOME || (process.env.HOME ? path.join(process.env.HOME, '.local', 'share') : undefined);
	return base ? path.join(base, 'yt-downloader') : path.join(process.cwd(), '.data');
}

const VERCELL_COOKIE_ENV = 'YT_COOKIE_STORED';

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
	// For Vercel, use environment variable
	if (isVercel()) {
		return process.env[VERCELL_COOKIE_ENV] || null;
	}

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
	
	// For Vercel, we can't persist to filesystem, so we'll use a different approach
	if (isVercel()) {
		// In Vercel, we can only store in memory for the current request
		// The cookie will be lost after the request ends, but this allows the current request to work
		// For persistent storage on Vercel, you'd need a database or external storage service
		throw new Error('Cookie persistence not supported on Vercel. Use environment variable YT_COOKIE_STORED instead.');
	}
	
	await ensureDirectoryExists(DATA_DIR);
	await fs.writeFile(COOKIE_FILE, header, 'utf8');
}

export async function saveCookieFromCookiesTxt(cookiesTxt: string): Promise<void> {
	const header = parseCookiesTxtToHeader(cookiesTxt || '');
	if (!header) throw new Error('Parsed cookies.txt is empty or invalid');
	
	// For Vercel, we can't persist to filesystem
	if (isVercel()) {
		throw new Error('Cookie persistence not supported on Vercel. Use environment variable YT_COOKIE_STORED instead.');
	}
	
	await ensureDirectoryExists(DATA_DIR);
	await fs.writeFile(COOKIE_FILE, header, 'utf8');
}

export async function deleteStoredCookie(): Promise<void> {
	// For Vercel, we can't modify environment variables at runtime
	if (isVercel()) {
		throw new Error('Cookie deletion not supported on Vercel. Remove YT_COOKIE_STORED environment variable instead.');
	}
	
	try {
		await fs.unlink(COOKIE_FILE);
	} catch {
		// ignore if it doesn't exist
	}
}

export async function getCookieFileInfo(): Promise<{ exists: boolean; mtimeMs?: number }> {
	// For Vercel, check environment variable
	if (isVercel()) {
		return { exists: Boolean(process.env[VERCELL_COOKIE_ENV]), mtimeMs: Date.now() };
	}

	try {
		const stats = await fs.stat(COOKIE_FILE);
		return { exists: true, mtimeMs: stats.mtimeMs };
	} catch {
		return { exists: false };
	}
}


