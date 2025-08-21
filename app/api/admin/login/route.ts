import { buildSessionSetCookieHeader, createSessionToken, getAdminPassword } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
	const body = await request.json().catch(() => ({}));
	const password = String(body?.password || '');
	const configured = getAdminPassword();
	if (!configured) return new Response('Server not configured with ADMIN_PASSWORD', { status: 500 });
	if (password !== configured) return new Response('Invalid password', { status: 401 });
	const token = createSessionToken(7);
	const headers = new Headers();
	headers.append('Set-Cookie', buildSessionSetCookieHeader(token));
	return new Response(JSON.stringify({ ok: true }), { headers });
}


