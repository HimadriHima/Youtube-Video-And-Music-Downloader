import crypto from 'node:crypto';

const SESSION_COOKIE_NAME = 'admin_session';

function getEnv(name: string): string | undefined {
	const v = process.env[name];
	return v && String(v);
}

export function getAdminPassword(): string | null {
	return getEnv('ADMIN_PASSWORD') || null;
}

export function getSessionSecret(): string {
	return getEnv('ADMIN_SECRET') || getEnv('ADMIN_PASSWORD') || 'default-insecure-secret-change-me';
}

export function getSessionCookieName(): string { return SESSION_COOKIE_NAME; }

type TokenPayload = { iat: number; exp: number; v: number };

function hmacSHA256(secret: string, data: string): string {
	return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

export function createSessionToken(daysValid: number = 7): string {
	const now = Math.floor(Date.now() / 1000);
	const payload: TokenPayload = { iat: now, exp: now + daysValid * 24 * 60 * 60, v: 1 };
	const json = JSON.stringify(payload);
	const base = Buffer.from(json, 'utf8').toString('base64url');
	const sig = hmacSHA256(getSessionSecret(), base);
	return `${base}.${sig}`;
}

export function verifySessionToken(token: string | null | undefined): boolean {
	if (!token) return false;
	const parts = token.split('.');
	if (parts.length !== 2) return false;
	const [base, sig] = parts;
	const expected = hmacSHA256(getSessionSecret(), base);
	if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
	try {
		const json = Buffer.from(base, 'base64url').toString('utf8');
		const payload = JSON.parse(json) as TokenPayload;
		if (typeof payload.exp !== 'number') return false;
		const now = Math.floor(Date.now() / 1000);
		return now < payload.exp;
	} catch {
		return false;
	}
}

export function buildSessionSetCookieHeader(token: string): string {
	const isProd = process.env.NODE_ENV === 'production';
	const attrs = [
		`${SESSION_COOKIE_NAME}=${token}`,
		'Path=/',
		'HttpOnly',
		'SameSite=Lax'
	];
	if (isProd) attrs.push('Secure');
	// 7 days
	const maxAge = 7 * 24 * 60 * 60;
	attrs.push(`Max-Age=${maxAge}`);
	return attrs.join('; ');
}

export function buildSessionClearCookieHeader(): string {
	const attrs = [
		`${SESSION_COOKIE_NAME}=deleted`,
		'Path=/',
		'HttpOnly',
		'SameSite=Lax',
		'Max-Age=0'
	];
	if (process.env.NODE_ENV === 'production') attrs.push('Secure');
	return attrs.join('; ');
}

export function parseCookieHeader(cookieHeader: string | null | undefined): Record<string, string> {
	const map: Record<string, string> = {};
	if (!cookieHeader) return map;
	cookieHeader.split(';').forEach(part => {
		const idx = part.indexOf('=');
		if (idx === -1) return;
		const name = part.slice(0, idx).trim();
		const value = part.slice(idx + 1).trim();
		if (name) map[name] = value;
	});
	return map;
}


