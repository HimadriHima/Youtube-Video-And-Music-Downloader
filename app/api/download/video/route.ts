import ytdl from '@distube/ytdl-core';
import sanitize from 'sanitize-filename';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const url = searchParams.get('url') || '';
		if (!url || !ytdl.validateURL(url)) {
			return new Response('Invalid URL', { status: 400 });
		}

		const headers: Record<string, string> = {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
			'Accept-Language': 'en-US,en;q=0.9',
			'Referer': 'https://www.youtube.com/',
			'Origin': 'https://www.youtube.com'
		};
		if (process.env.YT_COOKIE) headers['Cookie'] = process.env.YT_COOKIE;
		const info = await ytdl.getInfo(url, { requestOptions: { headers } } as any);
		const title = sanitize(info.videoDetails.title || 'video') || 'video';

		// Prefer MP4 with audio+video
		const mp4Formats = info.formats.filter((f: any) => f.container === 'mp4' && f.hasAudio && f.hasVideo);
		const selected = mp4Formats.length > 0 ? ytdl.chooseFormat(mp4Formats, { quality: 'highest' }) : ytdl.chooseFormat(info.formats, { quality: 'highest' });

		const nodeReadable = ytdl.downloadFromInfo(info, { format: selected, requestOptions: { headers } } as any);

		const { readable, writable } = new TransformStream();
		const writer = writable.getWriter();
		nodeReadable.on('data', (chunk: any) => writer.write(chunk));
		nodeReadable.on('end', () => { try { writer.close(); } catch {} });
		nodeReadable.on('error', (err: any) => { try { writer.abort(err); } catch {} });

		const responseHeaders = new Headers();
		responseHeaders.set('Content-Type', 'video/mp4');
		const asciiFallback = sanitize((title || 'video').replace(/[^\x20-\x7E]/g, '')) || 'video';
		const utf8Encoded = encodeURIComponent(`${title}.mp4`);
		responseHeaders.set('Content-Disposition', `attachment; filename="${asciiFallback}.mp4"; filename*=UTF-8''${utf8Encoded}`);

		return new Response(readable as any, { headers: responseHeaders });
	} catch (err: any) {
		return new Response(err?.message || 'Failed to download', { status: 500 });
	}
}


