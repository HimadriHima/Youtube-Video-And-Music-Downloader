import { deleteStoredCookie, getCookieFileInfo, getStoredCookieHeader, saveCookieFromCookiesTxt, saveCookieFromHeader } from '../../../../lib/cookieStore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
	const [header, info] = await Promise.all([
		getStoredCookieHeader(),
		getCookieFileInfo()
	]);
	return Response.json({
		hasCookie: Boolean(header),
		lastUpdatedMs: info.mtimeMs || null,
		// Avoid returning the cookie value directly for safety
	});
}

export async function POST(request: Request) {
	try {
		const contentType = request.headers.get('content-type') || '';
		if (contentType.includes('application/json')) {
			const body = await request.json();
			const cookieHeader: string | undefined = body.cookieHeader;
			const cookiesTxt: string | undefined = body.cookiesTxt;
			if (cookieHeader && typeof cookieHeader === 'string') {
				await saveCookieFromHeader(cookieHeader);
			} else if (cookiesTxt && typeof cookiesTxt === 'string') {
				await saveCookieFromCookiesTxt(cookiesTxt);
			} else {
				return new Response('Provide cookieHeader or cookiesTxt', { status: 400 });
			}
			return Response.json({ ok: true });
		}
		// Support simple text uploads as cookies.txt
		const text = await request.text();
		if (!text.trim()) return new Response('Empty body', { status: 400 });
		// Heuristics: if it looks like cookies.txt layout, parse accordingly; otherwise treat as header
		if (text.includes('\t') || text.toLowerCase().includes('netscape')) {
			await saveCookieFromCookiesTxt(text);
		} else {
			await saveCookieFromHeader(text);
		}
		return Response.json({ ok: true });
	} catch (err: any) {
		return new Response(err?.message || 'Failed to save cookie', { status: 400 });
	}
}

export async function DELETE() {
	await deleteStoredCookie();
	return Response.json({ ok: true });
}


