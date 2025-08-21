import { buildSessionClearCookieHeader } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
	const headers = new Headers();
	headers.append('Set-Cookie', buildSessionClearCookieHeader());
	return new Response(JSON.stringify({ ok: true }), { headers });
}


