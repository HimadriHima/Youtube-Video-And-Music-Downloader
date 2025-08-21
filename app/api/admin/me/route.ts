import { getSessionCookieName, parseCookieHeader, verifySessionToken } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
	const cookieHeader = request.headers.get('cookie');
	const cookies = parseCookieHeader(cookieHeader);
	const token = cookies[getSessionCookieName()];
	const authenticated = verifySessionToken(token);
	return Response.json({ authenticated });
}


