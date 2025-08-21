import ytdl from '@distube/ytdl-core';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const url = searchParams.get('url') || '';
		if (!url || !ytdl.validateURL(url)) {
			return new Response(JSON.stringify({ error: 'Invalid YouTube URL' }), { status: 400 });
		}
		const headers: Record<string, string> = {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
			'Accept-Language': 'en-US,en;q=0.9',
			'Referer': 'https://www.youtube.com/',
			'Origin': 'https://www.youtube.com'
		};
		if (process.env.YT_COOKIE) headers['Cookie'] = process.env.YT_COOKIE;
		const info = await ytdl.getInfo(url, { requestOptions: { headers } } as any);
		const videoDetails = info.videoDetails;
		const thumbnail = videoDetails.thumbnails?.[videoDetails.thumbnails.length - 1]?.url || '';
		return Response.json({
			title: videoDetails.title,
			durationSeconds: Number(videoDetails.lengthSeconds || 0),
			thumbnailUrl: thumbnail
		});
	} catch (err: any) {
		console.error('GET /api/info error:', err);
		return new Response(JSON.stringify({ error: err?.message || 'Failed to fetch info' }), { status: 500 });
	}
}


